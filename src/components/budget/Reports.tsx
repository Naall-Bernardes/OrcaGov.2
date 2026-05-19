/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Line, 
  ComposedChart,
  Cell,
  Legend
} from 'recharts';
import { 
  FileText, 
  TrendingDown, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Filter
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface ABCEntry {
  code: string;
  description: string;
  value: number;
  type: 'SERVICO' | 'MATERIAL' | 'EQUIPAMENTO' | 'MÃO DE OBRA';
}

const MOCK_DATA: ABCEntry[] = [
  { code: '94974', description: 'Concreto Usinado Bombeado fck=25MPa', value: 450000, type: 'SERVICO' },
  { code: '87393', description: 'Fôrma plana de madeira compensada', value: 185000, type: 'SERVICO' },
  { code: '92419', description: 'Armação de pilares/vigas aço CA-50', value: 125000, type: 'MATERIAL' },
  { code: '11145', description: 'Concreto usinado', value: 95000, type: 'MATERIAL' },
  { code: '88309', description: 'Pedreiro com encargos', value: 85000, type: 'MÃO DE OBRA' },
  { code: '88316', description: 'Servente com encargos', value: 65000, type: 'MÃO DE OBRA' },
  { code: 'SIC-100', description: 'Cabiamento estruturado Cat6', value: 45000, type: 'SERVICO' },
  { code: 'SEI-055', description: 'Piso cerâmico 40x40', value: 35000, type: 'MATERIAL' },
  { code: 'SET-001', description: 'Escavação manual solo 1a', value: 25000, type: 'SERVICO' },
  { code: 'EQU-001', description: 'Andaimes metálicos (locação)', value: 15600, type: 'EQUIPAMENTO' },
];

export default function Reports() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'global' | 'servico' | 'material'>('global');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const budgetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBudgets(budgetsData);
      if (budgetsData.length > 0 && !selectedBudgetId) {
        setSelectedBudgetId(budgetsData[0].id);
      }
    }, (error) => {
      console.error('Firestore Error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const selectedBudget = useMemo(() => budgets.find(b => b.id === selectedBudgetId), [budgets, selectedBudgetId]);

  const abcData = useMemo(() => {
    let sourceData = MOCK_DATA;
    
    // If the budget has real EAP data, flatten it for ABC analysis
    if (selectedBudget && selectedBudget.eap && selectedBudget.eap.length > 0) {
      const items: ABCEntry[] = [];
      const flatten = (nodes: any[]) => {
        nodes.forEach(node => {
          if (node.type === 'ITEM') {
            items.push({
              code: node.code,
              description: node.description,
              value: node.totalValue || 0,
              type: 'SERVICO' // Simplified for ABC visualization
            });
          }
          if (node.children) flatten(node.children);
        });
      };
      flatten(selectedBudget.eap);
      if (items.length > 0) sourceData = items;
    }

    let filtered = [...sourceData];
    if (activeTab === 'servico') filtered = filtered.filter(d => d.type === 'SERVICO');
    if (activeTab === 'material') filtered = filtered.filter(d => d.type === 'MATERIAL' || d.type === 'MÃO DE OBRA');

    const total = filtered.reduce((acc, curr) => acc + curr.value, 0);
    const sorted = filtered.sort((a, b) => b.value - a.value);

    let cumulative = 0;
    return sorted.map((item) => {
      cumulative += item.value;
      const percentage = (item.value / total) * 100;
      const cumulativePercentage = (cumulative / total) * 100;
      
      let category: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercentage <= 80) category = 'A';
      else if (cumulativePercentage <= 95) category = 'B';

      return {
        ...item,
        percentage,
        cumulativePercentage,
        category
      };
    });
  }, [activeTab]);

  return (
    <div id="reports-abc" className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-mg-black tracking-tighter uppercase italic">Análise de <span className="text-mg-red">Curva ABC</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider">Identifique os itens de maior impacto financeiro no seu orçamento.</p>
          
          <div className="mt-4 max-w-md">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Selecione o Orçamento para Análise</label>
            <select 
              value={selectedBudgetId}
              onChange={(e) => setSelectedBudgetId(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
            >
              {budgets.map(b => (
                <option key={b.id} value={b.id}>{b.name.toUpperCase()} ({b.school})</option>
              ))}
            </select>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-mg-blue text-white text-xs font-bold uppercase tracking-widest hover:bg-mg-blue/90 transition-shadow shadow-md flex items-center gap-2">
          <Download className="h-4 w-4" /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'global', label: 'ABC Global', icon: PieChart, color: 'border-mg-red' },
          { id: 'servico', label: 'ABC de Serviços', icon: TrendingDown, color: 'border-[#38A169]' },
          { id: 'material', label: 'ABC de Materiais', icon: TrendingDown, color: 'border-[#ED8936]' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "p-6 bg-white border-b-4 transition-all text-left shadow-sm hover:shadow-md",
              activeTab === tab.id ? tab.color : "border-transparent opacity-60"
            )}
          >
            <tab.icon className={cn("h-6 w-6 mb-3", activeTab === tab.id ? "text-mg-black" : "text-gray-400")} />
            <span className="text-xs font-black uppercase tracking-widest text-mg-black">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-8 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-sm font-black text-mg-black uppercase tracking-widest flex items-center gap-2">
             Visualização da Curva de Pareto - Classificação {activeTab.toUpperCase()}
           </h3>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-mg-red"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Classe A (80%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-mg-blue"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Acumulado %</span>
              </div>
           </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={abcData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="code" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#9CA3AF" />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#9CA3AF" />
              <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 10, fontWeight: 'bold' }} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ borderRadius: '0px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: number) => activeTab === 'global' ? `R$ ${value.toLocaleString('pt-BR')}` : `${value.toFixed(2)}%`}
              />
              <Bar yAxisId="left" dataKey="value" fill="#C53030" radius={[2, 2, 0, 0]}>
                {abcData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.category === 'A' ? '#C53030' : entry.category === 'B' ? '#4299E1' : '#718096'} />
                ))}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#2B6CB0" strokeWidth={3} dot={{ r: 4, fill: '#2B6CB0' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border-t-8 border-mg-black shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 py-4 px-6 bg-mg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
          <div className="w-20">Class.</div>
          <div className="w-24">Código</div>
          <div className="flex-1">Descrição do Item</div>
          <div className="w-32 text-right">Valor (R$)</div>
          <div className="w-24 text-right">% Parcial</div>
          <div className="w-24 text-right">% Acum.</div>
        </div>
        
        {abcData.map((item, idx) => (
          <div key={item.code} className="flex items-center gap-2 py-4 px-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
            <div className="w-20">
               <span className={cn(
                 "px-3 py-1 rounded text-[10px] font-black uppercase",
                 item.category === 'A' ? "bg-mg-red/10 text-mg-red" : 
                 item.category === 'B' ? "bg-mg-blue/10 text-mg-blue" : 
                 "bg-gray-100 text-gray-500"
               )}>
                 CLASSE {item.category}
               </span>
            </div>
            <div className="w-24 text-xs font-mono font-bold text-gray-400">{item.code}</div>
            <div className="flex-1 text-sm font-bold text-mg-black uppercase italic tracking-tight">{item.description}</div>
            <div className="w-32 text-right text-sm font-black text-mg-black">R$ {item.value.toLocaleString('pt-BR')}</div>
            <div className="w-24 text-right text-xs font-bold text-gray-500">{item.percentage.toFixed(2)}%</div>
            <div className="w-24 text-right text-xs font-black text-mg-red">{item.cumulativePercentage.toFixed(2)}%</div>
          </div>
        ))}

        <div className="p-8 bg-mg-gray/30 flex items-center justify-between">
           <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumo ABC do Bloco</p>
              <h4 className="text-xl font-black text-mg-black uppercase tracking-tighter italic">Total de Itens Analisados: <span className="text-mg-red">{abcData.length}</span></h4>
           </div>
           <div className="flex gap-10">
              <div className="text-right">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custo Total {activeTab.toUpperCase()}</p>
                <p className="text-2xl font-black text-mg-black tracking-tighter">R$ {abcData.reduce((a, b) => a + b.value, 0).toLocaleString('pt-BR')}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
