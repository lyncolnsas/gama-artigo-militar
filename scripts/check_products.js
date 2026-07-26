import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { OR: [
    { title: { contains: 'Camisa' }},
    { title: { contains: 'Tênis' }},
    { title: { contains: 'Cinto' }},
    { title: { contains: 'Polo' }},
    { title: { contains: 'Manga' }},
    { title: { contains: 'Running' }},
    { title: { contains: 'Trail' }},
    { title: { contains: 'Urban' }},
    { title: { contains: 'Couro' }},
    { title: { contains: 'Nylon' }},
  ]},
  include: { media: true, variants: { take: 4 } }
});

for (const p of products) {
  console.log('\n📦', p.title);
  console.log('   Mídia:', p.media.map(m => m.url.split('/').pop() + (m.color ? '['+m.color+']' : '')).join(' | '));
  console.log('   Variantes:', p.variants.map(v => `${v.color} ${v.size}(${v.stock}un)`).join(', '));
}

console.log('\nTotal produtos:', products.length);
await prisma.$disconnect();
