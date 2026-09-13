import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = ({ children }) => {
  return (
    <div id="public-layout-wrapper" className="h-screen w-full flex flex-col bg-[#111416] text-slate-100 font-['Poppins',sans-serif] overflow-hidden">
      {/* Main Page Content */}
      <main id="public-main-content" className="flex-1 w-full h-full flex flex-col overflow-hidden">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default PublicLayout;
