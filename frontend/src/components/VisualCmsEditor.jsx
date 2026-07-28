import React, { useState, useEffect } from 'react';
import MediaPickerModal from './MediaPickerModal';
import MediaViewer from './MediaViewer';
import StoreFront from './StoreFront';
import {
  Sparkles, Save, Edit, HardDriveUpload, Check, X, Upload, Image as ImageIcon, Film, FolderTree
} from 'lucide-react';

const SECTION_KEYS = [
  { key: 'TOPBAR',             label: '📢 BARRA TOPO'       },
  { key: 'HEADER',             label: '🪖 LOGO / NAVEGAÇÃO' },
  { key: 'HERO_MAIN',          label: '🏔️ HERO PRINCIPAL'   },
  { key: 'BESTSELLERS_HEADER', label: '🔥 CATÁLOGO DESTAQUES' },
  { key: 'WARRIOR_PROMO',      label: '💰 PROMO BANNER'     },
  { key: 'POPULAR_CATEGORIES', label: '🗂️ CATEGORIAS'       },
  { key: 'VIDEO_FEATURE',      label: '🎥 VÍDEO FEATURE'    },
  { key: 'VALUE_PROPS',        label: '✅ DIFERENCIAIS'      },
  { key: 'FOOTER_CONTACT',     label: '📍 RODAPÉ / CONTATO' },
];

