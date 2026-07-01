export default function SortTh({ label, sortKey, current, dir, onSort }) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:bg-gray-100 transition-colors group"
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
          {active && dir === 'desc' ? '↓' : '↑'}
        </span>
      </span>
    </th>
  );
}
