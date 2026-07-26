import React, { useState } from 'react';
import {
  Plus, Trash2, Image as ImageIcon, X, Layers, Zap, ChevronDown, ChevronUp,
  Shirt, Scissors, Ruler, Cable, BatteryCharging, HardHat, Settings2,
  AlertCircle, Camera
} from 'lucide-react';
import MediaViewer from './MediaViewer';

// --- Presets de catalogo com icones SVG ---
const CATALOG_PRESETS = [
  { id: 'APPAREL',      label: 'Roupas / Vestuario',     Icon: Shirt,           attr1: 'Cor',          attr2: 'Tamanho',          values: ['PP','P','M','G','GG','XG','2XG'],                     hint: 'PP - P - M - G - GG - XG' },
  { id: 'FOOTWEAR',     label: 'Calcados / Botas',       Icon: Ruler,           attr1: 'Cor',          attr2: 'Numero',           values: ['36','37','38','39','40','41','42','43','44','45'],     hint: '36 a 45' },
  { id: 'PANTS',        label: 'Calcas / Bermudas',      Icon: Scissors,        attr1: 'Cor',          attr2: 'Numeracao',        values: ['36','38','40','42','44','46','48','50'],               hint: '36 a 50' },
  { id: 'BELTS_CM',     label: 'Cintos / Tiras (cm)',    Icon: Ruler,           attr1: 'Cor',          attr2: 'Comprimento (cm)', values: ['85cm','90cm','95cm','100cm','105cm','110cm','120cm'], hint: '85cm a 120cm' },
  { id: 'ROPES_METERS', label: 'Cordas / Fitas (m)',     Icon: Cable,           attr1: 'Cor / Modelo', attr2: 'Metragem',         values: ['1m','2m','5m','10m','15m','20m','50m'],               hint: '1m - 5m - 10m - 50m' },
  { id: 'VOLTAGE',      label: 'Voltagem',               Icon: BatteryCharging, attr1: 'Modelo',       attr2: 'Voltagem',         values: ['110V','220V','Bivolt'],                                hint: '110V - 220V - Bivolt' },
  { id: 'ACCESSORIES',  label: 'Acessorios / Bones',     Icon: HardHat,         attr1: 'Cor',          attr2: 'Tamanho',          values: ['Unico','P/M','G/GG'],                                 hint: 'Unico - P/M - G/GG' },
  { id: 'CUSTOM',       label: 'Medida Personalizada',   Icon: Settings2,       attr1: 'Modelo / Cor', attr2: 'Especificacao',     values: [],                                                     hint: 'cm, mm, litros...' },
];

