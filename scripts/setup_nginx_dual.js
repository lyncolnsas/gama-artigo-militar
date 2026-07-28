import { Client } from 'ssh2';

const conn = new Client();

console.log('🔧 Atualizando Nginx para proxy_pass http://127.0.0.1:3001 (elimina erro 502)...');

conn.on('ready', () => {
  const nginxFixScript = `
    set -e

    echo "=== 1. CRIANDO CONFIGURAÇÃO DUAL NGINX COM 127.0.0.1:3001 ==="
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
        proxy_pass http://127.0.0.1:3001;
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
        proxy_pass http://127.0.0.1:3001;
    }
}

# Servidor HTTPS (Porta 443 SSL)
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
        proxy_pass http://127.0.0.1:3001;
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
        proxy_pass http://127.0.0.1:3001;
    }
}
EOF

    echo "=== 2. GARANTINDO QUE PM2 BACKEND ESTÁ ATIVO ==="
    pm2 restart gama-store-backend || pm2 start /var/www/gama-artigo-militar/src/server.js --name gama-store-backend
    pm2 save

    echo "=== 3. TESTANDO NGINX E REINICIANDO ==="
    nginx -t
    systemctl restart nginx || service nginx restart

    echo "=== CONFIGURAÇÃO DUAL HTTP/HTTPS NGINX COM 127.0.0.1 APLICADA COM SUCESSO! ==="
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
