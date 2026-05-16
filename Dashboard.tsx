import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  Users, 
  PlaneTakeoff, 
  FileText, 
  TrendingUp, 
  ChevronUp, 
  Clock,
  ArrowUpRight,
  AlertCircle,
  Mail,
  Bell,
  Eye
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const dataSet = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 19 },
  { name: 'Mar', value: 15 },
  { name: 'Apr', value: 22 },
  { name: 'May', value: 30 },
  { name: 'Jun', value: 25 },
];

const categoryData = [
  { name: 'Internal', count: 45, color: '#D4AF37' },
  { name: 'External', count: 32, color: '#60A5FA' },
  { name: 'Visas', count: 28, color: '#F87171' },
  { name: 'Hajj & Umrah', count: 54, color: '#34D399' },
];

const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userRole, user } = useAuth();
  
  const [counts, setCounts] = useState({
    clients: 0,
    offers: 0,
    contracts: 0,
    reservations: 0,
    activity: 0,
    visa_requests: 0,
    visa_revenue: 0
  });
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [emailAlerts, setEmailAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchEmailAlerts();
  }, [userRole]);

  const fetchEmailAlerts = async () => {
    try {
      const res = await fetch('/api/email/alerts');
      if (res.ok) setEmailAlerts(await res.json());
    } catch (error) {
      console.error('Failed to fetch email alerts', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, clientsRes, activityRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/recent-clients'),
        fetch('/api/dashboard/recent-activity')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setCounts({
          clients: statsData.clients || 0,
          offers: statsData.offers || 0,
          contracts: statsData.contracts || 0,
          reservations: statsData.reservations || 0,
          activity: statsData.activity || 0,
          visa_requests: statsData.visa_requests || 0,
          visa_revenue: statsData.visa_revenue || 0
        });
      }
      if (clientsRes.ok) setRecentClients(await clientsRes.json());
      if (activityRes.ok) setRecentActivity(await activityRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: t('totalClients'), value: counts.clients.toLocaleString(), icon: Users, trend: '+12.5%', color: 'border-gold' },
    { label: "Visa Requests", value: counts.visa_requests.toLocaleString(), icon: FileText, trend: 'NEW', color: 'border-gold' },
    { label: "Visa Revenue", value: (counts.visa_revenue).toLocaleString() + ' DZD', icon: TrendingUp, trend: 'LIVE', color: 'border-emerald-500' },
    { label: t('reservations'), value: counts.reservations.toLocaleString(), icon: Clock, trend: '+18%', color: 'border-gold' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-gold bg-clip-text text-transparent tracking-tight">
            {t('welcome')}, {user?.fullName || 'Admin'}
          </h1>
          <p className="text-white/40 mt-2 font-medium">Monitoring the ASSABIKA TRAVEL operational infrastructure.</p>
        </div>
        <div className="flex gap-4">
          <button className="luxury-button-outline text-xs tracking-[0.2em]">
            {t('export')}
          </button>
          <button className="luxury-button text-xs tracking-[0.2em]">
            + {t('add')} {t('clients')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`stat-card group cursor-default border-white/5`}
          >
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white group-hover:text-gold transition-colors">{stat.value}</h3>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-full w-fit">
                <ChevronUp className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-3xl group-hover:bg-gold transition-all duration-500 shadow-xl shadow-transparent group-hover:shadow-gold/20">
              <stat.icon className="w-6 h-6 text-gold group-hover:text-navy transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Warning/Alert Section - Redesigned as a prestige notification card */}
      <div className="bg-gradient-to-br from-gold to-gold-dark rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 justify-between shadow-2xl shadow-gold/10 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-navy/20 rounded-2xl flex items-center justify-center text-navy shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-navy text-xl font-black uppercase tracking-tight">{t('contractExpiring')}</h3>
            <p className="text-navy/70 text-sm font-medium max-w-md mt-1">3 critical partnership contracts require immediate renewal to maintain service continuity.</p>
          </div>
        </div>
        <button className="luxury-button !bg-navy !text-gold !shadow-none hover:!bg-navy-light text-xs px-10 relative z-10 font-black">
          RENEW CONTRACTS NOW
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              Monthly Client Registrations
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-3 h-3 bg-gold rounded-full" />
              Last 6 Months
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataSet}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0A192F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#D4AF37', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Dashboard Intelligence Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Visa Email Alerts Widget */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 glass-card p-6 border-gold/20 bg-gold/5"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2 text-gold">
                    <Bell className="w-5 h-5 animate-bounce" />
                    Visa Email Alerts
                </h3>
                <span className="px-2 py-0.5 bg-gold/20 text-gold rounded text-[10px] font-bold uppercase tracking-widest">
                    {emailAlerts.length} New
                </span>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {emailAlerts.length > 0 ? emailAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-gold/30 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                             <p className="text-[10px] font-bold text-gold uppercase tracking-tighter truncate w-32">{alert.sender}</p>
                             <span className="text-[8px] text-white/20 font-mono">
                                 {alert.received_at ? new Date(alert.received_at).toLocaleTimeString() : '--:--'}
                             </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2 line-clamp-1">{alert.subject}</h4>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <span className="text-[10px] text-white/40 italic">{alert.first_name} {alert.last_name}</span>
                            <button className="p-1 hover:text-gold transition-colors">
                                <Eye className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="py-10 flex flex-col items-center justify-center text-white/10">
                        <Mail className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">System Clear</p>
                    </div>
                )}
            </div>
            <button className="w-full mt-6 py-3 border border-gold/10 hover:bg-gold/5 rounded-xl text-[10px] font-black text-gold uppercase tracking-[0.2em] transition-all">
                Access Central Inbox
            </button>
        </motion.div>

        {/* Categories Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <PlaneTakeoff className="w-4 h-4 text-gold" />
              Offers by Category
            </h3>
            <ArrowUpRight className="w-4 h-4 text-white/40 cursor-pointer hover:text-gold transition-colors" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#112240', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Second Row: Recent Activity & Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-1 glass-card p-6 h-fit">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            {t('recentActivity')}
          </h3>
          <div className="space-y-6">
            {recentActivity.length > 0 ? recentActivity.map((log) => (
              <div key={log.id} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0 border border-gold/20">
                  <TrendingUp className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs text-white/40">{log.details}</p>
                  <p className="text-[10px] font-bold text-gold mt-1 uppercase">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-white/20 text-xs text-center py-10 italic">No recent activity detected.</p>
            )}
          </div>
          <button className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
            View All Logs
          </button>
        </div>

        {/* Recent Clients Table */}
        <div className="lg:col-span-2 glass-card p-6 overflow-hidden">
          <h3 className="font-bold mb-6 flex items-center justify-between">
            Top Recent Clients
            <span className="text-xs text-gold hover:underline cursor-pointer">View All</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-widest border-b border-white/10">
                  <th className="pb-4 font-bold">Client Name</th>
                  <th className="pb-4 font-bold">Passport</th>
                  <th className="pb-4 font-bold">Category</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentClients.length > 0 ? recentClients.map((client) => (
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold uppercase">
                          {client.first_name?.[0] || '?'}{client.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold">{client.first_name} {client.last_name}</p>
                          <p className="text-xs text-white/40">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-white/60">{client.passport_number || 'N/A'}</td>
                    <td className="py-4 font-medium text-gold">Elite Traveler</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase">
                        Active
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button className="p-2 hover:bg-gold hover:text-navy rounded-lg transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-white/20 italic text-xs">No client records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
