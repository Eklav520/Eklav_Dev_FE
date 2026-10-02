import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { FaPlus, FaTrash, FaEdit, FaTimes, FaUsers, FaDownload } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

const CATEGORY_COLORS = ['#ff7a00', '#a855f7', '#14b8a6', '#3b82f6', '#ec4899', '#22c55e']
const emptyForm = { category: '', title: '', subtitle: '', date: '', time: '', location: 'Online', registerLink: '', order: 0 }

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 5 }
const inputStyle: React.CSSProperties = { width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }
const iconBtn = (color: string): React.CSSProperties => ({
  background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 6,
  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color, fontSize: 12,
})

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
    </div>
  )
}

// Display-only formatting — the form/model store a real Date + 24h "HH:MM"
// time (picked via native calendar/time inputs), formatted here into the
// friendlier strings shown in the admin list and on the public landing page.
function formatEventDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatEventTime(hhmm: string): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

// Add/edit/delete the "Upcoming Events" cards — opened from the dashboard's
// Banner/Events widget (SiteBannerUpload.tsx) instead of living on its own
// admin page, so event management sits right next to the banner it's an
// alternative to in that one shared landing-page slot.
interface SiteEventsModalProps {
  show: boolean
  onClose: () => void
  onCountChange?: (count: number) => void
}

const SiteEventsModal: React.FC<SiteEventsModalProps> = ({ show, onClose, onCountChange }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  const { user } = useAuthContext()
  const h = { Authorization: `Bearer ${user?.token}` }

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [viewRegistrationsFor, setViewRegistrationsFor] = useState<any>(null)

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/site-events/admin`, { headers: h })
      const data = await res.json()
      const list = data.events || []
      setEvents(list)
      onCountChange?.(list.filter((e: any) => e.isActive).length)
    } catch { setError('Failed to load events') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (show && user?.token) fetchEvents() }, [show, user?.token])

  const resetForm = () => { setForm({ ...emptyForm }); setEditId(null); setShowForm(false) }

  const handleEdit = (item: any) => {
    setEditId(item._id)
    setForm({
      category: item.category, title: item.title, subtitle: item.subtitle || '',
      date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
      time: item.time || '', location: item.location || 'Online',
      registerLink: item.registerLink || '', order: item.order || 0,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.category.trim() || !form.title.trim() || !form.date.trim()) {
      setError('Category, title and date are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editId) {
        await fetch(`${baseURL}/api/site-events/${editId}`, { method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      } else {
        await fetch(`${baseURL}/api/site-events`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      }
      await fetchEvents()
      resetForm()
    } catch { setError('Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await fetch(`${baseURL}/api/site-events/${id}`, { method: 'DELETE', headers: h })
    fetchEvents()
  }

  const toggleActive = async (item: any) => {
    await fetch(`${baseURL}/api/site-events/${item._id}`, { method: 'PUT', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !item.isActive }) })
    fetchEvents()
  }

  return (
    <>
    <Modal show={show} onHide={onClose} centered size="xl" contentClassName="site-events-modal-content" dialogClassName="site-events-modal-dialog">
      <style>{`
        .site-events-modal-content { background: #0a0a0a; border: 1px solid #2a2a2a; color: #e0e0e0; }
        .site-events-modal-dialog { max-width: 900px; }
        .site-events-backdrop-blur { backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); background-color: rgba(0,0,0,0.6) !important; }
      `}</style>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#ff7a00' }}>Manage Events</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Shown as "Upcoming Events" on the landing page</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => { resetForm(); setShowForm(true) }} style={{
            background: '#ff7a00', border: 'none', borderRadius: 8, padding: '8px 16px',
            color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <FaPlus size={11} /> Add Event
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, display: 'flex' }}>
            <FaTimes />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
        {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 14 }}>{error}</div>}

        {showForm && (
          <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: '#ff7a00', marginBottom: 12, fontSize: 14 }}>{editId ? 'Edit' : 'New'} Event</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Category (e.g. For Students)" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
              <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Subtitle (optional)" value={form.subtitle} onChange={v => setForm(f => ({ ...f, subtitle: v }))} />
              </div>
              <Field label="Date" type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} />
              <Field label="Time (optional)" type="time" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} />
              <Field label="Location (e.g. Online, Hyderabad)" value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
              <Field label="Register Link (URL, optional)" value={form.registerLink} onChange={v => setForm(f => ({ ...f, registerLink: v }))} placeholder="https://..." />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button onClick={handleSave} disabled={saving} style={{ background: '#ff7a00', border: 'none', borderRadius: 8, padding: '8px 20px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
              <button onClick={resetForm} style={{ background: '#2a2a2a', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#ccc', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>No events yet. Click "Add Event" to create one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((item, i) => {
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
              return (
                <div key={item._id} style={{
                  background: '#141414', border: `1.5px solid ${color}44`, borderRadius: 12,
                  padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: item.isActive ? 1 : 0.5,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <span style={{ background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                      {item.category}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>
                        {formatEventDate(item.date)}{item.time ? ` · ${formatEventTime(item.time)}` : ''}{item.location ? ` · ${item.location}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setViewRegistrationsFor(item)}
                      title="View registrations"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: '#ff7a0022', border: '1px solid #ff7a0044', borderRadius: 20,
                        padding: '4px 10px', cursor: 'pointer', color: '#ff7a00', fontSize: 11, fontWeight: 700,
                      }}
                    >
                      <FaUsers size={10} /> {item.registrationCount || 0}
                    </button>
                    <button onClick={() => toggleActive(item)} title={item.isActive ? 'Deactivate' : 'Activate'} style={iconBtn(item.isActive ? '#28a745' : '#666')}>
                      {item.isActive ? '✓' : '○'}
                    </button>
                    <button onClick={() => handleEdit(item)} style={iconBtn('#3b82f6')}><FaEdit /></button>
                    <button onClick={() => handleDelete(item._id)} style={iconBtn('#ef4444')}><FaTrash /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>

    {viewRegistrationsFor && (
      <EventRegistrationsModal
        event={viewRegistrationsFor}
        onClose={() => setViewRegistrationsFor(null)}
      />
    )}
    </>
  )
}

