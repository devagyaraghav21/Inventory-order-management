import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Menu, X, TrendingUp, Search, Bell
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products',  label: 'Products',  icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders',    label: 'Orders',    icon: ShoppingCart },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950 relative select-none">
      {/* Background Ambient Floating Blur Blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-brand-600/12 to-violet-600/8 blur-[130px] pointer-events-none animate-float-1 z-0" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-500/10 to-pink-500/6 blur-[130px] pointer-events-none animate-float-2 z-0" />
      <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-r from-emerald-500/6 to-teal-500/4 blur-[110px] pointer-events-none animate-float-1 z-0" />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-all duration-300"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-950/60 backdrop-blur-xl border-r border-slate-900/60',
        'flex flex-col transition-all duration-300 ease-out shadow-2xl lg:shadow-none',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-900/60 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-brand-400/20">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent tracking-wide leading-none">InventoFlow</p>
            <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">Control Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => clsx(
                'flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative group border border-transparent',
                isActive
                  ? 'bg-gradient-to-r from-brand-500/15 to-indigo-500/10 text-brand-300 border-brand-500/20 shadow-md shadow-brand-500/5'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/40 hover:border-slate-800/40'
              )}
            >
              {({ isActive }) => (
                <>
                  {/* Left Active Glow Indicator */}
                  <span className={clsx(
                    'absolute left-0 top-1/3 bottom-1/3 w-1 bg-gradient-to-b from-brand-500 to-indigo-500 rounded-r-full transition-all duration-300 scale-y-0',
                    isActive && 'scale-y-100'
                  )} />
                  <Icon size={18} className={clsx('transition-transform duration-300 group-hover:scale-110', isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200')} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="px-6 py-5 border-t border-slate-900/60 shrink-0 bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-semibold text-xs border border-slate-700">
              AD
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Dev Admin</p>
              <p className="text-[10px] text-slate-500">Super Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* Topbar */}
        <header className="h-16 bg-slate-950/20 backdrop-blur-md border-b border-slate-900/60 flex items-center px-6 gap-4 shrink-0 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            
            {/* Search Mock */}
            <div className="flex-1 max-w-xs relative hidden md:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="bg-slate-900/40 border border-slate-800/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 w-full transition-all focus:ring-1 focus:ring-brand-500/20" placeholder="Quick search..." />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connectivity Badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              API Connected
            </div>

            {/* Notification Mock */}
            <button className="relative w-8 h-8 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
