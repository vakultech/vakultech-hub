import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Kapian kapa nu Dios! (God bless you!) I'm the VakulTech translation bot. Type any word in Ivatan, Tagalog, or English, and I'll translate it for you!",
      type: 'text'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQuery = input.trim();
    const newUserMessage = { id: Date.now().toString(), sender: 'user', text: userQuery, type: 'text' };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const searchQuery = `%${userQuery}%`;
      const { data, error } = await supabase
        .from('dictionary')
        .select('*')
        .or(`ivatan.ilike.${searchQuery},tagalog.ilike.${searchQuery},english.ilike.${searchQuery}`)
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        // Create a result message containing the translations
        const botReply = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `Here's what I found for "${userQuery}":`,
          type: 'translation',
          results: data
        };
        setMessages(prev => [...prev, botReply]);
      } else {
        const botReply = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `I couldn't find any translations for "${userQuery}" in my dictionary yet.`,
          type: 'text'
        };
        setMessages(prev => [...prev, botReply]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Sorry, I encountered an error connecting to the database.',
        type: 'text'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', minHeight: '500px', maxWidth: '800px', margin: '0 auto', overflow: 'hidden', padding: 0 }}>
      
      {/* Chat Header */}
      <div style={{ padding: '20px', borderBottom: '1px solid var(--panel-border)', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ background: 'var(--primary-color)', padding: '10px', borderRadius: '50%', color: 'white' }}>
          <Bot size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '2px' }}>VakulTech Assistant</h2>
          <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Online
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#ffffff' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', gap: '15px', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            
            {msg.sender === 'bot' && (
              <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={20} color="var(--primary-color)" />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ 
                background: msg.sender === 'user' ? 'var(--primary-color)' : '#f1f5f9', 
                color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                padding: '16px 22px',
                borderRadius: '16px',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                lineHeight: '1.6',
                fontSize: '1rem',
                boxShadow: msg.sender === 'user' ? '0 4px 10px rgba(79, 70, 229, 0.2)' : '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                {msg.text}
              </div>

              {/* Translation Grid (Only for bot translation responses) */}
              {msg.type === 'translation' && msg.results && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {msg.results.map((item, index) => (
                    <div key={index} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ivatan</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem', wordBreak: 'break-word' }}>{item.ivatan}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tagalog</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem', wordBreak: 'break-word' }}>{item.tagalog}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>English</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.05rem', wordBreak: 'break-word' }}>{item.english}</span>
                        </div>
                      </div>
                      {item.category && (
                         <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <Globe size={14} /> <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>{item.category}</span>
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {msg.sender === 'user' && (
              <div style={{ width: '36px', height: '36px', background: 'var(--primary-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={20} color="white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: '15px', alignSelf: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={20} color="var(--primary-color)" />
            </div>
            <div style={{ background: '#f1f5f9', padding: '12px 18px', borderRadius: '16px', borderTopLeftRadius: '4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span className="dot-typing"></span>
              <span className="dot-typing" style={{ animationDelay: '0.2s' }}></span>
              <span className="dot-typing" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid var(--panel-border)', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Ask for a translation..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ borderRadius: '24px', paddingLeft: '20px' }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, flexShrink: 0 }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
