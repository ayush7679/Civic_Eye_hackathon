export default function StatsCard({ icon: Icon, label, value, color = 'blue', trend, delay = 0 }) {
  const colorMap = {
    blue:   { icon: 'text-blue-400',  bg: 'bg-blue-500/10',  border: 'border-blue-500/20',  glow: 'shadow-blue-500/10' },
    green:  { icon: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', glow: 'shadow-green-500/10' },
    amber:  { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' },
    red:    { icon: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/20',   glow: 'shadow-red-500/10' },
    purple: { icon: 'text-purple-400',bg: 'bg-purple-500/10',border: 'border-purple-500/20',glow: 'shadow-purple-500/10' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`animate-fade-up card hover:bg-white/8 transition-all duration-300 hover:shadow-xl ${c.glow} group cursor-default`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.bg} border ${c.border}`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-display font-bold text-white tracking-tight group-hover:text-blue-100 transition-colors">
          {value ?? <span className="skeleton inline-block w-16 h-8 rounded" />}
        </p>
        <p className="text-sm text-slate-400 font-body">{label}</p>
      </div>
    </div>
  );
}
