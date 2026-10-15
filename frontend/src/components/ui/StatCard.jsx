import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, change, icon: Icon, color = 'blue' }) {
  const isPositive = change?.startsWith('+')
  
  const colorMap = {
    blue: 'bg-primary-600/15 text-aqua',
    red: 'bg-red-500/10 text-red-400',
    amber: 'bg-amber-500/10 text-amber-300',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-aqua/15 text-aqua-light',
  }

  return (
    <div className="bg-card rounded-xl border border-line p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{change}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  )
}
