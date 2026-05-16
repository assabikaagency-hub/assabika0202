import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, Eye, Trash2, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface EmailMessage {
  id: number;
  subject: string;
  sender: string;
  received_at: string;
  is_read: boolean;
}

const ClientEmails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchClient();
    fetchMessages();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const clients = await response.json();
        const found = clients.find((c: any) => c.id === parseInt(clientId || '0'));
        setClient(found);
      }
    } catch (error) {
      console.error('Failed to fetch client', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email/messages/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmails = async () => {
    try {
      setChecking(true);
      const response = await fetch(`/api/email/check/${clientId}`, { method: 'POST' });
      if (response.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to check emails', error);
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Delete this message?')) return;
    try {
      const response = await fetch(`/api/email/messages/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessages(messages.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete message', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/clients')}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Email Communications</h2>
            <p className="text-sm text-white/40 mt-1">
              Monitoring for {client ? `${client.first_name} ${client.last_name}` : 'Client'}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleCheckEmails}
            disabled={checking}
            className={`luxury-button flex items-center gap-2 ${checking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check New Messages'}
          </button>
        </div>
      </div>

      <div className="luxury-card overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-white/20">
            <RefreshCw className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold tracking-widest uppercase text-xs">Synchronizing Intelligence...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-white/20">
            <Mail className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-semibold text-white/40">No messages found for this client.</p>
            <p className="text-sm">Configure IMAP settings to start monitoring.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map((message) => (
              <div 
                key={message.id}
                onClick={() => navigate(`/clients/${clientId}/emails/${message.id}`)}
                className={`p-6 flex items-center gap-6 hover:bg-white/5 transition-all cursor-pointer group ${!message.is_read ? 'bg-gold/5' : ''}`}
              >
                <div className={`p-3 rounded-full ${!message.is_read ? 'bg-gold/20 text-gold' : 'bg-white/5 text-white/20'}`}>
                  {message.is_read ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6 animate-pulse" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-sm font-bold truncate ${!message.is_read ? 'text-white' : 'text-white/60'}`}>
                      {message.sender}
                    </span>
                    <span className="text-[10px] text-white/20 font-mono">
                      {format(new Date(message.received_at), 'PPP p')}
                    </span>
                  </div>
                  <h3 className={`text-base truncate ${!message.is_read ? 'font-bold text-gold' : 'text-white/80'}`}>
                    {message.subject || '(No Subject)'}
                  </h3>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clients/${clientId}/emails/${message.id}`);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-gold hover:bg-white/10"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, message.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-white/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientEmails;
