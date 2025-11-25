
import React, { useState, useRef, useMemo } from 'react';
import { ANALYSIS_MODES, TRANSLATIONS } from '../constants';
import { AnalysisMode, Language, AnalysisResult, MinedLead, StrategicOutreachResult } from '../types';
import { analyzeMarketData, generateStrategicOutreach } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle, Upload, Image as ImageIcon, X, Target, Download, FileText as FileIcon, ChevronDown, ChevronUp, Copy, UserPlus, Check, User, Factory, Smartphone } from 'lucide-react';

interface MarketAnalyzerProps {
  lang: Language;
  onAddToCRM: (lead: MinedLead) => void;
  crmLeads: string[]; // List of account names already in CRM to show "Added" state
}

export const MarketAnalyzer: React.FC<MarketAnalyzerProps> = ({ lang, onAddToCRM, crmLeads }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('Classification');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for expanded strategies in LeadMining mode
  const [expandedLeads, setExpandedLeads] = useState<Record<number, boolean>>({});
  const [strategies, setStrategies] = useState<Record<number, StrategicOutreachResult>>({});
  const [strategyLoading, setStrategyLoading] = useState<Record<number, boolean>>({});

  const t = TRANSLATIONS[lang];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImages(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!text.trim() && images.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setStrategies({});
    setExpandedLeads({});

    try {
      const data = await analyzeMarketData(text, images, mode, lang);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStrategy = async (lead: MinedLead, index: number) => {
    if (strategies[index]) {
      setExpandedLeads(prev => ({ ...prev, [index]: !prev[index] }));
      return;
    }

    setStrategyLoading(prev => ({ ...prev, [index]: true }));
    try {
      const strategy = await generateStrategicOutreach(lead, lang);
      setStrategies(prev => ({ ...prev, [index]: strategy }));
      setExpandedLeads(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setStrategyLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const downloadFile = (content: string, filename: string, type: 'csv' | 'txt') => {
    const bom = type === 'csv' ? '\uFEFF' : ''; // Add BOM for Excel UTF-8 support
    const blob = new Blob([bom + content], { type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
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

  const generateCSV = (res: AnalysisResult): string => {
    let headers: string[] = [];
    let rows: string[][] = [];

    const escape = (str: string) => {
      const s = String(str || '');
      if (s.search(/("|,|\n)/g) >= 0) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    switch (res.mode) {
      case 'LeadMining':
        headers = ['Platform', 'Account Name', 'Type', 'Value Category', 'Reason', 'Suggested Action', 'Context'];
        rows = res.data.leads.map(l => [l.platform, l.accountName, l.leadType, l.valueCategory, l.reason, l.suggestedAction, l.context]);
        break;
      case 'Identity':
        headers = ['Platform', 'Name', 'Identity', 'Description'];
        rows = res.data.map(i => [i.platform, i.name, i.identity, i.description]);
        break;
      case 'Classification':
        headers = ['Platform', 'Account Name', 'Type', 'Core Business', 'Features', 'Contact Clues'];
        rows = res.data.map(i => [i.platform, i.accountName, i.type, i.coreBusiness, i.features, i.contactClues]);
        break;
      case 'Competitors':
        headers = ['Brand', 'Pros', 'Cons', 'Target Audience'];
        rows = res.data.competitors.map(c => [c.brand, c.pros, c.cons, c.targetAudience]);
        break;
      case 'Needs':
        headers = ['Category', 'Item', 'Detail/Percentage'];
        res.data.coreNeeds.forEach(i => rows.push(['Core Need', i.need, i.example]));
        res.data.painPoints.forEach(i => rows.push(['Pain Point', i.point, i.example]));
        res.data.preferences.forEach(i => rows.push(['Preference', i.preference, i.example]));
        break;
      case 'Comments':
        headers = ['Category', 'Content'];
        res.data.userPersonas.forEach(p => rows.push(['User Persona', `${p.profile} - ${p.characteristics}`]));
        res.data.commonQuestions.forEach(q => rows.push(['Question', q]));
        res.data.purchaseMotivations.forEach(m => rows.push(['Motivation', m]));
        res.data.concerns.forEach(c => rows.push(['Concern', c]));
        break;
      case 'Sentiment':
        headers = ['Metric', 'Value'];
        rows.push(['Positive Sentiment', `${res.data.sentimentBreakdown.positive}%`]);
        rows.push(['Neutral Sentiment', `${res.data.sentimentBreakdown.neutral}%`]);
        rows.push(['Negative Sentiment', `${res.data.sentimentBreakdown.negative}%`]);
        res.data.topKeywords.forEach(k => rows.push(['Keyword', `${k.keyword} (${k.count})`]));
        break;
    }

    return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  };

  const generateTextReport = (res: AnalysisResult): string => {
    let lines: string[] = [];
    lines.push(`MARKET INTELLIGENCE REPORT - ${res.mode.toUpperCase()}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('----------------------------------------\n');

    switch (res.mode) {
      case 'LeadMining':
        res.data.leads.forEach((l, i) => {
           lines.push(`LEAD #${i+1}: ${l.accountName} (${l.platform})`);
           lines.push(`Type: ${l.leadType} | Category: ${l.valueCategory}`);
           lines.push(`Reason: ${l.reason}`);
           lines.push(`Action: ${l.suggestedAction}`);
           lines.push(`Context: ${l.context}\n`);
        });
        break;
      case 'Identity':
        res.data.forEach(i => {
            lines.push(`[${i.identity}] ${i.name} (${i.platform}): ${i.description}`);
        });
        break;
      case 'Needs':
        lines.push('CORE NEEDS:');
        res.data.coreNeeds.forEach(i => lines.push(`- ${i.need}: ${i.example}`));
        lines.push('\nPAIN POINTS:');
        res.data.painPoints.forEach(i => lines.push(`- ${i.point}: ${i.example}`));
        lines.push('\nPREFERENCES:');
        res.data.preferences.forEach(i => lines.push(`- ${i.preference}: ${i.example}`));
        break;
      default:
        lines.push(JSON.stringify(res.data, null, 2));
    }
    return lines.join('\n');
  };

  const handleExport = (type: 'csv' | 'txt') => {
    if (!result) return;
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Analysis_${result.mode}_${timestamp}.${type}`;
    
    if (type === 'csv') {
        downloadFile(generateCSV(result), filename, 'csv');
    } else {
        downloadFile(generateTextReport(result), filename, 'txt');
    }
  };

  // Sort Leads by Value
  const sortedLeads = useMemo(() => {
    if (!result || result.mode !== 'LeadMining') return [];
    
    const priority = {
        'High Value User': 0,
        'Potential Partner': 1,
        'Medium Value User': 2,
        'Low Value User': 3
    };

    return [...result.data.leads].sort((a, b) => {
        return (priority[a.valueCategory] ?? 4) - (priority[b.valueCategory] ?? 4);
    });
  }, [result]);

  const renderResults = () => {
    if (!result) return null;

    const r = t.analysis.results;

    const exportButtons = (
        <div className="flex gap-2 mb-4 justify-end">
            <button 
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
            >
                <Download size={14} />
                {t.analysis.exportCSV}
            </button>
            <button 
                onClick={() => handleExport('txt')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
            >
                <FileIcon size={14} />
                {t.analysis.exportTxt}
            </button>
        </div>
    );

    switch (result.mode) {
      case 'LeadMining': // Value Assessment
        return (
          <>
          {exportButtons}
          <div className="grid grid-cols-1 gap-4">
            {sortedLeads.map((lead, idx) => {
              const strat = strategies[idx];
              const isExpanded = expandedLeads[idx];
              const isLoadingStrat = strategyLoading[idx];
              const isAdded = crmLeads.includes(lead.accountName);

              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                     <div className={`p-3 rounded-full shrink-0 ${
                       lead.valueCategory === 'High Value User' ? 'bg-red-100 text-red-600' :
                       lead.valueCategory === 'Potential Partner' ? 'bg-blue-100 text-blue-600' :
                       lead.valueCategory === 'Medium Value User' ? 'bg-orange-100 text-orange-600' :
                       'bg-slate-100 text-slate-600'
                     }`}>
                       <Target size={24} />
                     </div>
          
                     <div className="flex-grow w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                           <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-slate-900 text-lg">
                                    {lead.accountName} 
                                  </h4>
                                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{lead.platform}</span>
                                  
                                  {/* Lead Type Badge */}
                                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                      lead.leadType === 'Factory' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      lead.leadType === 'KOL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-green-50 text-green-700 border-green-200'
                                  }`}>
                                      {lead.leadType === 'Factory' ? <Factory size={10} /> : lead.leadType === 'KOL' ? <Smartphone size={10} /> : <User size={10} />}
                                      {lead.leadType}
                                  </span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1 line-clamp-2 italic">"{lead.context}"</p>
                           </div>
                           
                           <div className="flex gap-2 items-center">
                               <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                                  lead.valueCategory === 'High Value User' ? 'bg-red-50 text-red-700 border border-red-100' :
                                  lead.valueCategory === 'Potential Partner' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                  lead.valueCategory === 'Medium Value User' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                  'bg-slate-50 text-slate-700 border border-slate-100'
                               }`}>
                                  {lead.valueCategory}
                               </span>
                               
                               {/* Add to CRM Button */}
                               <button 
                                 onClick={() => !isAdded && onAddToCRM(lead)}
                                 disabled={isAdded}
                                 className={`p-1.5 rounded-lg border transition-colors ${
                                     isAdded 
                                     ? 'bg-green-100 border-green-200 text-green-700 cursor-default' 
                                     : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300'
                                 }`}
                                 title={isAdded ? t.crm.added : t.analysis.results.addToCRM}
                               >
                                   {isAdded ? <Check size={16} /> : <UserPlus size={16} />}
                               </button>
                           </div>
                        </div>
          
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 text-sm w-full">
                            <div className="bg-slate-50 px-3 py-2 rounded border border-slate-100 text-slate-700 flex-1">
                               <span className="font-semibold text-slate-500 mr-1 block sm:inline">{r.reason}:</span> 
                               "{lead.reason}"
                            </div>
                            <div className="bg-indigo-50 px-3 py-2 rounded border border-indigo-100 text-indigo-700 flex-[2]">
                               <span className="font-semibold text-indigo-500 mr-1 block sm:inline">{r.action}:</span> 
                               {lead.suggestedAction}
                            </div>
                        </div>

                        {/* Strategy Button */}
                        <div className="mt-4 border-t border-slate-100 pt-3 flex justify-end">
                           <button 
                             onClick={() => handleGenerateStrategy(lead, idx)}
                             disabled={isLoadingStrat}
                             className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors"
                           >
                              {isLoadingStrat ? (
                                <><Loader2 size={14} className="animate-spin mr-2" /> {r.strategyLoading}</>
                              ) : (
                                <>{isExpanded ? <ChevronUp size={16} className="mr-1"/> : <Sparkles size={16} className="mr-1"/>} {isExpanded ? 'Hide' : ''} {r.genStrategy}</>
                              )}
                           </button>
                        </div>

                        {/* Expanded Strategy Panel */}
                        {isExpanded && strat && (
                            <div className="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                {/* Diagnosis Section (Only for Users) */}
                                {strat.diagnosis && (
                                    <div className="mb-4 bg-white p-3 rounded border border-blue-100">
                                        <h5 className="font-bold text-blue-800 text-sm mb-2 flex items-center">
                                            <Target size={14} className="mr-1"/> {r.diagnosis}: <span className="text-slate-800 ml-1 font-normal">{strat.diagnosis.problemType}</span>
                                        </h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="font-semibold text-slate-500 block mb-1">{r.advice}:</span>
                                                <ul className="list-disc list-inside text-slate-700">
                                                    {strat.diagnosis.advice.map((ad, i) => <li key={i}>{ad}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-500 block mb-1">{r.recommendation}:</span>
                                                <span className="text-slate-700 bg-blue-50 px-2 py-1 rounded inline-block">{strat.diagnosis.recommendedProduct}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Scripts Section */}
                                <h5 className="font-bold text-slate-800 text-sm mb-2">{r.scripts}</h5>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-green-600 uppercase tracking-wide">{r.friendly}</span>
                                            <button onClick={() => navigator.clipboard.writeText(strat.scripts.friendly)} className="text-slate-400 hover:text-slate-600"><Copy size={12}/></button>
                                        </div>
                                        <p className="text-sm text-slate-700">{strat.scripts.friendly}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">{r.professional}</span>
                                            <button onClick={() => navigator.clipboard.writeText(strat.scripts.professional)} className="text-slate-400 hover:text-slate-600"><Copy size={12}/></button>
                                        </div>
                                        <p className="text-sm text-slate-700">{strat.scripts.professional}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">{r.concise}</span>
                                            <button onClick={() => navigator.clipboard.writeText(strat.scripts.concise)} className="text-slate-400 hover:text-slate-600"><Copy size={12}/></button>
                                        </div>
                                        <p className="text-sm text-slate-700">{strat.scripts.concise}</p>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                                    <span className="font-semibold">{r.privateDomain}:</span> {strat.privateDomainTip}
                                </div>
                            </div>
                        )}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        );

      case 'Identity':
        return (
          <>
          {exportButtons}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.platform}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.account}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.identity}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.desc}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {result.data.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{item.platform}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.identity === 'User' ? 'bg-green-100 text-green-800' : 
                            item.identity === 'Brand' ? 'bg-orange-100 text-orange-800' : 
                            item.identity === 'Factory' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                            {item.identity}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        );

      case 'Classification':
        return (
          <>
          {exportButtons}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.platform}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.account}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.type}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.business}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.features}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{r.contact}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {result.data.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{item.platform}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{item.accountName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.type === 'Brand' ? 'bg-orange-100 text-orange-800' : 
                            item.type === 'Factory' ? 'bg-blue-100 text-blue-800' : 
                            item.type === 'KOL' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                            {item.type}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate" title={item.coreBusiness}>{item.coreBusiness}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate" title={item.features}>{item.features}</td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">{item.contactClues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        );

      case 'Needs':
        return (
            <>
            {exportButtons}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                    <h3 className="text-indigo-800 font-bold mb-3 flex items-center">{r.coreNeeds}</h3>
                    <div className="space-y-3">
                        {result.data.coreNeeds.map((item, i) => (
                            <div key={i} className="bg-white p-3 rounded shadow-sm">
                                <div className="font-medium text-slate-800">{item.need}</div>
                                <div className="text-xs text-slate-500 mt-1 italic">{item.example}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
                    <h3 className="text-rose-800 font-bold mb-3 flex items-center">{r.painPoints}</h3>
                    <div className="space-y-3">
                        {result.data.painPoints.map((item, i) => (
                            <div key={i} className="bg-white p-3 rounded shadow-sm">
                                <div className="font-medium text-slate-800">{item.point}</div>
                                <div className="text-xs text-slate-500 mt-1 italic">{item.example}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                    <h3 className="text-green-800 font-bold mb-3 flex items-center">{r.preferences}</h3>
                    <div className="space-y-3">
                        {result.data.preferences.map((item, i) => (
                            <div key={i} className="bg-white p-3 rounded shadow-sm">
                                <div className="font-medium text-slate-800">{item.preference}</div>
                                <div className="text-xs text-slate-500 mt-1 italic">{item.example}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </>
        );

      case 'Competitors':
        return (
            <>
            {exportButtons}
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{r.competitor}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.data.competitors.map((comp, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-lg text-slate-900 mb-2">{comp.brand}</h4>
                                <div className="text-sm mb-2"><span className="font-semibold text-green-600">{r.pros}:</span> {comp.pros}</div>
                                <div className="text-sm mb-2"><span className="font-semibold text-red-600">{r.cons}:</span> {comp.cons}</div>
                                <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded mt-3">
                                    <span className="font-semibold">{r.target}:</span> {comp.targetAudience}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{r.trends}</h3>
                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-100">
                         <ul className="space-y-2">
                            {result.data.trends.map((trend, i) => (
                                <li key={i} className="flex items-start">
                                    <span className="mr-2 text-purple-600 font-bold">•</span>
                                    <span className="text-slate-700 font-medium">{trend.trend} <span className="text-sm text-slate-500 font-normal">- {trend.evidence}</span></span>
                                </li>
                            ))}
                         </ul>
                    </div>
                </div>
            </div>
            </>
        );

      case 'Sentiment':
         const { sentimentBreakdown, topKeywords, examples } = result.data;
         return (
             <>
             {exportButtons}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 mb-6">{r.sentiment}</h3>
                     <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-green-700">Positive</span>
                                <span className="font-bold">{sentimentBreakdown.positive}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${sentimentBreakdown.positive}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-600">Neutral</span>
                                <span className="font-bold">{sentimentBreakdown.neutral}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: `${sentimentBreakdown.neutral}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-red-700">Negative</span>
                                <span className="font-bold">{sentimentBreakdown.negative}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${sentimentBreakdown.negative}%` }}></div>
                            </div>
                        </div>
                     </div>
                     <div className="mt-8 grid grid-cols-2 gap-4">
                         <div className="bg-green-50 p-3 rounded text-xs text-green-800 border border-green-100">
                             <strong>+ Example:</strong> "{examples.positive}"
                         </div>
                         <div className="bg-red-50 p-3 rounded text-xs text-red-800 border border-red-100">
                             <strong>- Example:</strong> "{examples.negative}"
                         </div>
                     </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">{r.keywords}</h3>
                    <div className="flex flex-wrap gap-3">
                        {topKeywords.map((kw, i) => (
                            <div key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium flex items-center border border-indigo-100">
                                {kw.keyword}
                                <span className="ml-2 bg-white px-1.5 py-0.5 rounded text-xs text-indigo-500 font-bold border border-indigo-100">
                                    {kw.count}
                                </span>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
             </>
         );
         
      case 'Comments':
         return (
             <>
             {exportButtons}
             <div className="space-y-6">
                 {/* User Personas */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 mb-4">{r.userPersonas}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {result.data.userPersonas.map((persona, i) => (
                             <div key={i} className="bg-pink-50 border border-pink-100 p-4 rounded-lg">
                                 <h4 className="font-bold text-pink-700 mb-1">{persona.profile}</h4>
                                 <p className="text-sm text-slate-600">{persona.characteristics}</p>
                             </div>
                         ))}
                     </div>
                 </div>

                 {/* Common Questions */}
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 mb-4">{r.commonQuestions}</h3>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {result.data.commonQuestions.map((q, i) => (
                             <li key={i} className="flex items-start text-sm text-slate-700">
                                 <span className="bg-slate-200 text-slate-600 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">?</span>
                                 {q}
                             </li>
                         ))}
                     </ul>
                 </div>

                 {/* Drivers & Concerns */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                         <h3 className="text-lg font-bold text-green-800 mb-4">{r.purchaseMotivations}</h3>
                         <ul className="space-y-2">
                             {result.data.purchaseMotivations.map((m, i) => (
                                 <li key={i} className="flex items-start text-sm text-slate-700">
                                     <span className="mr-2 text-green-500">✓</span> {m}
                                 </li>
                             ))}
                         </ul>
                     </div>
                     <div className="bg-amber-50 p-6 rounded-xl border border-amber-100">
                         <h3 className="text-lg font-bold text-amber-800 mb-4">{r.concerns}</h3>
                         <ul className="space-y-2">
                             {result.data.concerns.map((c, i) => (
                                 <li key={i} className="flex items-start text-sm text-slate-700">
                                     <span className="mr-2 text-amber-500">⚠</span> {c}
                                 </li>
                             ))}
                         </ul>
                     </div>
                 </div>
             </div>
             </>
         );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">{t.analysis.title}</h2>
        <p className="text-slate-600 mt-2">{t.analysis.subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Mode Selector */}
        <div className="border-b border-slate-200 p-4 flex flex-wrap gap-2 bg-slate-50">
          {Object.entries(ANALYSIS_MODES).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => { setMode(key as AnalysisMode); setResult(null); }}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon size={16} className="mr-2" />
                {t.analysis.modes[key as AnalysisMode]}
              </button>
            );
          })}
        </div>

        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Inputs */}
                <div className="lg:col-span-2 space-y-4">
                     <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t.analysis.placeholder}
                        className="w-full h-40 p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm text-slate-800 placeholder-slate-400"
                    />

                    {/* Image Upload Area */}
                    <div>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <Upload className="text-slate-400 mb-2" size={32} />
                            <h4 className="text-sm font-semibold text-slate-700">{t.analysis.uploadTitle}</h4>
                            <p className="text-xs text-slate-500 mt-1">{t.analysis.uploadDesc}</p>
                        </div>

                        {/* Image Previews */}
                        {images.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Actions & Tips */}
                <div className="lg:col-span-1 flex flex-col justify-between">
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 mb-4 lg:mb-0">
                        <h4 className="text-indigo-800 font-bold text-sm mb-2 flex items-center"><ImageIcon size={16} className="mr-2"/> Pro Tip</h4>
                        <p className="text-xs text-indigo-700 leading-relaxed">
                            You can upload screenshots of WeChat conversations, Xiaohongshu posts, or Douyin comments. The AI will read text directly from the images using OCR.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || (!text.trim() && images.length === 0)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                        {loading ? t.analysis.analyzing : t.analysis.analyzeBtn}
                    </button>
                </div>
            </div>
        </div>

        {error && (
            <div className="px-6 pb-6">
                <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-100">
                    <AlertTriangle className="mr-2" size={20} />
                    {error}
                </div>
            </div>
        )}

        {result && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderResults()}
            </div>
        )}
      </div>
    </div>
  );
};
