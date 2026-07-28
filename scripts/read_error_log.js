import { Client } from 'ssh2';

const conn = new Client();

console.log('🔍 Lendo erro exato do Node.js backend...');

conn.on('ready', () => {
  const logScript = `
    echo "=== ULTIMAS 40 LINHAS DO ARQUIVO DE ERRO DA PM2 ==="
    cat /root/.pm2/logs/gama-store-backend-error.log | tail -n 40 || true

    echo "=== ULTIMAS 40 LINHAS DO ARQUIVO DE OUT DA PM2 ==="
    cat /root/.pm2/logs/gama-store-backend-out.log | tail -n 40 || true
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
