import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, change, icon: Icon, color = 'blue' }) {
  const isPositive = change?.startsWith('+')
  
  const colorMap = {
    blue: 'bg-primary-50 text-primary-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
