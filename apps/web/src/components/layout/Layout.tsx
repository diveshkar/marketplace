import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  const isAdmin = useLocation().pathname === '/admin';

  return (
    <div className={`flex flex-col bg-gray-50 ${isAdmin ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-teal-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      {!isAdmin && <Footer />}
    </div>
  );
}
