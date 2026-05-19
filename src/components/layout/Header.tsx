/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header id="app-header" className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
      <div className="flex-1"></div>
      
      <div className="flex items-center gap-6">
        <button id="notify-btn" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mg-red rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 bg-mg-gray/50 rounded py-1 px-3 border border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-mg-black leading-none uppercase tracking-tight">{user?.displayName || 'Usuário'}</p>
            <p className="text-[10px] text-gray-500 leading-none mt-1 uppercase font-bold">{user?.email}</p>
          </div>
          {user?.photoURL ? (
            <img src={user.photoURL} className="h-8 w-8 rounded-sm object-cover border border-mg-red/20" alt="Avatar" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-8 w-8 rounded-sm bg-mg-red flex items-center justify-center text-white font-bold text-xs uppercase">
              {user?.displayName?.substring(0, 2) || (user?.email?.substring(0, 2))}
            </div>
          )}
          <button 
            onClick={logout}
            title="Sair"
            className="ml-2 p-1.5 text-gray-400 hover:text-mg-red hover:bg-mg-red/5 rounded transition-all"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
