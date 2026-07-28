import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import pino from 'pino';

async function testBaileys() {
  console.log('Testing Baileys connection...');
  try {
    const { version } = await fetchLatestBaileysVersion();
    console.log('Baileys version fetched:', version);

    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys_test');

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('Connection update received:', { connection, hasQr: !!qr });
      if (qr) {
        console.log('QR Code Generated:');
        qrcodeTerminal.generate(qr, { small: true });
        process.exit(0);
      }
    });
  } catch (err) {
    console.error('Error in testBaileys:', err);
  }
}

testBaileys();
