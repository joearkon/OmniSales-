import React from 'react';
import { Lead, Language } from '../types';
import { LEAD_TYPES, TRANSLATIONS } from '../constants';
import { ExternalLink, MapPin, Globe, ArrowRight } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onAnalyze: (lead: Lead) => void;
  lang: Language;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onAnalyze, lang }) => {
  const typeConfig = LEAD_TYPES[lead.type] || LEAD_TYPES['B2B'];
  const Icon = typeConfig.icon;
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all duration-200 flex flex-col h-full transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${typeConfig.color}`}>
          <Icon size={20} />
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${lead.confidenceScore > 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {lead.confidenceScore}% {t.match}
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">{lead.companyName}</h3>
      
      <div className="flex items-center text-slate-500 text-sm mb-4 space-x-3">
        {lead.location && (
          <div className="flex items-center">
            <MapPin size={14} className="mr-1 flex-shrink-0" />
            <span className="truncate max-w-[100px]">{lead.location}</span>
          </div>
        )}
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-indigo-600 transition-colors">
            <Globe size={14} className="mr-1 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{t.website}</span>
            <ExternalLink size={10} className="ml-1 flex-shrink-0" />
          </a>
        )}
      </div>

      <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
        {lead.description}
      </p>

      {lead.potentialNeeds && lead.potentialNeeds.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {lead.potentialNeeds.slice(0, 2).map((need, idx) => (
            <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {need}
            </span>
          ))}
        </div>
      )}

      <button 
        onClick={() => onAnalyze(lead)}
        className="w-full mt-auto bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors group"
      >
        {t.viewDetails}
        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
