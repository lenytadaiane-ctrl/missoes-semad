const VARIANTS = {
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  gray:   'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-800',
};

export default function Badge({ label, color = 'gray' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[color] ?? VARIANTS.gray}`}>
      {label}
    </span>
  );
}

export function StatusMissionarioBadge({ status }) {
  const map = { ATIVO: ['Ativo', 'green'], INATIVO: ['Inativo', 'red'], AFASTADO: ['Afastado', 'yellow'] };
  const [label, color] = map[status] ?? [status, 'gray'];
  return <Badge label={label} color={color} />;
}

export function TipoLocalBadge({ tipo }) {
  return <Badge label={tipo === 'CAPITAL' ? 'Capital' : 'Interior'} color={tipo === 'CAPITAL' ? 'blue' : 'orange'} />;
}
