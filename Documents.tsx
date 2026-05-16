import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Files as FilesIcon, 
  Search, 
  Upload, 
  Download, 
  Trash2, 
  Grid, 
  List, 
  File, 
  Image as ImageIcon,
  FileText,
  FileCode,
  SearchX,
  MoreVertical,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AppFile {
  id: string;
  name: string;
  type: string;
  size: string;
  created_at: string;
  category: 'client' | 'offer' | 'contract' | 'general';
  url?: string;
}

const Documents: React.FC = () => {
  const { t } = useTranslation();
  const { userRole } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [files, setFiles] = useState<AppFile[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type.split('/')[1] || 'binary',
          size: `${(file.size / 1024).toFixed(1)} KB`,
          category: 'general'
        })
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (e) {
      console.error('Failed to upload document:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFiles();
      }
    } catch (e) {
      console.error('Failed to delete document:', e);
    }
  };

  const getFileIcon = (type: string) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'image'].includes(type.toLowerCase())) 
      return <ImageIcon className="w-6 h-6 text-emerald-400" />;
    
    if (['pdf'].includes(type.toLowerCase())) 
      return <FileText className="w-6 h-6 text-red-400" />;
    
    if (['doc', 'docx'].includes(type.toLowerCase())) 
      return <File className="w-6 h-6 text-emerald-400" />;
    
    return <FileCode className="w-6 h-6 text-gold" />;
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white uppercase tracking-wider">{t('documents')}</h1>
          <p className="text-white/40 text-sm mt-1">Organized archival of all agency assets and legal records.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="luxury-button flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Assets
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input 
            type="text" 
            placeholder="Search documents by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="luxury-input w-full pl-12"
          />
        </div>
        <div className="flex gap-2 bg-navy-light p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-gold text-navy' : 'text-white/40 hover:text-white'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold text-navy' : 'text-white/40 hover:text-white'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
        <button className="px-6 py-3 glass-card flex items-center gap-2 text-white/60 font-bold text-[10px] tracking-widest uppercase hover:text-gold transition-colors">
          <Filter className="w-4 h-4" /> Filter Categories
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredFiles.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredFiles.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6 flex flex-col group hover:border-gold/50 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-2 hover:bg-white/10 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-white/40" />
                     </button>
                  </div>

                  <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mb-6 border border-white/5 transition-transform group-hover:scale-110 duration-300">
                    {getFileIcon(file.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate mb-1 text-white group-hover:text-gold transition-colors">
                      {file.name}
                    </h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                      {file.size} • {formatTimestamp(file.created_at)}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter border ${
                      file.category === 'contract' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      file.category === 'client' ? 'bg-gold/10 text-gold border-gold/20' :
                      file.category === 'offer' ? 'bg-gold/10 text-gold border-gold/20' :
                      'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {file.category}
                    </span>
                    <div className="flex gap-2">
                      <a 
                        href={file.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 hover:bg-gold/10 hover:text-gold rounded-lg transition-colors"
                        title="View/Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 border-b border-white/10">
                <tr>
                  <th className="px-8 py-4">Name</th>
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4">Size</th>
                  <th className="px-8 py-4">Uploaded</th>
                  <th className="px-8 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        {getFileIcon(file.type)}
                        <span className="font-bold group-hover:text-gold transition-colors">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 uppercase text-[10px] font-bold text-white/40">{file.category}</td>
                    <td className="px-8 py-4 font-mono text-white/40">{file.size}</td>
                    <td className="px-8 py-4 text-white/40">{formatTimestamp(file.created_at)}</td>
                    <td className="px-8 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <a 
                            href={file.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 hover:text-gold transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleDelete(file.id)}
                            className="p-2 hover:text-red-400 transition-colors"
                            title="Delete"
                          ><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="py-20 flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
            <SearchX className="w-10 h-10 text-white/10" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white/40">No documents found</p>
            <p className="text-sm text-white/20 mt-1">Try uploading a document to see it here.</p>
          </div>
          <button className="luxury-button-outline" onClick={() => setSearchTerm('')}>Clear Search</button>
        </div>
      )}
    </div>
  );
};

export default Documents;

