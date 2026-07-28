import { Client } from 'ssh2';

const conn = new Client();

console.log('🔍 Lendo logs do PM2 na VPS gamaartigomilitar.com...');

conn.on('ready', () => {
  const logScript = `
    echo "=== PM2 STATUS ==="
    pm2 status

    echo "=== PM2 ERROR LOGS (ÚLTIMAS 50 LINHAS) ==="
    tail -n 50 /root/.pm2/logs/gama-store-backend-error-0.log 2>/dev/null || pm2 logs gama-store-backend --err --lines 50 --raw || true

    echo "=== PM2 OUT LOGS (ÚLTIMAS 50 LINHAS) ==="
    tail -n 50 /root/.pm2/logs/gama-store-backend-out-0.log 2>/dev/null || pm2 logs gama-store-backend --lines 50 --raw || true
  `;

  conn.exec(logScript, (err, stream) => {
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
