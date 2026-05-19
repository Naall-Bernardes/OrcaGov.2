/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent, MouseEvent } from 'react';
import { 
  MoreVertical, 
  Trash2, 
  FileEdit,
  Plus,
  X,
  Search,
  Pencil
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Budget {
  id: string;
  name: string;
  sre: string;
  municipality: string;
  school: string;
  schoolAddress: string;
  date: string;
  status: 'A Iniciar' | 'Em Execução' | 'Concluído' | 'Cancelado';
  totalValue: number;
}

interface BudgetListProps {
  onSelectBudget: (id: string) => void;
}

export default function BudgetList({ onSelectBudget }: BudgetListProps) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [newBudgetData, setNewBudgetData] = useState({
    name: '',
    sre: '',
    municipality: '',
    school: '',
    schoolAddress: '',
    templateId: ''
  });

  const [loading, setLoading] = useState(true);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterSre, setFilterSre] = useState('');
  const [filterMunicipality, setFilterMunicipality] = useState('');
  const [filterSchool, setFilterSchool] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'budgets')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const budgetsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        let dateStr = data.date;
        
        if (!dateStr && createdAt) {
          try {
            dateStr = typeof createdAt.toDate === 'function' 
              ? createdAt.toDate().toISOString().split('T')[0] 
              : (typeof createdAt === 'string' ? createdAt : new Date().toISOString().split('T')[0]);
          } catch (e) {
            dateStr = new Date().toISOString().split('T')[0];
          }
        }

        return {
          id: doc.id,
          ...data,
          name: data.name || 'SEM NOME',
          date: dateStr || new Date().toISOString().split('T')[0],
          sre: data.sre || '',
          municipality: data.municipality || '',
          school: data.school || '',
          schoolAddress: data.schoolAddress || '',
          totalValue: data.totalValue || 0,
          status: data.status || 'A Iniciar'
        };
      }) as Budget[];
      setBudgets(budgetsData);
      setLoading(false);
    }, (error) => {
      console.error('Firestore Error:', error);
      setLoading(false);
    });

    const handleClickOutside = () => setActiveDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => {
      unsubscribe();
      window.removeEventListener('click', handleClickOutside);
    };
  }, [user]);

  const handleCreateBudget = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let templateData = {};
      if (newBudgetData.templateId) {
        const templateDoc = await getDoc(doc(db, 'budgets', newBudgetData.templateId));
        if (templateDoc.exists()) {
          const data = templateDoc.data();
          templateData = {
            eap: data.eap || [],
            bdi: data.bdi || {},
            totalValue: data.totalValue || 0
          };
        }
      }

      await addDoc(collection(db, 'budgets'), {
        ...newBudgetData,
        ...templateData,
        userId: user.uid,
        status: 'A Iniciar',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setNewBudgetData({ name: '', sre: '', municipality: '', school: '', schoolAddress: '', templateId: '' });
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleUpdateBudget = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !user) return;
    try {
      const budgetRef = doc(db, 'budgets', editingBudget.id);
      const { id, ...dataToUpdate } = editingBudget;
      await updateDoc(budgetRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
      });
      setIsEditModalOpen(false);
      setEditingBudget(null);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDuplicateBudget = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setActiveDropdownId(null);
    try {
      const sourceDoc = await getDoc(doc(db, 'budgets', id));
      if (sourceDoc.exists()) {
        const data = sourceDoc.data();
        await addDoc(collection(db, 'budgets'), {
          ...data,
          name: `${data.name} (CÓPIA)`,
          date: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error duplicating budget:', error);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!user) return;
    try {
      const budgetRef = doc(db, 'budgets', id);
      await updateDoc(budgetRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setUpdatingStatusId(null);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteBudget = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setActiveDropdownId(null);
    setDeletingId(null);
    
    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Execução': return 'bg-blue-50 text-blue-700 border-blue-200 text-blue-600';
      case 'A Iniciar': return 'bg-yellow-50 text-yellow-700 border-yellow-200 text-yellow-600';
      case 'Concluído': return 'bg-green-50 text-green-700 border-green-200 text-green-600';
      case 'Cancelado': return 'bg-red-50 text-red-700 border-red-200 text-red-600';
      default: return 'bg-gray-100 text-gray-700 border-gray-300 text-gray-600';
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    return (
      (budget.sre || "").toLowerCase().includes(filterSre.toLowerCase()) &&
      (budget.municipality || "").toLowerCase().includes(filterMunicipality.toLowerCase()) &&
      (budget.school || "").toLowerCase().includes(filterSchool.toLowerCase())
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-mg-black tracking-tighter uppercase italic">Meus <span className="text-mg-red">Orçamentos</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-wider">Gerencie e acompanhe todos os projetos orçamentários do estado.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <input 
              type="text" 
              placeholder="Filtrar SRE..." 
              value={filterSre}
              onChange={(e) => setFilterSre(e.target.value)}
              className="w-full py-2 pl-9 pr-3 bg-white border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red transition-all shadow-sm"
            />
          </div>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <input 
              type="text" 
              placeholder="Filtrar Município..." 
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
              className="w-full py-2 pl-9 pr-3 bg-white border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red transition-all shadow-sm"
            />
          </div>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <input 
              type="text" 
              placeholder="Filtrar Escola..." 
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="w-full py-2 pl-9 pr-3 bg-white border border-gray-200 rounded text-[9px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-mg-red text-white text-xs font-bold uppercase tracking-widest hover:bg-mg-red/90 transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </button>
        </div>
      </div>

      <div className="bg-white border-t-4 border-mg-blue shadow-sm overflow-hidden text-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-mg-blue text-white uppercase tracking-widest text-[10px] font-bold">
              <th className="text-left px-6 py-4">Projeto / Escola</th>
              <th className="text-left px-6 py-4">SRE</th>
              <th className="text-left px-6 py-4">Município</th>
              <th className="text-left px-6 py-4">Data</th>
              <th className="text-left px-6 py-4 text-right">Valor Total</th>
              <th className="text-center px-6 py-4">Status</th>
              <th className="text-right px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-mg-red border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Carregando Orçamentos...</p>
                  </div>
                </td>
              </tr>
            ) : filteredBudgets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-tight">Nenhum orçamento encontrado.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 text-mg-red font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    + Criar Primeiro Orçamento
                  </button>
                </td>
              </tr>
            ) : filteredBudgets.map((budget, i) => (
              <motion.tr 
                key={budget.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() => onSelectBudget(budget.id)}
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-mg-black uppercase tracking-tight">{budget.name}</div>
                  <div className="text-[10px] text-mg-red mt-0.5 font-bold uppercase">{budget.school}</div>
                  <div className="text-[9px] text-gray-400 font-medium">GRP: {budget.id.padStart(6, '0')}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 font-bold uppercase text-[10px] tracking-tight">{budget.sre}</td>
                <td className="px-6 py-4 text-gray-600 font-medium">{budget.municipality}</td>
                <td className="px-6 py-4 text-gray-500 font-bold uppercase tracking-tighter">
                  {new Date(budget.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-right font-black text-mg-black">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.totalValue)}
                </td>
                <td className="px-6 py-4 text-center">
                  <div onClick={(e) => e.stopPropagation()} className="relative inline-block">
                    {updatingStatusId === budget.id ? (
                      <select 
                        autoFocus
                        className="text-[9px] font-black uppercase tracking-widest border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-mg-red/50 bg-white"
                        value={budget.status}
                        onBlur={() => setUpdatingStatusId(null)}
                        onChange={(e) => handleStatusUpdate(budget.id, e.target.value as any)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="A Iniciar">A Iniciar</option>
                        <option value="Em Execução">Em Execução</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    ) : (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUpdatingStatusId(budget.id);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 border rounded text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-opacity-80 transition-all", 
                          getStatusColor(budget.status)
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full ring-1 ring-offset-1 ring-current", getStatusColor(budget.status).split(' ').pop())}></div>
                        {budget.status}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {deletingId === budget.id ? (
                      <div className="flex items-center gap-1 bg-mg-red text-white rounded px-2 py-1 animate-in slide-in-from-right-4">
                        <span className="text-[8px] font-black uppercase tracking-widest mr-1">Excluir?</span>
                        <button 
                          onClick={(e) => handleDeleteBudget(budget.id, e)}
                          className="p-1 hover:bg-white/20 rounded font-bold text-[8px] uppercase tracking-widest"
                        >
                          Sim
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                          className="p-1 hover:bg-white/20 rounded font-bold text-[8px] uppercase tracking-widest"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          id={`open-budget-${budget.id}`}
                          title="Abrir Orçamento"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBudget(budget.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-mg-blue/10 text-mg-blue hover:bg-mg-blue hover:text-white rounded transition-all font-black text-[9px] uppercase tracking-widest border border-mg-blue/20"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Abrir</span>
                        </button>
                        <button 
                          title="Configurações (Metadados)"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingBudget(budget);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-mg-black hover:bg-gray-100 rounded transition-all"
                        >
                          <Pencil className="h-4 w-4 pointer-events-none" />
                        </button>
                        <button 
                          title="Excluir Orçamento"
                          onClick={(e) => { e.stopPropagation(); setDeletingId(budget.id); }}
                          className="p-2 text-gray-400 hover:text-mg-red hover:bg-mg-red/5 rounded transition-all"
                        >
                          <Trash2 className="h-4 w-4 pointer-events-none" />
                        </button>
                        <div className="relative">
                          <button 
                            title="Mais Opções"
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveDropdownId(activeDropdownId === budget.id ? null : budget.id);
                            }}
                            className="p-2 text-gray-400 hover:text-mg-black hover:bg-gray-100 rounded transition-all"
                          >
                            <MoreVertical className="h-4 w-4 pointer-events-none" />
                          </button>

                          <AnimatePresence>
                            {activeDropdownId === budget.id && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-xl z-[100] py-2 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button 
                                  onClick={(e) => handleDuplicateBudget(budget.id, e)}
                                  className="w-full text-left px-4 py-2 hover:bg-mg-blue/5 text-mg-black flex items-center gap-2 group transition-all"
                                >
                                  <Plus className="h-3.5 w-3.5 text-mg-blue" />
                                  <span className="font-bold text-[10px] uppercase tracking-widest">Duplicar Orçamento</span>
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeletingId(budget.id); setActiveDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-mg-red/5 text-mg-red flex items-center gap-2 group transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="font-bold text-[10px] uppercase tracking-widest">Excluir Orçamento</span>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditModalOpen && editingBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden border-t-8 border-mg-blue"
            >
              <div className="flex items-center justify-between p-6 bg-mg-gray border-b border-gray-200">
                <h3 className="text-xl font-black text-mg-black uppercase tracking-tighter italic">Editar <span className="text-mg-blue">Orçamento</span></h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateBudget} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Nome do Orçamento</label>
                    <input 
                      required
                      type="text" 
                      value={editingBudget.name}
                      onChange={(e) => setEditingBudget({ ...editingBudget, name: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-blue/20 focus:border-mg-blue outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">SRE (Superintendência)</label>
                    <select 
                      required
                      value={editingBudget.sre}
                      onChange={(e) => setEditingBudget({ ...editingBudget, sre: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-blue/20 focus:border-mg-blue outline-none transition-all"
                    >
                      <option value="">Selecione a SRE</option>
                      <option value="SRE Metropolitana A">SRE Metropolitana A</option>
                      <option value="SRE Metropolitana B">SRE Metropolitana B</option>
                      <option value="SRE Metropolitana C">SRE Metropolitana C</option>
                      <option value="SRE Contagem">SRE Contagem</option>
                      <option value="SRE Uberlândia">SRE Uberlândia</option>
                      <option value="SRE Juiz de Fora">SRE Juiz de Fora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Município</label>
                    <input 
                      required
                      type="text" 
                      value={editingBudget.municipality}
                      onChange={(e) => setEditingBudget({ ...editingBudget, municipality: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-blue/20 focus:border-mg-blue outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Escola</label>
                    <input 
                      required
                      type="text" 
                      value={editingBudget.school}
                      onChange={(e) => setEditingBudget({ ...editingBudget, school: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-blue/20 focus:border-mg-blue outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Endereço</label>
                    <input 
                      required
                      type="text" 
                      value={editingBudget.schoolAddress}
                      onChange={(e) => setEditingBudget({ ...editingBudget, schoolAddress: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-blue/20 focus:border-mg-blue outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-mg-gray text-mg-black text-[10px] font-black uppercase tracking-[0.2em] rounded hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-mg-blue text-white text-[10px] font-black uppercase tracking-[0.2em] rounded shadow-lg shadow-mg-blue/20 hover:bg-mg-blue/90 transition-all active:scale-95"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden border-t-8 border-mg-red"
            >
              <div className="flex items-center justify-between p-6 bg-mg-gray border-b border-gray-200">
                <h3 className="text-xl font-black text-mg-black uppercase tracking-tighter italic">Novo <span className="text-mg-red">Orçamento OrçaGov</span></h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleCreateBudget} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Usar Orçamento como Base (Opcional)</label>
                    <select 
                      value={newBudgetData.templateId}
                      onChange={(e) => setNewBudgetData({ ...newBudgetData, templateId: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
                    >
                      <option value="">-- CRIAR DO ZERO (VAZIO) --</option>
                      {budgets.map(b => (
                        <option key={b.id} value={b.id}>{b.name.toUpperCase()} ({b.school})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Nome do Orçamento</label>
                    <input 
                      required
                      type="text" 
                      value={newBudgetData.name}
                      onChange={(e) => setNewBudgetData({ ...newBudgetData, name: e.target.value })}
                      placeholder="Ex: Reforma Geral Bloco A"
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">SRE (Superintendência)</label>
                    <select 
                      required
                      value={newBudgetData.sre}
                      onChange={(e) => setNewBudgetData({ ...newBudgetData, sre: e.target.value })}
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
                    >
                      <option value="">Selecione a SRE</option>
                      <option value="SRE Metropolitana A">SRE Metropolitana A</option>
                      <option value="SRE Metropolitana B">SRE Metropolitana B</option>
                      <option value="SRE Metropolitana C">SRE Metropolitana C</option>
                      <option value="SRE Contagem">SRE Contagem</option>
                      <option value="SRE Uberlândia">SRE Uberlândia</option>
                      <option value="SRE Juiz de Fora">SRE Juiz de Fora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Município</label>
                    <input 
                      required
                      type="text" 
                      value={newBudgetData.municipality}
                      onChange={(e) => setNewBudgetData({ ...newBudgetData, municipality: e.target.value })}
                      placeholder="Ex: Belo Horizonte"
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Escola</label>
                    <input 
                      required
                      type="text" 
                      value={newBudgetData.school}
                      onChange={(e) => setNewBudgetData({ ...newBudgetData, school: e.target.value })}
                      placeholder="Nome da Escola Estadual"
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Endereço</label>
                    <input 
                      required
                      type="text" 
                      value={newBudgetData.schoolAddress}
                      onChange={(e) => setNewBudgetData({ ...newBudgetData, schoolAddress: e.target.value })}
                      placeholder="Rua, Número, Bairro"
                      className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm focus:ring-2 focus:ring-mg-red/20 focus:border-mg-red outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-mg-gray text-mg-black text-[10px] font-black uppercase tracking-[0.2em] rounded hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-mg-red text-white text-[10px] font-black uppercase tracking-[0.2em] rounded shadow-lg shadow-mg-red/20 hover:bg-mg-red/90 transition-all active:scale-95"
                  >
                    Criar Orçamento
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
