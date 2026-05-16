import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  User, 
  Terminal, 
  Search, 
  Filter, 
  Download,
  AlertCircle,
  Database,
  History,
  Eye,
  Clock,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  timestamp: string;
  status: 'success' | 'warning' | 'danger' | 'error';
  ip?: string;
}

const Logs: React.FC = () => {
  const { t } = useTranslation();
  const { userRole } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [userRole]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm(t('confirmClearLogs') || 'Are you sure you want to clear all logs?')) return;
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'success': return 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
      case 'warning': return 'border-orange-500/20 text-orange-400 bg-orange-500/5';
      case 'danger':
      case 'error': return 'border-red-500/20 text-red-400 bg-red-500/5';
      default: return 'border-white/10 text-white/40 bg-white/5';
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts) return 'Just now';
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider">{t('logs')}</h1>
            <p className="text-white/40 text-sm mt-1">Audit trail and system security monitoring.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 glass-card flex items-center gap-2 text-white/60 font-bold text-[10px] tracking-widest uppercase hover:text-gold transition-colors">
            <Database className="w-4 h-4" /> Backup Database
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search logs by user, action or IP..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="luxury-input w-full pl-12 text-sm" 
          />
        </div>
        <button className="glass-card px-6 py-3 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all">
          <Filter className="w-4 h-4" /> Date Range
        </button>
        <button className="luxury-button flex items-center justify-center gap-2 text-[10px] tracking-widest">
          <Download className="w-4 h-4" /> Export Audit
        </button>
      </div>

      {/* Terminal View */}
      <div className="glass-card bg-[#020617] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5">
               <div className="w-3 h-3 bg-red-500/20 rounded-full" />
               <div className="w-3 h-3 bg-yellow-500/20 rounded-full" />
               <div className="w-3 h-3 bg-green-500/20 rounded-full" />
             </div>
             <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em] font-bold">System Console — v4.2.0</span>
          </div>
          <div className="flex items-center gap-4 text-emerald-400/60 text-[10px] font-mono animate-pulse">
            <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            LIVE MONITORING ACTIVE
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-white/20 border-b border-white/5">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Operation</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Network Address</th>
                <th className="px-6 py-4 text-right">Report</th>
              </tr>
            </thead>
            <tbody className="text-[11px] divide-y divide-white/5">
              <AnimatePresence>
                {filteredLogs.map((log) => (
                  <motion.tr 
                    key={log.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-white/40">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <User className="w-3 h-3 text-gold" />
                         <span className="text-white font-bold">{log.user_email?.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black tracking-tighter ${getStatusStyle(log.status || 'success')}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-blue-400/60">{log.ip || '---.---.---.---'}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 px-3 bg-white/5 hover:bg-gold hover:text-navy rounded transition-all text-[9px] font-bold">
                         RAW
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <History className="w-5 h-5 text-gold" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Efficiency</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">No critical system failures detected in the last 48 hours. Performance is optimal.</p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
               <span className="text-lg">99.98%</span> Uptime
            </div>
         </div>
         <div className="glass-card p-6 flex flex-col gap-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Security Health</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">Minor threat: Brute force attempt detected on admin panel from unknown region.</p>
            <button className="text-[10px] font-bold text-gold uppercase tracking-widest hover:underline text-left">Review Attack Report</button>
         </div>
         <div className="glass-card p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Eye className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Access Nodes</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">System accessed from 3 unique locations today (Office, HQ, Remote).</p>
            <div className="flex -space-x-2">
               {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-navy bg-gold/20" />)}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Logs;
