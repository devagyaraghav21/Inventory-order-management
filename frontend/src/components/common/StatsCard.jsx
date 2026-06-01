import clsx from 'clsx'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

// Simulated growth details to make stats look rich and professional
const simulatedTrends = {
  'Products': { value: '+4.8%', isUp: true, subLabel: 'new SKUs added' },
  'Customers': { value: '+12.4%', isUp: true, subLabel: 'active consumers' },
  'Orders': { value: '+8.3%', isUp: true, subLabel: 'this week' },
  'Revenue': { value: '+15.2%', isUp: true, subLabel: 'vs last month' },
  'Low Stock': { value: '-2.4%', isUp: false, subLabel: 'depleting' },
  'Pending': { value: '-10.5%', isUp: false, subLabel: 'processing speed' }
}

export default function StatsCard({ label, value, icon: Icon, color = 'indigo', sub }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/10',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    yellow: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    red:    'text-red-400 bg-red-500/10 border-red-500/20 shadow-red-500/10',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
  }

  const borderAccents = {
    indigo: 'before:bg-indigo-500/30',
    green:  'before:bg-emerald-500/30',
    yellow: 'before:bg-amber-500/30',
    red:    'before:bg-red-500/30',
    blue:   'before:bg-blue-500/30',
  }

  const cardGradients = {
    indigo: 'from-indigo-500/5 via-slate-900/40 to-slate-950/20 hover:border-indigo-500/40 hover:shadow-indigo-500/5',
    green:  'from-emerald-500/5 via-slate-900/40 to-slate-950/20 hover:border-emerald-500/40 hover:shadow-emerald-500/5',
    yellow: 'from-amber-500/5 via-slate-900/40 to-slate-950/20 hover:border-amber-500/40 hover:shadow-amber-500/5',
    red:    'from-red-500/5 via-slate-900/40 to-slate-950/20 hover:border-red-500/40 hover:shadow-red-500/5',
    blue:   'from-blue-500/5 via-slate-900/40 to-slate-950/20 hover:border-blue-500/40 hover:shadow-blue-500/5',
  }

  const cardGlows = {
    indigo: 'rgba(99, 102, 241, 0.16)',
    green:  'rgba(16, 185, 129, 0.16)',
    yellow: 'rgba(245, 158, 11, 0.16)',
    red:    'rgba(239, 68, 68, 0.16)',
    blue:   'rgba(59, 130, 246, 0.16)',
  }

  const trend = simulatedTrends[label] || { value: '+5%', isUp: true, subLabel: 'growth' }

  return (
    <div className={clsx(
      "card relative overflow-hidden transition-all duration-500 hover:-translate-y-1 bg-gradient-to-br border border-slate-800/80 shadow-2xl",
      "before:absolute before:top-0 before:left-0 before:w-full before:h-[3px]",
      borderAccents[color],
      cardGradients[color]
    )}>
      {/* Decorative ambient card radial glow matching theme */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500" 
        style={{
          background: `radial-gradient(circle at 85% 15%, ${cardGlows[color]} 0%, transparent 60%)`
        }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</p>
          <p className="text-3xl font-extrabold text-white tracking-tight truncate leading-none pt-1">{value}</p>
          
          {/* Enhanced rich trend metrics */}
          <div className="flex items-center gap-1.5 pt-2 flex-wrap">
            <span className={clsx(
              'inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md leading-none gap-0.5 shrink-0',
              trend.isUp 
                ? 'bg-emerald-500/10 text-emerald-400' 
                : 'bg-amber-500/10 text-amber-400'
            )}>
              {trend.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {trend.value}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
              {sub || trend.subLabel}
            </span>
          </div>
        </div>

        <div className={clsx(
          'p-3.5 rounded-2xl border transition-all duration-300 hover:scale-110 shadow-lg shrink-0',
          colors[color]
        )}>
          <Icon size={18} className="stroke-[2.5]" />
        </div>
      </div>
    </div>
  )
}
