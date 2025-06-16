import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Send, 
  Eye,
  Code,
  RefreshCw,
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  templateKey: string;
  variables: Array<{ name: string; description: string }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  templateKey: string;
  variables: Array<{ name: string; description: string }>;
  isActive: boolean;
}

export default function EmailTemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testData, setTestData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    templateKey: '',
    variables: [],
    isActive: true
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar templates de e-mail",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      templateKey: '',
      variables: [],
      isActive: true
    });
    setEditingTemplate(null);
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      templateKey: template.templateKey,
      variables: template.variables || [],
      isActive: template.isActive
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.htmlContent || !formData.templateKey) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      if (editingTemplate) {
        const response = await fetch(`/api/email-templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao atualizar template');
        }
        
        toast({
          title: "Sucesso",
          description: "Template atualizado com sucesso",
        });
      } else {
        const response = await fetch('/api/email-templates', {
          method: 'POST',
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          throw new Error('Erro ao criar template');
        }
        
        toast({
          title: "Sucesso",
          description: "Template criado com sucesso",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/email-templates/${templateToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir template');
      }
      
      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso",
      });
      
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      await fetchTemplates();
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testTemplate || !testEmail) return;

    try {
      setLoading(true);
      await apiRequest(`/api/email-templates/${testTemplate.id}/test`, {
        method: 'POST',
        body: JSON.stringify({ testEmail, testData }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      toast({
        title: "Sucesso",
        description: "E-mail de teste enviado com sucesso",
      });
      
      setTestDialogOpen(false);
      setTestEmail('');
      setTestData({});
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar e-mail de teste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { name: '', description: '' }]
    }));
  };

  const updateVariable = (index: number, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar E-mails</h2>
          <p className="text-gray-600">Gerencie templates de e-mail enviados via Brevo</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchTemplates}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {loading && templates.length === 0 ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400" />
          <p className="text-gray-500 mt-2">Carregando templates...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center space-x-4">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-gray-500">{template.subject}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inativo
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {template.templateKey}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {template.variables?.length > 0 && (
                      <span>Variáveis: {template.variables.map(v => v.name).join(', ')}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTestTemplate(template);
                        setTestDialogOpen(true);
                      }}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTemplateToDelete(template);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para criar/editar template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do template"
                />
              </div>
              <div>
                <Label htmlFor="templateKey">Chave do Template *</Label>
                <Input
                  id="templateKey"
                  value={formData.templateKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, templateKey: e.target.value }))}
                  placeholder="welcome, password_reset, etc."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Assunto *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Assunto do e-mail"
              />
            </div>

            <div>
              <Label htmlFor="htmlContent">Conteúdo HTML *</Label>
              <Textarea
                id="htmlContent"
                value={formData.htmlContent}
                onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                placeholder="Conteúdo HTML do e-mail"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="textContent">Conteúdo em Texto</Label>
              <Textarea
                id="textContent"
                value={formData.textContent}
                onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                placeholder="Versão em texto simples (opcional)"
                rows={5}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Variáveis do Template</Label>
                <Button type="button" onClick={addVariable} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {formData.variables.map((variable, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="{{name}}"
                      value={variable.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Descrição da variável"
                      value={variable.description}
                      onChange={(e) => updateVariable(index, 'description', e.target.value)}
                      className="flex-2"
                    />
                    <Button
                      type="button"
                      onClick={() => removeVariable(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Template ativo</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de teste de e-mail */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testar Template: {testTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">E-mail de Teste *</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
              />
            </div>

            {testTemplate?.variables && testTemplate.variables.length > 0 && (
              <div>
                <Label>Dados de Teste para Variáveis</Label>
                <div className="space-y-2">
                  {testTemplate.variables.map((variable, index) => (
                    <div key={index}>
                      <Label className="text-sm">{variable.name} - {variable.description}</Label>
                      <Input
                        value={testData[variable.name.replace(/[{}]/g, '')] || ''}
                        onChange={(e) => setTestData(prev => ({
                          ...prev,
                          [variable.name.replace(/[{}]/g, '')]: e.target.value
                        }))}
                        placeholder={`Valor para ${variable.name}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setTestDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleTestEmail} disabled={loading || !testEmail}>
                {loading ? 'Enviando...' : 'Enviar Teste'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de preview */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Assunto</Label>
                <div className="p-2 bg-gray-50 rounded border">{previewTemplate.subject}</div>
              </div>
              <div>
                <Label>Conteúdo HTML</Label>
                <div 
                  className="p-4 bg-white border rounded max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}
                />
              </div>
              {previewTemplate.textContent && (
                <div>
                  <Label>Conteúdo em Texto</Label>
                  <div className="p-2 bg-gray-50 rounded border whitespace-pre-wrap">
                    {previewTemplate.textContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o template "{templateToDelete?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}