// --- Componente principal ---
export default function ProductVariantEditor({ variants = [], mediaList = [], onChangeVariants, onChangeMedia, onOpenMediaPicker }) {
  const [attr1Name, setAttr1Name]               = useState('Cor / Modelo');
  const [attr2Name, setAttr2Name]               = useState('Tamanho / Dimensao');
  const [newColor, setNewColor]                 = useState('');
  const [customSizeInputs, setCustomSizeInputs] = useState({});
  const [activePreset, setActivePreset]         = useState(null);
  const [collapsedCards, setCollapsedCards]     = useState({});

  const groupedVariants = variants.reduce((acc, v) => {
    const key = v.color || 'Padrao';
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
    const defaultSizes = (preset && preset.values.length > 0) ? preset.values : ['Padrao'];
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
    <div className="space-y-4 text-xs p-4">

      {/* PASSO A: TEMPLATE */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-tactical-gold text-black text-[10px] font-black flex items-center justify-center flex-shrink-0">A</div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Escolha um Template</span>
          <span className="text-[10px] text-gray-600">(opcional — define nomes e valores padrao)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CATALOG_PRESETS.map(preset => {
            const { Icon } = preset;
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-tactical-gold/10 border-tactical-gold/50 text-tactical-gold'
                    : 'bg-[#0f1115] border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[10px] font-bold leading-tight">{preset.label}</span>
                {preset.hint && (
                  <span className="text-[9px] text-gray-600 font-mono leading-tight">{preset.hint}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* PASSO B: NOMES DOS ATRIBUTOS */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-tactical-gold text-black text-[10px] font-black flex items-center justify-center flex-shrink-0">B</div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Nomes dos Atributos</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Atributo Principal</label>
            <input
              type="text"
              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3 py-2 text-white font-bold focus:outline-none transition-colors"
              value={attr1Name}
              onChange={e => setAttr1Name(e.target.value)}
              placeholder="ex: Cor, Modelo, Acabamento"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Atributo Secundario</label>
            <input
              type="text"
              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3 py-2 text-white font-bold focus:outline-none transition-colors"
              value={attr2Name}
              onChange={e => setAttr2Name(e.target.value)}
              placeholder="ex: Tamanho, Voltagem, cm"
            />
          </div>
        </div>
      </div>

      {/* PASSO C: ADICIONAR VARIANTE PRINCIPAL */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-tactical-gold text-black text-[10px] font-black flex items-center justify-center flex-shrink-0">C</div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Adicionar {attr1Name}</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3 py-2.5 text-white focus:outline-none transition-colors placeholder-gray-600"
            placeholder="ex: Preto, Verde Militar, Couro Castanho, Aluminio..."
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
          />
          <button
            type="button"
            onClick={handleAddColor}
            className="bg-tactical-gold hover:bg-tactical-goldHover text-black px-4 py-2.5 rounded-lg font-black flex items-center gap-2 transition-all shadow whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        {colors.length === 0 && (
          <div className="flex items-start gap-2 text-[10px] text-gray-500 bg-[#0f1115] border border-gray-800 rounded-lg p-3">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-600" />
            <span>
              Sem variantes — estoque controlado de forma global. Adicione uma opcao acima para ativar a matriz de estoque por variante.
            </span>
          </div>
        )}
      </div>

      {/* LISTA DE VARIANTES */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-800">
            <Layers className="w-3.5 h-3.5 text-tactical-gold" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
              {colors.length} Variante{colors.length !== 1 ? 's' : ''} Cadastrada{colors.length !== 1 ? 's' : ''}
            </span>
          </div>

          {colors.map(color => {
            const colorVariants = groupedVariants[color] || [];
            const colorMedia = mediaList.filter(m => m.color === color);
            const isCollapsed = collapsedCards[color];
            const totalStock = colorVariants.reduce((s, v) => s + (v.stock || 0), 0);

            return (
              <div key={color} className="rounded-lg border border-gray-700 bg-[#171a21] overflow-hidden shadow-sm">

                {/* Header clicavel */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1c1f28] transition-colors select-none"
                  onClick={() => toggleCollapse(color)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-tactical-gold ring-2 ring-tactical-gold/20 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white text-[12px]">{color}</span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-500">
                          {colorVariants.length} {attr2Name.toLowerCase()}{colorVariants.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-[10px] text-gray-500">{totalStock} un. estoque</span>
                        {colorMedia.length > 0 && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                              <Camera className="w-3 h-3" /> {colorMedia.length} foto{colorMedia.length > 1 ? 's' : ''}
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
                      className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isCollapsed
                      ? <ChevronDown className="w-4 h-4 text-gray-500" />
                      : <ChevronUp className="w-4 h-4 text-gray-500" />
                    }
                  </div>
                </div>

                {/* Corpo expandivel */}
                {!isCollapsed && (
                  <div className="border-t border-gray-800 space-y-4 p-4">

                    {/* Sub-secao: adicionar especificacoes */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-tactical-gold" /> Adicionar {attr2Name}
                      </span>

                      {/* Chips por template */}
                      {CATALOG_PRESETS.filter(p => p.values.length > 0).map(preset => {
                        const { Icon } = preset;
                        return (
                          <div key={preset.id} className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[9px] text-gray-600 w-24 flex-shrink-0">
                              <Icon className="w-3 h-3" />
                              <span className="truncate">{preset.label.split(' ')[0]}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {preset.values.map(val => {
                                const added = colorVariants.some(v => v.size === val);
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => !added && handleAddPresetSizesToColor(color, [val])}
                                    className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold transition-all ${
                                      added
                                        ? 'bg-tactical-gold/10 border-tactical-gold/40 text-tactical-gold cursor-default'
                                        : 'bg-[#0f1115] border-gray-700 text-gray-400 hover:border-tactical-gold/40 hover:text-tactical-gold cursor-pointer'
                                    }`}
                                  >
                                    {added ? '+ ' : '+'}{val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {/* Input personalizado */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          className="flex-1 bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3 py-1.5 text-white focus:outline-none transition-colors placeholder-gray-600"
                          placeholder="Especificacao livre (ex: 105cm, Bivolt, 9mm, 2.5m...)"
                          value={customSizeInputs[color] || ''}
                          onChange={e => setCustomSizeInputs({ ...customSizeInputs, [color]: e.target.value })}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomSizeToColor(color))}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSizeToColor(color)}
                          className="bg-[#0f1115] hover:bg-tactical-gold/10 border border-gray-700 hover:border-tactical-gold/40 text-tactical-gold px-3 py-1.5 rounded-lg font-bold transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-secao: tabela de estoque */}
                    {colorVariants.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Estoque e Precos por {attr2Name}
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {colorVariants.map(v => (
                            <div key={v.size} className="bg-[#0f1115] border border-gray-800 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-tactical-gold bg-tactical-gold/10 px-2 py-0.5 rounded border border-tactical-gold/30">
                                  {attr2Name}: {v.size}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSizeFromColor(color, v.size)}
                                  className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold uppercase text-gray-600 mb-1">Estoque</label>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full bg-[#171a21] border border-gray-700 focus:border-tactical-gold text-white rounded px-2 py-1.5 text-center font-mono font-bold focus:outline-none transition-colors"
                                    value={v.stock}
                                    onChange={e => handleStockChange(color, v.size, e.target.value)}
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold uppercase text-gray-600 mb-1">Preco R$</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-[#171a21] border border-gray-700 focus:border-amber-500 text-amber-400 rounded px-2 py-1.5 text-center font-mono focus:outline-none transition-colors placeholder-gray-700"
                                    value={v.price !== null && v.price !== undefined ? v.price : ''}
                                    onChange={e => handlePriceChange(color, v.size, e.target.value)}
                                    placeholder="Padrao"
                                  />
                                </div>
                              </div>
                              <input
                                type="text"
                                className="w-full bg-[#171a21] border border-gray-800 hover:border-gray-700 focus:border-gray-600 text-gray-400 rounded px-2 py-1 font-mono text-[10px] focus:outline-none transition-colors placeholder-gray-700"
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