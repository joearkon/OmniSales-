
import React, { useRef, useState, useMemo } from 'react';
import { CRMLead, Language, DeepPersonaResult, CompanyProfile } from '../types';
import { CRM_STATUSES, TRANSLATIONS, LEAD_TYPES_MAP, VALUE_CATEGORY_MAP } from '../constants';
import { Trash2, Edit2, User, Factory, Smartphone, MessageSquare, Download, Upload, AlertCircle, Tag, Plus, X, Check, Search, PieChart, TrendingUp, Users, CheckSquare, Square, Copy, ArrowUpDown, Microscope, Brain } from 'lucide-react';
import { DeepAnalysisModal } from './DeepAnalysisModal';

interface CRMBoardProps {
  leads: CRMLead[];
  onUpdate: (id: string, updates: Partial<CRMLead>) => void;
  onDelete: (id: string) => void;
  onImport: (importedLeads: CRMLead[]) => void;
  lang: Language;
  companyProfile?: CompanyProfile;
}

export const CRMBoard: React.FC<CRMBoardProps> = ({ leads, onUpdate, onDelete, onImport, lang, companyProfile }) => {
  const t = TRANSLATIONS[lang];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'dateDesc' | 'valueHigh' | 'outreach'>('dateDesc');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [bulkTagText, setBulkTagText] = useState('');

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  const [addingTagId, setAddingTagId] = useState<string | null>(null);
  const [newTagText, setNewTagText] = useState('');

  const [deepAnalyzeLead, setDeepAnalyzeLead] = useState<CRMLead | null>(null);

  const stats = useMemo(() => {
    const total = leads.length;
    const highValue = leads.filter(l => l.valueCategory === 'High Value User' || l.valueCategory === 'Potential Partner').length;
    const contacted = leads.filter(l => l.status !== 'New').length;
    const conversionRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
    return { total, highValue, contacted, conversionRate };
  }, [leads]);

  const processedLeads = useMemo(() => {
    let result = leads.filter(l => {
        const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || l.accountName.toLowerCase().includes(searchLower) || l.notes?.toLowerCase().includes(searchLower);
        return matchesStatus && matchesSearch;
    });

    result.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : new Date(a.addedAt).getTime();
        const dateB = b.date ? new Date(b.date).getTime() : new Date(b.addedAt).getTime();
        return dateB - dateA; 
    });

    return result;
  }, [leads, statusFilter, searchTerm, sortOption]);

  const getLocalizedLabel = (map: any, key: string) => {
      if (!key) return '-';
      return map[key]?.[lang] || key;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col"><span className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><Users size={12}/> {t.crm.stats.total}</span><span className="text-2xl font-bold text-slate-900">{stats.total}</span></div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col"><span className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> {t.crm.stats.highPotential}</span><span className="text-2xl font-bold text-indigo-600">{stats.highValue}</span></div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div><h2 className="text-xl font-bold text-slate-900">{t.crm.title}</h2></div>
        <div className="flex gap-3"><input type="text" placeholder={t.crm.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" /></div>
      </div>

      <div className="space-y-4">
        {processedLeads.map(lead => {
            const lType = lead.leadType || 'User';
            const vCat = lead.valueCategory || 'Low Value User';
            
            return (
                <div key={lead.id} className="bg-white border rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between">
                        <div>
                            <h4 className="font-bold text-lg break-words">{lead.accountName}</h4>
                            <div className="flex gap-2 mt-1">
                                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{lead.platform}</span>
                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{getLocalizedLabel(LEAD_TYPES_MAP, lType)}</span>
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{getLocalizedLabel(VALUE_CATEGORY_MAP, vCat)}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2 italic">"{lead.context}"</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={() => setDeepAnalyzeLead(lead)} className="text-xs flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100"><Microscope size={14}/> {t.crm.deepAnalyze}</button>
                            <button onClick={() => onDelete(lead.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      <DeepAnalysisModal isOpen={!!deepAnalyzeLead} onClose={() => setDeepAnalyzeLead(null)} lead={deepAnalyzeLead} companyProfile={companyProfile || { name: '', products: '', advantages: '', policy: '' }} lang={lang} onSave={(id, res) => onUpdate(id, { deepAnalysis: res })} />
    </div>
  );
};
