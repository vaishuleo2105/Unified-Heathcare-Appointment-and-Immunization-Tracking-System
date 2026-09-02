import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const API = '/maternal'

export default function MaternalRecordPage() {
  const { t } = useTranslation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [govtId, setGovtId] = useState('')
  const [record, setRecord] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [showManualSearch, setShowManualSearch] = useState(false)
  const [antenatalForm, setAntenatalForm] = useState({ date: '', notes: '', hospitalId: '' })
  const [deliveryForm, setDeliveryForm] = useState({ date: '', notes: '', hospitalId: '' })
  const [activeTab, setActiveTab] = useState('antenatal')

  const isMalePatient = user.role === 'patient' && user.gender === 'Male'

  useEffect(() => {
    if (!isMalePatient) fetchMyRecord()
    else setLoading(false)
  }, [isMalePatient])

  async function fetchMyRecord() {
    setLoading(true)
    try {
      const { data } = await api.get(`${API}/my-record`)
      setRecord(data)
      setGovtId(data.govtMaternalId)
    } catch {
      // Record not created/activated yet
    } finally {
      setLoading(false)
    }
  }

  async function handleActivateAccess() {
    setLoading(true)
    setError(''); setSuccess('')
    try {
      const { data } = await api.post(`${API}/activate`, {})
      setRecord(data)
      setGovtId(data.govtMaternalId)
      setSuccess('Maternal & Child Health Access activated successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate access')
    } finally {
      setLoading(false)
    }
  }

  async function handleLookup(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setRecord(null)
    if (!govtId.trim()) return setError(t('enterMaternalIdError'))
    setLoading(true)
    try {
      const { data } = await api.get(`${API}/${govtId.trim()}`)
      setRecord(data)
    } catch (err) {
      if (err.response?.status === 404) setError('No record found. You can activate maternal access directly.')
      else setError(err.response?.data?.message || 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    setError(''); setSuccess('')
    setLoading(true)
    try {
      const { data } = await api.post(API, { govtMaternalId: govtId.trim() })
      setRecord(data)
      setSuccess(t('registerSuccess'))
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddAntenatal(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const { data } = await api.post(`${API}/${record.govtMaternalId}/antenatal`, antenatalForm)
      setRecord(data)
      setSuccess(t('antenatalAdded'))
      setAntenatalForm({ date: '', notes: '', hospitalId: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add visit')
    }
  }

  async function handleAddDelivery(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      const { data } = await api.post(`${API}/${record.govtMaternalId}/delivery`, deliveryForm)
      setRecord(data)
      setSuccess(t('deliverySaved'))
      setDeliveryForm({ date: '', notes: '', hospitalId: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save delivery details')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">{t('maternalTracking')}</h1>
          <p className="text-on-surface-variant mt-1">{t('maternalSubtitle')}</p>
        </div>
        {!record && !isMalePatient && (
          <button
            onClick={() => setShowManualSearch(!showManualSearch)}
            className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
          >
            {showManualSearch ? '← Back to Activation' : 'Have a Government RCH ID? Search ID'}
          </button>
        )}
      </div>

      {isMalePatient ? (
        <div className="bg-white border border-outline-variant rounded-xl p-8 max-w-xl mx-auto text-center my-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2">Maternal Care Access Notice</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Maternal & Child Health (MCH) tracking is strictly reserved for female patients and authorized healthcare clinical staff.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container rounded-lg text-xs font-semibold text-on-surface-variant">
            <span className="material-symbols-outlined text-sm text-secondary">verified_user</span>
            <span>HIPAA & ABDM Privacy Protected</span>
          </div>
        </div>
      ) : (
        <>

      {showManualSearch && !record && (
        <form onSubmit={handleLookup} className="flex gap-3 mb-6 bg-white p-4 border border-outline-variant rounded-xl shadow-sm">
          <input
            value={govtId}
            onChange={(e) => setGovtId(e.target.value)}
            placeholder={t('enterMaternalId')}
            className="flex-1 px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? t('searching') : t('lookUp')}
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
          {error.includes('register') && (
            <button onClick={handleRegister} className="ml-auto text-xs font-bold underline">{t('registerNow')}</button>
          )}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-lg text-sm">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {success}
        </div>
      )}

      {/* Opt-In Access Card if patient does not have maternal tracking enabled */}
      {!record && !loading && !showManualSearch && (
        <div className="bg-white border border-outline-variant rounded-xl p-8 max-w-2xl mx-auto shadow-sm text-center my-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mx-auto mb-4 text-primary">
            <span className="material-symbols-outlined text-3xl">pregnant_woman</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface mb-2">Mother & Child Health (MCH) Tracking Access</h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
            Do you want to enable Maternal Care & Antenatal (ANC) Visit tracking for your account?
            This will activate your digital RCH health card, log antenatal visits, and record delivery milestones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleActivateAccess}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">auto_awesome</span>
              <span>Yes, Activate Maternal Access</span>
            </button>
          </div>
        </div>
      )}

      {record && (
        <div className="space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">pregnant_woman</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface-variant">{t('govtMaternalId')}</p>
              <p className="text-lg font-bold text-primary">{record.govtMaternalId}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-on-surface-variant">{t('registered')}</p>
              <p className="text-sm font-semibold text-on-surface">{new Date(record.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex gap-2 border-b border-outline-variant">
            {['antenatal', 'delivery'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'antenatal' ? t('antenatalVisits') : t('deliveryDetails')}
              </button>
            ))}
          </div>

          {activeTab === 'antenatal' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-on-surface mb-4">{t('visitHistoryCount')} ({record.antenatalVisits.length})</h3>
                {record.antenatalVisits.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">{t('noAntenatalVisits')}</p>
                ) : (
                  <div className="space-y-3">
                    {record.antenatalVisits.map((v, i) => (
                      <div key={i} className="p-3 bg-surface-container-low rounded-xl">
                        <p className="text-sm font-semibold text-on-surface">{new Date(v.date).toLocaleDateString()}</p>
                        {v.hospitalId && <p className="text-xs text-on-surface-variant">{t('hospitalId')}: {v.hospitalId}</p>}
                        {v.notes && <p className="text-xs text-on-surface-variant mt-1">{v.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddAntenatal} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-on-surface">{t('addAntenatalVisit')}</h3>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">{t('date')} *</label>
                  <input
                    type="date" required
                    value={antenatalForm.date}
                    onChange={(e) => setAntenatalForm({ ...antenatalForm, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">{t('hospitalId')}</label>
                  <input
                    value={antenatalForm.hospitalId}
                    onChange={(e) => setAntenatalForm({ ...antenatalForm, hospitalId: e.target.value })}
                    placeholder={t('optional')}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">{t('notes')}</label>
                  <textarea
                    value={antenatalForm.notes}
                    onChange={(e) => setAntenatalForm({ ...antenatalForm, notes: e.target.value })}
                    rows={3}
                    placeholder={t('clinicalNotes')}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  {t('addVisit')}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-on-surface mb-4">{t('deliveryRecord')}</h3>
                {!record.deliveryDetails?.date ? (
                  <p className="text-sm text-on-surface-variant">{t('noDeliveryDetails')}</p>
                ) : (
                  <div className="p-3 bg-surface-container-low rounded-xl space-y-1">
                    <p className="text-sm font-semibold text-on-surface">{new Date(record.deliveryDetails.date).toLocaleDateString()}</p>
                    {record.deliveryDetails.hospitalId && <p className="text-xs text-on-surface-variant">{t('hospitalId')}: {record.deliveryDetails.hospitalId}</p>}
                    {record.deliveryDetails.notes && <p className="text-xs text-on-surface-variant">{record.deliveryDetails.notes}</p>}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddDelivery} className="bg-white border border-outline-variant rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-on-surface">
                  {record.deliveryDetails?.date ? t('updateDeliveryDetails') : t('addDeliveryDetails')}
                </h3>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">{t('date')} *</label>
                  <input
                    type="date" required
                    value={deliveryForm.date}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">{t('hospitalId')}</label>
                  <input
                    value={deliveryForm.hospitalId}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, hospitalId: e.target.value })}
                    placeholder={t('optional')}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant">{t('notes')}</label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    rows={3}
                    placeholder={t('deliveryNotes')}
                    className="w-full mt-1 px-3 py-2 border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                  {t('saveDeliveryDetails')}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      </>
      )}
    </DashboardLayout>
  )
}
