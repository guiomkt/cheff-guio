import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  QrCode, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppSettingsProps {
  restaurantId: string | null;
}

export function WhatsAppSettings({ restaurantId }: WhatsAppSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'pending'>('disconnected');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [lastConnected, setLastConnected] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const { toast } = useToast();

  // Fetch WhatsApp settings
  useEffect(() => {
    async function fetchSettings() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('whatsapp_integrations')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setWhatsappStatus(data.status as 'connected' | 'disconnected' | 'pending');
          setQrCodeUrl(data.qr_code_url);
          setLastConnected(data.last_connected);
        }
        
        // Fetch recent messages for monitoring
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (messagesError) throw messagesError;
        
        setRecentMessages(messages || []);
      } catch (error) {
        console.error('Error fetching WhatsApp settings:', error);
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível carregar as configurações do WhatsApp.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSettings();
  }, [restaurantId]);

  // Generate new QR code
  const handleGenerateQr = async () => {
    setIsGeneratingQr(true);
    try {
      // In a real app, this would call your WhatsApp service
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WhatsAppConnection');
      setWhatsappStatus('pending');
      
      toast({
        title: 'QR Code gerado',
        description: 'Escaneie o QR Code com seu WhatsApp para conectar.',
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: 'Erro ao gerar QR Code',
        description: 'Não foi possível gerar um novo QR Code.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
          <CardDescription>
            Status atual da conexão com o WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {whatsappStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-500">Conectado</span>
                </>
              ) : whatsappStatus === 'pending' ? (
                <>
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-500">Aguardando Conexão</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-500">Desconectado</span>
                </>
              )}
              {lastConnected && (
                <span className="text-sm text-muted-foreground ml-2">
                  Última conexão: {format(new Date(lastConnected), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateQr}
                disabled={isGeneratingQr}
              >
                {isGeneratingQr ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Gerar QR Code
                  </>
                )}
              </Button>
              
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reconectar
              </Button>
            </div>
          </div>
          
          {qrCodeUrl && whatsappStatus === 'pending' && (
            <div className="mt-6 flex flex-col items-center">
              <img 
                src={qrCodeUrl} 
                alt="WhatsApp QR Code" 
                className="w-48 h-48 border rounded-lg"
              />
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                Abra o WhatsApp no seu celular, vá em Configurações &gt; Dispositivos conectados &gt; Conectar um dispositivo
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento</CardTitle>
          <CardDescription>
            Monitore a saúde da conexão e mensagens recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Taxa de Entrega</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">98.5%</div>
                  <p className="text-xs text-muted-foreground">
                    Últimas 24 horas
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tempo de Resposta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2s</div>
                  <p className="text-xs text-muted-foreground">
                    Média últimos 5 minutos
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Mensagens/Hora</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">245</div>
                  <p className="text-xs text-muted-foreground">
                    Pico de hoje
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-4">Mensagens Recentes</h4>
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mensagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMessages.map((message, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {format(new Date(message.created_at), 'HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {message.sender_type === 'customer' ? 'Recebida' : 'Enviada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              message.is_delivered 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {message.is_delivered ? 'Entregue' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {message.content}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Backup e Restauração</CardTitle>
          <CardDescription>
            Faça backup das suas conversas e configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Backup Automático</h4>
                <p className="text-sm text-muted-foreground">
                  Realizar backup diário das conversas
                </p>
              </div>
              <Switch checked={true} />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Baixar Backup
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Restaurar Backup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}