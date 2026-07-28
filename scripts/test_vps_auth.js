import { Client } from 'ssh2';

const conn = new Client();

console.log('🔍 Testando login diretamente na VPS...');

conn.on('ready', () => {
  const authTestScript = `
    echo "=== 1. TESTE HTTP DIRECT BACKEND (PORT 3001) ==="
    curl -i -X POST http://127.0.0.1:3001/api/auth/login \\
      -H "Content-Type: application/json" \\
      -d '{"email":"admin@gamaartigomilitar.com","password":"22101844bc"}' || true

    echo "=== 2. TESTE NGINX PUBLIC REVERSE PROXY ==="
    curl -i -X POST http://localhost/api/auth/login \\
      -H "Content-Type: application/json" \\
      -d '{"email":"admin@gamaartigomilitar.com","password":"22101844bc"}' || true
  `;

  conn.exec(authTestScript, (err, stream) => {
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
