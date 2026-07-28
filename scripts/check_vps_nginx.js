import { Client } from 'ssh2';

const conn = new Client();

console.log('🔍 Inspecionando configuração do Nginx na VPS gamaartigomilitar.com...');

conn.on('ready', () => {
  const nginxScript = `
    echo "=== /etc/nginx/sites-available/gamaartigomilitar ==="
    cat /etc/nginx/sites-available/gamaartigomilitar || true

    echo "=== SITES ENABLED ==="
    ls -la /etc/nginx/sites-enabled/ || true

    echo "=== TESTE DE SINTAXE NGINX ==="
    nginx -t || true
  `;

  conn.exec(nginxScript, (err, stream) => {
    if (err) {
      console.error('❌ Erro SSH:', err);
      conn.end();
      return;
    }
    stream.on('close', () => conn.end())
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
