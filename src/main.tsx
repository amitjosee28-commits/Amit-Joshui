import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Lazy load CMS and Services Admin portals
const Dashboard = lazy(() => import('./dashboard.tsx'));
const AdminServicesPortal = lazy(() => import('./components/AdminServicesPortal.tsx'));

const getRouteType = () => {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (
    path.includes('servicesadmin') || hash.includes('servicesadmin') || search.includes('servicesadmin') ||
    path.includes('adminservices') || hash.includes('adminservices') || search.includes('adminservices') ||
    path.includes('admin-services') || hash.includes('admin-services') || search.includes('admin-services')
  ) {
    return 'servicesadmin';
  }

  if (
    path.includes('adminloginweb11') || hash.includes('adminloginweb11') || search.includes('adminloginweb11')
  ) {
    return 'cms';
  }

  return 'app';
};

const routeType = getRouteType();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {routeType === 'servicesadmin' ? (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 text-amber-400 flex flex-col items-center justify-center font-mono p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping"></div>
            <p className="text-sm tracking-wider uppercase">Loading Admin Services Portal...</p>
          </div>
        </div>
      }>
        <AdminServicesPortal />
      </Suspense>
    ) : routeType === 'cms' ? (
      <Suspense fallback={
        <div className="min-h-screen bg-slate-950 text-cyan-400 flex flex-col items-center justify-center font-mono p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500 animate-ping"></div>
            <p className="text-sm tracking-wider uppercase">Loading CMS Portal...</p>
          </div>
        </div>
      }>
        <Dashboard />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
