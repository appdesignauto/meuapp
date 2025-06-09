import { Link } from 'wouter';
import { 
  LayoutDashboard, 
  Heart, 
  Download, 
  Users, 
  PlayCircle, 
  Settings, 
  PenTool,
  Zap
} from 'lucide-react';

const QuickAccess = () => {
  const quickAccessItems = [
    {
      icon: LayoutDashboard,
      label: 'Painel',
      href: '/painel',
      description: 'Acesse seu dashboard completo',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    {
      icon: Heart,
      label: 'Favoritos',
      href: '/painel/favoritas',
      description: 'Suas artes salvas',
      color: 'bg-red-50 text-red-600 hover:bg-red-100'
    },
    {
      icon: Download,
      label: 'Downloads',
      href: '/painel/downloads',
      description: 'Histórico de downloads',
      color: 'bg-green-50 text-green-600 hover:bg-green-100'
    },
    {
      icon: Users,
      label: 'Comunidade',
      href: '/comunidade',
      description: 'Conecte-se com outros usuários',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
    },
    {
      icon: PlayCircle,
      label: 'Videoaulas',
      href: '/videoaulas',
      description: 'Tutoriais exclusivos',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
    },
    {
      icon: PenTool,
      label: 'Ferramentas',
      href: '/ferramentas',
      description: 'Recursos de design',
      color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
    },
    {
      icon: Settings,
      label: 'Perfil',
      href: '/painel/perfil',
      description: 'Configurações da conta',
      color: 'bg-gray-50 text-gray-600 hover:bg-gray-100'
    },
    {
      icon: Zap,
      label: 'Premium',
      href: '/painel/assinatura',
      description: 'Gerencie sua assinatura',
      color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100'
    }
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
            <Zap className="h-4 w-4" />
            Acesso Premium
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Acesso Rápido
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Navegue facilmente pelas principais funcionalidades da sua conta premium
          </p>
        </div>

        {/* Grid de ícones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {quickAccessItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={index} href={item.href}>
                <div className="group relative bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl p-6 transition-all duration-200 hover:shadow-md cursor-pointer">
                  {/* Ícone */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3 transition-colors duration-200 ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  {/* Label */}
                  <h3 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-gray-900">
                    {item.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent group-hover:from-blue-50/20 group-hover:to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Call to action adicional */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Explore todas as funcionalidades da sua conta premium
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickAccess;