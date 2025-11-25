
import React, { useState, useEffect } from 'react';
import { Zap, Languages, AlertTriangle } from 'lucide-react';
import { Language, CRMLead, MinedLead } from './types';
import { MarketAnalyzer } from './components/MarketAnalyzer';
import { CRMBoard } from './components/CRMBoard';
import { TRANSLATIONS, APP_VERSION } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'analysis' | 'crm'>('analysis');
  const [lang, setLang] = useState<Language>('zh'); // Default to Chinese
  const [hasApiKey, setHasApiKey] = useState(true);

  // Check for API Key on mount (supports various formats)
  useEffect(() => {
    const checkKey = () => {
        const viteKey = (import.meta as any).env?.VITE_API_KEY;
        const processKey = typeof process !== 'undefined' ? (process.env.API_KEY || process.env.VITE_API_KEY) : '';
        return !!(viteKey || processKey);
    };
    setHasApiKey(checkKey());
  }, []);

  // CRM State - Initialized from LocalStorage
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(() => {
    try {
      const saved = localStorage.getItem('crmLeads');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to load CRM leads from storage", e);
      return [];
    }
  });

  // Save to LocalStorage whenever crmLeads changes
  useEffect(() => {
    try {
      localStorage.setItem('crmLeads', JSON.stringify(crmLeads));
    } catch (e) {
      console.warn("Failed to save CRM leads to storage", e);
    }
  }, [crmLeads]);

  const t = TRANSLATIONS[lang];

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  // CRM Handlers
  const addToCRM = (minedLead: MinedLead) => {
    const newLead: CRMLead = {
      ...minedLead,
      id: `crm-${Date.now()}`,
      status: 'New',
      addedAt: new Date().toISOString(),
      notes: '',
      tags: [] // Initialize tags
    };
    setCrmLeads(prev => [newLead, ...prev]);
  };

  const updateCRMLead = (id: string, updates: Partial<CRMLead>) => {
    setCrmLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const deleteCRMLead = (id: string) => {
    setCrmLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleImportCRMLeads = (importedLeads: CRMLead[]) => {
      // Merge strategy: Prevent duplicates by ID or Account Name
      setCrmLeads(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const existingNames = new Set(prev.map(l => l.accountName));
          
          const uniqueImports = importedLeads.filter(l => {
              if (existingIds.has(l.id)) return false;
              // Optional: prevent duplicate account names too
              if (existingNames.has(l.accountName)) return false;
              return true;
          });
          
          return [...uniqueImports, ...prev];
      });
      alert(t.crm.importSuccess);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('analysis')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight">
                    {t.navTitle}
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono border border-indigo-100">
                    {APP_VERSION}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 hidden sm:block leading-tight">
                {t.navSubtitle}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setView('analysis')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'analysis' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t.nav.marketIntel}
                </button>
                <button 
                  onClick={() => setView('crm')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'crm' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t.nav.crm}
                </button>
             </div>

             <button 
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-sm font-medium transition-colors border border-transparent hover:border-slate-200"
             >
                <Languages size={16} />
                <span>{lang === 'en' ? '中文' : 'English'}</span>
             </button>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex gap-2 overflow-x-auto">
          <button 
            onClick={() => setView('analysis')}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium text-center whitespace-nowrap ${view === 'analysis' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
          >
            {t.nav.marketIntel}
          </button>
          <button 
            onClick={() => setView('crm')}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium text-center whitespace-nowrap ${view === 'crm' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
          >
            {t.nav.crm}
          </button>
      </div>

      {!hasApiKey && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-red-700">
                    <p className="font-bold mb-1">API Key is missing.</p>
                    <p>
                        If you are deploying on <strong>Vercel</strong>, please go to your Project Settings &gt; Environment Variables and set your key name to 
                        <code className="bg-red-100 px-1.5 py-0.5 rounded mx-1 font-mono font-bold text-red-800">VITE_API_KEY</code>.
                    </p>
                    <p className="mt-1 text-xs opacity-80">
                        Vercel does not expose standard keys to the browser for security reasons unless they are prefixed with VITE_.
                    </p>
                </div>
            </div>
        </div>
      )}

      {/* Main Content Area - Render both views but toggle visibility to persist state */}
      <div className={view === 'analysis' ? 'flex-grow py-10 block' : 'hidden'}>
           <MarketAnalyzer 
              lang={lang} 
              onAddToCRM={addToCRM} 
              crmLeads={crmLeads.map(l => l.accountName)} 
            />
      </div>

      <div className={view === 'crm' ? 'flex-grow py-10 block' : 'hidden'}>
           <CRMBoard 
              leads={crmLeads} 
              onUpdate={updateCRMLead} 
              onDelete={deleteCRMLead} 
              onImport={handleImportCRMLeads}
              lang={lang} 
           />
      </div>
    </div>
  );
};

export default App;
