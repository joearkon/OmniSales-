
import React, { useState, useRef } from 'react';
import { CRMLead, DeepPersonaResult, CompanyProfile, Language } from '../types';
import { generateDeepPersona } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Microscope, X, Upload, Image as ImageIcon, Sparkles, Brain, Loader2, Tag, DollarSign, Heart, MessageCircle, Eye, Copy, Check } from 'lucide-react';

interface DeepAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: CRMLead | null;
  companyProfile: CompanyProfile;
  lang: Language;
  onSave: (leadId: string, result: DeepPersonaResult) => void;
}

export const DeepAnalysisModal: React.FC<DeepAnalysisModalProps> = ({ isOpen, onClose, lead, companyProfile, lang, onSave }) => {
  const [extraText, setExtraText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepPersonaResult | null>(lead?.deepAnalysis || null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = TRANSLATIONS[lang].deepAnalysis;

  // Reset when lead changes
  React.useEffect(() => {
      if (isOpen && lead) {
          setResult(lead.deepAnalysis || null);
          setExtraText('');
          setImages([]);
      }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                      setImages(prev => [...prev, reader.result as string]);
                  }
              };
              reader.readAsDataURL(file as Blob);
          });
      }
  };

  const handleAnalyze = async () => {
      setLoading(true);
      try {
          const res = await generateDeepPersona(lead, extraText, images, lang, companyProfile);
          setResult(res);
          onSave(lead.id, res);
      } catch (e) {
          console.error(e);
          alert("Analysis failed. Please check API Key or Network.");
      } finally {
          setLoading(false);
      }
  };

  const copyOpener = () => {
      if (result?.approach.openingLine) {
          navigator.clipboard.writeText(result.approach.openingLine);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
           <div className="flex items-center gap-3">
               <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                   <Brain size={24} />
               </div>
               <div>
                    <h3 className="font-bold text-xl text-slate-800">{t.title}</h3>
                    <p className="text-xs text-slate-500">{t.subtitle}</p>
               </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
               <X size={20} />
           </button>
        </div>

        <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
            
            {/* Left Panel: Input */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-r border-slate-200 overflow-y-auto flex flex-col gap-6">
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Tag size={14} /> Target: {lead.accountName}
                    </h4>
                    <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 italic">
                        "{lead.context}"
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.uploadTip}</label>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-purple-200 bg-purple-50/50 hover:bg-purple-50 rounded-xl p-6 text-center cursor-pointer transition-all group"
                    >
                        <ImageIcon className="mx-auto text-purple-300 group-hover:text-purple-500 mb-2" />
                        <span className="text-xs text-purple-600 font-medium">Click to Upload Screenshots</span>
                        <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    </div>
                    {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {images.map((img, i) => (
                                <img key={i} src={img} className="w-full h-16 object-cover rounded border border-slate-200" />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-grow">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">{t.textTip}</label>
                    <textarea 
                        className="w-full h-32 p-3 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        placeholder="Paste bio, recent posts, or notes..."
                        value={extraText}
                        onChange={e => setExtraText(e.target.value)}
                    />
                </div>

                <button 
                    onClick={handleAnalyze}
                    disabled={loading || (images.length === 0 && !extraText)}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Microscope size={18} />}
                    {loading ? t.analyzing : t.analyze}
                </button>
            </div>

            {/* Right Panel: Result */}
            <div className="w-full md:w-2/3 bg-white p-8 overflow-y-auto">
                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <Brain size={64} strokeWidth={1} className="mb-4" />
                        <p className="text-sm">Waiting for input to start profiling...</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Header Tags */}
                        <div className="flex flex-wrap gap-2">
                            {result.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        {/* Visual Deductions (New) */}
                        {result.visualEvidence && result.visualEvidence.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h5 className="text-blue-800 font-bold flex items-center gap-2 mb-3">
                                    <Eye size={18} /> {t.visualEvidence}
                                </h5>
                                <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
                                    {result.visualEvidence.map((ev, i) => (
                                        <li key={i}>{ev}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Psychology Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
                                <h5 className="text-orange-800 font-bold flex items-center gap-2 mb-3">
                                    <Brain size={18} /> {t.psychology}
                                </h5>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-bold text-orange-400 uppercase">{t.buyingLogic}</span>
                                        <p className="text-sm text-orange-900 font-medium">{result.psychology.buyingLogic}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-orange-400 uppercase">{t.painPoints}</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {result.psychology.painPoints.map((p, i) => (
                                                <span key={i} className="text-xs bg-white/50 px-1.5 py-0.5 rounded text-orange-800 border border-orange-200/50">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                <h5 className="text-green-800 font-bold flex items-center gap-2 mb-3">
                                    <DollarSign size={18} /> {t.match}
                                </h5>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-xs font-bold text-green-500 uppercase">{t.spendingPower}: {result.psychology.spendingPower}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-green-500 uppercase">Recommended Product</span>
                                        <p className="text-sm text-green-900 font-bold mt-1">{result.match.bestProduct}</p>
                                    </div>
                                    <p className="text-xs text-green-700 italic bg-white/50 p-2 rounded">
                                        "{result.match.whyFit}"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Approach Strategy */}
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                             <h5 className="text-indigo-800 font-bold flex items-center gap-2 mb-4">
                                <MessageCircle size={18} /> {t.approach}
                             </h5>
                             
                             <div className="mb-4">
                                 <div className="flex justify-between items-end mb-1">
                                     <span className="text-xs font-bold text-indigo-400 uppercase">{t.openingLine}</span>
                                     <button 
                                        onClick={copyOpener} 
                                        className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                                     >
                                         {copied ? <Check size={12}/> : <Copy size={12}/>}
                                         {copied ? t.copied : t.copy}
                                     </button>
                                 </div>
                                 <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm text-indigo-900 font-medium text-sm leading-relaxed relative">
                                     <Sparkles className="absolute top-2 right-2 text-indigo-200" size={16}/>
                                     {result.approach.openingLine}
                                 </div>
                             </div>

                             <div>
                                 <span className="text-xs font-bold text-indigo-400 uppercase mb-1 block">{t.tone}</span>
                                 <p className="text-sm text-indigo-700">{result.approach.toneAdvice}</p>
                             </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
