import { Check, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PricingSection = () => {
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para revolucionar suas vendas?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já melhoraram seus resultados com o DesignAuto App.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Plano Mensal */}
          <Card className="relative border-2 border-gray-700 bg-gray-800 hover:border-gray-600 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center pb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Plano Mensal</h3>
              <div className="flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-400">R$ 47</span>
                <span className="text-gray-400 ml-2">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Acesso a todo o catálogo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Atualizações semanais</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Edição personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Suporte exclusivo</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3">
                Assinar Premium
              </Button>
            </CardContent>
          </Card>

          {/* Plano Semestral */}
          <Card className="relative border-2 border-orange-500 bg-gray-800 hover:border-orange-400 transition-all duration-300 shadow-lg hover:shadow-xl">
            {/* Badge de destaque */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-orange-500 text-white px-4 py-1 rounded-full font-medium">
                <Star className="h-4 w-4 mr-1" />
                Mais Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-6 pt-8">
              <h3 className="text-xl font-semibold text-white mb-2">Plano Semestral</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl font-bold text-orange-400">R$ 97</span>
                <span className="text-gray-400 ml-2">/6 meses</span>
              </div>
              <div className="text-sm text-green-400 font-medium">
                Economize R$ 185 por semestre
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Acesso a todo o catálogo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Atualizações semanais</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Edição personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Suporte exclusivo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 font-medium">6 meses pelo preço de 2</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 font-medium">
                Assinar Premium
              </Button>
            </CardContent>
          </Card>

          {/* Plano Anual */}
          <Card className="relative border-2 border-purple-500 bg-gray-800 hover:border-purple-400 transition-all duration-300 shadow-lg hover:shadow-xl">
            {/* Badge de destaque */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-500 text-white px-4 py-1 rounded-full font-medium">
                <Crown className="h-4 w-4 mr-1" />
                Melhor Valor
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-6 pt-8">
              <h3 className="text-xl font-semibold text-white mb-2">Plano Anual</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-3xl font-bold text-purple-400">R$ 147</span>
                <span className="text-gray-400 ml-2">/ano</span>
              </div>
              <div className="text-sm text-green-400 font-medium">
                Economize R$ 417 por ano
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Acesso a todo o catálogo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Atualizações semanais</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Edição personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300">Suporte exclusivo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 font-medium">12 meses pelo preço de 3</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 font-medium">
                Assinar Premium
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Garantia */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Pagamento 100% seguro • Cancele quando quiser • Garantia de 7 dias
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;