function getVal(obj, key) {
  return key.split('.').reduce((acc, k) => acc?.[k], obj);
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

export default function Table({ columns, data = [], loading = false, emptyMessage = 'Nenhum registro encontrado.' }) {
  if (loading) return <Skeleton />;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14 text-center text-gray-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i} className="hover:bg-blue-50/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-gray-700 ${col.className || ''}`}>
                    {col.render ? col.render(getVal(row, col.key), row) : (getVal(row, col.key) ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
