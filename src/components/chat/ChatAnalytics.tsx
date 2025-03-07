import { useState } from 'react';
import { ChatAnalytics as ChatAnalyticsType } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Users,
  Clock,
  Bot,
  User,
  BarChart4,
  PieChart,
  Calendar,
  ThumbsUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ChatAnalyticsProps {
  analytics: ChatAnalyticsType | null;
}

export function ChatAnalytics({ analytics }: ChatAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('today');
  
  // Mock data for demonstration
  const mockAnalytics = {
    total_conversations: 24,
    new_conversations: 8,
    ai_handled_conversations: 18,
    human_handled_conversations: 6,
    avg_response_time: 120, // seconds
    avg_resolution_time: 480, // seconds
    popular_topics: {
      'reservation': 12,
      'menu': 8,
      'hours': 5,
      'location': 3,
      'prices': 2
    }
  };
  
  // Format time in seconds to minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Calculate percentages
  const aiPercentage = Math.round((mockAnalytics.ai_handled_conversations / mockAnalytics.total_conversations) * 100);
  const humanPercentage = Math.round((mockAnalytics.human_handled_conversations / mockAnalytics.total_conversations) * 100);
  
  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Análise do Atendimento</h3>
            <p className="text-sm text-muted-foreground">
              Veja dados e estatísticas sobre o atendimento ao cliente.
            </p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <MessageSquare className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">253</div>
                  <p className="text-sm text-muted-foreground text-center">
                    Mensagens Enviadas
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">4.2m</div>
                  <p className="text-sm text-muted-foreground text-center">
                    Tempo Médio de Resposta
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">42</div>
                  <p className="text-sm text-muted-foreground text-center">
                    Clientes Atendidos
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <ThumbsUp className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">94%</div>
                  <p className="text-sm text-muted-foreground text-center">
                    Satisfação
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Mensagens por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-end justify-between gap-2 pt-2">
                {[
                  { day: 'Seg', received: 44, sent: 35 },
                  { day: 'Ter', received: 55, sent: 41 },
                  { day: 'Qua', received: 57, sent: 36 },
                  { day: 'Qui', received: 56, sent: 26 },
                  { day: 'Sex', received: 61, sent: 45 },
                  { day: 'Sáb', received: 58, sent: 48 },
                  { day: 'Dom', received: 63, sent: 52 }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex flex-col gap-1" style={{ height: '160px' }}>
                      <div 
                        className="w-8 bg-blue-500 rounded-t-sm" 
                        style={{ height: `${(item.received/65) * 100}%` }}
                      ></div>
                      <div 
                        className="w-8 bg-green-500 rounded-t-sm" 
                        style={{ height: `${(item.sent/65) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-2">{item.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-sm">Recebidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  <span className="text-sm">Enviadas</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Intenção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-64 h-64">
                  {[
                    { name: 'Reserva', value: 35, color: '#3b82f6', startAngle: 0, endAngle: 126 },
                    { name: 'Cardápio', value: 25, color: '#22c55e', startAngle: 126, endAngle: 216 },
                    { name: 'Reclamação', value: 15, color: '#ef4444', startAngle: 216, endAngle: 270 },
                    { name: 'Feedback', value: 10, color: '#f59e0b', startAngle: 270, endAngle: 306 },
                    { name: 'Outros', value: 15, color: '#6b7280', startAngle: 306, endAngle: 360 }
                  ].map((segment, index) => (
                    <div 
                      key={index}
                      className="absolute inset-0 rounded-full overflow-hidden"
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(segment.startAngle * Math.PI / 180)}% ${50 + 50 * Math.sin(segment.startAngle * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 5) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 5) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 10) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 10) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 15) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 15) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 20) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 20) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 25) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 25) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 30) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 30) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 35) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 35) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 40) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 40) * Math.PI / 180)}%, ${50 + 50 * Math.cos((segment.startAngle + 45) * Math.PI / 180)}% ${50 + 50 * Math.sin((segment.startAngle + 45) * Math.PI / 180)}%, ${50 + 50 * Math.cos(segment.endAngle * Math.PI / 180)}% ${50 + 50 * Math.sin(segment.endAngle * Math.PI / 180)}%, 50% 50%)`
                      }}
                    >
                      <div className="w-full h-full" style={{ backgroundColor: segment.color }}></div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: 'Reserva', value: '35%', color: '#3b82f6' },
                    { name: 'Cardápio', value: '25%', color: '#22c55e' },
                    { name: 'Reclamação', value: '15%', color: '#ef4444' },
                    { name: 'Feedback', value: '10%', color: '#f59e0b' },
                    { name: 'Outros', value: '15%', color: '#6b7280' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                      <div className="text-sm whitespace-nowrap">{item.name} <span className="font-medium">{item.value}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Table of recent interactions */}
          <Card>
            <CardHeader>
              <CardTitle>Interações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-medium">Cliente</TableCell>
                    <TableCell className="font-medium">Intenção</TableCell>
                    <TableCell className="font-medium">Última Interação</TableCell>
                    <TableCell className="font-medium">Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>João Silva</TableCell>
                    <TableCell>Reserva</TableCell>
                    <TableCell>Hoje, 13:42</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">Resolvido</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Maria Oliveira</TableCell>
                    <TableCell>Cardápio</TableCell>
                    <TableCell>Hoje, 12:30</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">Resolvido</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pedro Santos</TableCell>
                    <TableCell>Reclamação</TableCell>
                    <TableCell>Ontem, 18:12</TableCell>
                    <TableCell><Badge variant="outline" className="bg-blue-100 text-blue-800">Em Andamento</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ana Ferreira</TableCell>
                    <TableCell>Feedback</TableCell>
                    <TableCell>23/01, 15:45</TableCell>
                    <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">Resolvido</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}