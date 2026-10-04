import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'

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

function dateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return 'Not recorded'
  if (typeof value === 'string' && value.startsWith('20') && value.length === 10) {
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}

function createSampleHistory() {
  return {
    pastDiseases: [
      {
        _id: 'disease-1',
        conditionName: 'Childhood Asthma',
        diagnosedDate: '2012-06-14',
        status: 'Resolved',
        severity: 'Mild',
        treatmentSummary: 'Managed with Salbutamol inhaler in childhood. Inactive; no wheezing or acute episodes in >8 years.',
        diagnosedBy: 'Dr. Ramesh Kumar (Pediatrics)',
      },
      {
        _id: 'disease-2',
        conditionName: 'Dengue Viral Fever',
        diagnosedDate: '2021-11-05',
        status: 'Recovered',
        severity: 'Moderate',
        treatmentSummary: 'Inpatient IV fluid support and daily platelet monitoring for 4 days. Full clinical recovery achieved.',
        diagnosedBy: 'City General Hospital',
      },
      {
        _id: 'disease-3',
        conditionName: 'Seasonal Allergic Rhinitis',
        diagnosedDate: '2020-03-22',
        status: 'Managed',
        severity: 'Mild',
        treatmentSummary: 'Intermittent antihistamines (Cetirizine 10mg) during seasonal dust/pollen triggers.',
        diagnosedBy: 'Dr. Priya Nair',
      },
      {
        _id: 'disease-4',
        conditionName: 'Essential Hypertension (Stage 1)',
        diagnosedDate: '2023-09-10',
        status: 'Active (Controlled)',
        severity: 'Mild-to-Moderate',
        treatmentSummary: 'Well controlled with low-sodium dietary adjustments, daily brisk walking, and Telmisartan 40mg.',
        diagnosedBy: 'Dr. Suresh Menon (Cardiology)',
      },
      {
        _id: 'disease-5',
        conditionName: 'Acute Viral Gastroenteritis',
        diagnosedDate: '2024-04-18',
        status: 'Recovered',
        severity: 'Mild',
        treatmentSummary: 'Outpatient treatment with oral rehydration salts (ORS) and probiotics for 3 days.',
        diagnosedBy: 'Urban Primary Health Centre',
      },
    ],
    appointments: [
      {
        _id: 'sample-checkup-1',
        type: 'General Checkup',
        date: dateOffset(-180),
        time: '10:00',
        status: 'Completed',
        consultationOutcome: 'Routine checkup completed. Vitals stable (BP: 118/76 mmHg, SpO2: 99%, Pulse: 72 bpm).',
        consultationNotes: 'Advised routine hydration, balanced nutrition, and annual blood panel.',
        doctorId: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-checkup-2',
        type: 'Cardiology Review & ECG',
        date: dateOffset(-90),
        time: '14:30',
        status: 'Completed',
        consultationOutcome: 'ECG normal sinus rhythm. Blood pressure well controlled on current regimen.',
        consultationNotes: 'Continue current medication. Regular 30 min daily brisk walking recommended.',
        doctorId: { firstName: 'Suresh', lastName: 'Menon' },
      },
      {
        _id: 'sample-checkup-3',
        type: 'Comprehensive Eye & Vision Screening',
        date: dateOffset(-60),
        time: '11:00',
        status: 'Completed',
        consultationOutcome: 'Visual acuity 6/6 bilateral. No signs of retinopathy or ocular strain.',
        consultationNotes: 'Routine screen complete. Next eye checkup advised in 12 months.',
        doctorId: { firstName: 'Priya', lastName: 'Nair' },
      },
      {
        _id: 'sample-rescheduled',
        type: 'Routine Follow-up',
        date: dateOffset(-30),
        time: '11:30',
        status: 'Rescheduled',
        notes: 'Rescheduled upon patient request due to travel conflicts.',
        doctorId: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-next-checkup',
        type: 'Annual Preventive Health Checkup',
        date: dateOffset(25),
        time: '09:30',
        status: 'Confirmed',
        notes: 'Scheduled for comprehensive physical and fasting metabolic profile.',
        doctorId: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
    ],
    immunizations: [
      {
        _id: 'sample-vac-1',
        vaccineName: 'BCG (Bacille Calmette-Guérin)',
        date: '2000-03-15',
        status: 'Completed',
        dose: 'Single Dose',
        notes: 'Administered at birth. Scar confirmed on left upper arm.',
        administeredBy: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-vac-2',
        vaccineName: 'Hepatitis B',
        date: '2000-03-15',
        status: 'Completed',
        dose: 'Dose 1 (Birth Dose)',
        notes: 'Administered within 24 hours of birth.',
        administeredBy: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-vac-3',
        vaccineName: 'Hepatitis B',
        date: '2000-05-10',
        status: 'Completed',
        dose: 'Dose 2',
        notes: 'Administered at 6 weeks milestone.',
        administeredBy: { firstName: 'Priya', lastName: 'Nair' },
      },
      {
        _id: 'sample-vac-4',
        vaccineName: 'OPV (Oral Polio Vaccine)',
        date: '2000-05-10',
        status: 'Completed',
        dose: 'Dose 1',
        notes: 'Primary national immunization schedule.',
        administeredBy: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-vac-5',
        vaccineName: 'DPT (Diphtheria, Pertussis, Tetanus)',
        date: '2000-07-20',
        status: 'Completed',
        dose: 'Primary Series (Dose 1)',
        notes: 'Well-tolerated; no adverse reactions.',
        administeredBy: { firstName: 'Priya', lastName: 'Nair' },
      },
      {
        _id: 'sample-vac-6',
        vaccineName: 'MMR (Measles, Mumps, Rubella)',
        date: '2001-04-12',
        status: 'Completed',
        dose: 'Dose 1',
        notes: 'Administered at 12 months milestone.',
        administeredBy: { firstName: 'Suresh', lastName: 'Menon' },
      },
      {
        _id: 'sample-vac-7',
        vaccineName: 'Typhoid Conjugate Vaccine',
        date: '2015-06-01',
        status: 'Completed',
        dose: 'Single Booster Dose',
        notes: 'Routine adolescent booster dose.',
        administeredBy: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-vac-8',
        vaccineName: 'COVID-19 (Covishield / Corbevax)',
        date: dateOffset(-365),
        status: 'Completed',
        dose: 'Booster / Precautionary Dose',
        notes: 'Precautionary dose completed successfully. Certificate verified.',
        administeredBy: { firstName: 'Priya', lastName: 'Nair' },
      },
      {
        _id: 'sample-vac-9',
        vaccineName: 'Seasonal Influenza (Flu)',
        date: dateOffset(-90),
        dueDate: dateOffset(275),
        status: 'Completed',
        dose: 'Annual Quadrivalent Dose',
        notes: 'Annual seasonal flu vaccine administered.',
        administeredBy: { firstName: 'Ramesh', lastName: 'Kumar' },
      },
      {
        _id: 'sample-vac-10',
        vaccineName: 'Tetanus Toxoid (TT)',
        date: dateOffset(-120),
        dueDate: dateOffset(3500),
        status: 'Completed',
        dose: 'Decennial Booster',
        notes: '10-year booster update completed.',
        administeredBy: { firstName: 'Suresh', lastName: 'Menon' },
      },
      {
        _id: 'sample-vac-11',
        vaccineName: 'HPV (Human Papillomavirus)',
        date: dateOffset(30),
        dueDate: dateOffset(30),
        status: 'Upcoming',
        dose: 'Dose 1 of 2',
        notes: 'Scheduled for primary dose administration at next clinic visit.',
      },
    ],
    medications: [
      'Telmisartan 40mg — 1 tablet daily (Morning) for Blood Pressure management',
      'Cetirizine 10mg — 1 tablet as needed (PRN) for seasonal allergy symptoms',
      'Vitamin D3 60,000 IU — 1 capsule weekly for 8 weeks (Maintenance)',
      'Folic Acid 5mg — 1 tablet daily nutritional supplement',
    ],
    maternalRecord: {
      govtMaternalId: 'RCH-2024-001234',
      abhaId: 'induja.e@abdm',
      antenatalVisits: [
        {
          _id: 'sample-anc-1',
          date: '2024-01-10',
          hospitalId: 'GH-KL-001',
          notes: 'First antenatal visit. BP 110/70 mmHg, weight 58kg. Prescribed iron & folic acid supplements.',
        },
        {
          _id: 'sample-anc-2',
          date: '2024-02-14',
          hospitalId: 'GH-KL-001',
          notes: 'Second visit. Ultrasound scan normal. Fetal heartbeat detected. Hb 11.4 g/dL.',
        },
        {
          _id: 'sample-anc-3',
          date: '2024-03-20',
          hospitalId: 'GH-KL-001',
          notes: 'Third visit. Blood pressure well managed. Tetanus toxoid injection administered.',
        },
      ],
      deliveryDetails: {
        date: '2024-05-22',
        hospitalId: 'GH-KL-001',
        notes: 'Normal full-term delivery. Healthy baby (Weight: 3.2 kg, APGAR: 9). Mother and baby discharged healthy.',
      },
    },
  }
}

function downloadHistoryPdf({
  patient,
  appointments,
  immunizations,
  maternalRecord,
  medications,
  nextCheckup,
  pastDiseases = [],
  isSample,
}) {
  const pdf = new jsPDF()
  const margin = 16
  const pageHeight = pdf.internal.pageSize.getHeight()
  const textWidth = pdf.internal.pageSize.getWidth() - margin * 2
  let y = 20

  function addText(text, { bold = false, gap = 6 } = {}) {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    const lines = pdf.splitTextToSize(String(text || '—'), textWidth)
    const lineHeight = 5
    if (y + lines.length * lineHeight > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }
    pdf.text(lines, margin, y)
    y += lines.length * lineHeight + gap
  }

  function addSection(title, rows) {
    addText(title, { bold: true, gap: 2 })
    if (!rows.length) addText('No record available.', { gap: 5 })
    rows.forEach((row) => addText(row, { gap: 3 }))
    y += 3
  }

  addText('Unified Medical History', { bold: true, gap: 2 })
  addText(`Patient: ${patient.firstName} ${patient.lastName}  |  Generated: ${new Date().toLocaleDateString()}`)
  if (isSample) addText('SAMPLE PREVIEW — these example entries are for demonstration only.', { bold: true })

  addSection('Patient Profile', [
    `Age: ${patient.age || '—'}  |  Gender: ${patient.gender || '—'}  |  Blood type: ${patient.bloodType || '—'}`,
    `ABHA ID: ${patient.abhaId || '—'}  |  Email: ${patient.email || '—'}`,
    `Primary condition: ${patient.medicalCondition || '—'}`,
    `Current medication: ${patient.medication || '—'}`,
    `Test results: ${patient.testResults || '—'}`,
  ])

  addSection(
    'Past Diseases & Medical Conditions Gone Through',
    pastDiseases.map(
      (d) =>
        `${d.conditionName} (${d.status || 'Recorded'}) — Diagnosed: ${formatDate(d.diagnosedDate)} | Severity: ${d.severity || 'Standard'} | Notes: ${d.treatmentSummary || 'N/A'}`
    )
  )

  addSection('Next Scheduled Checkup', [
    nextCheckup
      ? `${formatDate(nextCheckup.date)} at ${nextCheckup.time || ''} — ${nextCheckup.type} (${nextCheckup.status})`
      : 'No upcoming checkup is scheduled.',
  ])

  addSection(
    'Appointments & Checkups History',
    appointments.map(
      (appointment) =>
        `${formatDate(appointment.date)} ${appointment.time || ''} — ${appointment.type} (${appointment.status}). ${appointment.consultationOutcome || appointment.notes || ''} ${appointment.consultationNotes || ''}${appointment.doctorId ? ` [Dr. ${appointment.doctorId.firstName} ${appointment.doctorId.lastName}]` : ''}`
    )
  )

  addSection(
    'Immunizations & Vaccination Records',
    immunizations.map(
      (record) =>
        `${record.vaccineName} — ${record.date ? formatDate(record.date) : 'N/A'}; ${record.dose || 'dose not recorded'}; ${record.status}${record.dueDate ? `; next due ${formatDate(record.dueDate)}` : ''}. ${record.notes || ''}${record.administeredBy ? ` (Administered by Dr. ${record.administeredBy.firstName} ${record.administeredBy.lastName})` : ''}`
    )
  )

  addSection('Medications & Prescriptions', medications)

  if (maternalRecord) {
    addSection('Maternal Care & Antenatal Records', [
      `Govt Maternal ID: ${maternalRecord.govtMaternalId}`,
      ...(maternalRecord.antenatalVisits || []).map(
        (visit) => `${formatDate(visit.date)} — ${visit.notes || 'Antenatal visit'}${visit.hospitalId ? ` (${visit.hospitalId})` : ''}`
      ),
      ...(maternalRecord.deliveryDetails?.date
        ? [`Delivery: ${formatDate(maternalRecord.deliveryDetails.date)} — ${maternalRecord.deliveryDetails.notes || ''}`]
        : []),
    ])
  }

  const fileName = `${patient.firstName}-${patient.lastName}-medical-history.pdf`.replace(/[^a-z0-9.-]/gi, '-')
  pdf.save(fileName)
}

export default function MedicalHistory() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState(
    new URLSearchParams(location.search).get('patientId') || user.id || user._id || ''
  )

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPatients() {
      if (!['doctor', 'staff', 'admin'].includes(user.role)) return

      try {
        const res = await api.get('/patients')
        setPatients(res.data)

        if (!selectedPatientId && res.data.length > 0) {
          setSelectedPatientId(res.data[0]._id)
        }
      } catch (err) {
        console.error('Failed to load patient list:', err)
      }
    }

    loadPatients()
  }, [user.role, selectedPatientId])

  useEffect(() => {
    if (!selectedPatientId) {
      setData(null)
      setLoading(false)
      return
    }

    async function fetchHistory() {
      setLoading(true)
      setError('')

      try {
        const res = await api.get(`/medical-history/${selectedPatientId}`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load medical history')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [selectedPatientId])

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    </DashboardLayout>
  )

  const patient = data?.patient || {
    firstName: user.firstName || 'Vaishali',
    lastName: user.lastName || 'S',
    age: user.age || 28,
    gender: user.gender || 'Female',
    bloodType: user.bloodType || 'O+',
    abhaId: user.abhaId || '91-8273-9021-4432',
    email: user.email || 'vaishali.s@unifiedhealth.com',
    medicalCondition: user.medicalCondition || 'Hypertension, Seasonal Allergies',
    medication: user.medication || 'Telmisartan 40mg, Cetirizine 10mg',
    testResults: user.testResults || 'Normal',
  }

  const savedAppointments = data?.appointments || []
  const savedImmunizations = data?.immunizations || []
  const maternalRecord = data?.maternalRecord || null
  const hasSavedHistory = savedAppointments.length > 0
    || savedImmunizations.length > 0
    || Boolean(maternalRecord?.antenatalVisits?.length || maternalRecord?.deliveryDetails?.date)
  const sampleHistory = hasSavedHistory ? null : createSampleHistory()
  const appointments = sampleHistory?.appointments || savedAppointments
  const immunizations = sampleHistory?.immunizations || savedImmunizations
  const pastDiseases = sampleHistory?.pastDiseases || (
    patient.medicalCondition && patient.medicalCondition.toLowerCase() !== 'none'
      ? patient.medicalCondition.split(/[,;]/).map((cond, index) => ({
          _id: `saved-disease-${index}`,
          conditionName: cond.trim(),
          diagnosedDate: 'Profile record',
          status: 'Active / Managed',
          severity: 'Monitored',
          treatmentSummary: patient.medication && patient.medication.toLowerCase() !== 'none'
            ? `Current prescribed medication: ${patient.medication}`
            : 'Managed through lifestyle and regular clinical follow-ups.',
          diagnosedBy: 'Clinical profile record',
        }))
      : []
  )
  const medications = sampleHistory?.medications || (
    patient.medication && patient.medication.toLowerCase() !== 'none'
      ? [`${patient.medication} (from patient profile)`]
      : []
  )
  const today = dateOffset(0)
  const nextCheckup = appointments
    .filter((appointment) => appointment.date >= today && !['Cancelled', 'Rescheduled'].includes(appointment.status))
    .sort((left, right) => `${left.date} ${left.time || ''}`.localeCompare(`${right.date} ${right.time || ''}`))[0]
  const appointmentChanges = appointments.filter((appointment) =>
    ['Cancelled', 'Rescheduled'].includes(appointment.status)
    || /reschedul|moved|changed/i.test(appointment.notes || '')
  )

  function handleDownloadPdf() {
    downloadHistoryPdf({
      patient,
      appointments,
      immunizations,
      maternalRecord,
      medications,
      nextCheckup,
      pastDiseases,
      isSample: Boolean(sampleHistory),
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <span>Showing sample preview mode ({error})</span>
            </div>
            <button
              onClick={() => { setError(''); setSelectedPatientId(user.id || user._id || ''); }}
              className="text-xs font-semibold underline hover:opacity-80 ml-4"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Unified Medical History</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Complete health record for {patient.firstName} {patient.lastName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['doctor', 'staff', 'admin'].includes(user.role) && (
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                aria-label="Select patient"
                className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-lowest text-on-surface"
              >
                {patients.map((patientItem) => (
                  <option key={patientItem._id} value={patientItem._id}>
                    {patientItem.firstName} {patientItem.lastName}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => navigate(`/dashboard/emergency-transfer?initiate=true&patientId=${selectedPatientId || patient._id || patient.id || ''}`)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-error text-white text-sm font-semibold hover:bg-error/90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">emergency_share</span>
              Emergency Share History
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Download PDF
            </button>
          </div>
        </div>

        {sampleHistory && (
          <div role="status" className="border border-tertiary rounded-lg bg-tertiary-fixed px-4 py-3 text-sm text-on-tertiary-fixed flex items-start gap-2">
            <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">info</span>
            <div>
              <span className="font-semibold">Sample Preview:</span> These example entries (immunizations, vaccinations, checkups, past conditions, and prescriptions) are displayed for demonstration because no saved records exist yet for this patient.
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Section icon="event_upcoming" title="Next Scheduled Checkup">
            {nextCheckup ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-on-surface">{nextCheckup.type}</p>
                <p className="text-sm text-on-surface-variant">{formatDate(nextCheckup.date)} at {nextCheckup.time}</p>
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-tertiary-fixed text-on-tertiary-fixed">
                    Status: {nextCheckup.status}
                  </span>
                  {nextCheckup.doctorId && (
                    <span className="text-xs text-on-surface-variant">
                      Dr. {nextCheckup.doctorId.firstName} {nextCheckup.doctorId.lastName}
                    </span>
                  )}
                </div>
              </div>
            ) : <EmptyState message="No upcoming checkup is scheduled." />}
          </Section>

          <Section icon="medication" title="Active Medications & Prescriptions">
            {medications.length ? (
              <ul className="space-y-2">
                {medications.map((medication, index) => (
                  <li key={`${medication}-${index}`} className="text-sm text-on-surface flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">pill</span>
                    <span>{medication}</span>
                  </li>
                ))}
              </ul>
            ) : <EmptyState message="No medication or prescription details are recorded." />}
          </Section>
        </div>

        <Section icon="person" title="Patient Profile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Age', value: patient.age ? `${patient.age} yrs` : '—' },
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

        {/* Past Diseases & Conditions History */}
        <Section icon="history_edu" title={`Past Diseases & Medical Conditions Gone Through (${pastDiseases.length})`}>
          {pastDiseases.length === 0 ? (
            <EmptyState message="No past diseases or chronic medical conditions are recorded." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pastDiseases.map((item) => (
                <div key={item._id} className="p-3.5 rounded-lg border border-outline-variant bg-surface-container-low/40 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-on-surface">{item.conditionName}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      item.status?.toLowerCase().includes('recovered') ? 'bg-secondary-fixed text-on-secondary-fixed' :
                      item.status?.toLowerCase().includes('resolved') ? 'bg-surface-container-highest text-on-surface' :
                      item.status?.toLowerCase().includes('managed') ? 'bg-primary-fixed text-on-primary-fixed' :
                      'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs text-on-surface-variant flex flex-wrap gap-x-3 gap-y-0.5">
                    <span><strong>Diagnosed:</strong> {formatDate(item.diagnosedDate)}</span>
                    {item.severity && <span><strong>Severity:</strong> {item.severity}</span>}
                  </div>
                  {item.treatmentSummary && (
                    <p className="text-xs text-on-surface-variant pt-0.5">{item.treatmentSummary}</p>
                  )}
                  {item.diagnosedBy && (
                    <p className="text-[11px] text-on-surface-variant/80 italic">Recorded by: {item.diagnosedBy}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Appointments & Checkups */}
        <Section icon="calendar_month" title={`Consultations & Checkups (${appointments.length})`}>
          {appointments.length === 0 ? <EmptyState message="No consultations or checkups found." /> : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt._id} className="flex items-start justify-between border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{apt.type}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatDate(apt.date)} at {apt.time} {apt.doctorId ? `· Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}` : ''}
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

        {/* Reschedules & Changes */}
        <Section icon="edit_calendar" title={`Reschedules & Appointment Changes (${appointmentChanges.length})`}>
          {appointmentChanges.length === 0 ? <EmptyState message="No reschedules or appointment changes are recorded." /> : (
            <div className="space-y-3">
              {appointmentChanges.map((appointment) => (
                <div key={appointment._id} className="border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-on-surface">{appointment.type} · {appointment.status}</p>
                  <p className="text-xs text-on-surface-variant">{formatDate(appointment.date)} at {appointment.time}</p>
                  {appointment.notes && <p className="text-xs text-on-surface-variant mt-1">{appointment.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Immunizations & Vaccinations */}
        <Section icon="vaccines" title={`Immunization & Vaccination Records (${immunizations.length})`}>
          {immunizations.length === 0 ? <EmptyState message="No immunization records found." /> : (
            <div className="space-y-3">
              {immunizations.map((imm) => (
                <div key={imm._id} className="flex items-start justify-between border-b border-outline-variant pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{imm.vaccineName}</p>
                    <p className="text-xs text-on-surface-variant">
                      {formatDate(imm.date)}{imm.dose ? ` · ${imm.dose}` : ''}
                      {imm.administeredBy ? ` · Administered by Dr. ${imm.administeredBy.firstName} ${imm.administeredBy.lastName}` : ''}
                      {imm.dueDate ? ` · Due: ${formatDate(imm.dueDate)}` : ''}
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
        <Section icon="pregnant_woman" title="Maternal Care & Record">
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
                    {maternalRecord.antenatalVisits.map((visit) => (
                      <div key={visit._id} className="text-sm border-b border-outline-variant pb-2 last:border-0">
                        <p className="text-on-surface">{formatDate(visit.date)}{visit.hospitalId ? ` · ${visit.hospitalId}` : ''}</p>
                        {visit.notes && <p className="text-xs text-on-surface-variant">{visit.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {maternalRecord.deliveryDetails?.date && (
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Delivery Details</p>
                  <p className="text-sm text-on-surface">{formatDate(maternalRecord.deliveryDetails.date)}</p>
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

