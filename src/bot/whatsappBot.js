import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
    const lowerText = text.toLowerCase();

    // 1. Menu Inicial
    if (lowerText === 'menu' || lowerText === 'olá' || lowerText === 'ola') {
      await sock.sendMessage(from, {
        text: `🤖 *Atendimento Automático Gama Store*\n\nSeja bem-vindo ao nosso catálogo tático!\nComo posso te ajudar?\n\n1️⃣ Ver produtos mais vendidos\n2️⃣ Buscar produto por nome (ex: busca colete)\n3️⃣ Consultar status de pedido (ex: status GS-123456)\n4️⃣ Falar com atendente humano`
      });
      return;
    }

    // 2. Opção 1: Bestsellers com foto e link do produto
    if (lowerText === '1') {
      const bestsellers = await prisma.product.findMany({
        where: { isBestseller: true },
        take: 3,
        include: { media: true }
      });

      if (bestsellers.length === 0) {
        await sock.sendMessage(from, { text: '🔥 Nenhum produto em destaque no momento. Envie "busca algo" para pesquisar no catálogo.' });
        return;
      }

      await sock.sendMessage(from, { text: '🔥 *Produtos Mais Vendidos:*' });

      const siteUrl = process.env.STORE_FRONTEND_URL || 'http://localhost:3000';
      const backendUrl = `http://localhost:${process.env.PORT || 3001}`;

      for (const prod of bestsellers) {
        const primaryMedia = prod.media[0]?.url;
        const msgContent = `📌 *${prod.title}*\n💰 Preço: R$ ${parseFloat(prod.price).toFixed(2)}\n\n🔗 Acesse no site: ${siteUrl}/produto/${prod.slug}`;

        if (primaryMedia && !primaryMedia.includes('youtube') && !primaryMedia.includes('instagram')) {
          const imageUrl = primaryMedia.startsWith('/') ? `${backendUrl}${primaryMedia}` : primaryMedia;
          try {
            await sock.sendMessage(from, {
              image: { url: imageUrl },
              caption: msgContent
            });
          } catch (e) {
            await sock.sendMessage(from, { text: msgContent });
          }
        } else {
          await sock.sendMessage(from, { text: msgContent });
        }
      }
      return;
    }

    // 3. Consulta de Status do Pedido (status GS-XXXXXX)
    if (lowerText.startsWith('status ')) {
      const orderNum = text.replace(/status /i, '').trim().toUpperCase();
      const order = await prisma.order.findFirst({
        where: { orderNumber: orderNum },
        include: { items: { include: { product: true } } }
      });

      if (!order) {
        await sock.sendMessage(from, { text: `❌ Pedido *${orderNum}* não encontrado em nosso sistema.` });
        return;
      }

      let statusMsg = `📦 *CONSULTA DE PEDIDO: ${order.orderNumber}*\n\n`;
      statusMsg += `👤 *Cliente:* ${order.customerName}\n`;
      statusMsg += `💰 *Valor Total:* R$ ${parseFloat(order.finalAmount).toFixed(2)}\n`;
      statusMsg += `🚚 *Status Atual:* *${order.status}*\n`;
      statusMsg += `📍 *Entrega:* ${order.shippingAddress}\n\n`;
      statusMsg += `*Itens do Pedido:*\n`;
      order.items.forEach(i => {
        statusMsg += `• ${i.product.title} (${i.quantity}x)\n`;
      });

      await sock.sendMessage(from, { text: statusMsg });
      return;
    }

    // 4. Busca Dinâmica de Produtos no Banco
    if (lowerText.startsWith('busca ')) {
      const searchTerm = text.replace(/busca /i, '').trim();
      const products = await prisma.product.findMany({
        where: { title: { contains: searchTerm } },
        take: 3
      });

      if (products.length === 0) {
        await sock.sendMessage(from, { text: `❌ Nenhum produto encontrado com "${searchTerm}".` });
        return;
      }

      const siteUrl = process.env.STORE_FRONTEND_URL || 'http://localhost:3000';
      let responseText = `🔎 *Resultados para "${searchTerm}":*\n\n`;
      products.forEach(p => {
        responseText += `• *${p.title}* - R$ ${parseFloat(p.price).toFixed(2)}\n  ${siteUrl}/produto/${p.slug}\n\n`;
      });

      await sock.sendMessage(from, { text: responseText });
      return;
    }

    // 5. Atendente Humano
    if (lowerText === '4') {
      await sock.sendMessage(from, {
        text: `👨‍💻 Um de nossos atendentes responderá sua mensagem em breve. Por favor, aguarde alguns instantes!`
      });
      return;
    }
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexão fechada. Reconectando...', shouldReconnect);
      if (shouldReconnect) {
        startWhatsAppBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot do WhatsApp conectado com sucesso ao Gama Store!');
    }
  });
}

startWhatsAppBot();
