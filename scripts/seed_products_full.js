/**
 * seed_products_full.js
 * Script de seed completo para Camisas, Tênis e Cintos
 * com variantes, fotos locais e informações precisas.
 * 
 * Executar: node scripts/seed_products_full.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ---- Helpers ----
function slug(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function getOrCreateCategory(name, image, description) {
  const s = slug(name);
  return prisma.category.upsert({
    where: { slug: s },
    update: { image, description },
    create: { name, slug: s, image, description }
  });
}

async function createProduct(data) {
  const { title, description, price, promoPrice, stock, isBestseller, categoryId, media, variants } = data;
  const s = slug(title) + '-' + Date.now();

  const product = await prisma.product.upsert({
    where: { slug: s },
    update: {},
    create: {
      title,
      slug: s,
      description,
      price,
      promoPrice: promoPrice || null,
      stock: stock || 0,
      isBestseller: isBestseller || false,
      categoryId,
      media: { create: media },
      variants: { create: variants || [] }
    }
  });

  return product;
}

async function main() {
  console.log('🌱 Iniciando seed de Camisas, Tênis e Cintos...\n');

  // === CATEGORIAS ===
  const catCamisas = await getOrCreateCategory(
    'Camisas & Vestuário',
    '/uploads/camisa-tatica-drfit-preta.jpg',
    'Camisas táticas, polos e vestuário de alto desempenho para uso operacional e urbano.'
  );

  const catTenis = await getOrCreateCategory(
    'Calçados & Botas Táticas',
    '/uploads/tenis-low-urban-preto.jpg',
    'Tênis, botas e calçados táticos para operações urbanas e de campo.'
  );

  const catCintos = await getOrCreateCategory(
    'Cintos & Fardamentos',
    '/uploads/cinto-tatico-molle-preto.jpg',
    'Cintos táticos em couro e nylon, sistemas MOLLE e fardamentos operacionais.'
  );

  console.log(`✅ Categorias criadas: ${catCamisas.name}, ${catTenis.name}, ${catCintos.name}`);

  // =========================================================
  // GRUPO 1: CAMISAS
  // =========================================================

  // --- 1.1 Camisa Tática Dry-Fit Combat (Cor Única, 4 Tamanhos) ---
  const camisa1Preto = await createProduct({
    title: 'Camisa Tática Dry-Fit Combat Preta',
    description: 'Camisa tática de alta performance confeccionada em tecido Dry-Fit 100% poliéster com tecnologia de absorção e evaporação de suor. Ideal para operações em campo, treinos físicos e uso diário em condições adversas. Corte anatomicamente projetado para mobilidade máxima. Gola redonda reforçada, costuras duplas e tecido anti-pilling. Proteção UV Fator 50+.',
    price: 129.90,
    promoPrice: 99.90,
    stock: 0,
    isBestseller: true,
    categoryId: catCamisas.id,
    media: [
      { url: '/uploads/camisa-tatica-drfit-preta.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto' },
      { url: '/uploads/camisa-tatica-drfit-verde.jpg', type: 'IMAGE', isPrimary: false, color: 'Verde Oliva' },
    ],
    variants: [
      // Preto
      { color: 'Preto', size: 'P', stock: 15, sku: 'CAM-TAT-P-P', price: 129.90 },
      { color: 'Preto', size: 'M', stock: 20, sku: 'CAM-TAT-P-M', price: 129.90 },
      { color: 'Preto', size: 'G', stock: 18, sku: 'CAM-TAT-P-G', price: 129.90 },
      { color: 'Preto', size: 'GG', stock: 10, sku: 'CAM-TAT-P-GG', price: 129.90 },
      // Verde Oliva
      { color: 'Verde Oliva', size: 'P', stock: 12, sku: 'CAM-TAT-VO-P', price: 129.90 },
      { color: 'Verde Oliva', size: 'M', stock: 18, sku: 'CAM-TAT-VO-M', price: 129.90 },
      { color: 'Verde Oliva', size: 'G', stock: 16, sku: 'CAM-TAT-VO-G', price: 129.90 },
      { color: 'Verde Oliva', size: 'GG', stock: 8, sku: 'CAM-TAT-VO-GG', price: 129.90 },
      // Tan / Areia
      { color: 'Tan', size: 'P', stock: 10, sku: 'CAM-TAT-T-P', price: 129.90 },
      { color: 'Tan', size: 'M', stock: 14, sku: 'CAM-TAT-T-M', price: 129.90 },
      { color: 'Tan', size: 'G', stock: 12, sku: 'CAM-TAT-T-G', price: 129.90 },
      { color: 'Tan', size: 'GG', stock: 6, sku: 'CAM-TAT-T-GG', price: 129.90 },
    ]
  });

  // --- 1.2 Camisa Polo Ranger Premium ---
  const camisa2 = await createProduct({
    title: 'Camisa Polo Ranger Premium',
    description: 'Polo de alto padrão em Piqué de algodão 100% penteado com tecido respirável e durável. Estilo operacional com três botões na gola e corte regular fit. Indica uso profissional, treinos, uso tático urbano e atividades ao ar livre. Disponível em 3 cores sóbrias com acabamento premium. Tolerância à lavagem industrial.',
    price: 189.90,
    promoPrice: null,
    stock: 0,
    isBestseller: false,
    categoryId: catCamisas.id,
    media: [
      { url: '/uploads/camisa-polo-premium-preta.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto' },
      { url: '/uploads/camisa-polo-premium-azul.jpg', type: 'IMAGE', isPrimary: false, color: 'Azul Marinho' },
    ],
    variants: [
      // Preto
      { color: 'Preto', size: 'P', stock: 10, sku: 'POL-RNG-P-P', price: 189.90 },
      { color: 'Preto', size: 'M', stock: 14, sku: 'POL-RNG-P-M', price: 189.90 },
      { color: 'Preto', size: 'G', stock: 12, sku: 'POL-RNG-P-G', price: 189.90 },
      { color: 'Preto', size: 'GG', stock: 8, sku: 'POL-RNG-P-GG', price: 189.90 },
      { color: 'Preto', size: 'XGG', stock: 4, sku: 'POL-RNG-P-XGG', price: 199.90 },
      // Azul Marinho
      { color: 'Azul Marinho', size: 'P', stock: 8, sku: 'POL-RNG-AM-P', price: 189.90 },
      { color: 'Azul Marinho', size: 'M', stock: 12, sku: 'POL-RNG-AM-M', price: 189.90 },
      { color: 'Azul Marinho', size: 'G', stock: 10, sku: 'POL-RNG-AM-G', price: 189.90 },
      { color: 'Azul Marinho', size: 'GG', stock: 6, sku: 'POL-RNG-AM-GG', price: 189.90 },
      // Branco Artico
      { color: 'Branco', size: 'P', stock: 6, sku: 'POL-RNG-B-P', price: 189.90 },
      { color: 'Branco', size: 'M', stock: 10, sku: 'POL-RNG-B-M', price: 189.90 },
      { color: 'Branco', size: 'G', stock: 8, sku: 'POL-RNG-B-G', price: 189.90 },
      { color: 'Branco', size: 'GG', stock: 4, sku: 'POL-RNG-B-GG', price: 189.90 },
    ]
  });

  // --- 1.3 Camisa Social Manga Longa Field ---
  const camisa3 = await createProduct({
    title: 'Camisa Manga Longa Field Operator',
    description: 'Camisa de manga longa no estilo field shirt, confeccionada em ripstop 60% algodão e 40% poliéster. Resistente a rasgos e abrasões. Dois bolsos frontais com fechamento por velcro, alça de fixação nas mangas e gola com botão superior. Ideal para missões de campo prolongadas, trilhas, operações em mata e uso diário robusto. Proteção UV Fator 30+. Lavável na máquina.',
    price: 259.90,
    promoPrice: 219.90,
    stock: 0,
    isBestseller: true,
    categoryId: catCamisas.id,
    media: [
      { url: '/uploads/camisa-social-manga-longa-khaki.jpg', type: 'IMAGE', isPrimary: true, color: 'Khaki' },
      { url: '/uploads/camisa-social-manga-longa-preta.jpg', type: 'IMAGE', isPrimary: false, color: 'Preto' },
    ],
    variants: [
      // Khaki
      { color: 'Khaki', size: 'P', stock: 8, sku: 'SHT-FLD-KH-P', price: 259.90 },
      { color: 'Khaki', size: 'M', stock: 12, sku: 'SHT-FLD-KH-M', price: 259.90 },
      { color: 'Khaki', size: 'G', stock: 10, sku: 'SHT-FLD-KH-G', price: 259.90 },
      { color: 'Khaki', size: 'GG', stock: 6, sku: 'SHT-FLD-KH-GG', price: 259.90 },
      // Preto
      { color: 'Preto', size: 'P', stock: 6, sku: 'SHT-FLD-P-P', price: 259.90 },
      { color: 'Preto', size: 'M', stock: 10, sku: 'SHT-FLD-P-M', price: 259.90 },
      { color: 'Preto', size: 'G', stock: 8, sku: 'SHT-FLD-P-G', price: 259.90 },
      { color: 'Preto', size: 'GG', stock: 4, sku: 'SHT-FLD-P-GG', price: 259.90 },
      // MultiCam
      { color: 'MultiCam', size: 'P', stock: 5, sku: 'SHT-FLD-MC-P', price: 279.90 },
      { color: 'MultiCam', size: 'M', stock: 8, sku: 'SHT-FLD-MC-M', price: 279.90 },
      { color: 'MultiCam', size: 'G', stock: 6, sku: 'SHT-FLD-MC-G', price: 279.90 },
      { color: 'MultiCam', size: 'GG', stock: 3, sku: 'SHT-FLD-MC-GG', price: 279.90 },
    ]
  });

  console.log(`✅ Camisas criadas: ${camisa1Preto.title} | ${camisa2.title} | ${camisa3.title}`);

  // =========================================================
  // GRUPO 2: TÊNIS
  // =========================================================

  // --- 2.1 Tênis Low Urban Force ---
  const tenis1 = await createProduct({
    title: 'Tênis Tático Low Urban Force',
    description: 'Tênis urbano de baixo perfil com sola de borracha vulcanizada antiderrapante. Cabedal em canvas reforçado com palmilha EVA ortopédica removível. Biqueira com proteção reforçada, amortecimento de gel no calcanhar e lateral. Sistema de cadarço duplo e ilhoses metálicos resistentes. Ideal para uso operacional urbano, patrulha motorizada e uso diário. Leve e confortável para deslocamentos prolongados.',
    price: 349.90,
    promoPrice: 289.90,
    stock: 0,
    isBestseller: true,
    categoryId: catTenis.id,
    media: [
      { url: '/uploads/tenis-low-urban-preto.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto' },
      { url: '/uploads/tenis-low-urban-cinza.jpg', type: 'IMAGE', isPrimary: false, color: 'Cinza' },
    ],
    variants: [
      // Preto - numeração 37 a 45
      ...['37', '38', '39', '40', '41', '42', '43', '44', '45'].map((num, i) => ({
        color: 'Preto',
        size: `${num}`,
        stock: [6, 10, 14, 18, 18, 16, 12, 8, 4][i],
        sku: `TNS-LU-P-${num}`,
        price: 349.90
      })),
      // Cinza - numeração 37 a 45
      ...['37', '38', '39', '40', '41', '42', '43', '44', '45'].map((num, i) => ({
        color: 'Cinza',
        size: `${num}`,
        stock: [4, 8, 10, 12, 14, 12, 10, 6, 2][i],
        sku: `TNS-LU-CZ-${num}`,
        price: 349.90
      })),
    ]
  });

  // --- 2.2 Tênis Trail Runner Assault X ---
  const tenis2 = await createProduct({
    title: 'Tênis Trail Runner Assault X',
    description: 'Tênis para trilha e terreno irregular com tecnologia de entressola TPU dupla densidade para máximo amortecimento em terrenos acidentados. Sola de borracha continental com estrias profundas antiderrapantes. Cabedal em mesh respirável com overlay de TPU para proteção e suporte lateral. Sistema de cadarço rápido com trava de tensão. Impermeável parcial. Resistente a lama, pedra e detritos.',
    price: 429.90,
    promoPrice: null,
    stock: 0,
    isBestseller: false,
    categoryId: catTenis.id,
    media: [
      { url: '/uploads/tenis-trail-assault-preto-laranja.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto/Laranja' },
      { url: '/uploads/tenis-trail-assault-verde.jpg', type: 'IMAGE', isPrimary: false, color: 'Verde/Preto' },
    ],
    variants: [
      // Preto/Laranja
      ...['38', '39', '40', '41', '42', '43', '44'].map((num, i) => ({
        color: 'Preto/Laranja',
        size: `${num}`,
        stock: [6, 8, 12, 15, 14, 10, 5][i],
        sku: `TNS-TR-PL-${num}`,
        price: 429.90
      })),
      // Verde/Preto
      ...['38', '39', '40', '41', '42', '43', '44'].map((num, i) => ({
        color: 'Verde/Preto',
        size: `${num}`,
        stock: [4, 6, 8, 10, 10, 8, 4][i],
        sku: `TNS-TR-VP-${num}`,
        price: 429.90
      })),
      // Cinza/Azul
      ...['38', '39', '40', '41', '42', '43', '44'].map((num, i) => ({
        color: 'Cinza/Azul',
        size: `${num}`,
        stock: [3, 5, 6, 8, 8, 6, 3][i],
        sku: `TNS-TR-CA-${num}`,
        price: 449.90
      })),
    ]
  });

  // --- 2.3 Tênis Running Combat Speed ---
  const tenis3 = await createProduct({
    title: 'Tênis Running Combat Speed Pro',
    description: 'Tênis de corrida de alta performance com entressola em espuma React para retorno de energia e amortecimento superior. Cabedal em Flyknit de malha fina para respirabilidade extrema e ajuste como uma segunda pele. Sola plana de borracha com patterning de fricção. Ideal para corridas de rua, treinamentos funcionais e provas militares de aptidão física (TAF). Peso: 280g (n°41).',
    price: 519.90,
    promoPrice: 449.90,
    stock: 0,
    isBestseller: true,
    categoryId: catTenis.id,
    media: [
      { url: '/uploads/tenis-running-combat-branco.jpg', type: 'IMAGE', isPrimary: true, color: 'Branco/Prata' },
      { url: '/uploads/tenis-running-combat-vermelho.jpg', type: 'IMAGE', isPrimary: false, color: 'Preto/Vermelho' },
    ],
    variants: [
      // Branco/Prata
      ...['37', '38', '39', '40', '41', '42', '43', '44', '45'].map((num, i) => ({
        color: 'Branco/Prata',
        size: `${num}`,
        stock: [5, 8, 12, 16, 18, 14, 10, 6, 3][i],
        sku: `TNS-RN-BS-${num}`,
        price: 519.90
      })),
      // Preto/Vermelho
      ...['37', '38', '39', '40', '41', '42', '43', '44', '45'].map((num, i) => ({
        color: 'Preto/Vermelho',
        size: `${num}`,
        stock: [4, 6, 10, 14, 16, 12, 8, 5, 2][i],
        sku: `TNS-RN-PV-${num}`,
        price: 519.90
      })),
    ]
  });

  console.log(`✅ Tênis criados: ${tenis1.title} | ${tenis2.title} | ${tenis3.title}`);

  // =========================================================
  // GRUPO 3: CINTOS
  // =========================================================

  // --- 3.1 Cinto Tático Operacional MOLLE ---
  const cinto1 = await createProduct({
    title: 'Cinto Tático Operacional MOLLE QR',
    description: 'Cinto tático de nylon balistico 1.000D com sistema MOLLE lateral para fixação de poaches e acessórios táticos. Fivela de liberação rápida (Quick Release) em polímero reforçado com alumínio. Largura de 4,5cm. Velcro de alta resistência no interior para fixação de inner belt. Suporta até 150kg de carga. Compatível com inner belt holsters e sistemas de suspensão. Indicado para uso operacional, airsoft e artes marciais de combate.',
    price: 189.90,
    promoPrice: 149.90,
    stock: 0,
    isBestseller: true,
    categoryId: catCintos.id,
    media: [
      { url: '/uploads/cinto-tatico-molle-preto.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto' },
      { url: '/uploads/cinto-tatico-molle-coyote.jpg', type: 'IMAGE', isPrimary: false, color: 'Coyote Tan' },
    ],
    variants: [
      // Preto - medidas em cm
      { color: 'Preto', size: '85cm', stock: 12, sku: 'CNT-ML-P-85', price: 189.90 },
      { color: 'Preto', size: '90cm', stock: 14, sku: 'CNT-ML-P-90', price: 189.90 },
      { color: 'Preto', size: '95cm', stock: 16, sku: 'CNT-ML-P-95', price: 189.90 },
      { color: 'Preto', size: '100cm', stock: 16, sku: 'CNT-ML-P-100', price: 189.90 },
      { color: 'Preto', size: '105cm', stock: 14, sku: 'CNT-ML-P-105', price: 189.90 },
      { color: 'Preto', size: '110cm', stock: 10, sku: 'CNT-ML-P-110', price: 189.90 },
      { color: 'Preto', size: '115cm', stock: 8, sku: 'CNT-ML-P-115', price: 189.90 },
      { color: 'Preto', size: '120cm', stock: 5, sku: 'CNT-ML-P-120', price: 189.90 },
      // Coyote Tan
      { color: 'Coyote Tan', size: '85cm', stock: 8, sku: 'CNT-ML-CT-85', price: 189.90 },
      { color: 'Coyote Tan', size: '90cm', stock: 10, sku: 'CNT-ML-CT-90', price: 189.90 },
      { color: 'Coyote Tan', size: '95cm', stock: 12, sku: 'CNT-ML-CT-95', price: 189.90 },
      { color: 'Coyote Tan', size: '100cm', stock: 12, sku: 'CNT-ML-CT-100', price: 189.90 },
      { color: 'Coyote Tan', size: '105cm', stock: 10, sku: 'CNT-ML-CT-105', price: 189.90 },
      { color: 'Coyote Tan', size: '110cm', stock: 7, sku: 'CNT-ML-CT-110', price: 189.90 },
      { color: 'Coyote Tan', size: '115cm', stock: 5, sku: 'CNT-ML-CT-115', price: 189.90 },
      { color: 'Coyote Tan', size: '120cm', stock: 3, sku: 'CNT-ML-CT-120', price: 189.90 },
      // OD Green
      { color: 'OD Green', size: '85cm', stock: 6, sku: 'CNT-ML-OD-85', price: 189.90 },
      { color: 'OD Green', size: '90cm', stock: 8, sku: 'CNT-ML-OD-90', price: 189.90 },
      { color: 'OD Green', size: '95cm', stock: 10, sku: 'CNT-ML-OD-95', price: 189.90 },
      { color: 'OD Green', size: '100cm', stock: 10, sku: 'CNT-ML-OD-100', price: 189.90 },
      { color: 'OD Green', size: '105cm', stock: 8, sku: 'CNT-ML-OD-105', price: 189.90 },
      { color: 'OD Green', size: '110cm', stock: 5, sku: 'CNT-ML-OD-110', price: 189.90 },
    ]
  });

  // --- 3.2 Cinto Couro Premium Ranger ---
  const cinto2 = await createProduct({
    title: 'Cinto Couro Genuíno Premium Ranger',
    description: 'Cinto em couro bovino genuíno grão pleno, acabamento envernizado e costura dupla lateral em linha encerada. Fivela em aço inox escovado 316L resistente à corrosão. Largura de 3,5cm x espessura de 4mm. Compatível com calças sociais, jeans, cargos e uniformes. Bordas polidas e tratadas com cera de carnaúba para durabilidade. Perfurado em 7 posições a cada 2,5cm. Produto artesanal com garantia de 2 anos.',
    price: 229.90,
    promoPrice: null,
    stock: 0,
    isBestseller: false,
    categoryId: catCintos.id,
    media: [
      { url: '/uploads/cinto-couro-premium-preto.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto' },
      { url: '/uploads/cinto-couro-premium-marrom.jpg', type: 'IMAGE', isPrimary: false, color: 'Marrom' },
    ],
    variants: [
      // Preto - medidas em cm (cintura)
      { color: 'Preto', size: '85cm', stock: 10, sku: 'CNT-CR-P-85', price: 229.90 },
      { color: 'Preto', size: '90cm', stock: 12, sku: 'CNT-CR-P-90', price: 229.90 },
      { color: 'Preto', size: '95cm', stock: 14, sku: 'CNT-CR-P-95', price: 229.90 },
      { color: 'Preto', size: '100cm', stock: 14, sku: 'CNT-CR-P-100', price: 229.90 },
      { color: 'Preto', size: '105cm', stock: 10, sku: 'CNT-CR-P-105', price: 229.90 },
      { color: 'Preto', size: '110cm', stock: 6, sku: 'CNT-CR-P-110', price: 229.90 },
      { color: 'Preto', size: '115cm', stock: 4, sku: 'CNT-CR-P-115', price: 229.90 },
      // Marrom Sela
      { color: 'Marrom', size: '85cm', stock: 8, sku: 'CNT-CR-M-85', price: 229.90 },
      { color: 'Marrom', size: '90cm', stock: 10, sku: 'CNT-CR-M-90', price: 229.90 },
      { color: 'Marrom', size: '95cm', stock: 12, sku: 'CNT-CR-M-95', price: 229.90 },
      { color: 'Marrom', size: '100cm', stock: 12, sku: 'CNT-CR-M-100', price: 229.90 },
      { color: 'Marrom', size: '105cm', stock: 8, sku: 'CNT-CR-M-105', price: 229.90 },
      { color: 'Marrom', size: '110cm', stock: 5, sku: 'CNT-CR-M-110', price: 229.90 },
      { color: 'Marrom', size: '115cm', stock: 3, sku: 'CNT-CR-M-115', price: 229.90 },
      // Cognac (marrom avermelhado)
      { color: 'Cognac', size: '85cm', stock: 5, sku: 'CNT-CR-CO-85', price: 249.90 },
      { color: 'Cognac', size: '90cm', stock: 7, sku: 'CNT-CR-CO-90', price: 249.90 },
      { color: 'Cognac', size: '95cm', stock: 8, sku: 'CNT-CR-CO-95', price: 249.90 },
      { color: 'Cognac', size: '100cm', stock: 8, sku: 'CNT-CR-CO-100', price: 249.90 },
      { color: 'Cognac', size: '105cm', stock: 6, sku: 'CNT-CR-CO-105', price: 249.90 },
      { color: 'Cognac', size: '110cm', stock: 3, sku: 'CNT-CR-CO-110', price: 249.90 },
    ]
  });

  // --- 3.3 Cinto Nylon Web Militar D-Ring ---
  const cinto3 = await createProduct({
    title: 'Cinto Nylon Web Militar D-Ring Ajustável',
    description: 'Cinto em nylon tissado de alta resistência (webbing 1.500D) com fivela D-Ring dupla em aço carbono zincado anti-ferrugem. Largura de 3,8cm. Sistema de ajuste por deslizamento contínuo sem necessidade de furos — adapta-se a qualquer cintura. Comprimento total: 130cm (ajustável). Suporta carga de até 200kg. Muito utilizado em treinamentos militares, escalada, rappel leve e equipamentos táticos. Lavável na máquina.',
    price: 89.90,
    promoPrice: 69.90,
    stock: 0,
    isBestseller: false,
    categoryId: catCintos.id,
    media: [
      { url: '/uploads/cinto-nylon-web-preto.jpg', type: 'IMAGE', isPrimary: true, color: 'Preto' },
      { url: '/uploads/cinto-nylon-web-verde.jpg', type: 'IMAGE', isPrimary: false, color: 'Verde OD' },
    ],
    variants: [
      // Ajustável - tamanho único por cor, diferentes larguras
      { color: 'Preto', size: 'Ajustável (70-120cm)', stock: 25, sku: 'CNT-NY-P-AJ', price: 89.90 },
      { color: 'Verde OD', size: 'Ajustável (70-120cm)', stock: 20, sku: 'CNT-NY-OD-AJ', price: 89.90 },
      { color: 'Coyote', size: 'Ajustável (70-120cm)', stock: 15, sku: 'CNT-NY-CT-AJ', price: 89.90 },
      { color: 'Ranger Green', size: 'Ajustável (70-120cm)', stock: 12, sku: 'CNT-NY-RG-AJ', price: 89.90 },
      { color: 'MultiCam', size: 'Ajustável (70-120cm)', stock: 8, sku: 'CNT-NY-MC-AJ', price: 99.90 },
    ]
  });

  console.log(`✅ Cintos criados: ${cinto1.title} | ${cinto2.title} | ${cinto3.title}`);

  console.log('\n🎉 SEED COMPLETO!');
  console.log(`   - 3 Camisas com variantes de cor + tamanho P/M/G/GG`);
  console.log(`   - 3 Tênis com variantes de cor + numeração 37-45`);
  console.log(`   - 3 Cintos com variantes de cor + medidas em centímetros`);
  console.log(`   Total: 9 produtos, ~160 variantes, mídias locais`);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ ERRO:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
