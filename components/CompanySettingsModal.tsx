
import React, { useState, useRef } from 'react';
import { CompanyProfile, Language, Product } from '../types';
import { TRANSLATIONS } from '../constants';
import { Save, Building2, Package, Star, Briefcase, X, FileText, Image as ImageIcon, Check, Upload, Trash2, Award, Gauge, Globe, Trophy, Link as LinkIcon, Download, Plus, ShoppingBag } from 'lucide-react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  lang: Language;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({ isOpen, onClose, profile, onSave, lang }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);
  const [activeTab, setActiveTab] = useState<'basic' | 'products' | 'knowledge'>('basic');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  
  // Product Form State
  const [newProduct, setNewProduct] = useState<Product>({ id: '', name: '', sku: '', sellingPoints: '', moq: '' });
  
  const t = TRANSLATIONS[lang].settings;

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                      setFormData(prev => ({
                          ...prev,
                          images: [...(prev.images || []), reader.result as string].slice(0, 5) // Limit to 5
                      }));
                  }
              };
              reader.readAsDataURL(file as Blob);
          });
      }
  };

  const removeImage = (idx: number) => {
      setFormData(prev => ({
          ...prev,
          images: (prev.images || []).filter((_, i) => i !== idx)
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
      const json = JSON.stringify(formData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factory_brain_config_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const content = evt.target?.result as string;
              const data = JSON.parse(content);
              // Basic validation check
              if (typeof data === 'object' && data !== null) {
                  setFormData(prev => ({ ...prev, ...data }));
                  alert(t.importSuccess);
              } else {
                  throw new Error("Invalid format");
              }
          } catch (err) {
              console.error(err);
              alert(t.importError);
          } finally {
              if (configInputRef.current) configInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  // Product Library Handlers
  const handleAddProduct = () => {
      if (!newProduct.name) return;
      const productToAdd = { ...newProduct, id: `prod-${Date.now()}` };
      setFormData(prev => ({
          ...prev,
          productsList: [...(prev.productsList || []), productToAdd]
      }));
      setNewProduct({ id: '', name: '', sku: '', sellingPoints: '', moq: '' });
  };

  const handleDeleteProduct = (id: string) => {
      setFormData(prev => ({
          ...prev,
          productsList: (prev.productsList || []).filter(p => p.id !== id)
      }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
           <div className="flex items-center gap-2">
               <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                   <Building2 size={20} />
               </div>
               <div>
                    <h3 className="font-bold text-lg text-slate-800">{t.title}</h3>
                    <p className="text-xs text-slate-500">{t.desc}</p>
               </div>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
               <X size={20} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 shrink-0">
            <button 
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'basic' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                {t.tabs.basic}
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                {t.tabs.products}
            </button>
            <button 
              onClick={() => setActiveTab('knowledge')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'knowledge' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
            >
                {t.tabs.knowledge}
            </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="overflow-y-auto p-6 flex-grow">
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {activeTab === 'basic' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Company Name & Website */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                    <Building2 size={14} className="text-slate-400"/> {t.name}
                                </label>
                                <input 
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="e.g. OmniFactory Ltd."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                    <LinkIcon size={14} className="text-slate-400"/> {t.website}
                                </label>
                                <input 
                                  name="website"
                                  value={formData.website || ''}
                                  onChange={handleChange}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder={t.websitePlaceholder}
                                />
                            </div>
                        </div>

                        {/* Core Products & Advantages */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Package size={14} className="text-slate-400"/> {t.products}
                            </label>
                            <textarea 
                              name="products"
                              value={formData.products}
                              onChange={handleChange}
                              rows={2}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              placeholder={t.productsPlaceholder}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Star size={14} className="text-slate-400"/> {t.advantages}
                            </label>
                            <textarea 
                              name="advantages"
                              value={formData.advantages}
                              onChange={handleChange}
                              rows={2}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              placeholder={t.advantagesPlaceholder}
                            />
                        </div>

                        {/* Capacity, Markets, Certs (Grid) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                    <Gauge size={14} className="text-slate-400"/> {t.capacity}
                                </label>
                                <input 
                                  name="capacity"
                                  value={formData.capacity || ''}
                                  onChange={handleChange}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder={t.capacityPlaceholder}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                    <Globe size={14} className="text-slate-400"/> {t.targetMarkets}
                                </label>
                                <input 
                                  name="targetMarkets"
                                  value={formData.targetMarkets || ''}
                                  onChange={handleChange}
                                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder={t.marketsPlaceholder}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Award size={14} className="text-slate-400"/> {t.certifications}
                            </label>
                            <input 
                              name="certifications"
                              value={formData.certifications || ''}
                              onChange={handleChange}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder={t.certPlaceholder}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Trophy size={14} className="text-slate-400"/> {t.keyClients}
                            </label>
                            <input 
                              name="keyClients"
                              value={formData.keyClients || ''}
                              onChange={handleChange}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder={t.clientsPlaceholder}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Briefcase size={14} className="text-slate-400"/> {t.policy}
                            </label>
                            <input 
                              name="policy"
                              value={formData.policy}
                              onChange={handleChange}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder={t.policyPlaceholder}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Add Product Form */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Plus size={16} /> {t.addProduct}
                            </h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <input 
                                    placeholder={t.prodName}
                                    className="p-2 border border-slate-200 rounded-lg text-xs"
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                />
                                <input 
                                    placeholder={t.prodSKU}
                                    className="p-2 border border-slate-200 rounded-lg text-xs"
                                    value={newProduct.sku}
                                    onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                                />
                            </div>
                            <input 
                                placeholder={t.prodPoints}
                                className="w-full p-2 border border-slate-200 rounded-lg text-xs mb-3"
                                value={newProduct.sellingPoints}
                                onChange={e => setNewProduct({...newProduct, sellingPoints: e.target.value})}
                            />
                            <div className="flex gap-3">
                                <input 
                                    placeholder={t.prodMOQ}
                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                                    value={newProduct.moq}
                                    onChange={e => setNewProduct({...newProduct, moq: e.target.value})}
                                />
                                <button 
                                    type="button"
                                    onClick={handleAddProduct}
                                    disabled={!newProduct.name}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {t.addProduct}
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-2">
                            {(formData.productsList || []).length === 0 ? (
                                <div className="text-center text-slate-400 text-xs py-4 italic">
                                    {t.noProducts}
                                </div>
                            ) : (
                                (formData.productsList || []).map((prod) => (
                                    <div key={prod.id} className="flex items-start justify-between bg-white border border-slate-100 p-3 rounded-lg hover:border-indigo-100 transition-colors shadow-sm">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag size={14} className="text-indigo-500" />
                                                <span className="font-bold text-sm text-slate-800">{prod.name}</span>
                                                {prod.sku && <span className="text-xs bg-slate-100 px-1.5 rounded text-slate-500">{prod.sku}</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{prod.sellingPoints}</p>
                                            {prod.moq && <p className="text-[10px] text-slate-400 mt-1">MOQ: {prod.moq}</p>}
                                        </div>
                                        <button type="button" onClick={() => handleDeleteProduct(prod.id)} className="text-slate-300 hover:text-red-500 p-1">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'knowledge' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                             <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <FileText size={14} className="text-slate-400"/> {t.knowledgeBase}
                            </label>
                            <textarea 
                              name="knowledgeBase"
                              value={formData.knowledgeBase || ''}
                              onChange={handleChange}
                              rows={6}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none leading-relaxed"
                              placeholder={t.knowledgePlaceholder}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
                                <ImageIcon size={14} className="text-slate-400"/> {t.upload}
                            </label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl p-6 text-center cursor-pointer transition-all"
                            >
                                <Upload className="mx-auto text-slate-400 mb-2" />
                                <span className="text-xs text-slate-500">{t.uploadDesc}</span>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                />
                            </div>

                            {formData.images && formData.images.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                            <img src={img} alt={`asset-${i}`} className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            {/* Import/Export Tools */}
            <div className="flex gap-2">
                <input 
                    type="file" 
                    accept=".json" 
                    ref={configInputRef} 
                    className="hidden" 
                    onChange={handleImport} 
                />
                <button 
                    type="button" 
                    onClick={() => configInputRef.current?.click()} 
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                    title={t.import}
                >
                    <Upload size={18} />
                </button>
                <button 
                    type="button" 
                    onClick={handleExport}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                    title={t.export}
                >
                    <Download size={18} />
                </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg font-medium">
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit} 
                    className={`px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all ${saved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                    {saved ? <Check size={16} /> : <Save size={16} />}
                    {saved ? t.saved : t.save}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
