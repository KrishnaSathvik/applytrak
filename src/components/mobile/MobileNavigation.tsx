import React from 'react';
import { 
  Home,
  FileText, 
  Target, 
  BarChart3, 
  User
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const MobileNavigation: React.FC = () => {
  const { ui, setSelectedTab, auth } = useAppStore();

  const navItems: Array<{
    id: 'home' | 'applications' | 'goals' | 'analytics' | 'profile';
    label: string;
    icon: React.ComponentType<any>;
    description: string;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      description: 'Home'
    },
    {
      id: 'applications',
      label: 'Apps',
      icon: FileText,
      description: 'Applications'
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: Target,
      description: 'Goals'
    },
    {
      id: 'analytics',
      label: 'Stats',
      icon: BarChart3,
      description: 'Analytics'
    }
  ];

  // Add profile tab if authenticated
  if (auth.isAuthenticated) {
    navItems.push({
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Profile'
    });
  }

  const handleTabClick = (tab: 'home' | 'applications' | 'goals' | 'analytics' | 'profile') => {
    setSelectedTab(tab);
  };

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = ui.selectedTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.description}
            title={item.description}
          >
            <Icon className="h-5 w-5" />
            <span className="mobile-text-xs mobile-font-medium">
              {item.label}
            </span>
            {isActive && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileNavigation;
