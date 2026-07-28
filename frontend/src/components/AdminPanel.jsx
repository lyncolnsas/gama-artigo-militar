
import React, { useState, useEffect } from 'react';
import MediaViewer from './MediaViewer';
import MediaPickerModal from './MediaPickerModal';
import ProductVariantEditor from './ProductVariantEditor';
import VisualCmsEditor from './VisualCmsEditor';
import { 
  Upload, Plus, Trash2, Edit, Save, RefreshCw, CheckCircle, Smartphone, Video, Image, Link as LinkIcon, Star,
  BarChart3, ShoppingBag, Users, Tag, FolderTree, ShieldCheck, DollarSign, Layers, Clock, HardDrive, Download, Search, MessageCircle, Lock, LogIn, Eye, Monitor, HardDriveUpload, Check, ExternalLink, Sparkles, Camera, FileText, Truck, Package, UserPlus, Key
} from 'lucide-react';

export default function AdminPanel({ onSectionUpdate, onProductUpdate, onGoToStore }) {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;

      const savedTab = localStorage.getItem('gama_store_admin_tab');
      return savedTab || 'analytics';
    } catch (e) {
      return 'analytics';
    }
  });

  const changeTab = (newTab) => {
    setActiveTab(newTab);
    try {
      localStorage.setItem('gama_store_admin_tab', newTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  const [authHeader, setAuthHeader] = useState({});

  // Lê o token SEMPRE do localStorage em tempo real (evita race condition com estado React)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('gama_store_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('gama_store_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch(e) {
      return null;
    }
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Form de Login do Admin (Segurança)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 1. Analytics State
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalSalesCount: 0,
    totalOrders: 0,
    pendingOrdersCount: 0,
    totalProductsCount: 0,
    totalUsersCount: 0,
    recentOrders: []
  });

  const [detailedAnalytics, setDetailedAnalytics] = useState({
    mostViewed: [],
    mostSold: [],
    mostSearched: [],
    lowStockProducts: []
  });

  // 1.1 Rascunhos & Modal de Produtos State
  const [savedDraft, setSavedDraft] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // 2. CMS State & Seções Completas
  const [sections, setSections] = useState([]);
  const [selectedSectionKey, setSelectedSectionKey] = useState('HERO_MAIN');
  const [sectionForm, setSectionForm] = useState({
    sectionKey: 'HERO_MAIN',
    title: 'COMBAT ESSENTIALS',
    subtitle: 'Tecnologia audiovisual e vestuário de nível militar testado em condições extremas.',
    mediaType: 'IMAGE',
    mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=80',
    buttonText: 'VIEW COLLECTION >',
    buttonLink: '#bestsellers',
    featuredTitle: '',
    featuredLabel: '',
    isActive: true
  });
  const [cmsStateMap, setCmsStateMap] = useState({});
  // 3. Produtos State
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({
    id: null,
    title: '',
    slug: '',
    description: '',
    price: '',
    promoPrice: '',
    stock: 10,
    isBestseller: false,
    isMadeToOrder: false,
    productionDays: 0,
    categoryId: '',
    mediaUrlInput: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    mediaTypeInput: 'IMAGE',
    mediaList: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', type: 'IMAGE', isPrimary: true }
    ],
    variants: []
  });
  const [activeMediaColor, setActiveMediaColor] = useState(null);
  
  // 4. Categorias CRUD State
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({
    id: null,
    name: '',
    image: '',
    description: ''
  });

  // 5. Galeria de Arquivos Uploaded (Em Uso / Sem Uso)
  const [mediaLibrary, setMediaLibrary] = useState({
    totalCount: 0,
    inUseCount: 0,
    unusedCount: 0,
    inUse: [],
    unused: []
  });
  const [mediaSubTab, setMediaSubTab] = useState('inUse');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // 6. Pedidos B2B State
  const [orders, setOrders] = useState([]);

  // 7. Cupons State
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    value: '5',
    minSpend: '100',
    categoryId: '',
    usageLimit: '500'
  });

  // 8. Backups State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  // 9. Usuários State & Modais
  const [users, setUsers] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ userId: '', userName: '', newPassword: '' });

  const handleUpdateUserRole = async (userId, role) => {
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        showNotification('Permissão do usuário atualizada!');
        fetchUsers();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao alterar permissão.', 'error');
      }
    } catch (e) {
      showNotification('Erro ao conectar ao servidor.', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) {
      showNotification('Nome, E-mail e Senha são obrigatórios.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        showNotification(`Usuário "${userForm.name}" cadastrado com sucesso!`);
        setUserForm({ name: '', email: '', password: '', role: 'ADMIN' });
        setIsUserModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao cadastrar usuário.', 'error');
      }
    } catch (e) {
      showNotification('Erro de conexão com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 4) {
      showNotification('A nova senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/users/${passwordForm.userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ newPassword: passwordForm.newPassword })
      });
      if (res.ok) {
        showNotification(`Senha do usuário "${passwordForm.userName}" alterada com sucesso!`);
        setPasswordForm({ userId: '', userName: '', newPassword: '' });
        setIsPasswordModalOpen(false);
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao alterar senha.', 'error');
      }
    } catch (e) {
      showNotification('Erro de conexão com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userItem) => {
    if (currentUser && currentUser.id === userItem.id) {
      showNotification('Você não pode excluir sua própria conta enquanto estiver logado.', 'error');
      return;
    }
    if (!window.confirm(`Deseja realmente excluir o usuário "${userItem.name}" (${userItem.email})?`)) return;
    try {
      const res = await fetch(`/api/auth/users/${userItem.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification(`Usuário "${userItem.name}" excluído.`);
        fetchUsers();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao excluir usuário.', 'error');
      }
    } catch (e) {
      showNotification('Erro de conexão.', 'error');
    }
  };

  // 10. WhatsApp Bot State
  const [botConfig, setBotConfig] = useState({
    isBotEnabled: true,
    whatsappNumber: '5511999998888',
    welcomeMessage: '',
    connectionStatus: 'DISCONNECTED',
    qrCodeData: null
  });
  const [botLoading, setBotLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    checkAdminSession();
    fetchCategories();
    fetchSections();
    fetchProducts();
  }, []);

  useEffect(() => {
    setCmsStateMap(prev => ({
      ...prev,
      [sectionForm.sectionKey]: sectionForm
    }));
  }, [sectionForm]);

  const forceLogout = () => {
    localStorage.removeItem('gama_store_token');
    localStorage.removeItem('gama_store_user');
    setCurrentUser(null);
    setAuthHeader({});
  };

  const checkAdminSession = async () => {
    const token = localStorage.getItem('gama_store_token');
    const userStr = localStorage.getItem('gama_store_user');

    if (!token || !userStr) {
      setCurrentUser(null);
      return;
    }

    // Valida o token no servidor (detecta tokens expirados/inválidos pós re-seed)
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        // Token inválido ou expirado — limpa sessão e força re-login
        forceLogout();
        return;
      }

      const serverUser = await res.json();
      if (serverUser.role !== 'ADMIN' && serverUser.role !== 'MANAGER') {
        forceLogout();
        return;
      }

      // Token válido — atualiza dados do usuário no localStorage com dados frescos do servidor
      localStorage.setItem('gama_store_user', JSON.stringify(serverUser));
      setAuthHeader({ 'Authorization': `Bearer ${token}` });
      setCurrentUser(serverUser);

      // Carrega todos os dados do painel
      fetchAnalytics();
      fetchDetailedAnalytics();
      fetchProductDraft();
      fetchOrders();
      fetchCoupons();
      fetchUsers();
      fetchBackups();
      fetchMediaLibrary();
      fetchBotConfig();
    } catch (e) {
      // Erro de rede — mantém sessão local para não deslogar offline
      try {
        const u = JSON.parse(userStr);
        if (u.role === 'ADMIN' || u.role === 'MANAGER') {
          setAuthHeader({ 'Authorization': `Bearer ${token}` });
          setCurrentUser(u);
        }
      } catch (_) {}
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });

      const data = await res.json();
      if (res.ok && (data.user.role === 'ADMIN' || data.user.role === 'MANAGER')) {
        localStorage.setItem('gama_store_token', data.token);
        localStorage.setItem('gama_store_user', JSON.stringify(data.user));
        setAuthHeader({ 'Authorization': `Bearer ${data.token}` });
        setCurrentUser(data.user);
        // Token já está no localStorage, getAuthHeaders() vai encontrá-lo
        fetchAnalytics();
        fetchDetailedAnalytics();
        fetchProductDraft();
        fetchOrders();
        fetchCoupons();
        fetchUsers();
        fetchBackups();
        fetchMediaLibrary();
        fetchBotConfig();
        showNotification(`Bem-vindo, Comandante ${data.user.name}!`);
      } else {
        setLoginError(data.error || 'Credenciais inválidas ou permissão insuficiente.');
      }
    } catch (err) {
      setLoginError('Erro de conexão ao servidor de autenticação.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('gama_store_token');
    localStorage.removeItem('gama_store_user');
    setCurrentUser(null);
    setAuthHeader({});
  };

  const showNotification = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- FETCHERS (usam getAuthHeaders() para ler token fresh do localStorage) ---
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', { headers: getAuthHeaders() });
      if (res.ok) setAnalytics(await res.json());
    } catch (e) {}
  };

  const fetchDetailedAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics/details', { headers: getAuthHeaders() });
      if (res.ok) setDetailedAnalytics(await res.json());
    } catch (e) {}
  };

  const fetchProductDraft = async () => {
    try {
      const res = await fetch('/api/admin/products/draft', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.draft) setSavedDraft(data);
        else setSavedDraft(null);
      }
    } catch (e) {}
  };

  // Auto-Save de Rascunhos em background
  useEffect(() => {
    if (!isProductModalOpen) return;
    if (!productForm.title && !productForm.description && (!productForm.variants || productForm.variants.length === 0)) return;

    const timer = setTimeout(() => {
      fetch('/api/admin/products/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ draftData: productForm })
      }).then(res => {
        if (res.ok) setSavedDraft({ draft: productForm, updatedAt: new Date().toISOString() });
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [productForm, isProductModalOpen]);

  const handleRestoreDraft = () => {
    if (savedDraft && savedDraft.draft) {
      setProductForm(savedDraft.draft);
      setIsProductModalOpen(true);
      showNotification('Rascunho do produto restaurado!');
    }
  };

  const handleDiscardDraft = async () => {
    try {
      await fetch('/api/admin/products/draft', { method: 'DELETE', headers: getAuthHeaders() });
      setSavedDraft(null);
      showNotification('Rascunho descartado.');
    } catch (e) {}
  };

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections');
      if (res.ok) {
        const data = await res.json();
        setSections(data);
        const initialMap = {};
        data.forEach(s => { initialMap[s.sectionKey] = s; });
        setCmsStateMap(initialMap);
      }
    } catch (e) {}
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (e) {}
  };

  const fetchMediaLibrary = async () => {
    try {
      const res = await fetch('/api/admin/media-library', { headers: getAuthHeaders() });
      if (res.ok) setMediaLibrary(await res.json());
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', { headers: getAuthHeaders() });
      if (res.ok) setOrders(await res.json());
    } catch (e) {}
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons', { headers: getAuthHeaders() });
      if (res.ok) setCoupons(await res.json());
    } catch (e) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users', { headers: getAuthHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/admin/backup', { headers: getAuthHeaders() });
      if (res.ok) setBackups(await res.json());
    } catch (e) {}
  };

  const fetchBotConfig = async () => {
    try {
      const res = await fetch('/api/admin/bot/config', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data);
      }
    } catch (e) {}
  };

  const handleSaveBotConfig = async (e) => {
    e.preventDefault();
    setBotLoading(true);
    try {
      const res = await fetch('/api/admin/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          isBotEnabled: botConfig.isBotEnabled,
          whatsappNumber: botConfig.whatsappNumber,
          welcomeMessage: botConfig.welcomeMessage
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data);
        showNotification('Configurações do WhatsApp Bot salvas!');
      } else {
        showNotification('Erro ao salvar configurações do Bot.', 'error');
      }
    } catch (err) {
      showNotification('Erro de comunicação.', 'error');
    } finally {
      setBotLoading(false);
    }
  };

  const handleRestartBot = async () => {
    setBotLoading(true);
    try {
      const res = await fetch('/api/admin/bot/restart', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBotConfig(data);
        showNotification('Comando de reconexão enviado ao WhatsApp Bot!');
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao reconectar bot.', 'error');
      }
    } catch (e) {
      showNotification('Erro ao reconectar.', 'error');
    } finally {
      setBotLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleFileUpload = async (e, callback) => {
    const file = e?.target?.files ? e.target.files[0] : e;
    if (!file || !(file instanceof File || file instanceof Blob)) return;

    const formData = new FormData();
    formData.append('media', file);

    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (!res.ok) throw new Error('Falha no upload');

      const data = await res.json();
      showNotification(`Upload concluído: ${data.filename}`);
      fetchMediaLibrary();
      if (typeof callback === 'function') {
        callback(data.url, data.mediaType);
      }
    } catch (err) {
      showNotification('Erro ao enviar arquivo.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      id: null,
      title: '',
      slug: '',
      description: '',
      price: '',
      promoPrice: '',
      stock: 0,
      isBestseller: false,
      isMadeToOrder: false,
      productionDays: 0,
      categoryId: '',
      mediaUrlInput: '',
      mediaTypeInput: 'IMAGE',
      mediaList: [],
      variants: []
    });
  };

  const handleSelectMediaUrl = (url, type = 'IMAGE') => {
    if (activeTab === 'sections') {
      setSectionForm(prev => ({ ...prev, mediaUrl: url, mediaType: type }));
    } else if (activeTab === 'categories') {
      setCategoryForm(prev => ({ ...prev, image: url }));
    } else if (activeTab === 'products') {
      setProductForm(prev => {
        if (activeMediaColor) {
          return {
            ...prev,
            mediaList: [
              ...prev.mediaList,
              { url, type, color: activeMediaColor, isPrimary: prev.mediaList.length === 0 }
            ]
          };
        } else {
          return {
            ...prev,
            mediaUrlInput: url,
            mediaTypeInput: type,
            mediaList: [
              { url, type, isPrimary: true, color: null },
              ...prev.mediaList.filter(m => !m.isPrimary && m.color !== null)
            ]
          };
        }
      });
      if (activeMediaColor) {
        showNotification(`Mídia selecionada para a cor ${activeMediaColor}!`);
      } else {
        showNotification('Mídia selecionada para o Produto!');
      }
    } else {
      navigator.clipboard.writeText(url);
      showNotification(`URL ${url} copiada para a área de transferência!`);
    }
    setIsMediaModalOpen(false);
    setActiveMediaColor(null);
  };

  const handleAddProductMedia = () => {
    if (!productForm.mediaUrlInput) return;
    const newMedia = {
      url: productForm.mediaUrlInput,
      type: productForm.mediaTypeInput || 'IMAGE',
      isPrimary: productForm.mediaList.length === 0
    };
    setProductForm(prev => ({
      ...prev,
      mediaList: [...prev.mediaList, newMedia],
      mediaUrlInput: ''
    }));
  };

  const handleRemoveProductMedia = (index) => {
    setProductForm(prev => ({
      ...prev,
      mediaList: prev.mediaList.filter((_, i) => i !== index)
    }));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      showNotification('Nome da categoria é obrigatório.', 'error');
      return;
    }

    try {
      const isEditing = !!categoryForm.id;
      const url = isEditing ? `/api/categories/${categoryForm.id}` : '/api/categories';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: categoryForm.name,
          image: categoryForm.image,
          description: categoryForm.description
        })
      });

      if (res.ok) {
        showNotification(`Categoria ${isEditing ? 'atualizada' : 'criada'} com sucesso!`);
        setCategoryForm({ id: null, name: '', image: '', description: '' });
        fetchCategories();
        fetchMediaLibrary();
      } else {
        showNotification('Erro ao salvar categoria.', 'error');
      }
    } catch (e) {
      showNotification('Erro de conexão.', 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('Categoria removida com sucesso!');
        fetchCategories();
        fetchMediaLibrary();
      }
    } catch (e) {
      showNotification('Erro ao comunicar com servidor.', 'error');
    }
  };

  const handleDeleteMedia = async (filename) => {
    if (!confirm(`Deseja realmente excluir permanentemente o arquivo ${filename}?`)) return;
    try {
      const res = await fetch(`/api/admin/media-library/${filename}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('Arquivo de mídia excluído permanentemente.');
        fetchMediaLibrary();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao excluir arquivo.', 'error');
      }
    } catch (e) {
      showNotification('Erro ao comunicar com o servidor.', 'error');
    }
  };

  const handleSelectSectionKey = (key) => {
    setSelectedSectionKey(key);
    const found = cmsStateMap[key] || sections.find(s => s.sectionKey === key);
    if (found) {
      setSectionForm({
        sectionKey: found.sectionKey,
        title: found.title || '',
        subtitle: found.subtitle || '',
        mediaType: found.mediaType || 'IMAGE',
        mediaUrl: found.mediaUrl || '',
        buttonText: found.buttonText || '',
        buttonLink: found.buttonLink || '',
        featuredTitle: found.featuredTitle || '',
        featuredLabel: found.featuredLabel || '',
        isActive: found.isActive !== undefined ? found.isActive : true
      });
    } else {
      setSectionForm({
        sectionKey: key,
        title: '',
        subtitle: '',
        mediaType: 'IMAGE',
        mediaUrl: '',
        buttonText: '',
        buttonLink: '',
        featuredTitle: '',
        featuredLabel: '',
        isActive: true
      });
    }
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(sectionForm)
      });

      if (res.ok) {
        showNotification(`Seção "${sectionForm.sectionKey}" salva no CMS!`);
        fetchSections();
        fetchMediaLibrary();
        if (onSectionUpdate) onSectionUpdate();
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.error || errData.message || 'Erro ao salvar seção.', 'error');
      }
    } catch (err) {
      showNotification('Erro de conexão com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      showNotification('Título e Preço são obrigatórios.', 'error');
      return;
    }

    setLoading(true);
    try {
      const isEditing = !!productForm.id;
      const url = isEditing ? `/api/products/${productForm.id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      // Se houver URL digitada no campo de mídia mas mediaList estiver vazio, adiciona a URL digitada
      let finalMediaList = productForm.mediaList || [];
      if (finalMediaList.length === 0 && productForm.mediaUrlInput) {
        finalMediaList = [{ url: productForm.mediaUrlInput, type: productForm.mediaTypeInput || 'IMAGE', isPrimary: true }];
      }

      const payload = {
        title: productForm.title,
        slug: productForm.slug || productForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: productForm.description || '',
        price: parseFloat(productForm.price),
        promoPrice: productForm.promoPrice ? parseFloat(productForm.promoPrice) : null,
        stock: parseInt(productForm.stock, 10) || 0,
        isBestseller: Boolean(productForm.isBestseller),
        isMadeToOrder: Boolean(productForm.isMadeToOrder),
        productionDays: parseInt(productForm.productionDays, 10) || 0,
        categoryId: productForm.categoryId || null,
        media: finalMediaList,
        variants: productForm.variants || []
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showNotification(`Produto ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        resetProductForm();
        fetchProducts();
        fetchMediaLibrary();
        if (onProductUpdate) onProductUpdate();
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.error || errData.details || 'Erro ao salvar produto.', 'error');
      }
    } catch (err) {
      showNotification('Erro de comunicação com o servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('Produto removido.');
        fetchProducts();
        fetchMediaLibrary();
        if (onProductUpdate) onProductUpdate();
      }
    } catch (e) {
      showNotification('Erro ao excluir produto.', 'error');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        showNotification(`Status do pedido alterado para ${status}!`);
        fetchOrders();
        fetchAnalytics();
      }
    } catch (e) {
      showNotification('Erro ao atualizar pedido.', 'error');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('Deseja realmente EXCLUIR este pedido?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('Pedido excluído com sucesso.');
        fetchOrders();
        fetchAnalytics();
      }
    } catch (e) {
      showNotification('Erro ao excluir pedido.', 'error');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        showNotification('Cupom de desconto criado!');
        setCouponForm({ code: '', discountType: 'PERCENTAGE', value: '5', minSpend: '100', categoryId: '', usageLimit: '500' });
        fetchCoupons();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao criar cupom.', 'error');
      }
    } catch (e) {
      showNotification('Erro ao criar cupom.', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('Cupom excluído.');
        fetchCoupons();
      }
    } catch (e) {
      showNotification('Erro ao remover cupom.', 'error');
    }
  };

  const handleGenerateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification('Backup do sistema gerado com sucesso!');
        fetchBackups();
      } else {
        showNotification('Erro ao gerar backup.', 'error');
      }
    } catch (e) {
      showNotification('Erro ao conectar ao servidor.', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async (filename) => {
    try {
      const res = await fetch(`/api/admin/backup/download/${filename}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Erro ao baixar arquivo');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      showNotification('Erro no download do backup', 'error');
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Deseja realmente excluir o arquivo de backup "${filename}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/backup/${filename}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showNotification(`Backup "${filename}" excluído com sucesso.`);
        fetchBackups();
      } else {
        const err = await res.json();
        showNotification(err.error || 'Erro ao excluir backup.', 'error');
      }
    } catch (e) {
      showNotification('Erro ao excluir backup.', 'error');
    }
  };

  const [backupConfig, setBackupConfig] = useState({ targetEmail: '', syncPath: '' });
  const [saveConfigLoading, setSaveConfigLoading] = useState(false);

  const fetchBackupConfig = async (headers) => {
    try {
      const res = await fetch('/api/admin/backup/config', { headers });
      if (res.ok) {
        const data = await res.json();
        setBackupConfig({
          targetEmail: data.targetEmail || '',
          syncPath: data.syncPath || ''
        });
      }
    } catch (e) {}
  };

  const handleSaveBackupConfig = async (e) => {
    e.preventDefault();
    setSaveConfigLoading(true);
    try {
      const res = await fetch('/api/admin/backup/config', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(backupConfig)
      });
      if (res.ok) {
        showNotification('Endereço e e-mail de backup salvos com sucesso!');
      } else {
        showNotification('Erro ao salvar configurações.', 'error');
      }
    } catch (err) {
      showNotification('Erro ao salvar configurações.', 'error');
    } finally {
      setSaveConfigLoading(false);
    }
  };

  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleRestoreBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!window.confirm('ATENÇÃO: Restaurar o backup irá sobrescrever o banco de dados e as mídias atuais! Deseja continuar?')) {
      return;
    }

    setRestoreLoading(true);
    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || 'Backup restaurado com sucesso!', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification(data.error || 'Erro ao restaurar backup.', 'error');
      }
    } catch (e) {
      showNotification('Erro na restauração do arquivo de backup.', 'error');
    } finally {
      setRestoreLoading(false);
      event.target.value = '';
    }
  };

  const handlePromoteUser = async (id, role) => {
    try {
      const res = await fetch(`/api/auth/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        showNotification(`Permissão alterada para ${role}!`);
        fetchUsers();
      }
    } catch (e) {
      showNotification('Erro ao alterar permissão.', 'error');
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // TELA DE LOGIN SEGURA SE NÃO ESTIVER AUTENTICADO
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#0f1115]">
        <div className="w-full max-w-md bg-[#171a21] border border-gray-800 rounded-lg p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-tactical-gold/10 text-tactical-gold border border-tactical-gold/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-tactical text-3xl font-bold text-white">ACESSO RESTRITO ADMIN</h2>
            <p className="text-gray-400 text-xs">Informe suas credenciais administrativas para acessar o painel `/admin`.</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/80 border border-red-500 text-red-200 text-xs rounded font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">E-mail do Administrador</label>
              <input
                type="email"
                required
                className="w-full bg-[#0f1115] border border-gray-700 text-white text-xs px-3 py-2.5 rounded focus:outline-none focus:border-tactical-gold"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@gamaartigomilitar.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Senha de Acesso</label>
              <input
                type="password"
                required
                className="w-full bg-[#0f1115] border border-gray-700 text-white text-xs px-3 py-2.5 rounded focus:outline-none focus:border-tactical-gold"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-2xl font-bold py-3 rounded shadow transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              <span>{loginLoading ? 'AUTENTICANDO...' : 'ENTRAR NO PAINEL ADMIN'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Header do Admin Logado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-gray-800 gap-4">
        <div>
          <div className="flex items-center gap-2 text-tactical-gold font-bold text-xs tracking-widest uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> PAINEL ENTERPRISE SESSÃO: {currentUser.name} ({currentUser.role})
          </div>
          <h1 className="font-tactical text-4xl font-extrabold text-white tracking-wide">
            CENTRAL DE GESTÃO GAMA STORE
          </h1>
          <p className="text-gray-400 text-xs mt-1">Gerenciador de Produtos, CMS, Mídias e Pedidos B2B via WhatsApp.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAdminLogout}
            className="bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold px-3 py-2 rounded"
          >
            Sair do Admin
          </button>
          {onGoToStore && (
            <button
              onClick={onGoToStore}
              className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-lg font-bold px-4 py-1.5 rounded text-xs transition-all"
            >
              VOLTAR À LOJA
            </button>
          )}
        </div>
      </div>

      <MediaPickerModal 
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setActiveMediaColor(null);
        }}
        mediaLibrary={mediaLibrary}
        onSelect={handleSelectMediaUrl}
        onUpload={(e) => handleFileUpload(e, (url, type) => handleSelectMediaUrl(url, type))}
        uploading={uploading}
        onDelete={handleDeleteMedia}
      />

      {/* 10 Abas de Módulos (FIXO NO TOPO AO ROLAR) */}
      <div className="sticky top-0 z-40 bg-[#0f1115]/95 backdrop-blur-md p-2 rounded-lg border border-gray-800 shadow-2xl mb-6 flex flex-wrap items-center gap-1">
        {[
          { id: 'analytics', label: '📊 Analytics', icon: BarChart3 },
          { id: 'sections', label: '🎨 CMS & Banners', icon: Layers },
          { id: 'products', label: '📦 Produtos', icon: ShoppingBag },
          { id: 'categories', label: '🏷️ Categorias (CRUD)', icon: FolderTree },
          { id: 'orders', label: '🛍️ Pedidos B2B', icon: Clock },
          { id: 'coupons', label: '🎟️ Cupons', icon: Tag },
          { id: 'backups', label: '💾 Backup & Drive', icon: HardDrive },
          { id: 'users', label: '👥 Usuários', icon: Users },
          { id: 'bot', label: '🤖 Bot WhatsApp', icon: Smartphone }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            className={`px-3 py-2 rounded text-xs font-bold font-tactical tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-tactical-gold text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toast Notification */}
      {message && (
        <div className={`mb-6 p-4 rounded border flex items-center gap-2 text-xs font-bold ${
          message.type === 'error' ? 'bg-red-950/80 border-red-500 text-red-200' : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
        }`}>
          <CheckCircle className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      {/* === MÓDULO 1: 📊 ANALYTICS COMPLETO === */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#171a21] p-5 rounded-xl border border-gray-800 space-y-1 shadow-sm">
              <div className="flex justify-between items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>RECEITA TOTAL</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-tactical font-extrabold text-white">
                R$ {analytics.totalRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-emerald-400 font-semibold">{analytics.totalSalesCount} vendas pagas</div>
            </div>

            <div className="bg-[#171a21] p-5 rounded-xl border border-gray-800 space-y-1 shadow-sm">
              <div className="flex justify-between items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>SOLICITAÇÕES DE PEDIDOS</span>
                <ShoppingBag className="w-4 h-4 text-tactical-gold" />
              </div>
              <div className="text-3xl font-tactical font-extrabold text-white">
                {analytics.totalOrders}
              </div>
              <div className="text-xs text-amber-400 font-semibold">{analytics.pendingOrdersCount} pendentes</div>
            </div>

            <div className="bg-[#171a21] p-5 rounded-xl border border-gray-800 space-y-1 shadow-sm">
              <div className="flex justify-between items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>PRODUTOS CADASTRADOS</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-tactical font-extrabold text-white">
                {analytics.totalProductsCount}
              </div>
              <div className="text-xs text-gray-400">Ativos no catálogo</div>
            </div>

            <div className="bg-[#171a21] p-5 rounded-xl border border-gray-800 space-y-1 shadow-sm">
              <div className="flex justify-between items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                <span>USUÁRIOS REGISTRADOS</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-tactical font-extrabold text-white">
                {analytics.totalUsersCount}
              </div>
              <div className="text-xs text-gray-400">Clientes & Admins</div>
            </div>
          </div>

          {/* PAINÉIS DE ANÁLISE DETALHADA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. PRODUTOS MAIS VISTOS */}
            <div className="bg-[#171a21] rounded-xl border border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="px-5 py-4 bg-[#13161d] border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-sky-400" />
                  <h3 className="font-tactical text-lg font-bold text-white uppercase tracking-wider">1. Produtos Mais Vistos</h3>
                </div>
                <span className="text-xs font-bold text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2.5 py-1 rounded-full">Top 10 Vitrine</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[380px] scrollbar-thin">
                {(!detailedAnalytics.mostViewed || detailedAnalytics.mostViewed.length === 0) ? (
                  <div className="py-8 text-center text-gray-500 text-xs">Nenhum dado de visualização registrado ainda.</div>
                ) : (
                  detailedAnalytics.mostViewed.map((p, idx) => {
                    const mediaUrl = p.media?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';
                    return (
                      <div key={p.id || idx} className="flex items-center justify-between p-3 bg-[#0f1115] border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-gray-800 text-gray-300 font-extrabold text-xs flex items-center justify-center flex-shrink-0">#{idx + 1}</span>
                          <div className="w-10 h-10 rounded bg-black overflow-hidden border border-gray-700 flex-shrink-0">
                            <MediaViewer mediaUrl={mediaUrl} mediaType={p.media?.[0]?.type || 'IMAGE'} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">R$ {parseFloat(p.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-3 py-1 rounded-lg">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{p.viewsCount || 0} visualizações</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. PRODUTOS MAIS VENDIDOS */}
            <div className="bg-[#171a21] rounded-xl border border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="px-5 py-4 bg-[#13161d] border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-tactical text-lg font-bold text-white uppercase tracking-wider">2. Produtos Mais Vendidos</h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full">Ranking Comercial</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[380px] scrollbar-thin">
                {(!detailedAnalytics.mostSold || detailedAnalytics.mostSold.length === 0) ? (
                  <div className="py-8 text-center text-gray-500 text-xs">Nenhum pedido finalizado para listar mais vendidos.</div>
                ) : (
                  detailedAnalytics.mostSold.map((item, idx) => {
                    const p = item.product;
                    const mediaUrl = p?.media?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';
                    return (
                      <div key={p?.id || idx} className="flex items-center justify-between p-3 bg-[#0f1115] border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 font-extrabold text-xs flex items-center justify-center flex-shrink-0">#{idx + 1}</span>
                          <div className="w-10 h-10 rounded bg-black overflow-hidden border border-gray-700 flex-shrink-0">
                            <MediaViewer mediaUrl={mediaUrl} mediaType={p?.media?.[0]?.type || 'IMAGE'} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{p?.title || 'Produto'}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">R$ {parseFloat(p?.price || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{item.totalQuantitySold} un. vendidas</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. TERMOS MAIS PESQUISADOS (INCLUINDO ITENS NÃO EXISTENTES NO CATÁLOGO!) */}
            <div className="bg-[#171a21] rounded-xl border border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="px-5 py-4 bg-[#13161d] border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-tactical-gold" />
                  <h3 className="font-tactical text-lg font-bold text-white uppercase tracking-wider">3. Termos & Buscas dos Clientes</h3>
                </div>
                <span className="text-xs font-bold text-tactical-gold bg-tactical-gold/10 border border-tactical-gold/30 px-2.5 py-1 rounded-full">Demanda do Mercado</span>
              </div>
              <div className="p-4 space-y-2.5 flex-1 overflow-y-auto max-h-[380px] scrollbar-thin">
                {(!detailedAnalytics.mostSearched || detailedAnalytics.mostSearched.length === 0) ? (
                  <div className="py-8 text-center text-gray-500 text-xs">Nenhuma pesquisa registrada no catálogo ou bot ainda.</div>
                ) : (
                  detailedAnalytics.mostSearched.map((s, idx) => {
                    const hasNoResults = s.lastResultsCount === 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#0f1115] border border-gray-800 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-bold text-white uppercase tracking-wide font-mono font-bold">"{s.query}"</span>
                            <span className="text-[10px] text-gray-400 block">{s.count} busca{s.count > 1 ? 's' : ''} realizada{s.count > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {hasNoResults ? (
                          <span className="text-[11px] font-bold text-red-400 bg-red-950/80 border border-red-800/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            ⚠️ 0 Resultados (Não Existe no Catálogo)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                            🟢 Encontrado ({s.lastResultsCount} itens)
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 4. ALERTA DE ESTOQUE BAIXO E PRODUTOS EM FALTA */}
            <div className="bg-[#171a21] rounded-xl border border-gray-800 overflow-hidden shadow-sm flex flex-col">
              <div className="px-5 py-4 bg-[#13161d] border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-400" />
                  <h3 className="font-tactical text-lg font-bold text-white uppercase tracking-wider">4. Alerta de Estoque Baixo / Em Falta</h3>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-full">Gerenciamento de Estoque</span>
              </div>
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[380px] scrollbar-thin">
                {(!detailedAnalytics.lowStockProducts || detailedAnalytics.lowStockProducts.length === 0) ? (
                  <div className="py-8 text-center text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Todos os produtos estão com estoque alto e saudável!
                  </div>
                ) : (
                  detailedAnalytics.lowStockProducts.map((p, idx) => {
                    const mediaUrl = p.media?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';
                    return (
                      <div key={p.id || idx} className="flex items-center justify-between p-3 bg-[#0f1115] border border-amber-900/40 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded bg-black overflow-hidden border border-gray-700 flex-shrink-0">
                            <MediaViewer mediaUrl={mediaUrl} mediaType={p.media?.[0]?.type || 'IMAGE'} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                            <span className="text-[10px] text-amber-400 font-bold block">
                              Estoque Total: {p.stock} un. {p.stock === 0 ? '(Simbólico / Repor)' : '(Baixo)'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setProductForm({
                              id: p.id,
                              title: p.title || '',
                              slug: p.slug || '',
                              description: p.description || '',
                              price: p.price ? String(p.price) : '',
                              promoPrice: p.promoPrice ? String(p.promoPrice) : '',
                              stock: p.stock || 0,
                              isBestseller: p.isBestseller || false,
                              isMadeToOrder: p.isMadeToOrder || false,
                              productionDays: p.productionDays || 0,
                              categoryId: p.categoryId || '',
                              mediaUrlInput: p.media?.[0]?.url || '',
                              mediaTypeInput: p.media?.[0]?.type || 'IMAGE',
                              mediaList: p.media || [],
                              variants: p.variants || []
                            });
                            changeTab('products');
                            setIsProductModalOpen(true);
                          }}
                          className="bg-tactical-gold hover:bg-tactical-goldHover text-black text-xs font-bold px-3 py-1.5 rounded-lg font-tactical uppercase tracking-wider shadow transition-all flex-shrink-0"
                        >
                          EDITAR / REPOR ESTOQUE
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* === MÓDULO 2: 🎨 CMS & BANNERS === */}
      {activeTab === 'sections' && (
        <VisualCmsEditor
          sections={sections}
          categories={categories}
          products={products}
          authHeader={authHeader}
          showNotification={showNotification}
          onSectionSaved={() => {
            fetchSections();
            if (onSectionUpdate) onSectionUpdate();
          }}
          mediaLibrary={mediaLibrary}
          onUpload={handleFileUpload}
          uploading={uploading}
          onDelete={handleDeleteMedia}
        />
      )}

      {/* === MÓDULO 3: 🖼️ GALERIA DE UPLOADS === */}
      {activeTab === 'uploads' && (
        <div className="bg-[#171a21] p-6 rounded border border-gray-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-tactical text-3xl font-bold text-white flex items-center gap-2">
                <HardDriveUpload className="w-6 h-6 text-tactical-gold" /> GALERIA DE MÍDIAS ENVIADAS AO SERVIDOR
              </h2>
              <p className="text-gray-400 text-xs mt-1">Reutilize arquivos já enviados para evitar downloads e uploads desnecessários.</p>
            </div>

            <label className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-xl font-bold px-6 py-2.5 rounded shadow cursor-pointer flex items-center gap-2">
              <Upload className="w-5 h-5" />
              <span>ENVIAR NOVA MÍDIA</span>
              <input
                type="file"
                accept="image/*,video/mp4"
                className="hidden"
                onChange={(e) => handleFileUpload(e, () => {})}
              />
            </label>
          </div>

          <div className="flex gap-2 border-b border-gray-800 pb-3">
            <button
              onClick={() => setMediaSubTab('inUse')}
              className={`px-4 py-2 rounded text-xs font-bold font-tactical tracking-wider flex items-center gap-2 transition-all ${
                mediaSubTab === 'inUse'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-[#0f1115] text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              <span>🟢 ARQUIVOS EM USO</span>
              <span className="bg-black/40 px-2 py-0.5 rounded text-[10px]">{mediaLibrary.inUseCount}</span>
            </button>

            <button
              onClick={() => setMediaSubTab('unused')}
              className={`px-4 py-2 rounded text-xs font-bold font-tactical tracking-wider flex items-center gap-2 transition-all ${
                mediaSubTab === 'unused'
                  ? 'bg-amber-500 text-black shadow font-extrabold'
                  : 'bg-[#0f1115] text-gray-400 border border-gray-800 hover:text-white'
              }`}
            >
              <span>🟡 DISPONÍVEIS / SEM USO</span>
              <span className="bg-black/40 px-2 py-0.5 rounded text-[10px]">{mediaLibrary.unusedCount}</span>
            </button>
          </div>

          {mediaSubTab === 'inUse' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaLibrary.inUse.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 text-xs">
                  Nenhuma mídia atualmente associada a produtos, seções ou categorias.
                </div>
              ) : (
                mediaLibrary.inUse.map((item, idx) => (
                  <div key={idx} className="bg-[#0f1115] border border-emerald-500/40 rounded p-3 space-y-2 flex flex-col justify-between">
                    <div className="aspect-video bg-black rounded overflow-hidden relative">
                      <MediaViewer mediaUrl={item.url} mediaType={item.mediaType} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white font-bold text-[9px] px-2 py-0.5 rounded">
                        EM USO
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-mono text-white text-xs truncate" title={item.filename}>{item.filename}</div>
                      <div className="text-[10px] text-gray-400">
                        {item.usageList?.map((u, i) => (
                          <span key={i} className="block text-emerald-400 font-bold">• {u}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectMediaUrl(item.url, item.mediaType)}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-1 border border-gray-700"
                    >
                      <Check className="w-3.5 h-3.5" /> REUTILIZAR ESTA MÍDIA
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {mediaSubTab === 'unused' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaLibrary.unused.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 text-xs">
                  Nenhum arquivo sem uso no momento.
                </div>
              ) : (
                mediaLibrary.unused.map((item, idx) => (
                  <div key={idx} className="bg-[#0f1115] border border-amber-500/40 rounded p-3 space-y-2 flex flex-col justify-between">
                    <div className="aspect-video bg-black rounded overflow-hidden relative">
                      <MediaViewer mediaUrl={item.url} mediaType={item.mediaType} className="w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 bg-amber-500 text-black font-extrabold text-[9px] px-2 py-0.5 rounded">
                        DISPONÍVEL
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-mono text-white text-xs truncate" title={item.filename}>{item.filename}</div>
                      <span className="text-[10px] text-gray-500 block font-mono">
                        {(item.sizeBytes / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelectMediaUrl(item.url, item.mediaType)}
                      className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-lg font-bold py-1.5 rounded flex items-center justify-center gap-1 shadow"
                    >
                      <Check className="w-4 h-4" /> SELECIONAR & USAR
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* === MÓDULO 4: 🏷️ GESTÃO DE CATEGORIAS (CRUD) === */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-[#171a21] p-6 rounded border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-tactical text-2xl font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-tactical-gold" />
                {categoryForm.id ? 'EDITAR CATEGORIA' : 'CRIAR NOVA CATEGORIA'}
              </h3>
              {categoryForm.id && (
                <button
                  onClick={() => setCategoryForm({ id: null, name: '', image: '', description: '' })}
                  className="text-xs text-gray-400 hover:text-white underline"
                >
                  Novo Cadastro
                </button>
              )}
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="ex: Capacetes Táticos"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold uppercase text-gray-400">URL da Imagem de Capa</label>
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="text-[10px] text-tactical-gold hover:underline font-bold"
                  >
                    Selecionar / Enviar Mídia
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white"
                    value={categoryForm.image}
                    onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <button 
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="bg-tactical-gold text-black px-3 py-2 rounded font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Descrição Breve</label>
                <textarea
                  rows="2"
                  className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="Equipamentos de proteção balística..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-2xl font-bold py-2 rounded shadow transition-all"
              >
                {categoryForm.id ? 'ATUALIZAR CATEGORIA' : 'CRIAR CATEGORIA'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-[#171a21] p-6 rounded border border-gray-800 space-y-4">
            <h3 className="font-tactical text-2xl font-bold text-white">CATEGORIAS ATIVAS ({categories.length})</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="p-3 bg-[#0f1115] rounded border border-gray-800 flex gap-3 items-center text-xs">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                    alt={cat.name}
                    className="w-14 h-14 object-cover rounded bg-black flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">slug: {cat.slug}</span>
                    <span className="text-[10px] text-tactical-gold block font-bold mt-0.5">
                      {cat._count?.products || 0} produtos associados
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCategoryForm({
                        id: cat.id,
                        name: cat.name,
                        image: cat.image || '',
                        description: cat.description || ''
                      })}
                      className="p-1.5 bg-gray-800 text-gray-300 hover:text-white rounded"
                      title="Editar Categoria"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 bg-gray-800 text-gray-500 hover:text-red-400 rounded"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === MÓDULO 5: 📦 PRODUTOS (GRADE ORGANIZADA + MODAL DE CADASTRO COM RASCUNHO AUTOMÁTICO) === */}
      {activeTab === 'products' && (
        <div className="space-y-6">

          {/* BANNER DE RASCUNHO SERVIDOR PENDENTE */}
          {savedDraft && savedDraft.draft && !isProductModalOpen && (
            <div className="bg-amber-950/80 border border-amber-500/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">📝 EXISTE UM RASCUNHO DE PRODUTO SALVO NO SERVIDOR</h4>
                  <p className="text-xs text-amber-200/80">
                    Você possui alterações não salvas (salvo em {savedDraft.updatedAt ? new Date(savedDraft.updatedAt).toLocaleTimeString() : 'tempo real'}). Deseja continuar de onde parou?
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-shrink-0">
                <button
                  onClick={handleRestoreDraft}
                  className="flex-1 sm:flex-none bg-tactical-gold hover:bg-tactical-goldHover text-black text-xs font-bold px-4 py-2.5 rounded-lg font-tactical uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" /> CONTINUAR CADASTRANDO
                </button>
                <button
                  onClick={handleDiscardDraft}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-3.5 py-2.5 rounded-lg transition-all border border-gray-700"
                >
                  Descartar Rascunho
                </button>
              </div>
            </div>
          )}

          {/* BARRA SUPERIOR DE FERRAMENTAS & FILTROS DO CATÁLOGO */}
          <div className="bg-[#171a21] p-5 rounded-xl border border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
              <div>
                <h2 className="font-tactical text-2xl font-bold text-white tracking-wide flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-tactical-gold" /> CATÁLOGO DE PRODUTOS
                </h2>
                <p className="text-xs text-gray-400">Total: {products.length} itens cadastrados no catálogo</p>
              </div>

              {/* Campo de Busca no Catálogo */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, SKU ou categoria..."
                  className="w-full bg-[#0f1115] border border-gray-700 focus:border-tactical-gold text-white text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtro por Categoria */}
              <select
                className="bg-[#0f1115] border border-gray-700 text-white text-xs sm:text-sm font-bold px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-tactical-gold"
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              >
                <option value="ALL">Todas as Categorias ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* BOTÃO PARA ADD NOVO PRODUTO (ABRE MODAL) */}
            <button
              onClick={() => {
                resetProductForm();
                setIsProductModalOpen(true);
              }}
              className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-sm sm:text-base font-bold px-5 py-3 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider flex-shrink-0"
            >
              <Plus className="w-5 h-5" /> ADD NOVO PRODUTO
            </button>
          </div>

          {/* GRADE DE CARDS DOS PRODUTOS DO CATÁLOGO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products
              .filter(p => {
                const matchSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchCat = selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
                return matchSearch && matchCat;
              })
              .map((p) => {
                const mediaUrl = p.media?.[0]?.url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';
                return (
                  <div key={p.id} className="bg-[#171a21] border border-gray-800 hover:border-gray-700 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between transition-all group">
                    <div className="space-y-3">
                      {/* Imagem Capa */}
                      <div className="aspect-video bg-black relative overflow-hidden border-b border-gray-800">
                        <MediaViewer mediaUrl={mediaUrl} mediaType={p.media?.[0]?.type || 'IMAGE'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-md text-tactical-gold border border-tactical-gold/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md">
                          {p.category?.name || 'Geral'}
                        </span>
                        {p.isMadeToOrder && (
                          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                            <Truck className="w-3 h-3" /> Sob Encomenda
                          </span>
                        )}
                      </div>

                      {/* Conteúdo do Card */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug">{p.title}</h3>
                        
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-tactical-gold font-mono font-bold text-base">R$ {parseFloat(p.price).toFixed(2)}</span>
                            {p.promoPrice && (
                              <span className="text-emerald-400 text-xs font-mono font-bold block">
                                Promo: R$ {parseFloat(p.promoPrice).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            {p.stock === 0 ? (
                              <span className="text-[10px] font-bold text-sky-400 bg-sky-950/80 border border-sky-800/40 px-2 py-1 rounded-md">
                                Simbólico
                              </span>
                            ) : p.stock < 0 ? (
                              <span className="text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-800/40 px-2 py-1 rounded-md">
                                Esgotado
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2 py-1 rounded-md">
                                {p.stock} un.
                              </span>
                            )}
                          </div>
                        </div>

                        {p.variants && p.variants.length > 0 && (
                          <div className="text-[11px] text-gray-400 bg-[#0f1115] px-2.5 py-1.5 rounded-lg border border-gray-800 flex items-center justify-between">
                            <span className="font-semibold text-gray-300">Variantes:</span>
                            <span className="font-mono text-tactical-gold font-bold">{p.variants.length} opções</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação na Card */}
                    <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-gray-800/60 mt-3">
                      <button
                        onClick={() => {
                          setProductForm({
                            id: p.id,
                            title: p.title || '',
                            slug: p.slug || '',
                            description: p.description || '',
                            price: p.price ? String(p.price) : '',
                            promoPrice: p.promoPrice ? String(p.promoPrice) : '',
                            stock: p.stock || 0,
                            isBestseller: p.isBestseller || false,
                            isMadeToOrder: p.isMadeToOrder || false,
                            productionDays: p.productionDays || 0,
                            categoryId: p.categoryId || '',
                            mediaUrlInput: p.media?.[0]?.url || '',
                            mediaTypeInput: p.media?.[0]?.type || 'IMAGE',
                            mediaList: p.media || [],
                            variants: p.variants || []
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5 text-tactical-gold" /> Editar
                      </button>

                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold py-2 rounded-lg transition-colors border border-red-900/50 flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* MODAL OVERLAY: FORMULÁRIO COMPLETO DE CADASTRAR/EDITAR   */}
          {/* ═════════════════════════════════════════════════════════ */}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="w-full max-w-4xl bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
                
                {/* Topbar do Modal */}
                <div className="px-6 py-4 bg-[#13161d] border-b border-gray-800 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-tactical-gold/10 border border-tactical-gold/30 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-tactical-gold" />
                    </div>
                    <div>
                      <h2 className="font-tactical text-xl font-bold text-white leading-none">
                        {productForm.id ? 'EDITAR PRODUTO' : 'CADASTRAR NOVO PRODUTO'}
                      </h2>
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" /> Rascunho salvo no servidor em tempo real
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsProductModalOpen(false)}
                    className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-lg flex items-center justify-center transition-colors font-bold text-base"
                  >
                    ✕
                  </button>
                </div>

                {/* Form Body com Rolagem */}
                <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
                  <form onSubmit={async (e) => {
                    await handleSaveProduct(e);
                    setIsProductModalOpen(false);
                  }} className="space-y-5 sm:space-y-6">

                    {/* ── SEÇÃO 1: IDENTIFICAÇÃO ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#171a21] overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#13161d] border-b border-gray-800">
                        <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">1</div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-tactical-gold" />
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Identificação do Produto</span>
                        </div>
                      </div>
                      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Título do Produto *</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder-gray-500"
                            value={productForm.title}
                            onChange={(e) => setProductForm({...productForm, title: e.target.value})}
                            placeholder="ex: Colete Plate Carrier Spec-Ops"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Categoria *</label>
                          <select
                            className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none transition-colors"
                            value={productForm.categoryId}
                            onChange={(e) => setProductForm({...productForm, categoryId: e.target.value})}
                          >
                            <option value="">-- Selecione uma Categoria --</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* ── SEÇÃO 2: MÍDIA PRINCIPAL ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#171a21] overflow-hidden shadow-sm">
                      <div className="flex items-center justify-between px-5 py-3.5 bg-[#13161d] border-b border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">2</div>
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-tactical-gold" />
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Foto / Mídia Principal</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setActiveMediaColor(null); setIsMediaModalOpen(true); }}
                          className="text-xs bg-tactical-gold/10 hover:bg-tactical-gold/20 text-tactical-gold px-3.5 py-1.5 rounded-lg border border-tactical-gold/30 font-bold flex items-center gap-1.5 transition-all"
                        >
                          <HardDriveUpload className="w-3.5 h-3.5" /> Biblioteca de Mídias
                        </button>
                      </div>
                      <div className="p-5 sm:p-6 space-y-4">
                        <div className="flex gap-2.5">
                          <select
                            className="bg-[#0f1115] border border-gray-700 text-white rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-bold focus:outline-none focus:border-tactical-gold flex-shrink-0"
                            value={productForm.mediaTypeInput}
                            onChange={(e) => setProductForm({...productForm, mediaTypeInput: e.target.value})}
                          >
                            <option value="IMAGE">Imagem</option>
                            <option value="VIDEO_FILE">Vídeo MP4</option>
                            <option value="YOUTUBE">YouTube</option>
                          </select>
                          <input
                            type="text"
                            className="flex-1 bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder-gray-500"
                            value={productForm.mediaUrlInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductForm(prev => ({
                                ...prev,
                                mediaUrlInput: val,
                                mediaList: [
                                  { url: val, type: prev.mediaTypeInput || 'IMAGE', isPrimary: true, color: null },
                                  ...prev.mediaList.filter(m => !m.isPrimary && m.color !== null)
                                ]
                              }));
                            }}
                            placeholder="URL da mídia ou use a Biblioteca →"
                          />
                          <button
                            type="button"
                            onClick={() => { setActiveMediaColor(null); setIsMediaModalOpen(true); }}
                            className="bg-tactical-gold hover:bg-tactical-goldHover text-black px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 shadow transition-all text-xs sm:text-sm flex-shrink-0"
                          >
                            <Upload className="w-4 h-4" /> Upload
                          </button>
                        </div>
                        {productForm.mediaUrlInput && (
                          <div className="flex items-center gap-3 pt-1">
                            <div className="w-16 h-16 bg-black rounded-lg border border-gray-700 overflow-hidden flex-shrink-0 shadow-inner">
                              <MediaViewer mediaUrl={productForm.mediaUrlInput} mediaType={productForm.mediaTypeInput} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-900/20 border border-emerald-800/40 px-3.5 py-2 rounded-lg">
                              <Check className="w-4 h-4" /> Capa da vitrine vinculada
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── SEÇÃO 3: VARIANTES ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#171a21] overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#13161d] border-b border-gray-800">
                        <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">3</div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-tactical-gold" />
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Variantes & Atributos</span>
                        </div>
                      </div>
                      <div className="p-1">
                        <ProductVariantEditor
                          variants={productForm.variants || []}
                          mediaList={productForm.mediaList || []}
                          onChangeVariants={(variants) => setProductForm(prev => ({ ...prev, variants }))}
                          onChangeMedia={(mediaList) => setProductForm(prev => ({ ...prev, mediaList }))}
                          onOpenMediaPicker={(color) => { setActiveMediaColor(color); setIsMediaModalOpen(true); }}
                        />
                      </div>
                    </div>

                    {/* ── SEÇÃO 4: PREÇOS ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#171a21] overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#13161d] border-b border-gray-800">
                        <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">4</div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-tactical-gold" />
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Precificação</span>
                        </div>
                      </div>
                      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Preço Normal *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              required
                              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg pl-10 pr-3.5 py-2.5 text-white text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors"
                              value={productForm.price}
                              onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                              onFocus={(e) => e.target.select()}
                              placeholder="299.90 (Simbólico)"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                            Preço Promocional <span className="text-gray-500 normal-case">(opcional)</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 text-xs font-bold">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-amber-500 rounded-lg pl-10 pr-3.5 py-2.5 text-amber-400 text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors placeholder-gray-500"
                              value={productForm.promoPrice}
                              onChange={(e) => setProductForm({...productForm, promoPrice: e.target.value})}
                              onFocus={(e) => e.target.select()}
                              placeholder="249.90 (Simbólico)"
                            />
                          </div>
                          {productForm.price && productForm.promoPrice && Number(productForm.promoPrice) < Number(productForm.price) && (
                            <p className="mt-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Desconto de {Math.round((1 - Number(productForm.promoPrice) / Number(productForm.price)) * 100)}% aplicado
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── SEÇÃO 5: DESCRIÇÃO ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#171a21] overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#13161d] border-b border-gray-800">
                        <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">5</div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-tactical-gold" />
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Descrição Técnica</span>
                        </div>
                      </div>
                      <div className="p-5 sm:p-6">
                        <textarea
                          rows="3"
                          className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm focus:outline-none transition-colors placeholder-gray-500 resize-none leading-relaxed"
                          value={productForm.description}
                          onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                          placeholder="Especificações técnicas: material, dimensões, capacidade, certificações..."
                        />
                      </div>
                    </div>

                    {/* ── SEÇÃO 6: ENTREGA & ESTOQUE ── */}
                    <div className="rounded-xl border border-gray-800 bg-[#171a21] overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-5 py-3.5 bg-[#13161d] border-b border-gray-800">
                        <div className="w-6 h-6 rounded-full bg-tactical-gold text-black text-xs font-black flex items-center justify-center flex-shrink-0">6</div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-tactical-gold" />
                          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">Entrega & Estoque</span>
                        </div>
                      </div>
                      <div className="p-5 sm:p-6 space-y-4">
                        <label className="flex items-start gap-3 cursor-pointer bg-[#0f1115] hover:bg-[#13161d] p-4 rounded-xl border border-gray-800 hover:border-amber-800/50 transition-all">
                          <input
                            type="checkbox"
                            className="w-4 h-4 mt-0.5 rounded accent-amber-500 flex-shrink-0"
                            checked={productForm.isMadeToOrder}
                            onChange={(e) => setProductForm({...productForm, isMadeToOrder: e.target.checked})}
                          />
                          <div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-400">
                              <Package className="w-4 h-4" /> Produto Sob Encomenda
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Produção personalizada — ex: Toalhas Bordadas, Fardamentos, Sob Medida</p>
                          </div>
                        </label>

                        {productForm.isMadeToOrder && (
                          <div className="border-l-2 border-amber-500 pl-4 bg-[#0f1115] p-4 rounded-r-xl border border-gray-800 space-y-2">
                            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-300">
                              <Clock className="w-4 h-4 text-amber-400" /> Prazo de Produção (dias úteis)
                            </label>
                            <input
                              type="number"
                              min="1"
                              className="w-full bg-[#171a21] border border-gray-700 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm font-bold font-mono focus:outline-none transition-colors"
                              value={productForm.productionDays}
                              onChange={(e) => setProductForm({...productForm, productionDays: e.target.value})}
                              onFocus={(e) => e.target.select()}
                              placeholder="ex: 5 (Simbólico)"
                            />
                            <p className="text-xs text-gray-400">
                              O cliente verá: <span className="text-amber-400 font-bold">"Sob encomenda — pronto em {productForm.productionDays || '?'} dias úteis"</span>
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Estoque Total Disponível</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              className="w-full bg-[#0f1115] border border-gray-700 hover:border-gray-600 focus:border-tactical-gold rounded-lg px-3.5 py-2.5 text-white text-xs sm:text-sm font-mono font-bold focus:outline-none transition-colors"
                              value={productForm.stock}
                              onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                              onFocus={(e) => e.target.select()}
                              placeholder="0 (Simbólico / Ilimitado)"
                            />
                          </div>
                          <p className="mt-1.5 text-xs text-tactical-gold font-medium">💡 Nota: 0 = Estoque Simbólico (Disponível normalmente na loja)</p>
                        </div>
                      </div>
                    </div>

                    {/* ── BOTÃO DE SUBMIT ── */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-base sm:text-lg font-bold py-3.5 px-6 rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'SALVANDO PRODUTO...' : productForm.id ? 'ATUALIZAR PRODUTO NO CATÁLOGO' : 'CADASTRAR NOVO PRODUTO NO CATÁLOGO'}
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* === MÓDULO 6: 🛍️ PEDIDOS B2B === */}
      {activeTab === 'orders' && (
        <div className="bg-[#171a21] p-6 rounded border border-gray-800 space-y-4">
          <h2 className="font-tactical text-3xl font-bold text-white">PEDIDOS E SOLICITAÇÕES DE MATERIAIS</h2>
          <div className="space-y-3">
            {orders.map((ord) => (
              <div key={ord.id} className="p-4 bg-[#0f1115] rounded border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                <div>
                  <div className="font-tactical text-xl font-bold text-tactical-gold">{ord.orderNumber}</div>
                  <div className="text-white font-bold">{ord.customerName} ({ord.customerPhone})</div>
                  <div className="text-gray-400 text-[10px] mt-0.5">{ord.shippingAddress}</div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">R$ {parseFloat(ord.finalAmount).toFixed(2)}</div>
                  </div>

                  <select
                    className="bg-[#171a21] border border-gray-700 text-white px-2 py-1 rounded font-bold text-xs"
                    value={ord.status}
                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === MÓDULO 7: 🎟️ CUPONS === */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 bg-[#171a21] p-6 rounded border border-gray-800 space-y-4">
            <h3 className="font-tactical text-2xl font-bold text-white">CRIAR CUPOM POR CATEGORIA</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Código do Cupom *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white uppercase"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({...couponForm, code: e.target.value})}
                  placeholder="EX: COLETES10"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-tactical-gold mb-1">Restringir para Categoria Específica</label>
                <select
                  className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white font-bold"
                  value={couponForm.categoryId}
                  onChange={(e) => setCouponForm({...couponForm, categoryId: e.target.value})}
                >
                  <option value="">-- Válido para TODAS as Categorias --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Valor Desconto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white"
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({...couponForm, value: e.target.value})}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Gasto Mínimo R$</label>
                  <input
                    type="number"
                    className="w-full bg-[#0f1115] border border-gray-700 rounded px-3 py-2 text-white"
                    value={couponForm.minSpend}
                    onChange={(e) => setCouponForm({...couponForm, minSpend: e.target.value})}
                    placeholder="100"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-2xl font-bold py-2 rounded"
              >
                CRIAR CUPOM
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-[#171a21] p-6 rounded border border-gray-800 space-y-3">
            <h3 className="font-tactical text-2xl font-bold text-white">CUPONS E RESTRIÇÕES ({coupons.length})</h3>
            {coupons.map((c) => (
              <div key={c.id} className="p-3 bg-[#0f1115] rounded border border-gray-800 flex justify-between items-center text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-tactical text-xl font-bold text-tactical-gold">{c.code}</span>
                    {c.category ? (
                      <span className="bg-tactical-gold/20 text-tactical-gold border border-tactical-gold/40 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        Somente: {c.category.name}
                      </span>
                    ) : (
                      <span className="bg-gray-800 text-gray-400 text-[9px] font-bold px-2 py-0.5 rounded">
                        Geral (Todas as Categorias)
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 block text-[10px] mt-0.5">
                    Desconto: {c.value}% | Mínimo: R$ {parseFloat(c.minSpend || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDeleteCoupon(c.id)} className="p-1 text-gray-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === MÓDULO 6: 🛍️ PEDIDOS B2B === */}
      {activeTab === 'orders' && (
        <div className="bg-[#171a21] p-6 rounded border border-gray-800 space-y-4">
          <h2 className="font-tactical text-3xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-tactical-gold" /> GESTÃO DE PEDIDOS ({orders.length})
          </h2>
          <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            {orders.length === 0 ? (
              <div className="text-gray-500 text-xs py-10 text-center">Nenhum pedido recebido ainda.</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="p-4 bg-[#0f1115] border border-gray-800 rounded space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-tactical text-xl font-bold text-white">PEDIDO #{order.orderNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          order.status === 'PENDING' ? 'bg-amber-900/50 text-amber-500' :
                          order.status === 'PAID' ? 'bg-emerald-900/50 text-emerald-500' :
                          order.status === 'SHIPPED' ? 'bg-blue-900/50 text-blue-500' :
                          order.status === 'DELIVERED' ? 'bg-indigo-900/50 text-indigo-500' :
                          'bg-red-900/50 text-red-500'
                        }`}>
                          {order.status === 'PENDING' ? 'AGUARDANDO PAGAMENTO' :
                           order.status === 'PAID' ? 'VENDIDO (PAGO)' :
                           order.status === 'SHIPPED' ? 'DESPACHADO' :
                           order.status === 'DELIVERED' ? 'ENTREGUE' : 'CANCELADO'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Solicitante: <span className="text-white font-bold">{order.customerName}</span> ({order.customerPhone})
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(order.createdAt).toLocaleString('pt-BR')} | Pagamento: {order.paymentMethod}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 min-w-[200px]">
                      <select 
                        className="bg-[#171a21] border border-gray-700 text-white text-xs px-2 py-1.5 rounded"
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING (Aguardando)</option>
                        <option value="PAID">PAID (Vendido)</option>
                        <option value="SHIPPED">SHIPPED (Despachado)</option>
                        <option value="DELIVERED">DELIVERED (Entregue)</option>
                        <option value="CANCELLED">CANCELLED (Cancelado)</option>
                      </select>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="bg-red-950/40 hover:bg-red-900 text-red-400 text-xs py-1.5 rounded border border-red-900/50 transition-colors"
                      >
                        Excluir Pedido
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-tactical-gold font-bold uppercase tracking-wider block">Itens do Pedido:</span>
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-xs bg-[#171a21] p-2 rounded border border-gray-800">
                        <div className="flex gap-2">
                          <span className="font-bold text-gray-300">{item.quantity}x</span>
                          <span className="text-gray-400">{item.product?.title || 'Produto Excluído'}</span>
                        </div>
                        <span className="font-mono text-tactical-gold">R$ {parseFloat(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-gray-500">
                      Desconto Aplicado: R$ {parseFloat(order.discountAmount || 0).toFixed(2)}
                    </span>
                    <span className="font-tactical text-xl text-white">
                      TOTAL: R$ {parseFloat(order.finalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* === MÓDULO 8: 💾 BACKUP & DRIVE === */}
      {activeTab === 'backups' && (
        <div className="bg-[#171a21] p-6 rounded border border-gray-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-tactical text-3xl font-bold text-white flex items-center gap-2">
                <HardDrive className="w-6 h-6 text-tactical-gold" /> ECOSSISTEMA DE BACKUP AUTOMÁTICO & GOOGLE DRIVE
              </h2>
              <p className="text-gray-400 text-xs mt-1">Backups compactados em formato .ZIP gerados automaticamente a cada alteração no sistema.</p>
              
              <div className="mt-2 inline-flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold px-3 py-1 rounded">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>SYNC NUVEM ATIVO: Auto-Backup em .ZIP + Sincronização Google Drive ativada</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="bg-amber-600 hover:bg-amber-700 text-white font-tactical text-xl font-bold px-6 py-2 rounded shadow transition-all flex items-center gap-2 cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>{restoreLoading ? 'RESTAURANDO...' : 'RESTAURAR BACKUP (.ZIP)'}</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleRestoreBackup}
                  disabled={restoreLoading}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleGenerateBackup}
                disabled={backupLoading}
                className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-xl font-bold px-6 py-2 rounded shadow transition-all flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>{backupLoading ? 'GERANDO...' : 'GERAR BACKUP AGORA'}</span>
              </button>
            </div>
          </div>

          {/* Formulário de Configuração do Google Drive (Local & VPS) */}
          <form onSubmit={handleSaveBackupConfig} className="bg-[#0f1115] p-5 rounded-lg border border-tactical-gold/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="font-tactical text-xl font-bold text-tactical-gold flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-tactical-gold" /> CONFIGURAÇÃO DO DESTINO DE BACKUP (LOCAL OU NUVEM/VPS)
              </h3>
              <span className="text-[10px] bg-tactical-gold/20 text-tactical-gold border border-tactical-gold/30 px-2 py-0.5 rounded font-bold uppercase">
                Modo Híbrido Ativo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  📧 1. E-mail da Service Account ou Administrador
                </label>
                <input
                  type="text"
                  className="w-full bg-[#171a21] border border-gray-700 rounded px-3 py-2 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                  placeholder="gama-backup-bot@projeto.iam.gserviceaccount.com"
                  value={backupConfig.targetEmail || ''}
                  onChange={(e) => setBackupConfig({...backupConfig, targetEmail: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  🆔 2. ID da Pasta no Google Drive (URL do Navegador)
                </label>
                <input
                  type="text"
                  className="w-full bg-[#171a21] border border-gray-700 rounded px-3 py-2 text-white text-xs font-bold focus:border-tactical-gold focus:outline-none"
                  placeholder="exemplo: 1A2B3C4D5E6F7G8H9I0J"
                  value={backupConfig.folderId || ''}
                  onChange={(e) => setBackupConfig({...backupConfig, folderId: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1">
                  🔑 3. Chave Privada do Google Cloud (Private Key JSON da Service Account)
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-[#171a21] border border-gray-700 rounded px-3 py-2 text-white text-xs font-mono focus:border-tactical-gold focus:outline-none"
                  placeholder="-----BEGIN PRIVATE KEY-----\n..."
                  value={backupConfig.privateKey || ''}
                  onChange={(e) => setBackupConfig({...backupConfig, privateKey: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <p className="text-[11px] text-gray-400">
                💡 Ao salvar, o backend atualizará a sincronização automática instantaneamente.
              </p>

              <button
                type="submit"
                disabled={saveConfigLoading}
                className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-lg font-bold px-6 py-2 rounded shadow transition-all flex items-center gap-2"
              >
                <span>{saveConfigLoading ? 'SALVANDO...' : '💾 SALVAR CONFIGURAÇÃO DE BACKUP'}</span>
              </button>
            </div>
          </form>

          {/* Tutorial Passo a Passo para Configurar o Google Drive */}
          <div className="bg-[#0f1115] p-5 rounded-lg border border-gray-800 space-y-4">
            <h3 className="font-tactical text-xl font-bold text-tactical-gold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-tactical-gold" /> PASSO A PASSO PARA CONFIGURAR O GOOGLE DRIVE NA NUVEM / VPS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#171a21] p-3.5 rounded border border-gray-800 space-y-1.5">
                <span className="font-bold text-tactical-gold block uppercase">1. Criar Projeto no Google Cloud</span>
                <p className="text-gray-400">
                  Acesse <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-sky-400 underline">console.cloud.google.com</a>, clique no menu superior de projetos, crie um **Novo Projeto** (ex: <i>GamaStoreBackups</i>) e clique em **Criar**.
                </p>
              </div>

              <div className="bg-[#171a21] p-3.5 rounded border border-gray-800 space-y-1.5">
                <span className="font-bold text-tactical-gold block uppercase">2. Ativar a API do Google Drive</span>
                <p className="text-gray-400">
                  No menu lateral esquerdo, navegue até **APIs e Serviços** → **Biblioteca**. Pesquise por <code className="text-white bg-black px-1 rounded">Google Drive API</code> e clique no botão **Ativar**.
                </p>
              </div>

              <div className="bg-[#171a21] p-3.5 rounded border border-gray-800 space-y-1.5">
                <span className="font-bold text-tactical-gold block uppercase">3. Criar Conta de Serviço (Service Account)</span>
                <p className="text-gray-400">
                  Vá em **APIs e Serviços** → **Credenciais** → **+ Criar Credenciais** → **Conta de Serviço**. Defina um nome (ex: <i>gama-backup-bot</i>) e conclua a criação.
                </p>
              </div>

              <div className="bg-[#171a21] p-3.5 rounded border border-gray-800 space-y-1.5">
                <span className="font-bold text-tactical-gold block uppercase">4. Gerar Chave Privada (JSON)</span>
                <p className="text-gray-400">
                  Clique na Conta de Serviço criada, vá em **Chaves** → **Adicionar Chave** → **Criar nova chave (JSON)**. Abra o JSON baixado e copie a <code className="text-white bg-black px-1 rounded">private_key</code> e o <code className="text-white bg-black px-1 rounded">client_email</code>.
                </p>
              </div>

              <div className="bg-[#171a21] p-3.5 rounded border border-gray-800 space-y-1.5">
                <span className="font-bold text-tactical-gold block uppercase">5. ID da Pasta no Google Drive</span>
                <p className="text-gray-400">
                  Abra a pasta desejada no Google Drive (no navegador) e copie o código final da URL: <code className="text-white bg-black px-1 rounded font-mono">drive.google.com/drive/folders/ID_AQUI</code>.
                </p>
              </div>

              <div className="bg-[#171a21] p-3.5 rounded border border-gray-800 space-y-1.5">
                <span className="font-bold text-tactical-gold block uppercase">6. Compartilhar Pasta com a Service Account</span>
                <p className="text-gray-400">
                  Clique com o botão direito na pasta do Google Drive → **Compartilhar** → Adicione o e-mail da Conta de Serviço (item 3) como **Editor** e salve!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0f1115] p-4 rounded border border-gray-800 space-y-3">
            <h3 className="font-tactical text-xl font-bold text-tactical-gold">HISTÓRICO DE BACKUPS REALIZADOS (.ZIP) ({backups.length})</h3>
            <div className="space-y-2">
              {backups.map((b, i) => (
                <div key={i} className="p-3 bg-[#171a21] rounded border border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono text-white font-bold">{b.filename}</span>
                    <span className="text-gray-500 text-[10px] block">{new Date(b.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono">
                      {(b.sizeBytes / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      onClick={() => handleDownloadBackup(b.filename)}
                      className="bg-gray-800 hover:bg-tactical-gold/20 hover:text-tactical-gold text-gray-300 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors border border-transparent hover:border-tactical-gold/30 font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>

                    <button
                      onClick={() => handleDeleteBackup(b.filename)}
                      className="bg-gray-800 hover:bg-red-950 hover:text-red-400 text-gray-400 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors border border-transparent hover:border-red-900/40"
                      title="Excluir backup do servidor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === MÓDULO 9: 👥 USUÁRIOS E PERMISSÕES RBAC === */}
      {activeTab === 'users' && (
        <div className="bg-[#171a21] p-6 rounded-lg border border-gray-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <h2 className="font-tactical text-3xl font-bold text-white flex items-center gap-2">
                <Users className="w-7 h-7 text-tactical-gold" /> GESTÃO DE USUÁRIOS E PERMISSÕES (RBAC)
              </h2>
              <p className="text-gray-400 text-xs mt-1">
                Adicione novos administradores, altere senhas de acesso e gerencie o nível de permissão do sistema.
              </p>
            </div>

            <button
              onClick={() => {
                setUserForm({ name: '', email: '', password: '', role: 'ADMIN' });
                setIsUserModalOpen(true);
              }}
              className="bg-tactical-gold hover:bg-tactical-goldHover text-black px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition-all flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> ADICIONAR NOVO USUÁRIO
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {users.map((u) => (
              <div key={u.id} className="p-4 bg-[#0f1115] rounded-xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{u.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      u.role === 'ADMIN' ? 'bg-tactical-gold/20 text-tactical-gold border border-tactical-gold/40' :
                      u.role === 'MANAGER' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' :
                      'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">{u.email}</div>
                  <div className="text-gray-500 text-[10px]">
                    Cadastrado em: {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <select
                    className="bg-[#171a21] border border-gray-700 text-tactical-gold font-bold px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-tactical-gold"
                    value={u.role}
                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                  >
                    <option value="CUSTOMER">CUSTOMER (Cliente)</option>
                    <option value="MANAGER">MANAGER (Gerente)</option>
                    <option value="ADMIN">ADMIN (Administrador)</option>
                  </select>

                  <button
                    onClick={() => {
                      setPasswordForm({ userId: u.id, userName: u.name, newPassword: '' });
                      setIsPasswordModalOpen(true);
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-tactical-gold hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-gray-700 transition-colors"
                  >
                    <Key className="w-3.5 h-3.5" /> Alterar Senha
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u)}
                    disabled={currentUser && currentUser.id === u.id}
                    className="bg-red-950/40 hover:bg-red-900/60 disabled:opacity-30 text-red-300 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-900/50 transition-colors"
                    title="Excluir usuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* MODAL 1: CADASTRAR NOVO USUÁRIO                           */}
          {/* ═════════════════════════════════════════════════════════ */}
          {isUserModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden space-y-5 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="font-tactical text-2xl font-bold text-tactical-gold flex items-center gap-2">
                    <UserPlus className="w-6 h-6" /> ADICIONAR NOVO USUÁRIO
                  </h3>
                  <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-[#171a21] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-tactical-gold"
                      placeholder="ex: Carlos Eduardo"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">E-mail de Acesso *</label>
                    <input
                      type="email"
                      required
                      className="w-full bg-[#171a21] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-tactical-gold"
                      placeholder="usuario@gamaartigomilitar.com"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Senha de Acesso *</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      className="w-full bg-[#171a21] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-tactical-gold"
                      placeholder="••••••••"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Nível de Permissão (Role)</label>
                    <select
                      className="w-full bg-[#171a21] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs font-bold text-tactical-gold focus:outline-none focus:border-tactical-gold"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    >
                      <option value="ADMIN">ADMIN (Administrador Total)</option>
                      <option value="MANAGER">MANAGER (Gerente Operacional)</option>
                      <option value="CUSTOMER">CUSTOMER (Cliente)</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(false)}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-tactical-gold hover:bg-tactical-goldHover text-black px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> {loading ? 'CADASTRANDO...' : 'CADASTRAR USUÁRIO'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* MODAL 2: ALTERAR SENHA DO USUÁRIO                         */}
          {/* ═════════════════════════════════════════════════════════ */}
          {isPasswordModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden space-y-5 p-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                  <h3 className="font-tactical text-2xl font-bold text-tactical-gold flex items-center gap-2">
                    <Key className="w-6 h-6" /> ALTERAR SENHA
                  </h3>
                  <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-white font-bold text-lg">✕</button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Usuário Alvo</span>
                    <div className="p-3 bg-[#171a21] border border-gray-800 rounded-lg text-white font-bold text-xs">
                      {passwordForm.userName}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1">Nova Senha de Acesso *</label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      className="w-full bg-[#171a21] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-tactical-gold"
                      placeholder="Digite a nova senha"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-tactical-gold hover:bg-tactical-goldHover text-black px-5 py-2 rounded-lg font-bold text-xs shadow flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> {loading ? 'SALVANDO...' : 'ATUALIZAR SENHA'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === MÓDULO 10: 🤖 BOT WHATSAPP & REDIRECIONAMENTO === */}
      {activeTab === 'bot' && (
        <div className="space-y-6">
          <div className="bg-[#171a21] p-6 rounded-lg border border-gray-800 space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-800 gap-4">
              <div>
                <h2 className="font-tactical text-3xl font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-7 h-7 text-tactical-gold" /> GESTÃO DE MENSAGENS E BOT WHATSAPP
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Configure o modo de atendimento por WhatsApp: Respostas Automáticas (Bot Baileys) ou Redirecionamento Direto.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchBotConfig}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 border border-gray-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Atualizar Status
                </button>
                <button
                  onClick={handleRestartBot}
                  disabled={botLoading || !botConfig.isBotEnabled}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reconectar Bot
                </button>
              </div>
            </div>

            {/* Badge de Status de Conexão */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0f1115] p-4 rounded border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Modo Operacional do WhatsApp</span>
                  <span className="text-sm font-bold text-white font-tactical">
                    {botConfig.isBotEnabled ? '🤖 BOT AUTOMÁTICO ATIVADO' : '🔗 LINK DIRETO (SEM BOT)'}
                  </span>
                </div>
                <div className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                  botConfig.isBotEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {botConfig.isBotEnabled ? 'BOT ATIVO' : 'BOT DESATIVADO'}
                </div>
              </div>

              <div className="bg-[#0f1115] p-4 rounded border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Status da Conexão WhatsApp</span>
                  <span className="text-sm font-bold text-white font-tactical uppercase">
                    {botConfig.connectionStatus === 'CONNECTED' && '🟢 CONECTADO E PRONTO'}
                    {botConfig.connectionStatus === 'QR_READY' && '📱 AGUARDANDO ESCANEAR QR CODE'}
                    {botConfig.connectionStatus === 'CONNECTING' && '⏳ INICIALIZANDO CONEXÃO...'}
                    {botConfig.connectionStatus === 'DISCONNECTED' && '🛑 DESCONECTADO'}
                  </span>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                  botConfig.connectionStatus === 'CONNECTED' ? 'bg-emerald-500' :
                  botConfig.connectionStatus === 'QR_READY' ? 'bg-amber-500' :
                  botConfig.connectionStatus === 'CONNECTING' ? 'bg-sky-500' : 'bg-red-500'
                }`} />
              </div>
            </div>

            {/* QR Code de Conexão se Disponível */}
            {botConfig.qrCodeData && botConfig.isBotEnabled && (
              <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black p-6 rounded-lg border border-amber-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                <div className="bg-white p-3 rounded-lg shadow-xl flex-shrink-0">
                  <img src={botConfig.qrCodeData} alt="WhatsApp Bot QR Code" className="w-48 h-48 object-contain" />
                </div>
                <div className="space-y-3">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded text-[10px] font-bold uppercase">
                    📱 Conexão Requerida
                  </span>
                  <h3 className="font-tactical text-2xl font-bold text-white">ESCANEIE O QR CODE NO SEU WHATSAPP</h3>
                  <ol className="text-xs text-gray-300 space-y-1.5 list-decimal pl-4">
                    <li>Abra o WhatsApp no seu smartphone.</li>
                    <li>Toque em <strong>Configurações / Menu (⋮)</strong> e selecione <strong>Dispositivos Conectados</strong>.</li>
                    <li>Toque em <strong>Conectar um dispositivo</strong> e aponte a câmera para a imagem ao lado.</li>
                  </ol>
                  <p className="text-[11px] text-amber-300 font-bold pt-1">
                    ⚡ Após a leitura, o bot assumirá as respostas automáticas do número configurado.
                  </p>
                </div>
              </div>
            )}

            {/* Formulário de Configuração */}
            <form onSubmit={handleSaveBotConfig} className="space-y-6 pt-2">
              
              {/* Botão de Alternância Ativar / Desativar Bot */}
              <div className="bg-[#0f1115] p-5 rounded-lg border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-tactical text-xl font-bold text-white block">ATIVAR BOT AUTOMÁTICO DE RESPOSTAS</label>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Quando desativado, o checkout criará apenas um link direto (<code className="text-tactical-gold">wa.me</code>) para o WhatsApp da loja sem automação.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBotConfig(prev => ({ ...prev, isBotEnabled: !prev.isBotEnabled }))}
                    className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                      botConfig.isBotEnabled ? 'bg-emerald-600' : 'bg-gray-800'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
                      botConfig.isBotEnabled ? 'translate-x-8' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>

              {/* Número do WhatsApp da Loja */}
              <div className="bg-[#0f1115] p-5 rounded-lg border border-gray-800 space-y-2">
                <label className="block text-xs font-bold uppercase text-tactical-gold">
                  NÚMERO DO WHATSAPP DA LOJA (COM DDD E CÓDIGO DO PAÍS) *
                </label>
                <p className="text-gray-400 text-xs">
                  Este número receberá as mensagens dos pedidos do carrinho (formato padrão: 55 + DDD + Número).
                </p>
                <input
                  type="text"
                  required
                  className="w-full bg-[#181b22] border border-gray-700 text-white font-mono text-sm px-4 py-2.5 rounded focus:outline-none focus:border-tactical-gold"
                  value={botConfig.whatsappNumber}
                  onChange={(e) => setBotConfig(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="5511999998888"
                />
              </div>

              {/* Mensagem de Boas-Vindas / Menu Automático */}
              <div className="bg-[#0f1115] p-5 rounded-lg border border-gray-800 space-y-2">
                <label className="block text-xs font-bold uppercase text-tactical-gold">
                  MENSAGEM DE BOAS-VINDAS & MENU PADRÃO DO BOT
                </label>
                <p className="text-gray-400 text-xs">
                  Texto enviado automaticamente ao receber "menu", "olá" ou primeiro contato dos clientes.
                </p>
                <textarea
                  rows="6"
                  className="w-full bg-[#181b22] border border-gray-700 text-white text-xs font-mono px-4 py-3 rounded focus:outline-none focus:border-tactical-gold"
                  value={botConfig.welcomeMessage || ''}
                  onChange={(e) => setBotConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="🤖 *Atendimento Automático Gama Store*..."
                />
              </div>

              {/* Botão de Salvar */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={botLoading}
                  className="bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-xl font-bold px-8 py-3 rounded shadow-lg transition-all flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>{botLoading ? 'SALVANDO...' : '💾 SALVAR CONFIGURAÇÕES DO WHATSAPP'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

