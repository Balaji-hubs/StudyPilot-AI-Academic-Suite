import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import StudyTimerModal from '../study/StudyTimerModal';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>

      <MobileNav onOpenMenu={() => setSidebarOpen(true)} />
      <StudyTimerModal />
    </div>
  );
}
