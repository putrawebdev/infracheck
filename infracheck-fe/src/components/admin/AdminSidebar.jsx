import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import infracheckLogo from '../../../assets/Icon.png';

// Custom SVG Icons exactly as specified in design
const DashboardIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 5.7V0H17.1V5.7H9.5ZM0 9.5V0H7.6V9.5H0ZM9.5 17.1V7.6H17.1V17.1H9.5ZM0 17.1V11.4H7.6V17.1H0Z" fill="currentColor"/>
  </svg>
);

const ReportsMapIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4 17.1L5.7 15.105L1.2825 16.815C0.965833 16.9417 0.672917 16.906 0.40375 16.7081C0.134583 16.5102 0 16.245 0 15.9125V2.6125C0 2.40667 0.059375 2.22458 0.178125 2.06625C0.296875 1.90792 0.459167 1.78917 0.665 1.71L5.7 0L11.4 1.995L15.8175 0.285C16.1342 0.158333 16.4271 0.193958 16.6963 0.391875C16.9654 0.589792 17.1 0.855 17.1 1.1875V14.4875C17.1 14.6933 17.0406 14.8754 16.9219 15.0337C16.8031 15.1921 16.6408 15.3108 16.435 15.39L11.4 17.1ZM10.45 14.7725V3.6575L6.65 2.3275V13.4425L10.45 14.7725ZM12.35 14.7725L15.2 13.8225V2.565L12.35 3.6575V14.7725ZM1.9 14.535L4.75 13.4425V2.3275L1.9 3.2775V14.535ZM12.35 3.6575V14.7725V3.6575ZM4.75 2.3275V13.4425V2.3275Z" fill="currentColor"/>
  </svg>
);

const AuditHistoryIcon = ({ className = 'w-[18px] h-[18px]' }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.55 17.1C6.365 17.1 4.46104 16.3756 2.83812 14.9269C1.21521 13.4781 0.285 11.6692 0.0475 9.5H1.995C2.21667 11.1467 2.94896 12.5083 4.19187 13.585C5.43479 14.6617 6.8875 15.2 8.55 15.2C10.4025 15.2 11.974 14.5548 13.2644 13.2644C14.5548 11.974 15.2 10.4025 15.2 8.55C15.2 6.6975 14.5548 5.12604 13.2644 3.83562C11.974 2.54521 10.4025 1.9 8.55 1.9C7.4575 1.9 6.43625 2.15333 5.48625 2.66C4.53625 3.16667 3.73667 3.86333 3.0875 4.75H5.7V6.65H0V0.95H1.9V3.1825C2.7075 2.16917 3.69313 1.38542 4.85688 0.83125C6.02063 0.277083 7.25167 0 8.55 0C9.7375 0 10.8498 0.225625 11.8869 0.676875C12.924 1.12812 13.8265 1.73771 14.5944 2.50563C15.3623 3.27354 15.9719 4.17604 16.4231 5.21313C16.8744 6.25021 17.1 7.3625 17.1 8.55C17.1 9.7375 16.8744 10.8498 16.4231 11.8869C15.9719 12.924 15.3623 13.8265 14.5944 14.5944C13.8265 15.3623 12.924 15.9719 11.8869 16.4231C10.8498 16.8744 9.7375 17.1 8.55 17.1ZM11.21 12.54L7.6 8.93V3.8H9.5V8.17L12.54 11.21L11.21 12.54Z" fill="currentColor"/>
  </svg>
);

