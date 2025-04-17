import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Car,
  Crown,
  Menu,
  Search,
  LayoutDashboard,
  User,
} from 'lucide-react';
import MobileMenu from './MobileMenu';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Categorias', path: '/categories' },
    { name: 'Designers', path: '/designers' },
    { name: 'Formatos', path: '/formats' },
    { name: 'Tutoriais', path: '/tutorials' },
    { name: 'Suporte', path: '/support' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-md">
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
                className={`text-neutral-700 hover:text-blue-600 font-medium text-sm uppercase tracking-wider transition-colors duration-200 ${
                  location === link.path ? 'text-blue-600 border-b-2 border-blue-500 pb-1' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user && user.role !== 'premium' && (
              <Link href="/pricing" className="text-neutral-700 hover:text-blue-600 hidden sm:inline-flex items-center transition-colors duration-200">
                <Crown className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">Assinar Premium</span>
              </Link>
            )}
            
            {/* Link para painel do usuário */}
            {user && (
              <Link href="/painel/inicio" className="text-neutral-700 hover:text-blue-600 hidden sm:inline-flex items-center transition-colors duration-200">
                <User className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">Meu Painel</span>
              </Link>
            )}
            
            {/* Link para painel administrativo - mostrado apenas para admin */}
            {user && (user.role === 'admin' || user.role === 'designer_adm') && (
              <Link href="/admin" className="text-neutral-700 hover:text-blue-600 hidden sm:inline-flex items-center transition-colors duration-200">
                <LayoutDashboard className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">Painel Admin</span>
              </Link>
            )}
            
            {user ? (
              <Button 
                onClick={() => logoutMutation.mutate()} 
                variant="outline"
                className="border-blue-400 text-blue-600 hover:bg-blue-50 font-medium rounded-md"
              >
                Sair
              </Button>
            ) : (
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md">
                  Entrar
                </Button>
              </Link>
            )}
            
            <button
              type="button"
              className="md:hidden text-blue-600 hover:text-blue-500 transition-colors duration-200"
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
        userRole={user?.role}
      />
    </header>
  );
};

export default Header;
