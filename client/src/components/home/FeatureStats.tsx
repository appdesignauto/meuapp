import { Images, FileText, Laptop, RefreshCw } from 'lucide-react';

const FeatureStats = () => {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 rounded-xl bg-white shadow-md p-6 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-50 p-2.5 rounded-full mb-2">
              <Images className="text-blue-600 h-5 w-5" />
            </div>
            <span className="text-neutral-700 text-sm">+3.000 Artes Editáveis</span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-50 p-2.5 rounded-full mb-2">
              <FileText className="text-blue-600 h-5 w-5" />
            </div>
            <span className="text-neutral-700 text-sm">Múltiplos Formatos</span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-50 p-2.5 rounded-full mb-2">
              <Laptop className="text-blue-600 h-5 w-5" />
            </div>
            <span className="text-neutral-700 text-sm">Edição Online</span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-50 p-2.5 rounded-full mb-2">
              <RefreshCw className="text-blue-600 h-5 w-5" />
            </div>
            <span className="text-neutral-700 text-sm">Atualizações Constantes</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureStats;