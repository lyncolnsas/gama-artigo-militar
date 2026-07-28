import React, { useState } from 'react';
import {
  Plus, Trash2, Image as ImageIcon, X, Layers, Zap, ChevronDown, ChevronUp,
  Shirt, Scissors, Ruler, Cable, BatteryCharging, HardHat, Settings2,
  AlertCircle, Camera
} from 'lucide-react';
import MediaViewer from './MediaViewer';

// --- Presets de catalogo com icones SVG ---
const CATALOG_PRESETS = [
  { id: 'APPAREL',      label: 'Roupas / Vestuário',     Icon: Shirt,           attr1: 'Cor',          attr2: 'Tamanho',          values: ['PP','P','M','G','GG','XG','2XG'],                     hint: 'PP - P - M - G - GG - XG' },
  { id: 'FOOTWEAR',     label: 'Calçados / Botas',       Icon: Ruler,           attr1: 'Cor',          attr2: 'Número',           values: ['36','37','38','39','40','41','42','43','44','45'],     hint: '36 a 45' },
  { id: 'PANTS',        label: 'Calças / Bermudas',      Icon: Scissors,        attr1: 'Cor',          attr2: 'Numeração',        values: ['36','38','40','42','44','46','48','50'],               hint: '36 a 50' },
  { id: 'BELTS_CM',     label: 'Cintos / Tiras (cm)',    Icon: Ruler,           attr1: 'Cor',          attr2: 'Comprimento (cm)', values: ['85cm','90cm','95cm','100cm','105cm','110cm','120cm'], hint: '85cm a 120cm' },
  { id: 'ROPES_METERS', label: 'Cordas / Fitas (m)',     Icon: Cable,           attr1: 'Cor / Modelo', attr2: 'Metragem',         values: ['1m','2m','5m','10m','15m','20m','50m'],               hint: '1m - 5m - 10m - 50m' },
  { id: 'VOLTAGE',      label: 'Voltagem',               Icon: BatteryCharging, attr1: 'Modelo',       attr2: 'Voltagem',         values: ['110V','220V','Bivolt'],                                hint: '110V - 220V - Bivolt' },
  { id: 'ACCESSORIES',  label: 'Acessórios / Bonés',     Icon: HardHat,         attr1: 'Cor',          attr2: 'Tamanho',          values: ['Único','P/M','G/GG'],                                 hint: 'Único - P/M - G/GG' },
  { id: 'CUSTOM',       label: 'Medida Personalizada',   Icon: Settings2,       attr1: 'Modelo / Cor', attr2: 'Especificação',     values: [],                                                     hint: 'cm, mm, litros...' },
];

