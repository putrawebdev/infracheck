import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, Search, User } from 'lucide-react';

/**
 * Animated Public Bottom Navigation Dock
 * Smooth Material 3 sliding pill with spring layout animation and tactile tap feedback.
 */
const BottomNavDock = ({
  id = 'public-mobile-bottom-dock',
  activeTab,
  onTabChange,
  onHomeClick,
  onTrackClick,
  onAboutClick,
  fixed = true,
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active tab automatically if not explicitly provided
  const currentTab = React.useMemo(() => {
    if (activeTab) return activeTab;
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/report/track')) return 'track';
    if (path.startsWith('/about')) return 'about';
    return '';
  }, [activeTab, location.pathname]);

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      path: '/',
      onClick: () => {
        if (onTabChange) onTabChange('home');
        if (onHomeClick) {
          onHomeClick();
        } else if (location.pathname !== '/') {
          navigate('/');
        }
      },
    },
    {
      id: 'track',
      label: 'Track',
      icon: Search,
      path: '/report/track',
      onClick: () => {
        if (onTabChange) onTabChange('track');
        if (onTrackClick) {
          onTrackClick();
        } else if (location.pathname !== '/report/track') {
          navigate('/report/track');
        }
      },
    },
    {
      id: 'about',
      label: 'About',
      icon: User,
      path: '/about',
      onClick: () => {
        if (onTabChange) onTabChange('about');
        if (onAboutClick) {
          onAboutClick();
        } else if (location.pathname !== '/about') {
          navigate('/about');
        }
      },
    },
  ];

  return (
    <motion.nav
      id={id}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className={`bg-[#181a1d]/95 backdrop-blur-md border-t border-[#343844] shadow-[0_-8px_24px_rgba(0,0,0,0.6)] z-30 select-none ${
        fixed ? 'fixed bottom-0 left-0 right-0 w-full' : 'w-full'
      } ${className}`}
    >
      <div className="flex items-center justify-around max-w-xl mx-auto px-6 py-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              id={`dock-tab-${item.id}`}
              type="button"
              onClick={item.onClick}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className={`flex flex-col items-center gap-1 group py-1 cursor-pointer select-none transition-colors ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Material 3 Active Pill Container with Sliding Spring Animation */}
              <div className="relative w-14 h-7.5 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="dock-active-pill"
                    className="absolute inset-0 bg-[#354376] rounded-full shadow-[0_2px_12px_rgba(53,67,118,0.55)] border border-blue-400/25"
                    transition={{
                      type: 'spring',
                      stiffness: 480,
                      damping: 34,
                    }}
                  />
                )}

                {/* Animated Icon with subtle scale bump on active */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -0.5 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors duration-150 ${
                      isActive
                        ? 'text-blue-100 stroke-[2.2]'
                        : 'text-slate-400 group-hover:text-white stroke-[1.8]'
                    }`}
                  />
                </motion.div>
              </div>

              {/* Tab Label with Smooth Transitions */}
              <motion.span
                animate={{
                  scale: isActive ? 1.02 : 1,
                  color: isActive ? '#ffffff' : '#94a3b8',
                }}
                transition={{ duration: 0.15 }}
                className={`text-[11px] tracking-wide transition-all ${
                  isActive ? 'font-bold text-white' : 'font-medium group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNavDock;
