import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Como faço para baixar os recursos gráficos?",
      answer: "Para baixar qualquer recurso, basta clicar no item desejado, visualizar os detalhes e clicar no botão 'Download'. Alguns recursos podem exigir assinatura premium."
    },
    {
      question: "Qual a diferença entre conta gratuita e premium?",
      answer: "A conta gratuita permite acesso limitado aos recursos básicos, enquanto a premium oferece downloads ilimitados, acesso a recursos exclusivos, suporte prioritário e recursos em alta resolução."
    },
    {
      question: "Os recursos podem ser usados comercialmente?",
      answer: "Sim, todos os recursos da nossa plataforma podem ser utilizados para projetos comerciais. Verifique sempre a licença específica de cada item na página de detalhes."
    },
    {
      question: "Como posso cancelar minha assinatura?",
      answer: "Você pode cancelar sua assinatura a qualquer momento através do seu painel de usuário, na seção 'Minha Conta' > 'Assinatura'. O cancelamento será efetivo no final do período pago."
    },
    {
      question: "Vocês oferecem recursos personalizados?",
      answer: "Atualmente focamos em nossa biblioteca de recursos prontos. Para projetos personalizados, entre em contato através do nosso suporte para avaliarmos a possibilidade."
    },
    {
      question: "Como posso contribuir com recursos para a plataforma?",
      answer: "Designers podem se candidatar para colaborar através da nossa página de colaboradores. Avaliamos cada candidatura e oferecemos parcerias para criadores qualificados."
    },
    {
      question: "Existe limite de downloads para usuários premium?",
      answer: "Não, usuários premium têm downloads ilimitados de todos os recursos disponíveis na plataforma, incluindo os exclusivos para assinantes."
    },
    {
      question: "Como funciona o sistema de afiliados?",
      answer: "Nosso programa de afiliados permite que você ganhe comissões indicando novos usuários. Entre em contato através da página de solicitação de afiliação para mais detalhes."
    },
    {
      question: "Que formatos de arquivo vocês disponibilizam?",
      answer: "Oferecemos diversos formatos como PSD, AI, EPS, PNG, JPG, SVG e PDF, dependendo do tipo de recurso. Todos os formatos são especificados na página de cada item."
    },
    {
      question: "Como posso reportar um problema com algum arquivo?",
      answer: "Use a opção 'Denunciar arquivo' disponível em cada recurso, ou entre em contato diretamente pelo nosso suporte. Investigamos todos os relatos rapidamente."
    },
    {
      question: "Vocês têm política de reembolso?",
      answer: "Sim, oferecemos reembolso integral dentro de 7 dias da compra, caso você não esteja satisfeito com nossos serviços. Entre em contato pelo suporte para solicitar."
    },
    {
      question: "Os arquivos são compatíveis com que softwares?",
      answer: "Nossos recursos são compatíveis com os principais softwares de design como Adobe Photoshop, Illustrator, InDesign, Figma, Canva e outros editores populares."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre nossa plataforma e serviços.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Não encontrou sua resposta?
          </h3>
          <p className="text-gray-600 mb-6">
            Nossa equipe de suporte está sempre pronta para ajudar com qualquer dúvida específica.
          </p>
          <a 
            href="mailto:suporte@designauto.com.br" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Entrar em Contato
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;