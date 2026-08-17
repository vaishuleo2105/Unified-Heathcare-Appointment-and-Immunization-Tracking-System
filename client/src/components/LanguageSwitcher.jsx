import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  function changeLanguage(code) {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-sm font-semibold text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-base text-primary">translate</span>
        <span className="hidden sm:inline">{current.nativeLabel}</span>
        <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-low ${
                  i18n.language === lang.code
                    ? 'bg-primary-fixed text-primary font-semibold'
                    : 'text-on-surface'
                }`}
              >
                <span>{lang.nativeLabel}</span>
                <span className="text-xs text-on-surface-variant">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
