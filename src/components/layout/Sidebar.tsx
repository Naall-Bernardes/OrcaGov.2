/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Calculator, 
  ChevronRight, 
  FileText, 
  LayoutDashboard, 
  Layers, 
  Package, 
  TrendingUp 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import Logo from '../ui/Logo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'budgets', label: 'Meus Orçamentos', icon: Calculator },
    { id: 'compositions', label: 'Composições', icon: Layers },
    { id: 'insumos', label: 'Insumos', icon: Package },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
    { id: 'analises', label: 'Análises Síncronas', icon: TrendingUp },
  ];

  return (
    <aside id="main-sidebar" className="w-64 h-screen bg-mg-blue text-gray-300 flex flex-col fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <Logo className="h-8 w-8 mr-3" variant="light" />
        <span className="text-xl font-extrabold text-white tracking-tighter uppercase">Orça<span className="text-mg-red">Gov</span></span>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            id={`nav-${item.id}`}
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded text-sm font-bold uppercase tracking-tight transition-all group",
              activeTab === item.id 
                ? "bg-mg-red text-white" 
                : "hover:bg-white/10 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className={cn(
                "h-5 w-5",
                activeTab === item.id ? "text-white" : "text-gray-500 group-hover:text-white"
              )} />
              {item.label}
            </div>
            {activeTab === item.id && <ChevronRight className="h-4 w-4" />}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 opacity-30 text-[8px] text-center uppercase tracking-widest font-black text-white/50">
        Versão 1.0.4
      </div>
    </aside>
  );
}
