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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Download, 
  Upload, 
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupSettingsProps {
  restaurantId: string | null;
}

export function BackupSettings({ restaurantId }: BackupSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [autoBackup, setAutoBackup] = useState(true);
  const { toast } = useToast();

  // Fetch backup settings and history
  useEffect(() => {
    async function fetchBackups() {
      if (!restaurantId) return;
      
      try {
        const { data, error } = await supabase
          .from('backups')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setBackups(data || []);
      } catch (error) {
        console.error('Error fetching backups:', error);
        toast({
          title: 'Erro ao carregar backups',
          description: 'Não foi possível carregar o histórico de backups.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBackups();
  }, [restaurantId]);

  // Create backup
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Backup criado',
        description: 'O backup foi criado com sucesso.',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Erro ao criar backup',
        description: 'Não foi possível criar o backup.',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  // Restore backup
  const handleRestoreBackup = async (backupId: string) => {
    setIsRestoring(true);
    try {
      // Simulate backup restoration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Backup restaurado',
        description: 'O backup foi restaurado com sucesso.',
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: 'Erro ao restaurar backup',
        description: 'Não foi possível restaurar o backup.',
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
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
          <CardTitle>Backup Automático</CardTitle>
          <CardDescription>
            Configure o backup automático dos dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Diário</Label>
              <p className="text-sm text-muted-foreground">
                Realizar backup automático todos os dias
              </p>
            </div>
            <Switch
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCreateBackup}
              disabled={isBackingUp}
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Backup...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Criar Backup Agora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Backups</CardTitle>
          <CardDescription>
            Visualize e restaure backups anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {backups.map((backup, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        Backup {format(new Date(backup.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </h4>
                      <Badge variant="outline" className={
                        backup.status === 'success' ? 'bg-green-100 text-green-800' :
                        backup.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {backup.status === 'success' ? 'Concluído' :
                         backup.status === 'failed' ? 'Falhou' :
                         'Em Andamento'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(backup.created_at), 'HH:mm', { locale: ptBR })}
                      </span>
                      {backup.size && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {backup.size} MB
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={isRestoring || backup.status !== 'success'}
                    >
                      {isRestoring ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span className="ml-2">Restaurar</span>
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                      <span className="ml-2">Baixar</span>
                    </Button>
                  </div>
                </div>
              ))}
              
              {backups.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhum backup encontrado.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleCreateBackup}
                    disabled={isBackingUp}
                  >
                    {isBackingUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando Backup...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Criar Primeiro Backup
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Logs de Atividade</CardTitle>
          <CardDescription>
            Histórico de atividades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {[
                { action: "Backup automático criado", status: "success", timestamp: new Date() },
                { action: "Tentativa de restauração", status: "failed", timestamp: new Date(Date.now() - 3600000) },
                { action: "Backup manual criado", status: "success", timestamp: new Date(Date.now() - 7200000) }
              ].map((log, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>{log.action}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(log.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}