// Read-only list of everyone registered for one event — opened from the
// "N registered" pill on each event row above.
const EventRegistrationsModal: React.FC<{ event: any; onClose: () => void }> = ({ event, onClose }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || ''
  const { user } = useAuthContext()
  const h = { Authorization: `Bearer ${user?.token}` }

  const [registrations, setRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch(`${baseURL}/api/site-events/${event._id}/registrations`, { headers: h })
      .then(res => res.json())
      .then(data => { if (!cancelled) setRegistrations(data.registrations || []) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [event._id])

  // Built client-side from the already-fetched list — no extra backend call needed.
  const downloadCsv = () => {
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['Name', 'Email', 'Phone', 'College', 'Registered']
    const rows = registrations.map(r => [
      r.name, r.email, r.phone || '', r.college || '',
      new Date(r.createdAt).toLocaleString('en-GB'),
    ])
    const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/[^a-z0-9]+/gi, '-')}-registrations.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal show onHide={onClose} centered size="lg" contentClassName="site-events-modal-content" backdropClassName="site-events-backdrop-blur">
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#ff7a00' }}>Registrations</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{event.title}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {!loading && registrations.length > 0 && (
            <button
              onClick={downloadCsv}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, background: '#ff7a00', border: 'none',
                borderRadius: 8, padding: '7px 14px', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              <FaDownload size={11} /> Download CSV
            </button>
          )}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18, display: 'flex' }}>
            <FaTimes />
          </button>
        </div>
      </div>
      <div style={{ padding: '16px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#666' }}>Loading...</div>
        ) : registrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#555' }}>No registrations yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#888', textAlign: 'left', borderBottom: '1px solid #2a2a2a' }}>
                <th style={{ padding: '6px 10px 10px 0', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '6px 10px 10px 0', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '6px 10px 10px 0', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '6px 10px 10px 0', fontWeight: 600 }}>College</th>
                <th style={{ padding: '6px 0 10px 0', fontWeight: 600 }}>Registered</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid #1a1a1a', color: '#ddd' }}>
                  <td style={{ padding: '8px 10px 8px 0' }}>{r.name}</td>
                  <td style={{ padding: '8px 10px 8px 0' }}>{r.email}</td>
                  <td style={{ padding: '8px 10px 8px 0' }}>{r.phone || '—'}</td>
                  <td style={{ padding: '8px 10px 8px 0' }}>{r.college || '—'}</td>
                  <td style={{ padding: '8px 0' }}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  )
}

export default SiteEventsModal
