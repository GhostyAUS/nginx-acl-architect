import { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, Globe, Settings, Layers } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const AppNavbar: FC = () => {
  const isMobile = useIsMobile();

  const navItems = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/dashboard',
    },
    {
      name: 'IP ACLs',
      icon: <Network className="h-5 w-5" />,
      path: '/ip-acls',
    },
    {
      name: 'URL ACLs',
      icon: <Globe className="h-5 w-5" />,
      path: '/url-acls',
    },
    {
      name: 'Combined ACLs',
      icon: <Layers className="h-5 w-5" />,
      path: '/combined-acls',
    },
    {
      name: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
    },
  ];

  return (
    <nav className="border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 w-16 md:w-64 shrink-0">
      <div className="h-full flex flex-col">
        <div className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
                    )
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {!isMobile && <span>{item.name}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
