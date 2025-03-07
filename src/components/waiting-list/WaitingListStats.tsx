import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { WaitingListStats as StatsType } from '@/hooks/useWaitingList';

interface WaitingListStatsProps {
  stats: StatsType;
}

export function WaitingListStats({ stats }: WaitingListStatsProps) {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Na Fila
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCount + stats.notifiedCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalPeopleWaiting} pessoas aguardando
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Tempo Médio de Espera
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageWaitTime} min</div>
          <p className="text-xs text-muted-foreground">
            Hoje: {stats.todayAverageWaitTime} min
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            Acomodados Hoje
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.seatedTodayCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalPeopleSeatedToday} pessoas acomodadas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">
            No-Shows Hoje
          </CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.noShowTodayCount}</div>
          <p className="text-xs text-muted-foreground">
            {stats.noShowPercentage}% de desistência
          </p>
        </CardContent>
      </Card>
    </>
  );
}