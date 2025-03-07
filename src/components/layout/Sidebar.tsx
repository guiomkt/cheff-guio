import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Utensils, 
  MessagesSquare,
  Settings,
  BarChart4,
  ClipboardList,
  Clock
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, active, onClick }: SidebarItemProps) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent-foreground/10",
        active ? "bg-accent-foreground/10 font-medium" : "text-accent-foreground/80"
      )}
      onClick={onClick}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

interface SidebarProps {
  onNavItemClick?: () => void;
}

export function Sidebar({ onNavItemClick }: SidebarProps) {
  const location = useLocation();
  const routes = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/',
    },
    {
      label: 'Reservas',
      icon: Calendar,
      to: '/reservas',
    },
    {
      label: 'Fila de Espera',
      icon: Clock,
      to: '/fila',
    },
    {
      label: 'Mesas',
      icon: Utensils,
      to: '/mesas',
    },
    {
      label: 'Clientes',
      icon: Users,
      to: '/clientes',
    },
    {
      label: 'Cardápio',
      icon: ClipboardList,
      to: '/cardapio',
    },
    {
      label: 'Atendimento',
      icon: MessagesSquare,
      to: '/chat',
    },
    {
      label: 'CRM',
      icon: Users,
      to: '/crm',
    },
    {
      label: 'Insights',
      icon: BarChart4,
      to: '/insights',
    },
    {
      label: 'Configurações',
      icon: Settings,
      to: '/configuracoes',
    }
  ];

  return (
    <div className="chefguio-sidebar h-full border-r border-border">
      <div className="py-4 px-2">
        <div className="mb-6 px-4 flex items-center justify-center">
          <h2 className="text-primary font-bold text-xl">ChefGuio</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)] px-1">
          <div className="space-y-1 py-2">
            {routes.map((route) => (
              <SidebarItem
                key={route.to}
                icon={route.icon}
                label={route.label}
                to={route.to}
                active={location.pathname === route.to}
                onClick={onNavItemClick}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}