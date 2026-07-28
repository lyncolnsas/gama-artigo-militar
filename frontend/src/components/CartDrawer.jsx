import React, { useState, useRef, useEffect } from 'react';
import { X, ShoppingBag, Trash2, Tag, Check, ArrowRight, MessageCircle, MapPin } from 'lucide-react';

const IMPERATRIZ_NEIGHBORHOODS = [
  "Aero Clube", "Alto da Boa Vista", "Bacuri", "Beira Rio", "Boca da Mata", "Bom Jesus", "Bom Sucesso", "Caema", 
  "Centro", "Conjunto Vitória", "Entroncamento", "Jardim América", "Jardim Imperatriz", "Jardim São Luís", "Jardim Tropical", 
  "Juçara", "Maranhão Novo", "Mercadinho", "Mutirão", "Nova Imperatriz", "Parque Alvorada", "Parque Anhanguera", "Parque do Buriti", 
  "Parque Santa Lúcia", "Parque São José", "Planalto", "Santa Cruz", "Santa Inês", "Santa Rita", "Três Poderes", "Vila Cafeteira", 
  "Vila Fiquene", "Vila Ipiranga", "Vila Lobão", "Vila Machado", "Vila Mariana", "Vila Nova", "Vila Redenção", "Vila Vitória"
];

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Form de Checkout
  const [step, setStep] = useState('cart'); // 'cart' ou 'checkout' ou 'success'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  // Autocomplete State
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState([]);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [viaCepStreets, setViaCepStreets] = useState([]);
  const [isSearchingViaCep, setIsSearchingViaCep] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState(null);
  const [botPublicConfig, setBotPublicConfig] = useState({ isBotEnabled: true, whatsappNumber: '5511999998888' });

  useEffect(() => {
    fetch('/api/bot/public-config')
      .then(res => res.json())
      .then(data => setBotPublicConfig(data))
      .catch(() => {});
  }, []);

  const addressWrapperRef = useRef(null);

  // Debounced ViaCEP search para ruas
  useEffect(() => {
    const query = addressSearchQuery.trim();
    
    if (query.length < 3 || query.includes('Imperatriz')) {
      setViaCepStreets([]);
      setIsSearchingViaCep(false);
      return;
    }

    setIsSearchingViaCep(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://viacep.com.br/ws/MA/Imperatriz/${encodeURIComponent(query)}/json/`);
        const data = await res.json();
        if (Array.isArray(data)) {
          // Limita a 5 ruas pra não poluir
          setViaCepStreets(data.slice(0, 5));
        } else {
          setViaCepStreets([]);
        }
      } catch (err) {
        console.error("ViaCEP error", err);
        setViaCepStreets([]);
      } finally {
        setIsSearchingViaCep(false);
      }
    }, 600); // 600ms debounce para evitar excesso de requisições

    return () => clearTimeout(delayDebounceFn);
  }, [addressSearchQuery]);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(event.target)) {
        setShowAddressSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => {
    const price = parseFloat(item.promoPrice || item.price);
    return acc + price * item.quantity;
  }, 0);

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode, 
          amount: subtotal,
          items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity }))
        })
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponError('');
      } else {
        setCouponError(data.error || 'Cupom inválido.');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Erro ao validar cupom.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !shippingAddress) {
      alert('Por favor, preencha Nome, WhatsApp e Endereço de entrega.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cartItems.map(i => ({ productId: i.id, quantity: i.quantity })),
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        paymentMethod: 'PEDIDO_DE_MATERIAIS_WHATSAPP',
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        setCreatedOrderData(resData);
        setStep('success');
        onClearCart();

        if (resData.whatsappLink) {
          window.open(resData.whatsappLink, '_blank');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao gerar pedido de materiais.');
      }
    } catch (error) {
      alert('Erro de comunicação com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#141619] border-l border-gray-800 text-white flex flex-col h-full shadow-2xl">
        
        {/* Header do Carrinho */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0b0f17]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-tactical-gold" />
            <h3 className="font-tactical text-2xl font-bold tracking-wider">SOLICITAÇÃO DE MATERIAIS</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ETAPA 1: ITENS DO CARRINHO */}
        {step === 'cart' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                  <ShoppingBag className="w-12 h-12 mb-3 text-gray-700" />
                  <p className="font-tactical text-xl font-bold text-gray-400">NENHUM MATERIAL SELECIONADO</p>
                  <p className="text-xs text-gray-500 mt-1">Adicione produtos do catálogo tático.</p>
                </div>
              ) : (
                cartItems.map((item) => {
                  const itemKey = item.cartKey || item.id;
                  return (
                    <div key={itemKey} className="bg-[#1e232d] p-3 rounded border border-gray-800 flex gap-3 items-center">
                      <img
                        src={item.media?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded bg-black flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">{item.title}</h4>
                        {(item.selectedColor || item.selectedSize) && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {item.selectedColor && <span>Cor: {item.selectedColor} </span>}
                            {item.selectedSize && <span>Tamanho: {item.selectedSize}</span>}
                          </div>
                        )}
                        <div className="text-tactical-gold font-bold text-xs mt-0.5">
                          R$ {parseFloat(item.price || item.promoPrice || 0).toFixed(2)}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-800 text-white rounded font-bold text-xs hover:bg-gray-700"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-800 text-white rounded font-bold text-xs hover:bg-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(itemKey)}
                        className="p-2 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-800 bg-[#0c0e11] space-y-4">
                
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-500" />
                      <input
                        type="text"
                        placeholder="CUPOM DE DESCONTO (ex: TACTICO5)"
                        className="w-full bg-[#181b22] border border-gray-700 text-white text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-tactical-gold uppercase"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-xs font-bold border border-gray-700"
                    >
                      {couponLoading ? '...' : 'APLICAR'}
                    </button>
                  </div>

                  {couponError && <p className="text-red-400 text-[11px] pl-1 font-bold">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-emerald-400 text-[10px] pl-1 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Cupom {appliedCoupon.code} aplicado! {appliedCoupon.categoryName ? `(${appliedCoupon.categoryName})` : ''} (-R$ {discountAmount.toFixed(2)})
                    </p>
                  )}
                </form>

                <div className="space-y-1 text-xs border-t border-gray-800 pt-3">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal da Solicitação:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Desconto ({appliedCoupon.code}):</span>
                      <span>- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-white pt-1">
                    <span>Valor Estimado:</span>
                    <span className="text-tactical-gold">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('checkout')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-tactical text-sm sm:text-lg font-bold py-2.5 sm:py-3 rounded shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>ENVIAR PEDIDO VIA WHATSAPP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ETAPA 2: CHECKOUT DE MATERIAIS */}
        {step === 'checkout' && (
          <form onSubmit={handleCheckoutSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto p-4 space-y-4">
            <div>
              <h4 className="font-tactical text-lg sm:text-xl font-bold text-tactical-gold mb-1">DADOS DA SOLICITAÇÃO</h4>
              <p className="text-gray-400 text-xs mb-3">Preencha seus dados para direcionar o pedido ao WhatsApp da equipe.</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#181b22] border border-gray-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-tactical-gold"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="ex: Capitão Silva"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">WhatsApp / Telefone *</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-[#181b22] border border-gray-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-tactical-gold"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-8888"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">E-mail de Contato</label>
                    <input
                      type="email"
                      className="w-full bg-[#181b22] border border-gray-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-tactical-gold"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                </div>

                <div className="relative" ref={addressWrapperRef}>
                  <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Endereço de Entrega / Unidade *</label>
                  <textarea
                    rows="3"
                    required
                    className="w-full bg-[#181b22] border border-gray-700 text-white text-xs px-3 py-2 rounded focus:outline-none focus:border-tactical-gold"
                    value={shippingAddress}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShippingAddress(val);
                      setAddressSearchQuery(val);
                      
                      // Bairros Autocomplete logic
                      if (val.length >= 2 && !val.includes('Imperatriz')) {
                        const lowerVal = val.toLowerCase();
                        const matches = IMPERATRIZ_NEIGHBORHOODS.filter(n => n.toLowerCase().includes(lowerVal));
                        setFilteredNeighborhoods(matches.slice(0, 4)); // max 4 bairros
                        setShowAddressSuggestions(true);
                      } else {
                        setShowAddressSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      if (shippingAddress.length >= 2 && !shippingAddress.includes('Imperatriz')) {
                        setShowAddressSuggestions(true);
                      }
                    }}
                    placeholder="Digite sua Rua ou Bairro para buscar..."
                  />

                  {/* Autocomplete Dropdown */}
                  {showAddressSuggestions && (filteredNeighborhoods.length > 0 || viaCepStreets.length > 0 || isSearchingViaCep) && (
                    <div className="absolute z-50 w-full mt-1 bg-[#1e232d] border border-gray-700 rounded-md shadow-2xl overflow-y-auto">
                      
                      {/* Bairros Section */}
                      {filteredNeighborhoods.length > 0 && (
                        <div>
                          <div className="p-2 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-800 bg-[#171a21]">
                            📍 Bairros Locais
                          </div>
                          {filteredNeighborhoods.map((bairro, idx) => (
                            <div
                              key={`b-${idx}`}
                              className="px-3 py-2 text-xs text-white hover:bg-tactical-gold hover:text-black cursor-pointer flex items-center gap-2 transition-colors border-b border-gray-800"
                              onClick={() => {
                                setShippingAddress(`Bairro ${bairro}, Imperatriz - MA. Rua/Unidade: `);
                                setShowAddressSuggestions(false);
                              }}
                            >
                              <MapPin className="w-3 h-3" />
                              <span>{bairro}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ruas (ViaCEP) Section */}
                      {addressSearchQuery.length >= 3 && (
                        <div>
                          <div className="p-2 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-800 bg-[#171a21] flex justify-between items-center">
                            <span>🛣️ Busca de Ruas On-line</span>
                            {isSearchingViaCep && <span className="animate-pulse text-tactical-gold">Buscando...</span>}
                          </div>
                          
                          {viaCepStreets.map((rua, idx) => (
                            <div
                              key={`r-${idx}`}
                              className="px-3 py-2 text-xs text-white hover:bg-tactical-gold hover:text-black cursor-pointer flex flex-col transition-colors border-b border-gray-800"
                              onClick={() => {
                                setShippingAddress(`${rua.logradouro}, Bairro ${rua.bairro}, Imperatriz - MA. CEP: ${rua.cep}. Número: `);
                                setShowAddressSuggestions(false);
                              }}
                            >
                              <span className="font-bold">{rua.logradouro}</span>
                              <span className="text-[10px] opacity-70">Bairro {rua.bairro} • CEP {rua.cep}</span>
                            </div>
                          ))}

                          {!isSearchingViaCep && viaCepStreets.length === 0 && (
                            <div className="px-3 py-2 text-[10px] text-gray-500 text-center">
                              Nenhuma rua exata encontrada online.
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span>Total dos Materiais:</span>
                <span className="text-tactical-gold text-lg">R$ {finalTotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="w-1/3 bg-gray-800 text-white font-bold py-2.5 rounded text-xs"
                >
                  VOLTAR
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-500 text-white font-tactical text-sm sm:text-lg font-bold py-2.5 rounded shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{submitting ? 'GERANDO...' : 'ENVIAR AO WHATSAPP'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ETAPA 3: SUCESSO E DISPARO WHATSAPP */}
        {step === 'success' && createdOrderData && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/40">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="font-tactical text-xl sm:text-3xl font-bold text-white">PEDIDO REGISTRADO COM SUCESSO!</h3>
            
            <div className="bg-[#1e232d] p-4 rounded border border-gray-800 text-left w-full space-y-2 text-xs">
              <p className="text-gray-400">Número da Solicitação: <strong className="text-tactical-gold">{createdOrderData.order?.orderNumber}</strong></p>
              <p className="text-gray-400">Cliente: <strong className="text-white">{createdOrderData.order?.customerName}</strong></p>
              <p className="text-gray-400">Valor Estimado: <strong className="text-emerald-400 font-bold">R$ {parseFloat(createdOrderData.order?.finalAmount).toFixed(2)}</strong></p>
            </div>

            {createdOrderData.isBotEnabled ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded text-xs text-emerald-200 text-left w-full space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  🤖 Bot WhatsApp Ativo
                </p>
                <p className="text-[11px] text-emerald-300">
                  Uma mensagem de confirmação de pedido foi enviada para o seu WhatsApp! Você pode acompanhar o status da entrega interagindo com nosso bot.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded text-xs text-amber-200 text-left w-full space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  🔗 Direcionamento Direto WhatsApp
                </p>
                <p className="text-[11px] text-amber-300">
                  Clique no botão abaixo para enviar o resumo completo da sua solicitação diretamente para o atendimento da nossa loja.
                </p>
              </div>
            )}

            {createdOrderData.whatsappLink && (
              <a
                href={createdOrderData.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-tactical text-sm sm:text-lg font-bold py-2.5 rounded flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                <span>ABRIR CONVERSA NO WHATSAPP</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-tactical text-base font-bold py-2 rounded"
            >
              FECHAR
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
