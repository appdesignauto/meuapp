import { Images, FileText, Laptop, RefreshCw } from 'lucide-react';

const FeatureStats = () => {
  return (
    <section className="py-12 bg-gradient-to-r from-blue-50/80 to-blue-100/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 rounded-xl bg-white shadow-xl p-8 max-w-5xl mx-auto transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-100 p-3 rounded-full mb-3 shadow-md">
              <Images className="text-blue-600 h-6 w-6" />
            </div>
            <span className="text-neutral-700 font-medium text-sm">+3.000 Artes Editáveis</span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-100 p-3 rounded-full mb-3 shadow-md">
              <FileText className="text-blue-600 h-6 w-6" />
            </div>
            <span className="text-neutral-700 font-medium text-sm">Múltiplos Formatos</span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-100 p-3 rounded-full mb-3 shadow-md">
              <Laptop className="text-blue-600 h-6 w-6" />
            </div>
            <span className="text-neutral-700 font-medium text-sm">Edição Online</span>
          </div>
          <div className="flex flex-col items-center text-center p-3">
            <div className="bg-blue-100 p-3 rounded-full mb-3 shadow-md">
              <RefreshCw className="text-blue-600 h-6 w-6" />
            </div>
            <span className="text-neutral-700 font-medium text-sm">Atualizações Constantes</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureStats;