import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  Plane,
  Camera,
  Star,
  Hotel,
  Utensils,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Printer,
  Copy,
  Download,
  BarChart3,
  Users,
  ShieldCheck,
  TrendingUp,
  Image as ImageIcon,
  FileText,
  Trash2,
  Save,
  Check,
  Zap,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { logActivity, useAuth } from '../contexts/AuthContext';

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

interface Offer {
  id: string;
  title: {
    ar: string;
    fr: string;
    en: string;
  };
  category: 'internal_travel' | 'external_travel' | 'other_services';
  subcategory: string;
  reference_number: string;
  status: 'Active' | 'Inactive' | 'Coming Soon' | 'Completed';
  
  country: string;
  city: string;
  departure_city: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  duration_nights: number;
  season: 'Summer' | 'Winter' | 'Spring' | 'Autumn' | 'Ramadan';
  
  price_adult: number;
  price_child: number;
  price_infant: number;
  single_supplement: number;
  group_discount: number;
  early_bird_discount: number;
  last_minute_discount: number;
  included: string[];
  not_included: string[];
  deposit_amount: number;
  
  transport_type: 'Plane' | 'Bus' | 'Train' | 'Boat' | 'Car';
  airline: string;
  flight_number: string;
  departure_time: string;
  arrival_time: string;
  luggage_allowance: string;
  airport_transfers: boolean;
  
  hotel_name: string;
  hotel_stars: number;
  room_type: string;
  meal_plan: 'No meals' | 'Breakfast' | 'Half board' | 'Full board' | 'All inclusive';
  hotel_facilities: string[];
  
  itinerary: ItineraryDay[];
  
  is_partner_offer: boolean;
  partner_contract_id: string;
  partner_commission: number;
  
  main_image: string;
  gallery: string[];
  video_url: string;
  brochure_pdf: string;
  
  min_participants: number;
  max_participants: number;
  guide_languages: string[];
  difficulty_level: 'Easy' | 'Moderate' | 'Hard';
  suitable_for: string[];
  cancellation_policy: string;
  
  eco_friendly: boolean;
  group_size_type: 'Individual' | 'Small group' | 'Large group' | 'Private';
  pace: 'Relaxed' | 'Moderate' | 'Intensive';
  physical_rating: number;
  interests: string[];
  family_friendly_rating: number;
  luxury_level: 'Economy' | 'Standard' | 'Comfort' | 'Luxury' | 'Ultra-luxury';
  cancellation_flexibility: 'Flexible' | 'Moderate' | 'Strict';
  agent_commission: number;
  
  analytics?: {
    views: number;
    bookings: number;
    revenue: number;
  };
  created_at: any;
}

interface Contract {
  id: string;
  partner_name: string;
  contract_number: string;
  value?: string;
}

