import React, { useState } from 'react';
import { Lead, OutreachScript } from '../types';
import { generateOutreach } from '../services/geminiService';
import { X, Copy, Check, MessageSquare, Mail, Phone, Loader2, Link as LinkIcon, Globe } from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'outreach'>('info');
  const [script, setScript] = useState<OutreachScript | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState('Professional');
  const [channel, setChannel] = useState('WeChat');

  if (!lead) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateOutreach(lead, tone, channel);
      setScript(result);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (script?.content) {
      navigator.clipboard.writeText(script.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{lead.companyName}</h2>
            <p className="text-slate-500 text-sm mt-1">{lead.type} • {lead.location || 'Location Unknown'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto flex">
          {/* Sidebar Tabs (Desktop) / Top Tabs (Mobile) */}
          <div className="w-1/4 min-w-[150px] bg-slate-50 border-r border-slate-100 p-4 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('info')}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'info' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              Company Info
            </button>
            <button 
              onClick={() => setActiveTab('outreach')}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'outreach' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              AI Outreach
            </button>
          </div>

          {/* Main Area */}
          <div className="flex-1 p-6">
            {activeTab === 'info' ? (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">About</h3>
                  <p className="text-slate-700 leading-relaxed">{lead.description}</p>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 mb-2">Potential Needs</h4>
                    <ul className="space-y-1">
                      {lead.potentialNeeds?.map((need, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start">
                          <span className="mr-2 text-indigo-500">•</span> {need}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                     <h4 className="text-xs font-semibold text-slate-500 mb-2">Public Contact Data</h4>
                     <div className="space-y-2">
                       {lead.contactInfo?.email && (
                         <div className="flex items-center text-sm text-slate-700">
                           <Mail size={14} className="mr-2 text-slate-400" /> {lead.contactInfo.email}
                         </div>
                       )}
                       {lead.contactInfo?.phone && (
                         <div className="flex items-center text-sm text-slate-700">
                           <Phone size={14} className="mr-2 text-slate-400" /> {lead.contactInfo.phone}
                         </div>
                       )}
                       {lead.website && (
                         <a href={lead.website} target="_blank" className="flex items-center text-sm text-blue-600 hover:underline">
                           <Globe size={14} className="mr-2" /> Visit Website
                         </a>
                       )}
                       {!lead.contactInfo?.email && !lead.contactInfo?.phone && (
                         <span className="text-sm text-slate-400 italic">No direct contact info found publicly. Use website contact form.</span>
                       )}
                     </div>
                  </div>
                </div>

                {lead.searchSources && lead.searchSources.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Sources</h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.searchSources.map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" className="flex items-center text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors">
                          <LinkIcon size={12} className="mr-1" />
                          <span className="max-w-[150px] truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="mb-4 space-y-4">
                  <p className="text-sm text-slate-600">Generate a personalized script to break the ice.</p>
                  <div className="flex gap-3">
                     <select 
                       value={channel} 
                       onChange={(e) => setChannel(e.target.value)}
                       className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                     >
                       <option value="WeChat">WeChat / IM</option>
                       <option value="Email">Cold Email</option>
                       <option value="Phone">Phone Script</option>
                     </select>
                     <select 
                       value={tone}
                       onChange={(e) => setTone(e.target.value)}
                       className="flex-1 bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                     >
                       <option value="Professional">Professional</option>
                       <option value="Friendly">Casual & Friendly</option>
                       <option value="Direct">Direct & Concise</option>
                     </select>
                     <button 
                       onClick={handleGenerate}
                       disabled={generating}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center disabled:opacity-50 transition-colors"
                     >
                       {generating ? <Loader2 className="animate-spin mr-2" size={16} /> : <MessageSquare className="mr-2" size={16} />}
                       Generate
                     </button>
                  </div>
                </div>

                <div className="flex-1 bg-slate-900 rounded-lg p-4 relative group overflow-hidden">
                  {generating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <Loader2 className="animate-spin mb-2" size={32} />
                      <span className="text-sm">Analyzing lead & drafting message...</span>
                    </div>
                  ) : script ? (
                    <>
                      <textarea 
                        readOnly
                        className="w-full h-full bg-transparent text-slate-200 text-sm font-mono resize-none focus:outline-none"
                        value={script.content}
                      />
                      <button 
                        onClick={copyToClipboard}
                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                      Select options and click Generate to see the magic.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};