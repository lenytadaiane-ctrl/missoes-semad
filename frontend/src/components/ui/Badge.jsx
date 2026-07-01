const colors = {
  ATIVO: 'bg-green-100 text-green-800',
  AFASTADO: 'bg-yellow-100 text-yellow-800',
  INATIVO: 'bg-red-100 text-red-800',
  CAPITAL: 'bg-blue-100 text-blue-800',
  INTERIOR: 'bg-purple-100 text-purple-800',
  default: 'bg-gray-100 text-gray-800',
};

export default function Badge({ text }) {
  const cls = colors[text] || colors.default;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{text}</span>;
}
