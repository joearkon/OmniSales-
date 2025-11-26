
import React, { useRef, useState, useMemo } from 'react';
import { CRMLead, Language } from '../types';
import { CRM_STATUSES, TRANSLATIONS } from '../constants';
import { Trash2, Edit2, User, Factory, Smartphone, MessageSquare, Download, Upload, AlertCircle, Tag, Plus, X, Check, Search, PieChart, TrendingUp, Users, CheckSquare, Square, Copy, ArrowUpDown } from 'lucide-react';

interface CRMBoardProps {
  leads: CRMLead[];
  onUpdate: (id: string, updates: Partial<CRMLead>) => void;
  onDelete: (id: string) => void;
  onImport: (importedLeads: CRMLead[]) => void;
  lang: Language;
}

export const CRMBoard: React.FC<CRMBoardProps> = ({ leads, onUpdate, onDelete, onImport, lang }) => {
  const t = TRANSLATIONS[lang];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'dateDesc' | 'valueHigh' | 'outreach'>('dateDesc');
  
  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [bulkTagText, setBulkTagText] = useState('');

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Tagging State (Single Item)
  const [addingTagId, setAddingTagId] = useState<string | null>(null);
  const [newTagText, setNewTagText] = useState('');

  // --- Statistics ---
  const stats = useMemo(() => {
    const total = leads.length;
    const highValue = leads.filter(l => l.valueCategory === 'High Value User' || l.valueCategory === 'Potential Partner').length;
    const contacted = leads.filter(l => l.status !== 'New').length;
    const conversionRate = total > 0 ? Math.round((contacted / total) * 100) : 0;
    
    return { total, highValue, contacted, conversionRate };
  }, [leads]);

  // --- Filtering & Searching & Sorting ---
  const processedLeads = useMemo(() => {
    let result = leads.filter(l => {
        const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            l.accountName.toLowerCase().includes(searchLower) || 
            l.notes?.toLowerCase().includes(searchLower) ||
            l.context?.toLowerCase().includes(searchLower) ||
            l.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        return matchesStatus && matchesSearch;
    });

    // Sort Helpers
    const getValueRank = (v: string) => {
        if (v === 'High Value User') return 4;
        if (v === 'Potential Partner') return 3;
        if (v === 'Medium Value User') return 2;
        return 1;
    };
    const getOutreachRank = (s: string) => {
         if (s === 'Likely Uncontacted') return 3;
         if (s === 'Unknown') return 2;
         return 1;
    };
    const getDate = (l: CRMLead) => l.date ? new Date(l.date).getTime() : new Date(l.addedAt).getTime();

    result.sort((a, b) => {
        if (sortOption === 'dateDesc') {
            const dateA = getDate(a);
            const dateB = getDate(b);
            const diff = dateB - dateA; // Newest first
            if (diff !== 0) return diff;
            // Secondary sort: Value
            return getValueRank(b.valueCategory) - getValueRank(a.valueCategory);
        } else if (sortOption === 'valueHigh') {
            const valDiff = getValueRank(b.valueCategory) - getValueRank(a.valueCategory);
            if (valDiff !== 0) return valDiff;
            // Secondary sort: Date
            return getDate(b) - getDate(a);
        } else if (sortOption === 'outreach') {
            const outDiff = getOutreachRank(b.outreachStatus) - getOutreachRank(a.outreachStatus);
            if (outDiff !== 0) return outDiff;
            // Secondary sort: Value
            return getValueRank(b.valueCategory) - getValueRank(a.valueCategory);
        }
        return 0;
    });

    return result;
  }, [leads, statusFilter, searchTerm, sortOption]);

  // --- Handlers ---

  const handleStartEdit = (lead: CRMLead) => {
    setEditingId(lead.id);
    setEditNotes(lead.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, { notes: editNotes });
    setEditingId(null);
  };

  const handleAddTag = (id: string, tags: string[]) => {
      if (!newTagText.trim()) return;
      onUpdate(id, { tags: [...(tags || []), newTagText.trim()] });
      setNewTagText('');
      setAddingTagId(null);
  };

  const handleRemoveTag = (id: string, tags: string[], tagToRemove: string) => {
      onUpdate(id, { tags: tags.filter(t => t !== tagToRemove) });
  };

  // Bulk Handlers
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === processedLeads.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(processedLeads.map(l => l.id)));
      }
  };

  const handleBulkDelete = () => {
      if (!confirm(t.crm.deleteConfirm.replace('{count}', String(selectedIds.size)))) return;
      selectedIds.forEach(id => onDelete(id));
      setSelectedIds(new Set());
  };

  const handleBulkAddTag = () => {
      if (!bulkTagText.trim()) return;
      selectedIds.forEach(id => {
          const lead = leads.find(l => l.id === id);
          if (lead) {
              if (!lead.tags?.includes(bulkTagText.trim())) {
                  onUpdate(id, { tags: [...(lead.tags || []), bulkTagText.trim()] });
              }
          }
      });
      setBulkTagText('');
      setIsBulkTagging(false);
      setSelectedIds(new Set());
  };

  const handleCopyLeadInfo = (lead: CRMLead) => {
      const text = `Name: ${lead.accountName}\nPlatform: ${lead.platform}\nType: ${lead.valueCategory}\nLink/ID: ${lead.accountName.match(/\(ID: (.*?)\)/)?.[1] || 'N/A'}\nContext: ${lead.context}`;
      navigator.clipboard.writeText(text);
      alert(t.crm.copySuccess);
  };

  const downloadFile = (content: string, filename: string, type: 'csv' | 'json') => {
    const bom = type === 'csv' ? '\uFEFF' : ''; 
    const blob = new Blob([bom + content], { type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(leads, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(json, `CRM_Backup_${date}.json`, 'json');
  };

  const handleExportCSV = () => {
    const headers = t.crm.csvHeaders;
    const escape = (str: string) => {
        const s = String(str || '');
        if (s.search(/("|,|\n)/g) >= 0) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    
    const rows = leads.map(l => [
        l.id, l.accountName, l.platform, l.leadType, l.valueCategory, 
        l.status, l.notes, (l.tags || []).join(';'), l.context, l.addedAt
    ].map(escape).join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `CRM_Export_${date}.csv`, 'csv');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const content = evt.target?.result as string;
            if (file.name.endsWith('.json')) {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    onImport(data);
                } else {
                    setImportError(t.errors.invalidJson);
                }
            } else if (file.name.endsWith('.csv')) {
                 const lines = content.split('\n').filter(l => l.trim());
                 if (lines.length < 2) throw new Error("Empty CSV");
                 
                 const newLeads: CRMLead[] = [];
                 for(let i=1; i<lines.length; i++) {
                     const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                     const clean = (s: string) => s?.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
                     
                     if (row.length >= 2) { 
                        newLeads.push({
                            id: clean(row[0]) || `imported-${Date.now()}-${i}`,
                            accountName: clean(row[1]) || 'Unknown',
                            platform: clean(row[2]) || 'Imported',
                            leadType: (clean(row[3]) as any) || 'User',
                            valueCategory: (clean(row[4]) as any) || 'Low Value User',
                            status: (clean(row[5]) as any) || 'New',
                            notes: clean(row[6]) || '',
                            tags: clean(row[7]) ? clean(row[7]).split(';') : [],
                            context: clean(row[8]) || '',
                            addedAt: clean(row[9]) || new Date().toISOString(),
                            reason: '',
                            suggestedAction: '',
                            outreachStatus: 'Unknown'
                        });
                     }
                 }
                 onImport(newLeads);
            } else {
                setImportError(t.errors.unsupportedFile);
            }
        } catch (err) {
            console.error(err);
            setImportError(t.crm.importError);
        } finally {
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      
      {/* 1. Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><Users size={12}/> {t.crm.stats.total}</span>
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> {t.crm.stats.highPotential}</span>
            <span className="text-2xl font-bold text-indigo-600">{stats.highValue}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><MessageSquare size={12}/> {t.crm.stats.contacted}</span>
            <span className="text-2xl font-bold text-green-600">{stats.contacted}</span>
         </div>
         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <span className="text-xs text-slate-500 font-semibold uppercase mb-1 flex items-center gap-1"><PieChart size={12}/> {t.crm.stats.rate}</span>
            <span className="text-2xl font-bold text-slate-900">{stats.conversionRate}%</span>
         </div>
      </div>

      {/* 2. Header & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-slate-900">{t.crm.title}</h2>
            <p className="text-xs text-slate-500 mt-1">{t.crm.subtitle}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder={t.crm.searchPlaceholder} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            {/* Sort & Import/Export */}
            <div className="flex gap-2">
                {/* Sort */}
                <div className="relative group">
                    <button className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium">
                        <ArrowUpDown size={16} /> 
                        <span className="hidden sm:inline">{t.crm.sorting.sortBy}</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg hidden group-hover:block z-20 p-1">
                        <button onClick={() => setSortOption('dateDesc')} className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-slate-50 ${sortOption === 'dateDesc' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>{t.crm.sorting.dateDesc}</button>
                        <button onClick={() => setSortOption('valueHigh')} className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-slate-50 ${sortOption === 'valueHigh' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>{t.crm.sorting.valueHigh}</button>
                        <button onClick={() => setSortOption('outreach')} className={`w-full text-left px-3 py-2 text-xs rounded hover:bg-slate-50 ${sortOption === 'outreach' ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>{t.crm.sorting.outreach}</button>
                    </div>
                </div>

                <input type="file" ref={importInputRef} onChange={handleImportFile} accept=".json,.csv" className="hidden" />
                <button onClick={() => importInputRef.current?.click()} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors" title={t.crm.import}>
                    <Upload size={18} />
                </button>
                <button onClick={handleExportCSV} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-colors" title={t.crm.exportCSV}>
                    <Download size={18} />
                </button>
            </div>
        </div>
      </div>

      {importError && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center border border-red-100">
              <AlertCircle size={16} className="mr-2"/> {importError}
          </div>
      )}

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', ...Object.keys(CRM_STATUSES)].map(status => (
             <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${
                   statusFilter === status 
                   ? 'bg-slate-800 text-white border-slate-800' 
                   : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
               }`}
             >
               {status === 'All' ? 'All' : (t.crm.statuses[status.toLowerCase() as keyof typeof t.crm.statuses] || status)}
               <span className={`ml-2 text-xs opacity-70 ${statusFilter === status ? 'text-white' : 'text-slate-400'}`}>
                   {status === 'All' ? leads.length : leads.filter(l => l.status === status).length}
               </span>
             </button>
          ))}
      </div>

      {/* 4. Bulk Actions Bar */}
      {selectedIds.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-sm text-indigo-900 font-medium">
                  <CheckSquare size={16} />
                  {selectedIds.size} {t.crm.bulk.selected}
              </div>
              <div className="flex items-center gap-2">
                  {isBulkTagging ? (
                      <div className="flex items-center gap-1">
                          <input 
                              type="text" 
                              value={bulkTagText} 
                              onChange={(e) => setBulkTagText(e.target.value)}
                              placeholder={t.crm.bulk.placeholder}
                              className="text-sm px-2 py-1 rounded border border-indigo-200 w-32 focus:outline-none"
                              autoFocus
                          />
                          <button onClick={handleBulkAddTag} className="bg-indigo-600 text-white p-1 rounded hover:bg-indigo-700"><Check size={14}/></button>
                          <button onClick={() => setIsBulkTagging(false)} className="bg-white text-slate-500 p-1 rounded hover:bg-slate-100 border border-slate-200"><X size={14}/></button>
                      </div>
                  ) : (
                      <button 
                        onClick={() => setIsBulkTagging(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 rounded text-xs font-bold hover:bg-indigo-50"
                      >
                          <Tag size={14} /> {t.crm.bulk.addTag}
                      </button>
                  )}
                  
                  <button 
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 shadow-sm"
                  >
                      <Trash2 size={14} /> {t.crm.bulk.delete}
                  </button>
              </div>
          </div>
      )}

      {/* 5. Lead List */}
      {processedLeads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
           <User size={48} className="mx-auto text-slate-300 mb-4" />
           <p className="text-slate-500">{t.crm.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center px-2">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                    {selectedIds.size === processedLeads.length && processedLeads.length > 0 ? <CheckSquare size={16} className="text-indigo-600"/> : <Square size={16}/>}
                    {t.common.selectAll}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
            {processedLeads.map(lead => {
                const statusConfig = CRM_STATUSES[lead.status];
                const isSelected = selectedIds.has(lead.id);

                return (
                <div key={lead.id} className={`bg-white border rounded-xl p-5 shadow-sm transition-all group ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-200'}`}>
                    <div className="flex gap-4">
                        {/* Checkbox */}
                        <div className="pt-1">
                            <button onClick={() => toggleSelection(lead.id)}>
                                {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} className="text-slate-300 hover:text-slate-400" />}
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    {lead.leadType === 'Factory' ? <Factory size={18} className="text-blue-600"/> : 
                                    lead.leadType === 'KOL' ? <Smartphone size={18} className="text-rose-600"/> :
                                    <User size={18} className="text-green-600"/>}
                                    
                                    <span className="font-bold text-lg text-slate-900">{lead.accountName}</span>
                                    
                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">{lead.platform}</span>
                                    
                                    <button onClick={() => handleCopyLeadInfo(lead)} className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" title={t.common.copyInfo}>
                                        <Copy size={14} />
                                    </button>
                                </div>
                                <p className="text-sm text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-100 italic">"{lead.context}"</p>
                                
                                {/* Tags */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                    {(lead.tags || []).map(tag => (
                                        <span key={tag} className="bg-white text-indigo-700 text-xs px-2 py-1 rounded-full border border-indigo-100 flex items-center gap-1 shadow-sm">
                                            <Tag size={10} /> {tag}
                                            <button onClick={() => handleRemoveTag(lead.id, lead.tags, tag)} className="hover:text-red-500"><X size={10} /></button>
                                        </span>
                                    ))}
                                    
                                    {addingTagId === lead.id ? (
                                        <div className="flex items-center gap-1 animate-in fade-in">
                                            <input 
                                                type="text" 
                                                autoFocus
                                                className="text-xs border border-indigo-300 rounded px-1 py-0.5 w-24 outline-none ring-1 ring-indigo-200" 
                                                value={newTagText}
                                                onChange={e => setNewTagText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddTag(lead.id, lead.tags)}
                                                placeholder={t.crm.bulk.placeholder}
                                            />
                                            <button onClick={() => handleAddTag(lead.id, lead.tags)} className="text-green-600 hover:text-green-800"><Check size={14}/></button>
                                            <button onClick={() => setAddingTagId(null)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setAddingTagId(lead.id)}
                                            className="text-xs text-slate-400 hover:text-indigo-600 border border-dashed border-slate-300 rounded px-2 py-0.5 flex items-center gap-1 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                        >
                                            <Plus size={10} /> {t.crm.addTag}
                                        </button>
                                    )}
                                </div>

                                {/* Notes */}
                                {editingId === lead.id ? (
                                <div className="mt-2 animate-in fade-in">
                                    <textarea 
                                    value={editNotes}
                                    onChange={(e) => setEditNotes(e.target.value)}
                                    className="w-full p-2 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder={t.crm.notes}
                                    rows={3}
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => handleSaveEdit(lead.id)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 font-medium">{t.crm.save}</button>
                                    </div>
                                </div>
                                ) : (
                                <div className="text-sm text-slate-700 cursor-pointer group/note" onClick={() => handleStartEdit(lead)}>
                                    <div className="flex items-center gap-2 mb-1 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <MessageSquare size={10} /> {t.crm.notes} <Edit2 size={10} className="opacity-0 group-hover/note:opacity-100 text-indigo-500"/>
                                    </div>
                                    <div className="pl-2 border-l-2 border-slate-200 group-hover/note:border-indigo-300 transition-colors">
                                        {lead.notes ? lead.notes : <span className="italic text-slate-400">{t.crm.emptyNote}</span>}
                                    </div>
                                </div>
                                )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex flex-col gap-3 min-w-[150px] border-l border-slate-100 pl-4 md:pl-0 md:border-l-0">
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-semibold uppercase mb-1">{t.crm.status}</span>
                                    <select 
                                    value={lead.status}
                                    onChange={(e) => onUpdate(lead.id, { status: e.target.value as any })}
                                    className={`text-sm font-bold px-3 py-2 rounded-lg border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 cursor-pointer ${statusConfig.color}`}
                                    >
                                        {Object.keys(CRM_STATUSES).map(s => (
                                            <option key={s} value={s}>{t.crm.statuses[s.toLowerCase() as keyof typeof t.crm.statuses] || s}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="mt-auto flex justify-end">
                                    <button 
                                        onClick={() => onDelete(lead.id)}
                                        className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        title={t.crm.delete}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        </div>
      )}
    </div>
  );
};
