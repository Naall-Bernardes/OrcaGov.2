/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent, MouseEvent, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Search, 
  MoreHorizontal,
  ArrowLeft,
  Menu,
  Grid3X3,
  Package,
  Pencil,
  Eye,
  Trash2,
  Download,
  X,
  History,
  Percent
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface EAPNode {
  id: string;
  code: string;
  description: string;
  unit?: string;
  quantity?: number;
  unitValue?: number;
  totalValue: number;
  children?: EAPNode[];
  level: number;
  type: 'ETAPA' | 'COMPOSICAO' | 'INSUMO';
}

const MOCK_DATABASES = {
  sinapi: [
    { code: '94974', description: 'Concreto usinado bombeado, fck=25MPa', unit: 'm3', value: 380.50 },
    { code: '87393', description: 'Fôrma plana de madeira compensada para pilares', unit: 'm2', value: 85.20 },
    { code: '94219', description: 'Armação de pilares e vigas utilizando aço CA-50', unit: 'kg', value: 12.45 },
    { code: '88309', description: 'Pedreiro com encargos complementares', unit: 'h', value: 25.30 },
    { code: '88316', description: 'Servente com encargos complementares', unit: 'h', value: 18.90 },
  ],
  setop: [
    { code: 'SET-001', description: 'Escavação manual em solo de 1a categoria', unit: 'm3', value: 45.00 },
    { code: 'SET-002', description: 'Reaterro compactado de valas', unit: 'm3', value: 28.50 },
    { code: 'SET-102', description: 'Alvenaria de tijolo cerâmico furado', unit: 'm2', value: 65.40 },
  ],
  seinfra: [
    { code: 'SEI-010', description: 'Pintura látex acrílica em paredes', unit: 'm2', value: 22.00 },
    { code: 'SEI-055', description: 'Piso cerâmico 40x40cm brilhante', unit: 'm2', value: 48.00 },
  ],
  sicro: [
    { code: 'SIC-100', description: 'Mobilização de equipamentos', unit: 'vb', value: 5000.00 },
    { code: 'SIC-250', description: 'Brita graduada tratada com cimento', unit: 'm3', value: 220.00 },
  ]
};

const initialEAP: EAPNode[] = [
  {
    id: 'A',
    code: 'A',
    description: 'CONSTRUÇÃO ESCOLA ESTADUAL — BLOCO A',
    totalValue: 3450000,
    level: 0,
    type: 'ETAPA',
    children: [
      {
        id: '1',
        code: '1',
        description: 'SERVIÇOS PRELIMINARES',
        totalValue: 18000,
        level: 1,
        type: 'ETAPA',
        children: [
          { id: '1.1', code: '1.1', description: 'SINAPI-94974 Mobilização e Desmobilização', unit: 'VB', quantity: 1, unitValue: 15000, totalValue: 15000, level: 2, type: 'COMPOSICAO' },
          { id: '1.2', code: '1.2', description: 'SINAPI-87393 Canteiro de Obras', unit: 'm2', quantity: 12, unitValue: 250, totalValue: 3000, level: 2, type: 'COMPOSICAO' },
        ]
      },
      {
        id: '2',
        code: '2',
        description: 'ESTRUTURA',
        totalValue: 185000,
        level: 1,
        type: 'ETAPA',
        children: [
          { 
            id: '2.1', 
            code: '2.1', 
            description: 'Pilares', 
            totalValue: 85000, 
            level: 2,
            type: 'ETAPA',
            children: [
              { id: '2.1.1', code: '2.1.1', description: 'SINAPI-94974 Concreto usinado bombeado, fck=25MPa', unit: 'm3', quantity: 18.50, unitValue: 120, totalValue: 2220, level: 3, type: 'COMPOSICAO' },
            ]
          },
        ]
      }
    ]
  }
];

const BRL = 'BRL';

