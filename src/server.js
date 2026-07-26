import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { setupSwagger } from './swagger.js';

// Middlewares de Autenticação & Permissão
import { verifyToken, requireRole } from './middlewares/authMiddleware.js';

// Controllers
import { upload, handleUploadResponse } from './controllers/uploadController.js';
import { register, login, getMe, getUsers, updateUserRole } from './controllers/authController.js';
import { 
  getProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from './controllers/productController.js';
import { 
  getSections, 
  getSectionByKey, 
  upsertSection, 
  deleteSection 
} from './controllers/sectionController.js';
import { getCoupons, validateCoupon, createCoupon, deleteCoupon } from './controllers/couponController.js';
import { createOrder, getOrders, getMyOrders, updateOrderStatus, getAnalytics, deleteOrder } from './controllers/orderController.js';
import { getCategories, createCategory, updateCategory, deleteCategory, getBrands, createBrand } from './controllers/categoryController.js';
import { createBackupHandler, getBackupsHandler, downloadBackupHandler, deleteBackupHandler, restoreBackupHandler, getBackupConfigHandler, saveBackupConfigHandler } from './controllers/backupController.js';
import { getMediaLibrary, deleteMedia } from './controllers/mediaLibraryController.js';
import { triggerAutoBackup } from './services/backupService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos de mídia locais da pasta uploads/
app.use('/uploads', express.static(path.resolve('uploads')));

// Documentação Swagger UI
setupSwagger(app);

// --- ROTAS DE AUTENTICAÇÃO E RBAC ---
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', verifyToken, getMe);
app.get('/api/auth/users', verifyToken, requireRole(['ADMIN']), getUsers);
app.put('/api/auth/users/:id/role', verifyToken, requireRole(['ADMIN']), updateUserRole);

// --- ROTA DE UPLOAD E GALERIA DE MÍDIAS ---
app.post('/api/upload', upload.single('media'), handleUploadResponse);
app.get('/api/admin/media-library', verifyToken, requireRole(['ADMIN', 'MANAGER']), getMediaLibrary);
app.delete('/api/admin/media-library/:filename', verifyToken, requireRole(['ADMIN', 'MANAGER']), deleteMedia);

// --- ROTAS DE PRODUTOS ---
app.get('/api/products', getProducts);
app.get('/api/products/:slug', getProductBySlug);
app.post('/api/products', verifyToken, requireRole(['ADMIN', 'MANAGER']), createProduct);
app.put('/api/products/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), updateProduct);
app.delete('/api/products/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), deleteProduct);

// --- ROTAS DE CATEGORIAS E MARCAS ---
app.get('/api/categories', getCategories);
app.post('/api/categories', verifyToken, requireRole(['ADMIN', 'MANAGER']), createCategory);
app.put('/api/categories/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), updateCategory);
app.delete('/api/categories/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), deleteCategory);

app.get('/api/brands', getBrands);
app.post('/api/brands', verifyToken, requireRole(['ADMIN', 'MANAGER']), createBrand);

// --- ROTAS DE SEÇÕES DO SITE / CMS DINÂMICO ---
app.get('/api/sections', getSections);
app.get('/api/sections/:sectionKey', getSectionByKey);
app.post('/api/sections', verifyToken, requireRole(['ADMIN', 'MANAGER']), upsertSection);
app.delete('/api/sections/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), deleteSection);

// --- ROTAS DE CUPONS ---
app.get('/api/coupons', verifyToken, requireRole(['ADMIN', 'MANAGER']), getCoupons);
app.post('/api/coupons/validate', validateCoupon);
app.post('/api/coupons', verifyToken, requireRole(['ADMIN', 'MANAGER']), createCoupon);
app.delete('/api/coupons/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), deleteCoupon);

// --- ROTAS DE PEDIDOS E CHECKOUT (PEDIDO DE MATERIAIS) ---
app.post('/api/orders', createOrder);
app.get('/api/orders', verifyToken, requireRole(['ADMIN', 'MANAGER']), getOrders);
app.get('/api/orders/my-orders', verifyToken, getMyOrders);
app.put('/api/orders/:id/status', verifyToken, requireRole(['ADMIN', 'MANAGER']), updateOrderStatus);
app.delete('/api/orders/:id', verifyToken, requireRole(['ADMIN', 'MANAGER']), deleteOrder);

// --- ROTAS DE BACKUP E GOOGLE DRIVE ---
app.post('/api/admin/backup', verifyToken, requireRole(['ADMIN']), createBackupHandler);
app.get('/api/admin/backup', verifyToken, requireRole(['ADMIN']), getBackupsHandler);
app.get('/api/admin/backup/download/:filename', verifyToken, requireRole(['ADMIN']), downloadBackupHandler);
app.delete('/api/admin/backup/:filename', verifyToken, requireRole(['ADMIN']), deleteBackupHandler);
app.get('/api/admin/backup/config', verifyToken, requireRole(['ADMIN']), getBackupConfigHandler);
app.post('/api/admin/backup/config', verifyToken, requireRole(['ADMIN']), saveBackupConfigHandler);
app.post('/api/admin/backup/restore', verifyToken, requireRole(['ADMIN']), upload.single('backupFile'), restoreBackupHandler);

// Middleware para auto-backup automático no Google Drive ao realizar alterações no CMS/Banco de Dados
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method) && req.path.startsWith('/api/') && !req.path.includes('/api/admin/backup')) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        triggerAutoBackup(`ALTERACAO_${req.method}_${req.path.replace(/[/]/g, '_')}`);
      }
    });
  }
  next();
});

// --- ANALYTICS DASHBOARD ---
app.get('/api/analytics', verifyToken, requireRole(['ADMIN', 'MANAGER']), getAnalytics);

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Gama Store Enterprise API Backend is running.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Gama Store Backend API rodando na porta ${PORT}`);
  console.log(`📖 Swagger API Docs em http://localhost:${PORT}/api-docs`);
  console.log(`📁 Uploads disponíveis em http://localhost:${PORT}/uploads`);
});
