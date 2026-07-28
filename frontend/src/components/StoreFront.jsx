import React, { useState, useEffect, useRef } from 'react';
import MediaViewer from './MediaViewer';
import ProductDetailModal from './ProductDetailModal';
import { 
  ShoppingBag, Star, ShieldCheck, Phone, Truck, RefreshCw, Award, MessageCircle, User, LogOut, Heart, Search, ChevronDown, ChevronUp, Layers, Check, Clock, Sparkles, X, Tag, FolderTree, Edit
} from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Wrapper para seções editáveis no CMS
const EditableSection = ({ sectionKey, isCmsMode, onEditSection, children, className = '' }) => {
  if (!isCmsMode) return <div className={className}>{children}</div>;

  return (
    <div 
      className={`relative group cursor-pointer ${className}`}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if(onEditSection) onEditSection(sectionKey);
      }}
    >
      <div className="absolute inset-0 z-30 pointer-events-none group-hover:border-[3px] group-hover:border-tactical-gold group-hover:bg-tactical-gold/10 transition-all rounded" />
      <button
        type="button"
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-40 bg-tactical-gold text-black px-3 py-1.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-105 pointer-events-none flex items-center justify-center gap-1.5 font-tactical tracking-wider text-sm font-bold"
      >
        <Edit className="w-4 h-4" /> <span className="hidden sm:inline">EDITAR</span>
      </button>
      <div className="pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default function StoreFront({ 
  onOpenCart, 
  onOpenAuth, 
  onAddToCart, 
  cartCount = 0,
  currentUser,
  onLogout,
  isCmsMode = false,
  cmsSections = null,
  onEditSection = null
}) {
  // CMS Sections State
  const [localSections, setLocalSections] = useState({
    TOPBAR: {
      title: 'Atendimento: (+55) 11 99999-8888',
      subtitle: 'Avaliação 4.9/5.0',
      buttonText: 'CUPOM: TACTICO5 (-5% OFF)'
    },
    HEADER: {
      title: 'TACTIKO',
      subtitle: 'GAMA STORE',
      buttonText: 'Tactical & Outdoor Gear'
    },
    HERO_MAIN: {
      title: 'COMBAT ESSENTIALS',
      subtitle: 'Tecnologia audiovisual e vestuário de nível militar testado em condições extremas.',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=80',
      buttonText: 'VIEW COLLECTION >',
      buttonLink: '#bestsellers',
      featuredLabel: '★ 50% OFF EM PRODUTOS SELECIONADOS'
    },
    BESTSELLERS_HEADER: {
      title: 'BESTSELLERS & CATÁLOGO',
      subtitle: 'Clique nos produtos para ver todas as especificações e selecionar tamanhos/medidas.'
    },
    VIDEO_FEATURE: {
      title: 'TACTICAL EQUIPMENT AND MILITARY GEAR',
      subtitle: 'Desenvolvidos com base nos padrões mais exigentes das forças especiais. Nossos equipamentos combinam mobilidade, resistência balística e praticidade no campo de operação.',
      mediaType: 'YOUTUBE',
      mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      buttonText: 'EXPLORAR EQUIPAMENTOS >',
      buttonLink: '#bestsellers',
      featuredLabel: 'ENGENHARIA E RESISTÊNCIA MILITAR'
    },
    WARRIOR_PROMO: {
      title: 'WARRIOR ASSAULT SYSTEMS',
      subtitle: 'SUPER OFERTA LIMITADA • DESCONTOS EXCLUSIVOS DE ATÉ 50% OFF',
      buttonText: 'SHOP NOW >',
      buttonLink: '#bestsellers',
      featuredLabel: 'SUPER OFERTA LIMITADA'
    },
    POPULAR_CATEGORIES: {
      title: 'POPULAR CATEGORIES',
      subtitle: 'Navegue pelas nossas categorias principais de alta demanda.',
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80',
      buttonText: 'VER CATEGORIA >',
      buttonLink: '#bestsellers',
      featuredTitle: 'OUTERWEAR & PROTEÇÃO',
      featuredLabel: 'CATEGORIA DESTAQUE'
    },
    VALUE_PROPS: {
      title: 'Por que escolher a Gama Store?',
      subtitle: 'ENVIO RÁPIDO|GARANTIA TOTAL|SUPORTE 24/7|QUALIDADE MILITAR',
      buttonText: 'Entrega garantida para todo o Brasil|30 dias para trocas e devoluções|Atendimento via WhatsApp e Bot|Produtos testados e homologados'
    },
    FOOTER_CONTACT: {
      title: 'TACTIKO / GAMA STORE',
      subtitle: 'Líder em vestuário e equipamentos táticos com atendimento 100% dinâmico via WhatsApp.',
      buttonText: 'WhatsApp: (+55) 11 99999-8888|Email: contato@gamastore.com.br|Segunda a Sexta: 08h às 18h'
    },
    FOOTER: {
      title: 'TACTIKO / GAMA STORE',
      subtitle: 'Líder em vestuário e equipamentos táticos com atendimento 100% dinâmico via WhatsApp.'
    }
  });

  const sections = React.useMemo(() => {
    if (isCmsMode && cmsSections) {
      const map = {};
      cmsSections.forEach(s => {
        map[s.sectionKey] = s;
      });
      return { ...localSections, ...map };
    }
    return localSections;
  }, [isCmsMode, cmsSections, localSections]);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const selectedCategoryName = selectedCategoryId === 'ALL' 
    ? 'Todas' 
    : (categories.find(c => c.id === selectedCategoryId)?.name || 'Categorias');
  
  // Modal de Detalhes & Seleção de Tamanhos do Produto
  const [activeProductForModal, setActiveProductForModal] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Pesquisa em Tempo Real
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Filtro Sanfona de Categorias
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [secRes, catRes, prodRes] = await Promise.all([
          fetch('/api/sections').catch(() => null),
          fetch('/api/categories').catch(() => null),
          fetch('/api/products').catch(() => null)
        ]);

        if (secRes && secRes.ok) {
          const data = await secRes.json();
          const sectionMap = {};
          data.forEach(s => { sectionMap[s.sectionKey] = s; });
          if (isMounted) setLocalSections(prev => ({ ...prev, ...sectionMap }));
        }

        if (catRes && catRes.ok) {
          const cats = await catRes.json();
          if (isMounted) setCategories(cats);
        }

        if (prodRes && prodRes.ok) {
          const prods = await prodRes.json();
          if (isMounted) setProducts(prods);
        }
      } catch (e) {
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  const containerRef = useRef(null);

  // Animações de Scroll com GSAP & ScrollTrigger Ultra-Profissionais
  useEffect(() => {
    if (isCmsMode || loadingProducts) return;

    const ctx = gsap.context(() => {
      // 1. Hero Main Timeline (Expo Easing)
      const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      heroTl
        .fromTo('.gsap-hero-content > *',
          { y: 50, opacity: 0, filter: 'blur(4px)' },
          { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.12, delay: 0.2 }
        )
        .fromTo('.gsap-hero-media',
          { scale: 0.92, opacity: 0, filter: 'blur(8px)' },
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.2 },
          '-=0.8'
        );

      // Hero Subtle Parallax on Scroll
      gsap.to('.gsap-hero-media', {
        y: 40,
        ease: 'none',
        scrollTrigger: {
          trigger: '.gsap-hero-content',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5
        }
      });

      // 2. Bestsellers Product Cards Smooth Stagger (Power4 Easing)
      gsap.fromTo('.gsap-bestseller-card',
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '#bestsellers',
            start: 'top 82%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 3. Popular Categories Scroll Depth Reveal
      gsap.fromTo('.gsap-category-card',
        { y: 50, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: '#categorias',
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 4. Video Feature Dual-Door Slide
      gsap.fromTo('.gsap-video-media',
        { x: -60, opacity: 0, rotateY: 10 },
        {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#video-feature',
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        }
      );
      gsap.fromTo('.gsap-video-text',
        { x: 60, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#video-feature',
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 5. Promotional Banner Elastic Entrance
      gsap.fromTo('.gsap-promo-banner',
        { scale: 0.92, opacity: 0, filter: 'brightness(0.5)' },
        {
          scale: 1,
          opacity: 1,
          filter: 'brightness(1)',
          duration: 1,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: '#promocao',
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

      // 6. Value Props Bounce & Stagger
      gsap.fromTo('.gsap-value-item',
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: '.gsap-value-container',
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

    }, containerRef);

    return () => ctx.revert();
  }, [isCmsMode, loadingProducts]);

  // Fechar janela de pesquisa ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Produtos filtrados por categoria
  const filteredProducts = selectedCategoryId === 'ALL'
    ? products
    : products.filter(p => p.categoryId === selectedCategoryId);

  // Resultados de Pesquisa Instantânea
  const searchResultsProducts = searchTerm.trim() === ''
    ? []
    : products.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const searchResultsCategories = searchTerm.trim() === ''
    ? []
    : categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Rastreamento de Pesquisas de Clientes (para Analytics)
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    const timer = setTimeout(() => {
      const term = searchTerm.trim();
      const count = products.filter(p => 
        p.title.toLowerCase().includes(term.toLowerCase()) ||
        p.description?.toLowerCase().includes(term.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(term.toLowerCase())
      ).length;

      fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term, resultsCount: count })
      }).catch(() => {});
    }, 700);

    return () => clearTimeout(timer);
  }, [searchTerm, products]);

  // Abrir Modal de Produto
  const handleOpenProductDetail = (product) => {
    setActiveProductForModal(product);
    setIsDetailModalOpen(true);
    setIsSearchOpen(false);
    if (product && product.id) {
      fetch(`/api/products/${product.id}/view`, { method: 'POST' }).catch(() => {});
    }
  };

  // Tratamento ao Clicar em Adicionar ao Pedido
  const handleProductCardAddToCart = (product) => {
    if (product.variants && product.variants.length > 0) {
      // Se tem tamanhos/cores, obriga a abrir o modal para escolher
      handleOpenProductDetail(product);
    } else {
      // Se produto simples, adiciona direto
      onAddToCart(product);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0f1115] text-gray-200 font-sans selection:bg-tactical-gold selection:text-black">
      
      {/* Modal de Detalhes do Produto & Seleção de Tamanho */}
      <ProductDetailModal
        product={activeProductForModal}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAddToCart={onAddToCart}
      />

      {/* 1. TOP UTILITY BAR */}
      <EditableSection sectionKey="TOPBAR" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <div className="bg-[#0a0c0e] border-b border-gray-800 text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center gap-4 text-gray-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-tactical-gold" /> {sections.TOPBAR?.title || 'Atendimento: (+55) 11 99999-8888'}
              </span>
              <span className="hidden md:flex items-center gap-1 border-l border-gray-800 pl-4">
                <Star className="w-3.5 h-3.5 text-tactical-gold fill-tactical-gold" /> {sections.TOPBAR?.subtitle || 'Avaliação 4.9/5.0'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <span className="bg-tactical-gold/10 text-tactical-gold px-2.5 py-0.5 rounded font-bold border border-tactical-gold/30">
                {sections.TOPBAR?.buttonText || 'CUPOM: TACTICO5 (-5% OFF)'}
              </span>
              
              {currentUser && (
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-tactical-gold" /> {currentUser.name}
                  </span>
                  <button onClick={onLogout} title="Sair" className="text-gray-500 hover:text-red-400">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </EditableSection>

      {/* 2. MAIN HEADER COM CAMPO DE PESQUISA EM TEMPO REAL */}
      <EditableSection sectionKey="HEADER" isCmsMode={isCmsMode} onEditSection={onEditSection} className="sticky top-0 z-40">
        <header className="bg-[#0f1115]/95 backdrop-blur border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="bg-tactical-gold text-black font-black text-2xl px-3 py-1 rounded-sm tracking-tighter">
                {sections.HEADER?.title || 'TACTIKO'}
              </div>
              <div className="hidden sm:block">
                <span className="font-tactical text-2xl text-white tracking-widest block leading-none">{sections.HEADER?.subtitle || 'GAMA STORE'}</span>
                <span className="text-[10px] text-gray-400 tracking-wider font-semibold uppercase">{sections.HEADER?.buttonText || 'Tactical & Outdoor Gear'}</span>
              </div>
            </div>

            {/* BARRA DE PESQUISA EM TEMPO REAL COM POPOVER INSTANTÂNEO */}
            <div className="flex-1 max-w-md relative" ref={searchRef}>
              <div className="relative flex items-center">
                <input
                  type="text"
                  className="w-full bg-[#171a21] border border-gray-700 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-tactical-gold focus:ring-1 focus:ring-tactical-gold transition-all"
                  placeholder="Pesquisar por nome, bota, jaqueta, cinto, toalha..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 text-xs text-gray-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* JANELINHA DE PESQUISA EM TEMPO REAL (LIVE POPOVER) */}
              {isSearchOpen && searchTerm.trim() !== '' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 w-[92vw] sm:w-[110%] max-w-lg md:w-full mt-2 bg-[#141619] border border-gray-700 rounded-lg shadow-2xl z-50 max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-gray-800">
                  
                  {/* Categorias Encontradas */}
                  {searchResultsCategories.length > 0 && (
                    <div className="p-2.5 sm:p-3 bg-[#0f1115]">
                      <span className="text-[10px] font-bold uppercase text-tactical-gold tracking-wider block mb-1.5">
                        🏷️ CATEGORIAS ENCONTRADAS
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {searchResultsCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setSelectedCategoryId(cat.id);
                              setIsSearchOpen(false);
                              setSearchTerm('');
                              document.getElementById('bestsellers')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-xs bg-gray-800 hover:bg-tactical-gold hover:text-black text-gray-200 px-2.5 py-1 rounded font-bold transition-colors"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Produtos Encontrados */}
                  <div className="p-2.5 sm:p-3">
                    <span className="text-[10px] font-bold uppercase text-tactical-gold tracking-wider block mb-2">
                      📦 PRODUTOS ENCONTRADOS ({searchResultsProducts.length})
                    </span>
                    
                    {searchResultsProducts.length === 0 ? (
                      <div className="text-xs text-gray-500 py-4 text-center">
                        Nenhum produto encontrado para "{searchTerm}".
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {searchResultsProducts.map(prod => (
                          <div
                            key={prod.id}
                            onClick={() => {
                              handleOpenProductDetail(prod);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-start gap-3 p-2 bg-[#171a21] hover:bg-[#1e232d] rounded-lg cursor-pointer transition-all border border-gray-800 hover:border-tactical-gold/50"
                          >
                            <div className="w-12 h-12 bg-black rounded border border-gray-800 overflow-hidden flex-shrink-0 mt-0.5">
                              <MediaViewer mediaUrl={prod.media?.[0]?.url} mediaType={prod.media?.[0]?.type} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="text-xs font-bold text-white leading-snug">{prod.title}</div>
                              <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
                                <span className="text-[10px] text-gray-400">{prod.category?.name || 'Tático'}</span>
                                <span className="text-xs font-black text-tactical-gold font-mono whitespace-nowrap">R$ {parseFloat(prod.price).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-bold tracking-wider font-tactical">
              <a href="#" className="text-tactical-gold hover:text-white transition-colors">HOME</a>
              <a href="#bestsellers" className="text-gray-300 hover:text-tactical-gold transition-colors">CATÁLOGO</a>
              <a href="#categorias" className="text-gray-300 hover:text-tactical-gold transition-colors">CATEGORIAS</a>
              <a href="#video-feature" className="text-gray-300 hover:text-tactical-gold transition-colors">MÍDIA & VÍDEOS</a>
              <a href="#promocao" className="text-gray-300 hover:text-tactical-gold transition-colors">OFERTAS</a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenCart}
                className="relative bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-xl font-bold px-4 py-2 rounded-sm transition-all flex items-center gap-2 shadow"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline">PEDIDO DE MATERIAIS</span>
                {cartCount > 0 && (
                  <span className="bg-black text-tactical-gold text-xs font-sans font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      </EditableSection>

      {/* 3. HERO BANNER PRINCIPAL */}
      <EditableSection sectionKey="HERO_MAIN" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <section className="relative bg-[#0f1115] border-b border-gray-800 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 items-center min-h-[520px]">
            
            <div className="lg:col-span-6 p-8 lg:p-12 space-y-6 z-10 gsap-hero-content">
              {sections.HERO_MAIN?.featuredLabel && (
                <div className="inline-flex items-center gap-2 bg-tactical-gold/15 text-tactical-gold border border-tactical-gold/30 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  <span>{sections.HERO_MAIN?.featuredLabel}</span>
                </div>
              )}

              <h1 className="font-tactical text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-none">
                {sections.HERO_MAIN?.title || 'COMBAT ESSENTIALS'}
              </h1>

              <p className="text-gray-300 text-xs sm:text-base leading-relaxed max-w-lg">
                {sections.HERO_MAIN?.subtitle}
              </p>

              <div className="pt-2 flex items-center gap-4">
                <a
                  href={sections.HERO_MAIN?.buttonLink || '#bestsellers'}
                  className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-lg sm:text-2xl font-bold px-6 sm:px-8 py-2.5 sm:py-3 rounded-sm shadow-xl transition-all inline-flex items-center gap-2"
                >
                  <span>{sections.HERO_MAIN?.buttonText || 'VIEW COLLECTION >'}</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 h-full min-h-[280px] sm:min-h-[350px] relative bg-black gsap-hero-media">
              <MediaViewer
                mediaUrl={sections.HERO_MAIN?.mediaUrl}
                mediaType={sections.HERO_MAIN?.mediaType}
                className="w-full h-full min-h-[280px] sm:min-h-[400px] object-cover"
              />
            </div>
          </div>
        </section>
      </EditableSection>

      {/* 4. SEÇÃO BESTSELLERS & FILTRO POR CATEGORIA (SIDEBAR À ESQUERDA) */}
      <EditableSection sectionKey="BESTSELLERS_HEADER" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <section id="bestsellers" className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-16">
        
        {/* Header da Seção */}
        <div className="mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-800">
          <h2 className="font-tactical text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wide leading-none">
            {sections.BESTSELLERS_HEADER?.title || 'BESTSELLERS & CATÁLOGO'}
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {sections.BESTSELLERS_HEADER?.subtitle || 'Clique nos produtos para ver todas as especificações e selecionar tamanhos/medidas.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* 1. VISUALIZAÇÃO DESKTOP: MENU LATERAL FIXO À ESQUERDA (lg:block hidden) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="bg-[#141619] border border-gray-800 rounded-lg p-4 space-y-3 sticky top-24">
              <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
                <Layers className="w-4 h-4 text-tactical-gold" />
                <span className="text-sm font-bold text-white font-tactical tracking-wider uppercase">
                  VER CATEGORIAS
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                <button
                  onClick={() => setSelectedCategoryId('ALL')}
                  className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-all ${
                    selectedCategoryId === 'ALL'
                      ? 'bg-tactical-gold text-black border-tactical-gold font-bold shadow'
                      : 'bg-[#171a21] text-gray-300 border-gray-800 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center text-tactical-gold font-bold text-xs">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <span className="text-xs">Todas as Categorias</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${selectedCategoryId === 'ALL' ? 'bg-black/30 text-black' : 'bg-black/50 text-tactical-gold'}`}>
                    {products.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = products.filter(p => p.categoryId === cat.id).length;
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`p-2.5 rounded-lg border text-left flex justify-between items-center transition-all ${
                        isSelected
                          ? 'bg-tactical-gold text-black border-tactical-gold font-bold shadow'
                          : 'bg-[#171a21] text-gray-300 border-gray-800 hover:border-gray-600 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-7 h-7 rounded object-cover flex-shrink-0 border border-gray-700/50"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-black/40 flex items-center justify-center text-gray-400 font-bold text-xs flex-shrink-0">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-xs truncate">{cat.name}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 ${isSelected ? 'bg-black/30 text-black' : 'bg-black/50 text-tactical-gold'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. VISUALIZAÇÃO CELULAR (MOBILE): BARRA FLUIDA COM SWIPE HORIZONTAL E BOTÃO EXPANSÍVEL (lg:hidden) */}
          <div className="lg:hidden mb-4 space-y-2">
            <div className="flex items-center justify-between bg-[#141619] border border-gray-800 p-2.5 rounded-lg shadow">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-tactical-gold" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">VER CATEGORIAS</span>
                <span className="text-[10px] font-mono bg-tactical-gold/20 text-tactical-gold px-1.5 py-0.5 rounded font-bold">
                  {selectedCategoryName}
                </span>
              </div>

              <button
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="flex items-center gap-1 text-xs font-bold text-tactical-gold bg-tactical-gold/10 hover:bg-tactical-gold/20 px-2.5 py-1 rounded transition-colors"
              >
                <span>{isAccordionOpen ? 'FECHAR' : 'VER LISTA'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Menu Expandido Celular (Filtro Sanfona / Accordion) */}
            {isAccordionOpen && (
              <div className="bg-[#141619] border border-gray-800 rounded-lg p-3 space-y-2 animate-fadeIn shadow-xl">
                <span className="text-[10px] font-bold text-tactical-gold uppercase tracking-wider block border-b border-gray-800 pb-1.5">
                  SELECIONE UMA CATEGORIA:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => { setSelectedCategoryId('ALL'); setIsAccordionOpen(false); }}
                    className={`p-2.5 rounded-lg border text-left flex justify-between items-center ${
                      selectedCategoryId === 'ALL' ? 'bg-tactical-gold text-black font-bold' : 'bg-[#171a21] text-gray-300 border-gray-800'
                    }`}
                  >
                    <span className="text-xs font-bold">Todas as Categorias</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/30">{products.length}</span>
                  </button>

                  {categories.map((cat) => {
                    const count = products.filter(p => p.categoryId === cat.id).length;
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategoryId(cat.id); setIsAccordionOpen(false); }}
                        className={`p-2.5 rounded-lg border text-left flex justify-between items-center ${
                          isSelected ? 'bg-tactical-gold text-black font-bold' : 'bg-[#171a21] text-gray-300 border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                          ) : (
                            <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-xs truncate">{cat.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-black/30 text-black' : 'bg-black/50 text-tactical-gold'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* GRID DE PRODUTOS FILTRADOS (2 COLUNAS EM CELULAR, 3 COLUNAS EM DESKTOP) */}
          <div className="lg:col-span-9">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {loadingProducts ? (
                [...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#171a21] border border-gray-800 rounded-sm overflow-hidden animate-pulse flex flex-col justify-between h-[360px] p-3 space-y-3">
                    <div className="aspect-square bg-gray-800/80 rounded w-full" />
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="h-2.5 bg-gray-800 rounded w-1/3" />
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                      </div>
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                      <div className="h-9 bg-gray-800 rounded w-full mt-2" />
                    </div>
                  </div>
                ))
              ) : (
                filteredProducts.map((prod) => {
                  const primaryMedia = prod.media?.[0];
                  const hasVariants = prod.variants && prod.variants.length > 0;

                return (
                  <div key={prod.id} className="product-card-light gsap-bestseller-card rounded-sm overflow-hidden flex flex-col justify-between group border border-gray-200 shadow-md">
                    
                    {/* Imagem Clicável (Abre Detalhes do Produto) */}
                    <div 
                      className="relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
                      onClick={() => handleOpenProductDetail(prod)}
                    >
                      <MediaViewer
                        mediaUrl={primaryMedia?.url}
                        mediaType={primaryMedia?.type}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {prod.isMadeToOrder ? (
                        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-500 text-black font-extrabold text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded shadow uppercase font-mono tracking-wider flex items-center gap-1">
                          🚚 SOB ENCOMENDA
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600 text-white font-bold text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded uppercase">
                          -20% OFF
                        </span>
                      )}

                      <button className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/80 hover:bg-white p-1 sm:p-1.5 rounded-full text-gray-700 shadow transition-all">
                        <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    <div className="p-2.5 sm:p-4 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Categoria do Produto */}
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                          {prod.category?.name || 'TÁTICO'}
                        </span>
                        
                        {/* Título Clicável */}
                        <h3 
                          onClick={() => handleOpenProductDetail(prod)}
                          className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 mt-0.5 group-hover:text-amber-600 cursor-pointer transition-colors"
                        >
                          {prod.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500 text-[10px] sm:text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                        ))}
                        <span className="text-gray-500 text-[9px] sm:text-[10px] ml-0.5">({prod.reviewsCount || 12})</span>
                      </div>

                      {/* Badge de indicação de Variantes/Tamanhos */}
                      {hasVariants && (
                        <div className="text-[9px] sm:text-[10px] text-gray-500 font-mono bg-gray-100 p-1 sm:p-1.5 rounded border border-gray-200 truncate">
                          📏 Vários Tamanhos
                        </div>
                      )}

                      <div className="pt-1.5 sm:pt-2 border-t border-gray-100">
                        <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                          <span className="text-sm sm:text-lg font-black text-gray-900 font-mono">
                            R$ {parseFloat(prod.price).toFixed(2)}
                          </span>
                          {prod.promoPrice && (
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through font-mono">
                              R$ {parseFloat(prod.promoPrice).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleProductCardAddToCart(prod)}
                          className="w-full bg-[#141619] hover:bg-tactical-gold hover:text-black text-white font-tactical text-xs sm:text-lg font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-sm transition-all flex items-center justify-center gap-1 sm:gap-2"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                          <span>{hasVariants ? 'VER TAMANHOS' : 'ADICIONAR'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
              {filteredProducts.length === 0 && !loadingProducts && (
                <div className="col-span-full py-12 text-center text-gray-400">
                  Nenhum produto encontrado nesta categoria.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      </EditableSection>

      {/* 5. POPULAR CATEGORIES - 100% CMS-DRIVEN */}
      <EditableSection sectionKey="POPULAR_CATEGORIES" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <section id="categorias" className="bg-[#141619] py-8 sm:py-16 border-y border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-6 sm:mb-8">
              <h2 className="font-tactical text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wide">
                {sections.POPULAR_CATEGORIES?.title || 'POPULAR CATEGORIES'}
              </h2>
              <p className="text-gray-400 text-xs">
                {sections.POPULAR_CATEGORIES?.subtitle || 'Navegue pelas nossas categorias principais de alta demanda.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Banner Destaque da Categoria - editável via CMS */}
              <div
                className="lg:col-span-7 relative h-[420px] rounded-sm overflow-hidden group cursor-pointer border border-gray-800 gsap-category-card"
                onClick={() => {
                  if (!isCmsMode) {
                    const link = sections.POPULAR_CATEGORIES?.buttonLink;
                    if (link && link.startsWith('category:')) {
                      const catId = link.replace('category:', '');
                      setSelectedCategoryId(catId);
                      const bestsellersEl = document.getElementById('bestsellers');
                      if (bestsellersEl) bestsellersEl.scrollIntoView({ behavior: 'smooth' });
                    } else if (link) {
                      window.location.assign(link);
                    }
                  }
                }}
              >
                <img
                  src={sections.POPULAR_CATEGORIES?.mediaUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80'}
                  alt={sections.POPULAR_CATEGORIES?.featuredTitle || 'Categoria Destaque'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <span className="text-tactical-gold text-xs font-bold uppercase tracking-widest">
                    {sections.POPULAR_CATEGORIES?.featuredLabel || 'CATEGORIA DESTAQUE'}
                  </span>
                  <h3 className="font-tactical text-5xl font-bold text-white tracking-widest">
                    {sections.POPULAR_CATEGORIES?.featuredTitle || 'OUTERWEAR & PROTEÇÃO'}
                  </h3>
                  <button className="mt-4 bg-tactical-gold text-black font-tactical text-xl font-bold px-6 py-2 w-fit">
                    {sections.POPULAR_CATEGORIES?.buttonText || 'VER CATEGORIA >'}
                  </button>
                </div>
              </div>

              {/* Sub-categorias dinâmicas selecionadas pelo Admin no CMS */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {(() => {
                  const rawSlotIds = sections.POPULAR_CATEGORIES?.subCategoryIds
                    ? sections.POPULAR_CATEGORIES.subCategoryIds.split(',')
                    : [];

                  const secondaryCategories = [0, 1, 2, 3].map((idx) => {
                    const chosenId = rawSlotIds[idx];
                    if (chosenId) {
                      const found = categories.find(c => String(c.id) === String(chosenId));
                      if (found) return found;
                    }
                    return categories[idx] || null;
                  }).filter(Boolean);

                  return secondaryCategories.map((cat, i) => (
                    <div
                      key={cat.id || i}
                      className="relative h-48 rounded-sm overflow-hidden group cursor-pointer border border-gray-800 z-10 pointer-events-auto gsap-category-card"
                      onClick={(e) => {
                        if (!isCmsMode) {
                          setSelectedCategoryId(cat.id);
                          const bestsellersEl = document.getElementById('bestsellers');
                          if (bestsellersEl) bestsellersEl.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 flex items-end">
                        <h4 className="font-tactical text-lg font-bold text-white leading-tight">{cat.name}</h4>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 text-tactical-gold text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {products.filter(p => p.categoryId === cat.id).length} itens
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </section>
      </EditableSection>

      {/* 6. VÍDEO FEATURE */}
      <EditableSection sectionKey="VIDEO_FEATURE" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <section id="video-feature" className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 relative rounded-sm overflow-hidden border border-gray-800 shadow-2xl bg-black gsap-video-media">
              <div className="relative aspect-video">
                <MediaViewer
                  mediaUrl={sections.VIDEO_FEATURE?.mediaUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                  mediaType={sections.VIDEO_FEATURE?.mediaType || 'YOUTUBE'}
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 gsap-video-text">
              <span className="text-tactical-gold text-xs font-bold uppercase tracking-widest">
                {sections.VIDEO_FEATURE?.featuredLabel || 'ENGENHARIA E RESISTÊNCIA MILITAR'}
              </span>
              <h2 className="font-tactical text-5xl font-bold text-white leading-tight">
                {sections.VIDEO_FEATURE?.title || 'TACTICAL EQUIPMENT AND MILITARY GEAR'}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {sections.VIDEO_FEATURE?.subtitle}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <a href={sections.VIDEO_FEATURE?.buttonLink || '#bestsellers'} className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-2xl font-bold px-8 py-2 rounded-sm shadow transition-all">
                  {sections.VIDEO_FEATURE?.buttonText || 'EXPLORAR EQUIPAMENTOS >'}
                </a>
              </div>
            </div>
          </div>
        </section>
      </EditableSection>

      {/* 7. PROMOTIONAL BANNER */}
      <EditableSection sectionKey="WARRIOR_PROMO" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <section id="promocao" className="relative bg-gradient-to-r from-black via-[#141619] to-black py-16 border-y border-gray-800 overflow-hidden gsap-promo-banner">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              {sections.WARRIOR_PROMO?.featuredLabel && (
                <span className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-sm">
                  {sections.WARRIOR_PROMO?.featuredLabel}
                </span>
              )}
              <h2 className="font-tactical text-6xl font-bold text-white tracking-widest">
                {sections.WARRIOR_PROMO?.title || 'WARRIOR ASSAULT SYSTEMS'}
              </h2>
              <p className="text-tactical-gold font-bold text-xl">{sections.WARRIOR_PROMO?.subtitle}</p>
            </div>

            <a href={sections.WARRIOR_PROMO?.buttonLink || '#bestsellers'} className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-3xl font-bold px-10 py-3 rounded-sm shadow-2xl transition-all flex-shrink-0">
              {sections.WARRIOR_PROMO?.buttonText || 'SHOP NOW >'}
            </a>
          </div>
        </section>
      </EditableSection>

      {/* 8. PROPOSIÇÕES DE VALOR - 100% CMS-DRIVEN */}
      <EditableSection sectionKey="VALUE_PROPS" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <section className="bg-[#0a0c0e] py-12 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            {sections.VALUE_PROPS?.title && (
              <div className="text-center mb-8">
                <h2 className="font-tactical text-3xl font-bold text-white tracking-wide">{sections.VALUE_PROPS?.title}</h2>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 gsap-value-container">
              {(() => {
                const icons = [Truck, ShieldCheck, RefreshCw, Award];
                const titles = (sections.VALUE_PROPS?.subtitle || 'ENVIO RÁPIDO|GARANTIA TOTAL|SUPORTE 24/7|QUALIDADE MILITAR').split('|');
                const descs = (sections.VALUE_PROPS?.buttonText || 'Entrega garantida|30 dias de garantia|Atendimento WhatsApp|Qualidade certificada').split('|');
                return titles.map((t, idx) => {
                  const Icon = icons[idx] || Award;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-2 gsap-value-item">
                      <Icon className="w-8 h-8 text-tactical-gold" />
                      <h4 className="font-tactical text-xl font-bold text-white tracking-wider">{t}</h4>
                      <p className="text-gray-500 text-xs">{descs[idx] || ''}</p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>
      </EditableSection>

      {/* 9. FOOTER - 100% EDITÁVEL VIA CMS */}
      <EditableSection sectionKey="FOOTER_CONTACT" isCmsMode={isCmsMode} onEditSection={onEditSection}>
        <footer className="bg-black text-gray-400 py-12 text-xs border-t border-gray-900">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Coluna 1: Nome da Loja & Descrição */}
            <div>
              <div className="font-tactical text-3xl font-bold text-white tracking-wider mb-2">
                {sections.FOOTER_CONTACT?.title || 'TACTIKO / GAMA STORE'}
              </div>
              <p className="text-gray-500 leading-relaxed">
                {sections.FOOTER_CONTACT?.subtitle || 'Líder em vestuário e equipamentos táticos com atendimento 100% dinâmico via WhatsApp.'}
              </p>
            </div>

            {/* Coluna 2: Navegação Rápida */}
            <div>
              <h5 className="font-tactical text-lg font-bold text-white mb-3 tracking-wider">
                {sections.FOOTER_CONTACT?.featuredTitle || 'NAVEGAÇÃO RÁPIDA'}
              </h5>
              <ul className="space-y-1.5">
                {(sections.FOOTER_CONTACT?.navLinks || 'Home:#|Catálogo:#bestsellers|Categorias:#categorias|Ofertas Especiais:#promocao')
                  .split('|').map((item, i) => {
                    const parts = item.split(':');
                    const label = parts[0];
                    const href = parts[1] || '#';
                    return (
                      <li key={i}>
                        <a href={href} className="hover:text-tactical-gold transition-colors">
                          {label}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Coluna 3: Atendimento */}
            <div>
              <h5 className="font-tactical text-lg font-bold text-white mb-3 tracking-wider">
                {sections.FOOTER_CONTACT?.featuredLabel || 'ATENDIMENTO'}
              </h5>
              <ul className="space-y-1.5">
                {(sections.FOOTER_CONTACT?.buttonText || 'WhatsApp: (+55) 11 99999-8888|Email: contato@gamastore.com.br|Segunda a Sexta: 08h às 18h')
                  .split('|').map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>

            {/* Coluna 4: Segurança & Pagamento */}
            <div>
              <h5 className="font-tactical text-lg font-bold text-white mb-3 tracking-wider">
                {sections.FOOTER_CONTACT?.secTitle || 'SEGURANÇA & PAGAMENTO'}
              </h5>
              <p className="text-gray-500 mb-2">
                {sections.FOOTER_CONTACT?.secText || 'Ambiente 100% seguro com criptografia de ponta a ponta.'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(sections.FOOTER_CONTACT?.paymentBadges || 'PIX|Cartão|Boleto')
                  .split('|').map((badge, idx) => (
                    <span key={idx} className="bg-gray-900 px-2 py-1 rounded text-[10px] font-bold text-gray-300 border border-gray-800">
                      {badge.trim()}
                    </span>
                  ))}
              </div>
            </div>

          </div>

          {/* Rodapé / Copyright */}
          <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-gray-900 text-center text-gray-600 text-[11px]">
            {sections.FOOTER_CONTACT?.copyrightText || `© ${new Date().getFullYear()} TACTIKO / GAMA STORE. Todos os direitos reservados.`}
          </div>
        </footer>
      </EditableSection>

    </div>
  );
}
