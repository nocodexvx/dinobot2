import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Users, BarChart3, Clock, X, Settings, Plus, Send, DollarSign, ChevronDown } from 'lucide-react';
import { useBot } from '../contexts/BotContext';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/bot-create', icon: Plus, label: 'Criar Bot' },
  { to: '/bot-editor', icon: Settings, label: 'Editar Bot' },
  { to: '/payment', icon: DollarSign, label: 'Pagamento' },
  { to: '/remarketing', icon: Send, label: 'Remarketing' },
  { to: '/subscriptions', icon: Users, label: 'Assinaturas' },
  { to: '/transactions', icon: CreditCard, label: 'Transações' },
  { to: '/statistics', icon: BarChart3, label: 'Estatísticas' },
  { to: '/cron-logs', icon: Clock, label: 'Automações' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { selectedBot, bots, selectBot, loading } = useBot();
  const [showBotSelector, setShowBotSelector] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo DINOBOT */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            {/* Ícone Dinossauro SVG */}
            <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8.5V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v1.5c-1.66 0-3 1.34-3 3V13c0 .55.45 1 1 1h1v6c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h4v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-6h1c.55 0 1-.45 1-1v-1.5c0-1.66-1.34-3-3-3zM6 7h12v1H6V7zm11 13h-2v-4H9v4H7v-7h10v7zm3-10h-2V9h2v1z"/>
            </svg>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DINOBOT</h1>
              <p className="text-xs text-gray-500">Sistema de Bots</p>
            </div>
          </div>

          {/* Seletor de Bot */}
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
          ) : bots.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setShowBotSelector(!showBotSelector)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedBot?.bot_name || 'Selecione um bot'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{selectedBot?.bot_username || 'nenhum'}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showBotSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown de Bots */}
              {showBotSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                  {bots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => {
                        selectBot(bot.id);
                        setShowBotSelector(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                        selectedBot?.id === bot.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedBot?.id === bot.id ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            selectedBot?.id === bot.id ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {bot.bot_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">@{bot.bot_username}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 px-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">Nenhum bot criado</p>
              <p className="text-xs text-yellow-600 mt-1">Crie seu primeiro bot!</p>
            </div>
          )}
        </div>

        {/* Fechar mobile */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 lg:hidden">
          <span className="text-sm font-medium text-gray-700">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
