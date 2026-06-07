import { MapPin, Calendar, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import SeverityBadge, { SeverityBar } from './SeverityBadge';

function VerificationChip({ status }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
      <CheckCircle size={10} /> Verified
    </span>
  );
  if (status === 'rejected') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
      <XCircle size={10} /> Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20">
      <AlertTriangle size={10} /> Unverified
    </span>
  );
}

function StatusChip({ status }) {
  const map = {
    broken:      { label: 'Reported',    cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    in_progress: { label: 'In Progress', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    repaired:    { label: 'Repaired',    cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  };
  const cfg = map[status] || { label: status, cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function ReportCard({ report, delay = 0 }) {
  const {
    id, damage_type, severity_scale, description, status,
    verification, gps_x, gps_y, estimated_time, createdAt
  } = report;

  return (
    <div
      className="animate-fade-up card hover:bg-white/8 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="section-label">#{String(id).padStart(4, '0')}</span>
          <h3 className="text-lg font-display font-semibold text-white mt-0.5 group-hover:text-blue-200 transition-colors">
            {damage_type}
          </h3>
        </div>
        <SeverityBadge score={severity_scale} size="sm" />
      </div>

      {/* Severity bar */}
      <div className="mb-4">
        <SeverityBar score={severity_scale} />
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
          {description}
        </p>
      )}

      {/* Meta */}
      <div className="space-y-2 mb-4">
        {(gps_x || gps_y) && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={12} className="text-blue-400/70" />
            <span className="font-mono">{Number(gps_x).toFixed(4)}, {Number(gps_y).toFixed(4)}</span>
          </div>
        )}
        {estimated_time && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} className="text-amber-400/70" />
            <span>Est. repair: {estimated_time}</span>
          </div>
        )}
        {createdAt && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={12} className="text-slate-400/70" />
            <span>{new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <VerificationChip status={verification} />
        <StatusChip status={status} />
      </div>
    </div>
  );
}
