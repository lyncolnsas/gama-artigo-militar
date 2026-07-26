import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function inferType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) return 'VIDEO_FILE';
  return 'IMAGE';
}

export const getMediaLibrary = async (req, res) => {
  try {
    const uploadsDir = path.resolve('uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const files = fs.readdirSync(uploadsDir);

    // Buscar todos os links em uso no banco
    const sections = await prisma.siteSection.findMany({ select: { sectionKey: true, mediaUrl: true } });
    const productMedia = await prisma.productMedia.findMany({ select: { url: true, product: { select: { title: true } } } });
    const categories = await prisma.category.findMany({ select: { name: true, image: true } });

    const inUseMap = new Map();

    // Mapear seções
    sections.forEach(s => {
      if (s.mediaUrl) {
        const usageList = inUseMap.get(s.mediaUrl) || [];
        usageList.push(`Seção CMS: ${s.sectionKey}`);
        inUseMap.set(s.mediaUrl, usageList);
      }
    });

    // Mapear mídias de produtos
    productMedia.forEach(pm => {
      if (pm.url) {
        const usageList = inUseMap.get(pm.url) || [];
        usageList.push(`Produto: ${pm.product?.title || 'Produto'}`);
        inUseMap.set(pm.url, usageList);
      }
    });

    // Mapear capas de categorias
    categories.forEach(c => {
      if (c.image) {
        const usageList = inUseMap.get(c.image) || [];
        usageList.push(`Categoria: ${c.name}`);
        inUseMap.set(c.image, usageList);
      }
    });

    const inUseFiles = [];
    const unusedFiles = [];

    files.forEach(filename => {
      const fileUrl = `/uploads/${filename}`;
      const fullPath = path.join(uploadsDir, filename);
      const stat = fs.statSync(fullPath);

      const usageList = inUseMap.get(fileUrl) || [];
      const isUsed = usageList.length > 0;

      const fileItem = {
        filename,
        url: fileUrl,
        mediaType: inferType(filename),
        sizeBytes: stat.size,
        createdAt: stat.birthtime,
        isUsed,
        usageList
      };

      if (isUsed) {
        inUseFiles.push(fileItem);
      } else {
        unusedFiles.push(fileItem);
      }
    });

    return res.json({
      totalCount: files.length,
      inUseCount: inUseFiles.length,
      unusedCount: unusedFiles.length,
      inUse: inUseFiles,
      unused: unusedFiles
    });
  } catch (error) {
    console.error('Erro ao buscar galeria de mídias:', error);
    return res.status(500).json({ error: 'Erro ao listar mídias do servidor.' });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename) return res.status(400).json({ error: 'Nome do arquivo não fornecido.' });

    const fileUrl = `/uploads/${filename}`;

    const section = await prisma.siteSection.findFirst({ where: { mediaUrl: fileUrl } });
    const productMedia = await prisma.productMedia.findFirst({ where: { url: fileUrl } });
    const category = await prisma.category.findFirst({ where: { image: fileUrl } });

    if (section || productMedia || category) {
      return res.status(400).json({ error: 'Este arquivo está em uso e não pode ser excluído.' });
    }

    const fullPath = path.resolve('uploads', filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return res.json({ success: true, message: 'Arquivo excluído com sucesso.' });
    } else {
      return res.status(404).json({ error: 'Arquivo não encontrado no disco.' });
    }
  } catch (error) {
    console.error('Erro ao excluir mídia:', error);
    return res.status(500).json({ error: 'Erro ao tentar excluir a mídia.' });
  }
};