const SettingsNavIcon = ({ className = 'w-[19px] h-[19px]' }) => (
  <svg className={className} width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.935 19L6.555 15.96C6.34917 15.8808 6.15521 15.7858 5.97312 15.675C5.79104 15.5642 5.61292 15.4454 5.43875 15.3187L2.6125 16.5062L0 11.9937L2.44625 10.1413C2.43042 10.0304 2.4225 9.92354 2.4225 9.82062C2.4225 9.71771 2.4225 9.61083 2.4225 9.5C2.4225 9.38917 2.4225 9.28229 2.4225 9.17938C2.4225 9.07646 2.43042 8.96958 2.44625 8.85875L0 7.00625L2.6125 2.49375L5.43875 3.68125C5.61292 3.55458 5.795 3.43583 5.985 3.325C6.175 3.21417 6.365 3.11917 6.555 3.04L6.935 0H12.16L12.54 3.04C12.7458 3.11917 12.9398 3.21417 13.1219 3.325C13.304 3.43583 13.4821 3.55458 13.6562 3.68125L16.4825 2.49375L19.095 7.00625L16.6487 8.85875C16.6646 8.96958 16.6725 9.07646 16.6725 9.17938C16.6725 9.28229 16.6725 9.38917 16.6725 9.5C16.6725 9.61083 16.6725 9.71771 16.6725 9.82062C16.6725 9.92354 16.6567 10.0304 16.625 10.1413L19.0713 11.9937L16.4588 16.5062L13.6562 15.3187C13.4821 15.4454 13.3 15.5642 13.11 15.675C12.92 15.7858 12.73 15.8808 12.54 15.96L12.16 19H6.935ZM8.5975 17.1H10.4737L10.8062 14.5825C11.2971 14.4558 11.7523 14.2698 12.1719 14.0244C12.5915 13.779 12.9754 13.4821 13.3237 13.1337L15.675 14.1075L16.6013 12.4925L14.5587 10.9487C14.6379 10.7271 14.6933 10.4935 14.725 10.2481C14.7567 10.0027 14.7725 9.75333 14.7725 9.5C14.7725 9.24667 14.7567 8.99729 14.725 8.75187C14.6933 8.50646 14.6379 8.27292 14.5587 8.05125L16.6013 6.5075L15.675 4.8925L13.3237 5.89C12.9754 5.52583 12.5915 5.22104 12.1719 4.97563C11.7523 4.73021 11.2971 4.54417 10.8062 4.4175L10.4975 1.9H8.62125L8.28875 4.4175C7.79792 4.54417 7.34271 4.73021 6.92312 4.97563C6.50354 5.22104 6.11958 5.51792 5.77125 5.86625L3.42 4.8925L2.49375 6.5075L4.53625 8.0275C4.45708 8.265 4.40167 8.5025 4.37 8.74C4.33833 8.9775 4.3225 9.23083 4.3225 9.5C4.3225 9.75333 4.33833 9.99875 4.37 10.2362C4.40167 10.4737 4.45708 10.7112 4.53625 10.9487L2.49375 12.4925L3.42 14.1075L5.77125 13.11C6.11958 13.4742 6.50354 13.779 6.92312 14.0244C7.34271 14.2698 7.79792 14.4558 8.28875 14.5825L8.5975 17.1ZM9.595 12.825C10.5133 12.825 11.2971 12.5004 11.9462 11.8513C12.5954 11.2021 12.92 10.4183 12.92 9.5C12.92 8.58167 12.5954 7.79792 11.9462 7.14875C11.2971 6.49958 10.5133 6.175 9.595 6.175C8.66083 6.175 7.87313 6.49958 7.23188 7.14875C6.59062 7.79792 6.27 8.58167 6.27 9.5C6.27 10.4183 6.59062 11.2021 7.23188 11.8513C7.87313 12.5004 8.66083 12.825 9.595 12.825Z" fill="currentColor"/>
  </svg>
);

const AdminSidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon, matchPaths: ['/admin', '/admin/dashboard'] },
    { to: '/admin/map', label: 'Reports Map', icon: ReportsMapIcon, matchPaths: ['/admin/map', '/admin/reports-map'] },
    { to: '/admin/reports', label: 'Audit History', icon: AuditHistoryIcon, matchPaths: ['/admin/reports', '/admin/history'] },
    { to: '/admin/settings', label: 'Settings', icon: SettingsNavIcon, matchPaths: ['/admin/settings', '/admin/categories', '/admin/profile'] },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* SideNavBar Frame */}
      <aside
        id="admin-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-[288px] bg-[#26292b] border-r border-[#444652] text-[#c5c5d4] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 font-['Poppins',sans-serif] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with InfraCheck Icon */}
        <div className="relative pt-6 pb-4 px-6 flex flex-col items-center justify-center border-b border-[#444652]/40 min-h-[120px]">
          {/* Mobile Close Button */}
          <button
            id="sidebar-close-btn"
            type="button"
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 text-[#c5c5d4] hover:text-white p-1.5 rounded-full hover:bg-[#34383c]"
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Badge & Typography */}
          <div className="flex items-center justify-center select-none w-full py-1">
            <img
              src={infracheckLogo}
              alt="InfraCheck Logo"
              className="h-16 sm:h-18 w-auto max-w-[220px] object-contain drop-shadow-md select-none"
            />
          </div>
        </div>

        {/* Navigation Tabs (Margin-3 / Container-4) */}
        <div className="flex-1 py-6 px-5 space-y-2.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = item.matchPaths
              ? item.matchPaths.some((p) => (p === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(p)))
              : location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => {
                  const active = isActive || isItemActive;
                  return `w-full h-[40px] flex items-center gap-3.5 px-5.5 rounded-full text-[12px] font-medium transition-all duration-150 select-none ${
                    active
                      ? 'bg-[#344479] text-[#dce1ff] shadow-xs'
                      : 'text-[#c5c5d4] hover:bg-[#32363a] hover:text-[#e4e1e6]'
                  }`;
                }}
              >
                <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <span className="font-['Poppins',sans-serif] font-medium text-[12px] tracking-[0.2px] truncate">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* User Footer & Logout */}
        <div className="p-5 border-t border-[#444652]/50 mt-auto">
          <button
            id="admin-logout-btn"
            type="button"
            onClick={handleLogout}
            className="w-full h-[40px] flex items-center gap-3.5 px-5.5 rounded-full text-[12px] font-medium text-[#c5c5d4] hover:bg-red-950/30 hover:text-red-300 transition-colors"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4 text-red-400" />
            </div>
            <span className="font-['Poppins',sans-serif] font-medium text-[12px] tracking-[0.2px]">
              Keluar Akun
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
