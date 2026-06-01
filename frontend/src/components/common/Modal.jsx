import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className={`relative w-full ${sizes[size]} bg-slate-950/90 border border-slate-800/80 rounded-2xl shadow-2xl animate-fade-in z-10 overflow-hidden ring-1 ring-slate-800/50`}>
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900/60 bg-slate-950/40">
          <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition-all hover:scale-105 active:scale-95 group"
          >
            <X size={14} className="transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(100vh-140px)] bg-slate-950/20">{children}</div>
      </div>
    </div>
  )
}
