import { Outlet } from 'react-router-dom';
import BusinessHeader from './header';

const BusinessLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <BusinessHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default BusinessLayout;