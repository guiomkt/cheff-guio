import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, User, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useAuth } from '../auth/AuthContext'

interface HeaderProps {
  title?: string
  children?: ReactNode
}

export function Header({ title, children }: HeaderProps) {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  // Obter as iniciais do nome do usuário para o avatar
  const getUserInitials = () => {
    if (!user || !user.user_metadata?.name) {
      return 'CG' // Fallback para Chef Guio
    }

    const name = user.user_metadata.name as string
    const parts = name.split(' ')

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase()
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <header className="chefguio-header flex h-16 items-center px-4 md:px-6 justify-between">
      <div className="flex items-center">
        {children}
        <h1 className="text-lg font-semibold">{title || 'Dashboard'}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar>
                <AvatarFallback className="bg-primary text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
