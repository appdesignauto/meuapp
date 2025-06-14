import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PricingSection = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pronto para revolucionar suas vendas?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já melhoraram seus resultados com o DesignAuto App.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plano Mensal */}
          <Card className="relative border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Plano Mensal</h3>
              <div className="flex items-center justify-center">
                <span className="text-4xl font-bold text-blue-600">R$ 47</span>
                <span className="text-gray-500 ml-2">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Acesso a todo o catálogo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Atualizações semanais</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Edição personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Suporte exclusivo</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3">
                Assinar Premium
              </Button>
            </CardContent>
          </Card>

          {/* Plano Anual - Destaque */}
          <Card className="relative border-2 border-blue-500 hover:border-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl">
            {/* Badge de destaque */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-600 text-white px-4 py-1 rounded-full font-medium">
                <Star className="h-4 w-4 mr-1" />
                Mais Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-8 pt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Plano Anual</h3>
              <div className="flex items-center justify-center mb-2">
                <span className="text-4xl font-bold text-blue-600">R$ 147</span>
                <span className="text-gray-500 ml-2">/ano</span>
              </div>
              <div className="text-sm text-green-600 font-medium">
                Economize R$ 417 por ano
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Acesso a todo o catálogo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Atualizações semanais</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Edição personalizada</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">Suporte exclusivo</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">12 meses pelo preço de 3</span>
                </li>
              </ul>
              <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 font-medium">
                Assinar Premium
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Garantia */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            💳 Pagamento 100% seguro • 🔒 Cancele quando quiser • ✅ Garantia de 7 dias
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;