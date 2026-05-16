import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Clock, User, Download, Trash2, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface Attachment {
  id: number;
  filename: string;
  content_type: string;
  size: number;
}

interface EmailDetails {
  id: number;
  subject: string;
  sender: string;
  body_html: string;
  body_text: string;
  received_at: string;
  is_read: boolean;
  attachments: Attachment[];
}

const EmailView: React.FC = () => {
  const { clientId, messageId } = useParams<{ clientId: string, messageId: string }>();
  const navigate = useNavigate();
  const [email, setEmail] = useState<EmailDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmail();
  }, [messageId]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/messages/view/${messageId}`);
      if (response.ok) {
        const data = await response.json();
        setEmail(data);
      }
    } catch (error) {
      console.error('Failed to fetch email', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const response = await fetch(`/api/email/messages/${messageId}`, { method: 'DELETE' });
      if (response.ok) {
        navigate(`/clients/${clientId}/emails`);
      }
    } catch (error) {
      console.error('Failed to delete message', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/40 font-bold tracking-[0.2em] text-xs">DECRYPTING MESSAGE...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40">Email not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-gold hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(`/clients/${clientId}/emails`)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Messages</span>
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleDelete}
            className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="luxury-card overflow-hidden flex flex-col">
        {/* Email Header */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
          <h1 className="text-2xl font-bold text-white mb-6 leading-tight">
            {email.subject || '(No Subject)'}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-none mb-1">From</p>
                <p className="text-white font-semibold">{email.sender}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:justify-end">
              <div className="md:text-right">
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest leading-none mb-1">Received</p>
                <p className="text-white/80">{format(new Date(email.received_at), 'PPP p')}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10 hidden md:flex">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="p-6 bg-gold/5 border-b border-white/5 flex flex-wrap gap-4">
            {email.attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 transition-all group">
                <div className="p-2 rounded-lg bg-gold/10 text-gold">
                   <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">{att.filename}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-tight">{(att.size / 1024).toFixed(1)} KB • {att.content_type}</p>
                </div>
                <button className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-gold hover:bg-white/10 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Email Body */}
        <div className="p-8 min-h-[400px] bg-white/[0.01]">
          {email.body_html ? (
            <div 
              className="email-content text-white/80 leading-relaxed max-w-none"
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-white/80 leading-relaxed">
              {email.body_text}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailView;
