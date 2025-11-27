
import React, { useState, useRef, useMemo } from 'react';
import { ANALYSIS_MODES, TRANSLATIONS } from '../constants';
import { AnalysisMode, Language, AnalysisResult, MinedLead, StrategicOutreachResult, CompanyProfile } from '../types';
import { analyzeMarketData, generateStrategicOutreach } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle, Image as ImageIcon, X, Target, Download, FileSpreadsheet, Clock, Filter, Info, LayoutGrid, List as ListIcon, Check, UserPlus, Signal } from 'lucide-react';

interface MarketAnalyzerProps {
  lang: Language;
  onAddToCRM: (lead: MinedLead) => void;
  crmLeads: string[];
  companyProfile: CompanyProfile;
}

export const MarketAnalyzer: React.FC<MarketAnalyzerProps> = ({ lang, onAddToCRM, crmLeads, companyProfile }) => {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [mode, setMode] = useState<AnalysisMode>('LeadMining');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [expandedLeads, setExpandedLeads] = useState<Record<number, boolean>>({});
  const [strategies, setStrategies] = useState<Record<number, StrategicOutreachResult>>({});
  const [strategyLoading, setStrategyLoading] = useState<Record<number, boolean>>({});

  // Filtering State
  const [filterTime, setFilterTime] = useState<'all'|'recent'|'stale'>('all');
  const [filterLeadType, setFilterLeadType] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  
  // View State
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const t = TRANSLATIONS[lang];
  const r = t.analysis.results;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
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

  const handleSpreadsheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = e.target?.result;
            
            let XLSX = (window as any).XLSX;
            if (!XLSX) {
                await new Promise(resolve => setTimeout(resolve, 500));
                XLSX = (window as any).XLSX;
            }
            if (!XLSX) {
                try {
                     const xlsxModule = await import('xlsx');
                     XLSX = xlsxModule;
                } catch (importErr) {
                     setError("Excel parser library not loaded. Please ensure internet connection.");
                     setParsing(false);
                     return;
                }
            }

            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!jsonData || jsonData.length === 0) {
                 setError(t.errors.fileEmpty);
                 return;
            }

            const headers = (jsonData[0] as any[]).map(h => String(h).trim());
            let contentIdx = -1, userIdx = -1, idIdx = -1, dateIdx = -1, locIdx = -1;
            
            const has = (str: string, terms: string[]) => terms.some(t => str.toLowerCase().includes(t));
            const isUrl = (s: string) => /^(http|https|www)/i.test(s);
            const isId = (s: string) => has(s, ['id','uid','号','code']);

            headers.forEach((h: string, i: number) => {
                const header = h.trim();
                const lower = header.toLowerCase();

                if (contentIdx === -1 && (header === '评论内容' || header === 'Content' || (!isId(lower) && has(lower, ['内容','content','comment'])))) {
                    contentIdx = i;
                }

                const isLink = has(lower, ['url','link','链接','主页','作品']);
                
                // Strict check: if it looks like ID or Link, it is NOT the User Name
                if (userIdx === -1 && !isLink && !isId(lower)) {
                    // Strong match for "Commenter", "Nickname"
                    if (has(lower, ['评论人','昵称','nickname','name'])) {
                        userIdx = i;
                    }
                }
                
                if (idIdx === -1 && !isLink) {
                     if (has(lower, ['抖音号','id','uid','code'])) {
                         idIdx = i;
                     }
                }

                if (dateIdx === -1 && has(lower, ['时间','date','time'])) dateIdx = i;
                if (locIdx === -1 && has(lower, ['地区','location'])) locIdx = i;
            });

            // Fallback Logic for standard exports if headers didn't match perfectly
            if (contentIdx === 0) {
                if (userIdx === -1 && headers.length > 1) userIdx = 1;
                if (idIdx === -1 && headers.length > 2) idIdx = 2;
            }

            const parsedLines: string[] = [];
            const dataRows = jsonData.slice(1, 301); 

            dataRows.forEach((row: any) => {
                if (contentIdx > -1 && row[contentIdx]) {
                    let line = `Content: "${row[contentIdx]}"`;
                    
                    let userName = "";
                    let userId = "";

                    if (userIdx > -1 && row[userIdx] !== undefined) {
                        const rawName = String(row[userIdx]).trim();
                        // Validation: Name cannot be a URL
                        if (rawName && !isUrl(rawName)) userName = rawName;
                    }

                    if (idIdx > -1 && row[idIdx] !== undefined) {
                         const rawId = String(row[idIdx]).trim();
                         // Validation: ID cannot be a URL
                         if (rawId && !isUrl(rawId)) userId = rawId;
                    }

                    let userInfo = userName;
                    if (userId) {
                         userInfo = userInfo ? `${userInfo} (ID: ${userId})` : `ID: ${userId}`;
                    } else if (userName) {
                         userInfo = userName; 
                    }

                    if (userInfo) line += ` | User: ${userInfo}`;
                    
                    // Date Parsing
                    if (dateIdx > -1 && row[dateIdx]) {
                        let dateVal = row[dateIdx];
                        // Convert Excel Serial Date to String
                        if (typeof dateVal === 'number') {
                            const dateObj = new Date(Math.round((dateVal - 25569)*86400*1000));
                            if (!isNaN(dateObj.getTime())) {
                                dateVal = dateObj.toISOString().slice(0, 10);
                            }
                        }
                        line += ` | Date: ${dateVal}`;
                    }
                    
                    if (locIdx > -1 && row[locIdx]) line += ` | Loc: ${row[locIdx]}`;
                    parsedLines.push(line);
                }
            });

            if (parsedLines.length > 0) {
                const newText = parsedLines.join('\n');
                setText(prev => prev ? prev + "\n\n--- IMPORTED DATA ---\n" + newText : newText);
                if (mode === 'Needs' || mode === 'Comments') {
                    // Keep existing mode if relevant, else fallback
                } else {
                    setMode('LeadMining'); 
                }
            } else {
                setError(t.errors.columnMissing);
            }
        } catch (err) {
            console.error(err);
            setError(t.errors.parseFail);
        } finally {
            setParsing(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
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
      const strategy = await generateStrategicOutreach(lead, lang, companyProfile);
      setStrategies(prev => ({ ...prev, [index]: strategy }));
      setExpandedLeads(prev => ({ ...prev, [index]: true }));
    } catch (err) {
      console.error(err);
    } finally {
      setStrategyLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  const downloadFile = (content: string, filename: string, type: 'csv' | 'txt') => {
    const bom = '\uFEFF'; 
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

  const handleExportStrategy = (lead: MinedLead, strat: StrategicOutreachResult) => {
    const lines: string[] = [];
    lines.push(`${r.strategyTitle} - ${lead.accountName}`);
    lines.push(`${r.platform}: ${lead.platform} | ${r.valueCategory}: ${lead.valueCategory}`);
    lines.push(`Context: "${lead.context}"`);
    lines.push('----------------------------------------\n');

    if (strat.diagnosis) {
        lines.push(`${r.diagnosis}: ${strat.diagnosis.problemType}`);
        lines.push(`${r.recommendation}: ${strat.diagnosis.recommendedProduct}`);
        lines.push(`${r.advice}:`);
        strat.diagnosis.advice.forEach(a => lines.push(`- ${a}`));
        lines.push('\n');
    }

    lines.push(`${r.scripts}:`);
    lines.push(`[${r.friendly}]: ${strat.scripts.friendly}`);
    lines.push(`[${r.professional}]: ${strat.scripts.professional}`);
    lines.push(`[${r.concise}]: ${strat.scripts.concise}`);
    lines.push('\n');
    lines.push(`${r.privateDomain}: ${strat.privateDomainTip}`);

    const content = lines.join('\n');
    downloadFile(content, `Strategy_${lead.accountName}.txt`, 'txt');
  };

  const isStale = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const diffTime = Math.abs(new Date().getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 90;
  };
  
  const availablePlatforms = useMemo(() => {
      if (!result || result.mode !== 'LeadMining') return [];
      return Array.from(new Set(result.data.leads.map(l => l.platform)));
  }, [result]);

  const sortedAndFilteredLeads = useMemo(() => {
    if (!result || result.mode !== 'LeadMining') return [];
    
    let processed = [...result.data.leads];

    // Filter Time
    if (filterTime === 'recent') {
        processed = processed.filter(l => !isStale(l.date));
    } else if (filterTime === 'stale') {
        processed = processed.filter(l => isStale(l.date));
    }

    // Filter Lead Type
    if (filterLeadType !== 'all') {
        processed = processed.filter(l => l.leadType === filterLeadType);
    }

    // Filter Platform
    if (filterPlatform !== 'all') {
        processed = processed.filter(l => l.platform === filterPlatform);
    }

    // Sort: Date Descending -> Value Priority
    const priority = { 'High Value User': 0, 'Potential Partner': 1, 'Medium Value User': 2, 'Low Value User': 3 };

    return processed.sort((a, b) => {
        // Primary: Date Descending (Newest first)
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;

        // Secondary: Value Category
        return (priority[a.valueCategory] ?? 4) - (priority[b.valueCategory] ?? 4);
    });
  }, [result, filterTime, filterLeadType, filterPlatform]);

  const generateCSV = (res: AnalysisResult, sortedLeads?: MinedLead[]): string => {
    let headers: string[] = [];
    let rows: string[][] = [];

    const escape = (str: string) => {
      const s = String(str || '');
      if (s.search(/("|,|\n)/g) >= 0) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    if (res.mode === 'LeadMining') {
        headers = [r.platform, r.account, r.type, r.valueCategory, r.outreachStatus, r.date, r.reason, r.action, 'Context'];
        // Use sortedLeads if available (WYSIWYG), otherwise fallback to raw data
        const source = sortedLeads || res.data.leads;
        rows = source.map(l => [l.platform, l.accountName, l.leadType, l.valueCategory, l.outreachStatus, l.date || '', l.reason, l.suggestedAction, l.context]);
    } else {
        headers = [r.category, r.item, r.detail];
        if (res.mode === 'Identity') {
           rows = res.data.map(i => [i.platform, i.name, `${i.identity} - ${i.description}`]);
        } else if (res.mode === 'Needs') {
           rows = [
             ...res.data.coreNeeds.map(n => ['Core Needs', n.need, n.example]),
             ...res.data.painPoints.map(p => ['Pain Points', p.point, p.example]),
             ...res.data.preferences.map(pr => ['Preferences', pr.preference, pr.example])
           ];
        } else if (res.mode === 'Comments') {
           rows = [
             ...res.data.userPersonas.map(p => ['Persona', p.profile, p.characteristics]),
             ...res.data.commonQuestions.map(q => ['Question', q, '']),
             ...res.data.purchaseMotivations.map(m => ['Motivation', m, '']),
             ...res.data.concerns.map(c => ['Concern', c, ''])
           ];
        }
    }

    return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  };

  const renderResults = () => {
    if (!result) return null;

    if (result.mode === 'LeadMining') {
        return (
          <>
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm sticky top-0 z-10">
             <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2">
                     <Filter size={16} className="text-slate-400" />
                     <span className="text-sm font-medium text-slate-700">{r.date}:</span>
                     <select 
                       value={filterTime} 
                       onChange={(e) => setFilterTime(e.target.value as any)}
                       className="text-sm border-slate-200 rounded-md focus:ring-indigo-500 py-1"
                     >
                         <option value="all">{r.filters.all}</option>
                         <option value="recent">{r.filters.recent}</option>
                         <option value="stale">{r.filters.stale}</option>
                     </select>
                 </div>

                 <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-slate-700">{r.filters.leadType}:</span>
                     <select 
                       value={filterLeadType} 
                       onChange={(e) => setFilterLeadType(e.target.value)}
                       className="text-sm border-slate-200 rounded-md focus:ring-indigo-500 py-1"
                     >
                         <option value="all">{r.filters.all}</option>
                         <option value="User">User</option>
                         <option value="Factory">Factory</option>
                         <option value="KOL">KOL</option>
                     </select>
                 </div>
                 
                 {availablePlatforms.length > 0 && (
                     <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-slate-700">{r.filters.platform}:</span>
                         <select 
                           value={filterPlatform} 
                           onChange={(e) => setFilterPlatform(e.target.value)}
                           className="text-sm border-slate-200 rounded-md focus:ring-indigo-500 py-1"
                         >
                             <option value="all">{r.filters.all}</option>
                             {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                     </div>
                 )}
             </div>
             
             <div className="flex gap-2 self-end sm:self-auto items-center">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                    <button 
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Card View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        title="List View"
                    >
                        <ListIcon size={16} />
                    </button>
                </div>

                <button onClick={() => {
                     const csv = generateCSV(result, sortedAndFilteredLeads);
                     downloadFile(csv, 'Analysis_Report.csv', 'csv');
                }} className="btn-sm-outline flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-slate-50 text-sm">
                    <Download size={14}/> CSV
                </button>
             </div>
          </div>

          {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAndFilteredLeads.map((lead, idx) => {
                  const strat = strategies[idx];
                  const isExpanded = expandedLeads[idx];
                  const isLoadingStrat = strategyLoading[idx];
                  const isAdded = crmLeads.includes(lead.accountName);
                  const stale = isStale(lead.date);

                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                      <div className="flex gap-4 items-start mb-3">
                         <div className={`p-2.5 rounded-full shrink-0 ${
                           lead.valueCategory === 'High Value User' ? 'bg-red-100 text-red-600' :
                           lead.valueCategory === 'Potential Partner' ? 'bg-blue-100 text-blue-600' :
                           'bg-slate-100 text-slate-600'
                         }`}>
                           <Target size={20} />
                         </div>
              
                         <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-slate-900 text-base truncate" title={lead.accountName}>{lead.accountName}</h4>
                                  <button 
                                     onClick={() => !isAdded && onAddToCRM(lead)}
                                     disabled={isAdded}
                                     className={`p-1 rounded-md border transition-colors ${
                                         isAdded 
                                         ? 'bg-green-100 border-green-200 text-green-700 cursor-default' 
                                         : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300'
                                     }`}
                                   >
                                       {isAdded ? <Check size={14} /> : <UserPlus size={14} />}
                                   </button>
                              </div>
                              
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 uppercase">{lead.platform}</span>
                                      
                                      <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                                          lead.leadType === 'Factory' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          lead.leadType === 'KOL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                          'bg-green-50 text-green-700 border-green-200'
                                      }`}>
                                          {lead.leadType}
                                      </span>
                                      
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                          lead.valueCategory === 'High Value User' ? 'bg-red-50 text-red-700 border-red-100' :
                                          'bg-slate-50 text-slate-600 border-slate-100'
                                      }`}>
                                          {lead.valueCategory}
                                      </span>
                              </div>

                              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                      {lead.date && (
                                          <span className={`flex items-center gap-1 ${stale ? 'text-slate-400' : 'text-green-600 font-semibold'}`}>
                                              <Clock size={10} /> {lead.date} {stale && <span className="text-red-500 bg-red-50 px-1 rounded ml-1">Old</span>}
                                          </span>
                                      )}
                                      
                                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                                          lead.outreachStatus === 'Likely Uncontacted' ? 'bg-green-50 text-green-700 border-green-200' :
                                          lead.outreachStatus === 'Likely Contacted' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                          'bg-slate-50 text-slate-500 border-slate-200'
                                      }`}>
                                          <Signal size={10} /> 
                                          {lead.outreachStatus === 'Likely Uncontacted' ? r.statuses.likelyUncontacted :
                                           lead.outreachStatus === 'Likely Contacted' ? r.statuses.likelyContacted : r.statuses.unknown}
                                      </span>
                               </div>
                         </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 mb-3 italic grow">
                          "{lead.context}"
                      </div>
          
                      <div className="space-y-2 text-xs mb-4">
                            <div className="flex gap-2">
                               <span className="font-semibold text-slate-500 min-w-[50px]">{r.reason}:</span> 
                               <span className="text-slate-700">{lead.reason}</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="font-semibold text-indigo-500 min-w-[50px]">{r.action}:</span> 
                               <span className="text-indigo-700 font-medium">{lead.suggestedAction}</span>
                            </div>
                      </div>

                      <div className="mt-auto border-t border-slate-100 pt-3 flex justify-end">
                           <button 
                             onClick={() => handleGenerateStrategy(lead, idx)}
                             disabled={isLoadingStrat}
                             className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition-colors w-full justify-center"
                           >
                              {isLoadingStrat ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-1"/>} 
                              {r.genStrategy}
                           </button>
                      </div>
                      
                      {isExpanded && strat && (
                            <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs animate-in fade-in relative">
                                <button onClick={() => handleExportStrategy(lead, strat)} className="absolute top-2 right-2 text-indigo-600 p-1 hover:bg-indigo-100 rounded" title={r.exportStrategy}>
                                    <Download size={14} />
                                </button>
                                <h5 className="font-bold text-slate-800 mb-2 border-b pb-1">{r.strategyTitle}</h5>
                                
                                <div className="space-y-2">
                                    <div>
                                        <span className="font-bold text-indigo-600 block mb-0.5">{r.friendly}</span>
                                        <p className="text-slate-600 bg-white p-2 rounded border border-slate-100">{strat.scripts.friendly}</p>
                                    </div>
                                    <div>
                                        <span className="font-bold text-indigo-600 block mb-0.5">{r.professional}</span>
                                        <p className="text-slate-600 bg-white p-2 rounded border border-slate-100">{strat.scripts.professional}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                  );
                })}
              </div>
          ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4 whitespace-nowrap">{r.date}</th>
                                <th className="p-4 whitespace-nowrap">{r.account}</th>
                                <th className="p-4 whitespace-nowrap">{r.type}</th>
                                <th className="p-4 whitespace-nowrap">{r.valueCategory}</th>
                                <th className="p-4 whitespace-nowrap">{r.outreachStatus}</th>
                                <th className="p-4">{r.action}</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedAndFilteredLeads.map((lead, idx) => {
                                const strat = strategies[idx];
                                const isExpanded = expandedLeads[idx];
                                const isLoadingStrat = strategyLoading[idx];
                                const isAdded = crmLeads.includes(lead.accountName);
                                const stale = isStale(lead.date);

                                return (
                                    <React.Fragment key={idx}>
                                        <tr className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4 whitespace-nowrap">
                                                {lead.date ? (
                                                     <span className={`text-xs ${stale ? 'text-slate-400' : 'text-slate-700'}`}>
                                                         {lead.date}
                                                     </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 truncate max-w-[150px]" title={lead.accountName}>{lead.accountName}</span>
                                                    <span className="text-[10px] text-slate-500">{lead.platform}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                      lead.leadType === 'Factory' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                      lead.leadType === 'KOL' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                      'bg-green-50 text-green-700 border-green-200'
                                                  }`}>
                                                  {lead.leadType}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                 <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                      lead.valueCategory === 'High Value User' ? 'bg-red-50 text-red-700 border-red-100' :
                                                      'bg-slate-50 text-slate-600 border-slate-100'
                                                  }`}>
                                                  {lead.valueCategory}
                                                </span>
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                      lead.outreachStatus === 'Likely Uncontacted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                      lead.outreachStatus === 'Likely Contacted' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                      'bg-slate-50 text-slate-500 border-slate-200'
                                                  }`}>
                                                    {lead.outreachStatus === 'Likely Uncontacted' ? r.statuses.likelyUncontacted :
                                                     lead.outreachStatus === 'Likely Contacted' ? r.statuses.likelyContacted : r.statuses.unknown}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-slate-600 max-w-[200px] truncate" title={lead.suggestedAction}>
                                                {lead.suggestedAction}
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => !isAdded && onAddToCRM(lead)}
                                                        disabled={isAdded}
                                                        className={`p-1.5 rounded hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all ${isAdded ? 'text-green-600 cursor-default' : 'text-slate-400 hover:text-indigo-600'}`}
                                                        title={r.addToCRM}
                                                    >
                                                        {isAdded ? <Check size={16} /> : <UserPlus size={16} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleGenerateStrategy(lead, idx)}
                                                        disabled={isLoadingStrat}
                                                        className={`p-1.5 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all ${isExpanded ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600'}`}
                                                        title={r.genStrategy}
                                                    >
                                                        {isLoadingStrat ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && strat && (
                                            <tr>
                                                <td colSpan={7} className="bg-slate-50/50 p-0 border-b border-slate-100">
                                                    <div className="p-4 pl-12">
                                                        <div className="bg-white rounded-lg border border-slate-200 p-4 text-xs relative">
                                                            <button onClick={() => handleExportStrategy(lead, strat)} className="absolute top-3 right-3 text-indigo-600 p-1 hover:bg-indigo-50 rounded" title={r.exportStrategy}>
                                                                <Download size={14} />
                                                            </button>
                                                            <h5 className="font-bold text-slate-800 mb-3 text-sm">{r.strategyTitle}</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="font-bold text-indigo-600 block mb-1">{r.friendly}</span>
                                                                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">{strat.scripts.friendly}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-bold text-indigo-600 block mb-1">{r.professional}</span>
                                                                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">{strat.scripts.professional}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}
          </>
        );
    }
    
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-slate-800 border-b pb-2">{t.analysis.results.reportTitle}</h3>
            <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
                 <button onClick={() => {
                     const csv = generateCSV(result);
                     downloadFile(csv, 'Report.csv', 'csv');
                }} className="btn-sm-outline flex items-center gap-1 px-3 py-1.5 border rounded text-sm">
                    <Download size={14}/> CSV
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {Object.keys(ANALYSIS_MODES).map((key) => {
                         const m = ANALYSIS_MODES[key];
                         const isActive = mode === key;
                         return (
                             <button
                               key={key}
                               onClick={() => setMode(key as AnalysisMode)}
                               className={`
                                 relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border
                                 ${isActive 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-100 hover:bg-slate-50'
                                 }
                               `}
                             >
                                <div className={`p-2 rounded-full mb-2 ${isActive ? 'bg-white' : 'bg-slate-100'}`}>
                                    <m.icon size={20} className={isActive ? m.color : 'text-slate-400'} />
                                </div>
                                <span className="text-xs font-bold text-center leading-tight">
                                    {t.analysis.modes[key as keyof typeof t.analysis.modes]}
                                </span>
                             </button>
                         );
                      })}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 flex items-start gap-2">
                       <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                       <p className="text-xs text-blue-700 leading-relaxed">{t.analysis.inputTip}</p>
                  </div>

                  <textarea 
                    value={text} 
                    onChange={(e) => setText(e.target.value)} 
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none text-sm transition-all" 
                    placeholder={t.analysis.placeholder} 
                  />
                  
                  {images.length > 0 && (
                      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                          {images.map((img, i) => (
                              <div key={i} className="relative w-20 h-20 shrink-0 rounded-lg border border-slate-200 overflow-hidden group">
                                  <img src={img} alt="upload" className="w-full h-full object-cover" />
                                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <X size={10} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                      <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 p-4 rounded-xl text-center cursor-pointer transition-all group">
                           <ImageIcon className="mx-auto text-slate-400 group-hover:text-indigo-500 mb-2" /> 
                           <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600">{t.analysis.uploadTitle}</span>
                      </div>
                      <div onClick={() => csvInputRef.current?.click()} className="border-2 border-dashed border-green-200 bg-green-50/50 hover:bg-green-50 p-4 rounded-xl text-center cursor-pointer transition-all group">
                           {parsing ? <Loader2 className="mx-auto text-green-500 animate-spin mb-2" /> : <FileSpreadsheet className="mx-auto text-green-500 mb-2" />}
                           <span className="text-xs font-medium text-green-700">{parsing ? t.analysis.parsing : t.analysis.uploadCSV}</span>
                      </div>
                  </div>
                  <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  <input type="file" accept=".csv,.xlsx" ref={csvInputRef} className="hidden" onChange={handleSpreadsheetChange} />
                  
                  <button onClick={handleAnalyze} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-4 rounded-xl mt-6 font-bold shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2">
                      {loading ? <><Loader2 className="animate-spin"/> {t.analysis.analyzing}</> : <><Sparkles size={18} /> {t.analysis.analyzeBtn}</>}
                  </button>
              
                  {error && <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm border-t border-red-100 flex items-center gap-2 rounded-lg"><AlertTriangle size={16}/> {error}</div>}
          </div>

          <div className="lg:col-span-4 bg-indigo-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden h-fit">
               <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
               <div className="flex items-center gap-2 mb-4">
                   <div className="bg-white/20 p-1.5 rounded-lg">
                       <Sparkles size={16} className="text-indigo-200" />
                   </div>
                   <h3 className="font-bold">{t.analysis.proTip.title}</h3>
               </div>
               <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
                   <p className="flex gap-2">
                       <span className="bg-indigo-500/50 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                       {t.analysis.proTip.desc1}
                   </p>
                   <p className="flex gap-2">
                       <span className="bg-indigo-500/50 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                       {t.analysis.proTip.desc2}
                   </p>
               </div>
          </div>
      </div>

      {result && (
        <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
           {renderResults()}
        </div>
      )}
    </div>
  );
};
