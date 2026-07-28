import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function inferMediaType(url, providedType) {
  if (providedType) return providedType;
  if (!url) return 'IMAGE';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YOUTUBE';
  if (url.includes('instagram.com')) return 'INSTAGRAM';
  if (url.endsWith('.mp4') || url.endsWith('.webm')) return 'VIDEO_FILE';
  return 'IMAGE';
}

export const getProducts = async (req, res) => {
  try {
    const { bestseller } = req.query;
    const where = {};
    if (bestseller === 'true') {
      where.isBestseller = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        media: true,
        category: true,
        variants: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    return res.json(products);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
};

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { media: true, category: true, variants: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { title, slug, description, price, promoPrice, stock, isBestseller, isMadeToOrder, productionDays, categoryId, media } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Título e Preço são obrigatórios.' });
    }

    const productSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const variantsData = req.body.variants || [];
    const totalStock = variantsData.length > 0 
      ? variantsData.reduce((acc, v) => acc + (parseInt(v.stock, 10) || 0), 0)
      : (parseInt(stock, 10) || 0);

    const newProduct = await prisma.product.create({
      data: {
        title,
        slug: productSlug,
        description: description || '',
        price: parseFloat(price),
        promoPrice: promoPrice ? parseFloat(promoPrice) : null,
        stock: totalStock,
        isBestseller: Boolean(isBestseller),
        isMadeToOrder: Boolean(isMadeToOrder),
        productionDays: productionDays ? parseInt(productionDays, 10) : 0,
        categoryId: categoryId || null,
        media: {
          create: (media || [])
            .filter(m => m && m.url && String(m.url).trim() !== '')
            .map((m, index) => ({
              url: String(m.url).trim(),
              type: inferMediaType(m.url, m.type),
              isPrimary: m.isPrimary !== undefined ? Boolean(m.isPrimary) : index === 0,
              color: m.color || null
            }))
        },
        variants: {
          create: variantsData
            .filter(v => v && (v.color || v.size))
            .map(v => ({
              color: v.color || 'Padrão',
              size: v.size || 'Único',
              stock: parseInt(v.stock, 10) || 0,
              sku: v.sku || null,
              price: v.price ? parseFloat(v.price) : null
            }))
        }
      },
      include: { media: true, category: true, variants: true }
    });

    // Limpar rascunho automático após criar o produto com sucesso
    await prisma.productDraft.deleteMany({});

    return res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ error: 'Erro ao criar produto.', details: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, price, promoPrice, stock, isBestseller, isMadeToOrder, productionDays, categoryId, media, variants } = req.body;

    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (media && Array.isArray(media)) {
      await prisma.productMedia.deleteMany({ where: { productId: id } });
    }

    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
    }

    let updatedStock = stock !== undefined ? parseInt(stock, 10) : undefined;
    if (variants && Array.isArray(variants) && variants.length > 0) {
      updatedStock = variants.reduce((acc, v) => acc + (parseInt(v.stock, 10) || 0), 0);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        price: price ? parseFloat(price) : undefined,
        promoPrice: promoPrice !== undefined ? (promoPrice ? parseFloat(promoPrice) : null) : undefined,
        stock: updatedStock,
        isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : undefined,
        isMadeToOrder: isMadeToOrder !== undefined ? Boolean(isMadeToOrder) : undefined,
        productionDays: productionDays !== undefined ? parseInt(productionDays, 10) || 0 : undefined,
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
    const validMedia = (media || []).filter(m => m && m.url && String(m.url).trim() !== '');
    const validVariants = (variants || []).filter(v => v && (v.color || v.size));

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        price: price ? parseFloat(price) : undefined,
        promoPrice: promoPrice !== undefined ? (promoPrice ? parseFloat(promoPrice) : null) : undefined,
        stock: updatedStock,
        isBestseller: isBestseller !== undefined ? Boolean(isBestseller) : undefined,
        isMadeToOrder: isMadeToOrder !== undefined ? Boolean(isMadeToOrder) : undefined,
        productionDays: productionDays !== undefined ? parseInt(productionDays, 10) || 0 : undefined,
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        media: media && Array.isArray(media) ? {
          create: validMedia.map((m, index) => ({
            url: String(m.url).trim(),
            type: inferMediaType(m.url, m.type),
            isPrimary: m.isPrimary !== undefined ? Boolean(m.isPrimary) : index === 0,
            color: m.color || null
          }))
        } : undefined,
        variants: variants && Array.isArray(variants) ? {
          create: validVariants.map(v => ({
            color: v.color || 'Padrão',
            size: v.size || 'Único',
            stock: parseInt(v.stock, 10) || 0,
            sku: v.sku || null,
            price: v.price ? parseFloat(v.price) : null
          }))
        } : undefined
      },
      include: { media: true, category: true, variants: true }
    });

    // Limpar rascunho automático após atualizar o produto com sucesso
    await prisma.productDraft.deleteMany({});

    return res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ error: 'Erro ao atualizar produto.', details: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Produto removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return res.status(500).json({ error: 'Erro ao remover produto.' });
  }
};

