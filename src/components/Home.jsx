import { Link } from 'react-router-dom';
import { MessageSquare, CalendarDays, MapPin, Compass } from 'lucide-react';

export default function Home() {
  return (
    <div className="animate-fade-in" style={{ padding: '20px 0' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '60px', padding: '40px 20px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0e7ff', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
          <Compass size={40} color="var(--primary-color)" />
        </div>
        <h1 style={{ fontSize: '3rem', marginBottom: '15px', color: 'var(--primary-color)' }}>
          Welcome to VakulTech Hub
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Your digital companion for exploring Batanes. Translate local languages instantly and discover upcoming cultural events.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="responsive-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Translator Card */}
        <div className="glass-panel" style={{ padding: '40px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '50%', border: '1px solid var(--panel-border)' }}>
            <MessageSquare size={32} color="#10b981" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>AI Chat Translator</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', lineHeight: '1.5' }}>
              Chat with our smart bot to seamlessly translate between Ivatan, Tagalog, and English.
            </p>
          </div>
          <Link to="/chat" className="btn btn-primary" style={{ width: '100%', padding: '14px', background: '#10b981' }}>
            Open Translator
          </Link>
        </div>

        {/* Events Card */}
        <div className="glass-panel" style={{ padding: '40px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '50%', border: '1px solid var(--panel-border)' }}>
            <CalendarDays size={32} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Local Events</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', lineHeight: '1.5' }}>
              Stay updated with the latest festivals, community gatherings, and cultural events in Batanes.
            </p>
          </div>
          <Link to="/events" className="btn btn-primary" style={{ width: '100%', padding: '14px', background: '#f59e0b' }}>
            View Calendar
          </Link>
        </div>

      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', marginTop: '80px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <MapPin size={16} /> Batanes, Philippines
      </div>
    </div>
  );
}
