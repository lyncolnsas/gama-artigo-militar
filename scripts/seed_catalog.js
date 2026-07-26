import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando Banco de Dados com Categorias e Produtos Demonstrativos Completos...');

  // 1. Criar Categorias
  const catVestuario = await prisma.category.upsert({
    where: { slug: 'vestuario-tatico' },
    update: {},
    create: {
      name: 'Vestuário Tático & Uniformes',
      slug: 'vestuario-tatico',
      image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      description: 'Jaquetas, camisetas e fardamentos operacionais de alta durabilidade.'
    }
  });

  const catCalcados = await prisma.category.upsert({
    where: { slug: 'calcados-botas' },
    update: {},
    create: {
      name: 'Calçados & Botas Táticas',
      slug: 'calcados-botas',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      description: 'Botas assault impermeáveis e coturnos de alta aderência.'
    }
  });

  const catCintos = await prisma.category.upsert({
    where: { slug: 'cintos-fardamentos' },
    update: {},
    create: {
      name: 'Cintos & Fardamentos',
      slug: 'cintos-fardamentos',
      image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80',
      description: 'Cintos táticos, fivelas de engate rápido e ajustáveis em cm.'
    }
  });

  const catCordas = await prisma.category.upsert({
    where: { slug: 'cordas-resgate' },
    update: {},
    create: {
      name: 'Cordas & Fitas de Resgate',
      slug: 'cordas-resgate',
      image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&auto=format&fit=crop&q=80',
      description: 'Cordas estáticas e dinâmicas vendidas por metragem (m).'
    }
  });

  const catEncomendas = await prisma.category.upsert({
    where: { slug: 'toalhas-encomendas' },
    update: {},
    create: {
      name: 'Toalhas Bordadas & Encomendas',
      slug: 'toalhas-encomendas',
      image: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600&auto=format&fit=crop&q=80',
      description: 'Produtos sob encomenda com bordado personalizado e prazo de produção.'
    }
  });

  console.log('✅ Categorias criadas com sucesso!');

  // 2. Criar Produtos com Variantes Diversificadas (3 tipos por categoria)

  // --- PRODUTO 1: Vestuário (Tamanhos P, M, G, GG) ---
  await prisma.product.upsert({
    where: { slug: 'jaqueta-tactical-stealth-black' },
    update: {},
    create: {
      title: 'Jaqueta Tactical Stealth Black',
      slug: 'jaqueta-tactical-stealth-black',
      description: 'Jaqueta impermeável com proteção térmica Softshell, múltiplos bolsos e suporte a velcros táticos.',
      price: 349.90,
      promoPrice: 299.90,
      stock: 35,
      isBestseller: true,
      categoryId: catVestuario.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800', type: 'IMAGE', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', type: 'IMAGE', color: 'Preto Stealth' },
          { url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800', type: 'IMAGE', color: 'Verde Oliva' }
        ]
      },
      variants: {
        create: [
          { color: 'Preto Stealth', size: 'P', stock: 5, sku: 'JQK-BLK-P', price: 299.90 },
          { color: 'Preto Stealth', size: 'M', stock: 10, sku: 'JQK-BLK-M', price: 299.90 },
          { color: 'Preto Stealth', size: 'G', stock: 8, sku: 'JQK-BLK-G', price: 299.90 },
          { color: 'Preto Stealth', size: 'GG', stock: 4, sku: 'JQK-BLK-GG', price: 319.90 },
          { color: 'Verde Oliva', size: 'P', stock: 3, sku: 'JQK-GRN-P', price: 299.90 },
          { color: 'Verde Oliva', size: 'M', stock: 5, sku: 'JQK-GRN-M', price: 299.90 }
        ]
      }
    }
  });

  // --- PRODUTO 2: Calçado (Numeração 38 ao 44) ---
  await prisma.product.upsert({
    where: { slug: 'bota-tatica-assault-goretex' },
    update: {},
    create: {
      title: 'Bota Tática Assault Gore-Tex Waterproof',
      slug: 'bota-tatica-assault-goretex',
      description: 'Bota militar de alta durabilidade com membrana Gore-Tex impermeável e solado antiderrapante vibram.',
      price: 799.00,
      promoPrice: 649.00,
      stock: 42,
      isBestseller: true,
      categoryId: catCalcados.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', type: 'IMAGE', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800', type: 'IMAGE', color: 'Coyote Tan' }
        ]
      },
      variants: {
        create: [
          { color: 'Preto Ops', size: '39', stock: 6, sku: 'BOT-BLK-39' },
          { color: 'Preto Ops', size: '40', stock: 10, sku: 'BOT-BLK-40' },
          { color: 'Preto Ops', size: '41', stock: 8, sku: 'BOT-BLK-41' },
          { color: 'Preto Ops', size: '42', stock: 6, sku: 'BOT-BLK-42' },
          { color: 'Coyote Tan', size: '40', stock: 5, sku: 'BOT-TAN-40' },
          { color: 'Coyote Tan', size: '41', stock: 7, sku: 'BOT-TAN-41' }
        ]
      }
    }
  });

  // --- PRODUTO 3: Cinto (Medidas em Centímetros 85cm a 120cm) ---
  await prisma.product.upsert({
    where: { slug: 'cinto-tatico-operacional-cobra-buckle' },
    update: {},
    create: {
      title: 'Cinto Tático Operacional Cobra Buckle',
      slug: 'cinto-tatico-operacional-cobra-buckle',
      description: 'Cinto de guarnição em nylon 1000D com fivela de engate rápido Cobra em alumínio de aviação.',
      price: 189.90,
      promoPrice: 149.90,
      stock: 50,
      isBestseller: false,
      categoryId: catCintos.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800', type: 'IMAGE', isPrimary: true }
        ]
      },
      variants: {
        create: [
          { color: 'Preto', size: '85cm', stock: 10, sku: 'CNT-BLK-85' },
          { color: 'Preto', size: '95cm', stock: 15, sku: 'CNT-BLK-95' },
          { color: 'Preto', size: '105cm', stock: 12, sku: 'CNT-BLK-105' },
          { color: 'Preto', size: '120cm', stock: 8, sku: 'CNT-BLK-120' },
          { color: 'Kevlar Tan', size: '95cm', stock: 5, sku: 'CNT-TAN-95' }
        ]
      }
    }
  });

  // --- PRODUTO 4: Corda (Medidas em Metros 5m, 10m, 50m) ---
  await prisma.product.upsert({
    where: { slug: 'corda-estatica-resgate-105mm' },
    update: {},
    create: {
      title: 'Corda Estática de Resgate & Rapel 10.5mm Kletter',
      slug: 'corda-estatica-resgate-105mm',
      description: 'Corda de alta tenacidade certificada EN 1891 Tipo A para rapel, resgate vertical e trabalho em altura.',
      price: 15.90,
      promoPrice: 12.90,
      stock: 120,
      isBestseller: false,
      categoryId: catCordas.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800', type: 'IMAGE', isPrimary: true }
        ]
      },
      variants: {
        create: [
          { color: 'Amarelo Laranja', size: '5m', stock: 20, sku: 'CRD-YEL-5M', price: 64.50 },
          { color: 'Amarelo Laranja', size: '10m', stock: 15, sku: 'CRD-YEL-10M', price: 129.00 },
          { color: 'Amarelo Laranja', size: '20m', stock: 10, sku: 'CRD-YEL-20M', price: 249.00 },
          { color: 'Amarelo Laranja', size: '50m', stock: 5, sku: 'CRD-YEL-50M', price: 599.00 }
        ]
      }
    }
  });

  // --- PRODUTO 5: Toalha Bordada (SOB ENCOMENDA - 5 Dias de Produção) ---
  await prisma.product.upsert({
    where: { slug: 'jogo-toalhas-bordadas-personalizadas-brasao' },
    update: {},
    create: {
      title: 'Jogo de Toalhas Bordadas Personalizadas com Brasão',
      slug: 'jogo-toalhas-bordadas-personalizadas-brasao',
      description: 'Jogo de toalhas de banho e rosto banhão em algodão egípcio com bordado personalizado sob encomenda (iniciais ou brasão).',
      price: 249.90,
      promoPrice: 199.90,
      stock: 100,
      isBestseller: true,
      isMadeToOrder: true,
      productionDays: 5, // 5 dias úteis de produção
      categoryId: catEncomendas.id,
      media: {
        create: [
          { url: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=800', type: 'IMAGE', isPrimary: true },
          { url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800', type: 'IMAGE', color: 'Bordado Dourado' }
        ]
      },
      variants: {
        create: [
          { color: 'Bordado Dourado', size: 'Toalha de Rosto (50x80cm)', stock: 50, sku: 'TLH-GLD-RST', price: 79.90 },
          { color: 'Bordado Dourado', size: 'Toalha Banhão (70x140cm)', stock: 30, sku: 'TLH-GLD-BNH', price: 149.90 },
          { color: 'Bordado Prata', size: 'Toalha Banhão (70x140cm)', stock: 20, sku: 'TLH-SLV-BNH', price: 149.90 }
        ]
      }
    }
  });

  console.log('🚀 Todos os Produtos e Categorias Demonstrativos foram criados com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro ao popular catálogo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