const Offers: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userRole, hasPermission } = useAuth();
  const currentLang = i18n.language as 'ar' | 'fr' | 'en';
  const [offers, setOffers] = useState<Offer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [analyticsView, setAnalyticsView] = useState(false);

  // Pricing Calculator State
  const [calcPassengers, setCalcPassengers] = useState({ adults: 1, children: 0, infants: 0 });

  const fetchOffers = async () => {
    if (!userRole) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/offers');
      if (resp.ok) {
        const data = await resp.json();
        setOffers(data);
      }
    } catch (e) {
      console.error('Fetch offers failed', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      const resp = await fetch('/api/contracts');
      if (resp.ok) {
        setContracts(await resp.json());
      }
    } catch (e) {
      console.error('Fetch contracts failed', e);
    }
  };

  useEffect(() => {
    fetchOffers();
    fetchContracts();
  }, [userRole]);

  const generateRef = () => `OFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const categories = [
    { id: 'all', label: 'All Offers' },
    { id: 'internal_travel', label: 'Internal Travel' },
    { id: 'external_travel', label: 'External Travel' },
    { id: 'other_services', label: 'Other Services' },
  ];

  const getTitle = (offer: Offer) => {
    return offer.title[currentLang] || offer.title.en;
  };

  const getLocation = (offer: Offer) => {
    return `${offer.city}, ${offer.country}`;
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    if (!window.confirm(`Delete this offer "${title}"?`)) return;
    try {
      const response = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        logActivity('DELETE_OFFER', `Deleted offer: ${title}`, 'error');
        setSelectedOffer(null);
        fetchOffers();
      }
    } catch (e) {
      console.error('Error deleting offer:', e);
    }
  };

  const handleDuplicateOffer = async (offer: Offer) => {
    try {
      const { id, created_at, ...duplicateData } = offer;
      const ref = generateRef();
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...duplicateData,
          reference_number: ref,
          title: {
            ...duplicateData.title,
            en: `${duplicateData.title.en} (Copy)`,
            fr: `${duplicateData.title.fr} (Copie)`,
            ar: `${duplicateData.title.ar} (نسخة)`
          }
        })
      });
      
      if (response.ok) {
        logActivity('DUPLICATE_OFFER', `Duplicated offer: ${offer.title.en} as ${ref}`, 'success');
        fetchOffers();
      }
    } catch (e) {
      console.error('Error duplicating offer:', e);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;

    try {
      const url = editingOffer.id ? `/api/offers/${editingOffer.id}` : '/api/offers';
      const method = editingOffer.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingOffer)
      });

      if (response.ok) {
        logActivity(editingOffer.id ? 'UPDATE_OFFER' : 'CREATE_OFFER', `Saved offer: ${editingOffer.title?.en}`, 'success');
        setIsFormOpen(false);
        setEditingOffer(null);
        fetchOffers();
      }
    } catch (e) {
      console.error('Error saving offer:', e);
    }
  };

  const handleExportToExcel = () => {
    const data = offers.map(o => ({
      Reference: o.reference_number,
      Title_EN: o.title.en,
      Title_FR: o.title.fr,
      Title_AR: o.title.ar,
      Category: o.category,
      Status: o.status,
      Price_Adult: o.price_adult,
      Location: `${o.city}, ${o.country}`,
      Duration: `${o.duration_days} Days / ${o.duration_nights} Nights`,
      Views: o.analytics?.views || 0,
      Reservations: o.analytics?.bookings || 0
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Offers");
    XLSX.writeFile(wb, `ASSABIKA_OFFERS_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const incrementViews = async (offer: Offer) => {
    try {
      await fetch(`/api/offers/${offer.id}/increment-views`, { method: 'POST' });
    } catch (e) {
      console.error("Failed to increment views", e);
    }
  };

  const handlePrintOffer = () => {
    if (!selectedOffer) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = getTitle(selectedOffer);

    printWindow.document.write(`
      <html>
        <head>
          <title>ASSABIKA TRAVEL - ${title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
            .header { border-bottom: 2px solid #D4AF37; margin-bottom: 30px; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .agency-info { font-size: 24px; font-weight: 900; color: #D4AF37; text-transform: uppercase; }
            .ref { font-family: monospace; font-size: 14px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { background: #fdfaf0; border-left: 4px solid #D4AF37; padding: 10px 15px; font-weight: bold; font-size: 14px; text-transform: uppercase; color: #8a702d; margin-bottom: 15px; }
            .grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; margin-bottom: 3px; }
            .value { font-size: 14px; color: #000; }
            .price-box { border: 1px solid #eee; padding: 15px; border-radius: 8px; text-align: center; }
            .price-val { font-size: 20px; font-weight: bold; color: #D4AF37; }
            .itinerary-day { margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 10px; }
            .day-num { font-weight: bold; color: #D4AF37; margin-right: 10px; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="agency-info">ASSABIKA TRAVEL</div>
            <div class="ref">${selectedOffer.reference_number}</div>
          </div>

          <div class="section">
            <h1 style="margin: 0; color: #1a1a1a;">${title}</h1>
            <p style="color: #666; margin-top: 5px;">${selectedOffer.city}, ${selectedOffer.country} • ${selectedOffer.duration_days} Days / ${selectedOffer.duration_nights} Nights</p>
          </div>

          <div class="section">
            <div class="section-title">Pricing & Availability</div>
            <div class="grid">
              <div class="price-box"><div class="label">Adult</div><div class="price-val">$${selectedOffer.price_adult}</div></div>
              <div class="price-box"><div class="label">Child</div><div class="price-val">$${selectedOffer.price_child}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Accommodation & Transport</div>
            <div class="grid">
              <div class="field">
                <div class="label">Hotel</div>
                <div class="value">${selectedOffer.hotel_name} (${selectedOffer.hotel_stars}*)</div>
              </div>
              <div class="field">
                <div class="label">Transport</div>
                <div class="value">${selectedOffer.transport_type} - ${selectedOffer.airline || 'Standard'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Program Itinerary</div>
            ${selectedOffer.itinerary?.map(d => `
              <div class="itinerary-day">
                <span class="day-num">Day ${d.day}</span>
                <span style="font-weight: bold;">${d.title}</span>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #444;">${d.description}</p>
              </div>
            `).join('') || '<p>No details provided.</p>'}
          </div>

          <div class="section">
            <div class="section-title">Conditions</div>
            <div class="grid">
              <div class="field">
                <div class="label">Included</div>
                <div class="value" style="font-size: 12px;">${selectedOffer.included?.join(', ') || 'None'}</div>
              </div>
              <div class="field">
                <div class="label">Cancellation Policy</div>
                <div class="value" style="font-size: 12px;">${selectedOffer.cancellation_policy || 'Standard agency policy applies.'}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            Elite Logistics management • 2026 Legal Archive • Generated on ${new Date().toLocaleString()}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOffers = offers.filter(o => {
    const matchesCategory = activeCategory === 'all' || o.category === activeCategory;
    const matchesSearch = getTitle(o).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-wider">{t('offers')}</h1>
          <p className="text-white/40 text-sm mt-1">Exclusive experiences curated for the distinguished traveler.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          {hasPermission('offers', 'add') && (
            <button 
              onClick={() => {
                setEditingOffer({ status: 'Active', title: { ar: '', fr: '', en: '' }, created_at: new Date().toISOString(), itinerary: [], included: [], not_included: [], gallery: [], hotel_facilities: [], guide_languages: [], suitable_for: [], interests: [] });
                setIsFormOpen(true);
              }}
              className="luxury-button flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t('add')} {t('offers')}
            </button>
          )}
        </div>
      </div>

      {/* Hero Category Filter */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-8 py-3 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all duration-300 border ${
              activeCategory === cat.id 
              ? 'bg-gold text-navy border-gold shadow-gold' 
              : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
        <input 
          type="text" 
          placeholder={`Discover your next destination...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="luxury-input w-full pl-16 pr-6 bg-navy-light/50 border-white/10"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredOffers.map((offer, i) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.1 }}
              className="group relative h-[450px] rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl"
            >
              {/* Image Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/20 to-transparent z-10 opacity-80" onClick={() => {
                setSelectedOffer(offer);
                incrementViews(offer);
              }} />
              <img 
                src={offer.main_image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1'} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={getTitle(offer)}
                onClick={() => {
                  setSelectedOffer(offer);
                  incrementViews(offer);
                }}
              />

              {/* Badges */}
              <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2">
                <span className="px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-gold text-nowrap">
                  {categories.find(c => c.id === offer.category)?.label || offer.category}
                </span>
                <span className={`px-4 py-1.5 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-nowrap ${
                  offer.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' :
                  offer.status === 'Coming Soon' ? 'bg-amber-500/20 text-amber-400' :
                  offer.status === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {offer.status}
                </span>
              </div>

              {/* Action Toolbar */}
              <div className="absolute top-6 right-6 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                {hasPermission('offers', 'add') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDuplicateOffer(offer); }}
                    className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-gold hover:text-navy transition-all"
                    title="Duplicate Offer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('offers', 'edit') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingOffer(offer); setIsFormOpen(true); }}
                    className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-gold hover:text-navy transition-all"
                    title="Edit Offer"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('offers', 'delete') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteOffer(offer.id, getTitle(offer)); }}
                    className="p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-red-500 hover:text-white transition-all"
                    title="Delete Offer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 z-20 space-y-4" onClick={() => {
                setSelectedOffer(offer);
                incrementViews(offer);
              }}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gold/80 text-xs font-bold uppercase tracking-[0.2em]">
                    <MapPin className="w-3 h-3" />
                    {offer.city}, {offer.country}
                  </div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-gold transition-colors">
                    {getTitle(offer)}
                  </h3>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Clock className="w-4 h-4 text-white/60" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">{offer.duration_days}D / {offer.duration_nights}N</span>
                  </div>
                  <div className="flex-1 flex justify-end items-end gap-1">
                    {hasPermission('offers', 'print') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOffer(offer);
                          setTimeout(() => handlePrintOffer(), 50);
                        }}
                        className="p-3 bg-white/5 hover:bg-gold hover:text-navy rounded-xl transition-all mr-2"
                        title="Print Experience Details"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    )}
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-white/40 mb-1 leading-none">From</span>
                      <span className="text-3xl font-bold text-gold leading-none">${offer.price_adult}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Offer Details Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-navy/95 backdrop-blur-lg"
            onClick={() => setSelectedOffer(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl bg-navy-light rounded-[3rem] overflow-hidden relative z-10 shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh] border border-white/10"
          >
            {/* Image Gallery Side */}
            <div className="md:w-1/2 relative bg-navy flex flex-col border-r border-white/10 overflow-hidden">
               <div className="flex-1 relative">
                 <img src={selectedOffer.main_image || selectedOffer.gallery?.[0]} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy/60" />
                 
                 {/* Quick Analytics Overlay */}
                 <div className="absolute top-8 left-8 flex gap-4">
                    <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-gold" />
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Views</p>
                        <p className="text-sm font-bold text-white">{selectedOffer.analytics?.views || 0}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Revenue</p>
                        <p className="text-sm font-bold text-white">${selectedOffer.analytics?.revenue || 0}</p>
                      </div>
                    </div>
                 </div>
               </div>
               
               <div className="p-8 bg-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Visual Experience</h4>
                   <span className="text-[10px] text-gold font-bold">{(selectedOffer.gallery?.length || 0) + 1} ASSETS</span>
                 </div>
                 <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                   <div className="w-24 h-24 rounded-2xl border-2 border-gold overflow-hidden shrink-0 cursor-pointer">
                     <img src={selectedOffer.main_image} className="w-full h-full object-cover" />
                   </div>
                   {(selectedOffer.gallery || []).map((img, i) => (
                     <div key={i} className="w-20 h-20 rounded-2xl border border-white/10 bg-white/5 overflow-hidden shrink-0 cursor-pointer hover:border-gold/50 transition-all">
                       <img src={img} className="w-full h-full object-cover opacity-60 hover:opacity-100" />
                     </div>
                   ))}
                 </div>
               </div>
            </div>

            {/* Content Side */}
            <div className="md:w-1/2 p-12 overflow-y-auto space-y-10 custom-scrollbar bg-navy-light/30">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-bold text-gold/80 uppercase tracking-widest text-xs">
                    <MapPin className="w-4 h-4" />
                    {selectedOffer.city}, {selectedOffer.country}
                    <span className="mx-2 text-white/20">|</span>
                    <Clock className="w-4 h-4" />
                    {selectedOffer.duration_days}D / {selectedOffer.duration_nights}N
                  </div>
                  <h2 className="text-4xl font-bold">{getTitle(selectedOffer)}</h2>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/40 uppercase border border-white/10">Ref: {selectedOffer.reference_number}</span>
                    <span className="px-3 py-1 bg-gold/10 rounded-full text-[10px] font-bold text-gold uppercase border border-gold/20">{selectedOffer.season} Edition</span>
                  </div>
                </div>
                <button onClick={() => setSelectedOffer(null)} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
              </div>

              {/* Pricing Section */}
              <div className="p-8 bg-gold rounded-[2rem] text-navy flex flex-col md:flex-row gap-8 items-center justify-between shadow-xl shadow-gold/10">
                 <div className="space-y-4">
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Elite Pricing (Per person)</p>
                     <div className="flex items-end gap-2">
                        <span className="text-5xl font-black">${selectedOffer.price_adult}</span>
                        <span className="text-xs font-bold mb-2">/ ADULT</span>
                     </div>
                   </div>
                 </div>
                 
                 <div className="w-full md:w-64 p-6 bg-white/20 backdrop-blur-md rounded-2xl space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest">Travel Planning Tool</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/30 p-2 rounded-lg">
                        <span className="text-[10px] font-bold">Adults</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCalcPassengers(p => ({...p, adults: Math.max(1, p.adults - 1)}))} className="w-5 h-5 rounded-md bg-white/50 flex items-center justify-center">-</button>
                          <span className="text-xs font-bold w-4 text-center">{calcPassengers.adults}</span>
                          <button onClick={() => setCalcPassengers(p => ({...p, adults: p.adults + 1}))} className="w-5 h-5 rounded-md bg-white/50 flex items-center justify-center">+</button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-white/30 p-2 rounded-lg">
                        <span className="text-[10px] font-bold">Children</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCalcPassengers(p => ({...p, children: Math.max(0, p.children - 1)}))} className="w-5 h-5 rounded-md bg-white/50 flex items-center justify-center">-</button>
                          <span className="text-xs font-bold w-4 text-center">{calcPassengers.children}</span>
                          <button onClick={() => setCalcPassengers(p => ({...p, children: p.children + 1}))} className="w-5 h-5 rounded-md bg-white/50 flex items-center justify-center">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-navy/10 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase">Estimated Total</span>
                      <span className="text-lg font-black">${(calcPassengers.adults * selectedOffer.price_adult + calcPassengers.children * selectedOffer.price_child).toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              {/* Inclusions / Exclusions */}
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gold">
                      <Check className="w-4 h-4" /> What's Included
                    </h4>
                    <div className="space-y-2">
                      {selectedOffer.included?.map((item, id) => (
                        <div key={id} className="flex items-center gap-3 text-xs text-white/60">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {item}
                        </div>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-400">
                      <X className="w-4 h-4" /> Not Included
                    </h4>
                    <div className="space-y-2">
                       {selectedOffer.not_included?.map((item, id) => (
                        <div key={id} className="flex items-center gap-3 text-xs text-white/40 line-through">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400/50" />
                          {item}
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              {/* Itinerary */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2rem] text-gold border-b border-white/10 pb-4">Curated Itinerary</h4>
                <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                   {selectedOffer.itinerary?.map((day, idx) => (
                     <div key={idx} className="relative pl-10">
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-full bg-navy-light border border-gold flex items-center justify-center text-[10px] font-bold text-gold z-10">{day.day}</div>
                        <div className="space-y-2">
                          <h5 className="font-bold text-lg text-white">{day.title}</h5>
                          <p className="text-sm text-white/40 leading-relaxed">{day.description}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Hotel & Transport */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <Hotel className="w-6 h-6 text-gold" />
                      <div className="flex gap-0.5">
                        {Array.from({length: selectedOffer.hotel_stars || 5}).map((_, i) => <Star key={i} className="w-3 h-3 fill-gold text-gold" />)}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-bold text-white">{selectedOffer.hotel_name}</h5>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{selectedOffer.meal_plan}</p>
                    </div>
                 </div>
                 <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                    <Plane className="w-6 h-6 text-gold" />
                    <div>
                      <h5 className="font-bold text-white">{selectedOffer.airline || 'Elite Carriers'}</h5>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Business Logistics</p>
                    </div>
                 </div>
              </div>

              <div className="pt-10 flex gap-4 no-print border-t border-white/5">
                {hasPermission('offers', 'print') && (
                  <button 
                    onClick={handlePrintOffer}
                    className="px-8 py-3 bg-white/5 hover:bg-gold hover:text-navy border border-white/10 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-3"
                  >
                    <Printer className="w-5 h-5" /> {t('print') || 'Voucher'}
                  </button>
                )}
                {hasPermission('offers', 'add') && (
                  <button 
                    onClick={() => handleDuplicateOffer(selectedOffer)}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-3"
                  >
                    <Copy className="w-5 h-5" /> {t('duplicate') || 'Duplicate'}
                  </button>
                )}
                {hasPermission('reservations', 'add') && (
                  <button className="luxury-button flex-1 py-4 flex items-center justify-center gap-3">
                    <CreditCard className="w-5 h-5" />
                    CONFIRM RESERVATION
                  </button>
                )}
                {hasPermission('offers', 'edit') && (
                  <button 
                    onClick={() => {
                      setEditingOffer(selectedOffer);
                      setIsFormOpen(true);
                    }}
                    className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center transition-all"
                  >
                    <FileText className="w-5 h-5 text-gold" />
                  </button>
                )}
                {hasPermission('offers', 'delete') && (
                  <button 
                    onClick={() => handleDeleteOffer(selectedOffer.id, getTitle(selectedOffer))}
                    className="w-14 h-14 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-2xl flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
      {/* Offer Form Modal */}
      {isFormOpen && editingOffer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-navy/98 backdrop-blur-xl"
            onClick={() => { setIsFormOpen(false); setEditingOffer(null); }}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl bg-navy-light rounded-[3rem] overflow-hidden relative z-10 shadow-2xl flex flex-col h-full max-h-[90vh] border border-white/10"
          >
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gold/10 rounded-2xl">
                  <Plus className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{editingOffer.id ? 'Refining Excellence' : 'Curating New Experience'}</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Global Travel Portfolio • Reference: {editingOffer.reference_number || 'AUTO-GENERATED'}</p>
                </div>
              </div>
              <button onClick={() => { setIsFormOpen(false); setEditingOffer(null); }} className="p-3 hover:bg-white/5 rounded-2xl transition-all"><X /></button>
            </div>

            <form onSubmit={handleSaveOffer} className="flex-1 overflow-y-auto p-12 space-y-16 custom-scrollbar">
              {/* Section 1: Basic Information */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">01</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Fundamental Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3 grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Title (English)</label>
                       <input 
                         required
                         value={editingOffer.title?.en}
                         onChange={(e) => setEditingOffer({ ...editingOffer, title: { ...editingOffer.title!, en: e.target.value } })}
                         className="luxury-input w-full"
                         placeholder="e.g. Maldivian Serenity"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Title (French)</label>
                       <input 
                         required
                         value={editingOffer.title?.fr}
                         onChange={(e) => setEditingOffer({ ...editingOffer, title: { ...editingOffer.title!, fr: e.target.value } })}
                         className="luxury-input w-full text-right"
                         placeholder="e.g. Sérénité Maldivienne"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Title (Arabic)</label>
                       <input 
                         required
                         value={editingOffer.title?.ar}
                         onChange={(e) => setEditingOffer({ ...editingOffer, title: { ...editingOffer.title!, ar: e.target.value } })}
                         className="luxury-input w-full text-right font-arabic"
                         placeholder="مثلاً: هدوء المالديف"
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Category</label>
                    <select 
                      required
                      value={editingOffer.category}
                      onChange={(e) => setEditingOffer({ ...editingOffer, category: e.target.value as any })}
                      className="luxury-input w-full"
                    >
                      <option value="internal_travel">Internal Travel</option>
                      <option value="external_travel">External Travel</option>
                      <option value="other_services">Other Services</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Subcategory</label>
                    <input 
                      value={editingOffer.subcategory}
                      onChange={(e) => setEditingOffer({ ...editingOffer, subcategory: e.target.value })}
                      className="luxury-input w-full"
                      placeholder="e.g. Honeymoon, Adventure..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Status</label>
                    <select 
                      value={editingOffer.status}
                      onChange={(e) => setEditingOffer({ ...editingOffer, status: e.target.value as any })}
                      className="luxury-input w-full"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Coming Soon">Coming Soon</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Destination & Dates */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">02</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Chronology & Locale</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Country</label>
                     <input value={editingOffer.country} onChange={(e) => setEditingOffer({ ...editingOffer, country: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">City</label>
                     <input value={editingOffer.city} onChange={(e) => setEditingOffer({ ...editingOffer, city: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Start Date</label>
                     <input type="date" value={editingOffer.start_date} onChange={(e) => setEditingOffer({ ...editingOffer, start_date: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">End Date</label>
                     <input type="date" value={editingOffer.end_date} onChange={(e) => setEditingOffer({ ...editingOffer, end_date: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Days</label>
                     <input type="number" value={editingOffer.duration_days} onChange={(e) => setEditingOffer({ ...editingOffer, duration_days: parseInt(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Nights</label>
                     <input type="number" value={editingOffer.duration_nights} onChange={(e) => setEditingOffer({ ...editingOffer, duration_nights: parseInt(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Season</label>
                     <select value={editingOffer.season} onChange={(e) => setEditingOffer({ ...editingOffer, season: e.target.value as any })} className="luxury-input w-full">
                        <option value="Summer">Summer</option>
                        <option value="Winter">Winter</option>
                        <option value="Spring">Spring</option>
                        <option value="Autumn">Autumn</option>
                        <option value="Ramadan">Ramadan</option>
                     </select>
                   </div>
                </div>
              </div>

              {/* Section 3: Pricing */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">03</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Financial Parameters</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Price Adult</label>
                     <input type="number" value={editingOffer.price_adult} onChange={(e) => setEditingOffer({ ...editingOffer, price_adult: parseFloat(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Price Child</label>
                     <input type="number" value={editingOffer.price_child} onChange={(e) => setEditingOffer({ ...editingOffer, price_child: parseFloat(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Price Infant</label>
                     <input type="number" value={editingOffer.price_infant} onChange={(e) => setEditingOffer({ ...editingOffer, price_infant: parseFloat(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Deposit Amount</label>
                     <input type="number" value={editingOffer.deposit_amount} onChange={(e) => setEditingOffer({ ...editingOffer, deposit_amount: parseFloat(e.target.value) })} className="luxury-input w-full border-gold/30" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Single Supplement</label>
                     <input type="number" value={editingOffer.single_supplement} onChange={(e) => setEditingOffer({ ...editingOffer, single_supplement: parseFloat(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Early Bird %</label>
                     <input type="number" value={editingOffer.early_bird_discount} onChange={(e) => setEditingOffer({ ...editingOffer, early_bird_discount: parseFloat(e.target.value) })} className="luxury-input w-full" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Included (Comma separated)</label>
                     <input 
                       value={editingOffer.included?.join(', ')} 
                       onChange={(e) => setEditingOffer({ ...editingOffer, included: e.target.value.split(',').map(s => s.trim()) })} 
                       className="luxury-input w-full" 
                       placeholder="Flights, Hotel, Transfers..."
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Not Included</label>
                     <input 
                       value={editingOffer.not_included?.join(', ')} 
                       onChange={(e) => setEditingOffer({ ...editingOffer, not_included: e.target.value.split(',').map(s => s.trim()) })} 
                       className="luxury-input w-full" 
                       placeholder="Visas, Personal expenses..."
                     />
                   </div>
                </div>
              </div>

              {/* Section 4: Transportation */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">04</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Logistics & Transit</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Type</label>
                     <select value={editingOffer.transport_type} onChange={(e) => setEditingOffer({ ...editingOffer, transport_type: e.target.value as any })} className="luxury-input w-full">
                        <option value="Plane">Plane</option>
                        <option value="Bus">Bus</option>
                        <option value="Train">Train</option>
                        <option value="Boat">Boat</option>
                        <option value="Car">Car</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Airline/Company</label>
                     <input value={editingOffer.airline} onChange={(e) => setEditingOffer({ ...editingOffer, airline: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Flight No.</label>
                     <input value={editingOffer.flight_number} onChange={(e) => setEditingOffer({ ...editingOffer, flight_number: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Luggage Allowance</label>
                     <input value={editingOffer.luggage_allowance} onChange={(e) => setEditingOffer({ ...editingOffer, luggage_allowance: e.target.value })} className="luxury-input w-full" />
                   </div>
                </div>
              </div>

              {/* Section 5: Accommodation */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">05</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Residency Standards</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Hotel Name</label>
                     <input value={editingOffer.hotel_name} onChange={(e) => setEditingOffer({ ...editingOffer, hotel_name: e.target.value })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Stars</label>
                     <select value={editingOffer.hotel_stars} onChange={(e) => setEditingOffer({ ...editingOffer, hotel_stars: parseInt(e.target.value) })} className="luxury-input w-full">
                        {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} Stars</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Meal Plan</label>
                     <select value={editingOffer.meal_plan} onChange={(e) => setEditingOffer({ ...editingOffer, meal_plan: e.target.value as any })} className="luxury-input w-full">
                        <option value="No meals">No meals</option>
                        <option value="Breakfast">Breakfast</option>
                        <option value="Half board">Half board</option>
                        <option value="Full board">Full board</option>
                        <option value="All inclusive">All inclusive</option>
                     </select>
                   </div>
                </div>
              </div>

              {/* Section 6: Program */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">06</div>
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Programmatic Narrative</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                        const newDays = [...(editingOffer.itinerary || [])];
                        newDays.push({ day: newDays.length + 1, title: '', description: '' });
                        setEditingOffer({ ...editingOffer, itinerary: newDays });
                    }}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold hover:text-white transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Day
                  </button>
                </div>
                <div className="space-y-4">
                   {(editingOffer.itinerary || []).map((day, idx) => (
                     <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-gold">Day {day.day}</span>
                           <button type="button" onClick={() => {
                             const newDays = editingOffer.itinerary?.filter((_, i) => i !== idx).map((d, i) => ({...d, day: i + 1}));
                             setEditingOffer({ ...editingOffer, itinerary: newDays });
                           }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <input 
                           placeholder="Day Title"
                           value={day.title}
                           onChange={(e) => {
                             const newDays = [...editingOffer.itinerary!];
                             newDays[idx].title = e.target.value;
                             setEditingOffer({ ...editingOffer, itinerary: newDays });
                           }}
                           className="luxury-input w-full text-xs font-bold"
                        />
                        <textarea 
                           placeholder="Rich Experience Description"
                           value={day.description}
                           onChange={(e) => {
                             const newDays = [...editingOffer.itinerary!];
                             newDays[idx].description = e.target.value;
                             setEditingOffer({ ...editingOffer, itinerary: newDays });
                           }}
                           className="luxury-input w-full text-xs h-24"
                        />
                     </div>
                   ))}
                </div>
              </div>

              {/* Section 7: Partner Company */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">07</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Strategic Partnerships</h3>
                </div>
                <div className="p-8 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                  <div className="flex items-center gap-4">
                    <input 
                        type="checkbox" 
                        checked={editingOffer.is_partner_offer} 
                        onChange={(e) => setEditingOffer({ ...editingOffer, is_partner_offer: e.target.checked })} 
                        className="w-5 h-5 accent-gold"
                    />
                    <label className="text-xs font-bold uppercase tracking-widest">This experience is curated by a strategic partner</label>
                  </div>
                  
                  {editingOffer.is_partner_offer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Select Partner Contract</label>
                          <select 
                            value={editingOffer.partner_contract_id}
                            onChange={(e) => {
                                const contract = contracts.find(c => c.id === e.target.value);
                                setEditingOffer({ ...editingOffer, partner_contract_id: e.target.value, partner_commission: 10 }); // Default 10%
                            }}
                            className="luxury-input w-full"
                          >
                            <option value="">Choose partner...</option>
                            {contracts.map(c => <option key={c.id} value={c.id}>{c.partner_name} ({c.contract_number})</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Partner Commission %</label>
                          <input type="number" value={editingOffer.partner_commission} onChange={(e) => setEditingOffer({ ...editingOffer, partner_commission: parseFloat(e.target.value) })} className="luxury-input w-full" />
                        </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 8: Media */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">08</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Visual & Media Assets</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Hero Image URL</label>
                     <input value={editingOffer.main_image} onChange={(e) => setEditingOffer({ ...editingOffer, main_image: e.target.value })} className="luxury-input w-full" placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Video Experience URL</label>
                     <input value={editingOffer.video_url} onChange={(e) => setEditingOffer({ ...editingOffer, video_url: e.target.value })} className="luxury-input w-full" placeholder="Youtube/Vimeo link" />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Gallery Image URLs (Comma separated)</label>
                     <textarea 
                        value={editingOffer.gallery?.join(', ')} 
                        onChange={(e) => setEditingOffer({ ...editingOffer, gallery: e.target.value.split(',').map(s => s.trim()) })} 
                        className="luxury-input w-full h-24"
                        placeholder="URL 1, URL 2..."
                     />
                   </div>
                </div>
              </div>

              {/* Section 9: Additional Information (Elite Attributes) */}
              <div className="space-y-8 pb-12">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">09</div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Elite Meta-Data</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Luxury Level</label>
                      <select value={editingOffer.luxury_level} onChange={(e) => setEditingOffer({ ...editingOffer, luxury_level: e.target.value as any })} className="luxury-input w-full">
                         <option value="Economy">Economy</option>
                         <option value="Standard">Standard</option>
                         <option value="Comfort">Comfort</option>
                         <option value="Luxury">Luxury</option>
                         <option value="Ultra-luxury">Ultra-luxury</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Pace</label>
                      <select value={editingOffer.pace} onChange={(e) => setEditingOffer({ ...editingOffer, pace: e.target.value as any })} className="luxury-input w-full">
                         <option value="Relaxed">Relaxed</option>
                         <option value="Moderate">Moderate</option>
                         <option value="Intensive">Intensive</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Physical (1-5)</label>
                      <input type="number" min="1" max="5" value={editingOffer.physical_rating} onChange={(e) => setEditingOffer({ ...editingOffer, physical_rating: parseInt(e.target.value) })} className="luxury-input w-full" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Cancellation</label>
                      <select value={editingOffer.cancellation_flexibility} onChange={(e) => setEditingOffer({ ...editingOffer, cancellation_flexibility: e.target.value as any })} className="luxury-input w-full">
                         <option value="Flexible">Flexible</option>
                         <option value="Moderate">Moderate</option>
                         <option value="Strict">Strict</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Agent Comm %</label>
                      <input type="number" value={editingOffer.agent_commission} onChange={(e) => setEditingOffer({ ...editingOffer, agent_commission: parseFloat(e.target.value) })} className="luxury-input w-full border-emerald-500/30" />
                   </div>
                   <div className="flex items-center gap-3 pt-6">
                      <input type="checkbox" checked={editingOffer.eco_friendly} onChange={(e) => setEditingOffer({ ...editingOffer, eco_friendly: e.target.checked })} className="w-5 h-5 accent-emerald-500" />
                      <label className="text-[10px] font-bold uppercase text-emerald-400">Eco-Certified</label>
                   </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-navy-light pt-8 border-t border-white/10 flex gap-4">
                 <button type="button" onClick={() => { setIsFormOpen(false); setEditingOffer(null); }} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs rounded-2xl transition-all">Cancel</button>
                 <button type="submit" className="luxury-button flex-1 py-4 flex items-center justify-center gap-3">
                    <Save className="w-5 h-5" /> PERSIST TO PORTFOLIO
                 </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Offers;
