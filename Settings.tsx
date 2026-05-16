import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Users,
  Globe, 
  Shield, 
  Bell, 
  Database, 
  Moon, 
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ManageEmployees from '../components/ManageEmployees';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { user, userRole } = useAuth();
  
  const [activeView, setActiveView] = useState<'main' | 'employees'>('main');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setPasswordError('');
    
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update password');
      }
      
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setPasswordData({ current: '', new: '', confirm: '' });
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm(t('confirmClearLogs') || 'Clear all logs?')) return;
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      alert('Logs cleared successfully');
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const exportData = () => {
    window.open('/api/clients', '_blank');
  };

  const sections = [
    {
      title: 'Agency Identity',
      items: [
        { icon: User, label: 'Profile Information', detail: user?.fullName || user?.username || 'Administrator' },
        { 
          icon: Shield, 
          label: 'Account Security', 
          detail: 'Change your access password', 
          onClick: () => setShowPasswordModal(true) 
        },
        { icon: Bell, label: 'Notification Settings', detail: 'Email, Push and In-App' },
      ]
    },
    {
      title: 'Team Management',
      adminOnly: true,
      items: [
        { 
          icon: Users, 
          label: language === 'ar' ? 'إدارة الموظفين' : 'Manage Employees', 
          detail: 'Control roles and granular permissions',
          onClick: () => setActiveView('employees')
        },
      ]
    },
    {
      title: 'System Preferences',
      items: [
        { icon: Globe, label: 'Primary Language', detail: language === 'ar' ? 'Arabic (Default)' : language === 'fr' ? 'French' : 'English', action: true },
        { icon: Moon, label: 'Interface Theme', detail: 'Luxury Dark (Standard)' },
      ]
    }
  ];

  if (activeView === 'employees') {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <button 
          onClick={() => setActiveView('main')}
          className="flex items-center gap-2 text-white/40 hover:text-gold transition-colors font-bold uppercase tracking-widest text-[10px]"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Settings
        </button>
        <ManageEmployees />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex items-center gap-6">
        <div className="p-4 bg-gold rounded-3xl shadow-gold translate-y-[-4px]">
          <SettingsIcon className="w-10 h-10 text-navy" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-wider">{t('settings')}</h1>
          <p className="text-white/40 text-sm mt-1">Configure your personalized luxury travel workspace.</p>
        </div>
      </div>

      <div className="glass-card p-10 flex flex-col md:flex-row items-center gap-10 border-t-4 border-gold">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-gold/30 p-1">
             <div className="w-full h-full rounded-full bg-navy-light flex items-center justify-center text-4xl font-bold text-gold shrink-0">
                {user?.fullName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'A'}
             </div>
          </div>
          <div className="absolute bottom-0 right-0 p-3 bg-gold text-navy rounded-full shadow-lg">
             <Shield className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-2xl font-bold">{user?.fullName || 'Administrator'}</h2>
          <p className="text-gold font-bold uppercase tracking-widest text-xs">{userRole || 'Super Administrator'}</p>
          <p className="text-white/40 text-sm">{user?.username}</p>
          <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
             <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/40 uppercase">Role: {userRole}</span>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section, si) => {
          if (section.adminOnly && userRole !== 'admin') return null;
          return (
            <div key={si} className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 px-2">{section.title}</h3>
              <div className="glass-card divide-y divide-white/5 overflow-hidden">
                {section.items.map((item, ii) => (
                  <div 
                   key={ii} 
                   onClick={item.onClick}
                   className={`flex items-center justify-between p-6 hover:bg-white/5 transition-all group ${item.onClick ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-center gap-6">
                       <div className="p-3 bg-navy rounded-xl border border-white/5 group-hover:border-gold/30 transition-all">
                         <item.icon className="w-5 h-5 text-gold" />
                       </div>
                       <div>
                         <p className="font-bold text-white group-hover:text-gold transition-colors">{item.label}</p>
                         <p className="text-xs text-white/40 mt-0.5">{item.detail}</p>
                       </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-gold transition-all group-hover:translate-x-1" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="glass-card p-10 bg-gradient-to-br from-gold/5 via-transparent to-transparent flex flex-col gap-6">
           <div className="flex items-center gap-4">
              <Globe className="w-6 h-6 text-gold" />
              <h3 className="font-bold text-lg">Interface Language</h3>
           </div>
           <div className="flex flex-wrap gap-4 pt-4">
              {[
                { id: 'ar', label: 'العربية (السعودية)', flag: '🇸🇦' },
                { id: 'fr', label: 'Français (France)', flag: '🇫🇷' },
                { id: 'en', label: 'English (UK)', flag: '🇬🇧' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={`flex-1 min-w-[200px] p-6 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                    language === lang.id 
                    ? 'bg-gold border-gold text-navy shadow-gold' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-gold/30'
                  }`}
                >
                  <span className="text-2xl block mb-2">{lang.flag}</span>
                  <span className="font-bold uppercase tracking-widest text-xs">{lang.label}</span>
                  {language === lang.id && (
                    <motion.div layoutId="setting-active" className="absolute top-2 right-2 w-2 h-2 bg-navy rounded-full" />
                  )}
                </button>
              ))}
           </div>
        </div>

        {userRole === 'admin' && (
          <div className="p-10 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col md:flex-row items-center gap-8 justify-between">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-red-500/10 rounded-2xl">
                  <Database className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Critical Infrastructure</h3>
                  <p className="text-xs text-white/40 mt-1">Actions in this zone affect the core integrity of the agency database.</p>
                </div>
             </div>
             <div className="flex gap-4">
                <button onClick={clearLogs} className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Clear Logs</button>
                <button onClick={exportData} className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Export Data</button>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/90 backdrop-blur-xl"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-10 border-t-4 border-gold"
            >
              {passwordSuccess ? (
                <div className="flex flex-col items-center py-10 text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Password Updated</h2>
                  <p className="text-white/40">Your account security has been hardened.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest">Update Security</h2>
                  
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Current Password</label>
                       <div className="relative group">
                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                         <input 
                           required
                           type={showCurrent ? "text" : "password"}
                           value={passwordData.current}
                           onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                           className="luxury-input w-full pl-12 pr-12"
                           placeholder="••••••••"
                         />
                         <button 
                          type="button" 
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                         >
                           {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">New Password</label>
                       <div className="relative group">
                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                         <input 
                           required
                           type={showNew ? "text" : "password"}
                           value={passwordData.new}
                           onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                           className="luxury-input w-full pl-12 pr-12"
                           placeholder="Min 6 characters"
                         />
                         <button 
                          type="button" 
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                         >
                           {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                         </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Confirm Password</label>
                       <input 
                         required
                         type="password"
                         value={passwordData.confirm}
                         onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                         className="luxury-input w-full"
                         placeholder="Confirm new password"
                       />
                    </div>

                    {passwordError && (
                      <p className="text-red-500 text-xs font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{passwordError}</p>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setShowPasswordModal(false)}
                        className="flex-1 px-8 py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-black text-white/60 hover:text-white"
                      >
                        {t('cancel')}
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        className="flex-1 luxury-button px-8 py-4"
                      >
                        {loading ? 'Processing...' : 'UPDATE'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
