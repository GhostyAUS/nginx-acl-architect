
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Simply redirect to the dashboard hash
    window.location.href = '/#dashboard';
  }, []);

  return null;
};

export default Index;
