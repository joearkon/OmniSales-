
import React, { useState } from 'react';
import { CRMLead, Language } from '../types';
import { CRM_STATUSES, TRANSLATIONS } from '../constants';
import { Trash2, Edit2, Check, User, Factory, Smartphone, MessageSquare } from 'lucide-react';

interface CRMBoardProps {
  leads: CRMLead[];
  onUpdate: (id: string, updates: Partial<CRMLead>) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

export const CRMBoard: React.FC<CRMBoardProps> = ({ leads, onUpdate, onDelete, lang }) => {
  const t = TRANSLATIONS[lang];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const handleStartEdit = (lead: CRMLead) => {
    setEditingId(lead.id);
    setEditNotes(lead.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdate(id, { notes: editNotes });
    setEditingId(null);
  };

  const filteredLeads = statusFilter === 'All' 
    ? leads 
    : leads.filter(l => l.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">{t.crm.title}</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <button 
            onClick={() => setStatusFilter('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === 'All' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          >
            All ({leads.length})
          </button>
          {Object.keys(CRM_STATUSES).map(status => (
             <button
               key={status}
               onClick={() => setStatusFilter(status)}
               className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
             >
               {t.crm[status.toLowerCase() as keyof typeof t.crm] || status}
             </button>
          ))}
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
           <User size={48} className="mx-auto text-slate-300 mb-4" />
           <p className="text-slate-500">{t.crm.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
           {filteredLeads.map(lead => {
             const statusConfig = CRM_STATUSES[lead.status];
             return (
               <div key={lead.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                     <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2">
                           {lead.leadType === 'Factory' ? <Factory size={18} className="text-blue-600"/> : 
                            lead.leadType === 'KOL' ? <Smartphone size={18} className="text-rose-600"/> :
                            <User size={18} className="text-green-600"/>}
                           <span className="font-bold text-lg text-slate-900">{lead.accountName}</span>
                           <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{lead.platform}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{lead.context}</p>
                        
                        {editingId === lead.id ? (
                          <div className="mt-2">
                            <textarea 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                              placeholder={t.crm.notes}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => handleSaveEdit(lead.id)} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">{t.crm.save}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleStartEdit(lead)}>
                            <div className="flex items-center gap-2 mb-1 text-slate-500 text-xs font-semibold uppercase">
                               <MessageSquare size={12} /> {t.crm.notes} <Edit2 size={10} className="opacity-0 group-hover:opacity-100"/>
                            </div>
                            {lead.notes || <span className="italic text-slate-400">Click to add notes...</span>}
                          </div>
                        )}
                     </div>

                     <div className="flex flex-col gap-3 min-w-[160px]">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-500 mb-1">{t.crm.status}</span>
                            <select 
                              value={lead.status}
                              onChange={(e) => onUpdate(lead.id, { status: e.target.value as any })}
                              className={`text-sm font-medium px-3 py-2 rounded-lg border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 ${statusConfig.color}`}
                            >
                                {Object.keys(CRM_STATUSES).map(s => (
                                    <option key={s} value={s}>{t.crm[s.toLowerCase() as keyof typeof t.crm] || s}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mt-auto flex justify-end">
                            <button 
                                onClick={() => onDelete(lead.id)}
                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                title={t.crm.delete}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
};
