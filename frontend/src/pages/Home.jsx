import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, Database,
  ArrowRight, MapPin, Zap, Shield, ChevronRight,
  Activity, TrendingUp
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ReportCard from '../components/ReportCard';
import { getReports } from '../services/api';

function HeroGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" className="opacity-10">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-600/8 rounded-full blur-3xl" />
    </div>
  );
}

function FeatureChip({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
      <Icon size={14} className="text-blue-400" />
      {text}
    </div>
  );
}

function ProcessStep({ num, title, desc }) {
  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-display font-bold text-blue-400 text-sm group-hover:bg-blue-600/30 transition-colors">
        {num}
      </div>
      <div className="pt-1">
        <h4 className="font-display font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getReports()
      .then(setReports)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total:    reports.length,
    verified: reports.filter(r => r.verification === 'verified').length,
    critical: reports.filter(r => Number(r.severity_scale) >= 8).length,
    pending:  reports.filter(r => r.status === 'broken').length,
  };

  const recent = reports.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center pt-16">
        <HeroGrid />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-300 text-sm font-medium mb-8">
              <Activity size={14} className="animate-pulse" />
              AI-Powered Road Damage Detection
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up animate-delay-100 font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] mb-6">
              Smarter Roads
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Start With You
              </span>
            </h1>

            <p className="animate-fade-up animate-delay-200 text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
              CivicEye uses Gemini Vision AI to instantly analyze road damage from citizen photos — 
              turning reports into actionable data for city maintenance teams.
            </p>

            {/* Feature chips */}
            <div className="animate-fade-up animate-delay-300 flex flex-wrap gap-2 mb-10">
              <FeatureChip icon={Zap} text="Instant AI Analysis" />
              <FeatureChip icon={MapPin} text="GPS Mapping" />
              <FeatureChip icon={Shield} text="Verified Reports" />
              <FeatureChip icon={TrendingUp} text="Real-time Dashboard" />
            </div>

            {/* CTA buttons */}
            <div className="animate-fade-up animate-delay-400 flex flex-wrap gap-4">
              <Link to="/report" className="btn-primary text-base px-8 py-4">
                <AlertTriangle size={18} />
                Report Damage Now
                <ArrowRight size={16} />
              </Link>
              <Link to="/map" className="btn-secondary text-base px-8 py-4">
                <MapPin size={18} />
                View Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="section-label mb-2">Platform Statistics</p>
          <h2 className="font-display font-bold text-3xl text-white">Real-time Overview</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ⚠ Could not load statistics — {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Database}      label="Total Reports"    value={loading ? null : stats.total}    color="blue"   delay={0} />
          <StatsCard icon={CheckCircle}   label="Verified Reports" value={loading ? null : stats.verified} color="green"  delay={100} />
          <StatsCard icon={AlertTriangle} label="Critical Reports"  value={loading ? null : stats.critical} color="red"    delay={200} />
          <StatsCard icon={Clock}         label="Pending Review"   value={loading ? null : stats.pending}  color="amber"  delay={300} />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="section-label mb-3">How It Works</p>
            <h2 className="font-display font-bold text-3xl text-white mb-8">
              From Photo to<br />Action in Seconds
            </h2>
            <div className="space-y-6">
              <ProcessStep num="01" title="Capture & Upload" desc="Take a photo of road damage and upload it directly from your device." />
              <ProcessStep num="02" title="AI Analysis" desc="Gemini Vision AI analyzes the image, classifying damage type and severity on a 1-10 scale." />
              <ProcessStep num="03" title="Mapped & Logged" desc="The report is automatically pinned on the interactive map with GPS coordinates." />
              <ProcessStep num="04" title="Admin Review" desc="City officials verify reports, assign status, and schedule repairs through the dashboard." />
            </div>
          </div>

          <div className="glass rounded-3xl p-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-slate-500 text-sm ml-2 font-mono">analysis_result.json</span>
            </div>
            <pre className="text-sm text-slate-300 font-mono overflow-x-auto leading-relaxed">
{`{
  "damage_type": "Pothole",
  "severity_scale": 8,
  "description": "Deep pothole approx.
   40cm diameter causing hazard",
  "estimated_time": "2-3 weeks",
  "verification": "unverified",
  "status": "broken",
  "gps_x": 27.7172,
  "gps_y": 85.3240
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Recent Reports */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="section-label mb-2">Latest Activity</p>
            <h2 className="font-display font-bold text-3xl text-white">Recent Reports</h2>
          </div>
          <Link to="/admin" className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card h-56 skeleton" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Database size={40} className="mx-auto mb-3 opacity-40" />
            <p>No reports yet. <Link to="/report" className="text-blue-400 hover:underline">Be the first to report!</Link></p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recent.map((r, i) => <ReportCard key={r.id} report={r} delay={i * 100} />)}
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/report" className="btn-primary">
            <AlertTriangle size={16} />
            Report Road Damage
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <CheckCircle size={12} className="text-white" />
            </div>
            <span className="font-display font-semibold text-white text-sm">CivicEye</span>
          </div>
          <p className="text-slate-500 text-sm">AI-powered road damage reporting for smarter cities</p>
        </div>
      </footer>
    </div>
  );
}
