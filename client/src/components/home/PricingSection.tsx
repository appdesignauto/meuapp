import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PricingSection = () => {
  return (
    <section className="relative py-24 bg-gradient-to-r from-gray-800 via-gray-900 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      <div className="relative container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          
          {/* Left Content - Call to Action */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Pronto para revolucionar suas vendas?
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Junte-se a milhares de vendedores que já melhoraram seus resultados com o DesignAuto App.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Cadastre-se
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
              >
                Ver demonstração
              </Button>
            </div>
          </div>

          {/* Right Content - Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Plano Mensal */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">Mensal</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-white">R$ 47</div>
                  <div className="text-sm text-gray-400">/mês</div>
                </div>
              </div>
              
              <ul className="space-y-3 mt-6">
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Acesso a todo o catálogo
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Atualizações semanais
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Edição personalizada
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Suporte exclusivo
                </li>
              </ul>
              
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-all duration-300 group-hover:bg-blue-500">
                Assinar Premium
              </Button>
            </div>

            {/* Plano Semestral */}
            <div className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-2 border-orange-500/60 rounded-2xl p-6 transform hover:scale-105 transition-all duration-300 shadow-2xl shadow-orange-500/20">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MAIS POPULAR
                </div>
              </div>
              
              <div className="text-center space-y-4 pt-3">
                <h3 className="text-lg font-semibold text-white">Semestral</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-orange-400">R$ 97</div>
                  <div className="text-sm text-gray-400">/6 meses</div>
                  <div className="text-xs text-green-400 font-medium">
                    Economize R$ 185
                  </div>
                </div>
              </div>
              
              <ul className="space-y-3 mt-6">
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Acesso a todo o catálogo
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Atualizações semanais
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Edição personalizada
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Suporte exclusivo
                </li>
              </ul>
              
              <Button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-medium transition-all duration-300">
                Assinar Premium
              </Button>
            </div>

            {/* Plano Anual */}
            <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-500/40 rounded-2xl p-6 hover:border-purple-500/80 transition-all duration-300 group hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-white">Anual</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-purple-400">R$ 147</div>
                  <div className="text-sm text-gray-400">/ano</div>
                  <div className="text-xs text-green-400 font-medium">
                    Economize R$ 417
                  </div>
                </div>
              </div>
              
              <ul className="space-y-3 mt-6">
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Acesso a todo o catálogo
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Atualizações semanais
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Edição personalizada
                </li>
                <li className="flex items-center text-sm text-gray-300">
                  <Check className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                  Suporte exclusivo
                </li>
              </ul>
              
              <Button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-300 group-hover:from-purple-400 group-hover:to-purple-500">
                Assinar Premium
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-16">
          <p className="text-sm text-gray-400">
            Pagamento 100% seguro • Cancele quando quiser • Garantia de 7 dias
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;