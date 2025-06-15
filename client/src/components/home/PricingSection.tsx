import { Check, Award, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PricingSection = () => {
  return (
    <section className="relative py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="text-blue-600 text-sm font-semibold tracking-wide uppercase mb-4">
            PLANOS
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Seu crescimento começa aqui
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600">
            Escolha um plano e tenha acesso imediato a designs exclusivos, suporte premium e resultados consistentes.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          
          {/* Plano Mensal */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-lg transition-all duration-300">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mensal</h3>
              <div className="mb-3">
                <span className="text-4xl font-bold text-blue-600">R$47</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Pagamento mensal</p>
              <div className="text-green-500 text-xs font-medium border border-green-500 rounded-full px-2 py-0.5 inline-block">
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
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-full font-medium"
            >
              Começar Agora
            </Button>
          </div>

          {/* Plano Anual - Destacado no meio */}
          <div className="rounded-xl p-6 relative text-white hover:shadow-xl transition-all duration-300 transform md:scale-105 bg-blue-600">
            {/* Best Value Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                Melhor Valor
              </div>
            </div>
            
            <div className="text-center mb-6 pt-2">
              <h3 className="text-lg font-semibold mb-3">Anual</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold">R$29,70</span>
                <span className="text-sm opacity-90">/mês</span>
              </div>
              <p className="text-sm opacity-90 mb-3">R$297 à vista</p>
              <div className="text-xs font-medium bg-white/20 rounded-full px-2 py-0.5 inline-block">
                +R$267 de DESCONTO!
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
            
            <Button className="w-full bg-white text-blue-700 hover:bg-gray-50 py-3 rounded-full font-medium">
              Começar Agora
            </Button>
          </div>

          {/* Plano Semestral */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 relative hover:shadow-lg transition-all duration-300">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                Mais Popular
              </div>
            </div>
            
            <div className="text-center mb-6 pt-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Semestral</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-blue-600">R$36,70</span>
                <span className="text-sm text-gray-600">/mês</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">R$197,00 à vista</p>
              <div className="text-green-500 text-xs font-medium border border-green-500 rounded-full px-2 py-0.5 inline-block">
                +R$85 de DESCONTO
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
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-full font-medium"
            >
              Começar Agora
            </Button>
          </div>
        </div>

        {/* Trust/Guarantee Section */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            
            {/* Garantia de 7 dias */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Garantia de 30 dias</h3>
              <p className="text-sm text-gray-600">
                Não ficou satisfeito? Devolvemos 100% do seu dinheiro em até 30 dias.
              </p>
            </div>

            {/* Suporte Premium */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Suporte Premium</h3>
              <p className="text-sm text-gray-600">
                Nossa equipe está pronta para ajudar você a aproveitar ao máximo a plataforma.
              </p>
            </div>

            {/* Sempre Atualizado */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Sempre Atualizado</h3>
              <p className="text-sm text-gray-600">
                Novos templates e recursos adicionados semanalmente, sem custo extra.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;