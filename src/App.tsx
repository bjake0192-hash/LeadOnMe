import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Search, Users, Settings, Activity } from 'lucide-react';
import SearchPage from './pages/SearchPage';
import ProspectsPage from './pages/ProspectsPage';
import SettingsPage from './pages/SettingsPage';

function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Find Properties', path: '/', icon: Search },
    { name: 'Qualified Prospects', path: '/prospects', icon: Users },
    { name: 'API Integrations', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white/90 backdrop-blur-2xl border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Activity className="text-orange-500" />
          OpenLead
        </h1>
        <p className="text-xs text-gray-500 mt-1">Property Finder</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50/50">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/prospects" element={<ProspectsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
