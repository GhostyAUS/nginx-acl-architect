
import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const AppHeader: FC = () => {
  return (
    <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-blue-600 dark:text-blue-500" />
          <span className="text-xl font-semibold text-gray-900 dark:text-white">NGINX ACL Architect</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">Documentation</Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
