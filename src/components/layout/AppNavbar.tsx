
import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Shield, Server, Globe, Activity, Settings } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  current: boolean;
}

const NavItem: FC<NavItemProps> = ({ href, icon: Icon, label, current }) => {
  return (
    <Link
      to={href}
      className={cn(
        'flex gap-3 items-center px-3 py-2 text-sm font-medium rounded-md',
        current
          ? 'bg-gray-100 text-blue-600 dark:bg-gray-800 dark:text-blue-500'
          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-blue-500 dark:hover:bg-gray-800'
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

const AppNavbar: FC = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: 'IP ACLs', href: '/ip-acls', icon: Server },
    { name: 'URL ACLs', href: '/url-acls', icon: Globe },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hidden md:block">
      <div className="h-full px-3 py-4">
        <div className="flex items-center px-3 mb-6">
          <Shield className="mr-2 h-6 w-6 text-blue-600 dark:text-blue-500" />
          <span className="text-lg font-semibold">ACL Architect</span>
        </div>
        <div className="space-y-1">
          {navigation.map((item) => (
            <NavItem
              key={item.name}
              href={item.href}
              icon={item.icon}
              label={item.name}
              current={location.pathname === item.href}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