export default function VisualCmsEditor({
  sections,
  categories = [],
  products = [],
  authHeader,
  showNotification,
  onSectionSaved,
  mediaLibrary,
  onUpload,
  uploading,
  onDelete,
}) {
  const [activeKey, setActiveKey] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // Triggered when a section's edit button is clicked inside StoreFront
  const handleEditSection = (sectionKey) => {
    setActiveKey(sectionKey);
    const found = sections.find(s => s.sectionKey === sectionKey);
    if (found) {
      setForm({ ...found });
    } else {
      setForm({
        sectionKey,
        title: '', subtitle: '', mediaType: 'IMAGE', mediaUrl: '', buttonText: '', buttonLink: '', featuredTitle: '', featuredLabel: '', isActive: true
      });
    }
    setHasUnsaved(false);
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasUnsaved(true);
  };

  const handleSelectMedia = (url, type = 'IMAGE') => {
    updateField('mediaUrl', url);
    updateField('mediaType', type);
    setIsMediaOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showNotification(`Seção "${form.sectionKey}" salva com sucesso!`);
        setHasUnsaved(false);
        setActiveKey(null); // Fecha o modal após salvar
        if (onSectionSaved) onSectionSaved();
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.error || errData.message || 'Erro ao salvar seção.', 'error');
      }
    } catch {
      showNotification('Erro de conexão com o servidor.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeSectionLabel = SECTION_KEYS.find(s => s.key === activeKey)?.label || activeKey;

  return (
    <div className="relative bg-[#0f1115] h-[calc(100vh-140px)] rounded-lg overflow-hidden border border-gray-800 flex flex-col">
      
      {/* Cms Header Sticky Toolbar */}
      <div className="z-50 bg-[#171a21]/95 backdrop-blur border-b border-tactical-gold/40 p-4 shadow-2xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tactical-gold text-black rounded-md font-bold animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-tactical text-xl sm:text-2xl font-bold text-tactical-gold leading-none">
              EDITOR VISUAL INLINE (WYSIWYG)
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-300 mt-1">
              Navegue pela loja abaixo. Passe o mouse e clique no ícone de Lápis dourado para editar uma seção.
            </p>
          </div>
        </div>
      </div>

      {/* StoreFront Rendering IN CMS MODE */}
      <div className="w-full flex-1 overflow-y-auto custom-scrollbar relative">
         <StoreFront 
           isCmsMode={true} 
           cmsSections={sections} 
           onEditSection={handleEditSection} 
           onOpenCart={() => {}}
           onOpenAuth={() => {}}
           onAddToCart={() => {}}
           cartCount={0}
           currentUser={null}
           onLogout={() => {}}
         />
      </div>

      {/* Modal de Edição */}
      {activeKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#171a21] border border-gray-800 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0f1115]">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-tactical-gold" />
                <span className="font-tactical font-bold text-white text-xl">
                  {activeSectionLabel}
                </span>
                {hasUnsaved && (
                  <span className="text-[10px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded ml-2">
                    NÃO SALVO
                  </span>
                )}
              </div>
              <button onClick={() => setActiveKey(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">

              {/* Seletor Especial de Categorias para POPULAR_CATEGORIES */}
              {activeKey === 'POPULAR_CATEGORIES' && (
                <div className="bg-[#0f1115] p-4 rounded-lg border border-tactical-gold/50 space-y-4 shadow-xl">
                  
                  {/* 1. Categoria Principal (Banner Esquerdo Grande) */}
                  <div className="space-y-2 pb-3 border-b border-gray-800">
                    <label className="block text-xs font-bold uppercase text-tactical-gold flex items-center gap-1.5 font-tactical">
                      <FolderTree className="w-4 h-4 text-tactical-gold" /> Banner Principal da Esquerda (Grande Destaque)
                    </label>
                    <select
                      className="w-full bg-[#171a21] border border-gray-700 rounded px-3 py-2 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                      value={form.featuredCategoryId || ''}
                      onChange={(e) => {
                        const catId = e.target.value;
                        const selectedCat = categories.find(c => String(c.id) === String(catId));
                        if (selectedCat) {
                          setForm(prev => ({
                            ...prev,
                            featuredCategoryId: catId,
                            featuredTitle: selectedCat.name.toUpperCase(),
                            mediaUrl: selectedCat.image || prev.mediaUrl,
                            buttonLink: `category:${selectedCat.id}`
                          }));
                          setHasUnsaved(true);
                        } else {
                          updateField('featuredCategoryId', '');
                        }
                      }}
                    >
                      <option value="">-- Selecione a Categoria do Banner Principal --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          ⭐ {cat.name} ({products.filter(p => p.categoryId === cat.id).length} itens)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Seleção das 4 Categorias da Grade Direita */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase text-tactical-gold font-tactical">
                      🗂️ Seleção dos 4 Quadros da Grade Direita
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[0, 1, 2, 3].map((slotIndex) => {
                        const currentSlots = form.subCategoryIds ? form.subCategoryIds.split(',') : [];
                        const currentSlotVal = currentSlots[slotIndex] || '';

                        return (
                          <div key={slotIndex} className="bg-[#171a21] p-2.5 rounded border border-gray-700 space-y-1">
                            <span className="text-[10px] font-bold text-gray-400 block uppercase">
                              Quadro {slotIndex + 1} {slotIndex === 0 ? '(Sup. Esquerdo)' : slotIndex === 1 ? '(Sup. Direito)' : slotIndex === 2 ? '(Inf. Esquerdo)' : '(Inf. Direito)'}
                            </span>
                            <select
                              className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                              value={currentSlotVal}
                              onChange={(e) => {
                                const newCatId = e.target.value;
                                const slots = form.subCategoryIds ? form.subCategoryIds.split(',') : ['', '', '', ''];
                                while (slots.length < 4) slots.push('');
                                slots[slotIndex] = newCatId;
                                updateField('subCategoryIds', slots.join(','));
                              }}
                            >
                              <option value="">-- Padrão ({categories[slotIndex]?.name || 'Auto'}) --</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  🏷️ {cat.name} ({products.filter(p => p.categoryId === cat.id).length} itens)
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight pt-1">
                      💡 Cada quadro selecionado exibirá automaticamente a imagem, o nome e a contagem de itens da categoria escolhida na Landing Page.
                    </p>
                  </div>
                </div>
              )}

              {/* Seletor Especial para RODAPÉ / CONTATO (FOOTER_CONTACT 100% EDITÁVEL) */}
              {activeKey === 'FOOTER_CONTACT' && (
                <div className="bg-[#0f1115] p-4 rounded-lg border border-tactical-gold/50 space-y-4 shadow-xl text-xs">
                  <div className="border-b border-gray-800 pb-2">
                    <span className="font-tactical font-bold text-tactical-gold uppercase text-sm block">
                      📍 CONFIGURAÇÃO COMPLETA DO RODAPÉ (FOOTER 100% EDITÁVEL)
                    </span>
                    <p className="text-[11px] text-gray-400">Edite todos os textos, links, colunas, pagamentos e direitos autorais do rodapé.</p>
                  </div>

                  {/* Coluna 1 */}
                  <div className="space-y-2 bg-[#171a21] p-3 rounded border border-gray-700">
                    <span className="font-bold text-white uppercase text-[10px] block text-tactical-gold">📌 Coluna 1: Marca & Descrição</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nome da Marca / Título</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                        value={form.title || ''}
                        onChange={e => updateField('title', e.target.value)}
                        placeholder="ex: TACTIKO / GAMA STORE"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Descrição Institucional</label>
                      <textarea
                        rows={2}
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-tactical-gold focus:outline-none"
                        value={form.subtitle || ''}
                        onChange={e => updateField('subtitle', e.target.value)}
                        placeholder="Descrição abaixo da marca..."
                      />
                    </div>
                  </div>

                  {/* Coluna 2 */}
                  <div className="space-y-2 bg-[#171a21] p-3 rounded border border-gray-700">
                    <span className="font-bold text-white uppercase text-[10px] block text-tactical-gold">🔗 Coluna 2: Navegação Rápida</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Título da Coluna 2</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                        value={form.featuredTitle || ''}
                        onChange={e => updateField('featuredTitle', e.target.value)}
                        placeholder="ex: NAVEGAÇÃO RÁPIDA"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Links de Navegação (Formato: Nome:Link | Nome:Link)</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:border-tactical-gold focus:outline-none"
                        value={form.navLinks || ''}
                        onChange={e => updateField('navLinks', e.target.value)}
                        placeholder="Home:#|Catálogo:#bestsellers|Categorias:#categorias|Ofertas Especiais:#promocao"
                      />
                    </div>
                  </div>

                  {/* Coluna 3 */}
                  <div className="space-y-2 bg-[#171a21] p-3 rounded border border-gray-700">
                    <span className="font-bold text-white uppercase text-[10px] block text-tactical-gold">📞 Coluna 3: Atendimento</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Título da Coluna 3</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                        value={form.featuredLabel || ''}
                        onChange={e => updateField('featuredLabel', e.target.value)}
                        placeholder="ex: ATENDIMENTO"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Linhas de Contato (Separadas por |)</label>
                      <textarea
                        rows={3}
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:border-tactical-gold focus:outline-none"
                        value={form.buttonText || ''}
                        onChange={e => updateField('buttonText', e.target.value)}
                        placeholder="WhatsApp: (+55) 11 99999-8888|Email: contato@gamastore.com.br|Segunda a Sexta: 08h às 18h"
                      />
                    </div>
                  </div>

                  {/* Coluna 4 */}
                  <div className="space-y-2 bg-[#171a21] p-3 rounded border border-gray-700">
                    <span className="font-bold text-white uppercase text-[10px] block text-tactical-gold">🛡️ Coluna 4: Segurança & Pagamentos</span>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Título da Coluna 4</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                        value={form.secTitle || ''}
                        onChange={e => updateField('secTitle', e.target.value)}
                        placeholder="ex: SEGURANÇA & PAGAMENTO"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Texto de Segurança</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-tactical-gold focus:outline-none"
                        value={form.secText || ''}
                        onChange={e => updateField('secText', e.target.value)}
                        placeholder="ex: Ambiente 100% seguro com criptografia de ponta a ponta."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Badges de Pagamento (Separados por |)</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs font-mono focus:border-tactical-gold focus:outline-none"
                        value={form.paymentBadges || ''}
                        onChange={e => updateField('paymentBadges', e.target.value)}
                        placeholder="PIX|Cartão|Boleto|Transferência"
                      />
                    </div>
                  </div>

                  {/* Copyright */}
                  <div className="space-y-1 bg-[#171a21] p-3 rounded border border-gray-700">
                    <span className="font-bold text-white uppercase text-[10px] block text-tactical-gold">©️ Direitos Autorais / Copyright</span>
                    <input
                      type="text"
                      className="w-full bg-[#0f1115] border border-gray-700 rounded px-2.5 py-1.5 text-white text-xs focus:border-tactical-gold focus:outline-none"
                      value={form.copyrightText || ''}
                      onChange={e => updateField('copyrightText', e.target.value)}
                      placeholder="© 2026 TACTIKO / GAMA STORE. Todos os direitos reservados."
                    />
                  </div>

                </div>
              )}
              
              {/* Campos Genéricos (apenas se não for FOOTER_CONTACT) */}
              {activeKey !== 'FOOTER_CONTACT' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Título Principal</label>
                    <input
                      type="text"
                      className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-tactical-gold focus:outline-none transition"
                      value={form.title || ''}
                      onChange={e => updateField('title', e.target.value)}
                      placeholder="Título principal da seção..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Subtítulo / Descrição / Rótulos Extras</label>
                    <textarea
                      rows={3}
                      className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-tactical-gold focus:outline-none transition resize-none"
                      value={form.subtitle || ''}
                      onChange={e => updateField('subtitle', e.target.value)}
                      placeholder="Descrição ou textos extras (separados por | se necessário)..."
                    />
                  </div>

                  {/* Extra Campos */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Título Destaque</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-tactical-gold focus:outline-none"
                        value={form.featuredTitle || ''}
                        onChange={e => updateField('featuredTitle', e.target.value)}
                        placeholder="Ex: OUTERWEAR..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Selo / Tagline</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-tactical-gold focus:outline-none"
                        value={form.featuredLabel || ''}
                        onChange={e => updateField('featuredLabel', e.target.value)}
                        placeholder="Ex: 50% OFF..."
                      />
                    </div>
                  </div>

                  {/* Media */}
                  <div className="bg-[#0f1115] p-4 rounded border border-gray-800 space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <label className="block text-[10px] font-bold uppercase text-tactical-gold">
                        Mídia da Seção (Imagem ou Vídeo)
                      </label>

                      <div className="flex items-center gap-2">
                        {/* Botão de Upload Direto do Computador */}
                        <label className="bg-tactical-gold hover:bg-tactical-goldHover text-black text-[11px] font-tactical font-extrabold px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 transition-all shadow">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploading ? 'ENVIANDO...' : 'ENVIAR FOTO/VÍDEO'}</span>
                          <input
                            type="file"
                            accept="image/*,video/mp4"
                            className="hidden"
                            disabled={uploading}
                            onChange={(e) => {
                              if (onUpload) {
                                onUpload(e, (url, type) => {
                                  updateField('mediaUrl', url);
                                  updateField('mediaType', type);
                                });
                              }
                            }}
                          />
                        </label>

                        {/* Botão de Abrir Galeria */}
                        <button
                          type="button"
                          onClick={() => setIsMediaOpen(true)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded flex items-center gap-1 transition-all border border-gray-700"
                        >
                          <HardDriveUpload className="w-3.5 h-3.5 text-tactical-gold" /> Galeria
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        className="bg-[#171a21] border border-gray-700 text-white rounded px-2 text-xs"
                        value={form.mediaType || 'IMAGE'}
                        onChange={e => updateField('mediaType', e.target.value)}
                      >
                        <option value="IMAGE">Imagem</option>
                        <option value="VIDEO_FILE">Vídeo MP4</option>
                        <option value="YOUTUBE">YouTube</option>
                      </select>

                      <input
                        type="text"
                        className="flex-1 bg-[#171a21] border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:border-tactical-gold focus:outline-none"
                        value={form.mediaUrl || ''}
                        onChange={e => updateField('mediaUrl', e.target.value)}
                        placeholder="Cole a URL ou clique em ENVIAR FOTO/VÍDEO acima..."
                      />
                    </div>

                    {/* Pré-visualização ao Vivo da Imagem/Vídeo */}
                    {form.mediaUrl && (
                      <div className="mt-2 relative aspect-video bg-black rounded overflow-hidden border border-gray-800">
                        <MediaViewer
                          mediaUrl={form.mediaUrl}
                          mediaType={form.mediaType || 'IMAGE'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/70 text-tactical-gold text-[9px] font-bold px-2 py-0.5 rounded border border-tactical-gold/30 uppercase">
                          Pré-visualização ao vivo
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Texto do Botão (CTA)</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-tactical-gold focus:outline-none"
                        value={form.buttonText || ''}
                        onChange={e => updateField('buttonText', e.target.value)}
                        placeholder="Ex: COMPRAR"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Link do Botão</label>
                      <input
                        type="text"
                        className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white text-sm focus:border-tactical-gold focus:outline-none"
                        value={form.buttonLink || ''}
                        onChange={e => updateField('buttonLink', e.target.value)}
                        placeholder="Ex: #bestsellers"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0f1115] border-t border-gray-800">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-tactical-gold hover:bg-yellow-400 text-black font-tactical text-xl font-bold py-3 rounded shadow-lg transition-all flex justify-center items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'SALVANDO...' : `SALVAR SEÇÃO`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Galeria Picker */}
      {isMediaOpen && (
        <MediaPickerModal
          isOpen={isMediaOpen}
          mediaLibrary={mediaLibrary}
          onSelect={handleSelectMedia}
          onClose={() => setIsMediaOpen(false)}
          onUpload={onUpload}
          uploading={uploading}
          onDelete={onDelete}
          authHeader={authHeader}
        />
      )}
    </div>
  );
}
