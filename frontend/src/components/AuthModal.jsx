import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Key } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gama_store_token', data.token);
        localStorage.setItem('gama_store_user', JSON.stringify(data.user));
        onAuthSuccess(data.user, data.token);
        onClose();
      } else {
        setError(data.error || 'Erro na autenticação.');
      }
    } catch (err) {
      setError('Erro ao se comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141619] border border-gray-800 rounded-lg text-white shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#0b0f17]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-tactical-gold" />
            <h3 className="font-tactical text-2xl font-bold tracking-wider">
              {mode === 'login' ? 'ACESSO AO SISTEMA' : 'CRIAR NOVA CONTA'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-200 text-xs rounded">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  required
                  className="w-full bg-[#181b22] border border-gray-700 text-white text-xs pl-9 pr-3 py-2.5 rounded focus:outline-none focus:border-tactical-gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="email"
                required
                className="w-full bg-[#181b22] border border-gray-700 text-white text-xs pl-9 pr-3 py-2.5 rounded focus:outline-none focus:border-tactical-gold"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Senha de Acesso</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="password"
                required
                className="w-full bg-[#181b22] border border-gray-700 text-white text-xs pl-9 pr-3 py-2.5 rounded focus:outline-none focus:border-tactical-gold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tactical-gold hover:bg-tactical-goldHover text-black font-tactical text-2xl font-bold py-3 rounded shadow transition-all mt-2"
          >
            {loading ? 'CARREGANDO...' : mode === 'login' ? 'ENTRAR NO SISTEMA' : 'CADASTRAR MINHA CONTA'}
          </button>

          <div className="pt-2 text-center text-xs text-gray-400 border-t border-gray-800">
            {mode === 'login' ? (
              <span>Ainda não possui conta? <button type="button" onClick={() => setMode('register')} className="text-tactical-gold font-bold underline ml-1">Cadastre-se</button></span>
            ) : (
              <span>Já possui conta cadastrada? <button type="button" onClick={() => setMode('login')} className="text-tactical-gold font-bold underline ml-1">Fazer Login</button></span>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
