
import React, { useState } from 'react';
import { CompanyProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Save, Building2, Package, Star, Briefcase, X } from 'lucide-react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  lang: Language;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({ isOpen, onClose, profile, onSave, lang }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [saved, setSaved] = useState(false);
  const t = TRANSLATIONS[lang].settings;

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
           <div className="flex items-center gap-2">
               <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                   <Building2 size={20} />
               </div>
               <h3 className="font-bold text-lg text-slate-800">{t.title}</h3>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
               <X size={20} />
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-slate-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-700">
                {t.desc}
            </p>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 size={14} className="text-slate-400"/> {t.name}
                </label>
                <input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. OmniFactory Ltd."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Package size={14} className="text-slate-400"/> {t.products}
                </label>
                <textarea 
                  name="products"
                  value={formData.products}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder={t.productsPlaceholder}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Star size={14} className="text-slate-400"/> {t.advantages}
                </label>
                <textarea 
                  name="advantages"
                  value={formData.advantages}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder={t.advantagesPlaceholder}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Briefcase size={14} className="text-slate-400"/> {t.policy}
                </label>
                <input 
                  name="policy"
                  value={formData.policy}
                  onChange={handleChange}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder={t.policyPlaceholder}
                />
            </div>

            <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                    Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all ${saved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {saved ? <Check size={16} /> : <Save size={16} />}
                    {saved ? t.saved : t.save}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

// Internal icon import needed since this is a new file
import { Check } from 'lucide-react';
