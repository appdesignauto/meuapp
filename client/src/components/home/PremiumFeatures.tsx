import { Link } from 'wouter';
import { UnlockKeyhole, Edit, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PremiumFeatures = () => {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-4">
            Acesso exclusivo
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Potencialize suas vendas com DesignAuto Premium</h2>
          <p className="text-primary-foreground/80 max-w-3xl mx-auto text-lg">
            Acesse recursos exclusivos e desfrute de todas as vantagens da plataforma sem restrições.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-10 p-8 rounded-xl backdrop-blur-sm">
            <div className="text-secondary-500 text-3xl mb-4">
              <UnlockKeyhole className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Acesso Ilimitado</h3>
            <p className="text-primary-foreground/80">
              Mais de 300 artes disponíveis para download sem restrições de quantidade.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-8 rounded-xl backdrop-blur-sm">
            <div className="text-secondary-500 text-3xl mb-4">
              <Edit className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Edição Personalizada</h3>
            <p className="text-primary-foreground/80">
              Acesse e edite as artes diretamente no Canva ou Google Drive com um clique.
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 p-8 rounded-xl backdrop-blur-sm">
            <div className="text-secondary-500 text-3xl mb-4">
              <Calendar className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Prioridade de Acesso</h3>
            <p className="text-primary-foreground/80">
              Acesse novas artes e coleções antes de todos os outros usuários.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
          <Link href="/planos">
            <Button className="bg-white text-primary hover:bg-neutral-100 px-8 py-6 rounded-lg font-medium text-lg shadow-lg">
              Conheça o Premium
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PremiumFeatures;
