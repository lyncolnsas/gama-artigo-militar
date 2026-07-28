import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  // Write a temp script and run it
  const tempScript = `
cat > /tmp/check_users.mjs << 'ENDOFSCRIPT'
import { PrismaClient } from '/var/www/gama-artigo-militar/node_modules/@prisma/client/default.js';
const prisma = new PrismaClient({ datasources: { db: { url: 'file:/var/www/gama-artigo-militar/prisma/dev.db' } } });
const users = await prisma.user.findMany();
console.log('=== Total usuarios:', users.length, '===');
for (const u of users) {
  console.log('ID:', u.id);
  console.log('Email:', JSON.stringify(u.email));
  console.log('Role:', u.role);
  console.log('---');
}
await prisma.$disconnect();
ENDOFSCRIPT
node /tmp/check_users.mjs 2>&1 || echo "ESM falhou, tentando CJS..."
`;

  conn.exec(tempScript, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d.toString()))
      .on('stderr', d => process.stderr.write(d.toString()));
  });
}).on('error', err => console.error(err))
  .connect({ host: 'gamaartigomilitar.com', port: 22, username: 'root', password: 'HeuryGam1985@' });
