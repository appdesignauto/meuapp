import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Car,
  Crown,
  Menu,
  Search,
} from 'lucide-react';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, userRole, logout } = useAuth();
  const [location] = useLocation();

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Categorias', path: '/categories' },
    { name: 'Formatos', path: '/formats' },
    { name: 'Tutoriais', path: '/tutorials' },
    { name: 'Suporte', path: '/support' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-primary font-bold text-2xl">
              <Car className="mr-2" />
              <span>DesignAuto<span className="text-secondary-500">App</span></span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-neutral-700 hover:text-primary font-medium ${
                  location === link.path ? 'text-primary' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {userRole !== 'premium' && (
              <Link href="/pricing" className="text-neutral-500 hover:text-primary hidden sm:inline-flex items-center">
                <Crown className="h-4 w-4 text-secondary-500 mr-1" />
                <span className="text-sm font-medium">Assinar Premium</span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <Button onClick={() => logout()} variant="default">
                Sair
              </Button>
            ) : (
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Entrar
                </Button>
              </Link>
            )}
            
            <button
              type="button"
              className="md:hidden text-neutral-500 hover:text-primary"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        navLinks={navLinks} 
        userRole={userRole}
      />
    </header>
  );
};

export default Header;
