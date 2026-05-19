/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar from '@/src/components/layout/Sidebar';
import Header from '@/src/components/layout/Header';
import Dashboard from '@/src/components/dashboard/Dashboard';
import BudgetList from '@/src/components/budget/BudgetList';
import BudgetDetail from '@/src/components/budget/BudgetDetail';
import CompositionsManager from '@/src/components/budget/CompositionsManager';
import SuppliesManager from '@/src/components/budget/SuppliesManager';
import Reports from '@/src/components/budget/Reports';
import { AuthProvider, useAuth } from '@/src/contexts/AuthContext';
import LoginPage from '@/src/components/auth/LoginPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-mg-black">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-mg-red border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mt-4 ml-1">Carregando</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectBudget = (id: string) => {
    setSelectedBudgetId(id);
    setActiveTab('budget-detail');
  };

  const handleBack = () => {
    setSelectedBudgetId(null);
    setActiveTab('budgets');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab === 'budget-detail' ? 'budgets' : activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedBudgetId(null);
        }} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 pl-64">
        {activeTab !== 'budget-detail' && <Header />}
        
        <main className="flex-1 overflow-y-auto scroll-smooth">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'budgets' && (
            <BudgetList onSelectBudget={handleSelectBudget} />
          )}
          {activeTab === 'budget-detail' && <BudgetDetail budgetId={selectedBudgetId} onBack={handleBack} />}
          {activeTab === 'compositions' && <CompositionsManager />}
          {activeTab === 'insumos' && <SuppliesManager />}
          {activeTab === 'relatorios' && <Reports />}
          
          {activeTab !== 'dashboard' && activeTab !== 'budgets' && activeTab !== 'budget-detail' && activeTab !== 'compositions' && activeTab !== 'insumos' && activeTab !== 'relatorios' && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
               <div className="text-xl font-medium">Módulo em Desenvolvimento</div>
               <p className="mt-2 text-sm italic">Esta funcionalidade estará disponível em breve.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
