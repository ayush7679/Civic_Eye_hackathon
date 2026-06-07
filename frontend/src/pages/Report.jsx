import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, MapPin, Loader2, CheckCircle2, AlertTriangle,
  Camera, X, Navigation, Clock, Wrench, Eye, RotateCcw, Tag,
} from 'lucide-react';
import SeverityBadge, { SeverityBar } from '../components/SeverityBadge';
import { uploadImage, analyzeImage } from '../services/api';
import { isLoggedIn } from '../services/auth';

const CATEGORIES = [
  'Road Damage',
  'Garbage',
  'Water Leakage',
  'Street Light',
  'Traffic Issue',
  'Other',
];

function GpsStatus({ status, coords }) {
  if (status === 'loading')
    return <div className="flex items-center gap-2 text-amber-400 text-sm"><Loader2 size={14} className="animate-spin" />Getting your location...</div>;
  if (status === 'success')
    return <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle2 size={14} /><span className="font-mono">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span></div>;
  if (status === 'error')
    return <div className="flex items-center gap-2 text-red-400 text-sm"><AlertTriangle size={14} />Location unavailable — enter manually</div>;
  return <div className="flex items-center gap-2 text-slate-500 text-sm"><Navigation size={14} />Click to detect your location</div>;
}

function AnalysisResult({ data }) {
  return (
    <div className="animate-fade-up card border border-blue-500/20 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-blue-500/20">
          <Eye size={18} className="text-blue-400" />
        </div>
        <div>
          <p className="section-label">AI Analysis Complete</p>
          <h3 className="font-display font-bold text-lg text-white mt-0.5">Gemini Vision Results</h3>
        </div>
        <div className="ml-auto"><CheckCircle2 size={20} className="text-green-400" /></div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="section-label mb-1">Damage Type</p>
            <p className="text-xl font-display font-semibold text-white">{data.damage_type || 'Unknown'}</p>
          </div>
          {data.category && (
            <div>
              <p className="section-label mb-1">Category</p>
              <div className="flex items-center gap-2 text-blue-400">
                <Tag size={14} />
                <span className="font-semibold">{data.category}</span>
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="section-label">Severity Scale</p>
              <SeverityBadge score={data.severity_scale} size="sm" />
            </div>
            <SeverityBar score={data.severity_scale} />
            <p className="text-xs text-slate-500 mt-1.5">
              {data.severity_scale}/10 —
              {Number(data.severity_scale) <= 3
                ? ' Minor damage, low priority'
                : Number(data.severity_scale) <= 7
                ? ' Moderate damage, schedule repair'
                : ' Critical damage, immediate attention required'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {data.estimated_time && (
            <div>
              <p className="section-label mb-1">Estimated Repair Time</p>
              <div className="flex items-center gap-2 text-amber-400">
                <Clock size={16} />
                <span className="font-semibold">{data.estimated_time}</span>
              </div>
            </div>
          )}
          {data.image_type && (
            <div>
              <p className="section-label mb-1">Image Classification</p>
              <div className="flex items-center gap-2 text-blue-400">
                <Camera size={16} />
                <span className="font-semibold">{data.image_type}</span>
              </div>
            </div>
          )}
          <div>
            <p className="section-label mb-1">Status</p>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20">
              Pending Review
            </span>
          </div>
        </div>
      </div>

      {data.description && (
        <div className="mt-6 pt-6 border-t border-white/8">
          <p className="section-label mb-2">AI Description</p>
          <p className="text-slate-300 leading-relaxed text-sm">{data.description}</p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-white/8 flex items-center gap-3">
        <Wrench size={14} className="text-slate-500" />
        <p className="text-xs text-slate-500">
          Report submitted successfully. City administrators will review and verify this report.
        </p>
      </div>
    </div>
  );
}

export default function Report() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [coords, setCoords] = useState({ lat: '', lng: '' });
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [step, setStep] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef();

  // Auth guard — redirect to login if not logged in
  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-amber-400 mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-white mb-2">Login Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to submit a damage report.</p>
          <button
            onClick={() => navigate('/auth')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver = (e) => e.preventDefault();

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      alert('Camera access denied');
    }
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      handleFile(new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' }));
      closeCamera();
    }, 'image/jpeg');
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { setGpsStatus('error'); return; }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus('success'); },
      () => setGpsStatus('error')
    );
  };

  const handleSubmit = async () => {
    if (!image) return;
    setErrorMsg('');
    try {
      setStep('uploading');
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(image);
      });
      const uploadData = await uploadImage(base64);
      setStep('analyzing');
      const analysisData = await analyzeImage(
        uploadData.path,
        coords.lat || 27.7172,
        coords.lng || 85.3240,
        category,
        title || `${category} Report`,
      );
      setResult({ ...analysisData, category });
      setStep('done');
    } catch (e) {
      setErrorMsg(e.message);
      setStep('error');
    }
  };

  const reset = () => {
    setImage(null); setImagePreview(null); setResult(null);
    setStep('idle'); setErrorMsg(''); setGpsStatus('idle');
    setCoords({ lat: '', lng: '' }); setTitle('');
  };

  const isSubmitting = step === 'uploading' || step === 'analyzing';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="animate-fade-up mb-10">
          <p className="section-label mb-3">Citizen Reporting</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white mb-4">
            Report<br />
            <span className="text-blue-400">an Issue</span>
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Upload a photo of a civic issue. Our AI will analyze it instantly and log it for city review.
          </p>
        </div>

        {step === 'done' && result ? (
          <div>
            <AnalysisResult data={result} />
            <button onClick={reset} className="btn-secondary mt-6 w-full justify-center">
              <RotateCcw size={16} />
              Submit Another Report
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Photo upload */}
            <div className="animate-fade-up animate-delay-100 card">
              <p className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <Camera size={16} className="text-blue-400" />
                Upload Photo
              </p>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-cover" />
                  <button
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600/80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs text-white font-mono">
                    {image.name}
                  </div>
                </div>
              ) : cameraOpen ? (
                <div className="space-y-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl max-h-96 object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-3">
                    <button onClick={capturePhoto} className="btn-primary flex-1 justify-center"><Camera size={18} />Capture Photo</button>
                    <button onClick={closeCamera} className="btn-secondary flex-1 justify-center">Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-white/15 rounded-xl p-12 text-center hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/10 transition-colors">
                    <Upload size={24} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="font-display font-semibold text-white mb-2">Upload or Capture Photo</p>
                  <p className="text-sm text-slate-500 mb-6">JPG, PNG, WebP up to 20MB</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => fileRef.current?.click()} className="btn-secondary justify-center">
                      <Upload size={18} />Upload Image
                    </button>
                    <button onClick={openCamera} className="btn-primary justify-center">
                      <Camera size={18} />Open Camera
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                </div>
              )}
            </div>

            {/* Location */}
            <div className="animate-fade-up animate-delay-200 card">
              <p className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-blue-400" />
                Location
              </p>
              <button
                onClick={detectLocation}
                disabled={gpsStatus === 'loading'}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-blue-500/30 transition-all duration-200 mb-4"
              >
                <GpsStatus status={gpsStatus} coords={coords} />
                <Navigation size={16} className="text-slate-500" />
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono">Latitude</label>
                  <input type="number" placeholder="e.g. 27.7172" value={coords.lat} onChange={(e) => setCoords(p => ({ ...p, lat: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5 font-mono">Longitude</label>
                  <input type="number" placeholder="e.g. 85.3240" value={coords.lng} onChange={(e) => setCoords(p => ({ ...p, lng: e.target.value }))} className="input-field text-sm" />
                </div>
              </div>
            </div>

            {isSubmitting && (
              <div className="card border border-blue-500/20">
                <div className="flex items-center gap-4">
                  <Loader2 size={20} className="text-blue-400 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {step === 'uploading' ? 'Uploading image...' : 'Analyzing...'}
                    </p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {step === 'uploading' ? 'Securely transferring your photo' : 'AI is classifying damage type and severity'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: step === 'uploading' ? '40%' : '85%' }} />
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="card border border-red-500/20 bg-red-500/5">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertTriangle size={18} />
                  <div>
                    <p className="font-semibold">Submission Failed</p>
                    <p className="text-sm text-red-300/70 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!image || isSubmitting}
              className="animate-fade-up animate-delay-300 btn-primary w-full justify-center text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" />Processing...</>
              ) : (
                <><CheckCircle2 size={18} />Analyze & Submit Report</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
