import { useState, useEffect } from 'react';
import { MessageSquare, Send, Mail, Phone, MapPin, User, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Support() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState({
    name: '',
    message: ''
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Could not load messages. The database table might not be set up yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.name.trim() || !newMessage.message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([{
          name: newMessage.name.trim(),
          message: newMessage.message.trim()
        }])
        .select();

      if (error) throw error;

      // Add the new message to the top of the list
      if (data && data.length > 0) {
        setMessages(prev => [data[0], ...prev]);
      }
      setNewMessage({ name: '', message: '' });
    } catch (err) {
      console.error('Error submitting message:', err);
      setError('Failed to post message. Ensure the support_messages table exists.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--primary-color)' }}>
          Community Support
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Have a question or feedback? Post a public message below or contact us directly.
        </p>
      </div>

      {/* Message Board */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px', background: '#ffffff' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.4rem' }}>
          <MessageSquare color="var(--primary-color)" /> Public Message Board
        </h3>

        {/* Message Form */}
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid var(--panel-border)' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Your Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Juan Dela Cruz"
              value={newMessage.name}
              onChange={(e) => setNewMessage({...newMessage, name: e.target.value})}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '500' }}>Message</label>
            <textarea 
              className="input-field" 
              placeholder="Write your question or feedback here..."
              style={{ minHeight: '100px', resize: 'vertical' }}
              value={newMessage.message}
              onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Posting...' : <><Send size={18} /> Post Message</>}
          </button>
          
          {error && <p style={{ color: 'var(--error-color)', marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
        </form>

        {/* Messages List */}
        <div>
          <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Recent Messages</h4>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              No messages yet. Be the first to post!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#0f172a' }}>
                      <div style={{ background: '#e0e7ff', padding: '6px', borderRadius: '50%', color: 'var(--primary-color)' }}>
                        <User size={16} />
                      </div>
                      {msg.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <Clock size={12} />
                      {new Date(msg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '0.95rem' }}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Details Footer */}
      <div className="glass-panel" style={{ padding: '30px', background: 'var(--primary-color)', color: 'white', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.5rem', color: 'white' }}>Contact Us Directly</h3>
        <div className="responsive-grid" style={{ gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
            <Mail size={24} style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ color: 'white', marginBottom: '5px' }}>Email</h4>
            <p style={{ opacity: 0.9 }}>support@vakultech.com</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px' }}>
            <Phone size={24} style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ color: 'white', marginBottom: '5px' }}>Phone</h4>
            <p style={{ opacity: 0.9 }}>+63 912 345 6789</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', gridColumn: '1 / -1' }}>
            <MapPin size={24} style={{ margin: '0 auto 10px auto' }} />
            <h4 style={{ color: 'white', marginBottom: '5px' }}>Address</h4>
            <p style={{ opacity: 0.9 }}>Basco, Batanes, Philippines</p>
          </div>
        </div>
      </div>
    </div>
  );
}
