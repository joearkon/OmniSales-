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
  const [newProduct, setNewProduct] = useState<Product>({ id: '', name: '', sku: '', sellingPoints: '', moq: '' });
  
  const t = TRANSLATIONS[lang].settings;

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          Array.from(e.target.files).forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                      setFormData(prev => ({ ...prev, images: [...(prev.images || []), reader.result as string].slice(0, 5) }));
                  }
              };
              reader.readAsDataURL(file as Blob);
          });
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddProduct = () => {
      if (!newProduct.name) return;
      setFormData(prev => ({ ...prev, productsList: [...(prev.productsList || []), { ...newProduct, id: `prod-${Date.now()}` }] }));
      setNewProduct({ id: '', name: '', sku: '', sellingPoints: '', moq: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b bg-slate-50"><h3 className="font-bold text-lg">{t.title}</h3><button onClick={onClose}><X size={20}/></button></div>
        <div className="flex border-b"><button onClick={() => setActiveTab('basic')} className={`flex-1 py-3 font-bold ${activeTab === 'basic' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>{t.tabs.basic}</button><button onClick={() => setActiveTab('products')} className={`flex-1 py-3 font-bold ${activeTab === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>{t.tabs.products}</button><button onClick={() => setActiveTab('knowledge')} className={`flex-1 py-3 font-bold ${activeTab === 'knowledge' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>{t.tabs.knowledge}</button></div>
        <div className="overflow-y-auto p-6 flex-grow">
            {activeTab === 'basic' && (
                <div className="space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Factory Name" className="w-full p-2 border rounded" />
                    <textarea name="products" value={formData.products} onChange={handleChange} placeholder="Core Products" className="w-full p-2 border rounded" />
                    <input name="capacity" value={formData.capacity || ''} onChange={handleChange} placeholder={t.capacityPlaceholder} className="w-full p-2 border rounded" />
                    <input name="certifications" value={formData.certifications || ''} onChange={handleChange} placeholder={t.certPlaceholder} className="w-full p-2 border rounded" />
                </div>
            )}
            {activeTab === 'products' && (
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border">
                        <div className="grid grid-cols-2 gap-3 mb-3"><input placeholder={t.prodName} value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-2 border rounded"/><input placeholder={t.prodSKU} value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="p-2 border rounded"/></div>
                        <input placeholder={t.prodPoints} value={newProduct.sellingPoints} onChange={e => setNewProduct({...newProduct, sellingPoints: e.target.value})} className="w-full p-2 border rounded mb-3"/>
                        <button onClick={handleAddProduct} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold text-xs">{t.addProduct}</button>
                    </div>
                    <div className="space-y-2">{(formData.productsList || []).map(p => <div key={p.id} className="bg-white border p-3 rounded flex justify-between"><div><span className="font-bold">{p.name}</span> <span className="text-xs text-slate-500">{p.sku}</span><p className="text-xs">{p.sellingPoints}</p></div></div>)}</div>
                </div>
            )}
            {activeTab === 'knowledge' && (
                <div className="space-y-4">
                    <textarea name="knowledgeBase" value={formData.knowledgeBase || ''} onChange={handleChange} rows={6} className="w-full p-3 border rounded" placeholder={t.knowledgePlaceholder} />
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed p-6 text-center cursor-pointer rounded"><Upload className="mx-auto"/><input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleImageUpload} /></div>
                    <div className="grid grid-cols-4 gap-2">{formData.images?.map((img, i) => <img key={i} src={img} className="w-full h-16 object-cover rounded" />)}</div>
                </div>
            )}
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded font-bold">{saved ? t.saved : t.save}</button></div>
      </div>
    </div>
  );
};