import { generateBackup, listBackups, deleteBackupFile } from '../services/backupService.js';
import { getBackupConfig, saveBackupConfig } from '../services/googleDriveService.js';
import path from 'path';
import fs from 'fs';

export const createBackupHandler = async (req, res) => {
  try {
    const result = await generateBackup();
    return res.status(201).json({
      message: 'Backup do sistema gerado com sucesso!',
      backup: result
    });
  } catch (error) {
    console.error('Erro ao gerar backup:', error);
    return res.status(500).json({ error: 'Erro ao gerar backup do sistema.', details: error.message });
  }
};

export const getBackupsHandler = async (req, res) => {
  try {
    const backups = listBackups();
    return res.json(backups);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar arquivos de backup.' });
  }
};

export const downloadBackupHandler = (req, res) => {
  const { filename } = req.params;
  const backupPath = path.resolve('backups', filename);

  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: 'Arquivo de backup não encontrado.' });
  }

  res.download(backupPath, filename, (err) => {
    if (err) {
      console.error('Erro ao fazer download do backup:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao fazer download.' });
      }
    }
  });
};

export const deleteBackupHandler = async (req, res) => {
  try {
    const { filename } = req.params;
    deleteBackupFile(filename);
    return res.json({ message: `Backup "${filename}" excluído com sucesso!` });
  } catch (error) {
    console.error('Erro ao excluir backup:', error);
    return res.status(400).json({ error: error.message || 'Erro ao excluir arquivo de backup.' });
  }
};

export const getBackupConfigHandler = async (req, res) => {
  try {
    const config = getBackupConfig();
    return res.json(config);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao obter configuração de backup.' });
  }
};

export const saveBackupConfigHandler = async (req, res) => {
  try {
    const { targetEmail, syncPath } = req.body;
    const updated = saveBackupConfig({ targetEmail, syncPath });
    return res.json({ message: 'Configurações de backup salvas com sucesso!', config: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao salvar configurações de backup.' });
  }
};

export const restoreBackupHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de backup foi enviado.' });
    }

    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(req.file.path);

    const tempExtractDir = path.resolve('temp_restore');
    if (fs.existsSync(tempExtractDir)) {
      fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempExtractDir, { recursive: true });

    zip.extractAllTo(tempExtractDir, true);

    // 1. Restaurar dev.db se existir
    const extractedDb = path.join(tempExtractDir, 'dev.db');
    if (fs.existsSync(extractedDb)) {
      const targetDb = path.resolve('prisma/dev.db');
      fs.copyFileSync(extractedDb, targetDb);
      console.log('✅ dev.db restaurado com sucesso!');
    }

    // 2. Restaurar uploads/ se existir
    const extractedUploads = path.join(tempExtractDir, 'uploads');
    if (fs.existsSync(extractedUploads)) {
      const targetUploads = path.resolve('uploads');
      if (!fs.existsSync(targetUploads)) {
        fs.mkdirSync(targetUploads, { recursive: true });
      }
      fs.cpSync(extractedUploads, targetUploads, { recursive: true, force: true });
      console.log('✅ Pasta uploads restaurada com sucesso!');
    }

    // Limpar pasta temporaria e o arquivo do upload
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.json({
      message: 'Backup restaurado com sucesso! O banco de dados e as mídias foram recuperados.'
    });
  } catch (error) {
    console.error('Erro ao restaurar backup:', error);
    return res.status(500).json({ error: 'Erro ao restaurar backup.', details: error.message });
  }
};
