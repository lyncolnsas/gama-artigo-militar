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

/**
 * Transforms the DB section record, merging contentData (JSON) back into the flat object.
 * This allows extra fields like featuredTitle, featuredLabel to be stored/retrieved seamlessly.
 */
function expandSection(section) {
  if (!section) return null;
  let extras = {};
  if (section.contentData) {
    try { extras = JSON.parse(section.contentData); } catch {}
  }
  return { ...section, ...extras };
}

export const getSections = async (req, res) => {
  try {
    const sections = await prisma.siteSection.findMany({
      orderBy: { sectionKey: 'asc' }
    });
    return res.json(sections.map(expandSection));
  } catch (error) {
    console.error('Erro ao listar seções:', error);
    return res.status(500).json({ error: 'Erro ao buscar seções do site.' });
  }
};

export const getSectionByKey = async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const section = await prisma.siteSection.findUnique({
      where: { sectionKey }
    });

    if (!section) {
      return res.status(404).json({ error: 'Seção não encontrada.' });
    }

    return res.json(expandSection(section));
  } catch (error) {
    console.error('Erro ao buscar seção:', error);
    return res.status(500).json({ error: 'Erro ao buscar seção do site.' });
  }
};

export const upsertSection = async (req, res) => {
  try {
    const { sectionKey, title, subtitle, mediaType, mediaUrl, buttonText, buttonLink, isActive, ...extraFields } = req.body;

    if (!sectionKey) {
      return res.status(400).json({ error: 'sectionKey é obrigatório.' });
    }

    // Sections without media (TOPBAR, VALUE_PROPS, FOOTER_CONTACT) use empty string
    const safeMediaUrl = mediaUrl || '';
    const calculatedMediaType = inferMediaType(safeMediaUrl, mediaType);

    // Strip system fields and raw contentData from extraFields to prevent exponential nesting
    delete extraFields.id;
    delete extraFields.createdAt;
    delete extraFields.updatedAt;
    delete extraFields.contentData;

    // Store any extra fields (featuredTitle, featuredLabel, etc.) in contentData as JSON
    const contentData = Object.keys(extraFields).length > 0 ? JSON.stringify(extraFields) : null;

    const section = await prisma.siteSection.upsert({
      where: { sectionKey },
      update: {
        title,
        subtitle,
        mediaType: calculatedMediaType,
        mediaUrl: safeMediaUrl,
        buttonText,
        buttonLink,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        contentData
      },
      create: {
        sectionKey,
        title,
        subtitle,
        mediaType: calculatedMediaType,
        mediaUrl: safeMediaUrl,
        buttonText,
        buttonLink,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        contentData
      }
    });

    return res.status(200).json(expandSection(section));
  } catch (error) {
    console.error('Erro ao salvar seção:', error);
    return res.status(500).json({ error: 'Erro ao atualizar seção do site.' });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.siteSection.delete({ where: { id } });
    return res.json({ message: 'Seção removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover seção:', error);
    return res.status(500).json({ error: 'Erro ao deletar seção do site.' });
  }
};
