import { Client } from 'ssh2';

const conn = new Client();

console.log('🔍 Investigando causa do 502 Bad Gateway no PM2...');

conn.on('ready', () => {
  const debugScript = `
    echo "=== 1. PM2 STATUS ==="
    pm2 status

    echo "=== 2. PM2 LOGS DE ERRO (ÚLTIMAS 100 LINHAS) ==="
    tail -n 100 /root/.pm2/logs/gama-store-backend-error-0.log 2>/dev/null || pm2 logs gama-store-backend --err --lines 50 --raw || true

    echo "=== 3. PM2 LOGS SAÍDA PADRÃO ==="
    tail -n 50 /root/.pm2/logs/gama-store-backend-out-0.log 2>/dev/null || true

    echo "=== 4. TESTE DE CONEXÃO PORTA 3001 ==="
    curl -i http://localhost:3001/api/health || true
  `;

  conn.exec(debugScript, (err, stream) => {
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
