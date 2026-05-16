import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  Mail, 
  Phone, 
  CreditCard, 
  FileText,
  X,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  Printer,
  Settings,
  ShieldCheck,
  RefreshCw,
  Bell,
  Globe,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { logActivity, useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  email_password?: string;
  account_number_1?: string;
  account_number_2?: string;
  passport_number: string;
  details: string;
  notes?: string;
  classification: string;
  created_at: string;
}

const Clients: React.FC = () => {
  const { t } = useTranslation();
  const { userRole, hasPermission } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [emailConfig, setEmailConfig] = useState<any>({
    email: '',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    imap_secure: true,
    is_active: true
  });
  const [savingEmail, setSavingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'visas' | 'documents'>('profile');
  const [visaRequests, setVisaRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchVisaRequests = async (clientId: string) => {
    try {
      const res = await fetch(`/api/visa-requests/client/${clientId}`);
      if (res.ok) setVisaRequests(await res.json());
    } catch (e) {
      console.error('Failed to fetch visa requests', e);
    }
  };

  useEffect(() => {
    if (selectedClient && activeTab === 'visas') {
      fetchVisaRequests(selectedClient.id);
    }
  }, [selectedClient, activeTab]);

  const fetchEmailConfig = async (clientId: string) => {
    try {
        const response = await fetch(`/api/email/config/${clientId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.email) {
                setEmailConfig(data);
            } else if (selectedClient) {
                setEmailConfig({
                    email: selectedClient.email,
                    imap_host: 'imap.gmail.com',
                    imap_port: 993,
                    imap_secure: true,
                    is_active: true
                });
            }
        }
    } catch (error) {
        console.error('Failed to fetch email config', error);
    }
  };

  useEffect(() => {
    if (selectedClient && showEmailSetup) {
        fetchEmailConfig(selectedClient.id);
    }
  }, [selectedClient, showEmailSetup]);

  const handleSaveEmailConfig = async () => {
    if (!selectedClient) return;
    try {
        setSavingEmail(true);
        const response = await fetch(`/api/email/config/${selectedClient.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailConfig)
        });
        if (response.ok) {
            logActivity('UPDATE_EMAIL_CONFIG', `Updated email monitor for client: ${selectedClient.first_name}`);
            setShowEmailSetup(false);
        }
    } catch (error) {
        console.error('Failed to save email config', error);
    } finally {
        setSavingEmail(false);
    }
  };

  // Form State
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    email_password: '',
    account_number_1: '',
    account_number_2: '',
    passport_number: '',
    details: '',
    notes: '',
    classification: 'Both'
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userRole) return;
    fetchClients();
  }, [userRole]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      
      if (response.ok) {
        setShowAddModal(false);
        logActivity('CREATE_CLIENT', `Added new client: ${newClient.first_name} ${newClient.last_name}`);
        setNewClient({ 
          first_name: '', 
          last_name: '', 
          phone: '', 
          email: '', 
          email_password: '', 
          account_number_1: '', 
          account_number_2: '', 
          passport_number: '', 
          details: '',
          notes: '',
          classification: 'Both'
        });
        fetchClients();
      }
    } catch (e) {
      console.error('Error creating client:', e);
    }
  };

  const handleDeleteClient = async (id: string, name?: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    try {
      const response = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (response.ok) {
        logActivity('DELETE_CLIENT', `Deleted client: ${name || id}`, 'error');
        setSelectedClient(null);
        fetchClients();
      }
    } catch (e) {
      console.error('Error deleting client:', e);
    }
  };

  const handlePrintClient = (client?: Client) => {
    const targetClient = client || selectedClient;
    if (!targetClient) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>ASSABIKA TRAVEL - Client Profile</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 3px solid #D4AF37; margin-bottom: 30px; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .agency-name { font-size: 28px; font-weight: 900; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; }
            .doc-type { text-align: right; font-weight: bold; text-transform: uppercase; color: #666; }
            .section-title { background: #f8f8f8; padding: 10px 15px; font-weight: bold; margin: 25px 0 15px 0; border-left: 5px solid #D4AF37; text-transform: uppercase; font-size: 14px; letter-spacing: 0.1em; }
            .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .data-table th { text-align: left; background: #fafafa; border: 1px solid #eee; padding: 12px; width: 30%; font-size: 12px; text-transform: uppercase; color: #888; }
            .data-table td { border: 1px solid #eee; padding: 12px; font-size: 14px; color: #000; }
            .footer { position: fixed; bottom: 20px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.2em; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="agency-name">ASSABIKA TRAVEL</h1>
              <div style="font-size: 12px; color: #888; margin-top: 5px;">High Fidelity Travel Management</div>
            </div>
            <div class="doc-type">
              <div>Client Profile</div>
              <div style="font-size: 11px; font-weight: normal; color: #999; margin-top: 5px;">Date: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section-title">Client Identity</div>
          <table class="data-table">
            <tr><th>Full Name</th><td>${targetClient.first_name} ${targetClient.last_name}</td></tr>
            <tr><th>Client ID</th><td>LL-${String(targetClient.id).substring(0, 8).toUpperCase()}</td></tr>
            <tr><th>Passport Number</th><td>${targetClient.passport_number}</td></tr>
            <tr><th>Registration Date</th><td>{new Date(targetClient.created_at).toLocaleDateString() || 'Recently'}</td></tr>
          </table>

          <div class="section-title">Contact Information</div>
          <table class="data-table">
            <tr><th>Phone Number</th><td>${targetClient.phone}</td></tr>
            <tr><th>Email Address</th><td>${targetClient.email}</td></tr>
          </table>

          <div class="section-title">Financial/Account Details</div>
          <table class="data-table">
            <tr><th>Account Number 1</th><td>${targetClient.account_number_1 || 'N/A'}</td></tr>
            <tr><th>Account Number 2</th><td>${targetClient.account_number_2 || 'N/A'}</td></tr>
          </table>

          <div class="section-title">Internal Observations</div>
          <table class="data-table">
            <tr><th>Public Details</th><td>${targetClient.details || 'N/A'}</td></tr>
            <tr><th>Private Notes</th><td>${targetClient.notes || 'N/A'}</td></tr>
          </table>

          <div class="footer">
            CONFIDENTIAL • ASSABIKA TRAVEL • LUXURY PORTFOLIO • ${new Date().getFullYear()}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredClients = clients.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.passport_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('clients')}</h1>
          <p className="text-white/40 text-sm mt-1">Manage your exclusive client portfolio.</p>
        </div>
        {hasPermission('clients', 'add') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="luxury-button flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t('add')} {t('clients')}
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder={`${t('search')} ${t('clients')}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="luxury-input w-full pl-12"
          />
        </div>
        <button className="px-6 py-3 glass-card flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">
          <Filter className="w-4 h-4" />
          {t('filters')}
        </button>
        <button className="px-6 py-3 glass-card flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest">
          <Download className="w-4 h-4" />
          {t('export')}
        </button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredClients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedClient(client)}
              className="glass-card p-6 cursor-pointer group hover:bg-white/10 transition-all duration-300 border-l-4 border-gold"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shadow-lg shadow-gold/5 group-hover:bg-gold group-hover:text-navy transition-all duration-300">
                  <span className="text-xl font-bold">{client.first_name[0]}{client.last_name[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasPermission('clients', 'print') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintClient(client);
                      }}
                      className="p-2 text-white/20 hover:text-gold transition-colors"
                      title="Print Profile"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  )}
                  <button className="p-2 text-white/20 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold">{client.first_name} {client.last_name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gold font-bold">CLIENT ID: LL-{String(client.id).padStart(4, '0')}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Mail className="w-4 h-4 text-gold" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Phone className="w-4 h-4 text-gold" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <CreditCard className="w-4 h-4 text-gold" />
                    Credit: {client.passport_number}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>Joined {new Date(client.created_at).toLocaleDateString() || 'Recently'}</span>
                <span className="text-gold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Profile <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/90 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-navy-light glass-card p-10 relative z-10 border border-gold/30 shadow-gold/20"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gold uppercase tracking-widest">{t('add')} {t('clients')}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">First Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newClient.first_name}
                    onChange={e => setNewClient({...newClient, first_name: e.target.value})}
                    className="luxury-input w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Last Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newClient.last_name}
                    onChange={e => setNewClient({...newClient, last_name: e.target.value})}
                    className="luxury-input w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={newClient.email}
                    onChange={e => setNewClient({...newClient, email: e.target.value})}
                    className="luxury-input w-full" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Phone</label>
                  <input 
                    type="text" 
                    required 
                    value={newClient.phone}
                    onChange={e => setNewClient({...newClient, phone: e.target.value})}
                    className="luxury-input w-full" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Email Password</label>
                    <input 
                      type="text" 
                      value={newClient.email_password}
                      onChange={e => setNewClient({...newClient, email_password: e.target.value})}
                      className="luxury-input w-full" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Passport Number</label>
                    <input 
                      type="text" 
                      required 
                      value={newClient.passport_number}
                      onChange={e => setNewClient({...newClient, passport_number: e.target.value})}
                      className="luxury-input w-full" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Account Number 1</label>
                    <input 
                      type="text" 
                      value={newClient.account_number_1}
                      onChange={e => setNewClient({...newClient, account_number_1: e.target.value})}
                      className="luxury-input w-full" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Account Number 2</label>
                    <input 
                      type="text" 
                      value={newClient.account_number_2}
                      onChange={e => setNewClient({...newClient, account_number_2: e.target.value})}
                      className="luxury-input w-full" 
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Client Classification</label>
                  <select 
                    value={newClient.classification}
                    onChange={e => setNewClient({...newClient, classification: e.target.value})}
                    className="luxury-input w-full"
                  >
                    <option value="Travel">Travel Client</option>
                    <option value="Visa">Visa Client</option>
                    <option value="Both">Both (Travel & Visa)</option>
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Additional Details</label>
                  <textarea 
                    value={newClient.details}
                    onChange={e => setNewClient({...newClient, details: e.target.value})}
                    className="luxury-input w-full h-24 resize-none" 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Private Notes</label>
                  <textarea 
                    value={newClient.notes}
                    onChange={e => setNewClient({...newClient, notes: e.target.value})}
                    className="luxury-input w-full h-24 resize-none border-gold/20" 
                  />
                </div>
                <button type="submit" className="luxury-button col-span-2 mt-4 font-bold tracking-[0.2em]">REGISTER CLIENT</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Side Panel Placeholder */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
            onClick={() => setSelectedClient(null)}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="w-full max-w-2xl bg-navy-light h-full relative z-10 shadow-2xl overflow-y-auto border-l border-white/10 p-8"
          >
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-gold/10 flex items-center justify-center text-gold text-3xl font-bold border border-gold/20">
                  {selectedClient.first_name[0]}{selectedClient.last_name[0]}
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{selectedClient.first_name} {selectedClient.last_name}</h2>
                  <p className="text-gold tracking-widest uppercase text-xs font-bold mt-1">Premium Member</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedClient(null)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'profile' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                Profile
              </button>
              {(selectedClient.classification === 'Visa' || selectedClient.classification === 'Both') && (
                <button 
                  onClick={() => setActiveTab('visas')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'visas' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  Visa Information
                </button>
              )}
              <button 
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'documents' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                Documents
              </button>
            </div>

            {activeTab === 'profile' && (
              <>
                <div className="grid grid-cols-2 gap-8 mb-12">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block font-bold mb-2">Phone Number</label>
                      <p className="font-bold text-lg">{selectedClient.phone}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block font-bold mb-2">Email Address</label>
                      <p className="font-bold text-lg">{selectedClient.email}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block font-bold mb-2">Email Password</label>
                      <p className="font-bold text-lg opacity-60">••••••••</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block font-bold mb-2">Passport Number</label>
                      <p className="font-bold text-lg text-gold">{selectedClient.passport_number}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block font-bold mb-2">Account Numbers</label>
                      <p className="font-bold text-sm">{selectedClient.account_number_1 || 'N/A'}</p>
                      <p className="font-bold text-sm mt-1">{selectedClient.account_number_2 || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-[0.2em] block font-bold mb-2">Registration Date</label>
                      <p className="font-bold text-lg">{new Date(selectedClient.created_at).toLocaleDateString() || 'Recently'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-12 p-6 bg-gold/5 border border-gold/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/10">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Email Intelligence</h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest">VISA CLIENT MONITORING ACTIVE</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate(`/clients/${selectedClient.id}/emails`)}
                            className="px-4 py-2 bg-gold text-navy rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-gold-light transition-all flex items-center gap-2"
                        >
                            <Bell className="w-4 h-4" /> View Messages
                        </button>
                        <button 
                            onClick={() => setShowEmailSetup(true)}
                            className="p-2 bg-white/5 text-white/40 hover:text-white rounded-lg border border-white/10 hover:border-white/20 transition-all"
                            title="Configure IMAP"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="space-y-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-gold">Additional Details</h3>
                     <div className="p-4 bg-white/5 border border-white/10 rounded-xl min-h-[100px]">
                       <p className="text-sm leading-relaxed text-white/60">{selectedClient.details || "No additional details."}</p>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-gold">Private Notes</h3>
                     <div className="p-4 bg-white/5 border border-gold/10 rounded-xl min-h-[100px]">
                       <p className="text-sm leading-relaxed text-white/60">{selectedClient.notes || "No private notes recorded."}</p>
                     </div>
                   </div>
                </div>
              </>
            )}

            {activeTab === 'visas' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Active Visa Requests</h3>
                  <button className="px-4 py-2 bg-gold/10 text-gold rounded-lg text-[10px] font-black uppercase tracking-widest border border-gold/20 hover:bg-gold hover:text-navy transition-all">
                    + New Visa Request
                  </button>
                </div>

                <div className="space-y-4">
                  {visaRequests.length > 0 ? visaRequests.map((req: any) => (
                    <div key={req.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-gold/30 transition-all">
                       <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                               <Globe className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="font-bold text-white uppercase tracking-tight">{req.country_name}</h4>
                               <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{req.visa_type_fr} Visa</p>
                            </div>
                         </div>
                         <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                           req.status === 'Completed' || req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                           req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                           'bg-gold/10 text-gold border border-gold/20'
                         }`}>
                           {req.status}
                         </span>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/5">
                          <div>
                            <p className="text-[10px] text-white/20 uppercase font-black mb-1">Request Num</p>
                            <p className="text-xs font-mono font-bold text-white/60">{req.request_number || 'VR-2025-001'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase font-black mb-1">Total Fee</p>
                            <p className="text-xs font-bold text-gold">{(req.total_price || 0).toLocaleString()} DZD</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-white/20 uppercase font-black mb-1">Date</p>
                            <p className="text-xs font-bold text-white/60">{new Date(req.request_date).toLocaleDateString()}</p>
                          </div>
                       </div>
                       
                       <div className="mt-4 flex gap-4">
                          <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all">
                             View Workflow
                          </button>
                          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all">
                             Track
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-white/10 border-2 border-dashed border-white/5 rounded-3xl">
                       <CheckCircle2 className="w-12 h-12 mb-4 opacity-50" />
                       <p className="font-black uppercase tracking-[0.2em] text-xs">No active visa requests found</p>
                       <p className="text-[10px] mt-2">Initialize a new workflow to start tracking.</p>
                       <button className="mt-6 luxury-button text-[10px]">Start Visa Application</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gold text-lg">Documents Library</h3>
                  <button className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload New
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((doc) => (
                    <div key={doc} className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-gold/30 transition-all">
                      <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-gold" />
                      </div>
                      <p className="font-bold text-sm mb-1">Passport_Scan_{selectedClient.last_name}.pdf</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">2.4 MB • PDF</p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                        <button className="text-[10px] font-bold text-gold uppercase tracking-widest flex items-center gap-1">
                          <Download className="w-3 h-3" /> Download
                        </button>
                        <button className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-12 flex gap-4 no-print">
              {hasPermission('clients', 'print') && (
                <button 
                  onClick={handlePrintClient}
                  className="px-8 py-3 bg-gold/10 text-gold border border-gold/20 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gold hover:text-navy transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" /> {t('print') || 'Print'}
                </button>
              )}
              {hasPermission('clients', 'edit') && <button className="luxury-button flex-1">{t('edit')}</button>}
              {hasPermission('clients', 'delete') && (
                <button 
                  onClick={() => handleDeleteClient(selectedClient.id)}
                  className="px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all"
                >
                  {t('delete')}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {/* Email Setup Modal */}
      <AnimatePresence>
        {showEmailSetup && selectedClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/90 backdrop-blur-md"
              onClick={() => setShowEmailSetup(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-navy-light glass-card p-10 relative z-[101] border border-gold/30"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-gold" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">IMAP Intelligence Setup</h2>
                </div>
                <button onClick={() => setShowEmailSetup(false)} className="p-2 text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gold/5 border border-gold/10 rounded-xl text-[10px] text-white/60 leading-relaxed">
                    <p className="font-bold text-gold uppercase mb-1">Notice to Agent:</p>
                    Ensure IMAP is enabled in the client's email settings. Use the client's password (encrypted). Monitoring is restricted to Visa Clients.
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Email Address</label>
                  <input 
                    type="email" 
                    value={emailConfig.email}
                    onChange={e => setEmailConfig({...emailConfig, email: e.target.value})}
                    className="luxury-input w-full" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">IMAP Host</label>
                        <input 
                            type="text" 
                            value={emailConfig.imap_host}
                            onChange={e => setEmailConfig({...emailConfig, imap_host: e.target.value})}
                            className="luxury-input w-full" 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">IMAP Port</label>
                        <input 
                            type="number" 
                            value={emailConfig.imap_port}
                            onChange={e => setEmailConfig({...emailConfig, imap_port: parseInt(e.target.value)})}
                            className="luxury-input w-full" 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={emailConfig.imap_secure}
                            onChange={e => setEmailConfig({...emailConfig, imap_secure: e.target.checked})}
                        />
                        <div className={`w-10 h-6 rounded-full transition-all relative ${emailConfig.imap_secure ? 'bg-gold' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${emailConfig.imap_secure ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">SSL/TLS Secure</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group ml-auto">
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={emailConfig.is_active}
                            onChange={e => setEmailConfig({...emailConfig, is_active: e.target.checked})}
                        />
                        <div className={`w-10 h-6 rounded-full transition-all relative ${emailConfig.is_active ? 'bg-green-500' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${emailConfig.is_active ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Active Monitoring</span>
                    </label>
                </div>

                <button 
                    onClick={handleSaveEmailConfig}
                    disabled={savingEmail}
                    className="luxury-button w-full flex items-center justify-center gap-3 py-4 mt-4"
                >
                    {savingEmail ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Saving Secure Config...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5" />
                            <span>Save Monitor Settings</span>
                        </>
                    )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
