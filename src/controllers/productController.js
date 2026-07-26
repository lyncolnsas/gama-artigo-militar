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
          create: (media || []).map((m, index) => ({
            url: m.url,
            type: inferMediaType(m.url, m.type),
            isPrimary: m.isPrimary !== undefined ? m.isPrimary : index === 0,
            color: m.color || null
          }))
        },
        variants: {
          create: variantsData.map(v => ({
            color: v.color,
            size: v.size,
            stock: parseInt(v.stock, 10) || 0,
            sku: v.sku || null,
            price: v.price ? parseFloat(v.price) : null
          }))
        }
      },
      include: { media: true, category: true, variants: true }
    });

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
        media: media && Array.isArray(media) ? {
          create: media.map((m, index) => ({
            url: m.url,
            type: inferMediaType(m.url, m.type),
            isPrimary: m.isPrimary !== undefined ? m.isPrimary : index === 0,
            color: m.color || null
          }))
        } : undefined,
        variants: variants && Array.isArray(variants) ? {
          create: variants.map(v => ({
            color: v.color,
            size: v.size,
            stock: parseInt(v.stock, 10) || 0,
            sku: v.sku || null,
            price: v.price ? parseFloat(v.price) : null
          }))
        } : undefined
      },
      include: { media: true, category: true, variants: true }
    });

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
