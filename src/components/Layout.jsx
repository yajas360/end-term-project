import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="app-bg" />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="main-content">
        <TopBar onMenuToggle={() => setMobileOpen((s) => !s)} />
        <main style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
