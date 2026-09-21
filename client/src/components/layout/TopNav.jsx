import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';

export default function TopNav({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
        <FiMenu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4 text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.companyName || 'Personal'}</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100" title="Logout">
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
