import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '../../api/ordersApi'
import { productsApi } from '../../api/productsApi'
import { customersApi } from '../../api/customersApi'
import Modal from '../common/Modal'
import ConfirmDialog from '../common/ConfirmDialog'
import StatusBadge from '../common/StatusBadge'
import { Plus, Trash2, ShoppingCart, Eye, ChevronDown, X, Clock, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function Orders() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [updateTarget, setUpdateTarget] = useState(null)

  // Create order form state
  const [customerId, setCustomerId] = useState('')
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }])
  const [notes, setNotes] = useState('')
  const [formErrors, setFormErrors] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => ordersApi.getAll({ status: statusFilter || undefined }),
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => productsApi.getAll({ limit: 500 }),
  })

  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => customersApi.getAll({ limit: 500 }),
  })

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      qc.invalidateQueries(['orders'])
      qc.invalidateQueries(['products'])
      qc.invalidateQueries(['dashboard-stats'])
      toast.success('Order created! Stock updated.')
      setCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ordersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['orders'])
      qc.invalidateQueries(['products'])
      toast.success('Order status updated')
      setUpdateTarget(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => { qc.invalidateQueries(['orders']); toast.success('Order deleted') },
  })

  const resetForm = () => {
    setCustomerId('')
    setOrderItems([{ product_id: '', quantity: 1 }])
    setNotes('')
    setFormErrors({})
  }

  const addItem = () => setOrderItems([...orderItems, { product_id: '', quantity: 1 }])
  const removeItem = (idx) => setOrderItems(orderItems.filter((_, i) => i !== idx))
  const updateItem = (idx, field, value) => {
    const updated = [...orderItems]
    updated[idx] = { ...updated[idx], [field]: value }
    setOrderItems(updated)
  }

  const validate = () => {
    const e = {}
    if (!customerId) e.customer = 'Select a customer'
    const validItems = orderItems.filter(i => i.product_id && i.quantity > 0)
    if (!validItems.length) e.items = 'Add at least one product'
    setFormErrors(e)
    return !Object.keys(e).length
  }

  const handleCreate = (ev) => {
    ev.preventDefault()
    if (!validate()) return
    const items = orderItems.filter(i => i.product_id).map(i => ({
      product_id: Number(i.product_id),
      quantity: Number(i.quantity)
    }))
    createMutation.mutate({ customer_id: Number(customerId), items, notes })
  }

  const products = productsData?.items || []
  const customers = customersData?.items || []
  const orders = data?.items || []
  const total = data?.total || 0

  const getProductById = (id) => products.find(p => p.id === Number(id))

  const calcOrderPreview = () => {
    return orderItems.reduce((sum, item) => {
      const p = getProductById(item.product_id)
      if (p && item.quantity > 0) return sum + Number(p.price) * Number(item.quantity)
      return sum
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-tight">Sales Orders</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-wider">
            {total} transaction{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button className="btn-primary shrink-0" onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap bg-slate-950/20 p-2 rounded-2xl border border-slate-900/60 backdrop-blur-sm w-fit animate-fade-in-up delay-75">
        <button
          onClick={() => setStatusFilter('')}
          className={clsx(
            'px-4 py-2 rounded-xl text-xs font-bold transition-all',
            !statusFilter 
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20 shadow-md shadow-brand-500/5' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
          )}
        >
          All Transactions
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? '' : s)}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all border',
              statusFilter === s
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/20 shadow-md shadow-brand-500/5'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border-transparent'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="card !p-0 overflow-hidden animate-fade-in-up delay-150">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40">
                <th className="th">Order ID</th>
                <th className="th">Customer Name</th>
                <th className="th">Cart Size</th>
                <th className="th">Total Amount</th>
                <th className="th">Status</th>
                <th className="th">Transaction Date</th>
                <th className="th w-32 text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="td text-center py-16 text-slate-500 font-medium">
                    <span className="inline-block animate-pulse">Syncing orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="td text-center py-16">
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                      <ShoppingCart size={20} className="text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No orders found</p>
                    <p className="text-xs text-slate-600 mt-1">Register products and place a new purchase order.</p>
                  </td>
                </tr>
              ) : orders.map(o => (
                <tr key={o.id} className="table-row">
                  <td className="td">
                    <span className="font-mono text-xs bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-brand-300 font-bold">
                      #{String(o.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td className="td font-bold text-slate-200">{o.customer_name || `Customer #${o.customer_id}`}</td>
                  <td className="td font-semibold text-slate-400">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                  <td className="td font-bold text-emerald-400">
                    ₹{Number(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td text-slate-500 text-xs font-semibold">
                    {format(new Date(o.created_at), 'dd MMM yyyy, HH:mm')}
                  </td>
                  <td className="td pr-8">
                    <div className="flex gap-2.5 justify-end">
                      <button 
                        onClick={() => setDetailOrder(o)} 
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all hover:scale-105 active:scale-95"
                        title="View invoice details"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => setUpdateTarget(o)}
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-yellow-450 hover:border-yellow-500/30 transition-all hover:scale-105 active:scale-95"
                        title="Update transaction status"
                      >
                        <ChevronDown size={13} />
                      </button>
                      <button 
                        onClick={() => setDeleteTarget(o)} 
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-all hover:scale-105 active:scale-95"
                        title="Remove order record"
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

      {/* Create Order Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Place New Purchase Order" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="label">Client Customer *</label>
            <select className="input cursor-pointer" value={customerId} onChange={e => setCustomerId(e.target.value)}>
              <option value="">Select consumer profile...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
            </select>
            {formErrors.customer && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{formErrors.customer}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label !mb-0">Selected Items *</label>
              <button 
                type="button" 
                onClick={addItem} 
                className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg"
              >
                <Plus size={11} /> Add Item Line
              </button>
            </div>
            
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {orderItems.map((item, idx) => {
                const selectedProduct = getProductById(item.product_id)
                return (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <select
                      className="input flex-1 cursor-pointer"
                      value={item.product_id}
                      onChange={e => updateItem(idx, 'product_id', e.target.value)}
                    >
                      <option value="">Choose item SKU...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock === 0}>
                          {p.name} ({p.sku}) — Stock: {p.stock} — ₹{p.price}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="number" min="1"
                      className="input w-24"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                    />
                    
                    {selectedProduct && (
                      <span className="text-xs font-bold text-emerald-400 pt-3.5 whitespace-nowrap min-w-[70px] text-right">
                        ₹{(Number(selectedProduct.price) * Number(item.quantity || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    
                    {orderItems.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)} 
                        className="text-slate-500 hover:text-red-400 transition-colors pt-3"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {formErrors.items && <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mt-1">{formErrors.items}</p>}
          </div>

          {calcOrderPreview() > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-3.5 flex justify-between items-center shadow-inner">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Invoice Total</span>
              <span className="text-xl font-bold text-emerald-400">
                ₹{calcOrderPreview().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div>
            <label className="label">Internal Notes / Delivery Instruction</label>
            <textarea 
              className="input resize-none" 
              rows={2} 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Optional notes regarding delivery, packaging, or tracking details..." 
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-900">
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Logging Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal 
        isOpen={!!detailOrder} 
        onClose={() => setDetailOrder(null)} 
        title={`Purchase Invoice #${String(detailOrder?.id || '').padStart(4, '0')}`} 
        size="lg"
      >
        {detailOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-5 text-sm p-4 bg-slate-900 rounded-2xl border border-slate-800/80 shadow-inner">
              <div>
                <p className="label">Client Account</p>
                <p className="text-white font-bold">{detailOrder.customer_name}</p>
              </div>
              <div>
                <p className="label">Transaction Status</p>
                <div className="pt-0.5"><StatusBadge status={detailOrder.status} /></div>
              </div>
              <div>
                <p className="label">Invoice Date</p>
                <p className="text-slate-300 font-semibold">{format(new Date(detailOrder.created_at), 'dd MMMM yyyy, HH:mm')}</p>
              </div>
              <div>
                <p className="label">Settled Amount</p>
                <p className="text-emerald-400 font-bold text-lg">
                  ₹{Number(detailOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            {detailOrder.notes && (
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl">
                <p className="label">Delivery/Internal Notes</p>
                <p className="text-slate-300 text-xs leading-relaxed mt-1 font-semibold">{detailOrder.notes}</p>
              </div>
            )}
            
            <div>
              <p className="label mb-3">Itemized Cart Receipt</p>
              <div className="border border-slate-900 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Product SKU</th>
                        <th className="px-4 py-3 text-center">Quantity</th>
                        <th className="px-4 py-3 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailOrder.items.map(item => (
                        <tr key={item.id} className="border-b border-slate-900/40 last:border-0 hover:bg-slate-900/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-white font-bold">{item.product_name}</p>
                            <p className="text-[10px] text-brand-400 font-mono mt-0.5 font-bold">{item.product_sku}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-200 font-bold">×{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-400 font-semibold">₹{Number(item.unit_price).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-emerald-400 font-bold">₹{(item.quantity * Number(item.unit_price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal isOpen={!!updateTarget} onClose={() => setUpdateTarget(null)} title="Update Order Status" size="sm">
        {updateTarget && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center text-xs text-slate-400 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <Clock size={13} className="text-brand-400" />
              <span>Order</span>
              <span className="text-white font-mono font-bold">#{String(updateTarget.id).padStart(4, '0')}</span>
              <span>— current:</span>
              <StatusBadge status={updateTarget.status} />
            </div>
            
            <div className="grid grid-cols-1 gap-2 pt-1.5">
              {STATUSES.map(s => {
                const colors = {
                  pending: 'hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30',
                  confirmed: 'hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30',
                  shipped: 'hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30',
                  delivered: 'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30',
                  cancelled: 'hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30',
                }
                return (
                  <button
                    key={s}
                    onClick={() => updateMutation.mutate({ id: updateTarget.id, data: { status: s } })}
                    disabled={s === updateTarget.status}
                    className={clsx(
                      'px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all text-left border border-transparent flex items-center justify-between',
                      s === updateTarget.status 
                        ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed' 
                        : clsx('bg-slate-900 border-slate-800 text-slate-300 hover:-translate-y-0.5 active:translate-y-0 shadow-sm', colors[s])
                    )}
                  >
                    <span>{s}</span>
                    {s === updateTarget.status && <span className="text-[10px] uppercase font-bold text-slate-650 tracking-wider">Current</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Remove Order Record"
        message={`Are you sure you want to permanently delete purchase invoice #${String(deleteTarget?.id || '').padStart(4, '0')}? This transaction will be lost, and inventory counts will not be recovered automatically.`}
      />
    </div>
  )
}
