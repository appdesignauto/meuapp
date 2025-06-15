import { Link } from 'wouter';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CallToAction = () => {
  return (
    <section className="py-16 bg-neutral-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-8 md:mb-0 md:w-1/2">
            <h2 className="text-3xl font-bold mb-4">Pronto para revolucionar suas vendas?</h2>
            <p className="text-neutral-300 text-lg mb-6">
              Junte-se a milhares de vendedores que já melhoraram seus resultados com o DesignAuto App.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-3">
                  Cadastre-se
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="bg-transparent border border-white hover:bg-white hover:text-neutral-900 text-white px-6 py-3"
                onClick={() => {
                  const artsSection = document.getElementById('arts-showcase');
                  if (artsSection) {
                    artsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Ver demonstração
              </Button>
            </div>
          </div>
          
          <div className="md:w-1/3">
            <div className="bg-neutral-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Assine e economize</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                  <span>Acesso a todo o catálogo</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                  <span>Atualizações semanais</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                  <span>Edição personalizada</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                  <span>Suporte exclusivo</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                  <span>Garantia de 30 dias</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-2" />
                  <span>Acesso imediato</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
