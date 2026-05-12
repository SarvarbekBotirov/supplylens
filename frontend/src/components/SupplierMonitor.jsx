import { useState, useEffect } from 'react';

const EMPTY_SUPPLIER = {
  name: '',
  countries: '',
  materials: '',
  transport: 'ocean freight',
};

function SupplierMonitor({ isOpen, onClose, onProfileChange }) {
  const [suppliers, setSuppliers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form, setForm] = useState(EMPTY_SUPPLIER);

  useEffect(() => {
    const saved = localStorage.getItem('supplylens_suppliers');
    if (saved) {
      try {
        setSuppliers(JSON.parse(saved));
      } catch {
        setSuppliers([]);
      }
    }
  }, []);

  const save = (updated) => {
    setSuppliers(updated);
    localStorage.setItem('supplylens_suppliers',
      JSON.stringify(updated));
    onProfileChange(updated);
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const updated = editingIndex !== null
      ? suppliers.map((s, i) => i === editingIndex ? form : s)
      : [...suppliers, form];
    save(updated);
    setForm(EMPTY_SUPPLIER);
    setEditingIndex(null);
  };

  const handleEdit = (i) => {
    setForm(suppliers[i]);
    setEditingIndex(i);
  };

  const handleDelete = (i) => {
    save(suppliers.filter((_, idx) => idx !== i));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0,
      width: '380px', height: '100vh',
      background: '#13131f',
      borderLeft: '1px solid #1e1e2e',
      zIndex: 500,
      display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: '14px', fontWeight: '700',
            color: '#e8e8f0',
          }}>
            🏭 Supplier Monitor
          </div>
          <div style={{
            fontSize: '11px', color: '#6b6b8a',
            marginTop: '2px',
          }}>
            Track up to 5 key suppliers
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent',
          border: '1px solid #1e1e2e',
          color: '#6b6b8a', cursor: 'pointer',
          borderRadius: '6px', padding: '4px 10px',
          fontSize: '12px',
        }}>✕</button>
      </div>

      {/* Supplier list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {suppliers.length === 0 && editingIndex === null && (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            color: '#6b6b8a', fontSize: '13px',
            lineHeight: '1.6',
          }}>
            No suppliers added yet.<br/>
            Add your key suppliers below to get<br/>
            personalized risk alerts.
          </div>
        )}

        {suppliers.map((s, i) => (
          <div key={i} style={{
            background: '#0d0d14',
            border: '1px solid #1e1e2e',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '10px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{
                  fontSize: '13px', fontWeight: '700',
                  color: '#e8e8f0', marginBottom: '6px',
                }}>
                  {s.name}
                </div>
                <div style={{
                  fontSize: '11px', color: '#6b6b8a',
                  lineHeight: '1.6',
                }}>
                  🌍 {s.countries}<br/>
                  📦 {s.materials}<br/>
                  🚢 {s.transport}
                </div>
              </div>
              <div style={{
                display: 'flex', gap: '6px',
              }}>
                <button onClick={() => handleEdit(i)} style={{
                  background: 'transparent',
                  border: '1px solid #1e1e2e',
                  color: '#06b6d4', cursor: 'pointer',
                  borderRadius: '4px',
                  padding: '3px 8px', fontSize: '11px',
                }}>Edit</button>
                <button onClick={() => handleDelete(i)} style={{
                  background: 'transparent',
                  border: '1px solid #1e1e2e',
                  color: '#ef4444', cursor: 'pointer',
                  borderRadius: '4px',
                  padding: '3px 8px', fontSize: '11px',
                }}>✕</button>
              </div>
            </div>
          </div>
        ))}

        {/* Add/Edit form */}
        {(suppliers.length < 5 || editingIndex !== null) && (
          <div style={{
            background: '#0d0d14',
            border: '1px solid rgba(6,182,212,0.3)',
            borderRadius: '8px',
            padding: '14px',
            marginTop: '8px',
          }}>
            <div style={{
              fontSize: '11px', fontWeight: '700',
              color: '#06b6d4', letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}>
              {editingIndex !== null ? 'Edit Supplier' : 'Add Supplier'}
            </div>

            {[
              { key: 'name', label: 'Supplier Name',
                placeholder: 'e.g. SK Hynix' },
              { key: 'countries', label: 'Country Exposure',
                placeholder: 'e.g. South Korea, China, Taiwan' },
              { key: 'materials', label: 'Materials / Components',
                placeholder: 'e.g. DRAM, wafers, chemicals' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '10px' }}>
                <div style={{
                  fontSize: '10px', fontWeight: '600',
                  color: '#6b6b8a', marginBottom: '4px',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {field.label}
                </div>
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={e => setForm({
                    ...form, [field.key]: e.target.value
                  })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '7px 10px',
                    background: '#13131f',
                    border: '1px solid #1e1e2e',
                    borderRadius: '6px', fontSize: '12px',
                    color: '#e8e8f0', outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
            ))}

            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '10px', fontWeight: '600',
                color: '#6b6b8a', marginBottom: '4px',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Transport Mode
              </div>
              <select
                value={form.transport}
                onChange={e => setForm({
                  ...form, transport: e.target.value
                })}
                style={{
                  width: '100%', padding: '7px 10px',
                  background: '#13131f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '6px', fontSize: '12px',
                  color: '#e8e8f0', outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <option>ocean freight</option>
                <option>air freight</option>
                <option>road freight</option>
                <option>rail freight</option>
                <option>ocean + air freight</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd} style={{
                flex: 1, padding: '8px',
                background: '#06b6d4', color: '#0d0d14',
                border: 'none', borderRadius: '6px',
                fontSize: '12px', fontWeight: '700',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}>
                {editingIndex !== null ? 'Save Changes' : 'Add Supplier'}
              </button>
              {editingIndex !== null && (
                <button onClick={() => {
                  setEditingIndex(null);
                  setForm(EMPTY_SUPPLIER);
                }} style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid #1e1e2e',
                  color: '#6b6b8a', borderRadius: '6px',
                  fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '14px 24px',
        borderTop: '1px solid #1e1e2e',
        fontSize: '10px', color: '#6b6b8a',
        lineHeight: '1.5',
      }}>
        Profiles saved locally in your browser.<br/>
        Articles are automatically checked against your suppliers.
      </div>
    </div>
  );
}

export default SupplierMonitor;
