import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Report from './pages/Report';
import Map from './pages/Map';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import { isLoggedIn, isAdmin } from './services/auth';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

/** Only admin users can access this route */
function AdminRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/auth" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
}

/** Redirect logged-in users away from /auth */
function GuestRoute({ children }) {
  if (isLoggedIn()) {
    return <Navigate to={isAdmin() ? '/admin' : '/'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/"       element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/map"    element={<Map />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <GuestRoute>
              <div className="pt-12">
              <Auth />
              </div>
            </GuestRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
