import { useEffect, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

function Section({ icon, title, children }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">{icon}</span>
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function EmptyState({ message }) {
  return <p className="text-sm text-on-surface-variant">{message}</p>
}

export default function MedicalHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await api.get(`/medical-history/${user._id}`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load medical history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [user._id])

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout>
      <div className="text-error text-sm">{error}</div>
    </DashboardLayout>
  )

  const { patient, appointments, immunizations, maternalRecord } = data

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Unified Medical History</h1>
          <p className="text-sm text-on-surface-variant mt-1">Complete health record for {patient.firstName} {patient.lastName}</p>
        </div>

        {/* Patient Profile */}
        <Section icon="person" title="Patient Profile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Age', value: patient.age || '—' },
              { label: 'Gender', value: patient.gender || '—' },
              { label: 'Blood Type', value: patient.bloodType || '—' },
              { label: 'ABHA ID', value: patient.abhaId || '—' },
              { label: 'Medical Condition', value: patient.medicalCondition || '—' },
              { label: 'Medication', value: patient.medication || '—' },
              { label: 'Test Results', value: patient.testResults || '—' },
              { label: 'Email', value: patient.email },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-on-surface-variant">{label}</p>
                <p className="text-sm font-medium text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Appointments */}
        <Section icon="calendar_month" title={`Appointments (${appointments.length})`}>
          {appointments.length === 0 ? <EmptyState message="No appointments found." /> : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt._id} className="flex items-start justify-between border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{apt.type}</p>
                    <p className="text-xs text-on-surface-variant">
                      {apt.date} at {apt.time} · Dr. {apt.doctorId?.firstName} {apt.doctorId?.lastName}
                    </p>
                    {apt.consultationNotes && (
                      <p className="text-xs text-on-surface-variant mt-1">Notes: {apt.consultationNotes}</p>
                    )}
                    {apt.consultationOutcome && (
                      <p className="text-xs text-on-surface-variant">Outcome: {apt.consultationOutcome}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    apt.status === 'Completed' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                    apt.status === 'Confirmed' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                    apt.status === 'Cancelled' ? 'bg-error-container text-on-error-container' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>{apt.status}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Immunizations */}
        <Section icon="vaccines" title={`Immunizations (${immunizations.length})`}>
          {immunizations.length === 0 ? <EmptyState message="No immunization records found." /> : (
            <div className="space-y-3">
              {immunizations.map((imm) => (
                <div key={imm._id} className="flex items-start justify-between border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{imm.vaccineName}</p>
                    <p className="text-xs text-on-surface-variant">
                      {imm.date}{imm.dose ? ` · ${imm.dose}` : ''}
                      {imm.administeredBy ? ` · By Dr. ${imm.administeredBy.firstName} ${imm.administeredBy.lastName}` : ''}
                    </p>
                    {imm.notes && <p className="text-xs text-on-surface-variant mt-1">{imm.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    imm.status === 'Completed' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                    imm.status === 'Upcoming' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                    'bg-error-container text-on-error-container'
                  }`}>{imm.status}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Maternal Record */}
        <Section icon="pregnant_woman" title="Maternal Record">
          {!maternalRecord ? <EmptyState message="No maternal record found." /> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Govt. Maternal ID</p>
                  <p className="text-sm font-medium text-on-surface">{maternalRecord.govtMaternalId}</p>
                </div>
                {maternalRecord.abhaId && (
                  <div>
                    <p className="text-xs text-on-surface-variant">ABHA ID</p>
                    <p className="text-sm font-medium text-on-surface">{maternalRecord.abhaId}</p>
                  </div>
                )}
              </div>

              {maternalRecord.antenatalVisits?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Antenatal Visits</p>
                  <div className="space-y-2">
                    {maternalRecord.antenatalVisits.map((v) => (
                      <div key={v._id} className="text-sm border-b border-outline-variant pb-2 last:border-0">
                        <p className="text-on-surface">{new Date(v.date).toLocaleDateString()}{v.hospitalId ? ` · ${v.hospitalId}` : ''}</p>
                        {v.notes && <p className="text-xs text-on-surface-variant">{v.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {maternalRecord.deliveryDetails?.date && (
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Delivery Details</p>
                  <p className="text-sm text-on-surface">{new Date(maternalRecord.deliveryDetails.date).toLocaleDateString()}</p>
                  {maternalRecord.deliveryDetails.notes && (
                    <p className="text-xs text-on-surface-variant">{maternalRecord.deliveryDetails.notes}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>

      </div>
    </DashboardLayout>
  )
}
