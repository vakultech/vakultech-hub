import { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Database, AlertCircle, CheckCircle2, CalendarDays, ShieldCheck, QrCode, Map, Hotel } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dictionary');
  
  // Dictionary State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  const [newWord, setNewWord] = useState({
    ivatan: '',
    tagalog: '',
    english: '',
    category: ''
  });

  // Event State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    image: null
  });

  // Spots State
  const [newSpot, setNewSpot] = useState({
    name: '',
    location: '',
    description: '',
    image: null
  });

  // Hotels State
  const [newHotel, setNewHotel] = useState({
    name: '',
    location: '',
    description: '',
    phone: '',
    latitude: '',
    longitude: '',
    image: null
  });

  // Security State
  const [mfaStatus, setMfaStatus] = useState('loading'); // loading, unenrolled, enrolling, enrolled
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Dictionary Management State
  const [dictionaryWords, setDictionaryWords] = useState([]);
  const [editingWordId, setEditingWordId] = useState(null);
  const [editFormData, setEditFormData] = useState({ ivatan: '', tagalog: '', english: '', category: '' });

  const fetchDictionaryWords = async () => {
    try {
      const { data, error } = await supabase.from('dictionary').select('*').order('ivatan');
      if (error) throw error;
      setDictionaryWords(data || []);
    } catch (err) {
      console.error(err);
      showMessage('Error loading dictionary words.', 'error');
    }
  };

  // Events Management State
  const [eventsList, setEventsList] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editEventData, setEditEventData] = useState({ title: '', date: '', description: '' });

  const fetchEventsList = async () => {
    try {
      const { data, error } = await supabase.from('events').select('*').order('date');
      if (error) throw error;
      setEventsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Spots Management State
  const [spotsList, setSpotsList] = useState([]);
  const [editingSpotId, setEditingSpotId] = useState(null);
  const [editSpotData, setEditSpotData] = useState({ name: '', location: '', description: '' });

  const fetchSpotsList = async () => {
    try {
      const { data, error } = await supabase.from('spots').select('*').order('name');
      if (error) throw error;
      setSpotsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Hotels Management State
  const [hotelsList, setHotelsList] = useState([]);
  const [editingHotelId, setEditingHotelId] = useState(null);
  const [editHotelData, setEditHotelData] = useState({ name: '', location: '', description: '', phone: '', latitude: '', longitude: '' });

  const fetchHotelsList = async () => {
    try {
      const { data, error } = await supabase.from('hotels').select('*').order('name');
      if (error) throw error;
      setHotelsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') checkMfaStatus();
    if (activeTab === 'dictionary') fetchDictionaryWords();
    if (activeTab === 'events') fetchEventsList();
    if (activeTab === 'spots') fetchSpotsList();
    if (activeTab === 'hotels') fetchHotelsList();
  }, [activeTab]);

  const checkMfaStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.factors && user.factors.length > 0) {
        setMfaStatus('enrolled');
      } else {
        setMfaStatus('unenrolled');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startMfaEnrollment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      
      setFactorId(data.id);
      setQrCode(data.totp.uri); // Use URI for reliable QRCode component rendering
      setMfaStatus('enrolling');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyMfaEnrollment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode
      });

      if (error) throw error;

      showMessage('2FA Successfully Enabled!', 'success');
      setMfaStatus('enrolled');
      setTotpCode('');
    } catch (err) {
      showMessage('Invalid code. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!newWord.ivatan || !newWord.tagalog || !newWord.english) {
      showMessage('Please fill in at least Ivatan, Tagalog, and English translations.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('dictionary')
        .insert([newWord]);

      if (error) throw error;
      
      showMessage('Word added successfully!', 'success');
      setNewWord({ ivatan: '', tagalog: '', english: '', category: '' });
      fetchDictionaryWords();
    } catch (err) {
      console.error(err);
      showMessage('Error adding word. Check your database connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (word) => {
    setEditingWordId(word.id);
    setEditFormData({
      ivatan: word.ivatan,
      tagalog: word.tagalog,
      english: word.english,
      category: word.category || ''
    });
  };

  const handleEditSave = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('dictionary').update(editFormData).eq('id', id);
      if (error) throw error;
      showMessage('Word updated successfully!', 'success');
      setEditingWordId(null);
      fetchDictionaryWords();
    } catch (err) {
      showMessage('Failed to update word.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this translation?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('dictionary').delete().eq('id', id);
      if (error) throw error;
      showMessage('Word deleted successfully!', 'success');
      fetchDictionaryWords();
    } catch (err) {
      showMessage('Failed to delete word.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON. Expecting columns like: ivatan, tagalog, english, category
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('File appears to be empty or missing data rows.');
        }

        // Assuming row 0 is headers: [Ivatan, Tagalog, English, Category]
        const headers = jsonData[0].map(h => h.toString().toLowerCase().trim());
        
        const requiredHeaders = ['ivatan', 'tagalog', 'english'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        const rowsToInsert = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const entry = {};
          headers.forEach((header, index) => {
            if (row[index]) {
              entry[header] = row[index].toString().trim();
            }
          });

          if (entry.ivatan && entry.tagalog && entry.english) {
            rowsToInsert.push(entry);
          }
        }

        if (rowsToInsert.length === 0) {
          throw new Error('No valid rows found to import.');
        }

        const { error } = await supabase
          .from('dictionary')
          .insert(rowsToInsert);

        if (error) throw error;

        showMessage(`Successfully imported ${rowsToInsert.length} words!`, 'success');
        fetchDictionaryWords();
      } catch (err) {
        console.error(err);
        showMessage(err.message || 'Error processing Excel file.', 'error');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setLoading(false);
      showMessage('Error reading file.', 'error');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.description || !newEvent.date) {
      showMessage('Please fill in all required event fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      if (newEvent.image) {
        const fileExt = newEvent.image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `event-images/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('events').upload(filePath, newEvent.image);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('events').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('events').insert([{
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        image_url: imageUrl
      }]);

      if (error) throw error;

      showMessage('Event added successfully!', 'success');
      setNewEvent({ title: '', description: '', date: '', image: null });
      fetchEventsList();
    } catch (err) {
      console.error(err);
      showMessage('Error adding event.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotSubmit = async (e) => {
    e.preventDefault();
    if (!newSpot.name || !newSpot.location || !newSpot.description) {
      showMessage('Please fill in all required spot fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (newSpot.image) {
        const fileExt = newSpot.image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `spot-images/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('events').upload(filePath, newSpot.image);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('events').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('spots').insert([{
        name: newSpot.name,
        location: newSpot.location,
        description: newSpot.description,
        image_url: imageUrl
      }]);

      if (error) throw error;

      showMessage('Tourist Spot added successfully!', 'success');
      setNewSpot({ name: '', location: '', description: '', image: null });
      fetchSpotsList();
    } catch (err) {
      console.error(err);
      showMessage('Error adding spot.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.location || !newHotel.latitude || !newHotel.longitude) {
      showMessage('Please fill in all required hotel fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (newHotel.image) {
        const fileExt = newHotel.image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `hotel-images/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('events').upload(filePath, newHotel.image);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('events').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('hotels').insert([{
        name: newHotel.name,
        location: newHotel.location,
        description: newHotel.description,
        phone: newHotel.phone,
        latitude: parseFloat(newHotel.latitude),
        longitude: parseFloat(newHotel.longitude),
        image_url: imageUrl
      }]);

      if (error) throw error;

      showMessage('Hotel added successfully!', 'success');
      setNewHotel({ name: '', location: '', description: '', phone: '', latitude: '', longitude: '', image: null });
      fetchHotelsList();
    } catch (err) {
      console.error(err);
      showMessage('Error adding hotel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Events Edit/Delete ---
  const handleEventEditClick = (event) => {
    setEditingEventId(event.id);
    setEditEventData({ title: event.title, date: event.date, description: event.description });
  };
  const handleEventEditSave = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('events').update(editEventData).eq('id', id);
      if (error) throw error;
      showMessage('Event updated successfully!', 'success');
      setEditingEventId(null);
      fetchEventsList();
    } catch (err) {
      showMessage('Failed to update event.', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleEventDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      showMessage('Event deleted successfully!', 'success');
      fetchEventsList();
    } catch (err) {
      showMessage('Failed to delete event.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Spots Edit/Delete ---
  const handleSpotEditClick = (spot) => {
    setEditingSpotId(spot.id);
    setEditSpotData({ name: spot.name, location: spot.location, description: spot.description });
  };
  const handleSpotEditSave = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('spots').update(editSpotData).eq('id', id);
      if (error) throw error;
      showMessage('Spot updated successfully!', 'success');
      setEditingSpotId(null);
      fetchSpotsList();
    } catch (err) {
      showMessage('Failed to update spot.', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleSpotDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spot?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('spots').delete().eq('id', id);
      if (error) throw error;
      showMessage('Spot deleted successfully!', 'success');
      fetchSpotsList();
    } catch (err) {
      showMessage('Failed to delete spot.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Hotels Edit/Delete ---
  const handleHotelEditClick = (hotel) => {
    setEditingHotelId(hotel.id);
    setEditHotelData({ name: hotel.name, location: hotel.location, description: hotel.description, phone: hotel.phone, latitude: hotel.latitude, longitude: hotel.longitude });
  };
  const handleHotelEditSave = async (id) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('hotels').update({ ...editHotelData, latitude: parseFloat(editHotelData.latitude), longitude: parseFloat(editHotelData.longitude) }).eq('id', id);
      if (error) throw error;
      showMessage('Hotel updated successfully!', 'success');
      setEditingHotelId(null);
      fetchHotelsList();
    } catch (err) {
      showMessage('Failed to update hotel.', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleHotelDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('hotels').delete().eq('id', id);
      if (error) throw error;
      showMessage('Hotel deleted successfully!', 'success');
      fetchHotelsList();
    } catch (err) {
      showMessage('Failed to delete hotel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '30px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Database size={24} /> Dictionary Admin
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Manage translations and bulk upload via Excel</p>
      </div>

      {message.text && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
          border: `1px solid ${message.type === 'error' ? 'var(--error-color)' : 'var(--success-color)'}`,
          color: message.type === 'error' ? 'var(--error-color)' : 'var(--success-color)'
        }}>
          {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px', justifyContent: 'center' }}>
        <button 
          className={`btn ${activeTab === 'dictionary' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('dictionary')}
        >
          Dictionary
        </button>
        <button 
          className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button 
          className={`btn ${activeTab === 'spots' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('spots')}
        >
          Tourist Spots
        </button>
        <button 
          className={`btn ${activeTab === 'hotels' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('hotels')}
        >
          Hotels
        </button>
        <button 
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {activeTab === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="responsive-grid">
            {/* Manual Entry Form */}
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--primary-color)"/> Add Single Word
          </h3>
          <form onSubmit={handleManualSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ivatan</label>
              <input 
                type="text" 
                className="input-field" 
                value={newWord.ivatan}
                onChange={(e) => setNewWord({...newWord, ivatan: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tagalog</label>
              <input 
                type="text" 
                className="input-field" 
                value={newWord.tagalog}
                onChange={(e) => setNewWord({...newWord, tagalog: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>English</label>
              <input 
                type="text" 
                className="input-field" 
                value={newWord.english}
                onChange={(e) => setNewWord({...newWord, english: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category (Optional)</label>
              <input 
                type="text" 
                className="input-field" 
                value={newWord.category}
                onChange={(e) => setNewWord({...newWord, category: e.target.value})}
                placeholder="e.g., Greetings, Food"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Translation'}
            </button>
          </form>
        </div>

        {/* Excel Upload Form */}
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="var(--primary-color)"/> Bulk Upload (Excel)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
            Upload an Excel (.xlsx) or CSV file. The first row MUST contain headers: <strong style={{color: 'var(--text-primary)'}}>Ivatan, Tagalog, English</strong>. Optional column: <strong style={{color: 'var(--text-primary)'}}>Category</strong>.
          </p>

          <div style={{ 
            border: '2px dashed var(--panel-border)', 
            padding: '40px 20px', 
            textAlign: 'center', 
            borderRadius: '8px',
            background: '#f8fafc',
            transition: 'all 0.3s ease'
          }}>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Upload size={48} color="var(--text-secondary)" style={{ marginBottom: '15px' }} />
            <div style={{ marginBottom: '15px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Click to select a file</span>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => fileInputRef.current.click()}
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Browse Files'}
            </button>
          </div>
          </div>
          </div>

          {/* Dictionary Management List */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--primary-color)"/> Dictionary Entries ({dictionaryWords.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Ivatan</th>
                  <th style={{ padding: '12px 8px' }}>Tagalog</th>
                  <th style={{ padding: '12px 8px' }}>English</th>
                  <th style={{ padding: '12px 8px' }}>Category</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dictionaryWords.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No entries found</td>
                  </tr>
                ) : (
                  dictionaryWords.map(word => (
                    <tr key={word.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {editingWordId === word.id ? (
                        <>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editFormData.ivatan} onChange={e => setEditFormData({...editFormData, ivatan: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editFormData.tagalog} onChange={e => setEditFormData({...editFormData, tagalog: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editFormData.english} onChange={e => setEditFormData({...editFormData, english: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} /></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEditSave(word.id)}>Save</button>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditingWordId(null)}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 8px' }}>{word.ivatan}</td>
                          <td style={{ padding: '12px 8px' }}>{word.tagalog}</td>
                          <td style={{ padding: '12px 8px' }}>{word.english}</td>
                          <td style={{ padding: '12px 8px' }}>{word.category || '-'}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEditClick(word)}>Edit</button>
                              <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fee2e2', color: 'var(--error-color)' }} onClick={() => handleDeleteClick(word.id)}>Delete</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} color="var(--primary-color)"/> Add Local Event
          </h3>
          <form onSubmit={handleEventSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Event Title</label>
              <input 
                type="text" 
                className="input-field" 
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={newEvent.date}
                onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description</label>
              <textarea 
                className="input-field" 
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Featured Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                className="input-field" 
                style={{ padding: '10px' }}
                onChange={(e) => setNewEvent({...newEvent, image: e.target.files[0]})}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Note: Requires a Supabase Storage bucket named 'events' configured for public access.</p>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving Event...' : 'Publish Event'}
            </button>
          </form>

          {/* Events Management List */}
          <div style={{ marginTop: '40px', overflowX: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>Manage Events ({eventsList.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Title</th>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Description</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {eventsList.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No events found</td></tr>
                ) : (
                  eventsList.map(event => (
                    <tr key={event.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {editingEventId === event.id ? (
                        <>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editEventData.title} onChange={e => setEditEventData({...editEventData, title: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="date" className="input-field" style={{ padding: '8px' }} value={editEventData.date} onChange={e => setEditEventData({...editEventData, date: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})} /></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEventEditSave(event.id)}>Save</button>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditingEventId(null)}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 8px' }}>{event.title}</td>
                          <td style={{ padding: '12px 8px' }}>{event.date}</td>
                          <td style={{ padding: '12px 8px' }}>{event.description?.substring(0, 50)}...</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEventEditClick(event)}>Edit</button>
                              <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fee2e2', color: 'var(--error-color)' }} onClick={() => handleEventDeleteClick(event.id)}>Delete</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'spots' && (
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Map size={18} color="var(--primary-color)"/> Add Tourist Spot
          </h3>
          <form onSubmit={handleSpotSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Spot Name</label>
              <input type="text" className="input-field" value={newSpot.name} onChange={(e) => setNewSpot({...newSpot, name: e.target.value})} required />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Location Area (e.g. Basco, Mahatao)</label>
              <input type="text" className="input-field" value={newSpot.location} onChange={(e) => setNewSpot({...newSpot, location: e.target.value})} required />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Description</label>
              <textarea className="input-field" style={{ minHeight: '100px' }} value={newSpot.description} onChange={(e) => setNewSpot({...newSpot, description: e.target.value})} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Featured Image</label>
              <input type="file" accept="image/*" className="input-field" style={{ padding: '10px' }} onChange={(e) => setNewSpot({...newSpot, image: e.target.files[0]})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Add Spot'}
            </button>
          </form>

          {/* Spots Management List */}
          <div style={{ marginTop: '40px', overflowX: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>Manage Tourist Spots ({spotsList.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>Description</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spotsList.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No tourist spots found</td></tr>
                ) : (
                  spotsList.map(spot => (
                    <tr key={spot.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {editingSpotId === spot.id ? (
                        <>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editSpotData.name} onChange={e => setEditSpotData({...editSpotData, name: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editSpotData.location} onChange={e => setEditSpotData({...editSpotData, location: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editSpotData.description} onChange={e => setEditSpotData({...editSpotData, description: e.target.value})} /></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleSpotEditSave(spot.id)}>Save</button>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditingSpotId(null)}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 8px' }}>{spot.name}</td>
                          <td style={{ padding: '12px 8px' }}>{spot.location}</td>
                          <td style={{ padding: '12px 8px' }}>{spot.description?.substring(0, 50)}...</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleSpotEditClick(spot)}>Edit</button>
                              <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fee2e2', color: 'var(--error-color)' }} onClick={() => handleSpotDeleteClick(spot.id)}>Delete</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'hotels' && (
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hotel size={18} color="var(--primary-color)"/> Add Hotel
          </h3>
          <form onSubmit={handleHotelSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Hotel Name</label>
              <input type="text" className="input-field" value={newHotel.name} onChange={(e) => setNewHotel({...newHotel, name: e.target.value})} required />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Location Address</label>
              <input type="text" className="input-field" value={newHotel.location} onChange={(e) => setNewHotel({...newHotel, location: e.target.value})} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Latitude (e.g. 20.449)</label>
                <input type="number" step="any" className="input-field" value={newHotel.latitude} onChange={(e) => setNewHotel({...newHotel, latitude: e.target.value})} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Longitude (e.g. 121.970)</label>
                <input type="number" step="any" className="input-field" value={newHotel.longitude} onChange={(e) => setNewHotel({...newHotel, longitude: e.target.value})} required />
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Phone Number</label>
              <input type="text" className="input-field" value={newHotel.phone} onChange={(e) => setNewHotel({...newHotel, phone: e.target.value})} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Description</label>
              <textarea className="input-field" style={{ minHeight: '80px' }} value={newHotel.description} onChange={(e) => setNewHotel({...newHotel, description: e.target.value})} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Featured Image</label>
              <input type="file" accept="image/*" className="input-field" style={{ padding: '10px' }} onChange={(e) => setNewHotel({...newHotel, image: e.target.files[0]})} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Saving...' : 'Add Hotel'}
            </button>
          </form>

          {/* Hotels Management List */}
          <div style={{ marginTop: '40px', overflowX: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
            <h4 style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>Manage Hotels ({hotelsList.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>Phone</th>
                  <th style={{ padding: '12px 8px' }}>Lat/Long</th>
                  <th style={{ padding: '12px 8px' }}>Description</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotelsList.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hotels found</td></tr>
                ) : (
                  hotelsList.map(hotel => (
                    <tr key={hotel.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {editingHotelId === hotel.id ? (
                        <>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editHotelData.name} onChange={e => setEditHotelData({...editHotelData, name: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editHotelData.location} onChange={e => setEditHotelData({...editHotelData, location: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editHotelData.phone} onChange={e => setEditHotelData({...editHotelData, phone: e.target.value})} /></td>
                          <td style={{ padding: '8px' }}>
                            <input type="number" step="any" className="input-field" style={{ padding: '8px', marginBottom: '4px' }} placeholder="Lat" value={editHotelData.latitude} onChange={e => setEditHotelData({...editHotelData, latitude: e.target.value})} />
                            <input type="number" step="any" className="input-field" style={{ padding: '8px' }} placeholder="Long" value={editHotelData.longitude} onChange={e => setEditHotelData({...editHotelData, longitude: e.target.value})} />
                          </td>
                          <td style={{ padding: '8px' }}><input type="text" className="input-field" style={{ padding: '8px' }} value={editHotelData.description} onChange={e => setEditHotelData({...editHotelData, description: e.target.value})} /></td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleHotelEditSave(hotel.id)}>Save</button>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setEditingHotelId(null)}>Cancel</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px 8px' }}>{hotel.name}</td>
                          <td style={{ padding: '12px 8px' }}>{hotel.location}</td>
                          <td style={{ padding: '12px 8px' }}>{hotel.phone || '-'}</td>
                          <td style={{ padding: '12px 8px' }}>{hotel.latitude}, {hotel.longitude}</td>
                          <td style={{ padding: '12px 8px' }}>{hotel.description?.substring(0, 30)}...</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleHotelEditClick(hotel)}>Edit</button>
                              <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#fee2e2', color: 'var(--error-color)' }} onClick={() => handleHotelDeleteClick(hotel.id)}>Delete</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass-panel" style={{ padding: '30px', background: '#ffffff', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ShieldCheck size={24} color="var(--primary-color)"/> Security Settings
          </h3>
          
          {mfaStatus === 'loading' && <p>Loading status...</p>}
          
          {mfaStatus === 'enrolled' && (
            <div style={{ background: '#dcfce7', color: 'var(--success-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--success-color)' }}>
              <ShieldCheck size={48} style={{ margin: '0 auto 15px auto' }} />
              <h4 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Two-Factor Authentication is Enabled</h4>
              <p style={{ color: 'var(--text-secondary)' }}>Your account is highly secure. You will be prompted for a code on future logins.</p>
            </div>
          )}

          {mfaStatus === 'unenrolled' && (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
                Protect your admin account by enabling Two-Factor Authentication (2FA) using Google Authenticator.
              </p>
              <button className="btn btn-primary" onClick={startMfaEnrollment} disabled={loading}>
                <QrCode size={18} /> Setup Google Authenticator
              </button>
            </div>
          )}

          {mfaStatus === 'enrolling' && (
             <div>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                 1. Open the <strong>Google Authenticator</strong> app on your phone.<br/>
                 2. Scan the QR Code below.<br/>
                 3. Enter the 6-digit code generated by the app.
               </p>
               
               <div style={{ background: 'white', padding: '15px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                 {qrCode && <QRCodeSVG value={qrCode} size={200} />}
               </div>

               <form onSubmit={verifyMfaEnrollment} style={{ maxWidth: '300px', margin: '0 auto' }}>
                 <input 
                   type="text" 
                   className="input-field" 
                   placeholder="Enter 6-digit code"
                   value={totpCode}
                   onChange={(e) => setTotpCode(e.target.value)}
                   required
                   maxLength={6}
                   style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem', marginBottom: '15px' }}
                 />
                 <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                   {loading ? 'Verifying...' : 'Verify & Enable 2FA'}
                 </button>
               </form>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
