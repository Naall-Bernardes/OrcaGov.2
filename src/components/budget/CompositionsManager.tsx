/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Database, 
  FileJson, 
  Info,
  MoreVertical,
  Edit,
  Trash2,
  Import
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface Composition {
  id: string;
  code: string;
  description: string;
  unit: string;
  value: number;
  database: string;
  children?: Composition[];
}

const MOCK_COMPOSITIONS: Composition[] = [
  {
    id: '1',
    code: '94974',
    description: 'Concreto usinado bombeado, fck=25MPa',
    unit: 'm3',
    value: 380.50,
    database: 'SINAPI',
    children: [
      { id: '1.1', code: '88309', description: 'Pedreiro com encargos complementares', unit: 'h', value: 25.30, database: 'SINAPI' },
      { id: '1.2', code: '88316', description: 'Servente com encargos complementares', unit: 'h', value: 18.90, database: 'SINAPI' },
      { id: '1.3', code: '11145', description: 'Concreto usinado', unit: 'm3', value: 336.30, database: 'SINAPI' },
    ]
  },
  {
    id: '2',
    code: '87393',
    description: 'Fôrma plana de madeira compensada para pilares',
    unit: 'm2',
    value: 85.20,
    database: 'SINAPI',
    children: [
      { id: '2.1', code: '88 کارگر', description: 'Carpinteiro', unit: 'h', value: 25.30, database: 'SINAPI' },
      { id: '2.2', code: '616', description: 'Madeira compensada', unit: 'm2', value: 35.00, database: 'SINAPI' },
    ]
  }
];

export default function CompositionsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [compositions, setCompositions] = useState<Composition[]>(MOCK_COMPOSITIONS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedIds(newExpanded);
  };

  const renderComposition = (comp: Composition, level: number = 0) => {
    const hasChildren = comp.children && comp.children.length > 0;
    const isExpanded = expandedIds.has(comp.id);

    return (
      <div key={comp.id} className="border-b border-gray-100 last:border-0">
        <div 
          className={cn(
            "flex items-center py-4 px-6 hover:bg-gray-50 transition-colors cursor-pointer group",
            level > 0 && "bg-gray-50/30"
          )}
          style={{ paddingLeft: `${24 + level * 24}px` }}
          onClick={() => hasChildren && toggleExpand(comp.id)}
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-6 flex items-center justify-center">
              {hasChildren ? (
                isExpanded ? <ChevronDown className="h-4 w-4 text-mg-red" /> : <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : null}
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-mg-blue/10 text-mg-blue text-[9px] font-black uppercase rounded">
                  {comp.database}
                </span>
                <span className="text-xs font-bold text-gray-500 font-mono tracking-tighter">{comp.code}</span>
              </div>
              <span className={cn(
                "text-sm font-bold tracking-tight uppercase italic",
                level === 0 ? "text-mg-black" : "text-gray-600"
              )}>
                {comp.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-12">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Unidade</p>
              <p className="text-xs font-bold text-mg-black italic">{comp.unit}</p>
            </div>
            <div className="text-right min-w-[100px]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Preço Unitário</p>
              <p className="text-sm font-black text-mg-red italic">R$ {comp.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <button className="p-2 hover:bg-mg-blue/10 rounded-full text-mg-blue transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-mg-red/10 rounded-full text-mg-red transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {comp.children!.map(child => renderComposition(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div id="compositions-manager" className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-mg-black tracking-tighter uppercase italic">Gerenciador de <span className="text-mg-red">Composições</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider">Base de dados, composições próprias e importação.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setIsImportModalOpen(true)}
             className="px-5 py-2.5 bg-white border border-gray-200 text-mg-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
           >
             <Import className="h-4 w-4 text-mg-red" /> Importar Base
           </button>
           <button className="px-5 py-2.5 bg-mg-red text-white text-xs font-bold uppercase tracking-widest hover:bg-mg-red/90 transition-shadow shadow-md flex items-center gap-2">
             <Plus className="h-4 w-4" /> Criar Composição
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 border-t-4 border-mg-blue shadow-sm">
            <h3 className="text-[10px] font-black text-mg-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter className="h-3 w-3" /> Filtros e Bases
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Origem</p>
                <div className="space-y-1">
                  {['SINAPI', 'SETOP', 'SEINFRA', 'SICRO', 'Próprias'].map(db => (
                    <label key={db} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer group">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-mg-red focus:ring-mg-red" />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest group-hover:text-mg-black">{db}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mg-blue p-6 rounded shadow-lg text-white">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-mg-red" /> Dica de Uso
            </h4>
            <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
              Analise os insumos de cada composição clicando na seta lateral. Você pode editar composições existentes ou criar novas a partir do zero.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="PESQUISAR POR CÓDIGO OU DESCRIÇÃO..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-mg-red transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 px-4 border-l border-gray-200">
               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total: </span>
               <span className="text-xs font-bold text-mg-black">1.250 Itens</span>
            </div>
          </div>

          <div className="bg-white border-t-8 border-mg-red shadow-xl overflow-hidden">
            {compositions.map(comp => renderComposition(comp))}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-mg-black/60 backdrop-blur-sm"
              onClick={() => setIsImportModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-mg-red"
            >
              <div className="p-8">
                <h3 className="text-xl font-black text-mg-black uppercase tracking-tighter italic mb-2">Importar <span className="text-mg-red">Base de Dados</span></h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-8">Selecione o arquivo de base (Excel ou JSON).</p>
                
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center hover:border-mg-red/50 transition-colors cursor-pointer group">
                  <div className="p-4 bg-gray-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Download className="h-8 w-8 text-mg-red" />
                  </div>
                  <p className="text-xs font-black text-mg-black uppercase tracking-widest">Arraste o arquivo aqui</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ou clique para selecionar</p>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-mg-blue/5 rounded border border-mg-blue/10">
                    <Database className="h-5 w-5 text-mg-blue" />
                    <div>
                      <p className="text-[10px] font-bold text-mg-black uppercase tracking-widest leading-none">Formato Recomendado</p>
                      <p className="text-[9px] text-mg-blue font-medium uppercase tracking-wider mt-1 italic">Padrão SINAPI / SEINFRA (.xlsx)</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    className="flex-1 px-6 py-4 bg-mg-red text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg shadow-mg-red/20 hover:bg-mg-red/90 transition-all"
                  >
                    Iniciar Importação
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
