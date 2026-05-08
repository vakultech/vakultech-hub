import { Contact, MapPin, Phone, Mail } from 'lucide-react';

export default function TourGuides() {
  const municipalities = [
    {
      name: "Basco",
      guides: [
        { name: "Juan Dela Cruz", phone: "+63 917 123 4567", email: "juan.basco@example.com", specialties: "History, Photography" },
        { name: "Maria Clara", phone: "+63 919 987 6543", email: "maria.tours@example.com", specialties: "Hiking, Local Cuisine" }
      ]
    },
    {
      name: "Mahatao",
      guides: [
        { name: "Pedro Penduko", phone: "+63 920 111 2222", email: "pedro.mahatao@example.com", specialties: "Lighthouse Tours, Coastal Walks" }
      ]
    },
    {
      name: "Ivana",
      guides: [
        { name: "Andres Bonifacio", phone: "+63 999 888 7777", email: "andres.ivana@example.com", specialties: "Honesty Coffee Shop, Architecture" }
      ]
    },
    {
      name: "Uyugan",
      guides: [
        { name: "Gabriela Silang", phone: "+63 915 555 4444", email: "gabriela.uyugan@example.com", specialties: "Ruins, Indigenous Culture" }
      ]
    },
    {
      name: "Sabtang",
      guides: [
        { name: "Lapu-Lapu", phone: "+63 939 333 2222", email: "lapu.sabtang@example.com", specialties: "Boat Tours, Stone Houses" }
      ]
    },
    {
      name: "Itbayat",
      guides: [
        { name: "Jose Rizal", phone: "+63 917 000 1111", email: "jose.itbayat@example.com", specialties: "Extreme Adventure, Caves" }
      ]
    }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fef08a', padding: '16px', borderRadius: '50%', marginBottom: '15px' }}>
          <Contact size={32} color="#ca8a04" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Local Tour Guides</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Find certified local tour guides across the municipalities of Batanes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
        {municipalities.map(municipality => (
          <div key={municipality.name} className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} /> {municipality.name}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {municipality.guides.map((guide, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '5px', color: 'var(--text-primary)' }}>{guide.name}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.9rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="var(--primary-color)" /> {guide.phone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="var(--primary-color)" /> {guide.email}
                    </div>
                    <div style={{ marginTop: '5px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>Specialties:</strong> {guide.specialties}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
