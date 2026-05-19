/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import Logo from '../ui/Logo';

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-mg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparencia.mg.gov.br/images/background/bg-minas-gerais.jpg')] bg-cover bg-center opacity-20 grayscale"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden border-t-8 border-mg-red"
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo className="h-20 w-20" />
          </div>
          
          <h1 className="text-3xl font-black text-mg-black uppercase tracking-tighter italic mb-2">
            Orça<span className="text-mg-red">Gov</span>
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">
            Sistema de Gestão Orçamentária de Minas Gerais
          </p>

          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded font-bold text-gray-700 hover:bg-gray-50 hover:border-mg-red/20 transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
            Acessar com Conta Google
          </button>
          
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Acesso restrito a servidores e colaboradores autorizados
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
