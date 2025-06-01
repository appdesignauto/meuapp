import { FileText, Calendar } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Termos de Uso</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Última atualização: 01 de junho de 2025</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceite dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Ao acessar e utilizar a plataforma DesignAuto, você concorda em cumprir e estar sujeito aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              O DesignAuto é uma plataforma digital que oferece recursos gráficos, templates e materiais de design para download. Nossos serviços incluem:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Acesso a biblioteca de recursos gráficos</li>
              <li>Downloads de templates e materiais de design</li>
              <li>Assinaturas premium para acesso ilimitado</li>
              <li>Comunidade de designers e colaboradores</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Conta de Usuário</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para utilizar determinados recursos, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável por:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Manter a confidencialidade de sua senha</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar-nos imediatamente sobre uso não autorizado</li>
              <li>Fornecer informações verdadeiras e atualizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Licença de Uso</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Concedemos uma licença limitada, não exclusiva e revogável para usar nossos recursos gráficos. Esta licença permite:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Uso comercial e pessoal dos recursos baixados</li>
              <li>Modificação e adaptação dos materiais</li>
              <li>Incorporação em projetos próprios ou de clientes</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Não é permitido redistribuir, revender ou compartilhar os recursos originais sem modificação.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Pagamentos e Assinaturas</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Para assinaturas premium, aplicam-se as seguintes condições:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Pagamentos processados através de plataformas seguras</li>
              <li>Renovação automática até cancelamento</li>
              <li>Política de reembolso de 7 dias</li>
              <li>Preços sujeitos a alteração com aviso prévio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              Todos os direitos autorais, marcas registradas e outros direitos de propriedade intelectual relacionados aos recursos da plataforma permanecem com seus respectivos proprietários. O DesignAuto possui licenças adequadas para distribuir todo o conteúdo oferecido.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Conduta do Usuário</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Ao utilizar nossa plataforma, você concorda em não:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violar quaisquer leis locais, estaduais ou federais</li>
              <li>Interferir no funcionamento da plataforma</li>
              <li>Tentar acessar áreas restritas sem autorização</li>
              <li>Compartilhar credenciais de acesso com terceiros</li>
              <li>Usar a plataforma para atividades ilegais ou prejudiciais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-700 leading-relaxed">
              O DesignAuto não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar nossos serviços. Fornecemos a plataforma "como está", sem garantias de qualquer tipo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modificações dos Termos</h2>
            <p className="text-gray-700 leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação. O uso continuado da plataforma após as modificações constituirá aceite dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contato</h2>
            <p className="text-gray-700 leading-relaxed">
              Para questões sobre estes termos, entre em contato conosco através do email: 
              <a href="mailto:suporte@designauto.com.br" className="text-blue-600 hover:text-blue-800 ml-1">
                suporte@designauto.com.br
              </a>
            </p>
          </section>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              © 2025 DesignAuto - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;