export default function BudgetDetail({ budgetId, onBack }: { budgetId: string | null, onBack: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetTitle, setBudgetTitle] = useState('');
  const [eapData, setEapData] = useState<EAPNode[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Versions
  const [versions, setVersions] = useState<{ id: string; name: string; date: string; data: EAPNode[] }[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);

  // BDI (TCU 2622)
  const [isBDIModalOpen, setIsBDIModalOpen] = useState(false);
  const [bdiSettings, setBDISettings] = useState({
    adminCentral: 4.0,
    seguroRisco: 0.8,
    garantia: 0.8,
    despesasFinanceiras: 1.2,
    lucro: 7.4,
    tributos: {
       pispasep: 0.65,
       cofins: 3.0,
       iss: 5.0,
       cprb: 4.5
    }
  });

  useEffect(() => {
    if (!budgetId || !user) return;

    setLoading(true);
    const budgetRef = doc(db, 'budgets', budgetId);
    
    const unsubscribe = onSnapshot(budgetRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBudgetTitle(data.name || 'ORÇAMENTO SEM TITULO');
        
        // If data is empty or EAP is missing, initialize with a root node
        const remoteEap = data.eap || [];
        if (remoteEap.length === 0) {
          const rootNode: EAPNode = {
            id: 'A',
            code: 'A',
            description: data.name ? data.name.toUpperCase() : 'NOVO ORÇAMENTO',
            totalValue: 0,
            level: 0,
            type: 'ETAPA',
            children: []
          };
          setEapData([rootNode]);
          setExpanded(['A']);
        } else {
          setEapData(Array.isArray(remoteEap) ? remoteEap : []);
        }

        if (data.bdi) {
          setBDISettings(prev => ({
            ...prev,
            ...data.bdi
          }));
        }

        if (data.versions) {
          setVersions(data.versions);
        }
      } else {
        console.warn(`Budget with ID ${budgetId} not found in Firestore.`);
        setBudgetTitle('ORÇAMENTO NÃO ENCONTRADO');
        setEapData([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Firestore onSnapshot Error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [budgetId, user]);

  const saveBudget = async (newEap: EAPNode[], newBdi?: any, newVersions?: any[]) => {
    if (!budgetId || !user) return;
    try {
      const updates: any = {
        eap: newEap,
        totalValue: newEap[0]?.totalValue || 0,
        updatedAt: serverTimestamp()
      };
      if (newBdi) updates.bdi = newBdi;
      if (newVersions) updates.versions = newVersions;
      
      await updateDoc(doc(db, 'budgets', budgetId), updates);
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const calculateBDI = () => {
    const { adminCentral, seguroRisco, garantia, despesasFinanceiras, lucro, tributos } = bdiSettings;
    const i = tributos.pispasep + tributos.cofins + tributos.iss + tributos.cprb;
    
    // Formula TCU 2622: BDI = { [ (1 + AC + S + R + G) * (1 + DF) * (1 + L) ] / (1 - I) } - 1
    const AC = adminCentral / 100;
    const S = seguroRisco / 100;
    const R = seguroRisco / 100; // Assuming risk = insurance for simplified UI or separate if needed
    const G = garantia / 100;
    const DF = despesasFinanceiras / 100;
    const L = lucro / 100;
    const I = i / 100;

    const bdi = (((1 + AC + S + G) * (1 + DF) * (1 + L)) / (1 - I)) - 1;
    return bdi * 100;
  };

  const currentBDI = calculateBDI();

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ETAPA' | 'COMPOSICAO' | 'INSUMO' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    level: 1,
    database: 'sinapi',
    selectedItem: '',
    quantity: 1,
    parentId: 'A'
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-mg-gray">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-mg-red border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-mg-black">Carregando Orçamento...</p>
        </div>
      </div>
    );
  }

  if (!budgetId) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-gray-500">
        <h2 className="text-xl font-bold">Nenhum orçamento selecionado</h2>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-mg-blue text-white rounded font-bold uppercase text-[10px] tracking-widest">Voltar</button>
      </div>
    );
  }

  const totalDirectCost = eapData[0]?.totalValue || 0;
  const totalWithBDI = totalDirectCost * (1 + currentBDI / 100);

  const findNodeById = (nodes: EAPNode[], id: string): EAPNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getNextCodeAndParent = (requestedLevel: number, relativeToParentId?: string): { code: string, parentId: string } => {
    if (relativeToParentId) {
      const parentNode = findNodeById(eapData, relativeToParentId);
      if (parentNode) {
        const nextNum = (parentNode.children?.length || 0) + 1;
        return { code: `${parentNode.code}.${nextNum}`, parentId: parentNode.id };
      }
    }

    const findLastAtLevel = (nodes: EAPNode[], targetLevel: number): EAPNode | null => {
      let lastNode: EAPNode | null = null;
      for (const node of nodes) {
        if (node.level === targetLevel) {
          lastNode = node;
        }
        if (node.children) {
          const found = findLastAtLevel(node.children, targetLevel);
          if (found) lastNode = found;
        }
      }
      return lastNode;
    };

    if (requestedLevel === 1) {
      const root = eapData[0];
      const nextNum = (root.children?.length || 0) + 1;
      return { code: `${nextNum}`, parentId: root.id };
    }

    const parentNode = findLastAtLevel(eapData, requestedLevel - 1);
    if (!parentNode) {
      return getNextCodeAndParent(1);
    }

    const nextNum = (parentNode.children?.length || 0) + 1;
    return { code: `${parentNode.code}.${nextNum}`, parentId: parentNode.id };
  };

  const updateTreeValues = (nodes: EAPNode[]): EAPNode[] => {
    return nodes.map(node => {
      const updatedNode = { ...node };
      if (node.children && node.children.length > 0) {
        updatedNode.children = updateTreeValues(node.children);
        updatedNode.totalValue = updatedNode.children.reduce((sum, child) => sum + child.totalValue, 0);
      }
      return updatedNode;
    });
  };

  const deleteNode = (nodes: EAPNode[], id: string): EAPNode[] => {
    return nodes.filter(node => {
      if (node.id === id) return false;
      if (node.children) {
        node.children = deleteNode(node.children, id);
      }
      return true;
    });
  };

  const insertNode = (nodes: EAPNode[], parentId: string, newNode: EAPNode): EAPNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }
      if (node.children) {
        return {
          ...node,
          children: insertNode(node.children, parentId, newNode),
        };
      }
      return node;
    });
  };

  const editNode = (nodes: EAPNode[], id: string, updates: Partial<EAPNode>): EAPNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      if (node.children) {
        return {
          ...node,
          children: editNode(node.children, id, updates),
        };
      }
      return node;
    });
  };

  const handleAddItem = (e: FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingNodeId) {
      const dbMock = MOCK_DATABASES[formData.database as keyof typeof MOCK_DATABASES];
      const item = dbMock.find(i => i.code === formData.selectedItem);
      
      const updates: Partial<EAPNode> = {
        description: formData.description,
      };

      if (modalType !== 'ETAPA' && item) {
        updates.unit = item.unit;
        updates.unitValue = item.value;
        updates.quantity = formData.quantity;
        updates.totalValue = item.value * formData.quantity;
        updates.description = `${formData.database.toUpperCase()}-${item.code} ${item.description}`;
      }

      const newEap = updateTreeValues(editNode(eapData, editingNodeId, updates));
      saveBudget(newEap);
      setIsModalOpen(false);
      resetForm();
      return;
    }

    let parentId = formData.parentId || 'A';
    let nextCode = '';

    if (modalType === 'ETAPA') {
      const result = getNextCodeAndParent(formData.level, formData.parentId !== 'A' ? formData.parentId : undefined);
      parentId = result.parentId;
      nextCode = result.code;
    } else {
      const parent = findNodeById(eapData, parentId);
      nextCode = `${parent?.code ? parent.code + '.' : ''}${(parent?.children?.length || 0) + 1}`;
    }

    const newNode: EAPNode = {
      id: Math.random().toString(36).substr(2, 9),
      code: nextCode,
      description: formData.description || 'Novo Item',
      level: modalType === 'ETAPA' ? formData.level : (findNodeById(eapData, parentId)?.level || 0) + 1,
      type: modalType!,
      totalValue: 0,
      children: []
    };

    if (modalType === 'COMPOSICAO' || modalType === 'INSUMO') {
      const dbMock = MOCK_DATABASES[formData.database as keyof typeof MOCK_DATABASES];
      const item = dbMock.find(i => i.code === formData.selectedItem);
      if (item) {
        newNode.unit = item.unit;
        newNode.unitValue = item.value;
        newNode.quantity = formData.quantity;
        newNode.totalValue = item.value * formData.quantity;
        newNode.description = `${formData.database.toUpperCase()}-${item.code} ${item.description}`;
      }
    }

    const newEap = updateTreeValues(insertNode(eapData, parentId, newNode));
    saveBudget(newEap);
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    if (id === 'A') return;
    const newEap = updateTreeValues(deleteNode(eapData, id));
    saveBudget(newEap);
  };

  const handleOpenEdit = (node: EAPNode, e?: MouseEvent) => {
    e?.stopPropagation();
    setModalType(node.type);
    setIsEditing(true);
    setEditingNodeId(node.id);
    
    let dbName = 'sinapi';
    let selectedItem = '';
    
    const dbPrefixes = ['SINAPI', 'SETOP', 'SEINFRA', 'SICRO'];
    const nodeDesc = node.description || '';
    const prefix = dbPrefixes.find(p => nodeDesc.startsWith(p));
    
    if (prefix) {
      dbName = prefix.toLowerCase();
      const afterPrefix = nodeDesc.substring(prefix.length + 1);
      selectedItem = afterPrefix.split(' ')[0];
    }

    setFormData({
      description: nodeDesc,
      level: node.level,
      database: dbName,
      selectedItem: selectedItem,
      quantity: node.quantity || 1,
      parentId: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenAddChild = (parentId: string, type: 'ETAPA' | 'COMPOSICAO' | 'INSUMO', e?: MouseEvent) => {
    e?.stopPropagation();
    const parentNode = findNodeById(eapData, parentId);
    setModalType(type);
    setIsEditing(false);
    setFormData({
      description: '',
      level: (parentNode?.level || 0) + 1,
      database: 'sinapi',
      selectedItem: '',
      quantity: 1,
      parentId: parentId
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      level: 1,
      database: 'sinapi',
      selectedItem: '',
      quantity: 1,
      parentId: 'A'
    });
    setIsEditing(false);
    setEditingNodeId(null);
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const renderNode = (node: EAPNode, level: number = 0) => {
    const isExpanded = expanded.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHovered = hoveredId === node.id;

    return (
      <div 
        key={node.id}
        className={cn(
          "flex flex-col border-b border-gray-100 last:border-0 font-sans relative",
          level === 0 ? "bg-mg-gray/50" : "bg-white"
        )}
      >
        <div 
          className={cn(
            "flex items-center gap-2 py-3 px-6 transition-colors cursor-pointer relative",
            level === 0 ? "font-black text-mg-black uppercase tracking-tight" : "text-gray-700 font-medium",
            isHovered ? "bg-gray-50/80" : ""
          )}
          onClick={() => hasChildren && toggleExpand(node.id)}
          onMouseEnter={() => setHoveredId(node.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}
        >
          <div className="flex items-center gap-2 w-[120px] shrink-0 font-bold text-[10px] text-gray-500 tracking-widest">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
            ) : <div className="w-3.5" />}
            {node.code}
          </div>
          <div className="flex-1 relative">
            <div className="flex items-center gap-2">
              {node.description && (node.description.startsWith('SINAPI') || node.description.startsWith('SETOP') || node.description.startsWith('SEINFRA') || node.description.startsWith('SICRO')) ? (
                 <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">
                   {node.description.split('-')[0]}
                 </span>
              ) : null}
              <span className="text-xs truncate">{node.description || 'Sem Descrição'}</span>
            </div>
            
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 top-full mt-1 flex items-center gap-0.5 z-50 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={(e) => handleOpenAddChild(node.id, 'ETAPA', e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4299E1] text-white text-[9px] font-black uppercase rounded-l hover:bg-blue-600 shadow-lg transition-colors border border-white/20"
                  >
                    <Menu className="h-3 w-3" /> Etapa
                  </button>
                  <button 
                    onClick={(e) => handleOpenAddChild(node.id, 'COMPOSICAO', e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#38A169] text-white text-[9px] font-black uppercase hover:bg-green-600 shadow-lg transition-colors border border-white/20"
                  >
                    <Grid3X3 className="h-3 w-3" /> Composição
                  </button>
                  <button 
                    onClick={(e) => handleOpenAddChild(node.id, 'INSUMO', e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ED8936] text-white text-[9px] font-black uppercase hover:bg-orange-600 shadow-lg transition-colors border border-white/20"
                  >
                    <Package className="h-3 w-3" /> Insumo
                  </button>
                  <button 
                    onClick={(e) => handleOpenEdit(node, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-[9px] font-black uppercase hover:bg-gray-700 shadow-lg transition-colors border border-white/20"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button 
                    onClick={(e) => handleDelete(node.id, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C53030] text-white text-[9px] font-black uppercase rounded-r hover:bg-red-700 shadow-lg transition-colors border border-white/20"
                  >
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="w-20 text-center text-xs font-bold text-gray-400">{node.unit || '--'}</div>
          <div className="w-28 text-right text-xs font-bold text-mg-black">
            {level > 0 && <span className="text-[9px] text-mg-blue block leading-none mb-1">ÍNDICE:</span>}
            {node.quantity?.toLocaleString('pt-BR', { minimumFractionDigits: level > 0 ? 4 : 2 }) || '--'}
          </div>
          <div className="w-32 text-right text-xs font-bold text-gray-500">
            {node.unitValue ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: BRL }).format(node.unitValue) : '--'}
          </div>
          <div className="w-40 text-right text-sm font-black text-mg-black">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: BRL }).format(node.totalValue)}
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && hasChildren && node.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white"
            >
              {node.children.map(child => renderNode(child, level + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const dbItems = formData.database ? MOCK_DATABASES[formData.database as keyof typeof MOCK_DATABASES] : [];
  const selectedItemData = dbItems.find(i => i.code === formData.selectedItem);

  return (
    <div className="h-full flex flex-col bg-mg-gray font-sans">
      <div className="bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded text-mg-black"><ArrowLeft className="h-5 w-5" /></button>
            <div>
                <h2 className="text-lg font-black text-mg-black uppercase tracking-tight">{budgetTitle}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estrutura Analítica de Projeto (EAP)</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsVersionsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 bg-white"
            >
              <History className="h-3.5 w-3.5 text-mg-blue" /> Versões
            </button>
            <button 
              onClick={() => setIsBDIModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 bg-white"
            >
              <Percent className="h-3.5 w-3.5 text-mg-red" /> BDI (TCU 2622)
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 bg-white">
              <Download className="h-3.5 w-3.5" /> Importar p/ Orçamento
            </button>
          </div>
        </div>

        <div className="border-t-2 border-mg-red mx-8"></div>

        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => { setModalType('ETAPA'); setIsModalOpen(true); }}
              className="w-24 h-24 flex flex-col items-center justify-center gap-2 bg-[#4299E1] text-white rounded shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Menu className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Etapa</span>
            </button>
            <button 
              onClick={() => { setModalType('COMPOSICAO'); setIsModalOpen(true); }}
              className="w-24 h-24 flex flex-col items-center justify-center gap-2 bg-[#38A169] text-white rounded shadow-lg shadow-green-500/20 active:scale-95 transition-all"
            >
              <Grid3X3 className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Composição</span>
            </button>
            <button 
              onClick={() => { setModalType('INSUMO'); setIsModalOpen(true); }}
              className="w-24 h-24 flex flex-col items-center justify-center gap-2 bg-[#ED8936] text-white rounded shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
            >
              <Package className="h-8 w-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Insumo</span>
            </button>
          </div>
          
          <div className="text-right">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Passe o mouse sobre uma linha para ver ações</p>
             <div className="flex items-center gap-10">
               <div className="text-right">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Custo Direto</p>
                  <p className="text-lg font-black text-mg-black tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: BRL }).format(totalDirectCost)}
                  </p>
               </div>
               <div className="text-right border-l border-gray-200 pl-10">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">BDI ({currentBDI.toFixed(2)}%)</p>
                  <p className="text-lg font-black text-mg-blue tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: BRL }).format(totalDirectCost * (currentBDI / 100))}
                  </p>
               </div>
               <div className="text-right border-l border-gray-200 pl-10">
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-1">Valor Total com BDI</p>
                  <p className="text-2xl font-black text-mg-red tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: BRL }).format(totalWithBDI)}
                  </p>
               </div>
               <button className="px-8 py-3 bg-mg-blue text-white rounded shadow-lg shadow-mg-blue/20 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-mg-blue/90 transition-all ml-4">
                 GERAR RELATÓRIO PDF
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white m-8 border border-gray-200 shadow-sm border-t-4 border-mg-blue pb-32">
        <div className="min-w-[1000px]">
          <div className="flex items-center gap-2 py-4 px-6 bg-mg-black text-white text-[10px] font-black uppercase tracking-[0.2em] sticky top-0 z-30">
            <div className="w-[120px] shrink-0">ITEM</div>
            <div className="flex-1">COMPOSIÇÃO / SERVIÇO</div>
            <div className="w-20 text-center">UND</div>
            <div className="w-28 text-right">QTDE (REF.)</div>
            <div className="w-32 text-right">Unitário (R$)</div>
            <div className="w-40 text-right">Total (R$)</div>
            <div className="w-10"></div>
          </div>
          {eapData.map(node => renderNode(node))}
        </div>
      </div>

      {/* Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-mg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-mg-red"
            >
              <div className="flex items-center justify-between p-6 bg-mg-gray border-b border-gray-200">
                <h3 className="text-xl font-black text-mg-black uppercase tracking-tighter italic">{isEditing ? 'Editar' : 'Adicionar'} <span className="text-mg-red">{modalType}</span></h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleAddItem} className="p-8 space-y-6">
                {modalType === 'ETAPA' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nível (Indentação)</label>
                      <select 
                        className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm outline-none"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5].map(l => <option key={l} value={l}>Nível {l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Descrição da Etapa</label>
                      <input 
                        required
                        type="text" 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ex: FUNDAÇÕES"
                        className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Banco de Dados</label>
                      <select 
                        className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm outline-none"
                        value={formData.database}
                        onChange={(e) => setFormData({ ...formData, database: e.target.value, selectedItem: '' })}
                      >
                        <option value="sinapi">SINAPI</option>
                        <option value="setop">SETOP</option>
                        <option value="seinfra">SEINFRA</option>
                        <option value="sicro">SICRO</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{modalType === 'COMPOSICAO' ? 'Composição' : 'Insumo'}</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm outline-none"
                        value={formData.selectedItem}
                        onChange={(e) => setFormData({ ...formData, selectedItem: e.target.value })}
                      >
                        <option value="">Selecione o item...</option>
                        {dbItems.map(item => (
                          <option key={item.code} value={item.code}>{item.code} - {item.description}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Unidade</label>
                        <input 
                          readOnly
                          value={selectedItemData?.unit || '--'}
                          className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded font-bold text-sm outline-none text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Quantidade</label>
                        <input 
                          required
                          type="number"
                          step="0.01"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 bg-mg-gray border border-gray-200 rounded font-bold text-sm outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 bg-mg-gray text-mg-black text-[10px] font-black uppercase tracking-widest rounded hover:bg-gray-200 transition-all font-sans"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 bg-mg-red text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg shadow-mg-red/20 hover:bg-mg-red/90 transition-all font-sans"
                  >
                    {isEditing ? 'Salvar' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* BDI Modal */}
      <AnimatePresence>
        {isBDIModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-mg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden border-t-8 border-mg-red"
            >
              <div className="flex items-center justify-between p-6 bg-mg-gray border-b border-gray-200">
                <h3 className="text-xl font-black text-mg-black uppercase tracking-tighter italic">Composição BDI <span className="text-mg-red">(TCU 2622)</span></h3>
                <button onClick={() => setIsBDIModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 h-[500px] overflow-y-auto">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Custos Indiretos e Lucro</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Administração Central (%)</label>
                      <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.adminCentral} onChange={(e) => setBDISettings({...bdiSettings, adminCentral: parseFloat(e.target.value)})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Seguro (%)</label>
                        <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.seguroRisco} onChange={(e) => setBDISettings({...bdiSettings, seguroRisco: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Garantia (%)</label>
                        <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.garantia} onChange={(e) => setBDISettings({...bdiSettings, garantia: parseFloat(e.target.value)})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Despesas Financeiras (%)</label>
                      <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.despesasFinanceiras} onChange={(e) => setBDISettings({...bdiSettings, despesasFinanceiras: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Lucro (%)</label>
                      <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.lucro} onChange={(e) => setBDISettings({...bdiSettings, lucro: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Tributos</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">PIS/PASEP (%)</label>
                        <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.tributos.pispasep} onChange={(e) => setBDISettings({...bdiSettings, tributos: {...bdiSettings.tributos, pispasep: parseFloat(e.target.value)}})} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">COFINS (%)</label>
                        <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.tributos.cofins} onChange={(e) => setBDISettings({...bdiSettings, tributos: {...bdiSettings.tributos, cofins: parseFloat(e.target.value)}})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">ISS (%)</label>
                      <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.tributos.iss} onChange={(e) => setBDISettings({...bdiSettings, tributos: {...bdiSettings.tributos, iss: parseFloat(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">CPRB (%) - Oneração Folha</label>
                      <input type="number" step="0.01" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded font-bold text-sm" value={bdiSettings.tributos.cprb} onChange={(e) => setBDISettings({...bdiSettings, tributos: {...bdiSettings.tributos, cprb: parseFloat(e.target.value)}})} />
                    </div>
                  </div>

                  <div className="mt-8 p-6 bg-mg-blue/5 rounded border border-mg-blue/10">
                    <p className="text-[10px] font-black text-mg-blue uppercase tracking-widest mb-1 italic">Resultado Final</p>
                    <p className="text-3xl font-black text-mg-blue tracking-tighter">{currentBDI.toFixed(4)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 border-t border-gray-100 flex gap-4">
                 <button onClick={() => { saveBudget(eapData, bdiSettings); setIsBDIModalOpen(false); }} className="flex-1 px-6 py-4 bg-mg-red text-white text-[10px] font-black uppercase tracking-widest rounded shadow-xl">Aplicar Coeficiente BDI</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Versions Modal */}
      <AnimatePresence>
        {isVersionsModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-mg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-mg-blue"
            >
              <div className="flex items-center justify-between p-6 bg-mg-gray border-b border-gray-200">
                <h3 className="text-xl font-black text-mg-black uppercase tracking-tighter italic whitespace-nowrap">Histórico de <span className="text-mg-blue">Versões</span></h3>
                <button onClick={() => setIsVersionsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                 <button 
                  onClick={() => {
                    const newVersion = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: `Versão ${versions.length + 1} - ${new Date().toLocaleTimeString()}`,
                      date: new Date().toISOString(),
                      data: JSON.parse(JSON.stringify(eapData))
                    };
                    const newVersions = [newVersion, ...versions];
                    saveBudget(eapData, undefined, newVersions);
                  }}
                  className="w-full py-4 border-2 border-dashed border-mg-blue/30 text-mg-blue text-[10px] font-black uppercase tracking-widest hover:bg-mg-blue/5 rounded transition-all"
                >
                  Salvar Nova Versão Atual
                </button>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Versões Arquivadas</p>
                  {versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white border hover:border-mg-blue transition-all group">
                       <div>
                         <p className="text-xs font-bold text-mg-black uppercase">{v.name}</p>
                         <p className="text-[9px] text-gray-400 font-medium">{new Date(v.date).toLocaleString('pt-BR')}</p>
                       </div>
                       <button 
                         onClick={() => { 
                           saveBudget(v.data);
                           setIsVersionsModalOpen(false); 
                         }}
                         className="px-3 py-1.5 bg-mg-blue text-white text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all"
                       >
                         Restaurar
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
