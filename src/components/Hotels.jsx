import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Hotel, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const batanesCenter = [20.449, 121.970]; // Coordinates for Basco, Batanes

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('hotels')
        .select('*');
        
      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#dbeafe', padding: '16px', borderRadius: '50%', marginBottom: '15px' }}>
          <Hotel size={32} color="#3b82f6" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Where to Stay</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Find the perfect accommodations across Batanes.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading hotels map...</div>
      ) : hotels.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No hotels added yet. Admins can add them in the dashboard!</div>
      ) : (
        <div className="hotels-grid">
        
        {/* Map Side */}
        <div className="glass-panel" style={{ overflow: 'hidden', height: '500px', padding: 0 }}>
          <MapContainer center={batanesCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hotels.map(hotel => (
              <Marker key={hotel.id} position={[hotel.latitude, hotel.longitude]}>
                <Popup>
                  <div style={{ padding: '5px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: 'var(--primary-color)' }}>{hotel.name}</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}><MapPin size={12} style={{ display: 'inline' }}/> {hotel.location}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* List Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '500px', overflowY: 'auto', paddingRight: '10px' }}>
          {hotels.map(hotel => (
            <div key={hotel.id} className="glass-panel" style={{ padding: '15px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ height: '120px', width: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                {hotel.image_url ? (
                  <img src={hotel.image_url} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No Image</div>
                )}
              </div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>{hotel.name}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.85rem' }}>
                <MapPin size={14} /> {hotel.location}
              </div>
              {hotel.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                  {hotel.description}
                </p>
              )}
              {hotel.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary-color)', fontSize: '0.85rem', marginTop: '5px', fontWeight: '500' }}>
                  <Phone size={14} /> {hotel.phone}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
      )}
    </div>
  );
}
