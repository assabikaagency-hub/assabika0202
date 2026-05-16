import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  Plane, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
  Users,
  Printer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Reservation {
  id: string | number;
  client_id: string;
  client_name: string;
  offer_id: string;
  offer_title: string;
  travel_date: string;
  people_count: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

interface Client {
  id: string | number;
  first_name: string;
  last_name: string;
}

interface Offer {
  id: string | number;
  title: Record<string, string>;
  price: number;
}

const Reservations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userRole, hasPermission } = useAuth();
  const currentLang = i18n.language as 'ar' | 'fr' | 'en';
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const handlePrintReservation = (reservation: Reservation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>ASSABIKA TRAVEL - Travel Voucher</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 3px solid #D4AF37; margin-bottom: 30px; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .agency-name { font-size: 28px; font-weight: 900; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
            .doc-type { text-align: right; font-weight: bold; text-transform: uppercase; color: #666; }
            .section-title { background: #f8f8f8; padding: 10px 15px; font-weight: bold; margin: 25px 0 15px 0; border-left: 5px solid #D4AF37; text-transform: uppercase; font-size: 14px; letter-spacing: 0.1em; }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .data-table th { text-align: left; background: #fafafa; border: 1px solid #eee; padding: 12px; width: 30%; font-size: 12px; text-transform: uppercase; color: #888; }
            .data-table td { border: 1px solid #eee; padding: 12px; font-size: 14px; color: #000; }
            .price { font-size: 24px; font-weight: bold; color: #D4AF37; }
            .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.2em; }
            .seal { margin-top: 50px; text-align: center; }
            .seal-box { display: inline-block; padding: 30px 60px; border: 2px dashed #ccc; color: #ccc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="agency-name">ASSABIKA TRAVEL</h1>
              <div style="font-size: 12px; color: #888; margin-top: 5px;">Exclusive High-Fidelity Reservations</div>
            </div>
            <div class="doc-type">
              <div>Travel Voucher</div>
              <div style="font-size: 11px; font-weight: normal; color: #999; margin-top: 5px;">Voucher #: R-${String(reservation.id).substring(0, 8).toUpperCase()}</div>
            </div>
          </div>

          <div class="section-title">Passenger Details</div>
          <table class="data-table">
            <tr><th>Main Traveler</th><td>${reservation.client_name}</td></tr>
            <tr><th>Party Size</th><td>${reservation.people_count} Person(s)</td></tr>
          </table>

          <div class="section-title">Itinerary Information</div>
          <table class="data-table">
            <tr><th>Experience</th><td>${reservation.offer_title}</td></tr>
            <tr><th>Travel Date</th><td>${reservation.travel_date}</td></tr>
            <tr><th>Current Status</th><td>${reservation.status.toUpperCase()}</td></tr>
          </table>

          <div class="section-title">Financial Summary</div>
          <table class="data-table">
            <tr><th>Total Price</th><td class="price">$${reservation.total_price?.toLocaleString()}</td></tr>
            <tr><th>Currency</th><td>USD (United States Dollar)</td></tr>
          </table>

          <div class="section-title">Terms of Service</div>
          <div style="padding: 15px; border: 1px solid #eee; font-size: 12px; color: #666;">
            This voucher represents a confirmed reservation with ASSABIKA TRAVEL. Please present this document upon check-in or service commencement. Cancellations and modifications are subject to the specific terms of the selected offer. 
          </div>

          <div class="seal">
            <div class="seal-box">OFFICIAL AGENCY SEAL / DIGITAL SIGNATURE</div>
          </div>

          <div class="footer">
            GLOBAL TRAVEL • ASSABIKA TRAVEL • MISSION CRITICAL SERVICE • ${new Date().getFullYear()}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    offerId: '',
    travelDate: '',
    peopleCount: 1,
    status: 'pending' as Reservation['status']
  });

  const fetchData = async () => {
    try {
      const [reservationsRes, clientsRes, offersRes] = await Promise.all([
        fetch('/api/reservations'),
        fetch('/api/clients'),
        fetch('/api/offers')
      ]);
      
      if (reservationsRes.ok) setReservations(await reservationsRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData.map((o: any) => ({
          ...o,
          title: typeof o.title === 'string' ? JSON.parse(o.title) : o.title
        })));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userRole) return;
    fetchData();
  }, [userRole]);

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => String(c.id) === String(formData.clientId));
    const offer = offers.find(o => String(o.id) === String(formData.offerId));

    if (!client || !offer) return;

    try {
      const totalPrice = offer.price * formData.peopleCount;
      const newReservation = {
        clientId: formData.clientId,
        clientName: `${client.first_name} ${client.last_name}`,
        offerId: formData.offerId,
        offerTitle: offer.title[currentLang] || offer.title.en || 'Untitled Offer',
        travelDate: formData.travelDate,
        peopleCount: formData.peopleCount,
        totalPrice,
        status: formData.status
      };

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReservation)
      });

      if (res.ok) {
        fetchData();
        setShowAddModal(false);
        setFormData({
          clientId: '',
          offerId: '',
          travelDate: '',
          peopleCount: 1,
          status: 'pending'
        });
      }
    } catch (e) {
      console.error('Failed to create reservation:', e);
    }
  };

  const handleUpdateStatus = async (id: string | number, status: Reservation['status']) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error('Failed to update reservation:', e);
    }
  };

  const handleDeleteReservation = async (id: string | number, name: string) => {
    if (!window.confirm(t('delete_confirm') || 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error('Failed to delete reservation:', e);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  const filteredReservations = reservations.filter(b => {
    const matchesSearch = b.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         b.offer_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase text-white">{t('reservations')}</h1>
          <p className="text-white/40 text-sm mt-1">Manage luxury travel reservations and client itineraries.</p>
        </div>
        {hasPermission('reservations', 'add') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="luxury-button flex items-center gap-2 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            {t('add')}
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-navy-light/50 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-gold transition-colors" />
          <input 
            type="text" 
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="luxury-input w-full pl-12"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30 ml-2" />
          <div className="flex bg-navy p-1 rounded-xl border border-white/10">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  statusFilter === status 
                  ? 'bg-gold text-navy shadow-lg' 
                  : 'text-white/40 hover:text-white'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reservations Table/Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="glass-card p-20 flex flex-col items-center text-center gap-4 border-dashed">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-white/20" />
            </div>
            <div>
              <p className="text-white font-bold tracking-widest uppercase">{t('reservations')} - No records</p>
              <p className="text-white/20 text-sm italic">Initialize a new reservation elite sequence.</p>
            </div>
          </div>
        ) : (
          filteredReservations.map((reservation) => (
            <motion.div 
              layout
              key={reservation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-gold/30 transition-all border-l-4 border-l-gold"
            >
              <div className="flex items-center gap-4 min-w-[240px]">
                <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                  <User className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="font-bold text-white group-hover:text-gold transition-colors">{reservation.client_name}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Client</p>
                </div>
              </div>

              <div className="flex-1 flex items-center gap-4 min-w-[240px]">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                  <Plane className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <p className="font-bold text-white">{reservation.offer_title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-gold" />
                    <span className="text-xs text-white/40">{reservation.travel_date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-center">
                  <p className="text-lg font-black text-gold">${reservation.total_price?.toLocaleString()}</p>
                  <p className="text-[8px] text-white/40 uppercase tracking-tighter">Total Price</p>
                </div>
                
                <div className="text-center">
                   <p className="text-sm font-bold flex items-center gap-1 justify-center">
                     <Users className="w-3 h-3" />
                     {reservation.people_count}
                   </p>
                   <p className="text-[8px] text-white/40 uppercase tracking-tighter">Travelers</p>
                </div>

                <div className="flex items-center gap-2">
                   {hasPermission('reservations', 'print') && (
                     <button 
                       onClick={() => handlePrintReservation(reservation)}
                       className="p-2 hover:bg-gold hover:text-navy text-white/20 rounded-lg transition-all"
                       title="Print Voucher"
                     >
                       <Printer className="w-5 h-5" />
                     </button>
                   )}
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[reservation.status]}`}>
                      {reservation.status}
                   </span>
                   
                   <div className="relative group/actions">
                     <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                       <MoreVertical className="w-5 h-5 text-white/20" />
                     </button>
                     <div className="absolute right-0 top-full mt-2 w-48 bg-navy border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-10 p-2 space-y-1">
                        {hasPermission('reservations', 'print') && (
                          <button onClick={() => handlePrintReservation(reservation)} className="w-full text-left p-2 hover:bg-gold/10 hover:text-gold rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                            <Printer className="w-4 h-4" /> Print Voucher
                          </button>
                        )}
                        {hasPermission('reservations', 'edit') && (
                          <>
                            <button onClick={() => handleUpdateStatus(reservation.id, 'confirmed')} className="w-full text-left p-2 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Confirm Reservation
                            </button>
                            <button onClick={() => handleUpdateStatus(reservation.id, 'cancelled')} className="w-full text-left p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                              <XCircle className="w-4 h-4" /> Cancel Reservation
                            </button>
                            <button onClick={() => handleUpdateStatus(reservation.id, 'completed')} className="w-full text-left p-2 hover:bg-blue-500/10 hover:text-blue-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Mark Completed
                            </button>
                          </>
                        )}
                        {hasPermission('reservations', 'delete') && (
                          <>
                            <div className="h-[1px] bg-white/5 my-1" />
                            <button onClick={() => handleDeleteReservation(reservation.id, reservation.client_name)} className="w-full text-left p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                              <Trash2 className="w-4 h-4" /> Delete Permanently
                            </button>
                          </>
                        )}
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Reservation Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/90 backdrop-blur-xl"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass-card p-10 border-t-4 border-gold overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <ClipboardList className="w-40 h-40 text-gold" />
              </div>

              <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">{t('add')} Reservation</h2>
              
              <form onSubmit={handleAddReservation} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Client</label>
                    <select 
                      required
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      className="luxury-input w-full"
                    >
                      <option value="">Select a Client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Offer</label>
                    <select 
                      required
                      value={formData.offerId}
                      onChange={(e) => setFormData({...formData, offerId: e.target.value})}
                      className="luxury-input w-full"
                    >
                      <option value="">Select an Offer</option>
                      {offers.map(o => (
                        <option key={o.id} value={o.id}>{o.title[currentLang] || o.title.en}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Travel Date</label>
                    <input 
                      type="date"
                      required
                      value={formData.travelDate}
                      onChange={(e) => setFormData({...formData, travelDate: e.target.value})}
                      className="luxury-input w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Travelers</label>
                    <input 
                      type="number"
                      min="1"
                      required
                      value={formData.peopleCount}
                      onChange={(e) => setFormData({...formData, peopleCount: parseInt(e.target.value)})}
                      className="luxury-input w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 luxury-button px-8 py-4"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reservations;
