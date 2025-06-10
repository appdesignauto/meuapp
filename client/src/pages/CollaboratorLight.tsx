import { useState } from 'react';
import { Link } from 'wouter';
import { Users, Mail, Phone, Star } from 'lucide-react';

const CollaboratorLight = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/collaboration-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          experience: 'iniciante',
          specialties: formData.message || 'Design gráfico',
          portfolio: '',
          motivation: formData.message || 'Quero colaborar com a DesignAuto',
          tools: 'Canva, Photoshop',
          availability: 'meio-periodo',
          terms: true
        }),
      });

      if (response.ok) {
        alert('Solicitação enviada com sucesso!');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        alert('Erro ao enviar solicitação. Tente novamente.');
      }
    } catch (error) {
      alert('Erro ao enviar solicitação. Tente novamente.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Torne-se um Colaborador</h1>
            <p className="text-gray-600">
              Junte-se à nossa comunidade de designers talentosos e compartilhe sua criatividade.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Reconhecimento</h3>
              <p className="text-sm text-gray-600">Seus trabalhos serão destacados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Mail className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Networking</h3>
              <p className="text-sm text-gray-600">Conecte-se com outros designers</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Phone className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">Suporte</h3>
              <p className="text-sm text-gray-600">Acompanhamento personalizado</p>
            </div>
          </div>

          {/* Simple Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone/WhatsApp *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Conte-nos sobre sua experiência e interesse em colaborar..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Enviar Solicitação
            </button>
          </form>

          {/* Contact Info */}
          <div className="mt-8 text-center text-gray-600 border-t pt-6">
            <p>
              Dúvidas sobre o programa de colaboradores? Entre em contato: 
              <a href="mailto:suporte@designauto.com.br" className="text-purple-600 hover:text-purple-800 ml-1">
                suporte@designauto.com.br
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorLight;