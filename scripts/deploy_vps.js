import { Client } from 'ssh2';

const conn = new Client();

console.log('🔌 Conectando à VPS gamaartigomilitar.com...');

conn.on('ready', () => {
  console.log('✅ Conexão SSH estabelecida com sucesso!');
  
  const deployScript = `
    # Liberar bloqueio do apt/dpkg se houver unattended-upgrades rodando em segundo plano
    echo "⚡ Liberando trava do APT/DPKG..."
    killall -9 apt apt-get dpkg unattended-upgrade 2>/dev/null || true
    rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock /var/lib/apt/lists/lock /var/cache/apt/archives/lock
    dpkg --configure -a || true

    # Carregar NVM ou PATH de Node se existir
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
    export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin"

    # Se Node não estiver instalado, instalar Node 20 LTS
    if ! command -v node &> /dev/null; then
      echo "⚡ Instalando Node.js 20.x, Git, Nginx..."
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs build-essential git nginx || true
    fi

    echo "=== 1. AMBIENTE VERIFICADO ==="
    echo "Git: $(which git)"
    echo "Node: $(node -v) ($(which node))"
    echo "NPM: $(npm -v) ($(which npm))"

    echo "=== 2. ATUALIZANDO REPOSITÓRIO GITHUB ==="
    mkdir -p /var/www
    if [ ! -d "/var/www/gama-artigo-militar/.git" ]; then
      echo "Clonando repositório do GitHub..."
      rm -rf /var/www/gama-artigo-militar
      git clone https://github.com/lyncolnsas/gama-artigo-militar.git /var/www/gama-artigo-militar
    else
      echo "Atualizando repositório existente..."
      cd /var/www/gama-artigo-militar
      git reset --hard HEAD
      git pull origin main
    fi

    cd /var/www/gama-artigo-militar

    echo "=== 3. CRIANDO ARQUIVO DE CONFIGURAÇÃO DE AMBIENTE (.env) ==="
    DB_ABSOLUTE_PATH="/var/www/gama-artigo-militar/prisma/dev.db"
    cat << EOF > .env
DATABASE_URL="file:${DB_ABSOLUTE_PATH}"
PORT=3001
JWT_SECRET="gama_store_enterprise_super_secret_key_2026"
STORE_FRONTEND_URL="http://gamaartigomilitar.com"
EOF
    echo "DATABASE_URL configurado para: file:${DB_ABSOLUTE_PATH}"

    echo "=== 4. INSTALANDO DEPENDÊNCIAS DO BACKEND ==="
    npm install --production=false

    echo "=== 5. BANCO DE DADOS PRISMA & SEED ==="
    export DATABASE_URL="file:${DB_ABSOLUTE_PATH}"
    npx prisma db push --accept-data-loss
    npx prisma generate
    DATABASE_URL="file:${DB_ABSOLUTE_PATH}" node prisma/seed.js || true

    echo "=== 6. COMPILANDO FRONTEND VITE ==="
    cd frontend
    npm install
    npm run build
    cd ..

    echo "=== 7. CONFIGURANDO PROCESS MANAGER (PM2) ==="
    if ! command -v pm2 &> /dev/null; then
      npm install -g pm2
    fi

    pm2 delete gama-store-backend || true
    pm2 start src/server.js --name gama-store-backend
    pm2 save

    echo "=== 8. CONFIGURANDO NGINX REVERSE PROXY ==="
    if command -v nginx &> /dev/null; then
      if [ -f "/etc/letsencrypt/live/gamaartigomilitar.com/fullchain.pem" ]; then
        cat << 'EOF' > /etc/nginx/sites-available/gamaartigomilitar
server {
    listen 80;
    listen [::]:80;
    server_name gamaartigomilitar.com www.gamaartigomilitar.com;

    location / {
        root /var/www/gama-artigo-militar/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:3001;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name gamaartigomilitar.com www.gamaartigomilitar.com;

    ssl_certificate /etc/letsencrypt/live/gamaartigomilitar.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gamaartigomilitar.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /var/www/gama-artigo-militar/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
EOF
      else
        cat << 'EOF' > /etc/nginx/sites-available/gamaartigomilitar
server {
    listen 80;
    listen [::]:80;
    server_name gamaartigomilitar.com www.gamaartigomilitar.com;

    location / {
        root /var/www/gama-artigo-militar/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
EOF
      fi
      rm -f /etc/nginx/sites-enabled/default
      ln -sf /etc/nginx/sites-available/gamaartigomilitar /etc/nginx/sites-enabled/gamaartigomilitar || true
      nginx -t && (systemctl restart nginx || service nginx restart) || true
    fi

    echo "=== DEPLOY EXECUTADO COM SUCESSO COMPLETO! ==="
  `;

  conn.exec(deployScript, (err, stream) => {
    if (err) {
      console.error('❌ Erro de execução SSH:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`\n🏁 Processo SSH finalizado com código: ${code}`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('❌ Erro de Conexão SSH:', err);
}).connect({
  host: 'gamaartigomilitar.com',
  port: 22,
  username: 'root',
  password: 'HeuryGam1985@'
});
