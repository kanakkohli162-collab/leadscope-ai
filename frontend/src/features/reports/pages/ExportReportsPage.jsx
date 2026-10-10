import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { recentExports } from '@/mocks'

const columns = [
  'Business Name', 'Location', 'Category', 'Phone', 'Website',
  'Rating', 'Lead Score', 'Service Gap', 'Priority', 'Lead Status'
]

export default function ExportReportsPage() {
  const [selectedCols, setSelectedCols] = useState(columns.slice(0, 7))
  const [format, setFormat] = useState('excel')

  const toggleCol = (col) => {
    setSelectedCols(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Export Reports</h1>
        <p className="text-sm text-slate-500 mt-1">Download your lead data in Excel or PDF format</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Select Columns */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Select Data & Columns</h3>
          
          <div className="space-y-2 mb-6">
            {columns.map(col => (
              <label key={col} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCols.includes(col)}
                  onChange={() => toggleCol(col)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{col}</span>
              </label>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Format</label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('excel')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  format === 'excel'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet size={16} />
                Excel (.xlsx)
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  format === 'pdf'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={16} />
                PDF (.pdf)
              </button>
            </div>
          </div>

          <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
            <Download size={18} />
            Generate Report
          </button>
        </div>

        {/* Recent Exports */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Exports</h3>
          <div className="space-y-3">
            {recentExports.map(exp => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    exp.type === 'Excel' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {exp.type === 'Excel' ? <FileSpreadsheet size={18} /> : <FileText size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{exp.filename}</p>
                    <p className="text-xs text-slate-500">{exp.type} • {exp.date}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary-600 transition-colors">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
