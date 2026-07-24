import { useState, useEffect } from 'react'
import axios from 'axios'

const VISIT_TYPES = [
  { value: 'General Checkup', icon: 'stethoscope', desc: 'Routine health examination' },
  { value: 'Consultation', icon: 'chat_bubble', desc: 'Discuss a health concern' },
  { value: 'Follow-up', icon: 'replay', desc: 'Follow up on previous visit' },
  { value: 'Vaccination', icon: 'vaccines', desc: 'Immunization & vaccines' },
  { value: 'Emergency', icon: 'emergency', desc: 'Urgent medical attention' },
  { value: 'Lab Test', icon: 'biotech', desc: 'Blood, urine or other tests' },
]

const DEPARTMENTS = [
  { value: 'General Medicine', icon: 'medical_services', specializations: ['General Medicine'] },
  { value: 'Pediatrics', icon: 'child_care', specializations: ['Pediatrics'] },
  { value: 'Orthopedics', icon: 'accessibility_new', specializations: ['Orthopedics'] },
  { value: 'Gynecology & Maternity', icon: 'pregnant_woman', specializations: ['Gynecology & Maternity'] },
  { value: 'Dermatology', icon: 'face', specializations: ['Dermatology'] },
  { value: 'ENT', icon: 'hearing', specializations: ['ENT'] },
  { value: 'Immunization', icon: 'vaccines', specializations: ['Immunization'] },
  { value: 'Cardiology', icon: 'favorite', specializations: ['Cardiology'] },
]

const STEP_LABELS = ['Visit Type', 'Department', 'Doctor & Slot', 'Confirm']