// === RASCUNHO AUTOMÁTICO DE PRODUTO (PERSISTENTE / MULTI-DEVICE) ===
export const getDraft = async (req, res) => {
  try {
    const draft = await prisma.productDraft.findUnique({ where: { id: 'admin_draft' } });
    if (!draft || !draft.dataJson) {
      return res.json({ draft: null });
    }
    return res.json({ draft: JSON.parse(draft.dataJson), updatedAt: draft.updatedAt });
  } catch (error) {
    console.error('Erro ao buscar rascunho:', error);
    return res.status(500).json({ error: 'Erro ao buscar rascunho' });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { draftData } = req.body;
    if (!draftData) {
      return res.status(400).json({ error: 'draftData é obrigatório.' });
    }
    const saved = await prisma.productDraft.upsert({
      where: { id: 'admin_draft' },
      update: { dataJson: JSON.stringify(draftData) },
      create: { id: 'admin_draft', dataJson: JSON.stringify(draftData) }
    });
    return res.json({ success: true, updatedAt: saved.updatedAt });
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    return res.status(500).json({ error: 'Erro ao salvar rascunho' });
  }
};

export const clearDraft = async (req, res) => {
  try {
    await prisma.productDraft.deleteMany({});
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao limpar rascunho' });
  }
};

// === RASTREAMENTO E ANALYTICS ===
export const trackProductView = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.update({
      where: { id },
      data: { viewsCount: { increment: 1 } }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
};

export const trackSearchQuery = async (req, res) => {
  try {
    const { query, resultsCount } = req.body;
    if (query && query.trim().length > 1) {
      await prisma.searchLog.create({
        data: {
          query: query.trim().toLowerCase(),
          resultsCount: typeof resultsCount === 'number' ? resultsCount : 0
        }
      });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
};

export const getDetailedAnalytics = async (req, res) => {
  try {
    // 1. Produtos Mais Vistos
    const mostViewed = await prisma.product.findMany({
      take: 10,
      orderBy: { viewsCount: 'desc' },
      include: { category: true, media: true }
    });

    // 2. Produtos Mais Vendidos
    const orderItemsGrouped = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10
    });

    const mostSoldIds = orderItemsGrouped.map(item => item.productId);
    const mostSoldProductsRaw = await prisma.product.findMany({
      where: { id: { in: mostSoldIds } },
      include: { category: true, media: true }
    });

    const mostSold = orderItemsGrouped.map(item => {
      const product = mostSoldProductsRaw.find(p => p.id === item.productId);
      return {
        product,
        totalQuantitySold: item._sum.quantity || 0
      };
    }).filter(item => item.product);

    // 3. Termos Mais Pesquisados (mesmo que o produto não exista!)
    const searchLogs = await prisma.searchLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    const searchMap = {};
    searchLogs.forEach(log => {
      const q = log.query.toLowerCase();
      if (!searchMap[q]) {
        searchMap[q] = { query: q, count: 0, lastResultsCount: log.resultsCount };
      }
      searchMap[q].count += 1;
      searchMap[q].lastResultsCount = log.resultsCount;
    });

    const mostSearched = Object.values(searchMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // 4. Alerta de Estoque Baixo / Produtos em Falta
    const allProducts = await prisma.product.findMany({
      include: { variants: true, category: true }
    });

    const lowStockProducts = allProducts.filter(p => {
      if (p.stock <= 3) return true;
      if (p.variants && p.variants.some(v => v.stock <= 3)) return true;
      return false;
    });

    return res.json({
      mostViewed,
      mostSold,
      mostSearched,
      lowStockProducts
    });
  } catch (error) {
    console.error('Erro ao calcular analytics detalhados:', error);
    return res.status(500).json({ error: 'Erro ao gerar analytics' });
  }
};
