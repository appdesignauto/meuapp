import React from 'react';
import { Construction } from 'lucide-react';

export default function VideoaulasPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          {/* Ícone de construção */}
          <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-8">
            <Construction className="w-12 h-12 text-orange-600" />
          </div>
          
          {/* Título */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vídeo-aulas
          </h1>
          
          {/* Mensagem em desenvolvimento */}
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-orange-600 mb-4">
              Em Desenvolvimento
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Esta seção está sendo preparada com cuidado para oferecer o melhor conteúdo educativo. 
              Em breve você terá acesso a cursos completos de design automotivo e tutoriais exclusivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}