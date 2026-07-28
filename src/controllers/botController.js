import { whatsappBotService } from '../services/whatsappBotService.js';

export const getBotConfigHandler = async (req, res) => {
  try {
    const config = await whatsappBotService.getBotConfig();
    const status = whatsappBotService.getStatus();

    return res.json({
      ...config,
      connectionStatus: status.connectionStatus,
      qrCodeData: status.qrCodeData
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do Bot:', error);
    return res.status(500).json({ error: 'Erro ao buscar configurações do WhatsApp Bot.' });
  }
};

export const updateBotConfigHandler = async (req, res) => {
  try {
    const { isBotEnabled, whatsappNumber, welcomeMessage } = req.body;

    const updatedConfig = await whatsappBotService.updateBotConfig({
      isBotEnabled: Boolean(isBotEnabled),
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '5511999998888',
      welcomeMessage: welcomeMessage ? welcomeMessage.trim() : null
    });

    const status = whatsappBotService.getStatus();

    return res.json({
      message: 'Configurações do WhatsApp Bot atualizadas com sucesso!',
      ...updatedConfig,
      connectionStatus: status.connectionStatus,
      qrCodeData: status.qrCodeData
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações do Bot:', error);
    return res.status(500).json({ error: 'Erro ao salvar configurações do WhatsApp Bot.' });
  }
};

export const restartBotHandler = async (req, res) => {
  try {
    const config = await whatsappBotService.getBotConfig();
    if (!config.isBotEnabled) {
      return res.status(400).json({ error: 'O Bot está desativado. Ative-o antes de reiniciar a conexão.' });
    }

    await whatsappBotService.stopBot();
    await whatsappBotService.startBot();

    const status = whatsappBotService.getStatus();
    return res.json({
      message: 'Reconexão do WhatsApp Bot iniciada.',
      connectionStatus: status.connectionStatus,
      qrCodeData: status.qrCodeData
    });
  } catch (error) {
    console.error('Erro ao reiniciar Bot:', error);
    return res.status(500).json({ error: 'Erro ao reiniciar serviço do Bot.' });
  }
};

export const getPublicBotConfigHandler = async (req, res) => {
  try {
    const config = await whatsappBotService.getBotConfig();
    return res.json({
      isBotEnabled: config.isBotEnabled,
      whatsappNumber: config.whatsappNumber || '5511999998888'
    });
  } catch (error) {
    return res.json({
      isBotEnabled: false,
      whatsappNumber: '5511999998888'
    });
  }
};
