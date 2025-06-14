import { Check, ArrowRight, Shield, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PricingSection = () => {
  return (
    <section className="relative py-20 bg-slate-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4 mr-2" />
            Planos Empresariais
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Escolha o plano ideal para seu negócio
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            Ferramentas profissionais para elevar suas vendas no setor automotivo
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          
          {/* Plano Mensal */}
          <div className="relative bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 group">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-600 mb-6">Ideal para começar</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-slate-900">R$ 47</span>
                <span className="text-slate-600 ml-2">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Milhares de artes exclusivas</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Atualizações semanais</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Edição personalizada</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Suporte por email</span>
              </li>
            </ul>
            
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 group-hover:bg-slate-700">
              Começar agora
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Plano Semestral - Destacado */}
          <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white transform lg:scale-105 shadow-2xl">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-orange-500 text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg">
                MAIS POPULAR
              </div>
            </div>
            
            <div className="text-center mb-8 pt-4">
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-blue-100 mb-6">Para crescer rapidamente</p>
              <div className="mb-2">
                <span className="text-5xl font-bold">R$ 97</span>
                <span className="text-blue-100 ml-2">/semestre</span>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-100 rounded-full text-sm">
                Economize R$ 185
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-300 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-blue-100">Tudo do plano Starter</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-300 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-blue-100">Conteúdo premium exclusivo</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-300 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-blue-100">Suporte prioritário</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-300 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-blue-100">Análises de performance</span>
              </li>
            </ul>
            
            <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 text-lg font-semibold rounded-xl transition-all duration-300">
              Escolher Professional
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Plano Anual */}
          <div className="relative bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 group">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-600 mb-6">Máximo desempenho</p>
              <div className="mb-2">
                <span className="text-5xl font-bold text-slate-900">R$ 147</span>
                <span className="text-slate-600 ml-2">/ano</span>
              </div>
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Economize R$ 417
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Tudo do plano Professional</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Consultoria personalizada</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">API integração</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-slate-700">Suporte 24/7 dedicado</span>
              </li>
            </ul>
            
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-300 group-hover:bg-slate-700">
              Escolher Enterprise
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h4 className="font-semibold text-slate-900 mb-2">Pagamento Seguro</h4>
            <p className="text-slate-600 text-sm">Certificação SSL e criptografia de dados</p>
          </div>
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h4 className="font-semibold text-slate-900 mb-2">+5.000 Clientes</h4>
            <p className="text-slate-600 text-sm">Empresas confiam em nossa plataforma</p>
          </div>
          <div className="text-center">
            <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h4 className="font-semibold text-slate-900 mb-2">Garantia 7 dias</h4>
            <p className="text-slate-600 text-sm">Devolução completa se não ficar satisfeito</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;