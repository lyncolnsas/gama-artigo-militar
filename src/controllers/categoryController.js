import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- CATEGORIAS ---
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, image, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const category = await prisma.category.create({
      data: { name, slug, image, description }
    });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar categoria.', details: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, description } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : undefined;

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, image, description }
    });
    return res.json(category);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Categoria removida com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao remover categoria.' });
  }
};

// --- MARCAS ---
export const getBrands = async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    });
    return res.json(brands);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar marcas.' });
  }
};

export const createBrand = async (req, res) => {
  try {
    const { name, logo } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome da marca é obrigatório.' });

    const brand = await prisma.brand.create({
      data: { name, logo }
    });
    return res.status(201).json(brand);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar marca.' });
  }
};