// --- Componente principal ---
export default function ProductVariantEditor({ variants = [], mediaList = [], onChangeVariants, onChangeMedia, onOpenMediaPicker }) {
  const [attr1Name, setAttr1Name]               = useState('Cor / Modelo');
  const [attr2Name, setAttr2Name]               = useState('Tamanho / Dimensão');
  const [newColor, setNewColor]                 = useState('');
  const [customSizeInputs, setCustomSizeInputs] = useState({});
  const [activePreset, setActivePreset]         = useState(null);
  const [collapsedCards, setCollapsedCards]     = useState({});

  const groupedVariants = variants.reduce((acc, v) => {
    const key = v.color || 'Padrão';
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});
  const colors = Object.keys(groupedVariants);

  const applyPreset = (preset) => {
    setAttr1Name(preset.attr1);
    setAttr2Name(preset.attr2);
    setActivePreset(preset.id);
  };

  const handleAddColor = () => {
    const c = newColor.trim();
    if (!c || colors.includes(c)) return;
    const preset = CATALOG_PRESETS.find(p => p.id === activePreset);
    const defaultSizes = (preset && preset.values.length > 0) ? preset.values : ['Padrão'];
    const newVariants = [...variants];
    defaultSizes.forEach(size => newVariants.push({ color: c, size, stock: 0, sku: '', price: null }));
    onChangeVariants(newVariants);
    setNewColor('');
  };

  const handleRemoveColor = (color) => {
    onChangeVariants(variants.filter(v => v.color !== color));
    onChangeMedia(mediaList.filter(m => m.color !== color));
  };

  const handleAddPresetSizesToColor = (color, presetSizes) => {
    const currentSizes = (groupedVariants[color] || []).map(v => v.size);
    const newVariants = [...variants];
    presetSizes.forEach(size => {
      if (!currentSizes.includes(size)) newVariants.push({ color, size, stock: 0, sku: '', price: null });
    });
    onChangeVariants(newVariants);
  };

  const handleAddCustomSizeToColor = (color) => {
    const sizeVal = (customSizeInputs[color] || '').trim();
    if (!sizeVal) return;
    const currentSizes = (groupedVariants[color] || []).map(v => v.size);
    if (!currentSizes.includes(sizeVal)) onChangeVariants([...variants, { color, size: sizeVal, stock: 0, sku: '', price: null }]);
    setCustomSizeInputs(prev => ({ ...prev, [color]: '' }));
  };

  const handleRemoveSizeFromColor = (color, size) => {
    onChangeVariants(variants.filter(v => !(v.color === color && v.size === size)));
  };

  const handleStockChange = (color, size, val) => {
    onChangeVariants(variants.map(v =>
      (v.color === color && v.size === size) ? { ...v, stock: parseInt(val, 10) || 0 } : v
    ));
  };

  const handlePriceChange = (color, size, val) => {
    onChangeVariants(variants.map(v =>
      (v.color === color && v.size === size) ? { ...v, price: val ? parseFloat(val) : null } : v
    ));
  };

  const handleSkuChange = (color, size, val) => {
    onChangeVariants(variants.map(v =>
      (v.color === color && v.size === size) ? { ...v, sku: val } : v
    ));
  };

  const handleRemoveMedia = (url) => onChangeMedia(mediaList.filter(m => m.url !== url));

  const toggleCollapse = (color) =>
    setCollapsedCards(prev => ({ ...prev, [color]: !prev[color] }));

  return (
    <div className="space-y-6 text-xs p-5 sm:p-6">

      {/* PASSO A: TEMPLATE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">A</div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-200">Escolha um Template</span>
          <span className="text-xs text-gray-500 font-medium">(opcional — define nomes e valores padrão)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {CATALOG_PRESETS.map(preset => {
            const { Icon } = preset;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-tactical-gold/10 border-tactical-gold text-tactical-gold ring-1 ring-tactical-gold/30 shadow-md'
                    : 'bg-[#0f1115] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-bold leading-tight">{preset.label}</span>
                {preset.hint && (
                  <span className="text-[10px] text-gray-500 font-mono leading-tight">{preset.hint}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PASSO B: NOMES DOS ATRIBUTOS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">B</div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-200">Nomes dos Atributos</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Atributo Principal</label>
            <input
              type="text"
              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none transition-colors"
              value={attr1Name}
              onChange={e => setAttr1Name(e.target.value)}
              placeholder="ex: Cor, Modelo, Acabamento"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Atributo Secundário</label>
            <input
              type="text"
              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none transition-colors"
              value={attr2Name}
              onChange={e => setAttr2Name(e.target.value)}
              placeholder="ex: Tamanho, Voltagem, cm"
            />
          </div>
        </div>
      </div>

      {/* PASSO C: ADICIONAR VARIANTE PRINCIPAL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">C</div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-200">Adicionar {attr1Name}</span>
        </div>
        <div className="flex gap-2.5">
          <input
            type="text"
            className="flex-1 bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder-gray-500"
            placeholder="ex: Preto Ops, Verde Militar, Couro Castanho..."
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
          />
          <button
            type="button"
            onClick={handleAddColor}
            className="bg-tactical-gold hover:bg-tactical-goldHover text-black px-5 py-2.5 rounded-lg font-black flex items-center gap-2 transition-all shadow text-xs sm:text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        {colors.length === 0 && (
          <div className="flex items-start gap-2.5 text-xs text-gray-400 bg-[#0f1115] border border-gray-800 rounded-lg p-3.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>
              Sem variantes — estoque controlado de forma global. Adicione uma opção acima para ativar a matriz de estoque por variante.
            </span>
          </div>
        )}
      </div>

      {/* LISTA DE VARIANTES */}
      {colors.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
            <Layers className="w-4 h-4 text-tactical-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
              {colors.length} Variante{colors.length !== 1 ? 's' : ''} Cadastrada{colors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {colors.map(color => {
            const colorVariants = groupedVariants[color] || [];
            const colorMedia = mediaList.filter(m => m.color === color);
            const isCollapsed = collapsedCards[color];
            const totalStock = colorVariants.reduce((s, v) => s + (v.stock || 0), 0);

            return (
              <div key={color} className="rounded-xl border border-gray-700 bg-[#171a21] overflow-hidden shadow-md">

                {/* Header clicável */}
                <div
                  className="flex items-center justify-between px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-[#1c1f28] transition-colors select-none"
                  onClick={() => toggleCollapse(color)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full bg-tactical-gold ring-4 ring-tactical-gold/20 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white text-sm sm:text-base">{color}</span>
                      <div className="flex items-center gap-2.5 mt-0.5 flex-wrap text-xs text-gray-400">
                        <span>
                          {colorVariants.length} {attr2Name.toLowerCase()}{colorVariants.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-600">·</span>
                        <span>{totalStock} un. estoque</span>
                        {colorMedia.length > 0 && (
                          <>
                            <span className="text-gray-600">·</span>
                            <span className="flex items-center gap-1 text-tactical-gold font-semibold">
                              <Camera className="w-3.5 h-3.5" /> {colorMedia.length} foto{colorMedia.length > 1 ? 's' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRemoveColor(color); }}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isCollapsed
                      ? <ChevronDown className="w-5 h-5 text-gray-400" />
                      : <ChevronUp className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Corpo expandível */}
                {!isCollapsed && (
                  <div className="border-t border-gray-800 space-y-5 p-4 sm:p-5">

                    {/* Sub-seção: adicionar especificações */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-tactical-gold" /> Adicionar {attr2Name}
                      </span>

                      {/* Chips por template */}
                      {CATALOG_PRESETS.filter(p => p.values.length > 0).map(preset => {
                        const { Icon } = preset;
                        return (
                          <div key={preset.id} className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 w-28 flex-shrink-0 font-medium">
                              <Icon className="w-3.5 h-3.5 text-tactical-gold" />
                              <span className="truncate">{preset.label.split(' ')[0]}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {preset.values.map(val => {
                                const added = colorVariants.some(v => v.size === val);
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => !added && handleAddPresetSizesToColor(color, [val])}
                                    className={`text-xs px-2.5 py-1 rounded-md border font-mono font-bold transition-all ${
                                      added
                                        ? 'bg-tactical-gold/10 border-tactical-gold/40 text-tactical-gold cursor-default'
                                        : 'bg-[#0f1115] border-gray-700 text-gray-300 hover:border-tactical-gold hover:text-tactical-gold cursor-pointer'
                                    }`}
                                  >
                                    {added ? '✓ ' : '+'}{val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Input personalizado */}
                      <div className="flex gap-2.5 pt-1">
                        <input
                          type="text"
                          className="flex-1 bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder-gray-500"
                          placeholder="Especificação livre (ex: 105cm, Bivolt, 9mm, 2.5m...)"
                          value={customSizeInputs[color] || ''}
                          onChange={e => setCustomSizeInputs({ ...customSizeInputs, [color]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSizeToColor(color))}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSizeToColor(color)}
                          className="bg-[#0f1115] hover:bg-tactical-gold/10 border border-gray-700 hover:border-tactical-gold/40 text-tactical-gold px-4 py-2 rounded-lg font-bold transition-all text-xs"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-seção: tabela de estoque */}
                    {colorVariants.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                            Estoque e Preços por {attr2Name}
                          </span>
                          <span className="text-xs font-mono text-tactical-gold font-bold bg-tactical-gold/10 px-2.5 py-1 rounded-md border border-tactical-gold/30">
                            ✨ 0 = Estoque Simbólico (Disponível)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {colorVariants.map(v => (
                            <div key={v.size} className="bg-[#0f1115] border border-gray-800 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-inner">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-tactical-gold bg-tactical-gold/10 px-2.5 py-1 rounded-md border border-tactical-gold/30">
                                  {attr2Name}: {v.size}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSizeFromColor(color, v.size)}
                                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold uppercase text-gray-300">Estoque</label>
                                    <span className="text-xs font-mono text-tactical-gold font-bold">
                                      {v.stock === 0 ? 'Simbólico' : `${v.stock} un.`}
                                    </span>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-[#171a21] border border-gray-700 focus:border-tactical-gold text-white rounded-lg px-3 py-2 text-center text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors"
                                    value={v.stock}
                                    onChange={e => handleStockChange(color, v.size, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="0 (Simbólico)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">Preço R$</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[#171a21] border border-gray-700 focus:border-amber-500 text-amber-400 rounded-lg px-3 py-2 text-center text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors placeholder-gray-600"
                                    value={v.price !== null && v.price !== undefined ? v.price : ''}
                                    onChange={e => handlePriceChange(color, v.size, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Padrão (Simbólico)"
                                  />
                                </div>
                              </div>
                              <input
                                type="text"
                                className="w-full bg-[#171a21] border border-gray-800 hover:border-gray-700 focus:border-gray-600 text-gray-300 rounded-lg px-3 py-1.5 font-mono text-xs focus:outline-none transition-colors placeholder-gray-600"
                                placeholder="SKU / Ref. (ex: BELT-BRN-105CM)"
                                value={v.sku || ''}
                                onChange={e => handleSkuChange(color, v.size, e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sub-secao: fotos da variante */}
                    <div className="pt-2 border-t border-gray-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> Fotos de {color}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenMediaPicker(color)}
                          className="text-[10px] bg-tactical-gold/10 border border-tactical-gold/30 hover:bg-tactical-gold/20 text-tactical-gold px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all"
                        >
                          <ImageIcon className="w-3 h-3" /> Upload / Biblioteca
                        </button>
                      </div>
                      {colorMedia.length === 0 ? (
                        <p className="text-[10px] text-gray-600 italic">Sem fotos especificas — usara a capa principal na vitrine.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {colorMedia.map((m, idx) => (
                            <div key={idx} className="relative group w-14 h-14 rounded-lg border border-gray-700 bg-black overflow-hidden flex-shrink-0">
                              <MediaViewer mediaUrl={m.url} mediaType={m.type} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveMedia(m.url)}
                                className="absolute inset-0 bg-black/60 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => onOpenMediaPicker(color)}
                            className="w-14 h-14 rounded-lg border border-dashed border-gray-700 hover:border-tactical-gold/40 bg-[#0f1115] flex items-center justify-center text-gray-600 hover:text-tactical-gold transition-all flex-shrink-0"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}