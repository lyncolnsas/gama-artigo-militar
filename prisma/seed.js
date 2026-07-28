import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Semeando banco de dados completo do Gama Store com TODOS os produtos demo...');

  // 1. Criar Usuários Administradores & Gestores
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);

  // Configuração Padrão do WhatsApp Bot
  await prisma.botConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      isBotEnabled: true,
      whatsappNumber: '5511999998888',
      welcomeMessage: '🤖 *Atendimento Automático Gama Store*\n\nSeja bem-vindo ao nosso catálogo tático!\nComo posso te ajudar?\n\n1️⃣ Ver produtos mais vendidos\n2️⃣ Buscar produto por nome (ex: busca colete)\n3️⃣ Consultar status de pedido (ex: status GS-123456)\n4️⃣ Falar com atendente humano'
    }
  });

  await prisma.user.upsert({
    where: { email: 'admin@gamastore.com' },
    update: {},
    create: {
      name: 'Comandante Admin',
      email: 'admin@gamastore.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'manager@gamastore.com' },
    update: {},
    create: {
      name: 'Gerente Operacional',
      email: 'manager@gamastore.com',
      password: managerPassword,
      role: 'MANAGER'
    }
  });

  // 2. Criar Categorias
  const catColetes = await prisma.category.upsert({
    where: { slug: 'coletes-taticos' },
    update: {},
    create: {
      name: 'Coletes Táticos',
      slug: 'coletes-taticos',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      description: 'Porta placas balísticas e coletes modulares.'
    }
  });

  const catVestuario = await prisma.category.upsert({
    where: { slug: 'vestuario-tatico' },
    update: {},
    create: {
      name: 'Vestuário Tático',
      slug: 'vestuario-tatico',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      description: 'Camisetas, jaquetas impermeáveis e calças ripstop.'
    }
  });

  const catCalcados = await prisma.category.upsert({
    where: { slug: 'calcados-taticos' },
    update: {},
    create: {
      name: 'Calçados Táticos',
      slug: 'calcados-taticos',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
      description: 'Botas táticas impermeáveis de alta performance.'
    }
  });

  const catEquipamentos = await prisma.category.upsert({
    where: { slug: 'equipamentos-mochilas' },
    update: {},
    create: {
      name: 'Equipamentos & Mochilas',
      slug: 'equipamentos-mochilas',
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
      description: 'Mochilas táticas modulares e relógios de sobrevivência.'
    }
  });

  // 3. Criar Cupons de Desconto
  await prisma.coupon.upsert({
    where: { code: 'TACTICO5' },
    update: {},
    create: {
      code: 'TACTICO5',
      discountType: 'PERCENTAGE',
      value: 5,
      minSpend: 100,
      usageLimit: 500
    }
  });

  await prisma.coupon.upsert({
    where: { code: 'SUMMER20' },
    update: {},
    create: {
      code: 'SUMMER20',
      discountType: 'PERCENTAGE',
      value: 20,
      minSpend: 200,
      usageLimit: 100
    }
  });

  // 4. Criar TODAS as Seções do CMS (100% Editáveis)
  const cmsSections = [
    {
      sectionKey: 'TOPBAR',
      title: 'Atendimento: (+55) 11 99999-8888',
      subtitle: '★ Avaliação 4.9/5.0',
      buttonText: 'CUPOM: TACTICO5 (-5% OFF)'
    },
    {
      sectionKey: 'HEADER',
      title: 'TACTIKO',
      subtitle: 'GAMA STORE',
      buttonText: 'Tactical & Outdoor Gear'
    },
    {
      sectionKey: 'HERO_MAIN',
      title: 'COMBAT ESSENTIALS',
      subtitle: 'Tecnologia audiovisual e vestuário de nível militar testado em condições extremas.',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=80',
      buttonText: 'VIEW COLLECTION >',
      buttonLink: '#bestsellers',
      featuredLabel: '★ 50% OFF EM PRODUTOS SELECIONADOS'
    },
    {
      sectionKey: 'BESTSELLERS_HEADER',
      title: 'BESTSELLERS & CATÁLOGO',
      subtitle: 'Clique nos produtos para ver todas as especificações e selecionar tamanhos/medidas.'
    },
    {
      sectionKey: 'POPULAR_CATEGORIES',
      title: 'POPULAR CATEGORIES',
      subtitle: 'Navegue pelas nossas categorias principais de alta demanda.',
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80',
      buttonText: 'VER CATEGORIA >',
      buttonLink: '#bestsellers',
      featuredTitle: 'OUTERWEAR & PROTEÇÃO',
      featuredLabel: 'CATEGORIA DESTAQUE'
    },
    {
      sectionKey: 'VIDEO_FEATURE',
      title: 'TACTICAL EQUIPMENT AND MILITARY GEAR',
      subtitle: 'Desenvolvidos com base nos padrões mais exigentes das forças especiais. Nossos equipamentos combinam mobilidade, resistência balística e praticidade no campo de operação.',
      mediaType: 'YOUTUBE',
      mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      buttonText: 'EXPLORAR EQUIPAMENTOS >',
      buttonLink: '#bestsellers',
      featuredLabel: 'ENGENHARIA E RESISTÊNCIA MILITAR'
    },
    {
      sectionKey: 'WARRIOR_PROMO',
      title: 'WARRIOR ASSAULT SYSTEMS',
      subtitle: 'SUPER OFERTA LIMITADA • DESCONTOS EXCLUSIVOS DE ATÉ 50% OFF',
      buttonText: 'SHOP NOW >',
      buttonLink: '#bestsellers',
      featuredLabel: 'SUPER OFERTA LIMITADA'
    },
    {
      sectionKey: 'VALUE_PROPS',
      title: 'Por que escolher a Gama Store?',
      subtitle: 'ENVIO RÁPIDO|GARANTIA TOTAL|SUPORTE 24/7|QUALIDADE MILITAR',
      buttonText: 'Entrega garantida para todo o Brasil|30 dias para trocas e devoluções|Atendimento via WhatsApp e Bot|Produtos testados e homologados'
    },
    {
      sectionKey: 'FOOTER_CONTACT',
      title: 'TACTIKO / GAMA STORE',
      subtitle: 'Líder em vestuário e equipamentos táticos com atendimento 100% dinâmico via WhatsApp.',
      buttonText: 'WhatsApp: (+55) 11 99999-8888|Email: contato@gamastore.com.br|Segunda a Sexta: 08h às 18h',
      featuredTitle: 'NAVEGAÇÃO RÁPIDA',
      featuredLabel: 'ATENDIMENTO',
      navLinks: 'Home:#|Catálogo:#bestsellers|Categorias:#categorias|Ofertas Especiais:#promocao',
      secTitle: 'SEGURANÇA & PAGAMENTO',
      secText: 'Ambiente 100% seguro com criptografia de ponta a ponta.',
      paymentBadges: 'PIX|Cartão|Boleto',
      copyrightText: '© 2026 TACTIKO / GAMA STORE. Todos os direitos reservados.'
    }
  ];

  for (const s of cmsSections) {
    const { sectionKey, title, subtitle, mediaType, mediaUrl, buttonText, buttonLink, ...extraFields } = s;
    const contentData = Object.keys(extraFields).length > 0 ? JSON.stringify(extraFields) : null;

    await prisma.siteSection.upsert({
      where: { sectionKey },
      update: {
        title,
        subtitle,
        buttonText,
        buttonLink: buttonLink || '#bestsellers',
        mediaType: mediaType || 'IMAGE',
        mediaUrl: mediaUrl || '',
        contentData
      },
      create: {
        sectionKey,
        title,
        subtitle,
        buttonText,
        buttonLink: buttonLink || '#bestsellers',
        mediaType: mediaType || 'IMAGE',
        mediaUrl: mediaUrl || '',
        contentData
      }
    });
  }

  // 5. Criar TODOS os 8 Produtos Demo com Mídias
  const demoProducts = [
    {
      title: 'Colete Tático Carrier Plate Spec-Ops',
      slug: 'colete-tatico-carrier-plate-spec-ops',
      description: 'Colete porta placa balística com sistema Molle reforçado em Kevlar.',
      price: 870.22,
      promoPrice: 699.00,
      stock: 12,
      isBestseller: true,
      categoryId: catColetes.id,
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Camiseta Tactical Tank Long Sleeve',
      slug: 'camiseta-tactical-tank-long-sleeve',
      description: 'Camiseta de manga longa com tecido ripstop de secagem ultra rápida.',
      price: 219.00,
      promoPrice: 179.00,
      stock: 30,
      isBestseller: true,
      categoryId: catVestuario.id,
      mediaUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Colete Modular Plate Carrier Vest',
      slug: 'colete-modular-plate-carrier-vest',
      description: 'Estrutura ultra leve com acolchoamento respirável e desengate rápido.',
      price: 549.00,
      promoPrice: 439.00,
      stock: 15,
      isBestseller: true,
      categoryId: catColetes.id,
      mediaUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Bota Tática Combat Assault Gore-Tex',
      slug: 'bota-tatica-combat-assault-gore-tex',
      description: 'Solado com aderência multidirecional e membrana 100% impermeável.',
      price: 799.00,
      promoPrice: 649.00,
      stock: 9,
      isBestseller: true,
      categoryId: catCalcados.id,
      mediaUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Jaqueta Tactical Stealth Black',
      slug: 'jaqueta-tactical-stealth-black',
      description: 'Jaqueta impermeável com proteção térmica e múltiplos bolsos táticos.',
      price: 349.90,
      promoPrice: 299.90,
      stock: 25,
      isBestseller: true,
      categoryId: catVestuario.id,
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Mochila Modular 40L Pro',
      slug: 'mochila-modular-40l-pro',
      description: 'Mochila com sistema Molle, compartimento para notebook e material Cordura 1000D.',
      price: 279.00,
      promoPrice: 239.00,
      stock: 18,
      isBestseller: true,
      categoryId: catEquipamentos.id,
      mediaUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Relógio Tactical Force V2',
      slug: 'relogio-tactical-force-v2',
      description: 'Caixa em titânio, à prova dágua 200m e luz noturna de trítio.',
      price: 899.90,
      promoPrice: 749.00,
      stock: 8,
      isBestseller: false,
      categoryId: catEquipamentos.id,
      mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
    },
    {
      title: 'Smartwatch Pro GPS & Stealth',
      slug: 'smartwatch-pro-gps-stealth',
      description: 'Resistência militar MIL-STD-810H com sensores biométricos de alta precisão.',
      price: 1299.00,
      promoPrice: 1099.00,
      stock: 14,
      isBestseller: true,
      categoryId: catEquipamentos.id,
      mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
    }
  ];

  for (const prod of demoProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          title: prod.title,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          promoPrice: prod.promoPrice,
          stock: prod.stock,
          isBestseller: prod.isBestseller,
          categoryId: prod.categoryId,
          media: {
            create: [
              {
                type: 'IMAGE',
                url: prod.mediaUrl,
                isPrimary: true
              }
            ]
          }
        }
      });
    }
  }

  console.log('✅ Todos os 8 produtos demo semeados e vinculados ao Admin Panel!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
