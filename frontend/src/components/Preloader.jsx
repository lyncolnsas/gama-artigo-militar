import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { Shield } from 'lucide-react';

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INICIALIZANDO SISTEMA TÁTICO...');
  const [headerData, setHeaderData] = useState({
    title: 'TACTIKO',
    subtitle: 'GAMA STORE',
    buttonText: 'TACTICAL & OUTDOOR GEAR'
  });

  const preloaderRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadRealData = async () => {
      try {
        if (isMounted) {
          setProgress(15);
          setStatusText('CARREGANDO CONFIGURAÇÕES DO CMS...');
        }

        // 1. Fetch CMS Sections para obter o nome/logo configurado no HEADER
        const secRes = await fetch('/api/sections').catch(() => null);
        if (secRes && secRes.ok) {
          const sections = await secRes.json();
          const headerSection = sections.find(s => s.sectionKey === 'HEADER');
          if (headerSection && isMounted) {
            setHeaderData({
              title: headerSection.title || 'TACTIKO',
              subtitle: headerSection.subtitle || 'GAMA STORE',
              buttonText: headerSection.buttonText || 'TACTICAL & OUTDOOR GEAR'
            });
          }
        }

        if (isMounted) {
          setProgress(45);
          setStatusText('CARREGANDO PRODUTOS & CATEGORIAS...');
        }

        // 2. Fetch Produtos e Categorias em paralelo
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/categories').catch(() => null),
          fetch('/api/products').catch(() => null)
        ]);

        if (isMounted) {
          setProgress(75);
          setStatusText('PRÉ-CARREGANDO MÍDIAS & IMAGENS...');
        }

        // 3. Pré-carregar imagens dos produtos para evitar piscar imagens no site
        if (prodRes && prodRes.ok) {
          const prods = await prodRes.json();
          const imageUrls = prods.slice(0, 4).map(p => p.media?.[0]?.url).filter(Boolean);
          await Promise.all(
            imageUrls.map(url => new Promise(resolve => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = resolve;
              img.src = url;
            }))
          );
        }

        if (isMounted) {
          setProgress(100);
          setStatusText('SISTEMA PRONTO PARA OPERAÇÃO');

          // Transição de saída GSAP
          const tl = gsap.timeline({
            onComplete: () => {
              if (onComplete) onComplete();
            }
          });

          tl.to(contentRef.current, {
            scale: 0.92,
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in'
          })
          .to(preloaderRef.current, {
            yPercent: -100,
            duration: 0.8,
            ease: 'expo.inOut'
          });
        }
      } catch (err) {
        if (isMounted) {
          setProgress(100);
          if (onComplete) onComplete();
        }
      }
    };

    loadRealData();

    return () => { isMounted = false; };
  }, [onComplete]);

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-[9999] bg-[#0a0c0e] flex flex-col items-center justify-center select-none overflow-hidden"
    >
      {/* Background Glowing Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#c59b27_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div ref={contentRef} className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        
        {/* Logo/Marca Dinâmica (Idêntica à Landing Page e 100% Editável pelo CMS) */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 bg-[#c59b27] blur-xl opacity-40 animate-pulse rounded-full" />
          <div className="relative bg-[#141619] border-2 border-[#c59b27] p-4 rounded-xl shadow-2xl flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 text-[#c59b27]" />
            <div className="bg-[#c59b27] text-black font-black text-2xl px-3 py-1 rounded-sm tracking-tighter">
              {headerData.title}
            </div>
          </div>
        </div>

        {/* Subtítulo e Slogan da Marca */}
        <h1 className="font-tactical text-3xl sm:text-4xl font-bold tracking-widest text-white leading-none mb-1">
          {headerData.subtitle}
        </h1>
        <span className="text-[10px] text-[#c59b27] font-bold tracking-[0.25em] uppercase mb-8">
          {headerData.buttonText}
        </span>

        {/* Barra de Progresso Real */}
        <div className="w-full bg-[#171a21] border border-gray-800 rounded-full h-2 p-0.5 mb-3 overflow-hidden shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-[#c59b27] rounded-full transition-all duration-300 shadow-[0_0_12px_#c59b27]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Texto de Status & Porcentagem */}
        <div className="w-full flex justify-between items-center text-[10px] font-mono font-bold text-gray-400">
          <span className="truncate pr-2 text-gray-300">{statusText}</span>
          <span className="text-[#c59b27] font-black text-sm">{progress}%</span>
        </div>

      </div>

      {/* Footer do Preloader */}
      <div className="absolute bottom-6 text-[10px] font-mono text-gray-600 tracking-widest uppercase">
        REAL-TIME HYDRATION & CORE LOAD • v1.0
      </div>
    </div>
  );
}
