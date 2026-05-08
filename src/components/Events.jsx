import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { CalendarDays, MapPin, X } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import 'react-calendar/dist/Calendar.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if a date has an event to highlight it on the calendar
  const getTileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = events.some(e => isSameDay(parseISO(e.date), date));
      return hasEvent ? <div style={{ height: '6px', width: '6px', backgroundColor: 'var(--primary-color)', borderRadius: '50%', margin: '2px auto 0' }} /> : null;
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Find events for this date
    const dayEvents = events.filter(e => isSameDay(parseISO(e.date), date));
    if (dayEvents.length > 0) {
      // Just show the first event for simplicity in this demo, or a list if multiple
      setSelectedEvent(dayEvents[0]);
    } else {
      setSelectedEvent(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', padding: '16px', borderRadius: '50%', marginBottom: '15px' }}>
          <CalendarDays size={32} color="#f59e0b" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Batanes Local Events</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Discover upcoming festivals, gatherings, and celebrations.</p>
      </div>

      <div className="responsive-grid">
        {/* Calendar Side */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', justifyContent: 'center', background: '#ffffff' }}>
          <style>{`
            .react-calendar {
              border: none;
              font-family: 'Inter', sans-serif;
              width: 100%;
              max-width: 400px;
            }
            .react-calendar__tile--active {
              background: var(--primary-color) !important;
              border-radius: 8px;
            }
            .react-calendar__tile:hover {
              background: #f1f5f9;
              border-radius: 8px;
            }
            .react-calendar__navigation button:enabled:hover {
              background-color: #f1f5f9;
              border-radius: 8px;
            }
          `}</style>
          
          {loading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading calendar...</p>
          ) : (
            <Calendar 
              onChange={handleDateChange} 
              value={selectedDate} 
              tileContent={getTileContent}
              className="custom-calendar"
            />
          )}
        </div>

        {/* Event Details Side */}
        <div className="glass-panel" style={{ padding: '30px', background: '#ffffff', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          {selectedEvent ? (
            <div className="animate-fade-in" style={{ flex: 1 }}>
              {selectedEvent.image_url ? (
                <div style={{ width: '100%', height: '250px', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', background: '#f1f5f9' }}>
                  <img src={selectedEvent.image_url} alt={selectedEvent.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '150px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>No Image Available</span>
                </div>
              )}
              
              <h3 style={{ fontSize: '1.6rem', marginBottom: '10px', color: 'var(--text-primary)' }}>{selectedEvent.title}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary-color)', marginBottom: '15px', fontWeight: '500' }}>
                <CalendarDays size={16} /> {format(parseISO(selectedEvent.date), 'MMMM d, yyyy')}
              </div>
              
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.05rem' }}>
                {selectedEvent.description}
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CalendarDays size={48} color="#cbd5e1" style={{ marginBottom: '15px' }} />
              <p style={{ fontSize: '1.1rem' }}>No events scheduled for {format(selectedDate, 'MMMM d, yyyy')}.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>Select a highlighted date on the calendar to view details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
