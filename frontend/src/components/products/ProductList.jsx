import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../../api/productsApi'
import Modal from '../common/Modal'
import ConfirmDialog from '../common/ConfirmDialog'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const EMPTY_FORM = { name: '', sku: '', description: '', price: '', stock: '', category: '' }

export default function Products() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [modal, setModal] = useState({ open: false, product: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => productsApi.getAll({ search, category }),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: productsApi.getCategories,
  })

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product created!'); closeModal() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product updated!'); closeModal() },
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product deleted') },
  })

  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setModal({ open: true, product: null }) }
  const openEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, description: p.description || '', price: p.price, stock: p.stock, category: p.category || '' })
    setErrors({})
    setModal({ open: true, product: p })
  }
  const closeModal = () => setModal({ open: false, product: null })

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.sku.trim()) e.sku = 'Required'
    if (!form.price || Number(form.price) < 0) e.price = 'Must be ≥ 0'
    if (form.stock === '' || Number(form.stock) < 0) e.stock = 'Must be ≥ 0'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) }
    if (modal.product) updateMutation.mutate({ id: modal.product.id, data: payload })
    else createMutation.mutate(payload)
  }

  const products = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">Products Catalog</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">
            {total} product{total !== 1 ? 's' : ''} in system
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={openCreate}>
          <Plus size={16} /> Add New SKU
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap bg-slate-950/20 p-4 rounded-2xl border border-slate-900/60 backdrop-blur-sm animate-fade-in-up delay-75">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            className="input pl-10" 
            placeholder="Search SKUs, names, or barcodes..." 
            value={search}
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select 
          className="input w-52 appearance-none cursor-pointer" 
          value={category} 
          onChange={e => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table Card */}
      <div className="card !p-0 overflow-hidden animate-fade-in-up delay-150">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40">
                <th className="th">Product Detail</th>
                <th className="th">SKU Code</th>
                <th className="th">Category</th>
                <th className="th">Retail Price</th>
                <th className="th">Stock Level</th>
                <th className="th">Last Updated</th>
                <th className="th w-28 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="td text-center py-16 text-slate-500 font-medium">
                    <span className="inline-block animate-pulse">Syncing catalog...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td text-center py-16">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                      <Package size={20} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No products found</p>
                    <p className="text-xs text-slate-600 mt-1">Try resetting search filters or register a new SKU code.</p>
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="td">
                    <div className="font-bold text-white tracking-wide">{p.name}</div>
                    {p.description && <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{p.description}</div>}
                  </td>
                  <td className="td">
                    <span className="font-mono text-xs bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg text-brand-300 font-bold">
                      {p.sku}
                    </span>
                  </td>
                  <td className="td font-semibold text-slate-400">{p.category || 'Uncategorized'}</td>
                  <td className="td font-bold text-emerald-400">
                    ₹{Number(p.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="td">
                    {/* Visual stock bar meters */}
                    <div className="flex flex-col gap-1.5 w-24">
                      <span className={clsx(
                        'text-xs font-bold flex items-center gap-1',
                        p.stock <= 10 ? 'text-red-400' : p.stock <= 30 ? 'text-amber-400' : 'text-slate-300'
                      )}>
                        {p.stock <= 10 && <AlertTriangle size={11} className="shrink-0" />}
                        {p.stock} units
                      </span>
                      <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            'h-full rounded-full transition-all duration-300',
                            p.stock <= 10 ? 'bg-gradient-to-r from-red-500 to-rose-400' : p.stock <= 30 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          )} 
                          style={{ width: `${Math.max(0, Math.min(100, (p.stock / 80) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="td text-slate-500 text-xs font-medium">
                    {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </td>
                  <td className="td pr-8">
                    <div className="flex gap-2.5 justify-end">
                      <button 
                        onClick={() => openEdit(p)} 
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(p)} 
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

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={modal.open} 
        onClose={closeModal}
        title={modal.product ? 'Modify Catalog SKU' : 'Register New SKU'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input 
                className="input" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="e.g. Logitech MX Master 3S" 
              />
              {errors.name && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="label">SKU Code *</label>
              <input 
                className="input font-mono text-brand-300" 
                value={form.sku} 
                onChange={e => setForm({...form, sku: e.target.value})} 
                placeholder="e.g. LOGI-MX3S" 
                disabled={!!modal.product} 
              />
              {errors.sku && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.sku}</p>}
            </div>
            
            <div>
              <label className="label">Product Category</label>
              <input 
                className="input" 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})} 
                placeholder="e.g. Electronics" 
              />
            </div>
            
            <div>
              <label className="label">Retail Price (₹) *</label>
              <input 
                className="input" 
                type="number" 
                min="0" 
                step="0.01" 
                value={form.price} 
                onChange={e => setForm({...form, price: e.target.value})} 
              />
              {errors.price && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.price}</p>}
            </div>
            
            <div>
              <label className="label">Initial Stock *</label>
              <input 
                className="input" 
                type="number" 
                min="0" 
                value={form.stock} 
                onChange={e => setForm({...form, stock: e.target.value})} 
              />
              {errors.stock && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{errors.stock}</p>}
            </div>
            
            <div className="col-span-2">
              <label className="label">Detailed Description</label>
              <textarea 
                className="input resize-none" 
                rows={3} 
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})} 
                placeholder="Describe features, colors, warranty or package terms..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {modal.product ? 'Save Changes' : 'Register SKU'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Delete SKU Code"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All transaction records for this item will be affected.`}
      />
    </div>
  )
}
