import { Client } from 'ssh2';

const conn = new Client();

console.log('🔧 Aplicando configuração unificada Nginx HTTP + HTTPS (SSL) na VPS...');

conn.on('ready', () => {
  const nginxFixScript = `
    set -e

    echo "=== 1. VERIFICANDO CERTIFICADOS LET'S ENCRYPT ==="
    if [ ! -f "/etc/letsencrypt/live/gamaartigomilitar.com/fullchain.pem" ]; then
      echo "⚡ Gerando certificado SSL Let's Encrypt com certbot..."
      certbot --nginx -d gamaartigomilitar.com -d www.gamaartigomilitar.com --non-interactive --agree-tos --email contato@gamaartigomilitar.com || true
    fi

    echo "=== 2. CRIANDO CONFIGURAÇÃO DUAL HTTP (80) & HTTPS (443) COM TRY_FILES ==="
    cat << 'EOF' > /etc/nginx/sites-available/gamaartigomilitar
# Servidor HTTP (Porta 80)
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

# Servidor HTTPS (Porta 443 SSL)
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name gamaartigomilitar.com www.gamaartigomilitar.com;

    ssl_certificate /etc/letsencrypt/live/gamaartigomilitar.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gamaartigomilitar.com/privkey.pem;

    # Otimizações de SSL
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

    echo "=== 3. VINCULANDO SITES-ENABLED E REINICIANDO NGINX ==="
    rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/gamaartigomilitar
    ln -sf /etc/nginx/sites-available/gamaartigomilitar /etc/nginx/sites-enabled/gamaartigomilitar

    nginx -t
    systemctl restart nginx || service nginx restart

    echo "=== CONFIGURAÇÃO DUAL HTTP/HTTPS NGINX APLICADA COM SUCESSO! ==="
  `;

  conn.exec(nginxFixScript, (err, stream) => {
    if (err) {
      console.error('❌ Erro SSH:', err);
      conn.end();
      return;
    }
    stream.on('close', (code) => {
      console.log(`\n🏁 Concluído com código: ${code}`);
      conn.end();
    })
    .on('data', (d) => process.stdout.write(d.toString()))
    .on('stderr', (d) => process.stderr.write(d.toString()));
  });
}).on('error', (err) => {
  console.error('❌ Erro de Conexão:', err);
}).connect({
  host: 'gamaartigomilitar.com',
  port: 22,
  username: 'root',
  password: 'HeuryGam1985@'
});
