import { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard, Search, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Wrench, Loader2, Filter, ChevronUp, ChevronDown,
  Database, Image as ImageIcon, Tag, Calendar,
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import { getReports, updateVerification, updateStatus, getImageUrl } from '../services/api';

const CATEGORIES = ['all', 'Road Damage', 'Garbage', 'Water Leakage', 'Street Light', 'Traffic Issue', 'Other'];

function ActionButton({ onClick, loading, icon: Icon, label, variant = 'info' }) {
  const variantClass = {
    success: 'btn-success',
    danger:  'btn-danger',
    warning: 'btn-warning',
    info:    'btn-info',
  }[variant];

  return (
    <button onClick={onClick} disabled={loading} className={`${variantClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatusChip({ status }) {
  const map = {
    pending:     { label: 'Pending',     cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
    in_progress: { label: 'In Progress', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    verified:    { label: 'Verified',    cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
    rejected:    { label: 'Rejected',    cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
    fixed:       { label: 'Fixed',       cls: 'bg-teal-500/15 text-teal-400 border-teal-500/25' },
    // legacy
    broken:      { label: 'Reported',    cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
    repaired:    { label: 'Repaired',    cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
  };
  const cfg = map[status] || { label: status, cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' };
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function VerificationChip({ verification }) {
  const map = {
    verified:   { label: 'Verified',   cls: 'bg-green-500/15 text-green-400 border-green-500/25' },
    rejected:   { label: 'Rejected',   cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
    unverified: { label: 'Unverified', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  };
  const cfg = map[verification] || map.unverified;
  return (
    <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function SortIcon({ col, sortConfig }) {
  if (sortConfig.key !== col) return <span className="w-3 h-3 opacity-20"><ChevronUp size={12} /></span>;
  return sortConfig.dir === 'asc' ? <ChevronUp size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />;
}

/** Thumbnail with fallback */
function ReportThumbnail({ report }) {
  const [err, setErr] = useState(false);
  const url = getImageUrl(report.image_path);

  if (!url || err) {
    return (
      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
        <ImageIcon size={16} className="text-slate-600" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={report.title}
      onError={() => setErr(true)}
      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-white/10"
    />
  );
}

/** Inline status change dropdown */
function StatusSelect({ reportId, current, onChange }) {
  const statuses = [
    { value: 'pending',     label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'fixed',       label: 'Fixed' },
  ];
  return (
    <select
      value={current}
      onChange={(e) => onChange(reportId, e.target.value)}
      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 transition"
    >
      {statuses.map(s => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerif, setFilterVerif] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'id', dir: 'desc' });
  const [actionLoading, setActionLoading] = useState({});

  const load = () => {
    setLoading(true);
    setError(null);
    getReports()
      .then(setReports)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setAction = (id, key, val) =>
    setActionLoading(p => ({ ...p, [`${id}_${key}`]: val }));

  const handleVerify = async (id, status) => {
    setAction(id, 'verif', true);
    try {
      await updateVerification(id, status);
      setReports(prev => prev.map(r => r.id === id ? { ...r, verification: status } : r));
    } catch {}
    finally { setAction(id, 'verif', false); }
  };

  const handleStatus = async (id, status) => {
    setAction(id, 'status', true);
    try {
      await updateStatus(id, status);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch {}
    finally { setAction(id, 'status', false); }
  };

  const toggleSort = (key) => {
    setSortConfig(p => ({ key, dir: p.key === key && p.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const filtered = useMemo(() => {
    let data = [...reports];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        String(r.id).includes(q) ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.damage_type || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') data = data.filter(r => r.status === filterStatus);
    if (filterVerif !== 'all') data = data.filter(r => r.verification === filterVerif);
    if (filterCategory !== 'all') data = data.filter(r => r.category === filterCategory);

    data.sort((a, b) => {
      let av = a[sortConfig.key], bv = b[sortConfig.key];
      if (sortConfig.key === 'severity_scale') { av = Number(av); bv = Number(bv); }
      if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [reports, search, filterStatus, filterVerif, filterCategory, sortConfig]);

  const stats = {
    total:    reports.length,
    verified: reports.filter(r => r.verification === 'verified').length,
    critical: reports.filter(r => Number(r.severity_scale) >= 8).length,
    fixed:    reports.filter(r => r.status === 'fixed').length,
  };

  const thClass = "px-4 py-3 text-left text-xs font-mono font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 select-none";
  const hasFilters = search || filterStatus !== 'all' || filterVerif !== 'all' || filterCategory !== 'all';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="animate-fade-up flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="section-label mb-2">Administration</p>
            <h1 className="font-display font-extrabold text-4xl text-white">
              Reports Dashboard
            </h1>
          </div>
          <button onClick={load} disabled={loading} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Mini stats */}
        <div className="animate-fade-up animate-delay-100 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',    val: stats.total,    color: 'text-blue-400' },
            { label: 'Verified', val: stats.verified,  color: 'text-green-400' },
            { label: 'Critical', val: stats.critical,  color: 'text-red-400' },
            { label: 'Fixed',    val: stats.fixed,     color: 'text-teal-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <p className={`text-2xl font-display font-bold ${color}`}>{loading ? '—' : val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="animate-fade-up animate-delay-200 card mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search title, category, description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          {hasFilters && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <Filter size={12} />
              Showing {filtered.length} of {reports.length} reports
              <button
                onClick={() => { setSearch(''); setFilterStatus('all'); setFilterVerif('all'); setFilterCategory('all'); }}
                className="text-blue-400 hover:text-blue-300 underline ml-1"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2 text-sm">
            <AlertTriangle size={16} />
            {error}
            <button onClick={load} className="ml-auto underline hover:text-white">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="animate-fade-up animate-delay-300 glass rounded-2xl overflow-hidden">
          {loading && reports.length === 0 ? (
            <div className="p-16 text-center">
              <Loader2 size={32} className="animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-slate-400 font-display">Loading reports...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Database size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 font-display">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-white/8">
                  <tr>
                    {[
                      { key: 'id',             label: 'Report' },
                      { key: 'category',       label: 'Category' },
                      { key: 'severity_scale', label: 'Severity' },
                      { key: 'verification',   label: 'Verification' },
                      { key: 'status',         label: 'Status' },
                      { key: 'createdAt',      label: 'Date' },
                    ].map(({ key, label }) => (
                      <th key={key} className={thClass} onClick={() => toggleSort(key)}>
                        <span className="flex items-center gap-1.5">
                          {label}
                          <SortIcon col={key} sortConfig={sortConfig} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((r, idx) => (
                    <tr
                      key={r.id}
                      className="hover:bg-white/4 transition-colors group"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* Report (thumbnail + title) */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ReportThumbnail report={r} />
                          <div>
                            <span className="font-mono text-xs text-slate-500 block">
                              #{String(r.id).padStart(4, '0')}
                            </span>
                            <p className="font-display font-semibold text-white text-sm max-w-[140px] truncate">
                              {r.title || r.damage_type || 'Untitled'}
                            </p>
                            {r.description && (
                              <p className="text-xs text-slate-500 mt-0.5 max-w-[140px] truncate">{r.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Tag size={11} className="text-slate-500" />
                          <span className="text-xs text-slate-300">{r.category || r.damage_type || '—'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <SeverityBadge score={r.severity_scale} size="sm" />
                      </td>

                      <td className="px-4 py-4">
                        <VerificationChip verification={r.verification} />
                      </td>

                      {/* Inline status change */}
                      <td className="px-4 py-4">
                        <StatusSelect
                          reportId={r.id}
                          current={r.status}
                          onChange={handleStatus}
                        />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                          <Calendar size={11} />
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </td>

                      {/* Verification actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {r.verification !== 'verified' && (
                            <ActionButton
                              onClick={() => handleVerify(r.id, 'verified')}
                              loading={actionLoading[`${r.id}_verif`]}
                              icon={CheckCircle}
                              label="Verify"
                              variant="success"
                            />
                          )}
                          {r.verification !== 'rejected' && (
                            <ActionButton
                              onClick={() => handleVerify(r.id, 'rejected')}
                              loading={actionLoading[`${r.id}_verif`]}
                              icon={XCircle}
                              label="Reject"
                              variant="danger"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-6 font-mono">
          {filtered.length} records — CivicEye Admin v2.0
        </p>
      </div>
    </div>
  );
}
