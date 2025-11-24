import React, { useState } from 'react';
import { Search, Filter, Rocket, Briefcase, Zap } from 'lucide-react';
import { searchLeads } from './services/geminiService';
import { Lead } from './types';
import { LeadCard } from './components/LeadCard';
import { LeadDetailModal } from './components/LeadDetailModal';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [targetType, setTargetType] = useState('Distributor');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setLeads([]); // Clear previous

    try {
      const results = await searchLeads(query, targetType);
      setLeads(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              OmniSales Intelligence
            </span>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Intimate Product Factory Sales Assistant
          </div>
        </div>
      </nav>

      {/* Hero / Search Section */}
      <div className="bg-white border-b border-slate-200 pb-12 pt-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Find High-Value OEM/ODM Partners
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Leverage AI to scout distributors, private label brands, and e-commerce sellers suitable for our factory capabilities.
          </p>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white shadow-xl shadow-indigo-100/50 rounded-2xl border border-slate-100">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="E.g., 'Silicone vibrator brands in Europe', 'Adult toy wholesalers USA'"
                  className="w-full pl-11 pr-4 py-4 bg-transparent outline-none text-slate-800 placeholder-slate-400"
                />
              </div>
              
              <div className="flex items-center gap-2 sm:border-l sm:border-slate-100 sm:pl-3">
                <Filter size={18} className="text-slate-400 hidden sm:block" />
                <select 
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="py-2 pl-2 pr-8 bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg text-sm text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Distributor">Distributors</option>
                  <option value="Brand">Private Label Brands</option>
                  <option value="B2B">General B2B</option>
                  <option value="B2C">E-commerce Stores</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center sm:w-auto w-full disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center"><span className="animate-spin mr-2">⟳</span> Scouting...</span>
                ) : (
                  <span className="flex items-center">Find Leads <Rocket size={18} className="ml-2" /></span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!hasSearched ? (
          // Empty State
          <div className="text-center py-20 opacity-60">
            <Briefcase className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-medium text-slate-600">Ready to hunt</h3>
            <p className="text-slate-500 mt-2">Enter your target keywords above to start generating leads.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                Found {leads.length} Potential Partners
              </h2>
              {leads.length > 0 && (
                <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                  AI Confidence: High
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
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No leads found. Try broadening your search terms (e.g., "Adult toys wholesaler" instead of a specific product).</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onAnalyze={setSelectedLead} 
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
        />
      )}
    </div>
  );
};

export default App;