export default function BookAppointmentModal({ onClose, onSuccess }) {
  const token = localStorage.getItem('token')

  const [step, setStep] = useState(1)
  const [visitType, setVisitType] = useState('')
  const [department, setDepartment] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch doctors when department is selected
  useEffect(() => {
    if (!department) return
    setLoadingDoctors(true)
    setDoctors([])
    setSelectedDoctor(null)
    setDate('')
    setSlots([])
    setSelectedSlot('')
    axios.get(`/api/doctors?specialization=${encodeURIComponent(department.specializations[0])}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setDoctors(data)
      })
      .catch(() => {})
      .finally(() => setLoadingDoctors(false))
  }, [department])

  // Fetch slots when doctor + date selected
  useEffect(() => {
    if (!selectedDoctor || !date) return
    setSlots([])
    setSelectedSlot('')
    setSlotError('')
    setLoadingSlots(true)
    axios.get(`/api/doctors/${selectedDoctor._id}/slots?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      if (!data.available) {
        setSlotError(data.message)
      } else if (data.slots.length === 0) {
        setSlotError('No available slots on this date. Please choose another date.')
      } else {
        setSlots(data.slots)
      }
    }).catch(() => setSlotError('Failed to load slots'))
      .finally(() => setLoadingSlots(false))
  }, [selectedDoctor, date])

  async function handleSubmit() {
    setError('')
    setSubmitting(true)
    try {
      await axios.post('/api/appointments', {
        doctorId: selectedDoctor._id,
        date,
        time: selectedSlot,
        type: visitType,
        notes,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSuccess('Appointment booked successfully!')
      setTimeout(() => { onSuccess(); onClose() }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  function canProceed() {
    if (step === 1) return !!visitType
    if (step === 2) return !!department
    if (step === 3) return !!selectedDoctor && !!selectedSlot
    return true
  }

  function handleNext() {
    if (canProceed()) setStep(s => s + 1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-outline-variant flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-on-surface">Book Appointment</h3>
            <button onClick={onClose} className="text-on-surface-variant hover:text-error">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {/* Step Indicator */}
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > i + 1 ? 'bg-secondary text-white' :
                    step === i + 1 ? 'bg-primary text-white' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {step > i + 1 ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 text-center ${step === i + 1 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`h-0.5 flex-1 mb-4 transition-all ${step > i + 1 ? 'bg-secondary' : 'bg-outline-variant'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP 1: Visit Type */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">What is the purpose of your visit?</p>
              <p className="text-xs text-on-surface-variant mb-5">Select the type of appointment you need</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VISIT_TYPES.map(v => (
                  <button
                    key={v.value}
                    onClick={() => setVisitType(v.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary ${
                      visitType === v.value
                        ? 'border-primary bg-primary-fixed'
                        : 'border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mb-2 block ${visitType === v.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {v.icon}
                    </span>
                    <p className={`text-sm font-bold ${visitType === v.value ? 'text-primary' : 'text-on-surface'}`}>{v.value}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Department */}
          {step === 2 && (
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">Which medical department do you need?</p>
              <p className="text-xs text-on-surface-variant mb-5">Select the department related to your health concern</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEPARTMENTS.map(dept => (
                  <button
                    key={dept.value}
                    onClick={() => setDepartment(dept)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary ${
                      department?.value === dept.value
                        ? 'border-primary bg-primary-fixed'
                        : 'border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl mb-2 block ${department?.value === dept.value ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {dept.icon}
                    </span>
                    <p className={`text-sm font-bold ${department?.value === dept.value ? 'text-primary' : 'text-on-surface'}`}>{dept.value}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{dept.specializations[0]}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Doctor & Slot */}
          {step === 3 && (
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">Select a Doctor & Available Slot</p>
              <p className="text-xs text-on-surface-variant mb-5">Choose your preferred doctor, date and time</p>

              {loadingDoctors ? (
                <div className="flex justify-center py-10">
                  <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-10 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
                  <p className="text-sm text-on-surface-variant mt-2">No doctors available in this department currently.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Doctor List */}
                  <div className="space-y-3">
                    {doctors.map(doc => (
                      <button
                        key={doc._id}
                        onClick={() => { setSelectedDoctor(doc); setDate(''); setSlots([]); setSelectedSlot('') }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedDoctor?._id === doc._id
                            ? 'border-primary bg-primary-fixed'
                            : 'border-outline-variant hover:border-primary hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            selectedDoctor?._id === doc._id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            <span className="material-symbols-outlined text-2xl">medical_services</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-on-surface">{doc.name}</p>
                              <span className="text-xs font-bold text-secondary">₹{doc.consultationFee}</span>
                            </div>
                            <p className="text-xs text-primary font-semibold">{doc.specialization}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{doc.qualification} • {doc.experience} experience</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.availableDays.map(day => (
                                <span key={day} className="text-[10px] font-medium px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded-full">
                                  {day.slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                          {selectedDoctor?._id === doc._id && (
                            <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">check_circle</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Date & Slot Picker — shown after doctor selected */}
                  {selectedDoctor && (
                    <div className="mt-4 p-4 bg-surface-container-low rounded-xl space-y-4">
                      <div>
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
                          Select Date
                        </label>
                        <input
                          type="date"
                          min={today}
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                        />
                        <p className="text-xs text-on-surface-variant mt-1">
                          Available on: {selectedDoctor.availableDays.join(', ')}
                        </p>
                      </div>

                      {date && (
                        <div>
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
                            Available Time Slots
                          </label>
                          {loadingSlots ? (
                            <div className="flex justify-center py-4">
                              <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          ) : slotError ? (
                            <div className="flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
                              <span className="material-symbols-outlined text-base">event_busy</span>
                              {slotError}
                            </div>
                          ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                              {slots.map(slot => (
                                <button
                                  key={slot}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`py-2.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                                    selectedSlot === slot
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-outline-variant bg-white hover:border-primary hover:bg-primary-fixed text-on-surface'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Confirm */}
          {step === 4 && (
            <div>
              <p className="text-sm font-semibold text-on-surface mb-1">Confirm your appointment</p>
              <p className="text-xs text-on-surface-variant mb-5">Review the details before confirming</p>

              {/* Summary */}
              <div className="bg-surface-container-low rounded-xl p-5 space-y-3 mb-5">
                {[
                  { icon: 'assignment', label: 'Visit Type', value: visitType },
                  { icon: 'local_hospital', label: 'Department', value: department?.value },
                  { icon: 'medical_services', label: 'Doctor', value: selectedDoctor?.name },
                  { icon: 'stethoscope', label: 'Specialization', value: selectedDoctor?.specialization },
                  { icon: 'school', label: 'Qualification', value: selectedDoctor?.qualification },
                  { icon: 'calendar_today', label: 'Date', value: date },
                  { icon: 'schedule', label: 'Time', value: selectedSlot },
                  { icon: 'payments', label: 'Consultation Fee', value: `₹${selectedDoctor?.consultationFee}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-1 border-b border-outline-variant last:border-0">
                    <span className="material-symbols-outlined text-primary text-lg w-6">{icon}</span>
                    <span className="text-xs text-on-surface-variant w-32 flex-shrink-0">{label}</span>
                    <span className="text-sm font-semibold text-on-surface">{value}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">
                  Symptoms / Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or reason for visit..."
                  rows={3}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>

              {error && (
                <div className="mt-4 flex items-center gap-2 bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm">
                  <span className="material-symbols-outlined text-base">error</span>{error}
                </div>
              )}
              {success && (
                <div className="mt-4 flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-3 rounded-xl text-sm">
                  <span className="material-symbols-outlined text-base">check_circle</span>{success}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-outline-variant flex-shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 border border-outline-variant text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-outline-variant text-on-surface text-sm font-semibold rounded-xl hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !!success}
              className="flex-1 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Booking...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Confirm Booking
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
