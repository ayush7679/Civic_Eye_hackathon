export default function SeverityBadge({ score, size = 'md' }) {
  const num = Number(score);

  const getConfig = () => {
    if (num <= 3) return {
      label: 'Low',
      color: 'text-green-400',
      bg: 'bg-green-500/15',
      border: 'border-green-500/30',
      dot: 'bg-green-400',
      bar: 'bg-green-500',
    };
    if (num <= 7) return {
      label: 'Moderate',
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
      bar: 'bg-amber-500',
    };
    return {
      label: 'Critical',
      color: 'text-red-400',
      bg: 'bg-red-500/15',
      border: 'border-red-500/30',
      dot: 'bg-red-400',
      bar: 'bg-red-500',
    };
  };

  const cfg = getConfig();
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-mono font-medium ${cfg.bg} ${cfg.border} ${cfg.color} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {score}/10 · {cfg.label}
    </span>
  );
}

export function SeverityDot({ score }) {
  const num = Number(score);
  if (num <= 3) return <span className="w-3 h-3 rounded-full bg-green-400 inline-block shadow-[0_0_6px_rgba(34,197,94,0.6)]" />;
  if (num <= 7) return <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(245,158,11,0.6)]" />;
  return <span className="w-3 h-3 rounded-full bg-red-400 inline-block shadow-[0_0_6px_rgba(239,68,68,0.6)]" />;
}

export function SeverityBar({ score }) {
  const pct = (Number(score) / 10) * 100;
  const color = Number(score) <= 3 ? '#22c55e' : Number(score) <= 7 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function getSeverityColor(score) {
  const num = Number(score);
  if (num <= 3) return '#22c55e';
  if (num <= 7) return '#f59e0b';
  return '#ef4444';
}
