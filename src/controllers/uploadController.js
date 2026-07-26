import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Garantir que a pasta uploads/ existe
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração do Multer para armazenamento local de fotos e vídeos MP4
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB para vídeos e imagens
});

export const handleUploadResponse = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const isVideo = req.file.mimetype.startsWith('video/');
  const mediaType = isVideo ? 'VIDEO_FILE' : 'IMAGE';

  return res.status(200).json({
    message: 'Upload realizado com sucesso!',
    url: fileUrl,
    filename: req.file.filename,
    mediaType: mediaType
  });
};
