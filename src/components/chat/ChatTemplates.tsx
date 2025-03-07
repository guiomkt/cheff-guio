import { useState } from 'react';
import { ChatTemplate } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  MessageSquare,
  Calendar,
  AlertTriangle,
  ThumbsUp,
  Trash2
} from 'lucide-react';

interface ChatTemplatesProps {
  templates: ChatTemplate[];
  onCreateTemplate: (template: Omit<ChatTemplate, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onDeleteTemplate: (templateId: string) => Promise<boolean>;
  onSelectTemplate: (content: string) => void;
}

export function ChatTemplates({
  templates,
  onCreateTemplate,
  onDeleteTemplate,
  onSelectTemplate
}: ChatTemplatesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    content: string;
    category: string;
  }>({
    name: '',
    content: '',
    category: 'general'
  });
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle dialog open
  const handleOpenDialog = () => {
    setNewTemplate({
      name: '',
      content: '',
      category: 'general'
    });
    setIsDialogOpen(true);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTemplate(prev => ({ ...prev, [name]: value }));
  };

  // Handle select change
  const handleSelectChange = (value: string) => {
    setNewTemplate(prev => ({ ...prev, category: value }));
  };

  // Handle template creation
  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) return;
    
    setIsCreating(true);
    await onCreateTemplate(newTemplate);
    handleCloseDialog();
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    setIsDeleting(true);
    await onDeleteTemplate(templateId);
    setIsDeleting(false);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reservation':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'menu':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'complaint':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'feedback':
        return <ThumbsUp className="h-4 w-4 text-yellow-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  // Group templates by category
  const groupTemplatesByCategory = () => {
    const groups: { [category: string]: ChatTemplate[] } = {};
    
    templates.forEach(template => {
      if (!groups[template.category]) {
        groups[template.category] = [];
      }
      groups[template.category].push(template);
    });
    
    return groups;
  };

  const templateGroups = groupTemplatesByCategory();

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Modelos de Mensagem</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingTemplate(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Modelo
            </Button>
          </div>
          
          {isCreatingTemplate ? (
            <div className="space-y-3 border rounded-md p-3">
              <Textarea
                placeholder="Digite seu modelo de mensagem..."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseDialog}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateTemplate}
                  disabled={!newTemplate.content.trim() || isCreating}
                >
                  {isCreating ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          ) : null}
          
          {Object.entries(templateGroups).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(templateGroups).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <div className="flex items-center mb-2">
                    {getCategoryIcon(category)}
                    <h4 className="text-sm font-medium ml-2">
                      {category === 'general' ? 'Geral' :
                       category === 'reservation' ? 'Reservas' :
                       category === 'menu' ? 'Cardápio' :
                       category === 'complaint' ? 'Reclamações' :
                       category === 'feedback' ? 'Feedback' : 
                       category}
                    </h4>
                  </div>
                  
                  <div className="space-y-2">
                    {categoryTemplates.map(template => (
                      <div
                        key={template.id}
                        className="border rounded-md p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium text-sm">{template.name}</h5>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onSelectTemplate(template.content)}
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span className="sr-only">Usar modelo</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDeleteTemplate(template.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir modelo</span>
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum modelo de mensagem</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie modelos para respostas frequentes
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}