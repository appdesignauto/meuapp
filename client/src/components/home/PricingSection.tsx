import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PricingSection = () => {
  return (
    <section className="relative py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Escolha seu plano
          </h2>
          <p className="text-gray-600 text-lg">
            Escolha apenas a forma de pagamento que melhor se adapta a você.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* Plano Mensal */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-lg transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mensal</h3>
              <div className="mb-3">
                <span className="text-4xl font-bold text-orange-500">R$47</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Pagamento mensal</p>
              <div className="text-green-500 text-sm font-medium">
                +R$50 de DESCONTO
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Acesso a todas as artes</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Edições ilimitadas</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Atualizações semanais</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Aplicativo exclusivo</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Suporte prioritário</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Sem compromisso</span>
              </li>
            </ul>
            
            <Button 
              variant="outline" 
              className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 py-3 rounded-full font-medium"
            >
              Começar Agora
            </Button>
          </div>

          {/* Plano Semestral - Destacado */}
          <div className="bg-orange-500 rounded-xl p-6 relative text-white hover:shadow-xl transition-all duration-300 transform md:scale-105">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-orange-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                Mais Popular
              </div>
            </div>
            
            <div className="text-center mb-6 pt-2">
              <h3 className="text-lg font-semibold mb-3">Semestral</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold">R$36,70</span>
                <span className="text-sm opacity-90">/mês</span>
              </div>
              <p className="text-sm opacity-90 mb-3">R$197,00 à vista</p>
              <div className="text-sm font-medium bg-white/20 rounded-full px-3 py-1 inline-block">
                +R$85 de DESCONTO
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                <span>Acesso a todas as artes</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                <span>Edições ilimitadas</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                <span>Atualizações semanais</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                <span>Aplicativo exclusivo</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-white mr-3 flex-shrink-0" />
                <span>Sem compromisso</span>
              </li>
            </ul>
            
            <Button className="w-full bg-white text-orange-500 hover:bg-gray-50 py-3 rounded-full font-medium">
              Começar Agora
            </Button>
          </div>

          {/* Plano Anual */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-lg transition-all duration-300">
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                Melhor Valor
              </div>
            </div>
            
            <div className="text-center mb-6 pt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Anual</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-orange-500">R$29,70</span>
                <span className="text-sm text-gray-600">/mês</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">R$297 à vista</p>
              <div className="text-green-500 text-sm font-medium">
                +R$267 de DESCONTO!
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Acesso a todas as artes</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Edições ilimitadas</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Atualizações semanais</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Aplicativo exclusivo</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Suporte prioritário</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Sem compromisso</span>
              </li>
            </ul>
            
            <Button 
              variant="outline" 
              className="w-full border-orange-500 text-orange-500 hover:bg-orange-50 py-3 rounded-full font-medium"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;