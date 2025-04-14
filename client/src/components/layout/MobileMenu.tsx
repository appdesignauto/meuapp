import { Link } from 'wouter';
import { Crown } from 'lucide-react';
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
    <div className="md:hidden bg-white border-t border-neutral-200 py-3 px-4">
      <nav className="flex flex-col space-y-3">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className="text-neutral-700 hover:text-primary font-medium py-1"
            onClick={onClose}
          >
            {link.name}
          </Link>
        ))}
        
        {userRole !== 'premium' && (
          <Link
            href="/pricing"
            className="flex items-center text-neutral-500 hover:text-primary py-1"
            onClick={onClose}
          >
            <Crown className="h-4 w-4 text-secondary-500 mr-1" />
            <span className="text-sm font-medium">Assinar Premium</span>
          </Link>
        )}
      </nav>
    </div>
  );
};

export default MobileMenu;
