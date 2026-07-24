import { useState } from 'react'
import axios from 'axios'
import DashboardLayout from '../components/layout/DashboardLayout'

const API = '/api/maternal'

function getToken() {
  return localStorage.getItem('token')
}

function headers() {
  return { Authorization: `Bearer ${getToken()}` }
}

export default function MaternalRecordPage() {
  const [govtId, setGovtId] = useState('')
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const [antenatalForm, setAntenatalForm] = useState({ date: '', notes: '', hospitalId: '' })
  const [deliveryForm, setDeliveryForm] = useState({ date: '', notes: '', hospitalId: '' })
  const [activeTab, setActiveTab] = useState('antenatal')

  async function handleLookup(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setRecord(null)
    if (!govtId.trim()) return setError('Please enter a Maternal ID')
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/${govtId.trim()}`, { headers: headers() })
      setRecord(data)
    } catch (err) {
      if (err.response?.status === 404) setError('No record found. You can register this ID below.')
      else setError(err.response?.data?.message || 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { data } = await axios.post(API, { govtMaternalId: govtId.trim() }, { headers: headers() })
      setRecord(data)
      setSuccess('Maternal record registered successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAntenatal(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const { data } = await axios.post(`${API}/${record.govtMaternalId}/antenatal`, antenatalForm, { headers: headers() })
      setRecord(data)
      setSuccess('Antenatal visit added.')
      setAntenatalForm({ date: '', notes: '', hospitalId: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add visit')
    }
  }

  async function handleAddDelivery(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const { data } = await axios.post(`${API}/${record.govtMaternalId}/delivery`, deliveryForm, { headers: headers() })
      setRecord(data)
      setSuccess('Delivery details saved.')
      setDeliveryForm({ date: '', notes: '', hospitalId: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery details')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Maternal &amp; Child ID Tracking</h1>
        <p className="text-on-surface-variant mt-1">Look up or register a government-issued Maternal ID (RCH/MCTS)</p>
      </div>

      {/* Lookup */}
      <form onSubmit={handleLookup} className="flex gap-3 mb-6">
        <input
          value={govtId}
          onChange={(e) => setGovtId(e.target.value)}
          placeholder="Enter Govt Maternal ID (e.g. RCH-2024-001234)"
          className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {loading ? 'Searching...' : 'Look Up'}
        </button>
      </form>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
          {error.includes('register') && (
            <button onClick={handleRegister} className="ml-auto text-xs font-bold underline">Register Now</button>
          )}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {success}
        </div>
      )}

      {record && (
        <div className="space-y-6">
          {/* Record Header */}
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">pregnant_woman</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface-variant">Govt Maternal ID</p>
              <p className="text-lg font-bold text-primary">{record.govtMaternalId}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-on-surface-variant">Registered</p>
              <p className="text-sm font-semibold text-on-surface">{new Date(record.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-outline-variant">
            {['antenatal', 'delivery'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'antenatal' ? 'Antenatal Visits' : 'Delivery Details'}
              </button>
            ))}
          </div>

          {activeTab === 'antenatal' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Existing visits */}
              <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-on-surface mb-4">Visit History ({record.antenatalVisits.length})</h3>
                {record.antenatalVisits.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No antenatal visits recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {record.antenatalVisits.map((v, i) => (
                      <div key={i} className="p-3 bg-surface-container-low rounded-xl">
                        <p className="text-sm font-semibold text-on-surface">{new Date(v.date).toLocaleDateString()}</p>
                        {v.hospitalId && <p className="text-xs text-on-surface-variant">Hospital: {v.hospitalId}</p>}
                        {v.notes && <p className="text-xs text-on-surface-variant mt-1">{v.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add visit form */}
              <form onSubmit={handleAddAntenatal} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-on-surface">Add Antenatal Visit</h3>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Date *</label>
                  <input
                    type="date"
                    required
                    value={antenatalForm.date}
                    onChange={(e) => setAntenatalForm({ ...antenatalForm, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Hospital ID</label>
                  <input
                    value={antenatalForm.hospitalId}
                    onChange={(e) => setAntenatalForm({ ...antenatalForm, hospitalId: e.target.value })}
                    placeholder="Optional"
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Notes</label>
                  <textarea
                    value={antenatalForm.notes}
                    onChange={(e) => setAntenatalForm({ ...antenatalForm, notes: e.target.value })}
                    rows={3}
                    placeholder="Clinical notes..."
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  Add Visit
                </button>
              </form>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Existing delivery */}
              <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-on-surface mb-4">Delivery Record</h3>
                {!record.deliveryDetails?.date ? (
                  <p className="text-sm text-on-surface-variant">No delivery details recorded yet.</p>
                ) : (
                  <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                    <p className="text-sm font-semibold text-on-surface">{new Date(record.deliveryDetails.date).toLocaleDateString()}</p>
                    {record.deliveryDetails.hospitalId && <p className="text-xs text-on-surface-variant">Hospital: {record.deliveryDetails.hospitalId}</p>}
                    {record.deliveryDetails.notes && <p className="text-xs text-on-surface-variant">{record.deliveryDetails.notes}</p>}
                  </div>
                )}
              </div>

              {/* Add/update delivery form */}
              <form onSubmit={handleAddDelivery} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-on-surface">
                  {record.deliveryDetails?.date ? 'Update Delivery Details' : 'Add Delivery Details'}
                </h3>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Date *</label>
                  <input
                    type="date"
                    required
                    value={deliveryForm.date}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Hospital ID</label>
                  <input
                    value={deliveryForm.hospitalId}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, hospitalId: e.target.value })}
                    placeholder="Optional"
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">Notes</label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    rows={3}
                    placeholder="Delivery notes..."
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  Save Delivery Details
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
