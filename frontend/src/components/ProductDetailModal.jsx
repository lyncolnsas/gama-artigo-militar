import React, { useState, useEffect } from 'react';
import MediaViewer from './MediaViewer';
import { X, ShoppingBag, Check, ShieldCheck, Truck, Clock, Sparkles, Star, Tag } from 'lucide-react';

export default function ProductDetailModal({ product, isOpen, onClose, onAddToCart }) {
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState('IMAGE');
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (product) {
      // Determinar cores disponíveis
      const variants = product.variants || [];
      const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
      
      const initialColor = colors[0] || null;
      setSelectedColor(initialColor);

      // Filtrar tamanhos para a cor inicial
      const colorVariants = initialColor 
        ? variants.filter(v => v.color === initialColor)
        : variants;
      
      setSelectedSize(colorVariants[0]?.size || null);

      // Definir mídia inicial
      const primaryMedia = product.media?.find(m => m.isPrimary) || product.media?.[0];
      setActiveMediaUrl(primaryMedia?.url || '');
      setActiveMediaType(primaryMedia?.type || 'IMAGE');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const variants = product.variants || [];
  const mediaList = product.media || [];
  const availableColors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  
  // Tamanhos da cor selecionada
  const availableSizesForColor = selectedColor
    ? variants.filter(v => v.color === selectedColor)
    : variants;

  // Encontrar variante selecionada
  const currentVariant = variants.find(v => 
    (!selectedColor || v.color === selectedColor) && 
    (!selectedSize || v.size === selectedSize)
  );

  // Mídias da cor selecionada ou galeria geral
  const displayMediaList = selectedColor
    ? mediaList.filter(m => !m.color || m.color === selectedColor)
    : mediaList;

  const currentPrice = currentVariant?.price ? parseFloat(currentVariant.price) : parseFloat(product.price);
  const currentStock = currentVariant ? currentVariant.stock : product.stock;

  const handleColorChange = (color) => {
    setSelectedColor(color);
    const colorSizes = variants.filter(v => v.color === color);
    if (colorSizes.length > 0) {
      setSelectedSize(colorSizes[0].size);
    }
    // Trocar imagem se houver mídia dessa cor
    const colorMedia = mediaList.find(m => m.color === color);
    if (colorMedia) {
      setActiveMediaUrl(colorMedia.url);
      setActiveMediaType(colorMedia.type);
    }
  };

  const handleConfirmAddToCart = () => {
    if (variants.length > 0 && !selectedSize) {
      alert('Por favor, selecione um tamanho ou medida antes de adicionar ao pedido.');
      return;
    }

    const itemToAdd = {
      ...product,
      selectedColor,
      selectedSize,
      variantId: currentVariant?.id,
      sku: currentVariant?.sku || product.sku || 'N/A',
      price: currentPrice
    };

    onAddToCart(itemToAdd);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#141619] border border-gray-800 w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden relative text-white flex flex-col md:flex-row my-auto max-h-[92vh] md:max-h-[90vh]">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 bg-black/70 hover:bg-red-900 text-gray-300 hover:text-white p-1.5 sm:p-2 rounded-full border border-gray-700 transition-colors"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Lado Esquerdo: Galeria e Mídias */}
        <div className="md:w-1/2 bg-black p-3 sm:p-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-800">
          <div className="relative h-44 sm:h-64 md:h-full md:aspect-square w-full rounded border border-gray-800 overflow-hidden bg-[#0f1115] flex items-center justify-center">
            <MediaViewer mediaUrl={activeMediaUrl} mediaType={activeMediaType} className="w-full h-full object-cover" />
            
            {product.isMadeToOrder && (
              <span className="absolute top-2 left-2 bg-amber-500 text-black font-extrabold text-[9px] sm:text-[10px] px-2 py-0.5 rounded shadow uppercase font-mono tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> SOB ENCOMENDA ({product.productionDays || 5}D)
              </span>
            )}
          </div>

          {/* Carrossel de Miniaturas de Fotos/Vídeos */}
          {displayMediaList.length > 1 && (
            <div className="flex items-center gap-2 mt-2 sm:mt-4 overflow-x-auto pb-1 no-scrollbar">
              {displayMediaList.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveMediaUrl(m.url);
                    setActiveMediaType(m.type);
                  }}
                  className={`w-10 h-10 sm:w-14 sm:h-14 rounded border overflow-hidden flex-shrink-0 bg-[#171a21] transition-all ${
                    activeMediaUrl === m.url ? 'border-tactical-gold ring-2 ring-tactical-gold/40' : 'border-gray-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <MediaViewer mediaUrl={m.url} mediaType={m.type} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lado Direito: Especificações, Cores, Tamanhos e Botão */}
        <div className="md:w-1/2 p-4 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div>
              <span className="text-[9px] sm:text-[10px] font-bold text-tactical-gold uppercase tracking-widest block mb-0.5">
                {product.category?.name || 'EQUIPAMENTO OPERACIONAL'}
              </span>
              <h2 className="font-tactical text-xl sm:text-3xl font-bold leading-tight text-white">
                {product.title}
              </h2>
            </div>

            {/* Preços */}
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl sm:text-3xl font-black text-white font-mono">
                R$ {currentPrice.toFixed(2)}
              </span>
              {product.promoPrice && parseFloat(product.promoPrice) > currentPrice && (
                <span className="text-xs sm:text-sm text-gray-500 line-through font-mono">
                  R$ {parseFloat(product.promoPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Aviso de Sob Encomenda */}
            {product.isMadeToOrder && (
              <div className="bg-amber-950/50 border border-amber-500/40 p-2.5 rounded text-amber-200 text-xs space-y-0.5">
                <span className="font-bold flex items-center gap-1.5 text-amber-400 text-xs">
                  <Clock className="w-3.5 h-3.5" /> Produto Sob Encomenda
                </span>
                <p className="text-[10px] sm:text-[11px] text-gray-300">
                  Prazo de confecção: <strong>{product.productionDays || 5} dias úteis</strong> antes do envio.
                </p>
              </div>
            )}

            {/* 1. SELEÇÃO DE COR / MODELO (se houver) */}
            {availableColors.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-bold uppercase text-gray-300">
                  COR / OPÇÃO: <span className="text-tactical-gold">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedColor === color
                          ? 'bg-tactical-gold text-black shadow-md ring-2 ring-tactical-gold/50'
                          : 'bg-[#171a21] text-gray-300 border border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <span>{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. SELEÇÃO DE TAMANHO / MEDIDA (cm, m, calçado, P/M/G/GG) */}
            {availableSizesForColor.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-bold uppercase text-gray-300 flex justify-between">
                  <span>TAMANHO OU MEDIDA *</span>
                  {currentVariant && (
                    <span className="text-[9px] font-mono text-gray-400">SKU: {currentVariant.sku}</span>
                  )}
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                  {availableSizesForColor.map((v) => {
                    const isSelected = selectedSize === v.size;
                    // Estoque 0 é simbólico: a variante permanece disponível para compra normalmente
                    const isOutOfStock = v.stock < 0;

                    return (
                      <button
                        key={v.id || v.size}
                        disabled={isOutOfStock}
                        onClick={() => setSelectedSize(v.size)}
                        className={`p-1.5 sm:p-2 rounded text-center text-xs font-bold font-mono transition-all border ${
                          isSelected
                            ? 'bg-tactical-gold text-black border-tactical-gold shadow'
                            : isOutOfStock
                            ? 'bg-gray-900 text-gray-600 border-gray-800 line-through opacity-50 cursor-not-allowed'
                            : 'bg-[#171a21] text-white border-gray-700 hover:border-tactical-gold'
                        }`}
                      >
                        <div className="text-xs sm:text-sm">{v.size}</div>
                        <div className="text-[8px] sm:text-[9px] font-sans font-normal text-gray-400">
                          {isOutOfStock ? 'Esgotado' : (v.stock > 0 ? `${v.stock} un.` : 'Em Estoque')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Descrição Detalhada */}
            {product.description && (
              <div className="border-t border-gray-800 pt-2 space-y-0.5 text-xs text-gray-400">
                <span className="font-bold text-gray-300 uppercase tracking-wider block text-[10px]">DETALHES:</span>
                <p className="leading-relaxed text-[11px] text-gray-300 line-clamp-3">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Rodapé e Botão Adicionar */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            {addedToast ? (
              <div className="bg-emerald-600 text-white p-2.5 rounded font-bold text-center text-xs flex items-center justify-center gap-2 animate-bounce">
                <Check className="w-4 h-4" /> PRODUTO ADICIONADO AO PEDIDO COM SUCESSO!
              </div>
            ) : (
              <button
                onClick={handleConfirmAddToCart}
                className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-base sm:text-xl font-bold py-2.5 sm:py-3 px-4 rounded shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>CONFIRMAR & ADICIONAR</span>
              </button>
            )}

            <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-gray-500 pt-0.5">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-tactical-gold" /> Garantia Oficial</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-tactical-gold" /> Envio Brasil</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
