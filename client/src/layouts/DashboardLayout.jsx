import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import PanelAssistant from '../components/shared/PanelAssistant';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} />
      {sidebarOpen && <div className="dashboard-layout__scrim" onClick={() => setSidebarOpen(false)} />}
      <div className="dashboard-layout__main">
        <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>
      <PanelAssistant />
    </div>
  );
}
