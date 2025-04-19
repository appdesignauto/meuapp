import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative min-h-[500px] overflow-hidden bg-gradient-to-r from-primary/90 to-primary/40 p-8 flex flex-col justify-center items-center text-white">
      <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
      
      <div className="relative z-10 text-center max-w-xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">DesignAuto Premium</h2>
        <p className="text-xl mb-6">
          Acesso ilimitado a mais de 3.000 designs exclusivos para o seu negócio automotivo
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="font-bold text-lg mb-1">Designs Exclusivos</div>
            <p className="text-sm opacity-80">Artes profissionais para destacar seu negócio</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="font-bold text-lg mb-1">Catálogo Completo</div>
            <p className="text-sm opacity-80">Lavagem, mecânica, funilaria, vendas e muito mais</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="font-bold text-lg mb-1">Edite online</div>
            <p className="text-sm opacity-80">Personalize com suas informações sem complicação</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="font-bold text-lg mb-1">Downloads Ilimitados</div>
            <p className="text-sm opacity-80">Baixe quantas artes quiser com sua assinatura</p>
          </div>
        </div>
        
        <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
          <span>Conheça os planos disponíveis</span>
          <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary to-transparent opacity-50" />
    </div>
  );
}