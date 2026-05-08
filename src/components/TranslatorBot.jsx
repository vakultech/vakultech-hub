import { useState } from 'react';
import { Search, Globe, Sparkles, Languages } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TranslatorBot() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Search across all three language columns simultaneously
      const searchQuery = `%${query.trim()}%`;
      const { data, error } = await supabase
        .from('dictionary')
        .select('*')
        .or(`ivatan.ilike.${searchQuery},tagalog.ilike.${searchQuery},english.ilike.${searchQuery}`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch translations. Check your database connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '40px 30px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0e7ff', padding: '12px', borderRadius: '50%', marginBottom: '15px' }}>
          <Languages size={32} color="var(--primary-color)" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
          Unified Translator
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Search in Ivatan, Tagalog, or English. We'll instantly translate it.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <Search size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '16px' }} />
          <input 
            type="text" 
            className="input-field" 
            style={{ paddingLeft: '48px', fontSize: '1.1rem', padding: '16px 16px 16px 48px', borderRadius: '12px' }}
            placeholder="Type any word or phrase..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0 30px', fontSize: '1.1rem', borderRadius: '12px' }} disabled={loading}>
          {loading ? 'Searching...' : 'Translate'}
        </button>
      </form>

      {error && (
        <div style={{ padding: '15px', background: '#fee2e2', color: 'var(--error-color)', borderRadius: '10px', border: '1px solid var(--error-color)', marginBottom: '30px' }}>
          {error}
        </div>
      )}

      <div>
        {results.length > 0 ? (
          <div>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }}/> 
              Translations Found
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {results.map((item) => (
                <div key={item.id} className="glass-panel" style={{ padding: '25px', background: '#ffffff', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Decorative side accent */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary-color)' }}></div>
                  
                  <div className="responsive-grid" style={{ gap: '20px' }}>
                    
                    {/* Ivatan Block */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ivatan</span>
                      <p style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '5px', color: '#0f172a' }}>{item.ivatan}</p>
                    </div>

                    {/* Tagalog Block */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tagalog</span>
                      <p style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '5px', color: '#0f172a' }}>{item.tagalog}</p>
                    </div>

                    {/* English Block */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #f1f5f9', gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>English</span>
                      <p style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '5px', color: '#0f172a' }}>{item.english}</p>
                    </div>

                  </div>
                  
                  {item.category && (
                    <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Globe size={14} /> Category: <span style={{ fontWeight: '500', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>{item.category}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loading && hasSearched && !error && (
            <div style={{ textAlign: 'center', background: '#f8fafc', padding: '40px', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'inline-flex', background: '#e2e8f0', padding: '15px', borderRadius: '50%', marginBottom: '15px' }}>
                <Search size={24} color="#64748b" />
              </div>
              <h3 style={{ color: '#0f172a', marginBottom: '10px' }}>No translations found</h3>
              <p style={{ color: 'var(--text-secondary)' }}>We couldn't find a match for "{query}". Try searching for another word in Ivatan, Tagalog, or English.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
