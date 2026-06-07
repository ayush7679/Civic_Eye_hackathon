import { useEffect, useState, useRef } from 'react';
import { MapPin, Loader2, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { getReports, getImageUrl } from '../services/api';
import { getSeverityColor } from '../components/SeverityBadge';

let L;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

function MapLegend() {
  return (
    <div className="absolute bottom-8 left-4 z-[1000] card p-4 text-sm space-y-2 w-44">
      <p className="section-label mb-2">Severity Legend</p>
      {[
        { color: '#22c55e', label: 'Low (1–3)' },
        { color: '#f59e0b', label: 'Moderate (4–7)' },
        { color: '#ef4444', label: 'Critical (8–10)' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
          <span className="text-slate-300">{label}</span>
        </div>
      ))}
    </div>
  );
}

function MapStats({ reports }) {
  const verifiedReports = reports.filter(r => String(r.verification).toLowerCase() === 'verified');
  const critical = verifiedReports.filter(r => Number(r.severity_scale) >= 8).length;
  const moderate = verifiedReports.filter(r => Number(r.severity_scale) >= 4 && Number(r.severity_scale) <= 7).length;
  const low      = verifiedReports.filter(r => Number(r.severity_scale) <= 3).length;

  return (
    <div className="absolute top-20 right-4 z-[1000] card p-4 space-y-3 w-44">
      <p className="section-label">Map Data</p>
      <div className="space-y-2">
        {[
          { label: 'Total',    val: verifiedReports.length, cls: 'text-white' },
          { label: 'Critical', val: critical,               cls: 'text-red-400' },
          { label: 'Moderate', val: moderate,               cls: 'text-amber-400' },
          { label: 'Low',      val: low,                    cls: 'text-green-400' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="flex justify-between items-center">
            <span className={`text-sm ${cls === 'text-white' ? 'text-slate-400' : cls}`}>{label}</span>
            <span className={`font-mono font-semibold ${cls}`}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBar({ filter, setFilter, onRefresh, loading }) {
  return (
    <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2">
      {[
        { key: 'all',      label: 'All',     color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
        { key: 'critical', label: 'Critical', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
        { key: 'moderate', label: 'Moderate', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
        { key: 'low',      label: 'Low',      color: 'text-green-400 bg-green-500/20 border-green-500/30' },
      ].map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => setFilter(key)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            filter === key ? color : 'bg-[#0a1628]/80 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
        >
          {label}
        </button>
      ))}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="mt-1 p-2 rounded-lg bg-[#0a1628]/80 border border-white/10 text-slate-400 hover:text-white transition-colors"
        title="Refresh"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}

function createMarkerIcon(color, severity) {
  if (!L) return null;
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:32px;height:32px">
        <div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:${color};border:2px solid rgba(255,255,255,0.3);
          transform:rotate(-45deg);position:absolute;top:0;left:2px;
          box-shadow:0 0 12px ${color}80;
        "></div>
        <div style="
          position:absolute;top:5px;left:9px;
          font-size:9px;font-weight:700;color:white;
          font-family:JetBrains Mono,monospace;
          line-height:1;
        ">${severity}</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function formatPopup(r) {
  const color = getSeverityColor(r.severity_scale);
  const verBg    = r.verification === 'verified' ? '#22c55e20' : r.verification === 'rejected' ? '#ef444420' : '#64748b20';
  const verColor = r.verification === 'verified' ? '#22c55e' : r.verification === 'rejected' ? '#ef4444' : '#94a3b8';

  const statusLabels = {
    pending: 'Pending', in_progress: 'In Progress',
    verified: 'Verified', rejected: 'Rejected', fixed: 'Fixed',
    broken: 'Reported', repaired: 'Repaired',
  };
  const statusLabel = statusLabels[r.status] || r.status;
  let imageUrl = getImageUrl(r.image_path);

  imageUrl = imageUrl.replaceAll("\\", "/");
  imageUrl = imageUrl.replace("/imageUploads", "");

  const imageSection = imageUrl ? `
    <img
      src="${imageUrl}"
      alt="Report image"
      style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:10px;border:1px solid rgba(255,255,255,0.1)"
    />
  ` : '';

  return `
    <div style="font-family:DM Sans,sans-serif;min-width:220px;max-width:280px">
      ${imageSection}
      <div style="margin-bottom:8px">
        <span style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#60a5fa;font-weight:500">#${String(r.id).padStart(4,'0')}</span>
        <h3 style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:white;margin:4px 0 0">${r.title || r.damage_type}</h3>
        ${r.category ? `<span style="font-size:10px;color:#64748b">${r.category}</span>` : ''}
      </div>

      <div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span style="font-size:11px;color:#94a3b8">Severity</span>
          <span style="font-family:JetBrains Mono,monospace;font-size:13px;font-weight:700;color:${color}">${r.severity_scale}/10</span>
        </div>
        <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${(r.severity_scale/10)*100}%;background:${color};border-radius:2px"></div>
        </div>
      </div>

      ${r.description ? `<p style="font-size:12px;color:#94a3b8;line-height:1.5;margin-bottom:10px">${r.description}</p>` : ''}

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-size:10px;padding:3px 8px;border-radius:20px;background:${verBg};color:${verColor};border:1px solid ${verColor}30">${r.verification}</span>
        <span style="font-size:10px;padding:3px 8px;border-radius:20px;background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.1)">${statusLabel}</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;margin-top:4px">
        ${r.gps_x && r.gps_y ? `<div style="font-size:10px;color:#475569;font-family:monospace">📍 ${Number(r.gps_x).toFixed(5)}, ${Number(r.gps_y).toFixed(5)}</div>` : ''}
        ${r.estimated_time ? `<div style="font-size:11px;color:#f59e0b">⏱ Repair: ${r.estimated_time}</div>` : ''}
        ${r.createdAt ? `<div style="font-size:10px;color:#475569">📅 ${new Date(r.createdAt).toLocaleDateString()}</div>` : ''}
      </div>
    </div>
  `;
}

export default function Map() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadReports = () => {
    setLoading(true);
    setError(null);
    // Exclude fixed reports from the map (backend filter)
    getReports({ exclude_fixed: true })
      .then(setReports)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  // Init map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    import('leaflet').then(leaflet => {
      L = leaflet.default;
      const map = L.map(mapRef.current, {
        center: [27.7172, 85.3240],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const tryUpdate = () => {
      if (!L) { setTimeout(tryUpdate, 100); return; }

      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Only show verified reports; fixed already excluded at API level
      const visible = reports.filter(r => {
        if (r.verification !== 'verified') return false;
        const s = Number(r.severity_scale);
        if (filter === 'critical') return s >= 8;
        if (filter === 'moderate') return s >= 4 && s <= 7;
        if (filter === 'low') return s <= 3;
        return true;
      });

      visible.forEach(r => {
        if (!r.gps_x || !r.gps_y) return;
        const color = getSeverityColor(r.severity_scale);
        const icon = createMarkerIcon(color, r.severity_scale);
        const marker = L.marker([Number(r.gps_x), Number(r.gps_y)], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(formatPopup(r), { maxWidth: 300, className: 'civic-popup' });
        markersRef.current.push(marker);
      });

      if (visible.length > 0 && markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    };
    tryUpdate();
  }, [reports, filter]);

  return (
    <div className="min-h-screen pt-16">
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label mb-2">Interactive Map</p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">
              Damage Reports Map
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {loading && <Loader2 size={18} className="animate-spin text-blue-400" />}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Layers size={14} className="text-blue-400" />
              {reports.length} active reports
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 lg:mx-8 mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
          <button onClick={loadReports} className="ml-auto text-red-300 hover:text-white underline">Retry</button>
        </div>
      )}

      <div className="relative mx-4 sm:mx-6 lg:mx-8 mb-8" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        <FilterBar filter={filter} setFilter={setFilter} onRefresh={loadReports} loading={loading} />
        <MapStats reports={reports} />
        <MapLegend />

        {loading && reports.length === 0 && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[#0a1628]/80 backdrop-blur-sm z-[500]">
            <div className="text-center">
              <Loader2 size={36} className="animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-slate-400 font-display">Loading map data...</p>
            </div>
          </div>
        )}

        {!loading && reports.length === 0 && !error && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[#0a1628]/60 backdrop-blur-sm z-[500]">
            <div className="text-center">
              <MapPin size={40} className="text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 font-display font-semibold">No active reports</p>
              <p className="text-slate-500 text-sm mt-1">Verified reports (excluding fixed) appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
