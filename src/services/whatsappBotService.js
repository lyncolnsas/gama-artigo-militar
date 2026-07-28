import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import pino from 'pino';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

class WhatsAppBotService {
  constructor() {
    this.sock = null;
    this.connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_READY'
    this.qrCodeData = null;
    this.qrTerminal = null;
    this.isInitializing = false;
  }

  async getBotConfig() {
    let config = await prisma.botConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      config = await prisma.botConfig.create({
        data: {
          id: 'default',
          isBotEnabled: true,
          whatsappNumber: '5511999998888',
          welcomeMessage: '🤖 *Atendimento Automático Gama Store*\n\nSeja bem-vindo ao nosso catálogo tático!\nComo posso te ajudar?\n\n1️⃣ Ver produtos mais vendidos\n2️⃣ Buscar produto por nome (ex: busca colete)\n3️⃣ Consultar status de pedido (ex: status GS-123456)\n4️⃣ Falar com atendente humano'
        }
      });
    }
    return config;
  }

  async updateBotConfig(updateData) {
    const config = await prisma.botConfig.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        isBotEnabled: updateData.isBotEnabled !== undefined ? updateData.isBotEnabled : true,
        whatsappNumber: updateData.whatsappNumber || '5511999998888',
        welcomeMessage: updateData.welcomeMessage || '🤖 *Atendimento Automático Gama Store*'
      }
    });

    if (updateData.isBotEnabled === false) {
      await this.stopBot();
    } else if (updateData.isBotEnabled === true && this.connectionStatus === 'DISCONNECTED') {
      await this.startBot();
    }

    return config;
  }

  async startBot() {
    const config = await this.getBotConfig();
    if (!config.isBotEnabled) {
      console.log('ℹ️ WhatsApp Bot está desativado nas configurações.');
      this.connectionStatus = 'DISCONNECTED';
      return;
    }

    if (this.isInitializing || this.connectionStatus === 'CONNECTED') {
      return;
    }

    this.isInitializing = true;
    this.connectionStatus = 'CONNECTING';

    try {
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));
      const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Gama Store Bot', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.connectionStatus = 'QR_READY';
          console.log('\n======================================================');
          console.log('📱 ESCANEIE O QR CODE ABAIXO PARA CONECTAR O BOT WHATSAPP:');
          console.log('======================================================\n');
          qrcodeTerminal.generate(qr, { small: true });
          
          try {
            this.qrCodeData = await QRCode.toDataURL(qr);
          } catch (e) {
            this.qrCodeData = null;
          }
          console.log('💡 QR Code também disponível no Painel Admin em: http://localhost:3000?admin=true');
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          console.log(`🔄 Conexão do WhatsApp fechada (Status: ${statusCode || 'desconhecido'}). Reconectando: ${shouldReconnect}`);
          this.connectionStatus = 'DISCONNECTED';
          this.qrCodeData = null;
          this.isInitializing = false;

          if (shouldReconnect) {
            const currentConfig = await this.getBotConfig();
            if (currentConfig.isBotEnabled) {
              setTimeout(() => this.startBot(), 5000);
            }
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'CONNECTED';
          this.qrCodeData = null;
          this.isInitializing = false;
          console.log('✅ Bot do WhatsApp conectado com sucesso ao Gama Store!');
        }
      });

      // Escutar mensagens recebidas
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        await this.handleIncomingMessage(from, text);
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar WhatsApp Bot:', error);
      this.connectionStatus = 'DISCONNECTED';
      this.isInitializing = false;
    }
  }

  async stopBot() {
    if (this.sock) {
      try {
        await this.sock.end(undefined);
      } catch (e) {}
      this.sock = null;
    }
    this.connectionStatus = 'DISCONNECTED';
    this.qrCodeData = null;
    this.isInitializing = false;
    console.log('🛑 WhatsApp Bot foi parado.');
  }

  async handleIncomingMessage(from, text) {
    const lowerText = text.toLowerCase();
    const config = await this.getBotConfig();

    // 1. Menu Inicial / Saudação
    if (['menu', 'olá', 'ola', 'inicio', 'início', 'oi', 'bot', 'ajuda'].includes(lowerText)) {
      const welcomeMsg = config.welcomeMessage || `🤖 *Atendimento Automático Gama Store*\n\nSeja bem-vindo ao nosso catálogo tático!\nComo posso te ajudar?\n\n1️⃣ Ver produtos mais vendidos\n2️⃣ Buscar produto por nome (ex: busca colete)\n3️⃣ Consultar status de pedido (ex: status GS-123456)\n4️⃣ Falar com atendente humano`;
      await this.sendDirectMessage(from, welcomeMsg);
      return;
    }

    // 2. Opção 1: Bestsellers
    if (lowerText === '1' || lowerText === 'bestsellers' || lowerText === 'mais vendidos') {
      const bestsellers = await prisma.product.findMany({
        where: { isBestseller: true },
        take: 3,
        include: { media: true }
      });

      if (bestsellers.length === 0) {
        await this.sendDirectMessage(from, '🔥 Nenhum produto em destaque no momento. Envie "busca algo" para pesquisar no catálogo.');
        return;
      }

      await this.sendDirectMessage(from, '🔥 *Produtos Mais Vendidos:*');
      const siteUrl = process.env.STORE_FRONTEND_URL || 'http://localhost:3000';

      for (const prod of bestsellers) {
        const primaryMedia = prod.media[0]?.url;
        const msgContent = `📌 *${prod.title}*\n💰 Preço: R$ ${parseFloat(prod.price).toFixed(2)}\n\n🔗 Acesse no site: ${siteUrl}/produto/${prod.slug}`;

        if (primaryMedia && !primaryMedia.includes('youtube') && !primaryMedia.includes('instagram')) {
          const imageUrl = primaryMedia.startsWith('/') ? `http://localhost:${process.env.PORT || 3001}${primaryMedia}` : primaryMedia;
          try {
            await this.sock.sendMessage(from, { image: { url: imageUrl }, caption: msgContent });
          } catch (e) {
            await this.sendDirectMessage(from, msgContent);
          }
        } else {
          await this.sendDirectMessage(from, msgContent);
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
        await this.sendDirectMessage(from, `❌ Pedido *${orderNum}* não encontrado em nosso sistema.`);
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

      await this.sendDirectMessage(from, statusMsg);
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
        await this.sendDirectMessage(from, `❌ Nenhum produto encontrado com "${searchTerm}".`);
        return;
      }

      const siteUrl = process.env.STORE_FRONTEND_URL || 'http://localhost:3000';
      let responseText = `🔎 *Resultados para "${searchTerm}":*\n\n`;
      products.forEach(p => {
        responseText += `• *${p.title}* - R$ ${parseFloat(p.price).toFixed(2)}\n  ${siteUrl}/produto/${p.slug}\n\n`;
      });

      await this.sendDirectMessage(from, responseText);
      return;
    }

    // 5. Atendente Humano
    if (lowerText === '4' || lowerText.includes('atendente') || lowerText.includes('humano')) {
      await this.sendDirectMessage(from, `👨‍💻 Um de nossos atendentes responderá sua mensagem em breve. Por favor, aguarde alguns instantes!`);
      return;
    }

    // Resposta padrão caso não reconheça a instrução
    await this.sendDirectMessage(from, `💡 Não entendi sua mensagem.\n\nEnvie *menu* para ver as opções disponíveis ou envie *status SEU_NUMERO_DE_PEDIDO* para consultar sua compra.`);
  }

  async sendDirectMessage(toPhoneOrJid, messageText) {
    if (!this.sock || this.connectionStatus !== 'CONNECTED') {
      console.log(`⚠️ Impossível enviar WhatsApp para ${toPhoneOrJid}: Bot não conectado.`);
      return false;
    }

    let jid = toPhoneOrJid;
    if (!jid.includes('@s.whatsapp.net')) {
      const cleanPhone = toPhoneOrJid.replace(/\D/g, '');
      jid = `${cleanPhone}@s.whatsapp.net`;
    }

    try {
      await this.sock.sendMessage(jid, { text: messageText });
      return true;
    } catch (error) {
      console.error(`Erro ao enviar mensagem WhatsApp para ${jid}:`, error);
      return false;
    }
  }

  async sendOrderStatusUpdate(order) {
    if (!order || !order.customerPhone) return;

    let statusText = '';
    switch (order.status) {
      case 'PAID':
        statusText = '✅ *Pagamento Confirmado!* Seu pedido está sendo separado e preparado em nosso estoque.';
        break;
      case 'SHIPPED':
        statusText = '🚚 *Pedido Enviado!* Seu pedido está a caminho do endereço de entrega fornecido.';
        break;
      case 'DELIVERED':
        statusText = '🎉 *Pedido Entregue!* Esperamos que aproveite seu equipamento tático.';
        break;
      case 'CANCELLED':
        statusText = '❌ *Pedido Cancelado.* Se tiver dúvidas, entre em contato conosco.';
        break;
      default:
        return;
    }

    const message = `📦 *ATUALIZAÇÃO DE PEDIDO DE MATERIAIS*\n\n` +
      `📋 *Pedido N°:* ${order.orderNumber}\n` +
      `👤 *Cliente:* ${order.customerName}\n\n` +
      `${statusText}\n\n` +
      `Obrigado por comprar na *Gama Store*!`;

    await this.sendDirectMessage(order.customerPhone, message);
  }

  getStatus() {
    return {
      connectionStatus: this.connectionStatus,
      qrCodeData: this.qrCodeData
    };
  }
}

export const whatsappBotService = new WhatsAppBotService();
