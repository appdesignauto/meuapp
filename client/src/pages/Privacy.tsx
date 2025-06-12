import { Shield, Calendar } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Política de Privacidade</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Última atualização: 01 de junho de 2025</span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introdução</h2>
            <p className="text-gray-700 leading-relaxed">
              A DesignAuto valoriza sua privacidade e está comprometida em proteger seus dados pessoais. Esta política explica como coletamos, usamos, armazenamos e protegemos suas informações quando você utiliza nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informações que Coletamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Informações Fornecidas por Você:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Nome, email e senha para criação de conta</li>
                  <li>Informações de perfil opcionais (foto, bio, website)</li>
                  <li>Dados de pagamento para assinaturas premium</li>
                  <li>Comunicações conosco (suporte, feedback)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Informações Coletadas Automaticamente:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Endereço IP e localização aproximada</li>
                  <li>Informações do dispositivo e navegador</li>
                  <li>Dados de uso da plataforma</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Como Utilizamos suas Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos suas informações para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
              <li>Prevenir fraudes e garantir segurança</li>
              <li>Cumprir obrigações legais</li>
              <li>Analisar uso da plataforma para melhorias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Compartilhamento de Informações</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Com prestadores de serviços necessários para operação (processamento de pagamentos, hospedagem)</li>
              <li>Para cumprir obrigações legais ou solicitações governamentais</li>
              <li>Para proteger nossos direitos, propriedade ou segurança</li>
              <li>Em caso de fusão, aquisição ou venda de ativos (com notificação prévia)</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Utilizamos cookies para:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Manter você logado em sua conta</li>
              <li>Lembrar suas preferências</li>
              <li>Analisar o tráfego e uso da plataforma</li>
              <li>Melhorar funcionalidades e experiência</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Você pode controlar o uso de cookies através das configurações do seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Segurança dos Dados</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Implementamos medidas de segurança para proteger suas informações:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Criptografia SSL/TLS para transmissão de dados</li>
              <li>Senhas criptografadas usando algoritmos seguros</li>
              <li>Acesso restrito a dados pessoais pela equipe</li>
              <li>Monitoramento regular de segurança</li>
              <li>Backup seguro de dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Seus Direitos</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Você tem os seguintes direitos sobre seus dados pessoais:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Acessar e obter cópia de seus dados pessoais</li>
              <li>Corrigir informações incorretas ou incompletas</li>
              <li>Solicitar exclusão de seus dados (direito ao esquecimento)</li>
              <li>Restringir o processamento de seus dados</li>
              <li>Portabilidade de dados para outro serviço</li>
              <li>Retirar consentimento a qualquer momento</li>
              <li>Apresentar reclamação às autoridades competentes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Retenção de Dados</h2>
            <p className="text-gray-700 leading-relaxed">
              Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta política, atender requisitos legais ou resolver disputas. Quando não mais necessários, os dados são excluídos de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Transferência Internacional</h2>
            <p className="text-gray-700 leading-relaxed">
              Seus dados podem ser transferidos e processados em servidores localizados fora do Brasil. Quando isso ocorrer, garantimos que medidas adequadas de proteção sejam implementadas conforme a Lei Geral de Proteção de Dados (LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Menores de Idade</h2>
            <p className="text-gray-700 leading-relaxed">
              Nossos serviços não são direcionados a menores de 13 anos. Não coletamos intencionalmente informações pessoais de crianças abaixo desta idade. Se descobrirmos que coletamos dados de menores sem consentimento parental, tomaremos medidas para excluí-los.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Alterações na Política</h2>
            <p className="text-gray-700 leading-relaxed">
              Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas através da plataforma ou por email. O uso continuado dos serviços após as alterações constituirá aceite da nova política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contato</h2>
            <p className="text-gray-700 leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
            </p>
            <div className="mt-4 text-gray-700">
              <p>Email: <a href="mailto:suporte@designauto.com.br" className="text-blue-600 hover:text-blue-800">suporte@designauto.com.br</a></p>
              <p>Assunto: "Proteção de Dados - LGPD"</p>
            </div>
          </section>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              © 2025 DesignAuto - DESIGNAUTO.COM.BR LTDA - CNPJ 37.561.761/0001-00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;