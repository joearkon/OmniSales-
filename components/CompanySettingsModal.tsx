
import React, { useState } from 'react';
import { CompanyProfile, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { X, Save, BookOpen, Building2 } from 'lucide-react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  lang: Language;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({ isOpen, onClose, profile, onSave, lang }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'knowledge'>('basic');
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2 text-indigo-900">
            <Building2 className="text-indigo-600" size={24} />
            <div>
                <h3 className="text-lg font-bold">{t.settings.title}</h3>
                <p className="text-xs text-slate-500">{t.settings.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => setActiveTab('basic')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'basic' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                {t.settings.basicInfo}
            </button>
            <button 
                onClick={() => setActiveTab('knowledge')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${activeTab === 'knowledge' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                <BookOpen size={16} />
                {t.settings.knowledgeBase}
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
            {activeTab === 'basic' ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.name}</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Shenzhen X Factory"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.products}</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.products}
                            onChange={(e) => setFormData({...formData, products: e.target.value})}
                            placeholder="e.g. Vibrators, Lingerie, Lubricants"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.advantages}</label>
                        <textarea 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                            value={formData.advantages}
                            onChange={(e) => setFormData({...formData, advantages: e.target.value})}
                            placeholder="e.g. ISO 9001 certified, Low MOQ, 7-day R&D sample"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t.settings.policy}</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.policy}
                            onChange={(e) => setFormData({...formData, policy: e.target.value})}
                            placeholder="e.g. MOQ 100pcs, Free branding for orders > $1000"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 h-full flex flex-col">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800">
                        {t.settings.kbDesc}
                    </div>
                    <textarea 
                        className="w-full flex-grow p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono leading-relaxed"
                        value={formData.knowledgeBase || ''}
                        onChange={(e) => setFormData({...formData, knowledgeBase: e.target.value})}
                        placeholder={t.settings.kbPlaceholder}
                        style={{ minHeight: '300px' }}
                    />
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium">
            {t.settings.cancel}
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium">
            <Save size={16} />
            {t.settings.save}
          </button>
        </div>
      </div>
    </div>
  );
};
