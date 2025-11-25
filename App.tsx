
import React, { useState } from 'react';
import { Search, Filter, Rocket, Briefcase, Zap, Languages, AlertTriangle, FileText, PieChart, TrendingUp, BarChart } from 'lucide-react';
import { searchLeads } from './services/geminiService';
import { Lead, Language } from './types';
import { LeadCard } from './components/LeadCard';
import { LeadDetailModal } from './components/LeadDetailModal';
import { MarketAnalyzer } from './components/MarketAnalyzer';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<'search' | 'analysis'>('search');
  const [query, setQuery] = useState('');
  const [targetType, setTargetType] = useState('Distributor');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lang, setLang] = useState<Language>('zh');
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setLeads([]); 
    setError(null);

    try {
      const results = await searchLeads(query, targetType, lang);
      setLeads(results);
    } catch (error: any) {
      console.error("Search failed", error);
      setError(error.message || "An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('search')}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight">
                {t.navTitle}
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:block leading-tight">
                {t.navSubtitle}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setView('search')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'search' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t.nav.leadScout}
                </button>
                <button 
                  onClick={() => setView('analysis')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'analysis' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {t.nav.marketIntel}
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
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 flex gap-2">
          <button 
            onClick={() => setView('search')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium text-center ${view === 'search' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
          >
            {t.nav.leadScout}
          </button>
          <button 
            onClick={() => setView('analysis')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium text-center ${view === 'analysis' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'}`}
          >
            {t.nav.marketIntel}
          </button>
      </div>

      {view === 'analysis' ? (
        <div className="flex-grow py-10">
           <MarketAnalyzer lang={lang} />
        </div>
      ) : (
        <>
          {/* Hero / Search Section */}
          <div className="bg-white border-b border-slate-200 pb-12 pt-10 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                {t.heroTitle}
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
                {t.heroSubtitle}
              </p>

              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white shadow-xl shadow-indigo-100/50 rounded-2xl border border-slate-100">
                  <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-11 pr-4 py-4 bg-transparent outline-none text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 sm:border-l sm:border-slate-100 sm:pl-3">
                    <Filter size={18} className="text-slate-400 hidden sm:block" />
                    <select 
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value)}
                      className="py-2 pl-2 pr-8 bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg text-sm text-slate-700 outline-none cursor-pointer w-full sm:w-auto"
                    >
                      <option value="Distributor">{t.targetType.distributor}</option>
                      <option value="Brand">{t.targetType.brand}</option>
                      <option value="Exhibition">{t.targetType.exhibition}</option>
                      <option value="Social">{t.targetType.social}</option>
                      <option value="B2B">{t.targetType.b2b}</option>
                      <option value="B2C">{t.targetType.b2c}</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center sm:w-auto w-full disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                  >
                    {loading ? (
                      <span className="flex items-center"><span className="animate-spin mr-2">⟳</span> {t.scouting}</span>
                    ) : (
                      <span className="flex items-center whitespace-nowrap">{t.searchButton} <Rocket size={18} className="ml-2" /></span>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-4 text-xs text-slate-400">
                 Powered by Google Search Grounding • Public Business Data Only
              </div>
            </div>
          </div>

          {/* Results Section */}
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
            {error ? (
              <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-bold text-red-800 mb-2">Search Error</h3>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-xs mt-4">Please check your API Key configuration or network connection.</p>
              </div>
            ) : !hasSearched ? (
              // Empty State
              <div className="text-center py-20 opacity-60">
                <Briefcase className="mx-auto text-slate-300 mb-4" size={64} />
                <h3 className="text-xl font-medium text-slate-600">{t.readyToHunt}</h3>
                <p className="text-slate-500 mt-2">{t.readyToHuntDesc}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                  <h2 className="text-xl font-bold text-slate-800">
                    {t.found} {leads.length} {t.partners}
                  </h2>
                  {leads.length > 0 && (
                    <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                      {t.confidence}
                    </span>
                  )}
                </div>

                {loading ? (
                  // Loading Skeleton
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white h-64 rounded-xl shadow-sm border border-slate-100 animate-pulse p-5">
                        <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-5/6 mb-6"></div>
                        <div className="h-10 bg-slate-200 rounded w-full mt-auto"></div>
                      </div>
                    ))}
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
                    <p className="text-slate-500">{t.noLeads}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                    {leads.map((lead) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead} 
                        onAnalyze={setSelectedLead} 
                        lang={lang}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>

          {/* Modals */}
          {selectedLead && (
            <LeadDetailModal 
              lead={selectedLead} 
              onClose={() => setSelectedLead(null)} 
              lang={lang}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
