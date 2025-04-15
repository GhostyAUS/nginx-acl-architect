
import { FC, ReactNode } from 'react';
import AppHeader from './AppHeader';
import AppNavbar from './AppNavbar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <AppNavbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
