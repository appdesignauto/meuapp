import { Link } from 'wouter';
import { 
  Image, 
  Grid3X3, 
  Users, 
  PlayCircle, 
  Scissors,
  Clock,
  Heart,
  KeyRound,
  Zap
} from 'lucide-react';

const QuickAccess = () => {
  const quickAccessItems = [
    {
      icon: Image,
      label: 'Artes',
      href: '/artes',
      description: 'Explore todas as artes',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
    },
    {
      icon: Grid3X3,
      label: 'Categorias',
      href: '/categorias',
      description: 'Navegue por categorias',
      color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
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
      label: 'Tutoriais',
      href: '/videoaulas',
      description: 'Aprenda com videoaulas',
      color: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
    },
    {
      icon: Scissors,
      label: 'Removedor de Fundo',
      href: '/ferramentas',
      description: 'Remova fundos facilmente',
      color: 'bg-green-50 text-green-600 hover:bg-green-100'
    },
    {
      icon: Clock,
      label: 'Meus Designs Recentes',
      href: '/painel/downloads',
      description: 'Seus downloads recentes',
      color: 'bg-amber-50 text-amber-600 hover:bg-amber-100'
    },
    {
      icon: Heart,
      label: 'Favoritas',
      href: '/painel/favoritas',
      description: 'Suas artes favoritas',
      color: 'bg-red-50 text-red-600 hover:bg-red-100'
    },
    {
      icon: KeyRound,
      label: 'Alterar Senha',
      href: '/painel/perfil',
      description: 'Atualize sua senha',
      color: 'bg-slate-50 text-slate-600 hover:bg-slate-100'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 relative overflow-hidden">
      {/* Efeito de fundo sutil */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white/10 to-blue-50/30"></div>
      <div className="relative">
        <div className="container mx-auto px-4">
          {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Acesso Rápido
            </h2>
          </div>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Acesse rapidamente suas ferramentas favoritas
          </p>
        </div>

        {/* Grid de ícones - Layout centralizado com 2 linhas de 4 ícones */}
        <div className="max-w-4xl mx-auto">
          {/* Primeira linha - 4 ícones principais centralizados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            {quickAccessItems.slice(0, 4).map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index} href={item.href}>
                  <div className="group relative bg-white hover:bg-gray-50 border border-blue-100 hover:border-blue-200 rounded-xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer text-center backdrop-blur-sm">
                    {/* Ícone centralizado */}
                    <div className={`mx-auto w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-all duration-200 ${item.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Label centralizado */}
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-gray-900">
                      {item.label}
                    </h3>
                    
                    {/* Description centralizada */}
                    <p className="text-xs text-gray-500 leading-snug">
                      {item.description}
                    </p>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent group-hover:from-blue-50/20 group-hover:to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Segunda linha - 4 ícones secundários centralizados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickAccessItems.slice(4, 8).map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={index + 4} href={item.href}>
                  <div className="group relative bg-white hover:bg-gray-50 border border-blue-100 hover:border-blue-200 rounded-xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer text-center backdrop-blur-sm">
                    {/* Ícone centralizado */}
                    <div className={`mx-auto w-12 h-12 rounded-xl mb-3 flex items-center justify-center transition-all duration-200 ${item.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    {/* Label centralizado */}
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 group-hover:text-gray-900">
                      {item.label}
                    </h3>
                    
                    {/* Description centralizada */}
                    <p className="text-xs text-gray-500 leading-snug">
                      {item.description}
                    </p>

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-transparent group-hover:from-blue-50/20 group-hover:to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>


        </div>
      </div>
    </section>
  );
};

export default QuickAccess;