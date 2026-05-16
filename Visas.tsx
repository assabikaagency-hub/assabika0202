import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Globe, Star, MapPin, Languages, Coins, Clock, Users, 
  ChevronRight, Info, FileText, CreditCard, HelpCircle, UserPlus, 
  Send, Phone, Mail, ExternalLink, Calendar, 
  Map as MapIcon, GraduationCap, Building, 
  CheckCircle2, AlertCircle, Eye, Download, Printer, RefreshCw,
  ArrowRightLeft, Timer, Plus, Pencil, Trash2, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Country {
  id: number;
  name_fr: string;
  name_ar: string;
  name_en: string;
  category: string;
  flag_emoji: string;
  flag_image_url: string;
  capital_fr: string;
  capital_ar: string;
  capital_en: string;
  language_fr: string;
  language_ar: string;
  language_en: string;
  currency: string;
  timezone: string;
  population: string;
  calling_code: string;
  landmark_image_url: string;
}

interface VisaType {
  id: number;
  country_id: number;
  visa_type_fr: string;
  visa_type_ar: string;
  visa_type_en: string;
  validity_days: number;
  max_stay_days: number;
  entries: string;
  processing_normal_days: number;
  processing_urgent_days: number;
  processing_super_urgent_days: number;
}

interface VisaRequirement {
  id: number;
  visa_type_id: number;
  document_name_fr: string;
  document_name_ar: string;
  is_required: boolean;
  specifications_fr: string;
  specifications_ar: string;
  format_accepted: string;
  file_size_limit: string;
}

interface VisaPricing {
  id: number;
  visa_type_id: number;
  processing_speed: string;
  visa_fee: number;
  service_fee: number;
  total_price: number;
}

export default function Visas() {
  const { t } = useTranslation();
  const { language, dir } = useLanguage();
  const { hasPermission } = useAuth();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'categories' | 'countries' | 'country-detail' | 'visa-detail'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<any>(null);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [clients, setClients] = useState<any[]>([]);
  const [linkedClients, setLinkedClients] = useState<any[]>([]);
  const [requestForm, setRequestForm] = useState({
    client_id: '',
    processing_speed: 'normal',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) setClients(await res.json());
    } catch (e) {
      console.error('Failed to fetch clients', e);
    }
  };

  const fetchLinkedClients = async (visaTypeId: string) => {
    try {
      const res = await fetch(`/api/visa-requests/type/${visaTypeId}`);
      if (res.ok) setLinkedClients(await res.json());
    } catch (e) {
      console.error('Failed to fetch linked clients', e);
    }
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.client_id || !selectedVisa) return;
    try {
      setSubmitting(true);
      const price = selectedVisa.pricing.find((p: any) => p.processing_speed === requestForm.processing_speed)?.total_price || 0;
      const res = await fetch('/api/visa-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: requestForm.client_id,
          visa_type_id: selectedVisa.visaType.id,
          processing_speed: requestForm.processing_speed,
          total_price: price,
          notes: requestForm.notes
        })
      });
      if (res.ok) {
        alert('Visa request created successfully!');
        setRequestForm({ client_id: '', processing_speed: 'normal', notes: '' });
        fetchLinkedClients(selectedVisa.visaType.id);
        setActiveTab('clients');
      }
    } catch (e) {
      console.error('Failed to submit request', e);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedVisa) {
      fetchLinkedClients(selectedVisa.visaType.id);
      fetchClients();
    }
  }, [selectedVisa]);


  // Modal states
  const [modalType, setModalType] = useState<'country' | 'visa-type' | 'requirement' | 'pricing' | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      fetchVisaTypes(selectedCountry.id);
    }
  }, [selectedCountry]);

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/visa-countries');
      const data = await response.json();
      setCountries(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching countries:', error);
      setLoading(false);
    }
  };

  const fetchVisaTypes = async (countryId: number) => {
    try {
      const response = await fetch(`/api/visa-types/${countryId}`);
      const data = await response.json();
      setVisaTypes(data);
    } catch (error) {
      console.error('Error fetching visa types:', error);
    }
  };

  const fetchVisaDetails = async (visaId: number) => {
    try {
      const response = await fetch(`/api/visa-details/${visaId}`);
      const data = await response.json();
      setSelectedVisa(data);
      setView('visa-detail');
      setActiveTab('info');
    } catch (error) {
      console.error('Error fetching visa details:', error);
    }
  };

  const deleteCountry = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الدولة؟' : 'Are you sure you want to delete this country?')) return;
    try {
      await fetch(`/api/visa-countries/${id}`, { method: 'DELETE' });
      fetchCountries();
      if (selectedCountry?.id === id) setView('countries');
    } catch (error) {
      console.error('Error deleting country:', error);
    }
  };

  const deleteVisaType = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا النوع؟' : 'Are you sure you want to delete this visa type?')) return;
    try {
      await fetch(`/api/visa-types/${id}`, { method: 'DELETE' });
      if (selectedCountry) fetchVisaTypes(selectedCountry.id);
    } catch (error) {
      console.error('Error deleting visa type:', error);
    }
  };

  const deleteRequirement = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المستند؟' : 'Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/visa-requirements/${id}`, { method: 'DELETE' });
      if (selectedVisa) fetchVisaDetails(selectedVisa.visaType.id);
    } catch (error) {
      console.error('Error deleting requirement:', error);
    }
  };

  const filteredCountries = countries.filter(c => {
    const matchesCategory = selectedCategory ? c.category === selectedCategory : true;
    const matchesSearch = searchQuery === '' || 
      c.name_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name_ar.includes(searchQuery) ||
      c.name_en.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatPrice = (amount: number) => {
    return amount.toLocaleString('en-US') + ' DZD';
  };

  const getCountryCount = (category: string) => countries.filter(c => c.category === category).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-1/2 bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold/20 rounded-lg">
              <Globe className="text-gold w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              {language === 'ar' ? 'منطقة التأشيرات' : 'VISAS SECTION'}
            </h1>
          </div>
          <p className="text-white/40 max-w-xl text-lg">
            {language === 'ar' 
              ? 'تصفح معلومات التأشيرات والمتطلبات والأسعار لجميع الوجهات العالمية.' 
              : 'Browse visa information, requirements, and pricing for global destinations.'}
          </p>
        </div>

        <div className="relative md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
          <input 
            type="text"
            placeholder={language === 'ar' ? 'بحث عن دولة...' : 'Search for a country...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (view === 'categories') {
                setSelectedCategory(null);
                setView('countries');
              }
            }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all text-lg"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Categories View */}
        {view === 'categories' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { id: 'Schengen', name: language === 'ar' ? 'دول شينغن' : 'Pays Schengen', en: 'Schengen Countries', count: getCountryCount('Schengen'), icon: Star, color: 'from-blue-600 to-blue-900', flag: '🇪🇺' },
              { id: 'Other', name: language === 'ar' ? 'دول أخرى' : 'Autres Pays', en: 'Other Countries', count: getCountryCount('Other'), icon: Globe, color: 'from-emerald-600 to-emerald-900', flag: '🌍' },
              { id: 'Arab', name: language === 'ar' ? 'دول عربية' : 'Pays Arabes', en: 'Arab Countries', count: getCountryCount('Arab'), icon: Building, color: 'from-gold/40 to-gold/20', flag: '☪️' }
            ].map(cat => (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setView('countries');
                }}
                className={`relative group h-[350px] rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col items-center justify-center p-8 bg-gradient-to-br ${cat.color} shadow-2xl`}
              >
                <div className="absolute inset-0 bg-navy/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute top-6 right-6">
                   <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-white/80 border border-white/10">
                     {cat.count} {language === 'ar' ? 'وجهة' : 'DESTINATIONS'}
                   </span>
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="text-7xl mb-6 drop-shadow-2xl">{cat.flag}</div>
                  <h3 className="text-2xl font-black text-white mb-2 leading-tight uppercase tracking-[0.2em]">{cat.name}</h3>
                  <p className="text-white/60 font-bold tracking-widest text-xs uppercase">{cat.en}</p>
                </div>
                <div className="absolute bottom-8 flex items-center gap-2 text-white/40 group-hover:text-white transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">Explore Region</span>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Countries list view */}
        {view === 'countries' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  setView('categories');
                  setSelectedCategory(null);
                }}
                className="flex items-center gap-2 text-white/50 hover:text-gold transition-colors font-bold uppercase tracking-tighter"
              >
                <ChevronRight className={`rotate-180 w-5 h-5`} />
                {language === 'ar' ? 'العودة للتصنيفات' : 'BACK TO CATEGORIES'}
              </button>
              
              <div className="flex items-center gap-4">
                {hasPermission('visas', 'add') && (
                  <button 
                    onClick={() => {
                      setModalMode('add');
                      setModalType('country');
                      setEditingItem({ category: selectedCategory || 'Other' });
                    }}
                    className="px-6 py-2.5 bg-gold text-navy rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة دولة' : 'Add Country'}
                  </button>
                )}
                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">
                  Showing: <span className="text-gold font-black">{selectedCategory || (language === 'ar' ? 'الكل' : 'All')}</span>
                </span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/30 border border-white/10">
                  {filteredCountries.length} {language === 'ar' ? 'بلد' : 'COUNTRIES'}
                </span>
              </div>
            </div>

            {selectedCategory === 'Schengen' && (
              <div className="bg-blue-900/40 border border-blue-500/30 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
                  <div className="flex gap-2 mb-6">
                    {[...Array(12)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                  <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase drop-shadow-lg">
                    {language === 'ar' ? 'الفضاء الأوروبي شينغن' : 'ESPACE SCHENGEN EUROPE'}
                  </h2>
                  <div className="flex items-center gap-10">
                    <div className="w-20 h-px bg-white/20" />
                    <p className="text-blue-200/80 text-xl font-bold uppercase tracking-[0.4em]">29 PAYS - 29 COUNTRIES</p>
                    <div className="w-20 h-px bg-white/20" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCountries.map(c => (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => {
                    setSelectedCountry(c);
                    setView('country-detail');
                  }}
                  className="bg-white/5 border border-white/5 hover:border-gold/40 rounded-[2rem] p-8 flex items-center gap-8 cursor-pointer transition-all hover:bg-white/10 group relative overflow-hidden"
                >
                  {/* Popular Badge */}
                  {['France', 'Espagne', 'Italie', 'États-Unis', 'Turquie', 'Maroc', 'Arabie Saoudite', 'Émirats Arabes Unis'].includes(c.name_fr) && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-gold/20 text-gold text-[8px] font-black uppercase rounded-lg border border-gold/20">
                      Popular
                    </div>
                  )}

                  <div className="text-6xl drop-shadow-xl group-hover:scale-125 transition-transform duration-500">{c.flag_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-black text-white truncate mb-2 group-hover:text-gold transition-colors">
                      {language === 'ar' ? c.name_ar : (language === 'fr' ? c.name_fr : c.name_en)}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black text-white/30 uppercase tracking-[0.1em]">
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold/40" /> {language === 'ar' ? c.capital_ar : c.capital_en}</span>
                      <span className="flex items-center gap-2"><Languages className="w-3.5 h-3.5 text-gold/40" /> {language === 'ar' ? c.language_ar : c.language_en}</span>
                      <span className="flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-gold/40" /> {c.currency}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {hasPermission('visas', 'edit') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(c);
                          setModalMode('edit');
                          setModalType('country');
                        }}
                        className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-white/50 hover:text-gold transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission('visas', 'delete') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCountry(c.id);
                        }}
                        className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-white/30 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-gold group-hover:text-navy transition-all duration-300">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Country detail view */}
        {view === 'country-detail' && selectedCountry && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setView('countries')}
              className="flex items-center gap-2 text-white/50 hover:text-gold transition-colors font-bold uppercase tracking-tighter"
            >
              <ChevronRight className={`rotate-180 w-5 h-5`} />
              {language === 'ar' ? 'العودة للقائمة' : 'BACK TO LIST'}
            </button>

            {/* Country Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                <div className="h-64 relative">
                  <img 
                    src={selectedCountry.landmark_image_url || 'https://picsum.photos/1200/600'} 
                    alt={selectedCountry.name_en}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                  <div className="absolute bottom-8 left-8 flex items-end gap-6">
                    <div className="text-8xl bg-white/10 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-white/10">
                      {selectedCountry.flag_emoji}
                    </div>
                    <div>
                      <h2 className="text-5xl font-black text-white mb-2">
                        {selectedCountry.name_fr} | {selectedCountry.name_ar}
                      </h2>
                      <p className="text-gold font-bold uppercase tracking-[0.3em] text-sm">
                        {selectedCountry.name_en} - {selectedCountry.category} Destination
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { icon: MapPin, label: language === 'ar' ? 'العاصمة' : 'Capital', val: language === 'ar' ? selectedCountry.capital_ar : selectedCountry.capital_en },
                    { icon: Languages, label: language === 'ar' ? 'اللغة' : 'Language', val: language === 'ar' ? selectedCountry.language_ar : selectedCountry.language_en },
                    { icon: Coins, label: language === 'ar' ? 'العملة' : 'Currency', val: selectedCountry.currency },
                    { icon: Clock, label: language === 'ar' ? 'التوقيت' : 'Timezone', val: selectedCountry.timezone },
                    { icon: Users, label: language === 'ar' ? 'السكان' : 'Population', val: selectedCountry.population },
                    { icon: Phone, label: language === 'ar' ? 'رمز الاتصال' : 'Calling Code', val: `+${selectedCountry.calling_code}` },
                  ].map((info, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <info.icon className="w-6 h-6 text-gold shrink-0" />
                      <div>
                        <p className="text-white/30 text-xs font-black uppercase mb-1">{info.label}</p>
                        <p className="text-white font-bold">{info.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gold p-8 rounded-[2rem] text-navy">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">
                      {language === 'ar' ? 'تأشيرات متاحة' : 'Available Visas'}
                    </h3>
                    {hasPermission('visas', 'add') && (
                      <button 
                        onClick={() => {
                          setEditingItem({ country_id: selectedCountry.id });
                          setModalMode('add');
                          setModalType('visa-type');
                        }}
                        className="p-2 bg-navy/10 rounded-lg hover:bg-navy/20 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {visaTypes.length === 0 && (
                      <p className="text-navy/40 font-bold text-center text-sm italic py-4">
                        {language === 'ar' ? 'لا يوجد أنواع تأشيرات مضافة بعد.' : 'No visa types added yet.'}
                      </p>
                    )}
                    {visaTypes.map(v => (
                      <div key={v.id} className="relative group/btn">
                        <button
                          onClick={() => fetchVisaDetails(v.id)}
                          className="w-full bg-navy/10 hover:bg-navy/20 p-5 pr-20 rounded-2xl flex items-center justify-between transition-all group"
                        >
                          <div className="text-left rtl:text-right">
                            <p className="font-black text-lg">{language === 'ar' ? v.visa_type_ar : (language === 'fr' ? v.visa_type_fr : v.visa_type_en)}</p>
                            <p className="text-navy/50 text-xs font-bold uppercase">{v.validity_days} Days Validity • {v.entries}</p>
                          </div>
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                          {hasPermission('visas', 'edit') && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItem(v);
                                setModalMode('edit');
                                setModalType('visa-type');
                              }}
                              className="p-2 bg-navy/10 rounded-lg hover:bg-navy/20"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('visas', 'delete') && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVisaType(v.id);
                              }}
                              className="p-2 bg-navy/10 rounded-lg hover:bg-red-500/20 text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem]">
                  <h3 className="text-xl font-black text-white/50 mb-6 uppercase tracking-tighter">
                    {language === 'ar' ? 'معلومات السفارة' : 'Embassy Info'}
                  </h3>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <Building className="w-5 h-5 text-gold shrink-0" />
                      <p className="text-sm border-b border-white/5 pb-2 w-full">Ambassade de {selectedCountry.name_fr} à Alger</p>
                    </div>
                    <div className="flex gap-4">
                      <MapPin className="w-5 h-5 text-gold shrink-0" />
                      <p className="text-sm border-b border-white/5 pb-2 w-full">Hydra, Alger, Algérie</p>
                    </div>
                    <div className="flex gap-4">
                      <Phone className="w-5 h-5 text-gold shrink-0" />
                      <p className="text-sm border-b border-white/5 pb-2 w-full">+213 21 XX XX XX</p>
                    </div>
                    <div className="flex gap-4">
                      <Mail className="w-5 h-5 text-gold shrink-0" />
                      <p className="text-sm border-b border-white/5 pb-2 w-full">contact@{selectedCountry.name_en.toLowerCase().replace(' ', '')}.embassy</p>
                    </div>
                    <button className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2 font-black uppercase text-xs">
                      <MapIcon className="w-4 h-4" /> {language === 'ar' ? 'عرض على الخريطة' : 'View map'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Visa detail view with Tabs */}
        {view === 'visa-detail' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setView('country-detail')}
                className="flex items-center gap-2 text-white/50 hover:text-gold transition-colors font-bold uppercase tracking-tighter"
              >
                <ChevronRight className={`rotate-180 w-5 h-5`} />
                {language === 'ar' ? 'العودة للدولة' : 'BACK TO COUNTRY'}
              </button>

              <div className="flex gap-2">
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <Printer className="w-5 h-5" />
                </button>
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
              <div className="p-8 bg-gradient-to-r from-gold/20 to-transparent border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-6xl">{selectedCountry?.flag_emoji}</div>
                  <div>
                    <h2 className="text-3xl font-black text-white">TOURIST VISA / تأشيرة سياحية</h2>
                    <p className="text-gold font-bold uppercase tracking-widest text-sm">Destination: {selectedCountry?.name_en} • 90 Days Validity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/20 uppercase tracking-[0.2em] text-xs font-black mb-1">Estimated Starting Price</p>
                  <p className="text-4xl font-black text-gold">
                    {selectedVisa?.pricing?.[0] ? formatPrice(selectedVisa.pricing[0].total_price) : '---'}
                  </p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex overflow-x-auto border-b border-white/10">
                {[
                  { id: 'info', icon: Info, label: language === 'ar' ? 'معلومات' : 'Information' },
                  { id: 'docs', icon: FileText, label: language === 'ar' ? 'الوثائق' : 'Documents' },
                  { id: 'pricing', icon: CreditCard, label: language === 'ar' ? 'الأسعار' : 'Pricing' },
                  { id: 'process', icon: ChevronRight, label: language === 'ar' ? 'العملية' : 'Process' },
                  { id: 'clients', icon: Users, label: language === 'ar' ? 'العملاء' : 'Clients' },
                  { id: 'form', icon: Send, label: language === 'ar' ? 'طلب' : 'Request' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-8 py-6 whitespace-nowrap transition-all border-b-2 font-black uppercase text-xs tracking-widest ${
                      activeTab === tab.id ? 'border-gold text-gold bg-gold/5' : 'border-transparent text-white/40 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-10">
                {activeTab === 'info' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      { icon: Calendar, label: 'Validity', val: '90 Days' },
                      { icon: Clock, label: 'Max Stay', val: '30 Days' },
                      { icon: ArrowRightLeft, label: 'Entries', val: 'Single' },
                      { icon: Timer, label: 'Processing', val: '5-10 Days' },
                    ].map((item, i) => {
                       const Icon = item.icon || Info;
                       return (
                      <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5">
                        <Icon className="w-8 h-8 text-gold mb-4" />
                        <p className="text-white/30 text-xs font-black uppercase mb-1">{item.label}</p>
                        <p className="text-xl font-black text-white">{item.val}</p>
                      </div>
                    )})}
                  </div>
                )}

                {activeTab === 'docs' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">{language === 'ar' ? 'المستندات المطلوبة' : 'Required Documents'}</h3>
                      {hasPermission('visas', 'add') && (
                        <button 
                          onClick={() => {
                            setEditingItem({ visa_type_id: selectedVisa.visaType.id, is_required: true });
                            setModalMode('add');
                            setModalType('requirement');
                          }}
                          className="px-4 py-2 bg-gold text-navy rounded-xl font-bold flex items-center gap-2 text-sm"
                        >
                          <Plus className="w-4 h-4" /> {language === 'ar' ? 'إضافة مستند' : 'Add Document'}
                        </button>
                      )}
                    </div>
                    {selectedVisa?.requirements.map((d: any, i: number) => (
                      <div key={i} className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${d.is_required ? 'bg-gold/10 text-gold' : 'bg-white/5 text-white/20'}`}>
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-black">{language === 'ar' ? d.document_name_ar : d.document_name_fr}</h4>
                            {d.is_required && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Required</span>}
                          </div>
                          <p className="text-white/40 text-sm mt-1">{language === 'ar' ? d.specifications_ar : d.specifications_fr}</p>
                        </div>
                        <div className="flex gap-2">
                          {hasPermission('visas', 'edit') && (
                            <button 
                              onClick={() => {
                                setEditingItem(d);
                                setModalMode('edit');
                                setModalType('requirement');
                              }}
                              className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gold"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission('visas', 'delete') && (
                            <button 
                              onClick={() => deleteRequirement(d.id)}
                              className="p-2 bg-white/5 rounded-lg hover:bg-red-500/20 text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {selectedVisa?.requirements.length === 0 && (
                      <div className="py-10 text-center text-white/20 italic font-bold">
                        {language === 'ar' ? 'لا يوجد مستندات مضافة.' : 'No documents added for this visa yet.'}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'pricing' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">{language === 'ar' ? 'جدول الأسعار' : 'Pricing Table'}</h3>
                      {hasPermission('visas', 'edit') && (
                        <button 
                          onClick={() => {
                            setModalType('pricing');
                            setEditingItem({ pricing: selectedVisa.pricing });
                          }}
                          className="px-4 py-2 bg-gold text-navy rounded-xl font-bold flex items-center gap-2 text-sm"
                        >
                          <Pencil className="w-4 h-4" /> {language === 'ar' ? 'تعديل الأسعار' : 'Edit Pricing'}
                        </button>
                      )}
                    </div>
                    <div className="overflow-hidden rounded-3xl border border-white/10">
                      <table className="w-full text-left rtl:text-right">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="p-6 text-xs font-black text-white/30 uppercase tracking-widest">Processing Speed</th>
                            <th className="p-6 text-xs font-black text-white/30 uppercase tracking-widest">Visa Fee (DZD)</th>
                            <th className="p-6 text-xs font-black text-white/30 uppercase tracking-widest">Service Fee (DZD)</th>
                            <th className="p-6 text-xs font-black text-white/30 uppercase tracking-widest">Total (DZD)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedVisa?.pricing.map((p: any, i: number) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              <td className="p-6 font-black text-white capitalize">{p.processing_speed}</td>
                              <td className="p-6 text-white/60">{formatPrice(p.visa_fee)}</td>
                              <td className="p-6 text-white/60">{formatPrice(p.service_fee)}</td>
                              <td className="p-6 text-2xl font-black text-gold">{formatPrice(p.total_price)}</td>
                            </tr>
                          ))}
                          {selectedVisa?.pricing.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-10 text-center text-white/20 italic font-bold">
                                {language === 'ar' ? 'لم يتم تحديد أسعار بعد لهذا النوع.' : 'No pricing set yet for this visa type.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'process' && (
                  <div className="space-y-8 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-1 before:bg-white/10 rtl:before:left-auto rtl:before:right-8">
                    {[
                      { title: 'Gather documents', desc: 'Collect all required documents as per the list.' },
                      { title: 'Fill application', desc: 'Fill the official online application form.' },
                      { title: 'Schedule appointment', desc: 'Book your slot at the embassy or visa center.' },
                      { title: 'Submit & Pay', desc: 'Present your file and pay the required fees.' },
                      { title: 'Collection', desc: 'Pick up your passport once processing is complete.' },
                    ].map((step, i) => (
                      <div key={i} className="flex gap-12 items-start relative z-10 rtl:flex-row-reverse">
                        <div className="w-16 h-16 rounded-full bg-navy border-4 border-gold/40 flex items-center justify-center shrink-0 font-black text-xl text-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                          {i + 1}
                        </div>
                        <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex-1">
                          <h4 className="text-xl font-black mb-1">{step.title}</h4>
                          <p className="text-white/40">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'clients' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">{language === 'ar' ? 'العملاء المرتبطين' : 'Linked Clients'}</h3>
                      <button 
                         onClick={() => setActiveTab('form')}
                         className="flex items-center gap-2 px-6 py-3 bg-gold text-navy rounded-xl font-bold text-sm"
                      >
                        <UserPlus className="w-4 h-4" /> {language === 'ar' ? 'ربط عميل' : 'Link Client'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {linkedClients.length > 0 ? linkedClients.map((req: any) => (
                        <div key={req.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-gold/30 transition-all group">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-black">
                                    {req.first_name[0]}{req.last_name[0]}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-white">{req.first_name} {req.last_name}</h4>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{req.passport_number}</p>
                                 </div>
                              </div>
                              <span className="px-2 py-1 bg-gold/10 text-gold rounded text-[10px] font-black uppercase tracking-widest border border-gold/20">
                                 {req.status}
                              </span>
                           </div>
                           <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                              <p className="text-[10px] text-white/20 uppercase font-black">Ref: {req.request_number}</p>
                              <button className="text-xs font-bold text-gold hover:underline">View Tracking</button>
                           </div>
                        </div>
                      )) : (
                        <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
                          <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                          <p className="text-white/30 font-bold uppercase tracking-widest text-xs">No clients linked to this visa type yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'form' && (
                  <div className="max-w-2xl mx-auto space-y-8">
                     <div className="bg-gold/10 border border-gold/30 p-6 rounded-3xl flex items-start gap-4">
                      <AlertCircle className="w-6 h-6 text-gold shrink-0 mt-1" />
                      <div>
                        <h4 className="text-gold font-black uppercase text-sm mb-1">Official Application Note</h4>
                        <p className="text-white/60 text-sm italic">"Please ensure all data matches the passport exactly. Any mismatch will result in immediate rejection by the embassy authorities."</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Select Client</label>
                          <select 
                            value={requestForm.client_id}
                            onChange={e => setRequestForm({...requestForm, client_id: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-gold/50 outline-none text-white font-bold"
                          >
                            <option value="">Choose a client...</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.passport_number})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Processing Speed</label>
                          <select 
                            value={requestForm.processing_speed}
                            onChange={e => setRequestForm({...requestForm, processing_speed: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-gold/50 outline-none text-white font-bold"
                          >
                            <option value="normal">Normal (Standard)</option>
                            <option value="urgent">Urgent (+Premium)</option>
                            <option value="super">Super Urgent (Expedited)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-black text-white/40 uppercase tracking-widest ml-1">Admin Notes</label>
                         <textarea 
                           value={requestForm.notes}
                           onChange={e => setRequestForm({...requestForm, notes: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-xl p-4 h-32 resize-none focus:ring-2 focus:ring-gold/50 outline-none text-white"
                           placeholder="Enter internal processing notes..."
                         />
                      </div>

                      <button 
                        onClick={handleSubmitRequest}
                        disabled={submitting || !requestForm.client_id}
                        className="w-full py-5 bg-gold text-navy font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {submitting ? 'PROCESSING...' : 'SUBMIT NEW VISA REQUEST'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VisaModals 
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
        mode={modalMode}
        item={editingItem}
        onSuccess={() => {
          setModalType(null);
          fetchCountries();
          if (selectedCountry) fetchVisaTypes(selectedCountry.id);
          if (selectedVisa) fetchVisaDetails(selectedVisa.visaType.id);
        }}
      />
    </div>
  );
}

function VisaModals({ isOpen, onClose, type, mode, item, onSuccess }: any) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (item) setFormData(item);
    else setFormData({});
  }, [item]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '';
    let method = mode === 'add' ? 'POST' : 'PUT';

    if (type === 'country') {
      url = mode === 'add' ? '/api/visa-countries' : `/api/visa-countries/${formData.id}`;
    } else if (type === 'visa-type') {
      url = mode === 'add' ? '/api/visa-types' : `/api/visa-types/${formData.id}`;
    } else if (type === 'requirement') {
      url = mode === 'add' ? '/api/visa-requirements' : `/api/visa-requirements/${formData.id}`;
    } else if (type === 'pricing') {
      url = `/api/visa-pricing/${formData.id || formData.visa_type_id}`;
      method = 'PUT';
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-2xl bg-navy border border-gold/20 rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/30 hover:text-white transition-colors">
          <X className="w-8 h-8" />
        </button>

        <h2 className="text-3xl font-black text-white mb-8 border-b border-gold/20 pb-4 uppercase tracking-tighter">
          {mode === 'add' ? (language === 'ar' ? 'إضافة' : 'ADD') : (language === 'ar' ? 'تعديل' : 'EDIT')} {type?.replace('-', ' ').toUpperCase()}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {type === 'country' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name (FR)" value={formData.name_fr} onChange={v => setFormData({...formData, name_fr: v})} />
              <Input label="Name (AR)" value={formData.name_ar} onChange={v => setFormData({...formData, name_ar: v})} dir="rtl" />
              <Input label="Name (EN)" value={formData.name_en} onChange={v => setFormData({...formData, name_en: v})} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-gold/50 transition-all font-bold"
                >
                  <option value="Schengen">Schengen</option>
                  <option value="Other">Other</option>
                  <option value="Arab">Arab</option>
                </select>
              </div>
              <Input label="Flag Emoji" value={formData.flag_emoji} onChange={v => setFormData({...formData, flag_emoji: v})} />
              <Input label="Capital (FR)" value={formData.capital_fr} onChange={v => setFormData({...formData, capital_fr: v})} />
              <Input label="Official Language (FR)" value={formData.language_fr} onChange={v => setFormData({...formData, language_fr: v})} />
              <Input label="Currency" value={formData.currency} onChange={v => setFormData({...formData, currency: v})} />
              <Input label="Landmark Image URL" value={formData.landmark_image_url} onChange={v => setFormData({...formData, landmark_image_url: v})} colSpan={2} />
            </div>
          )}

          {type === 'visa-type' && (
            <div className="space-y-4">
              <Input label="Visa Type (FR)" value={formData.visa_type_fr} onChange={v => setFormData({...formData, visa_type_fr: v})} />
              <Input label="Visa Type (AR)" value={formData.visa_type_ar} onChange={v => setFormData({...formData, visa_type_ar: v})} dir="rtl" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Validity (Days)" type="number" value={formData.validity_days} onChange={v => setFormData({...formData, validity_days: v})} />
                <Input label="Max Stay (Days)" type="number" value={formData.max_stay_days} onChange={v => setFormData({...formData, max_stay_days: v})} />
                <Input label="Entries (e.g. Single)" value={formData.entries} onChange={v => setFormData({...formData, entries: v})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Normal Processing (Days)" type="number" value={formData.processing_normal_days} onChange={v => setFormData({...formData, processing_normal_days: v})} />
                <Input label="Urgent (Days)" type="number" value={formData.processing_urgent_days} onChange={v => setFormData({...formData, processing_urgent_days: v})} />
                <Input label="Super Urgent (Days)" type="number" value={formData.processing_super_urgent_days} onChange={v => setFormData({...formData, processing_super_urgent_days: v})} />
              </div>
            </div>
          )}

          {type === 'requirement' && (
            <div className="space-y-4">
              <Input label="Document Name (FR)" value={formData.document_name_fr} onChange={v => setFormData({...formData, document_name_fr: v})} />
              <Input label="Document Name (AR)" value={formData.document_name_ar} onChange={v => setFormData({...formData, document_name_ar: v})} dir="rtl" />
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={formData.is_required} 
                  onChange={e => setFormData({...formData, is_required: e.target.checked})} 
                  id="chkReq"
                />
                <label className="text-white font-bold" htmlFor="chkReq">Is Required?</label>
              </div>
              <Input label="Specifications (FR)" value={formData.specifications_fr} onChange={v => setFormData({...formData, specifications_fr: v})} />
              <Input label="Specifications (AR)" value={formData.specifications_ar} onChange={v => setFormData({...formData, specifications_ar: v})} dir="rtl" />
            </div>
          )}

          {type === 'pricing' && (
            <div className="space-y-6">
              {['normal', 'urgent', 'super'].map(speed => {
                const p = formData.pricing?.find((pr: any) => pr.processing_speed === speed) || { processing_speed: speed, visa_fee: 0, service_fee: 0 };
                return (
                  <div key={speed} className="p-4 bg-white/5 rounded-2xl space-y-4">
                    <h4 className="text-gold font-black uppercase text-xs tracking-widest">{speed} Processing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Visa Fee (DZD)" 
                        type="number" 
                        value={p.visa_fee} 
                        onChange={v => {
                          const newPricing = [...(formData.pricing || [])];
                          const idx = newPricing.findIndex((pr: any) => pr.processing_speed === speed);
                          if (idx >= 0) newPricing[idx].visa_fee = parseInt(v) || 0;
                          else newPricing.push({ processing_speed: speed, visa_fee: parseInt(v) || 0, service_fee: 0 });
                          setFormData({...formData, pricing: newPricing});
                        }} 
                      />
                      <Input 
                        label="Service Fee (DZD)" 
                        type="number" 
                        value={p.service_fee} 
                        onChange={v => {
                          const newPricing = [...(formData.pricing || [])];
                          const idx = newPricing.findIndex((pr: any) => pr.processing_speed === speed);
                          if (idx >= 0) newPricing[idx].service_fee = parseInt(v) || 0;
                          else newPricing.push({ processing_speed: speed, visa_fee: 0, service_fee: parseInt(v) || 0 });
                          setFormData({...formData, pricing: newPricing});
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-6 flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-2 py-4 bg-gold text-navy font-black rounded-xl hover:scale-[1.02] transition-all uppercase tracking-widest text-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", colSpan = 1, dir = "ltr" }: any) {
  return (
    <div className={`space-y-1 ${colSpan === 2 ? 'col-span-2' : ''}`} dir={dir}>
      <label className="text-[10px] font-black text-white/30 uppercase ml-2 tracking-widest">{label}</label>
      <input 
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-gold/50 transition-all font-bold"
      />
    </div>
  );
}
