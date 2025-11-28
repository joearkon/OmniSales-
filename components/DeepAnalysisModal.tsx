
import React, { useState, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { DeepPersonaResult, Language } from '../types';
import { generateDeepPersona } from '../services/geminiService';
import { X, Upload, Image as ImageIcon, Sparkles, Loader2, User, Wallet, Brain, Eye, MessageCircle, Save } from 'lucide-react';

interface DeepAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: DeepPersonaResult) => void;
  lang: Language;
  initialName: string;
}

export const DeepAnalysisModal: React.FC<DeepAnalysisModalProps> = ({ isOpen, onClose, onSave, lang, initialName }) => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeepPersonaResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image && !text.trim()) return;
    setLoading(true);
    try {
      const data = await generateDeepPersona(image, text, lang);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please check API key or network.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClose = () => {
    if (result) {
        onSave(result);
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Input */}
        <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:hidden">
                <h3 className="font-bold text-slate-800">{t.deepAnalysis.title}</h3>
                <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
            </div>
            
            <h3 className="font-bold text-slate-800 mb-2 hidden md:block">{t.deepAnalysis.title}</h3>
            <p className="text-xs text-slate-500 mb-6">{t.deepAnalysis.desc}</p>

            {/* Image Upload */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:bg-white hover:border-indigo-400 transition-all mb-4 relative group"
            >
                {image ? (
                    <div className="relative">
                        <img src={image} alt="preview" className="w-full h-40 object-cover rounded-lg shadow-sm" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-white text-xs">
                            Change Image
                        </div>
                    </div>
                ) : (
                    <div className="py-8">
                        <Upload className="mx-auto text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 font-medium">{t.deepAnalysis.uploadTip}</p>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            {/* Text Input */}
            <textarea 
                className="w-full h-32 p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4"
                placeholder={t.deepAnalysis.textTip}
                value={text}
                onChange={(e) => setText(e.target.value)}
            />

            <button 
                onClick={handleAnalyze} 
                disabled={loading || (!image && !text)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {loading ? t.deepAnalysis.analyzing : t.deepAnalysis.analyze}
            </button>
        </div>

        {/* Right Side: Result */}
        <div className="w-full md:w-2/3 bg-white flex flex-col relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full hidden md:block z-10">
                <X size={20} className="text-slate-400"/>
            </button>

            <div className="flex-grow p-8 overflow-y-auto">
                {!result ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                            <Brain size={48} />
                        </div>
                        <p className="text-sm">Ready to profile: {initialName}</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">{result.personaTag}</h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${result.spendingPower === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    Spending Power: {result.spendingPower}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Brain size={16} className="text-indigo-500"/> {t.deepAnalysis.psychology}
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{result.psychology}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-rose-500"/> {t.deepAnalysis.needs}
                                </h4>
                                <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                                    {result.hiddenNeeds.map((need, i) => (
                                        <li key={i}>{need}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                            <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                <MessageCircle size={16} /> {t.deepAnalysis.opener}
                            </h4>
                            <p className="text-base text-indigo-800 font-medium italic mb-3">"{result.killerOpener}"</p>
                            <button 
                                onClick={() => navigator.clipboard.writeText(result.killerOpener)}
                                className="text-xs bg-white text-indigo-600 px-3 py-1.5 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm font-bold"
                            >
                                Copy Script
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {result && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                        onClick={handleSaveClose}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg"
                    >
                        <Save size={18} /> {t.deepAnalysis.save}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
