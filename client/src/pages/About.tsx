import { Heart, Users, Target, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sobre Nós</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Somos uma plataforma dedicada a democratizar o acesso a recursos gráficos de qualidade, 
            conectando designers e inspirando criatividade.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Nossa Missão</h2>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            Facilitar o acesso a recursos gráficos de alta qualidade para designers, empreendedores e 
            criativos, proporcionando ferramentas que transformam ideias em projetos visuais impactantes. 
            Acreditamos que todos merecem ter acesso a materiais de design profissionais, independentemente 
            do orçamento ou experiência.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-900">Paixão pelo Design</h3>
            </div>
            <p className="text-gray-600">
              Cada recurso em nossa plataforma é criado com amor e dedicação por designers 
              apaixonados que entendem as necessidades da comunidade criativa.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <h3 className="text-xl font-semibold text-gray-900">Comunidade</h3>
            </div>
            <p className="text-gray-600">
              Construímos uma comunidade colaborativa onde designers compartilham conhecimento, 
              se inspiram mutuamente e crescem profissionalmente juntos.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Nossa História</h2>
          </div>
          <div className="space-y-4 text-gray-700">
            <p>
              O DesignAuto nasceu da necessidade de democratizar o acesso a recursos gráficos de qualidade. 
              Percebemos que muitos profissionais e empreendedores enfrentavam dificuldades para encontrar 
              materiais de design acessíveis e de alta qualidade.
            </p>
            <p>
              Fundada por uma equipe de designers experientes, nossa plataforma se tornou um hub criativo 
              onde milhares de profissionais encontram inspiração e recursos para seus projetos. Oferecemos 
              desde templates simples até designs complexos, sempre priorizando a qualidade e usabilidade.
            </p>
            <p>
              Hoje, continuamos crescendo e evoluindo, sempre ouvindo nossa comunidade e adaptando nossos 
              serviços às necessidades reais dos profissionais de design e marketing.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">1000+</div>
            <div className="text-gray-600">Recursos Disponíveis</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">5000+</div>
            <div className="text-gray-600">Usuários Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
            <div className="text-gray-600">Designers Colaboradores</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">10000+</div>
            <div className="text-gray-600">Downloads Realizados</div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-blue-600 rounded-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Quer Saber Mais?</h3>
          <p className="text-blue-100 mb-6">
            Entre em contato conosco para dúvidas, sugestões ou parcerias.
          </p>
          <a 
            href="mailto:suporte@designauto.com.br" 
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Entrar em Contato
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;