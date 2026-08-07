import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en'
import hi from './hi'
import ta from './ta'
import ml from './ml'
import te from './te'
import kn from './kn'

export const LANGUAGES = [
  { code: 'en', label: 'English',    nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi',      nativeLabel: 'हिंदी' },
  { code: 'ta', label: 'Tamil',      nativeLabel: 'தமிழ்' },
  { code: 'ml', label: 'Malayalam',  nativeLabel: 'മലയാളം' },
  { code: 'te', label: 'Telugu',     nativeLabel: 'తెలుగు' },
  { code: 'kn', label: 'Kannada',    nativeLabel: 'ಕನ್ನಡ' },
]

const saved = localStorage.getItem('lang') || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ta: { translation: ta },
    ml: { translation: ml },
    te: { translation: te },
    kn: { translation: kn },
  },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
