---
type: project
created: 2026-07-26
updated: 2026-07-26
---

# SmartCut AI / Gama Store Enterprise - Registro de Progresso & Convenções

## 1. CMS & Seções da Landing Page 100% Editáveis
- **Seções Mapeadas:** 9 seções ativas (`TOPBAR`, `HEADER`, `HERO_MAIN`, `BESTSELLERS_HEADER`, `POPULAR_CATEGORIES`, `VIDEO_FEATURE`, `WARRIOR_PROMO`, `VALUE_PROPS`, `FOOTER_CONTACT`).
- **Persistência de Dados:** Tabela `SiteSection` no SQLite (Prisma ORM). Atributos estendidos são salvos como JSON na coluna `contentData` e expandidos automaticamente pelo controller `expandSection` em `src/controllers/sectionController.js`.

## 2. Autenticação & TopBar
- **Botão Topbar Limpo:** Botões "Entrar / Cadastrar" removidos da barra superior da Landing Page por diretiva do cliente.
- **Rota de Admin:** Acesso discreto ao painel através de `/admin` ou `?admin=true`.
- **Credenciais Admin Padrão:** `admin@gamastore.com` / `admin123`.

## 3. Desempenho & Eliminação de Flicker no Reload (F5)
- Preconnect Google Fonts configurado em `index.html`.
- Carregamento de dados em lote no `StoreFront.jsx` via `Promise.all`.
- Cartões Skeleton Loaders (`animate-pulse`) exibidos durante o `loadingProducts` para evitar Cumulative Layout Shift (CLS).

## 4. Animações GSAP & ScrollTrigger
- **React Safety:** Todas as animações no `StoreFront.jsx` usam `gsap.context()` com `containerRef` e cleanup no unmount `ctx.revert()`.
- **Efeitos Implementados:** Parallax no Hero (`scrub: 0.5`), animações com easings `expo.out` e `power4.out`, rotação 3D na seção de vídeo (`rotateY`), revelação elástica no promo banner (`back.out(1.4)`).

## 5. Preloader Dinâmico High-Tech
- **Componente:** `src/components/Preloader.jsx`
- **Hidratação Real:** Sincronizado com o carregamento real da API (`/api/sections`, `/api/products`, `/api/categories`) e cache das mídias.
- **Identidade Dinâmica:** Lê o título, subtítulo e slogan diretamente da seção `HEADER` do CMS.
- **Escopo:** Executa apenas na Landing Page pública (`!isAdminRoute`).

## 6. Upload de Mídias & Galeria
- **Correção de z-index:** `MediaPickerModal.jsx` ajustado para `z-[200]` para abrir sobreposto ao modal do editor CMS (`z-[100]`).
- **Upload Direto:** Botão "ENVIAR FOTO/VÍDEO" e pré-visualização ao vivo integrados ao modal de edição de seção.
- **Callback Seguro:** `handleFileUpload` em `AdminPanel.jsx` verifica `typeof callback === 'function'` para evitar erros de execução.

## 7. Controle Total da Seção Popular Categories (5 Banners Editáveis)
- **Banner Destaque (Esquerda):** Menu suspenso para escolher a Categoria Principal.
- **Grade 4 Quadros (Direita):** Seletores independentes para os 4 quadros (Quadro 1 Sup. Esq, Quadro 2 Sup. Dir, Quadro 3 Inf. Esq, Quadro 4 Inf. Dir).
- **Persistência:**IDs salvos em `subCategoryIds`.
- **Interatividade:** O clique em qualquer um dos 5 quadros na Landing Page filtra a loja instantaneamente para aquela categoria e realiza scroll até o catálogo.

## 8. Backups de Segurança
- Cópia de segurança criada em `c:\Gama-Store\backups\src_backup_gsap`.
