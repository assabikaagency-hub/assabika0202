import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Calendar, 
  Building2, 
  User, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  ExternalLink,
  Printer,
  Trash2,
  XCircle,
  FileUp,
  Bot,
  SearchCode,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

interface ContractTemplate {
  id: string | number;
  name: string;
  name_ar: string;
  type: string;
  subtype: string;
  content_french: string;
  content_arabic: string;
  variables: string[];
  is_default: boolean;
}

interface Contract {
  id: string | number;
  type: 'partnership' | 'subcontracting' | 'agency_client';
  contract_subtype: string;
  partner_name: string;
  contract_number: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'signed' | 'expired' | 'cancelled' | 'active' | 'expiring';
  value?: string;
  template_id?: string;
  filled_data?: string | Record<string, string>;
  generated_pdf_path?: string;
  signed_date?: string;
  signature?: string;
  created_at: string;
}

const Contracts: React.FC = () => {
  const { t } = useTranslation();
  const { userRole, currentUser, hasPermission } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Type, 2: Subtype, 3: Form, 4: Preview
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  
  // Template Manager State
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);

  // Form State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // New Smart Contract Features
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [uploadData, setUploadData] = useState({ name: '', type: 'Voyage', subtype: 'Individuel' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [smartManualFields, setSmartManualFields] = useState({
    contract_date: new Date().toISOString().split('T')[0],
    contract_number: `CT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
    special_conditions: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [contractsRes, templatesRes] = await Promise.all([
        fetch('/api/contracts'),
        fetch('/api/contract_templates')
      ]);

      if (contractsRes.ok) {
        const data = await contractsRes.json();
        setContracts(data.map((item: any) => {
          let status = item.status || 'draft';
          if (item.end_date) {
            const endDate = new Date(item.end_date);
            const today = new Date();
            const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (status === 'active' || status === 'signed') {
              if (diffDays < 0) status = 'expired';
              else if (diffDays <= 30) status = 'expiring';
            }
          }
          return { ...item, status };
        }));
      }

      if (templatesRes.ok) {
        setTemplates(await templatesRes.json());
      }
      
      const [clientsRes, offersRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/offers')
      ]);
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
    } catch (error) {
      console.error('Failed to fetch contracts data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userRole) return;
    fetchData();
  }, [userRole]);

  const handleCreateContract = async () => {
    if (!selectedType || !selectedSubtype || !selectedTemplate) return;
    setIsGenerating(true);

    try {
      const contractNumber = `CT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      
      const newContract = {
        type: selectedType,
        contract_subtype: selectedSubtype,
        partner_name: formData.client_name || formData.partner_name || 'Unnamed Party',
        contract_number: contractNumber,
        status: 'draft',
        template_id: selectedTemplate.id,
        filled_data: JSON.stringify(formData),
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        end_date: formData.end_date || '',
        value: formData.price || formData.value || '0'
      };

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContract)
      });

      if (res.ok) {
        fetchData();
        setShowAddModal(false);
        resetModal();
      }
    } catch (error) {
      console.error('Failed to create contract:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetModal = () => {
    setModalStep(1);
    setSelectedType(null);
    setSelectedSubtype(null);
    setSelectedTemplate(null);
    setFormData({});
    setSelectedClientId('');
    setSelectedOfferId('');
  };

  const handleUploadTemplate = async () => {
    if (!uploadFile) return;
    const formDataUpload = new FormData();
    formDataUpload.append('file', uploadFile);
    formDataUpload.append('name', uploadData.name);
    formDataUpload.append('type', uploadData.type);
    formDataUpload.append('subtype', uploadData.subtype);

    try {
      setLoading(true);
      const res = await fetch('/api/contracts/templates/upload', {
        method: 'POST',
        body: formDataUpload
      });
      if (res.ok) {
        fetchData();
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadData({ name: '', type: 'Voyage', subtype: 'Individuel' });
      }
    } catch (error) {
      console.error('Failed to upload template', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSmartContract = async () => {
    if (!selectedClientId || !selectedTemplate) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/contracts/generate-smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          clientId: selectedClientId,
          offerId: selectedOfferId || null,
          manualFields: smartManualFields
        })
      });
      if (res.ok) {
        fetchData();
        setShowSmartModal(false);
        resetModal();
      }
    } catch (error) {
      console.error('Failed to generate smart contract', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectType = (type: string) => {
    setSelectedType(type);
    setModalStep(2);
  };

  const handleSelectSubtype = (subtype: string) => {
    setSelectedSubtype(subtype);
    // Find matching template
    const template = templates.find(t => t.type === selectedType && t.subtype === subtype);
    if (template) {
      setSelectedTemplate(template);
      setFormData({});
      setModalStep(3);
    } else {
      alert("No template found for this selection. Admin must create one.");
    }
  };

  const handleSaveTemplate = async (templateData: Partial<ContractTemplate>) => {
    try {
      if (editingTemplate?.id) {
        const res = await fetch(`/api/contract_templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });
        if (res.ok) {
           fetchData();
           setEditingTemplate(null);
        }
      } else {
        const res = await fetch('/api/contract_templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });
        if (res.ok) {
          fetchData();
          setEditingTemplate(null);
        }
      }
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handlePrintContract = (contract: Contract) => {
    const template = templates.find(t => String(t.id) === String(contract.template_id));
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const replacePlaceholders = (text: string) => {
      let result = text;
      const filledData = typeof contract.filled_data === 'string' ? JSON.parse(contract.filled_data) : contract.filled_data;
      if (filledData) {
        Object.entries(filledData as Record<string, string>).forEach(([key, value]) => {
          result = result.replace(new RegExp(`\\[${key.toUpperCase()}\\]`, 'g'), value);
          result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
        });
      }
      // System defaults
      result = result.replace(/\[DATE\]/g, new Date().toLocaleDateString());
      result = result.replace(/\[CONTRACT_NUMBER\]/g, contract.contract_number);
      return result;
    };

    const contentFr = template ? replacePlaceholders(template.content_french) : 'No template content available.';
    const contentAr = template ? replacePlaceholders(template.content_arabic) : 'لا يوجد محتوى للعقد.';

    printWindow.document.write(`
      <html>
        <head>
          <title>ASSABIKA TRAVEL - ${contract.contract_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Amiri&family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; background: #fff; }
            .header { border-bottom: 2px solid #D4AF37; margin-bottom: 40px; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .agency-name { font-size: 24px; font-weight: 900; color: #D4AF37; letter-spacing: 2px; }
            .contract-info { text-align: right; font-size: 11px; color: #666; }
            .bilingual-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; }
            .lang-fr { text-align: left; }
            .lang-ar { text-align: right; font-family: 'Amiri', serif; font-size: 18px; direction: rtl; }
            .section-title { font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 10px; margin: 30px 0 15px 0; text-transform: uppercase; font-size: 12px; color: #D4AF37; }
            .content { white-space: pre-wrap; font-size: 13px; }
            .footer { margin-top: 60px; border-top: 1px solid #eee; padding-top: 20px; font-size: 9px; text-align: center; color: #999; }
            .signature-block { margin-top: 80px; display: flex; justify-content: space-between; gap: 40px; text-align: center; }
            .sig-field { flex: 1; border-top: 1px solid #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="agency-name">ASSABIKA TRAVEL</div>
            <div class="contract-info">
              <div>${contract.contract_number}</div>
              <div>${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div class="bilingual-grid">
            <div class="lang-fr">
              <div class="section-title">Contrat de Voyage</div>
              <div class="content">${contentFr}</div>
            </div>
            <div class="lang-ar">
              <div class="section-title">عقد سفر</div>
              <div class="content">${contentAr}</div>
            </div>
          </div>

          <div class="signature-block">
            <div class="sig-field">Signature Agence (Cachet)</div>
            <div class="sig-field">Signature du Client / Partenaire</div>
          </div>

          <div class="footer">
            ASSABIKA TRAVEL • Elite Logistics management • 2026 Legal Archive
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const typeLabels = {
    partnership: t('contractTypes.partnership'),
    subcontracting: t('contractTypes.subcontracting'),
    agency_client: t('contractTypes.agency_client'),
  };

  const statusStyles = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    expiring: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
    draft: 'bg-white/5 text-white/40 border-white/10',
    signed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const filteredContracts = contracts.filter(c => {
    const matchesTab = activeTab === 'all' || c.type === activeTab;
    const matchesSearch = c.partner_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.contract_number.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-wider">{t('contracts')}</h1>
          <p className="text-white/40 text-sm mt-1">Legally binding elite partnerships and client safeguards.</p>
        </div>
        <div className="flex gap-4">
          {hasPermission('contracts', 'edit') && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 glass-card flex items-center gap-2 text-gold font-bold text-[10px] tracking-widest uppercase hover:bg-gold/10 transition-all border border-gold/20"
              >
                <FileUp className="w-5 h-5" />
                Upload Word Template
              </button>
              <button 
                onClick={() => setShowTemplateManager(true)}
                className="px-6 py-3 glass-card flex items-center gap-2 text-white/60 font-bold text-[10px] tracking-widest uppercase hover:text-white transition-colors"
              >
                <FileText className="w-5 h-5" />
                Template Manager
              </button>
            </div>
          )}
          {hasPermission('contracts', 'add') && (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  resetModal();
                  setShowSmartModal(true);
                }}
                className="luxury-button !bg-emerald-600 !hover:bg-emerald-700 flex items-center gap-2"
              >
                <Bot className="w-5 h-5" />
                Create Smart Contract
              </button>
              <button 
                onClick={() => {
                  resetModal();
                  setShowAddModal(true);
                }}
                className="luxury-button flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t('add')} {t('contracts')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-white/5 pb-0">
        {['all', 'partnership', 'subcontracting', 'agency_client'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-gold' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab === 'all' ? 'All Types' : typeLabels[tab as keyof typeof typeLabels]}
            {activeTab === tab && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-gold rounded-t-full shadow-gold" />
            )}
          </button>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="Search by partner name or contract ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="luxury-input w-full pl-12"
          />
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 glass-card flex items-center gap-2 text-white/60 font-bold text-[10px] tracking-widest uppercase hover:text-gold transition-colors">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 border-b border-white/10">
                <th className="px-8 py-5">Contract Details</th>
                <th className="px-8 py-5">Type / Subtype</th>
                <th className="px-8 py-5">Value</th>
                <th className="px-8 py-5">Period</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredContracts.map((contract, i) => (
                  <motion.tr 
                    key={contract.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-navy-light flex items-center justify-center border border-white/10 group-hover:border-gold/50 transition-all">
                          {contract.type === 'agency_client' ? <User className="w-5 h-5 text-gold" /> : <Building2 className="w-5 h-5 text-gold" />}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-gold transition-colors">{contract.partner_name}</p>
                          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{contract.contract_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/60">
                          {typeLabels[contract.type as keyof typeof typeLabels]}
                        </span>
                        <span className="text-[10px] text-white/20 uppercase tracking-widest leading-none mt-1">
                          {contract.contract_subtype?.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-emerald-400">
                        {contract.value || 'N/A'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {contract.start_date} — {contract.end_date}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusStyles[contract.status as keyof typeof statusStyles] || 'border-white/10 text-white/40'}`}>
                        {contract.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {contract.status === 'expiring' && <AlertTriangle className="w-3 h-3" />}
                        {contract.status === 'expired' && <Clock className="w-3 h-3" />}
                        {contract.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right no-print">
                      <div className="flex justify-end gap-2">
                        {hasPermission('contracts', 'print') && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintContract(contract);
                            }}
                            className="p-2 hover:bg-gold hover:text-navy rounded-lg transition-all" title="Print Contract"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('contracts', 'delete') && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if(window.confirm('Are you sure you want to delete this contract?')) {
                                const res = await fetch(`/api/contracts/${contract.id}`, { method: 'DELETE' });
                                if (res.ok) fetchData();
                              }
                            }}
                            className="p-2 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-lg transition-all" title="Delete"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredContracts.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4 text-white/20">
            <FileText className="w-16 h-16 opacity-10" />
            <p className="font-bold uppercase tracking-widest text-sm">No contracts found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add Contract Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-navy-light border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-widest">
                    <Plus className="w-5 h-5 text-gold" />
                    New Legal Agreement
                  </h2>
                  <p className="text-white/40 text-xs mt-1">Step {modalStep} of 3: {
                    modalStep === 1 ? 'Contract Classification' : 
                    modalStep === 2 ? 'Experience Specification' : 
                    'Legal Provisions'
                  }</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <XCircle className="w-6 h-6 text-white/40 hover:text-white" onClick={() => setShowAddModal(false)} />
                </button>
              </div>

              <div className="p-10 max-h-[70vh] overflow-y-auto">
                {modalStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: 'partnership', icon: Building2, label: 'Partnership', desc: 'B2B collaboration with providers.' },
                      { id: 'subcontracting', icon: FileText, label: 'Subcontracting', desc: 'Outsourced operational support.' },
                      { id: 'agency_client', icon: User, label: 'Agency-Client', desc: 'Direct service with traveler.' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleSelectType(type.id)}
                        className="p-8 glass-card border border-white/5 hover:border-gold/50 rounded-2xl text-left transition-all group"
                      >
                        <type.icon className="w-8 h-8 text-gold mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-white mb-2">{type.label}</h3>
                        <p className="text-white/40 text-xs leading-relaxed">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                )}

                {modalStep === 2 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { id: 'internal_travel', label: 'Internal Travel' },
                      { id: 'external_travel', label: 'External Travel' },
                      { id: 'visa', label: 'Visa Contract' },
                      { id: 'omra', label: 'Umrah Contract' },
                      { id: 'hajj', label: 'Hajj Contract' },
                      { id: selectedType === 'agency_client' ? 'custom' : 'other', label: selectedType === 'agency_client' ? 'Custom' : 'Other' },
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSelectSubtype(sub.id)}
                        className="p-5 glass-card border border-white/5 hover:border-gold/50 rounded-xl text-center transition-all group"
                      >
                        <span className="font-bold text-sm tracking-widest uppercase text-white/80 group-hover:text-gold transition-colors">{sub.label}</span>
                      </button>
                    ))}
                    <button onClick={() => setModalStep(1)} className="col-span-full mt-4 text-xs font-bold text-white/20 hover:text-white transition-colors uppercase tracking-[0.2em]">← Back to Classification</button>
                  </div>
                )}

                {modalStep === 3 && selectedTemplate && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-white/5">
                      {selectedTemplate.variables.map((v) => (
                        <div key={v} className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gold/60">{v.replace('_', ' ')}</label>
                          <input 
                            type={v.includes('date') ? 'date' : 'text'}
                            value={formData[v] || ''}
                            onChange={(e) => setFormData({...formData, [v]: e.target.value})}
                            placeholder={`Enter ${v}...`}
                            className="luxury-input w-full"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <button onClick={() => setModalStep(2)} className="luxury-button px-8 py-3 bg-white/5 hover:bg-white/10 text-white/40">Back</button>
                      <button 
                        onClick={handleCreateContract}
                        disabled={isGenerating}
                        className="luxury-button px-12 py-4 flex items-center gap-3"
                      >
                        {isGenerating ? 'Generating...' : 'Finalize & Generate Contract'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Manager Modal */}
      <AnimatePresence>
        {showTemplateManager && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateManager(false)}
              className="absolute inset-0 bg-navy/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-navy-light border border-white/10 rounded-3xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Contract Architect</h2>
                  <p className="text-gold/60 text-[10px] font-bold uppercase tracking-widest mt-1">Global Template Governance</p>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowTemplateManager(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><XCircle className="text-white/40" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map(t => (
                    <div key={t.id} className="glass-card p-6 border border-white/5 hover:border-gold/30 transition-all flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className="px-2 py-1 bg-gold/10 text-gold rounded text-[8px] font-black uppercase tracking-widest">{t.type}</div>
                        <div className="px-2 py-1 bg-white/5 text-white/40 rounded text-[8px] font-black uppercase tracking-widest">{t.subtype}</div>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{t.name}</h3>
                      <p dir="rtl" className="text-right text-gold/60 font-medium mb-4">{t.name_ar}</p>
                      <div className="mt-auto flex gap-2">
                        <button 
                          onClick={() => setEditingTemplate(t)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Edit Template
                        </button>
                        <button 
                          onClick={async () => {
                            if(window.confirm('Delete this template?')) {
                              const res = await fetch(`/api/contract_templates/${t.id}`, { method: 'DELETE' });
                              if (res.ok) fetchData();
                            }
                          }}
                          className="px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditingTemplate({} as ContractTemplate)}
                    className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[250px] hover:border-gold/30 hover:bg-gold/5 transition-all group"
                  >
                    <Plus className="w-10 h-10 text-white/10 group-hover:text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-gold">Add Custom Template</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Editor Modal */}
      <AnimatePresence>
        {editingTemplate && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 text-left">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTemplate(null)}
              className="absolute inset-0 bg-navy/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl bg-navy-light border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                  {editingTemplate.id ? 'Edit Template' : 'New Template'}
                </h2>
                <button onClick={() => setEditingTemplate(null)} className="p-2"><XCircle className="text-white/40" /></button>
              </div>
              <div className="p-10 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Template Name (FR)</label>
                    <input 
                      className="luxury-input w-full"
                      value={editingTemplate.name || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase text-right">اسم النموذج (AR)</label>
                    <input 
                      dir="rtl"
                      className="luxury-input w-full text-right"
                      value={editingTemplate.name_ar || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name_ar: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Classification</label>
                    <select 
                      className="luxury-input w-full"
                      value={editingTemplate.type || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, type: e.target.value})}
                    >
                      <option value="">Select Type</option>
                      <option value="partnership">Partnership</option>
                      <option value="subcontracting">Subcontracting</option>
                      <option value="agency_client">Agency-Client</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase">Subtype</label>
                    <input 
                      className="luxury-input w-full font-mono"
                      value={editingTemplate.subtype || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, subtype: e.target.value})}
                      placeholder="e.g. external_travel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase">Variables (Comma separated)</label>
                  <input 
                    className="luxury-input w-full font-mono text-xs"
                    value={editingTemplate.variables?.join(', ') || ''}
                    onChange={(e) => setEditingTemplate({...editingTemplate, variables: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    placeholder="client_name, price, destination, start_date, duration"
                  />
                  <p className="text-[8px] text-white/20 uppercase tracking-widest italic mt-1">Variables will be replaced in text using [VARIABLE_NAME]</p>
                </div>

                <div className="grid grid-cols-2 gap-8 h-[400px]">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">FRENCH VERSION</label>
                    <textarea 
                      className="luxury-input w-full flex-1 text-xs leading-relaxed font-mono resize-none"
                      value={editingTemplate.content_french || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, content_french: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">ARABIC VERSION</label>
                    <textarea 
                      dir="rtl"
                      className="luxury-input w-full flex-1 text-right text-lg leading-loose font-serif resize-none"
                      value={editingTemplate.content_arabic || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, content_arabic: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-white/10 flex justify-end gap-4 bg-white/5">
                 <button onClick={() => setEditingTemplate(null)} className="luxury-button bg-white/5 text-white/40 hover:bg-white/10 uppercase tracking-widest text-[10px] px-8">Discard</button>
                 <button 
                  onClick={() => handleSaveTemplate(editingTemplate)}
                  className="luxury-button px-12 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                  Save Template
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Word Template Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowUploadModal(false)} className="absolute inset-0 bg-navy/90 backdrop-blur-md" />
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="relative w-full max-w-xl bg-navy-light glass-card p-10 border border-gold/30">
              <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                      <FileUp className="w-6 h-6 text-gold" />
                      <h2 className="text-xl font-bold text-white uppercase tracking-widest">Upload .DOCX Template</h2>
                  </div>
                  <button onClick={() => setShowUploadModal(false)} className="p-2 text-white/40 hover:text-white"><XCircle /></button>
              </div>
              <div className="space-y-6">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                      <input 
                          type="file" 
                          accept=".docx" 
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="text-white text-xs"
                      />
                      <p className="text-[10px] text-white/40 uppercase">Recommended: template.docx with {"{{client_name}}"}, {"{{price}}"} placeholders</p>
                  </div>
                  <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase">Template Label</label>
                        <input className="luxury-input w-full" value={uploadData.name} onChange={e => setUploadData({...uploadData, name: e.target.value})} placeholder="e.g. Premium Business Trip" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/40 uppercase">Category</label>
                          <select className="luxury-input w-full" value={uploadData.type} onChange={e => setUploadData({...uploadData, type: e.target.value})}>
                              <option value="Voyage">Voyage</option>
                              <option value="Visa">Visa</option>
                              <option value="Omrah">Omrah</option>
                              <option value="Partner">Partner</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/40 uppercase">Subtype</label>
                          <input className="luxury-input w-full" value={uploadData.subtype} onChange={e => setUploadData({...uploadData, subtype: e.target.value})} placeholder="Individuel" />
                      </div>
                  </div>
                  <button onClick={handleUploadTemplate} className="luxury-button w-full flex items-center justify-center gap-3 py-4">
                      <FileUp className="w-5 h-5" />
                      <span>INITIALIZE SMART TEMPLATE</span>
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Contract Generation Modal */}
      <AnimatePresence>
        {showSmartModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowSmartModal(false)} className="absolute inset-0 bg-navy/90 backdrop-blur-md" />
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:20}} className="relative w-full max-w-4xl bg-navy-light glass-card p-0 border border-gold/30 flex flex-col max-h-[90vh]">
              <div className="p-8 bg-white/5 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <Bot className="w-8 h-8 text-gold" />
                      <div>
                        <h2 className="text-2xl font-bold text-white uppercase tracking-[0.2em]">Smart Generation</h2>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">AI-Assisted Legal Compilation</p>
                      </div>
                  </div>
                  <button onClick={() => setShowSmartModal(false)} className="p-2 text-white/40 hover:text-white"><XCircle className="w-8 h-8" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                      {/* Step 1: Select Template */}
                      <div className="space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gold" /> 1. Select Template
                          </h3>
                          <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-1 bg-white/5 rounded-xl border border-white/10">
                            {templates.filter(t => t.template_file_path).map(t => (
                              <button 
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`p-4 rounded-lg text-left transition-all flex items-center justify-between group ${selectedTemplate?.id === t.id ? 'bg-gold text-navy' : 'hover:bg-white/5 text-white/60'}`}
                              >
                                <div>
                                  <p className="font-bold text-xs">{t.name}</p>
                                  <p className={`text-[8px] uppercase tracking-widest ${selectedTemplate?.id === t.id ? 'text-navy/60' : 'text-white/20'}`}>{t.type} • {t.subtype}</p>
                                </div>
                                {selectedTemplate?.id === t.id && <Zap className="w-4 h-4 fill-current" />}
                              </button>
                            ))}
                            {templates.filter(t => t.template_file_path).length === 0 && (
                              <p className="p-10 text-center text-[10px] text-white/20 uppercase">No world templates uploaded.</p>
                            )}
                          </div>
                      </div>

                      {/* Step 2: Search Client */}
                      <div className="space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4 text-gold" /> 2. Connect Client
                          </h3>
                          <div className="relative">
                            <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <select 
                              className="luxury-input w-full pl-12 h-14"
                              value={selectedClientId}
                              onChange={e => setSelectedClientId(e.target.value)}
                            >
                              <option value="">Select Existing Client...</option>
                              {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.passport_number})</option>
                              ))}
                            </select>
                          </div>
                          <button className="text-[10px] text-gold hover:underline uppercase font-bold tracking-widest flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add New Client directly
                          </button>
                      </div>

                      {/* Step 3: Select Offer */}
                      <div className="space-y-4">
                          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-4 h-4 text-gold" /> 3. Attach Trip Offer
                          </h3>
                          <select 
                              className="luxury-input w-full h-14"
                              value={selectedOfferId}
                              onChange={e => setSelectedOfferId(e.target.value)}
                            >
                              <option value="">Select Offer (Optional)...</option>
                              {offers.map(o => (
                                <option key={o.id} value={o.id}>{o.title?.fr || o.title_fr} ({o.reference_number})</option>
                              ))}
                            </select>
                      </div>
                  </div>

                  <div className="space-y-8 bg-white/2 px-8 py-0 rounded-3xl border border-white/5">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest pt-8">4. Manual Provisions</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-white/40 uppercase font-black">Agreement Date</label>
                            <input 
                              type="date" 
                              className="luxury-input w-full" 
                              value={smartManualFields.contract_date}
                              onChange={e => setSmartManualFields({...smartManualFields, contract_date: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-white/40 uppercase font-black">Reference ID</label>
                            <input 
                              className="luxury-input w-full font-mono text-xs" 
                              value={smartManualFields.contract_number}
                              onChange={e => setSmartManualFields({...smartManualFields, contract_number: e.target.value})}
                            />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] text-white/40 uppercase font-black">Special Conditions</label>
                          <textarea 
                            className="luxury-input w-full h-32 resize-none text-xs p-4" 
                            placeholder="Add specific terms for this client..."
                            value={smartManualFields.special_conditions}
                            onChange={e => setSmartManualFields({...smartManualFields, special_conditions: e.target.value})}
                          ></textarea>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] text-white/40 uppercase font-black">Administrative Notes</label>
                          <input 
                            className="luxury-input w-full" 
                            placeholder="Internal use only"
                            value={smartManualFields.notes}
                            onChange={e => setSmartManualFields({...smartManualFields, notes: e.target.value})}
                          />
                      </div>

                      <div className="pt-4">
                        <button 
                          onClick={handleGenerateSmartContract}
                          disabled={!selectedClientId || !selectedTemplate || isGenerating}
                          className="luxury-button w-full h-16 flex items-center justify-center gap-4 text-base tracking-widest disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-6 h-6 animate-spin text-navy" />
                              <span className="text-navy">REPLACING PLACEHOLDERS...</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-6 h-6" />
                              <span>COMPILE SMART CONTRACT</span>
                            </>
                          )}
                        </button>
                      </div>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contracts;
