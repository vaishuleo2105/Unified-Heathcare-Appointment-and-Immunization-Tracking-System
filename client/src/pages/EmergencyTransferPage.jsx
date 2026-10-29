import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import DashboardLayout from '../components/layout/DashboardLayout'
import api from '../api'

const CATEGORIES = [
  { id: 'basic_info', label: 'Basic Patient Information', icon: 'person', desc: 'Name, age, gender, contact, ABHA Health ID' },
  { id: 'blood_group_vitals', label: 'Blood Group & Vitals', icon: 'bloodtype', desc: 'Blood type, vitals overview, standard test status' },
  { id: 'allergies_warnings', label: 'Allergies & Clinical Warnings', icon: 'warning', desc: 'Drug allergies, risk flags, acute precautions' },
  { id: 'medical_history_conditions', label: 'Past Diagnoses & Conditions', icon: 'history_edu', desc: 'Chronic illnesses, past medical history' },
  { id: 'medications_prescriptions', label: 'Current Medications & Prescriptions', icon: 'medication', desc: 'Active drugs, dosage, ongoing prescriptions' },
  { id: 'immunizations_vaccines', label: 'Immunizations & Vaccines', icon: 'vaccines', desc: 'Full vaccination history, completed doses' },
  { id: 'recent_consultations', label: 'Recent Consultations & Clinical Notes', icon: 'clinical_notes', desc: 'Doctor examination notes, visit outcomes' },
  { id: 'maternal_record', label: 'Maternal & Child Health Record', icon: 'pregnant_woman', desc: 'Antenatal visits, ultrasound notes, delivery records' },
  { id: 'past_checkups_attachments', label: 'Past Scans, X-Rays & Prescriptions', icon: 'radiology', desc: 'Uploaded diagnostic imaging (X-Ray, CT, MRI, Ultrasound), lab reports, and doctor prescriptions' },
  { id: 'emergency_contacts', label: 'Emergency Contact Information', icon: 'contact_phone', desc: 'Primary contact & 108 emergency helpline' },
]

const REASONS = [
  'Emergency Treatment',
  'Patient Referral',
  'Specialist Consultation',
  'Continued Treatment',
  'ICU / Critical Care Transfer',
  'Trauma / Surgical Emergency',
  'Other',
]

const DEPARTMENTS = [
  'Emergency & Trauma Care',
  'General Medicine',
  'Cardiology & Cardiac Care',
  'ICU / Critical Care Unit',
  'Pediatrics & Neonatology',
  'Obstetrics & Gynaecology',
  'Orthopaedics & Trauma',
  'Neurology & Neurosurgery',
  'Surgical Gastroenterology',
  'Pulmonology & Respiratory Care',
]

