import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '../../api/customersApi'
import Modal from '../common/Modal'
import ConfirmDialog from '../common/ConfirmDialog'
import { Plus, Search, Edit2, Trash2, Users, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, customer: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => customersApi.getAll({ search }),
  })

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer added!'); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer updated!'); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => { qc.invalidateQueries(['customers']); toast.success('Customer removed') },
  })

  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setModal({ open: true, customer: null }) }
  const openEdit = (c) => {
    setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || '' })
    setErrors({})
    setModal({ open: true, customer: c })
  }
  const closeModal = () => setModal({ open: false, customer: null })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    if (modal.customer) updateMutation.mutate({ id: modal.customer.id, data: { name: form.name, phone: form.phone, address: form.address } })
    else createMutation.mutate(form)
  }

  const customers = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">Customer Database</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">
            {total} registered client{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={openCreate}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Filters / Search */}
      <div className="flex gap-4 flex-wrap bg-slate-950/20 p-4 rounded-2xl border border-slate-900/60 backdrop-blur-sm animate-fade-in-up delay-75">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            className="input pl-10" 
            placeholder="Search by full name, email address..." 
            value={search}
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="card !p-0 overflow-hidden animate-fade-in-up delay-150">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40">
                <th className="th">Customer Profile</th>
                <th className="th">Email Address</th>
                <th className="th">Phone Contact</th>
                <th className="th">Billing Address</th>
                <th className="th">Registration Date</th>
                <th className="th w-28 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="td text-center py-16 text-slate-500 font-medium">
                    <span className="inline-block animate-pulse">Syncing customer records...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td text-center py-16">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                      <Users size={20} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No customers registered</p>
                    <p className="text-xs text-slate-600 mt-1">Create client accounts before issuing purchase order invoices.</p>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="td">
                    <div className="flex items-center gap-3.5">
                      {/* Double-ring gradient avatar */}
                      <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-brand-500/25 ring-2 ring-brand-500/20">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-200 tracking-wide">{c.name}</span>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-2 text-slate-400 font-semibold">
                      <Mail size={12} className="text-brand-400 shrink-0" />
                      <span>{c.email}</span>
                    </div>
                  </td>
                  <td className="td">
                    {c.phone ? (
                      <div className="flex items-center gap-2 text-slate-400 font-semibold">
                        <Phone size={12} className="text-brand-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic text-xs font-medium">No contact</span>
                    )}
                  </td>
                  <td className="td max-w-xs truncate">
                    {c.address ? (
                      <div className="flex items-center gap-2 text-slate-400 font-semibold">
                        <MapPin size={12} className="text-brand-400 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 italic text-xs font-medium">No address</span>
                    )}
                  </td>
                  <td className="td text-slate-500 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} className="shrink-0 text-slate-600" />
                      <span>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                  </td>
                  <td className="td pr-8">
                    <div className="flex gap-2.5 justify-end">
                      <button 
                        onClick={() => openEdit(c)} 
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(c)} 
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Customer Modal */}
      <Modal 
        isOpen={modal.open} 
        onClose={closeModal}
        title={modal.customer ? 'Edit Client Record' : 'Register New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Client Name *</label>
            <input 
              className="input" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="e.g. Stephen Curry" 
            />
            {errors.name && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <label className="label">Email Address *</label>
            <input 
              className="input" 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="stephen@goldenstate.com" 
              disabled={!!modal.customer} 
            />
            {errors.email && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label className="label">Phone Contact</label>
            <input 
              className="input" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})} 
              placeholder="e.g. +91 99999 88888" 
            />
          </div>
          
          <div>
            <label className="label">Billing / Shipping Address</label>
            <textarea 
              className="input resize-none" 
              rows={2} 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})} 
              placeholder="Describe primary physical location, suite, apartment, state/country..."
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {modal.customer ? 'Save Changes' : 'Register Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Remove Customer Record"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}"? All associated transaction receipts will lose their customer profile context.`}
      />
    </div>
  )
}
