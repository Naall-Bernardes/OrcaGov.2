/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';
import Logo from '../ui/Logo';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparencia.mg.gov.br/images/background/bg-minas-gerais.jpg')] bg-cover bg-center opacity-20 grayscale"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden border-t-8 border-mg-red"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-20" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-mg-black uppercase tracking-tighter italic mb-2">
              Orça<span className="text-mg-red">Gov</span>
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-tight">
              Sistema de Gestão Orçamentária de Minas Gerais
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">E-mail</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded focus:border-mg-red/30 outline-none font-bold text-sm transition-all"
                placeholder="seu.email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Senha</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded focus:border-mg-red/30 outline-none font-bold text-sm transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[10px] font-black uppercase text-mg-red bg-mg-red/5 p-2 rounded text-center">
                {error}
              </p>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-mg-black text-white py-4 rounded font-black text-[11px] uppercase tracking-[0.2em] hover:bg-mg-black/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isLogin ? 'Entrar no Sistema' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-widest text-mg-red hover:underline"
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Acesso restrito a servidores e colaboradores autorizados
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
