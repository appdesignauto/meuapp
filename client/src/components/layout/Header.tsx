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
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img 
                src="/assets/LOGO DESIGNAUTO.png" 
                alt="DesignAuto App" 
                className="h-12 mr-2" 
              />
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-neutral-700 hover:text-primary font-medium text-sm uppercase tracking-wider transition-colors duration-200 ${
                  location === link.path ? 'text-primary border-b-2 border-primary pb-1' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {userRole !== 'premium' && (
              <Link href="/pricing" className="text-neutral-700 hover:text-secondary-500 hidden sm:inline-flex items-center transition-colors duration-200">
                <Crown className="h-4 w-4 text-secondary-500 mr-1" />
                <span className="text-sm font-medium">Assinar Premium</span>
              </Link>
            )}
            
            {isAuthenticated ? (
              <Button 
                onClick={() => logout()} 
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5 font-medium rounded-md"
              >
                Sair
              </Button>
            ) : (
              <Link href="/login">
                <Button className="bg-secondary hover:bg-secondary/90 text-white font-medium rounded-md">
                  Entrar
                </Button>
              </Link>
            )}
            
            <button
              type="button"
              className="md:hidden text-primary hover:text-primary/80 transition-colors duration-200"
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
