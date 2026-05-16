import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { PlaneTakeoff, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { dir, language, setLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Nom d\'utilisateur ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6 relative overflow-hidden" dir={dir}>
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-10 relative z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-gold to-gold-light rounded-full flex items-center justify-center shadow-2xl shadow-gold/30 mb-2">
            <PlaneTakeoff className="text-navy w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[0.2em] text-gold uppercase">
              {language === 'ar' ? 'السَّبيكة للسفر' : 'ASSABIKA TRAVEL'}
            </h1>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.5em] font-black mt-1">
              {language === 'ar' ? 'رحلات فاخرة وموثوقة' : 'PREMIUM TRAVEL SERVICES'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
              {t('username')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-white/20 group-focus-within:text-gold transition-colors" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="luxury-input w-full pl-11 font-bold"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">
              {t('password')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-white/20 group-focus-within:text-gold transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="luxury-input w-full pl-11 font-bold"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="luxury-button w-full py-4 flex items-center justify-center gap-3 group text-xs tracking-[0.3em] font-black"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {t('login')}
                <PlaneTakeoff className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black">
            Global Hub Authentication
          </p>
          <div className="flex gap-4">
            <button onClick={() => setLanguage('ar')} className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all tracking-widest ${language === 'ar' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white bg-white/5 border border-white/5'}`}>
              AR
            </button>
            <button onClick={() => setLanguage('fr')} className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all tracking-widest ${language === 'fr' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white bg-white/5 border border-white/5'}`}>
              FR
            </button>
            <button onClick={() => setLanguage('en')} className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all tracking-widest ${language === 'en' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white/40 hover:text-white bg-white/5 border border-white/5'}`}>
              EN
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
