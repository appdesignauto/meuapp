import { Link } from 'wouter';
import { Crown, X } from 'lucide-react';
import { UserRole } from '@/types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: { name: string; path: string }[];
  userRole: UserRole;
}

const MobileMenu = ({ isOpen, onClose, navLinks, userRole }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={onClose}>
      <div 
        className="absolute right-0 top-0 h-full w-3/4 max-w-xs bg-white shadow-xl py-4 px-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-100">
          <h2 className="text-lg font-semibold text-blue-600">Menu</h2>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-blue-600 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="flex flex-col space-y-5">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className="text-neutral-700 hover:text-blue-600 font-medium py-2 border-b border-neutral-100 transition-colors"
              onClick={onClose}
            >
              {link.name}
            </Link>
          ))}
          
          {userRole !== 'premium' && (
            <Link
              href="/pricing"
              className="flex items-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg py-3 px-4 mt-4 hover:opacity-90 transition-opacity"
              onClick={onClose}
            >
              <Crown className="h-5 w-5 mr-2" />
              <span className="font-medium">Assinar Premium</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
