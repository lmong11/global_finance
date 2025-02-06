import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems }) => {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 px-4 py-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-8">
        <Globe className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-semibold">Global Finance</span>
      </div>
      
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{t(item.label)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pt-4 border-t border-gray-200">
        <LanguageSelector />
      </div>
    </div>
  );
};

export default Sidebar;