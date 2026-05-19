/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Briefcase, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  totalBudgets: number;
  activeBudgets: number;
  totalInvested: number;
  monthlyData: { name: string; value: number }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const budgets = snapshot.docs.map(doc => doc.data());
      const totalInvested = budgets.reduce((acc, b) => acc + (b.totalValue || 0), 0);
      const activeBudgets = budgets.filter(b => b.status !== 'Concluído' && b.status !== 'Cancelado').length;
      
      // Mock monthly data for visualization since we don't have historical entries
      const monthlyData = [
        { name: 'Jan', value: 400 },
        { name: 'Fev', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Abr', value: 890 },
        { name: 'Mai', value: totalInvested > 0 ? totalInvested / 1000 : 1250 },
      ];

      setStats({
        totalBudgets: budgets.length,
        activeBudgets,
        totalInvested,
        monthlyData
      });
    }, (error) => {
      console.error('Firestore Error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  if (!stats) return <div className="p-8">Carregando dados...</div>;

  const cards = [
    { 
      label: 'TOTAL EM ORÇAMENTOS', 
      value: `R$ ${(stats.totalInvested / 1000000).toFixed(1)}M`, 
      icon: DollarSign, 
      color: 'text-mg-red',
      borderColor: 'border-mg-red',
      trend: '+12.5%',
      up: true
    },
    { 
      label: 'ORÇAMENTOS ATIVOS', 
      value: stats.activeBudgets, 
      icon: Briefcase, 
      color: 'text-mg-green',
      borderColor: 'border-mg-green',
      trend: '3 novas obras',
      up: true
    },
    { 
      label: 'PROCESSOS EM ATRASO', 
      value: '2', 
      icon: AlertCircle, 
      color: 'text-mg-black',
      borderColor: 'border-mg-black',
      trend: '-15%',
      up: false
    },
    { 
      label: 'TAXA DE APROVAÇÃO', 
      value: '88%', 
      icon: CheckCircle2, 
      color: 'text-mg-red',
      borderColor: 'border-mg-red',
      trend: '+4%',
      up: true
    }
  ];

  return (
    <div id="dashboard-view" className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-mg-black tracking-tighter uppercase italic">Dashboard <span className="text-mg-red">Overview</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider">Portal de planejamento orçamentário e serviços.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2.5 bg-white border border-gray-200 text-mg-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">Exportar PDF</button>
           <button className="px-5 py-2.5 bg-mg-red text-white text-xs font-bold uppercase tracking-widest hover:bg-mg-red/90 transition-shadow shadow-md">Novo Relatório</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "bg-white p-6 border-t-4 shadow-sm hover:shadow-md transition-shadow",
              card.borderColor
            )}
          >
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded-full bg-gray-50", card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
              <span className={cn(
                "text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded",
                card.up ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              )}>
                {card.trend}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-mg-black mt-1">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 border-t-4 border-mg-blue shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-extrabold text-mg-black uppercase tracking-widest text-sm">Evolução dos Projetos</h3>
            <select className="text-[10px] font-bold uppercase tracking-widest border-gray-200 rounded p-1 outline-none focus:ring-1 focus:ring-mg-red">
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8102E" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#C8102E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#C8102E" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 border-t-4 border-mg-blue shadow-sm flex flex-col">
          <h3 className="font-extrabold text-mg-black uppercase tracking-widest text-sm mb-10">Status das Obras</h3>
          <div className="space-y-8 flex-1">
            {[
              { label: 'Planejamento', value: 35, color: 'bg-mg-blue' },
              { label: 'Execução', value: 45, color: 'bg-mg-red' },
              { label: 'Concluído', value: 20, color: 'bg-mg-green' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] font-extrabold uppercase tracking-widest mb-2.5">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-mg-black">{item.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full", item.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-5 bg-mg-blue rounded shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 -mr-8 -mt-8 rounded-full"></div>
            <p className="text-[11px] text-white font-bold uppercase tracking-widest leading-relaxed relative z-10 italic">
              "Desenvolvimento e transparência para o futuro de Minas Gerais."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
