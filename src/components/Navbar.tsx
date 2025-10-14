import { Menu, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-lg shadow-sm">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 8.5V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v1.5c-1.66 0-3 1.34-3 3V13c0 .55.45 1 1 1h1v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h4v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-6h1c.55 0 1-.45 1-1v-1.5c0-1.66-1.34-3-3-3zM6 7h12v1H6V7zm11 13h-2v-4H9v4H7v-7h10v7zm3-10h-2V9h2v1z"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">DINOBOT</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="bg-green-100 p-2 rounded-full">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">Minha Conta</p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    navigate('/account');
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Configurações da Conta</span>
                </button>

                <div className="border-t border-gray-100 my-2"></div>

                <button
                  onClick={() => {
                    signOut();
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 transition-colors flex items-center gap-2 text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm">Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
