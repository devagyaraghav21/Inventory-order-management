import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <div className="shrink-0 w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={() => { onConfirm(); onClose() }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}
