/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Search, 
  AlertTriangle, 
  BarChart3, 
  Zap,
  Target,
  FileSearch,
  ArrowRightLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

const COLORS = ['#C8102E', '#1A365D', '#38A169', '#ED8936', '#4A5568'];

export default function SyncAnalysis() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const abcData = [
    { name: 'Estrutura', value: 45 },
    { name: 'Instalações', value: 25 },
    { name: 'Acabamento', value: 15 },
    { name: 'Alvenaria', value: 10 },
    { name: 'Outros', value: 5 },
  ];

  const baseComparisonData = [
    { name: 'SINAPI', valor: 150240, color: '#1A365D' },
    { name: 'SETOP', valor: 158300, color: '#C8102E' },
    { name: 'SEINFRA', valor: 147500, color: '#4A5568' },
  ];

  const runSampleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  return (
    <div id="sync-analysis-view" className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-mg-black tracking-tighter uppercase italic">Análises <span className="text-mg-red">Síncronas</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider">Inteligência orçamentária e auditoria em tempo real.</p>
        </div>
        <button 
          onClick={runSampleScan}
          disabled={isScanning}
          className="flex items-center gap-2 px-6 py-3 bg-mg-red text-white text-xs font-black uppercase tracking-widest hover:bg-mg-red/90 transition-all shadow-lg disabled:opacity-50"
        >
          {isScanning ? <Zap className="h-4 w-4 animate-pulse" /> : <Search className="h-4 w-4" />}
          {isScanning ? `Analisando... ${scanProgress}%` : 'Iniciar Auditoria IA'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Curva ABC Summary */}
        <div className="bg-white p-6 border-t-4 border-mg-blue shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
               <div className="p-2 bg-mg-blue/5 rounded text-mg-blue">
                 <BarChart3 className="h-4 w-4" />
               </div>
               <h3 className="font-black text-mg-black uppercase tracking-widest text-xs">Curva ABC (Pareto)</h3>
             </div>
             <span className="text-[10px] font-black text-mg-blue bg-mg-blue/5 px-2 py-1 rounded">VIVO</span>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={abcData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {abcData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {abcData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{item.name}</span>
                </div>
                <span className="text-xs font-black text-mg-black">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Auditor Findings */}
        <div className="lg:col-span-2 bg-white p-6 border-t-4 border-mg-red shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
               <div className="p-2 bg-mg-red/5 rounded text-mg-red">
                 <Target className="h-4 w-4" />
               </div>
               <h3 className="font-black text-mg-black uppercase tracking-widest text-xs">Descobertas da Auditoria (IA)</h3>
             </div>
             {isScanning && <div className="text-[10px] font-black text-mg-red animate-pulse">PROCESSANDO...</div>}
          </div>

          <div className="flex-1 space-y-4">
            <div className="p-4 bg-orange-50 border-l-4 border-orange-500 flex gap-4">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Alerta de Inconsistência</p>
                <p className="text-sm font-medium text-mg-black mt-1 leading-snug">
                  O orçamento "Reforma E.E. Abraão" não contém o item de <span className="font-black italic">Limpeza Final de Obra</span>.
                </p>
                <button className="mt-2 text-[10px] font-black uppercase text-orange-600 hover:underline">Corrigir Agora</button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border-l-4 border-mg-blue flex gap-4">
              <ArrowRightLeft className="h-5 w-5 text-mg-blue shrink-0" />
              <div>
                <p className="text-[10px] font-black text-mg-blue uppercase tracking-widest">Otimização de Base</p>
                <p className="text-sm font-medium text-mg-black mt-1 leading-snug">
                  7 composições de "Pintura" possuem valor <span className="font-black">12% menor</span> na base <span className="italic font-black">SETOP</span> comparado ao SINAPI atual.
                </p>
                <button className="mt-2 text-[10px] font-black uppercase text-mg-blue hover:underline">Ver Comparativo</button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-l-4 border-gray-400 flex gap-4 opacity-60">
              <FileSearch className="h-5 w-5 text-gray-500 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Análise de BDI</p>
                <p className="text-sm font-medium text-mg-black mt-1 leading-snug">
                  O BDI aplicado (23%) está dentro da margem aceitável pelo <span className="font-black">TCU</span> para esta tipologia de obra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Multi-base Comparison */}
        <div className="bg-white p-8 border-t-4 border-mg-blue shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-mg-black uppercase tracking-widest text-xs italic">Comparativo Multi-Base (RS Total)</h3>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-mg-blue"></div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">Projetado</span>
                </div>
              </div>
           </div>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={baseComparisonData} layout="vertical" margin={{ left: 40, right: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: '900', fill: '#1A365D'}} />
                  <RechartsTooltip 
                    formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={40}>
                    {baseComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Real-time Collaboration / Activity */}
        <div className="bg-mg-black p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-mg-red/5 -mr-32 -mt-32 rounded-full transition-transform group-hover:scale-110"></div>
           <h3 className="font-black text-white uppercase tracking-widest text-xs italic mb-8 relative z-10 flex items-center gap-2">
             <div className="w-2 h-2 bg-mg-red rounded-full animate-ping"></div>
             Atividade Síncrona (LOG)
           </h3>
           
           <div className="space-y-6 relative z-10">
              {[
                { user: 'ALLAN DAMASCENO', action: 'Atualizou quantitativos', project: 'REFORMA E.E. ABRAÃO', time: 'Há 2 min' },
                { user: 'MARIA SILVA', action: 'Criou novo orçamento', project: 'AMPLIAÇÃO BLOCO B', time: 'Há 15 min' },
                { user: 'IA AUDITOR', action: 'Sistema detectou redução de 5% no aço', project: 'COMPARAÇÃO SETOP', time: 'Há 1 hora' },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-4 border-l border-white/10 pl-4 py-1">
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-mg-red uppercase">{activity.user}</p>
                      <p className="text-sm font-bold text-gray-300 mt-0.5">{activity.action}</p>
                      <p className="text-[9px] font-medium text-gray-500 uppercase mt-1 tracking-wider">{activity.project}</p>
                   </div>
                   <span className="text-[10px] font-black text-gray-600 uppercase italic whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
           </div>

           <div className="mt-12 p-4 bg-white/5 border border-white/10 rounded">
              <p className="text-[10px] font-black text-white uppercase tracking-widest text-center">3 usuários colaborando simultaneamente</p>
           </div>
        </div>
      </div>
    </div>
  );
}
