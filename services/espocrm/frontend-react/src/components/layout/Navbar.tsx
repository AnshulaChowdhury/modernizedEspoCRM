import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps): React.ReactElement {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-10 z-40 h-16 border-b bg-white">
      <div className="flex h-full items-center px-4">
        {/* Menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="ml-4 font-semibold text-lg text-gray-900">Krisette & Co.</div>

        {/* Global search */}
        <div className="ml-8 flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Global search"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User menu */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">
                {user?.name ?? user?.userName}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border py-1 z-50">
                <button
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100',
                    'flex items-center gap-2'
                  )}
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/User/view/' + user?.id);
                  }}
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                {user?.isAdmin && (
                  <>
                    <hr className="my-1" />
                    <button
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100',
                        'flex items-center gap-2'
                      )}
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/Admin');
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Administration
                    </button>
                  </>
                )}
                <hr className="my-1" />
                <button
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100',
                    'flex items-center gap-2'
                  )}
                  onClick={() => {
                    setDropdownOpen(false);
                    void handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
