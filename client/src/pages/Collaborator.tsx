import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Upload, Users, Star, CheckCircle } from 'lucide-react';

const collaboratorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  experience: z.string().min(1, 'Selecione seu nível de experiência'),
  specialties: z.string().min(10, 'Descreva suas especialidades (mínimo 10 caracteres)'),
  portfolio: z.string().url('URL do portfólio inválida').optional().or(z.literal('')),
  motivation: z.string().min(50, 'Conte-nos mais sobre sua motivação (mínimo 50 caracteres)'),
  tools: z.string().min(10, 'Liste as ferramentas que utiliza (mínimo 10 caracteres)'),
  availability: z.string().min(1, 'Selecione sua disponibilidade'),
  terms: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
});

type CollaboratorForm = z.infer<typeof collaboratorSchema>;

const Collaborator = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<CollaboratorForm>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      experience: '',
      specialties: '',
      portfolio: '',
      motivation: '',
      tools: '',
      availability: '',
      terms: false,
    },
  });

  const onSubmit = async (data: CollaboratorForm) => {
    setIsSubmitting(true);
    
    try {
      // Simular envio do formulário
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Entraremos em contato em breve.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Recebemos sua candidatura para se tornar um colaborador. Nossa equipe irá analisar seu perfil e entrar em contato em breve.
            </p>
            <Button onClick={() => setIsSubmitted(false)} className="w-full">
              Enviar Nova Solicitação
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Torne-se um Colaborador</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Junte-se à nossa comunidade de designers talentosos e compartilhe sua criatividade com milhares de profissionais.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Palette className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Exponha seu Trabalho</h3>
            <p className="text-gray-600">Tenha seus designs vistos por milhares de usuários ativos da plataforma.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ganhe Reconhecimento</h3>
            <p className="text-gray-600">Construa sua reputação como designer e crie um portfólio sólido.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Upload className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Compartilhe Facilmente</h3>
            <p className="text-gray-600">Plataforma simples e intuitiva para upload e gerenciamento dos seus trabalhos.</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Formulário de Candidatura</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de Experiência *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione seu nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="iniciante">Iniciante (0-2 anos)</SelectItem>
                          <SelectItem value="intermediario">Intermediário (2-5 anos)</SelectItem>
                          <SelectItem value="avancado">Avançado (5-10 anos)</SelectItem>
                          <SelectItem value="expert">Expert (+10 anos)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidades *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva suas especialidades (ex: design gráfico, logos, flyers, redes sociais...)"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Liste suas principais áreas de expertise em design
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Portfólio</FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://seu-portfolio.com ou perfil no Behance/Dribbble"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Compartilhe o link do seu portfólio online (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tools"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ferramentas que Utiliza *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste as principais ferramentas de design que você domina (ex: Adobe Photoshop, Illustrator, Figma, Canva...)"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Quanto tempo pode dedicar?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parcial">Tempo parcial (algumas horas por semana)</SelectItem>
                        <SelectItem value="regular">Regular (algumas horas por dia)</SelectItem>
                        <SelectItem value="integral">Tempo integral (dedicação exclusiva)</SelectItem>
                        <SelectItem value="eventual">Eventual (projetos específicos)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Por que quer ser um colaborador? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Conte-nos sobre sua motivação para se juntar à nossa equipe de colaboradores..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Compartilhe suas expectativas e objetivos (mínimo 50 caracteres)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        Aceito os termos e condições para colaboradores *
                      </FormLabel>
                      <FormDescription>
                        Ao marcar esta opção, você concorda com nossos termos de colaboração e política de direitos autorais.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Candidatura'}
              </Button>
            </form>
          </Form>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center text-gray-600">
          <p>
            Dúvidas sobre o programa de colaboradores? Entre em contato: 
            <a href="mailto:suporte@designauto.com.br" className="text-blue-600 hover:text-blue-800 ml-1">
              suporte@designauto.com.br
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Collaborator;