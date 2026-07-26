import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(coupons);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar cupons.' });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, amount, items } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Código de cupom não fornecido.' });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { category: true }
    });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ error: 'Este cupom já expirou.' });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Limite de usos deste cupom atingido.' });
    }

    const totalSpend = amount ? parseFloat(amount) : 0;
    if (coupon.minSpend && totalSpend < parseFloat(coupon.minSpend)) {
      return res.status(400).json({
        error: `O valor mínimo para este cupom é R$ ${parseFloat(coupon.minSpend).toFixed(2)}.`
      });
    }

    // Validação por Categoria Específica
    if (coupon.categoryId) {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: `Este cupom é restrito para a categoria '${coupon.category?.name || 'específica'}'.`
        });
      }

      // Buscar IDs de produtos do carrinho
      const productIds = items.map(i => i.productId || i.id).filter(Boolean);
      const cartProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, categoryId: true }
      });

      // Verificar se todos os itens ou algum item não é da categoria do cupom
      const hasItemInTargetCategory = cartProducts.some(p => p.categoryId === coupon.categoryId);

      if (!hasItemInTargetCategory) {
        return res.status(400).json({
          error: `Cupom inválido! Este cupom é exclusivo para produtos da categoria '${coupon.category?.name || 'selecionada'}'.`
        });
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (totalSpend * parseFloat(coupon.value)) / 100;
    } else {
      discountAmount = parseFloat(coupon.value);
    }

    return res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      value: parseFloat(coupon.value),
      categoryId: coupon.categoryId,
      categoryName: coupon.category?.name || null,
      discountAmount: Math.min(discountAmount, totalSpend)
    });
  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return res.status(500).json({ error: 'Erro ao validar cupom.' });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, value, minSpend, categoryId, usageLimit, expiresAt } = req.body;

    if (!code || !value) {
      return res.status(400).json({ error: 'Código e valor de desconto são obrigatórios.' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType: discountType || 'PERCENTAGE',
        value: parseFloat(value),
        minSpend: minSpend ? parseFloat(minSpend) : null,
        categoryId: categoryId || null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: { category: true }
    });

    return res.status(201).json(coupon);
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    return res.status(500).json({ error: 'Erro ao criar cupom.', details: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    return res.json({ message: 'Cupom removido com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover cupom.' });
  }
};
