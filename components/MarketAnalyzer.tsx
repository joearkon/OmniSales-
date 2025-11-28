
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ANALYSIS_MODES, TRANSLATIONS, LEAD_TYPES_MAP, VALUE_CATEGORY_MAP, OUTREACH_STATUS_MAP } from '../constants';
import { AnalysisMode, Language, AnalysisResult, MinedLead, StrategicOutreachResult, CompanyProfile } from '../types';
import { analyzeMarketData, generateStrategicOutreach } from '../services/geminiService';
import { Sparkles, Loader2, AlertTriangle, Image as ImageIcon, X, Target, Download, FileSpreadsheet, Clock, Filter, Info, LayoutGrid, List as ListIcon, Check, UserPlus, Signal, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof MinedLead | 'date', direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  // View State
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
                        if (rawName && !isUrl(rawName)) userName = rawName;
                    }

                    if (idIdx > -1 && row[idIdx] !== undefined) {
                         const rawId = String(row[idIdx]).trim();
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

    if (filterTime === 'recent') processed = processed.filter(l => !isStale(l.date));
    else if (filterTime === 'stale') processed = processed.filter(l => isStale(l.date));

    if (filterLeadType !== 'all') processed = processed.filter(l => l.leadType === filterLeadType);
    if (filterPlatform !== 'all') processed = processed.filter(l => l.platform === filterPlatform);

    return processed.sort((a, b) => {
        let res = 0;
        switch(sortConfig.key) {
            case 'date':
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                res = dateA - dateB;
                break;
            case 'valueCategory':
                const valPriority = { 'High Value User': 3, 'Potential Partner': 2, 'Medium Value User': 1, 'Low Value User': 0 };
                res = (valPriority[a.valueCategory] ?? 0) - (valPriority[b.valueCategory] ?? 0);
                break;
            case 'outreachStatus':
                const outreachPriority = { 'Likely Uncontacted': 2, 'Unknown': 1, 'Likely Contacted': 0 };
                res = (outreachPriority[a.outreachStatus] ?? 0) - (outreachPriority[b.outreachStatus] ?? 0);
                break;
            case 'accountName':
                res = a.accountName.localeCompare(b.accountName);
                break;
            case 'leadType':
                res = a.leadType.localeCompare(b.leadType);
                break;
            default:
                res = 0;
        }
        if (res === 0) {
             const dateA = a.date ? new Date(a.date).getTime() : 0;
             const dateB = b.date ? new Date(b.date).getTime() : 0;
             return dateB - dateA;
        }
        return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [result, filterTime, filterLeadType, filterPlatform, sortConfig]);

  useEffect(() => {
      setCurrentPage(1);
  }, [filterTime, filterLeadType, filterPlatform, sortConfig, text, result]);

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
        const source = sortedLeads || res.data.leads;
        rows = source.map(l => [l.platform, l.accountName, l.leadType, l.valueCategory, l.outreachStatus, l.date || '', l.reason, l.suggestedAction, l.context]);
    } else {
        headers = [r.category, r.item, r.detail];
        rows = [];
    }

    return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  };

  const handleSort = (key: keyof MinedLead | 'date') => {
      let newDirection: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key) {
          newDirection = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
          if (key === 'date' || key === 'valueCategory' || key === 'outreachStatus') newDirection = 'desc';
      }
      setSortConfig({ key, direction: newDirection });
  };

  const renderSortIcon = (key: string) => {
      if (sortConfig.key !== key) return <ArrowUpDown size={14} className="ml-1 text-slate-300 inline" />;
      return sortConfig.direction === 'asc' 
          ? <ArrowUp size={14} className="ml-1 text-indigo-600 inline" />
          : <ArrowDown size={14} className="ml-1 text-indigo-600 inline" />;
  };

  const totalItems = sortedAndFilteredLeads.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedLeads = sortedAndFilteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Safe localized label getter with fallback
  const getLocalizedLabel = (map: any, key: string) => {
      if (!key) return '-';
      return map[key]?.[lang] || key;
  };

  const renderResults = () => {
    if (!result) return null;

    if (result.mode === 'LeadMining') {
        return (
          <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm sticky top-0 z-10">
             <div className="flex flex-wrap items-center gap-4">
                 <div className="flex items-center gap-2">
                     <Filter size={16} className="text-slate-400" />
                     <span className="text-sm font-medium text-slate-700">{r.date}:</span>
                     <select value={filterTime} onChange={(e) => setFilterTime(e.target.value as any)} className="text-sm border-slate-200 rounded-md py-1">
                         <option value="all">{r.filters.all}</option>
                         <option value="recent">{r.filters.recent}</option>
                         <option value="stale">{r.filters.stale}</option>
                     </select>
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-slate-700">{r.filters.leadType}:</span>
                     <select value={filterLeadType} onChange={(e) => setFilterLeadType(e.target.value)} className="text-sm border-slate-200 rounded-md py-1">
                         <option value="all">{r.filters.all}</option>
                         <option value="User">{getLocalizedLabel(LEAD_TYPES_MAP, 'User')}</option>
                         <option value="Factory">{getLocalizedLabel(LEAD_TYPES_MAP, 'Factory')}</option>
                         <option value="KOL">{getLocalizedLabel(LEAD_TYPES_MAP, 'KOL')}</option>
                     </select>
                 </div>
                 {availablePlatforms.length > 0 && (
                     <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-slate-700">{r.filters.platform}:</span>
                         <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)} className="text-sm border-slate-200 rounded-md py-1">
                             <option value="all">{r.filters.all}</option>
                             {availablePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                         </select>
                     </div>
                 )}
             </div>
             
             <div className="flex gap-2 self-end sm:self-auto items-center">
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                    <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><ListIcon size={16} /></button>
                </div>
                <button onClick={() => {
                     const csv = generateCSV(result, sortedAndFilteredLeads);
                     downloadFile(csv, 'Analysis_Report.csv', 'csv');
                }} className="btn-sm-outline flex items-center gap-1 px-3 py-1.5 border rounded hover:bg-slate-50 text-sm"><Download size={14}/> CSV</button>
             </div>
          </div>

          {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedLeads.map((lead, i) => {
                  const idx = sortedAndFilteredLeads.indexOf(lead);
                  const strat = strategies[idx];
                  const isExpanded = expandedLeads[idx];
                  const isLoadingStrat = strategyLoading[idx];
                  const isAdded = crmLeads.includes(lead.accountName);
                  const stale = isStale(lead.date);
                  
                  // Defaults for missing data
                  const lType = lead.leadType || 'User';
                  const vCat = lead.valueCategory || 'Low Value User';
                  const oStatus = lead.outreachStatus || 'Unknown';

                  return (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                      <div className="flex gap-4 items-start mb-3">
                         <div className={`p-2.5 rounded-full shrink-0 ${
                           vCat === 'High Value User' ? 'bg-red-100 text-red-600' :
                           vCat === 'Potential Partner' ? 'bg-blue-100 text-blue-600' :
                           'bg-slate-100 text-slate-600'
                         }`}>
                           <Target size={20} />
                         </div>
                         <div className="flex-grow min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-bold text-slate-900 text-base break-words">{lead.accountName || 'Unknown User'}</h4>
                                  <button onClick={() => !isAdded && onAddToCRM(lead)} disabled={isAdded} className={`p-1 rounded-md border ${isAdded ? 'bg-green-100 text-green-700' : 'bg-white text-slate-400 hover:text-indigo-600'}`}>
                                       {isAdded ? <Check size={14} /> : <UserPlus size={14} />}
                                   </button>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 uppercase">{lead.platform || 'Unknown'}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200">{getLocalizedLabel(LEAD_TYPES_MAP, lType)}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-100">{getLocalizedLabel(VALUE_CATEGORY_MAP, vCat)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                      {lead.date && <span className={`flex items-center gap-1 ${stale ? 'text-slate-400' : 'text-green-600 font-semibold'}`}><Clock size={10} /> {lead.date}</span>}
                                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-slate-50 text-slate-500 border-slate-200"><Signal size={10} /> {getLocalizedLabel(OUTREACH_STATUS_MAP, oStatus)}</span>
                               </div>
                         </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 mb-3 italic grow">"{lead.context}"</div>
                      <div className="mt-auto border-t border-slate-100 pt-3 flex justify-end">
                           <button onClick={() => handleGenerateStrategy(lead, idx)} disabled={isLoadingStrat} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded w-full justify-center">
                              {isLoadingStrat ? <Loader2 size={14} className="animate-spin mr-2" /> : <Sparkles size={14} className="mr-1"/>} {r.genStrategy}
                           </button>
                      </div>
                      {isExpanded && strat && (
                            <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs relative">
                                <button onClick={() => handleExportStrategy(lead, strat)} className="absolute top-2 right-2 text-indigo-600 p-1 hover:bg-indigo-100 rounded"><Download size={14} /></button>
                                <h5 className="font-bold text-slate-800 mb-2 border-b pb-1">{r.strategyTitle}</h5>
                                <div className="space-y-2">
                                    {strat.scripts.friendly && <div><span className="font-bold text-indigo-600 block mb-0.5">{r.friendly}</span><p className="text-slate-600 bg-white p-2 rounded border">{strat.scripts.friendly}</p></div>}
                                    {strat.scripts.professional && <div><span className="font-bold text-indigo-600 block mb-0.5">{r.professional}</span><p className="text-slate-600 bg-white p-2 rounded border">{strat.scripts.professional}</p></div>}
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
                                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('date')}>{r.date} {renderSortIcon('date')}</th>
                                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('accountName')}>{r.account} {renderSortIcon('accountName')}</th>
                                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('leadType')}>{r.type} {renderSortIcon('leadType')}</th>
                                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('valueCategory')}>{r.valueCategory} {renderSortIcon('valueCategory')}</th>
                                <th className="p-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('outreachStatus')}>{r.outreachStatus} {renderSortIcon('outreachStatus')}</th>
                                <th className="p-4">{r.action}</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedLeads.map((lead, i) => {
                                const idx = sortedAndFilteredLeads.indexOf(lead);
                                const strat = strategies[idx];
                                const isExpanded = expandedLeads[idx];
                                const isLoadingStrat = strategyLoading[idx];
                                const isAdded = crmLeads.includes(lead.accountName);
                                
                                // Defaults for missing data
                                const lType = lead.leadType || 'User';
                                const vCat = lead.valueCategory || 'Low Value User';
                                const oStatus = lead.outreachStatus || 'Unknown';

                                return (
                                    <React.Fragment key={idx}>
                                        <tr className="hover:bg-slate-50/50">
                                            <td className="p-4 whitespace-nowrap">{lead.date || '-'}</td>
                                            <td className="p-4 font-bold break-words max-w-[200px]">{lead.accountName || 'Unknown'}</td>
                                            <td className="p-4">{getLocalizedLabel(LEAD_TYPES_MAP, lType)}</td>
                                            <td className="p-4">{getLocalizedLabel(VALUE_CATEGORY_MAP, vCat)}</td>
                                            <td className="p-4">{getLocalizedLabel(OUTREACH_STATUS_MAP, oStatus)}</td>
                                            <td className="p-4 text-xs text-slate-600 max-w-[200px] truncate">{lead.suggestedAction}</td>
                                            <td className="p-4 text-right whitespace-nowrap flex justify-end gap-2">
                                                <button onClick={() => !isAdded && onAddToCRM(lead)} disabled={isAdded} className={`p-1.5 rounded ${isAdded ? 'text-green-600' : 'text-slate-400 hover:text-indigo-600'}`}>{isAdded ? <Check size={16}/> : <UserPlus size={16}/>}</button>
                                                <button onClick={() => handleGenerateStrategy(lead, idx)} disabled={isLoadingStrat} className={`p-1.5 rounded ${isExpanded ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}>{isLoadingStrat ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}</button>
                                            </td>
                                        </tr>
                                        {isExpanded && strat && (
                                            <tr><td colSpan={7} className="bg-slate-50/50 p-4"><div className="bg-white p-4 rounded border">{strat.scripts.friendly}</div></td></tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}

          {totalItems > itemsPerPage && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}</span>
                  <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                  </div>
              </div>
          )}
          </>
        );
    }
    
    return null; 
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
              {/* Mode Selection Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {Object.keys(ANALYSIS_MODES).map((key) => {
                      const m = ANALYSIS_MODES[key];
                      const isActive = mode === key;
                      return (
                          <button key={key} onClick={() => setMode(key as AnalysisMode)} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${isActive ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                              <m.icon size={20} className={isActive ? m.color : 'text-slate-400'} />
                              <span className="text-xs font-bold mt-2 text-center">{t.analysis.modes[key as keyof typeof t.analysis.modes]}</span>
                          </button>
                      );
                  })}
              </div>
              
              {/* Input Area */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 flex gap-2"><Info className="text-blue-500 shrink-0" size={16} /><p className="text-xs text-blue-700">{t.analysis.inputTip}</p></div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-sm" placeholder={t.analysis.placeholder} />
              
              {/* Image Preview */}
              {images.length > 0 && <div className="flex gap-2 mt-4 overflow-x-auto pb-2">{images.map((img, i) => <div key={i} className="relative w-20 h-20 shrink-0"><img src={img} className="w-full h-full object-cover rounded-lg border"/><button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X size={10}/></button></div>)}</div>}

              {/* Upload Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 hover:bg-indigo-50 p-4 rounded-xl text-center cursor-pointer"><ImageIcon className="mx-auto text-slate-400 mb-2"/><span className="text-xs font-medium text-slate-500">{t.analysis.uploadTitle}</span></div>
                  <div onClick={() => csvInputRef.current?.click()} className="border-2 border-dashed border-green-200 hover:bg-green-50 p-4 rounded-xl text-center cursor-pointer"><FileSpreadsheet className="mx-auto text-green-500 mb-2"/><span className="text-xs font-medium text-green-700">{parsing ? t.analysis.parsing : t.analysis.uploadCSV}</span></div>
              </div>
              <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <input type="file" accept=".csv,.xlsx" ref={csvInputRef} className="hidden" onChange={handleSpreadsheetChange} />
              
              <button onClick={handleAnalyze} disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-xl mt-6 font-bold hover:bg-indigo-700 flex justify-center items-center gap-2">{loading ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} {loading ? t.analysis.analyzing : t.analysis.analyzeBtn}</button>
              {error && <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm border-t border-red-100 flex items-center gap-2 rounded-lg"><AlertTriangle size={16}/> {error}</div>}
          </div>

          <div className="lg:col-span-4 bg-indigo-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden h-fit">
               <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-indigo-200" /><h3 className="font-bold">{t.analysis.proTip.title}</h3></div>
               <div className="space-y-4 text-sm text-indigo-100"><p>1. {t.analysis.proTip.desc1}</p><p>2. {t.analysis.proTip.desc2}</p></div>
          </div>
      </div>

      {result && <div className="w-full animate-in slide-in-from-bottom-4 duration-500">{renderResults()}</div>}
    </div>
  );
};