export default function EmergencyTransferPage() {
  const location = useLocation()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [activeTab, setActiveTab] = useState(user.role === 'patient' ? 'my_transfers' : 'incoming')
  const [transfers, setTransfers] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [auditLogs, setAuditLogs] = useState([])
  const [activeViewSubTab, setActiveViewSubTab] = useState('records') // 'records' | 'audit'

  // Response modal
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseAction, setResponseAction] = useState('Accepted') // 'Accepted' | 'Rejected'
  const [responseNotes, setResponseNotes] = useState('')
  const [respondingTransferId, setRespondingTransferId] = useState(null)

  // Success summary modal
  const [completedTransfer, setCompletedTransfer] = useState(null)

  // Multi-step form state
  const [step, setStep] = useState(1)
  const [destDistrict, setDestDistrict] = useState('All')
  const [form, setForm] = useState({
    patientId: user.role === 'patient' ? (user.id || user._id) : '',
    sourceHospitalId: user.hospitalId?._id || user.hospitalId || '',
    destinationHospitalId: '',
    destinationDepartment: 'Emergency & Trauma Care',
    receivingDoctorId: '',
    reason: 'Emergency Treatment',
    reasonDetails: '',
    priority: 'Critical',
    sharedCategories: CATEGORIES.map((c) => c.id),
    attachments: [],
  })

  // Attachment upload state
  const [newAttachment, setNewAttachment] = useState({
    category: 'X-Ray',
    notes: '',
  })
  const [uploadError, setUploadError] = useState('')
  const [previewModalFile, setPreviewModalFile] = useState(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Auto-open modal if navigated from Medical History or other pages
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('initiate') === 'true') {
      const pId = params.get('patientId')
      if (pId) {
        setForm((f) => ({ ...f, patientId: pId }))
      }
      setShowTransferModal(true)
      setStep(1)
    }
  }, [location.search])

  async function fetchInitialData() {
    setLoading(true)
    setError('')
    try {
      const [transfersRes, hospitalsRes] = await Promise.all([
        api.get('/emergency-transfers'),
        api.get('/hospitals'),
      ])
      const transferList = Array.isArray(transfersRes?.data) ? transfersRes.data : []
      const hospList = Array.isArray(hospitalsRes?.data) ? hospitalsRes.data : []
      setTransfers(transferList)
      setHospitals(hospList)

      if (['doctor', 'staff', 'admin'].includes(user.role)) {
        try {
          const patRes = await api.get('/patients')
          const patList = Array.isArray(patRes?.data) ? patRes.data : []
          setPatients(patList)
          if (!form.patientId && patList.length > 0) {
            setForm((f) => ({ ...f, patientId: patList[0]._id }))
          }
        } catch {
          setPatients([])
        }
      }

      // Auto-set source hospital if empty
      if (!form.sourceHospitalId && hospList.length > 0) {
        const defaultHosp = hospList.find((h) => h._id === (user.hospitalId?._id || user.hospitalId)) || hospList[0]
        setForm((f) => ({ ...f, sourceHospitalId: defaultHosp._id }))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load emergency transfer data')
      setTransfers([])
      setHospitals([])
    } finally {
      setLoading(false)
    }
  }

  async function refreshTransfers() {
    try {
      const res = await api.get('/emergency-transfers')
      setTransfers(Array.isArray(res?.data) ? res.data : [])
    } catch {
      setTransfers([])
    }
  }

  function handleCategoryToggle(catId) {
    setForm((prev) => {
      const exists = prev.sharedCategories.includes(catId)
      const nextCats = exists
        ? prev.sharedCategories.filter((id) => id !== catId)
        : [...prev.sharedCategories, catId]
      return { ...prev, sharedCategories: nextCats }
    })
  }

  function handleSelectAllCategories() {
    if (form.sharedCategories.length === CATEGORIES.length) {
      setForm((prev) => ({ ...prev, sharedCategories: [] }))
    } else {
      setForm((prev) => ({ ...prev, sharedCategories: CATEGORIES.map((c) => c.id) }))
    }
  }

  // File Upload Handlers
  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit. Please select a smaller scan or image.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64Data = reader.result
      const attachmentItem = {
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        category: newAttachment.category,
        fileData: base64Data,
        fileSize: file.size,
        notes: newAttachment.notes || '',
        uploadedAt: new Date().toISOString(),
      }
      setForm((prev) => ({
        ...prev,
        attachments: [...prev.attachments, attachmentItem],
        sharedCategories: prev.sharedCategories.includes('past_checkups_attachments')
          ? prev.sharedCategories
          : [...prev.sharedCategories, 'past_checkups_attachments'],
      }))
      setNewAttachment({ category: 'X-Ray', notes: '' })
      e.target.value = ''
    }
    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAttachment(indexToRemove) {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== indexToRemove),
    }))
  }

  // Submit transfer
  async function handleSubmitTransfer(e) {
    if (e) e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.patientId) return setError('Please select a patient.')
    if (!form.destinationHospitalId) return setError('Please select a destination hospital in Tamil Nadu.')
    if (form.sourceHospitalId === form.destinationHospitalId) {
      return setError('You cannot transfer records to the same hospital. Choose a different receiving facility.')
    }
    if (!form.sharedCategories.length) {
      return setError('Please select at least one category of medical information to share.')
    }

    try {
      const res = await api.post('/emergency-transfers', form)
      setCompletedTransfer(res.data)
      setShowTransferModal(false)
      refreshTransfers()
      setSuccess(`Emergency Medical Data Transfer (${res.data.transferId}) initiated successfully!`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate transfer')
    }
  }

  // Open single transfer details & audit log
  async function handleOpenTransfer(transfer) {
    setSelectedTransfer(transfer)
    setShowViewModal(true)
    setActiveViewSubTab('records')
    try {
      const [transferRes, auditRes] = await Promise.all([
        api.get(`/emergency-transfers/${transfer._id}`),
        api.get(`/emergency-transfers/${transfer._id}/audit-logs`),
      ])
      setSelectedTransfer(transferRes.data)
      setAuditLogs(auditRes.data)
      refreshTransfers()
    } catch (err) {
      console.error('Failed to load transfer details or audit logs:', err)
    }
  }

  // Handle Accept / Reject
  function promptResponse(transferId, action) {
    setRespondingTransferId(transferId)
    setResponseAction(action)
    setResponseNotes('')
    setShowResponseModal(true)
  }

  async function handleConfirmResponse() {
    if (!respondingTransferId) return
    try {
      const res = await api.patch(`/emergency-transfers/${respondingTransferId}/status`, {
        status: responseAction,
        responseNotes,
      })
      setShowResponseModal(false)
      if (selectedTransfer && selectedTransfer._id === respondingTransferId) {
        setSelectedTransfer(res.data)
      }
      refreshTransfers()
      setSuccess(`Transfer status updated to ${responseAction}.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update transfer status')
    }
  }

  // Single file download helper (works with data URLs / base64 without opening new tabs)
  function downloadFile(fileData, fileName) {
    if (!fileData) return
    const link = document.createElement('a')
    link.href = fileData
    link.download = fileName || 'medical_record'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download all attached scans & documents separately
  function downloadAllAttachments(attachments) {
    if (!attachments || !attachments.length) return
    attachments.forEach((att, index) => {
      setTimeout(() => {
        downloadFile(att.fileData, att.fileName)
      }, index * 250)
    })
  }

  // PDF Export for Emergency Transfer Slip
  function exportTransferSlip(transfer) {
    if (!transfer) return
    const pdf = new jsPDF()
    const margin = 16
    const textWidth = pdf.internal.pageSize.getWidth() - margin * 2
    let y = 20

    function addLine(text, { bold = false, gap = 6, size = 10, color = [0, 0, 0] } = {}) {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal')
      pdf.setFontSize(size)
      pdf.setTextColor(...color)
      const lines = pdf.splitTextToSize(String(text || '—'), textWidth)
      if (y + lines.length * 5 > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage()
        y = margin
      }
      pdf.text(lines, margin, y)
      y += lines.length * 5 + gap
    }

    // Title banner
    addLine('TAMIL NADU EMERGENCY MEDICAL DATA TRANSFER SLIP', { bold: true, size: 14, color: [160, 30, 30], gap: 3 })
    addLine(`TRANSFER ID: ${transfer.transferId}  |  PRIORITY: ${transfer.priority.toUpperCase()}  |  STATUS: ${transfer.status.toUpperCase()}`, { bold: true, size: 10, gap: 5 })
    addLine(`Generated on: ${new Date().toLocaleString()}  |  Govt Emergency Helpline: 108`, { size: 9, gap: 6 })

    // Source & Destination
    addLine('TRANSFER ROUTING INFORMATION', { bold: true, size: 11, gap: 2 })
    addLine(`From (Source): ${transfer.sourceHospitalId?.name || '—'} (${transfer.sourceHospitalId?.district || 'Tamil Nadu'})`, { gap: 2 })
    addLine(`To (Destination): ${transfer.destinationHospitalId?.name || '—'} (${transfer.destinationHospitalId?.district || 'Tamil Nadu'})`, { gap: 2 })
    addLine(`Target Unit: ${transfer.destinationDepartment || 'Emergency Department'}  |  Reason: ${transfer.reason}${transfer.reasonDetails ? ` - ${transfer.reasonDetails}` : ''}`, { gap: 6 })

    // Patient
    addLine('PATIENT PROFILE & EMERGENCY VITALS', { bold: true, size: 11, gap: 2 })
    const p = transfer.patientId || {}
    const snap = transfer.patientDataSnapshot || {}
    addLine(`Patient Name: ${p.firstName || snap.basicInfo?.firstName || '—'} ${p.lastName || snap.basicInfo?.lastName || ''}  |  Age: ${p.age || snap.basicInfo?.age || '—'}  |  Gender: ${p.gender || snap.basicInfo?.gender || '—'}`, { gap: 2 })
    addLine(`Blood Group: ${p.bloodType || snap.bloodGroupAndVitals?.bloodType || '—'}  |  ABHA ID: ${p.abhaId || snap.basicInfo?.abhaId || '—'}`, { gap: 2 })
    addLine(`Primary Diagnoses: ${p.medicalCondition || snap.medicalConditions?.primaryCondition || 'None recorded'}`, { gap: 2 })
    addLine(`Current Medications: ${p.medication || snap.medications?.currentMedications || 'None recorded'}`, { gap: 6 })

    // Consultations & Recent notes
    if (snap.consultations?.length) {
      addLine('RECENT CLINICAL CONSULTATIONS', { bold: true, size: 11, gap: 2 })
      snap.consultations.forEach((c) => {
        addLine(`${c.date} (${c.type}) — ${c.doctorName}: ${c.consultationOutcome || c.notes || 'Routine checkup'}`, { gap: 2 })
      })
      y += 4
    }

    // Vaccines
    if (snap.immunizations?.length) {
      addLine('IMMUNIZATION & VACCINATION SNAPSHOT', { bold: true, size: 11, gap: 2 })
      snap.immunizations.slice(0, 8).forEach((imm) => {
        addLine(`${imm.vaccineName} (${imm.dose || 'Standard'}) — ${imm.status} [${imm.date}]`, { gap: 2 })
      })
      y += 4
    }

    // Attached diagnostic scans & prescriptions
    if (transfer.attachments?.length) {
      addLine('ATTACHED DIAGNOSTIC SCANS & MEDICAL DOCUMENTS', { bold: true, size: 11, gap: 2 })
      transfer.attachments.forEach((att, idx) => {
        addLine(`${idx + 1}. [${(att.category || 'RECORD').toUpperCase()}] ${att.fileName}${att.notes ? ` — Note: ${att.notes}` : ''} (${att.fileSize ? (att.fileSize / 1024).toFixed(1) + ' KB' : 'Standard'})`, { gap: 2 })
      })
      y += 4
    }

    addLine('AUTHORIZED MEDICAL DISCLOSURE', { bold: true, size: 10, gap: 2 })
    addLine(`Initiated by: ${transfer.initiatedBy?.firstName} ${transfer.initiatedBy?.lastName} (${transfer.initiatedBy?.role})`, { gap: 2 })
    addLine('This emergency referral document is protected under State Healthcare Data Protection norms.', { size: 8 })

    pdf.save(`${transfer.transferId}-Emergency-Transfer-Slip.pdf`)
  }

  // Filter transfers for current view
  const safeTransfers = Array.isArray(transfers) ? transfers : []
  const safeHospitals = Array.isArray(hospitals) ? hospitals : []
  const safePatients = Array.isArray(patients) ? patients : []

  const userHospId = user.hospitalId?._id || user.hospitalId || ''
  const incomingTransfers = safeTransfers.filter((t) =>
    user.role === 'patient'
      ? false
      : t?.destinationHospitalId?._id === userHospId || (user.role === 'admin' && !userHospId)
  )
  const outgoingTransfers = safeTransfers.filter((t) =>
    user.role === 'patient'
      ? false
      : t?.sourceHospitalId?._id === userHospId || t?.initiatedBy?._id === (user.id || user._id)
  )
  const patientTransfers = safeTransfers.filter((t) =>
    t?.patientId?._id === (user.id || user._id) || t?.patientId === (user.id || user._id)
  )

  const activeHospital = safeHospitals.find((h) => h?._id === userHospId) || {
    name: user.hospitalId?.name || 'Peelamedu Urban Primary Health Centre',
    district: user.hospitalId?.district || 'Coimbatore',
    type: user.hospitalId?.type || 'Urban Primary Health Centre (UPHC)',
  }

  const selectedPatientObj = safePatients.find((p) => p?._id === form.patientId) || (user.role === 'patient' ? user : null)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-base">emergency_share</span>
                <span>Tamil Nadu Inter-Hospital Emergency Network</span>
              </div>
              <h1 className="text-2xl font-bold text-on-surface">Emergency Medical Data Transfer</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Seamless referral data sharing across Tamil Nadu Medical College Hospitals, GHs, and PHCs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setShowTransferModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error text-white text-sm font-semibold hover:bg-error/90 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>Initiate Emergency Transfer</span>
              </button>
            </div>
          </div>

          {/* Hospital Context Pill */}
          <div className="mt-4 pt-4 border-t border-outline-variant flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">domain</span>
              <span><strong>Active Facility:</strong> {activeHospital.name} ({activeHospital.district})</span>
            </div>
            <div className="flex items-center gap-4">
              <span><strong>Clinician:</strong> {user.firstName} {user.lastName} ({user.role})</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-semibold">
                Network Online · 108 Connected
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-xs font-bold underline ml-4">Dismiss</button>
          </div>
        )}

        {success && (
          <div className="bg-secondary-container text-on-secondary-container p-4 rounded-xl text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-xs font-bold underline ml-4">Dismiss</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-outline-variant gap-2">
          {user.role !== 'patient' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('incoming')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'incoming'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">move_to_inbox</span>
                <span>Incoming Transfers ({incomingTransfers.length})</span>
                {incomingTransfers.some((t) => t.status === 'Pending') && (
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('outgoing')}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'outgoing'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">outbox</span>
                <span>Outgoing Transfers ({outgoingTransfers.length})</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('my_transfers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'my_transfers'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-lg">assignment_ind</span>
            <span>{user.role === 'patient' ? 'My Emergency Transfers' : 'All Network Transfers'} ({user.role === 'patient' ? patientTransfers.length : transfers.length})</span>
          </button>
        </div>

        {/* Transfer Table / List */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
            </div>
          ) : (
            (() => {
              const currentList =
                activeTab === 'incoming'
                  ? incomingTransfers
                  : activeTab === 'outgoing'
                  ? outgoingTransfers
                  : user.role === 'patient'
                  ? patientTransfers
                  : transfers

              if (currentList.length === 0) {
                return (
                  <div className="text-center py-12 px-4 space-y-3">
                    <span className="material-symbols-outlined text-on-surface-variant/50 text-5xl">folder_off</span>
                    <p className="text-sm font-medium text-on-surface-variant">No emergency transfers found in this category.</p>
                    <button
                      type="button"
                      onClick={() => setShowTransferModal(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      <span>Initiate New Referral Transfer</span>
                    </button>
                  </div>
                )
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider border-b border-outline-variant">
                      <tr>
                        <th className="py-3.5 px-4">Transfer ID & Priority</th>
                        <th className="py-3.5 px-4">Patient</th>
                        <th className="py-3.5 px-4">From (Source)</th>
                        <th className="py-3.5 px-4">To (Destination)</th>
                        <th className="py-3.5 px-4">Reason</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant text-on-surface">
                      {currentList.map((item) => (
                        <tr key={item._id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-bold">{item.transferId}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                item.priority === 'Critical' ? 'bg-error-container text-on-error-container animate-pulse' :
                                item.priority === 'High' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                                'bg-secondary-fixed text-on-secondary-fixed'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant font-sans block mt-0.5">
                              {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-semibold">{item.patientId?.firstName} {item.patientId?.lastName}</p>
                            <p className="text-xs text-on-surface-variant">
                              {item.patientId?.age ? `${item.patientId.age}y` : ''} {item.patientId?.gender || ''} · <span className="text-primary font-medium">{item.patientId?.bloodType || 'O+'}</span>
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-medium text-on-surface">{item.sourceHospitalId?.name}</p>
                            <p className="text-on-surface-variant">{item.sourceHospitalId?.district}</p>
                          </td>

                          <td className="py-3.5 px-4 text-xs">
                            <p className="font-medium text-on-surface">{item.destinationHospitalId?.name}</p>
                            <p className="text-on-surface-variant">{item.destinationDepartment || 'Emergency Unit'}</p>
                          </td>

                          <td className="py-3.5 px-4 text-xs">
                            <span className="font-medium block">{item.reason}</span>
                            {item.reasonDetails && <span className="text-on-surface-variant truncate block max-w-[150px]">{item.reasonDetails}</span>}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                              item.status === 'Accepted' ? 'bg-secondary-fixed text-on-secondary-fixed' :
                              item.status === 'Pending' ? 'bg-error-container text-on-error-container' :
                              item.status === 'Viewed' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                              item.status === 'Completed' ? 'bg-surface-container-highest text-on-surface' :
                              'bg-surface-container text-on-surface-variant'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenTransfer(item)}
                              className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-all"
                            >
                              View Record
                            </button>

                            {activeTab === 'incoming' && item.status === 'Pending' && ['doctor', 'staff', 'admin'].includes(user.role) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => promptResponse(item._id, 'Accepted')}
                                  className="px-2.5 py-1 rounded-lg bg-secondary-fixed hover:bg-secondary text-xs font-semibold text-on-secondary-fixed hover:text-white transition-all"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => promptResponse(item._id, 'Rejected')}
                                  className="px-2.5 py-1 rounded-lg bg-error-container hover:bg-error text-xs font-semibold text-on-error-container hover:text-white transition-all"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()
          )}
        </div>

        {/* ── 7-STEP TRANSFER MODAL ────────────────────────────────────── */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8">

              {/* Modal Header */}
              <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">emergency</span>
                    <span>Emergency Referral & Data Transfer Workflow</span>
                  </div>
                  <h2 className="text-lg font-bold text-on-surface">Step {step} of 8: {
                    step === 1 ? 'Patient Identification' :
                    step === 2 ? 'Source Facility (Origin)' :
                    step === 3 ? 'Destination Hospital (Tamil Nadu)' :
                    step === 4 ? 'Clinical Reason for Transfer' :
                    step === 5 ? 'Select Medical Data Categories' :
                    step === 6 ? 'Upload Medical Checkups & Scans' :
                    step === 7 ? 'Emergency Priority Level' :
                    'Confirmation & Authorization'
                  }</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* Step Progress Bar */}
              <div className="w-full bg-surface-container h-1.5">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(step / 8) * 100}%` }}
                ></div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">

                {/* STEP 1: PATIENT */}
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Identify the patient whose medical history is being transferred to the receiving facility.
                    </p>

                    {['doctor', 'staff', 'admin'].includes(user.role) ? (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface" htmlFor="patientSelect">Select Patient *</label>
                        <select
                          id="patientSelect"
                          value={form.patientId}
                          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface font-medium outline-none focus:ring-2 focus:ring-primary"
                        >
                          {patients.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.firstName} {p.lastName} — Age: {p.age || '—'} · Blood: {p.bloodType || 'O+'} · {p.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}

                    {/* Patient Overview Summary */}
                    {selectedPatientObj && (
                      <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-on-surface">{selectedPatientObj.firstName} {selectedPatientObj.lastName}</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                            Blood Group: {selectedPatientObj.bloodType || 'O+'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-on-surface-variant">
                          <div><strong>Age / Gender:</strong> {selectedPatientObj.age || 28} yrs / {selectedPatientObj.gender || 'Female'}</div>
                          <div><strong>ABHA ID:</strong> {selectedPatientObj.abhaId || 'induja.e@abdm'}</div>
                          <div><strong>Medical Condition:</strong> {selectedPatientObj.medicalCondition || 'None'}</div>
                          <div><strong>Current Meds:</strong> {selectedPatientObj.medication || 'None'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: SOURCE HOSPITAL */}
                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Source facility information is automatically verified and locked to your registered health center.
                    </p>

                    <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">local_hospital</span>
                        <div>
                          <h3 className="text-sm font-bold text-on-surface">{activeHospital.name}</h3>
                          <p className="text-xs text-on-surface-variant">{activeHospital.district} District · {activeHospital.type}</p>
                          <p className="text-xs text-on-surface-variant mt-1">{activeHospital.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-outline-variant rounded-lg text-xs space-y-1">
                      <p><strong>Initiated By:</strong> {user.firstName} {user.lastName}</p>
                      <p><strong>User Role:</strong> {user.role.toUpperCase()}</p>
                      <p><strong>Clinical Helpline:</strong> 108 Emergency Medical Response</p>
                    </div>
                  </div>
                )}

                {/* STEP 3: DESTINATION HOSPITAL */}
                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Select the receiving government hospital or specialized medical college hospital in Tamil Nadu.
                    </p>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-on-surface shrink-0">Filter District:</label>
                      <select
                        value={destDistrict}
                        onChange={(e) => setDestDistrict(e.target.value)}
                        className="text-xs px-2.5 py-1.5 bg-white border border-outline-variant rounded-lg text-on-surface outline-none"
                      >
                        <option value="All">All Tamil Nadu Districts</option>
                        {Array.from(new Set(hospitals.map((h) => h.district))).sort().map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface" htmlFor="destHospSelect">
                        Receiving Facility (Destination Hospital) *
                      </label>
                      <select
                        id="destHospSelect"
                        value={form.destinationHospitalId}
                        onChange={(e) => setForm({ ...form, destinationHospitalId: e.target.value })}
                        required
                        className="w-full px-3 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface font-medium outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Choose Destination Hospital --</option>
                        {hospitals
                          .filter((h) => h._id !== form.sourceHospitalId)
                          .filter((h) => destDistrict === 'All' || h.district === destDistrict)
                          .map((h) => (
                            <option key={h._id} value={h._id}>
                              {h.name} — {h.district} ({h.type})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface" htmlFor="destDeptSelect">
                        Destination Department / Receiving Unit *
                      </label>
                      <select
                        id="destDeptSelect"
                        value={form.destinationDepartment}
                        onChange={(e) => setForm({ ...form, destinationDepartment: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                      >
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 4: REASON FOR TRANSFER */}
                {step === 4 && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Indicate the primary medical reason for referring and transferring this patient.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {REASONS.map((r) => (
                        <label
                          key={r}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            form.reason === r
                              ? 'border-primary bg-primary-fixed/30 text-on-surface font-semibold shadow-sm'
                              : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reason"
                            value={r}
                            checked={form.reason === r}
                            onChange={(e) => setForm({ ...form, reason: e.target.value })}
                            className="accent-primary"
                          />
                          <span className="text-xs">{r}</span>
                        </label>
                      ))}
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="text-xs font-bold text-on-surface" htmlFor="reasonDetails">
                        Clinical Brief / Transfer Notes (Optional)
                      </label>
                      <textarea
                        id="reasonDetails"
                        rows="3"
                        value={form.reasonDetails}
                        onChange={(e) => setForm({ ...form, reasonDetails: e.target.value })}
                        placeholder="Provide details of acute symptoms, vitals at departure, or required specialized interventions..."
                        className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary"
                      ></textarea>
                    </div>
                  </div>
                )}

                {/* STEP 5: INFORMATION TO SHARE */}
                {step === 5 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-on-surface-variant">
                        Select which medical records are authorized to be disclosed during transfer:
                      </p>
                      <button
                        type="button"
                        onClick={handleSelectAllCategories}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {form.sharedCategories.length === CATEGORIES.length ? 'Deselect All' : 'Select All Categories'}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {CATEGORIES.map((cat) => {
                        const checked = form.sharedCategories.includes(cat.id)
                        return (
                          <label
                            key={cat.id}
                            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                              checked
                                ? 'border-primary bg-primary-fixed/20'
                                : 'border-outline-variant bg-white hover:bg-surface-container-low'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleCategoryToggle(cat.id)}
                              className="accent-primary mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-base text-primary">{cat.icon}</span>
                                <span className="text-xs font-bold text-on-surface">{cat.label}</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">{cat.desc}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 6: UPLOAD MEDICAL CHECKUPS & SCANS */}
                {step === 6 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-on-surface">Upload Past Checkups, Diagnostic Scans & Prescriptions</h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Attach relevant past checkup records such as X-Ray films, CT/MRI scans, lab reports, or prescriptions to transfer directly to the receiving hospital.
                      </p>
                    </div>

                    {/* Uploader Box */}
                    <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low/60 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-on-surface block mb-1">Document / Scan Category</label>
                          <select
                            value={newAttachment.category}
                            onChange={(e) => setNewAttachment({ ...newAttachment, category: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="X-Ray">🩻 X-Ray Film / Image</option>
                            <option value="CT Scan">🧠 CT Scan (Computed Tomography)</option>
                            <option value="MRI">🧲 MRI Scan</option>
                            <option value="Ultrasound">👶 Ultrasound / Sonography</option>
                            <option value="Lab Report">🧪 Blood / Lab Test Report</option>
                            <option value="Prescription">💊 Doctor Prescription / Medication Order</option>
                            <option value="Discharge Summary">📋 Prior Discharge Summary</option>
                            <option value="Other">📄 Other Medical Document</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-on-surface block mb-1">Clinical Note / Description</label>
                          <input
                            type="text"
                            value={newAttachment.notes}
                            onChange={(e) => setNewAttachment({ ...newAttachment, notes: e.target.value })}
                            placeholder="e.g. Chest X-Ray PA view, Brain CT with contrast..."
                            className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block">
                          <span className="text-xs font-bold text-on-surface block mb-1">Select File (Images or PDF up to 10MB)</span>
                          <div className="border-2 border-dashed border-primary/40 hover:border-primary bg-white rounded-xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5">
                            <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                            <p className="text-xs font-bold text-on-surface">Click here to upload scan or prescription</p>
                            <p className="text-[11px] text-on-surface-variant">Supports JPG, PNG, WEBP, and PDF documents</p>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </div>
                        </label>
                      </div>

                      {uploadError && (
                        <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">error</span>
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>

                    {/* List of Attached Documents */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-on-surface">
                          Attached Medical Documents ({form.attachments.length})
                        </h4>
                        {form.attachments.length === 0 && (
                          <span className="text-[11px] text-on-surface-variant italic">Optional — you can click Next if no extra files to upload</span>
                        )}
                      </div>

                      {form.attachments.length === 0 ? (
                        <div className="p-4 border border-dashed border-outline-variant rounded-xl text-center text-xs text-on-surface-variant">
                          No scans or prescriptions attached yet. Upload files above to transfer them along with patient text data.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {form.attachments.map((att, idx) => {
                            const isImage = att.fileType?.startsWith('image/') || att.fileData?.startsWith('data:image')
                            return (
                              <div key={idx} className="p-2.5 bg-white border border-outline-variant rounded-xl flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  {isImage ? (
                                    <img src={att.fileData} alt={att.fileName} className="w-10 h-10 object-cover rounded-lg border border-outline-variant flex-shrink-0 cursor-pointer hover:opacity-80" onClick={() => setPreviewModalFile(att)} />
                                  ) : (
                                    <div className="w-10 h-10 bg-surface-container rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                                      <span className="material-symbols-outlined text-xl">description</span>
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">{att.category}</span>
                                      <span className="text-xs font-bold text-on-surface truncate">{att.fileName}</span>
                                    </div>
                                    <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                                      {(att.fileSize / 1024).toFixed(1)} KB {att.notes ? `· "${att.notes}"` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {isImage && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewModalFile(att)}
                                      className="p-1.5 rounded-lg text-primary hover:bg-surface-container"
                                      title="Preview Scan"
                                    >
                                      <span className="material-symbols-outlined text-base">visibility</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(idx)}
                                    className="p-1.5 rounded-lg text-error hover:bg-error-container/20"
                                    title="Delete Attachment"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 7: PRIORITY */}
                {step === 7 && (
                  <div className="space-y-4">
                    <p className="text-xs text-on-surface-variant">
                      Assign emergency triage priority to notify receiving hospital duty team.
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { level: 'Critical', color: 'border-error bg-error-container/40 text-on-error-container', badge: 'bg-error text-white', desc: 'Life-threatening / ICU referral / Immediate trauma care' },
                        { level: 'High', color: 'border-tertiary bg-tertiary-fixed/40 text-on-tertiary-fixed', badge: 'bg-tertiary-fixed text-on-tertiary-fixed font-bold', desc: 'Urgent transfer required within 2-4 hours' },
                        { level: 'Normal', color: 'border-secondary bg-secondary-fixed/40 text-on-secondary-fixed', badge: 'bg-secondary-fixed text-on-secondary-fixed font-bold', desc: 'Standard clinical referral / elective transfer' },
                      ].map((prio) => (
                        <label
                          key={prio.level}
                          className={`p-4 rounded-xl border-2 flex flex-col justify-between gap-2 cursor-pointer transition-all ${
                            form.priority === prio.level ? `${prio.color} ring-2 ring-primary` : 'border-outline-variant bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <input
                              type="radio"
                              name="priority"
                              value={prio.level}
                              checked={form.priority === prio.level}
                              onChange={(e) => setForm({ ...form, priority: e.target.value })}
                              className="accent-primary"
                            />
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${prio.badge}`}>
                              {prio.level}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-on-surface">{prio.level} Priority</span>
                          <p className="text-[11px] text-on-surface-variant">{prio.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 8: CONFIRMATION SUMMARY */}
                {step === 8 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-error/40 bg-error-container/20 space-y-3">
                      <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
                        <span className="material-symbols-outlined text-base">verified</span>
                        <span>Emergency Medical Data Transfer Summary</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-on-surface-variant font-semibold">Patient:</p>
                          <p className="font-bold text-on-surface">{selectedPatientObj?.firstName} {selectedPatientObj?.lastName}</p>
                        </div>
                        <div>
                          <p className="text-on-surface-variant font-semibold">Priority:</p>
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            form.priority === 'Critical' ? 'bg-error text-white' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                          }`}>
                            {form.priority}
                          </span>
                        </div>
                        <div>
                          <p className="text-on-surface-variant font-semibold">From (Source Facility):</p>
                          <p className="font-medium text-on-surface">{activeHospital.name}</p>
                        </div>
                        <div>
                          <p className="text-on-surface-variant font-semibold">To (Receiving Facility):</p>
                          <p className="font-medium text-on-surface">{hospitals.find((h) => h._id === form.destinationHospitalId)?.name || 'Selected Facility'}</p>
                        </div>
                        <div>
                          <p className="text-on-surface-variant font-semibold">Reason:</p>
                          <p className="font-medium text-on-surface">{form.reason}</p>
                        </div>
                        <div>
                          <p className="text-on-surface-variant font-semibold">Initiated By:</p>
                          <p className="font-medium text-on-surface">{user.firstName} {user.lastName} ({user.role})</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-outline-variant/40">
                        <p className="text-xs font-semibold text-on-surface-variant mb-1">Attached Diagnostic Scans & Prescriptions (${form.attachments.length}):</p>
                        {form.attachments.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {form.attachments.map((att, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-outline-variant font-medium text-on-surface flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-primary">attach_file</span>
                                <span>[${att.category}] ${att.fileName}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-on-surface-variant italic mb-2">No past checkup files attached.</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-outline-variant/40">
                        <p className="text-xs font-semibold text-on-surface-variant mb-1">Categories to be Transferred:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {form.sharedCategories.map((cId) => (
                            <span key={cId} className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-outline-variant font-medium text-on-surface">
                              {CATEGORIES.find((c) => c.id === cId)?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container transition-all"
                  >
                    Back
                  </button>
                ) : <div></div>}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                  >
                    Cancel
                  </button>

                  {step < 8 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 3 && !form.destinationHospitalId) {
                          return setError('Please select a destination hospital before continuing.')
                        }
                        setError('')
                        setStep(step + 1)
                      }}
                      className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitTransfer}
                      className="px-5 py-2 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                      <span>Confirm & Share</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TRANSFER SUCCESS SUMMARY MODAL ───────────────────────────── */}
        {completedTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-center my-6 max-h-[90vh] overflow-y-auto">
              <div className="w-14 h-14 rounded-full bg-secondary-fixed mx-auto flex items-center justify-center text-on-secondary-fixed">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface">Emergency Transfer Initiated!</h3>
              
              <div className="p-3.5 bg-surface-container-low rounded-xl text-xs text-left space-y-1 font-mono border border-outline-variant/60">
                <p><strong>Transfer ID:</strong> <span className="text-primary font-bold">{completedTransfer.transferId}</span></p>
                <p><strong>From:</strong> {completedTransfer.sourceHospitalId?.name}</p>
                <p><strong>To:</strong> {completedTransfer.destinationHospitalId?.name}</p>
                <p><strong>Priority:</strong> <span className="font-bold text-error uppercase">{completedTransfer.priority}</span></p>
                <p><strong>Status:</strong> Pending Acknowledgment</p>
              </div>

              {/* Uploaded Files Section: Download Separately */}
              {completedTransfer.attachments && completedTransfer.attachments.length > 0 && (
                <div className="text-left space-y-2.5 pt-3 border-t border-outline-variant">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">folder_open</span>
                      <span>Uploaded Medical Files ({completedTransfer.attachments.length})</span>
                    </h4>
                    {completedTransfer.attachments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => downloadAllAttachments(completedTransfer.attachments)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">download_for_offline</span>
                        <span>Download All Files</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Each diagnostic scan, X-ray, or prescription can be downloaded separately below:
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {completedTransfer.attachments.map((att, idx) => {
                      const isImage = att.fileType?.startsWith('image/') || att.fileData?.startsWith('data:image')
                      return (
                        <div key={idx} className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant flex items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            {isImage ? (
                              <img
                                src={att.fileData}
                                alt={att.fileName}
                                className="w-10 h-10 object-cover rounded-lg border border-outline-variant flex-shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                                onClick={() => setPreviewModalFile(att)}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary flex-shrink-0 border border-outline-variant">
                                <span className="material-symbols-outlined text-xl">description</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                                  {att.category}
                                </span>
                                <span className="text-xs font-bold text-on-surface truncate">{att.fileName}</span>
                              </div>
                              <p className="text-[10px] text-on-surface-variant mt-0.5 truncate">
                                {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : 'Ready'} {att.notes ? `· "${att.notes}"` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isImage && (
                              <button
                                type="button"
                                onClick={() => setPreviewModalFile(att)}
                                className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-bold flex items-center gap-1"
                                title="Preview Scan"
                              >
                                <span className="material-symbols-outlined text-xs">visibility</span>
                                <span>View</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => downloadFile(att.fileData, att.fileName)}
                              className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                              title="Download this file separately"
                            >
                              <span className="material-symbols-outlined text-xs">download</span>
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-on-surface-variant">
                The receiving medical center has been notified via the State Emergency Transfer Network.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => exportTransferSlip(completedTransfer)}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-primary hover:bg-surface-container flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                  <span>Export Transfer Slip (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedTransfer(null)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW SHARED RECORD & AUDIT MODAL ─────────────────────────── */}
        {showViewModal && selectedTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-8">

              {/* Header */}
              <div className="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold text-sm font-mono">{selectedTransfer.transferId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedTransfer.priority === 'Critical' ? 'bg-error text-white' : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}>
                      {selectedTransfer.priority}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
                      {selectedTransfer.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-on-surface mt-1">
                    Emergency Referral: {selectedTransfer.patientId?.firstName} {selectedTransfer.patientId?.lastName}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => exportTransferSlip(selectedTransfer)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Download Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowViewModal(false)}
                    className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
              </div>

              {/* Subtabs */}
              <div className="flex border-b border-outline-variant px-6 bg-surface-container-low/40 gap-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveViewSubTab('records')}
                  className={`py-3 border-b-2 transition-all ${
                    activeViewSubTab === 'records' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Authorized Shared Medical Data
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewSubTab('audit')}
                  className={`py-3 border-b-2 transition-all ${
                    activeViewSubTab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
                  }`}
                >
                  Access Audit Trail ({auditLogs.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {activeViewSubTab === 'records' ? (
                  <div className="space-y-4">
                    {/* Routing Information Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant text-xs">
                      <div>
                        <p className="text-on-surface-variant font-semibold">Origin Facility:</p>
                        <p className="font-bold text-on-surface">{selectedTransfer.sourceHospitalId?.name}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant font-semibold">Receiving Facility:</p>
                        <p className="font-bold text-on-surface">{selectedTransfer.destinationHospitalId?.name}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant font-semibold">Target Unit:</p>
                        <p className="font-bold text-on-surface">{selectedTransfer.destinationDepartment}</p>
                      </div>
                      <div>
                        <p className="text-on-surface-variant font-semibold">Referral Reason:</p>
                        <p className="font-bold text-on-surface">{selectedTransfer.reason}</p>
                      </div>
                    </div>

                    {/* Shared Data Categories */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Disclosed Clinical Records</h3>

                      {/* Attached Diagnostic Scans, X-Rays & Prescriptions */}
                      {(selectedTransfer.attachments?.length > 0 || selectedTransfer.patientDataSnapshot?.medicalAttachments?.length > 0) && (
                        <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary-fixed/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-primary text-base">radiology</span>
                              <span>Attached Diagnostic Scans & Medical Prescriptions ({(selectedTransfer.attachments || selectedTransfer.patientDataSnapshot?.medicalAttachments || []).length})</span>
                            </h4>
                            <div className="flex items-center gap-2">
                              {selectedTransfer.attachments?.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => downloadAllAttachments(selectedTransfer.attachments)}
                                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-xs">download_for_offline</span>
                                  <span>Download All ({selectedTransfer.attachments.length})</span>
                                </button>
                              )}
                              <span className="text-[10px] bg-primary text-white font-bold px-2 py-0.5 rounded-full uppercase">
                                Clinical Documents
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(selectedTransfer.attachments || []).map((att, idx) => {
                              const isImage = att.fileType?.startsWith('image/') || att.fileData?.startsWith('data:image')
                              return (
                                <div key={idx} className="p-3 bg-white rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between space-y-2">
                                  <div className="flex items-start gap-3">
                                    {isImage ? (
                                      <img
                                        src={att.fileData}
                                        alt={att.fileName}
                                        className="w-14 h-14 object-cover rounded-lg border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                        onClick={() => setPreviewModalFile(att)}
                                      />
                                    ) : (
                                      <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center text-primary border border-outline-variant flex-shrink-0">
                                        <span className="material-symbols-outlined text-2xl">description</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                                          {att.category}
                                        </span>
                                        {att.fileSize && (
                                          <span className="text-[10px] text-on-surface-variant">
                                            {(att.fileSize / 1024).toFixed(1)} KB
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs font-bold text-on-surface truncate mt-1" title={att.fileName}>
                                        {att.fileName}
                                      </p>
                                      {att.notes && (
                                        <p className="text-[11px] text-on-surface-variant italic mt-0.5">
                                          "{att.notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/40">
                                    {isImage ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewModalFile(att)}
                                        className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                                      >
                                        <span className="material-symbols-outlined text-sm">visibility</span>
                                        <span>View Scan</span>
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => downloadFile(att.fileData, att.fileName)}
                                      className="px-2.5 py-1 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface text-[11px] font-bold flex items-center gap-1 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm">download</span>
                                      <span>Download</span>
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {selectedTransfer.patientDataSnapshot?.basicInfo && (
                        <div className="p-3.5 rounded-xl border border-outline-variant bg-white space-y-2">
                          <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">person</span>
                            <span>Patient Profile</span>
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-on-surface-variant">
                            <div><strong>Name:</strong> {selectedTransfer.patientDataSnapshot.basicInfo.firstName} {selectedTransfer.patientDataSnapshot.basicInfo.lastName}</div>
                            <div><strong>Age / Gender:</strong> {selectedTransfer.patientDataSnapshot.basicInfo.age}y / {selectedTransfer.patientDataSnapshot.basicInfo.gender}</div>
                            <div><strong>ABHA ID:</strong> {selectedTransfer.patientDataSnapshot.basicInfo.abhaId || '—'}</div>
                            <div><strong>Email:</strong> {selectedTransfer.patientDataSnapshot.basicInfo.email}</div>
                          </div>
                        </div>
                      )}

                      {selectedTransfer.patientDataSnapshot?.bloodGroupAndVitals && (
                        <div className="p-3.5 rounded-xl border border-outline-variant bg-white space-y-2">
                          <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">bloodtype</span>
                            <span>Blood Group & Vitals</span>
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-on-surface">
                            <span><strong>Blood Group:</strong> <span className="font-bold text-primary">{selectedTransfer.patientDataSnapshot.bloodGroupAndVitals.bloodType}</span></span>
                            <span><strong>Test Results:</strong> {selectedTransfer.patientDataSnapshot.bloodGroupAndVitals.testResults}</span>
                          </div>
                        </div>
                      )}

                      {selectedTransfer.patientDataSnapshot?.medicalConditions && (
                        <div className="p-3.5 rounded-xl border border-outline-variant bg-white space-y-1">
                          <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">history_edu</span>
                            <span>Past Medical History & Conditions</span>
                          </h4>
                          <p className="text-xs text-on-surface-variant">{selectedTransfer.patientDataSnapshot.medicalConditions.primaryCondition}</p>
                        </div>
                      )}

                      {selectedTransfer.patientDataSnapshot?.medications && (
                        <div className="p-3.5 rounded-xl border border-outline-variant bg-white space-y-1">
                          <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">medication</span>
                            <span>Current Medications & Prescriptions</span>
                          </h4>
                          <p className="text-xs text-on-surface-variant">{selectedTransfer.patientDataSnapshot.medications.currentMedications}</p>
                        </div>
                      )}

                      {selectedTransfer.patientDataSnapshot?.consultations?.length > 0 && (
                        <div className="p-3.5 rounded-xl border border-outline-variant bg-white space-y-2">
                          <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">clinical_notes</span>
                            <span>Recent Consultations ({selectedTransfer.patientDataSnapshot.consultations.length})</span>
                          </h4>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {selectedTransfer.patientDataSnapshot.consultations.map((c, i) => (
                              <div key={i} className="text-xs border-b border-outline-variant/60 pb-1.5 last:border-0">
                                <p className="font-semibold text-on-surface">{c.date} — {c.type} ({c.doctorName})</p>
                                <p className="text-on-surface-variant">{c.consultationOutcome || c.notes}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedTransfer.patientDataSnapshot?.immunizations?.length > 0 && (
                        <div className="p-3.5 rounded-xl border border-outline-variant bg-white space-y-2">
                          <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-base">vaccines</span>
                            <span>Immunization History ({selectedTransfer.patientDataSnapshot.immunizations.length})</span>
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {selectedTransfer.patientDataSnapshot.immunizations.map((imm, i) => (
                              <div key={i} className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/40">
                                <p className="font-semibold">{imm.vaccineName}</p>
                                <p className="text-[11px] text-on-surface-variant">{imm.dose} · {imm.status} [{imm.date}]</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* AUDIT LOG TAB */
                  <div className="space-y-3">
                    <p className="text-xs text-on-surface-variant">
                      Immutable digital audit trail of all access, viewing, and status change operations for this patient transfer.
                    </p>

                    <div className="space-y-2">
                      {auditLogs.map((log) => (
                        <div key={log._id} className="p-3 rounded-xl border border-outline-variant bg-white text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary">{log.action.replace('_', ' ')}</span>
                            <span className="text-[11px] text-on-surface-variant font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-on-surface-variant">{log.details}</p>
                          <p className="text-[11px] text-on-surface-variant/80 font-medium">
                            User: {log.performedBy?.firstName} {log.performedBy?.lastName} ({log.performedBy?.role})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">
                  Initiated: {new Date(selectedTransfer.createdAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ── RESPONSE MODAL (Accept / Reject) ─────────────────────────── */}
        {showResponseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-on-surface">
                {responseAction === 'Accepted' ? 'Accept Emergency Transfer' : 'Reject Transfer Request'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {responseAction === 'Accepted'
                  ? 'Confirm acceptance and assign emergency triage bed/unit for incoming patient.'
                  : 'Provide reason for referral decline (e.g. lack of specialized ICU beds, diversion to tertiary center).'}
              </p>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface" htmlFor="respNotes">Clinical Response Notes</label>
                <textarea
                  id="respNotes"
                  rows="3"
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Enter response notes / bed assignment instructions..."
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs text-on-surface outline-none focus:ring-2 focus:ring-primary"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResponse}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm ${
                    responseAction === 'Accepted' ? 'bg-secondary' : 'bg-error'
                  }`}
                >
                  Confirm {responseAction}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── LIGHTBOX SCAN VIEWER MODAL ───────────────────────── */}
        {previewModalFile && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setPreviewModalFile(null)}
          >
            <div
              className="bg-surface border border-outline-variant rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white">
                    {previewModalFile.category}
                  </span>
                  <span className="text-sm font-bold text-on-surface truncate">
                    {previewModalFile.fileName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(previewModalFile.fileData, previewModalFile.fileName)}
                    className="px-3 py-1.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface hover:bg-surface-container flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModalFile(null)}
                    className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-auto flex items-center justify-center bg-black/90 min-h-[350px]">
                {previewModalFile.fileType?.startsWith('image/') || previewModalFile.fileData?.startsWith('data:image') ? (
                  <img
                    src={previewModalFile.fileData}
                    alt={previewModalFile.fileName}
                    className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <iframe
                    src={previewModalFile.fileData}
                    title={previewModalFile.fileName}
                    className="w-full h-[72vh] rounded-lg bg-white"
                  />
                )}
              </div>

              {previewModalFile.notes && (
                <div className="p-3 border-t border-outline-variant bg-surface-container-low text-xs text-on-surface">
                  <strong className="text-primary">Clinical Note:</strong> {previewModalFile.notes}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
