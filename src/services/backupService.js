import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { ZipArchive } from 'archiver';
import { uploadToGoogleDrive } from './googleDriveService.js';

const prisma = new PrismaClient();
let autoBackupTimer = null;

export const generateBackup = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.resolve('backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFileName = `gama_store_backup_${timestamp}.zip`;
      const backupFilePath = path.join(backupDir, backupFileName);

      // Create output stream
      const output = fs.createWriteStream(backupFilePath);
      const archive = new ZipArchive({
        zlib: { level: 9 } // Maximum compression
      });

      output.on('close', async () => {
        console.log(`💾 Backup gerado com sucesso: ${backupFileName} (${archive.pointer()} bytes)`);
        
        // Disparar sincronização em nuvem com o Google Drive
        const driveResult = await uploadToGoogleDrive(backupFilePath, backupFileName);

        resolve({
          filename: backupFileName,
          filePath: backupFilePath,
          timestamp,
          sizeBytes: archive.pointer(),
          googleDriveSync: driveResult
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // 1. Exportar dados do banco em JSON
      const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
      const products = await prisma.product.findMany({ include: { media: true, category: true, variants: true } });
      const categories = await prisma.category.findMany();
      const coupons = await prisma.coupon.findMany();
      const orders = await prisma.order.findMany({ include: { items: true } });
      const sections = await prisma.siteSection.findMany();

      const backupData = {
        timestamp,
        version: '1.0.0',
        meta: {
          totalUsers: users.length,
          totalProducts: products.length,
          totalOrders: orders.length
        },
        data: { users, products, categories, coupons, orders, sections }
      };

      archive.append(JSON.stringify(backupData, null, 2), { name: 'database_export.json' });

      // 2. Tentar copiar o arquivo dev.db se existir
      const dbFile = path.resolve('prisma/dev.db');
      if (fs.existsSync(dbFile)) {
        archive.file(dbFile, { name: 'dev.db' });
      }

      // 3. Adicionar pasta uploads (Mídias)
      const uploadsDir = path.resolve('uploads');
      if (fs.existsSync(uploadsDir)) {
        archive.directory(uploadsDir, 'uploads');
      }

      // Finalize the archive
      await archive.finalize();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Trigger automated background backup on DB / CMS mutations.
 * Debounced by 3 seconds to aggregate rapid successive edits.
 */
export const triggerAutoBackup = (reason = 'MUTATION') => {
  if (autoBackupTimer) {
    clearTimeout(autoBackupTimer);
  }
  autoBackupTimer = setTimeout(async () => {
    try {
      console.log(`⚡ [Auto-Backup Triggered by ${reason}] Gerando backup em nuvem...`);
      await generateBackup();
    } catch (err) {
      console.error('❌ Erro no Auto-Backup automático:', err.message);
    }
  }, 3000);
};

export const listBackups = () => {
  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) return [];

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.zip'));
  return files.map(file => {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    return {
      filename: file,
      sizeBytes: stats.size,
      createdAt: stats.birthtime
    };
  }).sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteBackupFile = (filename) => {
  // Prevenir Directory Traversal Attacks
  const safeFilename = path.basename(filename);
  if (!safeFilename.endsWith('.zip')) {
    throw new Error('Formato de arquivo inválido. Apenas arquivos .zip podem ser excluídos.');
  }

  const backupPath = path.resolve('backups', safeFilename);
  if (!fs.existsSync(backupPath)) {
    throw new Error('Arquivo de backup não encontrado.');
  }

  fs.unlinkSync(backupPath);
  console.log(`🗑️ Backup excluído do sistema: ${safeFilename}`);
  return true;
};
