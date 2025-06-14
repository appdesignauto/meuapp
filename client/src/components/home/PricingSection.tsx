import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PricingSection = () => {
  return (
    <section className="relative py-12 md:py-16 bg-neutral-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
            Pronto para revolucionar suas vendas?
          </h2>
          <p className="text-neutral-300 text-base md:text-lg">
            Escolha apenas a forma de pagamento que melhor se adapta a você.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto px-2 md:px-0">
          
          {/* Plano Mensal */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 relative hover:shadow-lg transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mensal</h3>
              <div className="mb-2">
                <span className="text-3xl md:text-4xl font-bold text-blue-800">R$47</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Pagamento mensal</p>
              <div className="text-green-500 text-sm font-medium">
                +R$50 de DESCONTO
              </div>
            </div>
            
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-sm">
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
              className="w-full border-blue-800 text-blue-800 hover:bg-blue-50 py-2 md:py-3 rounded-full font-medium text-sm md:text-base"
            >
              Começar Agora
            </Button>
          </div>

          {/* Plano Semestral - Destacado */}
          <div className="bg-white rounded-xl border-2 border-blue-800 p-4 md:p-6 relative hover:shadow-xl transition-all duration-300 transform md:scale-105">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-900 text-white text-xs font-bold px-3 md:px-4 py-1 rounded-full">
                Mais Popular
              </div>
            </div>
            
            <div className="text-center mb-6 pt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Semestral</h3>
              <div className="mb-1">
                <span className="text-3xl md:text-4xl font-bold text-blue-800">R$36,70</span>
                <span className="text-sm text-gray-600">/mês</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">R$197,00 à vista</p>
              <div className="text-sm font-medium text-green-500">
                +R$85 de DESCONTO
              </div>
            </div>
            
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-sm">
              <li className="flex items-center">
                <Check className="h-4 w-4 text-blue-800 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Acesso a todas as artes</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-blue-800 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Edições ilimitadas</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-blue-800 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Atualizações semanais</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-blue-800 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Aplicativo exclusivo</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-blue-800 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Suporte prioritário</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 text-blue-800 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Sem compromisso</span>
              </li>
            </ul>
            
            <Button className="w-full bg-blue-800 text-white hover:bg-blue-900 py-2 md:py-3 rounded-full font-medium text-sm md:text-base">
              Começar Agora
            </Button>
          </div>

          {/* Plano Anual */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 relative hover:shadow-lg transition-all duration-300">
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white text-xs font-bold px-3 md:px-4 py-1 rounded-full">
                Melhor Valor
              </div>
            </div>
            
            <div className="text-center mb-6 pt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Anual</h3>
              <div className="mb-1">
                <span className="text-3xl md:text-4xl font-bold text-blue-800">R$29,70</span>
                <span className="text-sm text-gray-600">/mês</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">R$297 à vista</p>
              <div className="text-green-500 text-sm font-medium">
                +R$267 de DESCONTO!
              </div>
            </div>
            
            <ul className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-sm">
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
              className="w-full border-blue-800 text-blue-800 hover:bg-blue-50 py-2 md:py-3 rounded-full font-medium text-sm md:text-base"
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