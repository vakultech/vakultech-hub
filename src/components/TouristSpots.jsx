import { useState, useEffect } from 'react';
import { Map, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function TouristSpots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const { data, error } = await supabase
        .from('spots')
        .select('*')
        .order('id', { ascending: true });
        
      if (error) throw error;
      setSpots(data || []);
    } catch (error) {
      console.error('Error fetching spots:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#dcfce7', padding: '16px', borderRadius: '50%', marginBottom: '15px' }}>
          <Map size={32} color="#10b981" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Discover Batanes</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Explore breathtaking landscapes and iconic tourist spots.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading beautiful spots...</div>
      ) : spots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No tourist spots added yet. Admins can add them in the dashboard!</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {spots.map(spot => (
            <div key={spot.id} className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '220px', width: '100%', backgroundColor: '#f1f5f9' }}>
                {spot.image_url ? (
                  <img 
                    src={spot.image_url} 
                    alt={spot.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No Image</div>
                )}
              </div>
              <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: 'var(--text-primary)' }}>{spot.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary-color)', fontSize: '0.9rem', marginBottom: '15px', fontWeight: '500' }}>
                  <MapPin size={16} /> {spot.location}
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {spot.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
