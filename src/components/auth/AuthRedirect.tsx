import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function AuthRedirect() {
  const { user, loading, onboardingStatus } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Não fazer nada enquanto estiver carregando
    if (loading) return

    // Se o usuário não estiver autenticado, não fazer nada
    // (o ProtectedRoute já cuidará do redirecionamento para o login)
    if (!user) return

    // Ignorar redirecionamento se já estiver em uma das páginas de autenticação
    const authPaths = ['/login', '/register', '/reset-password', '/update-password']
    if (authPaths.includes(location.pathname)) return

    // Se o status do onboarding ainda não foi carregado, aguardar
    if (onboardingStatus === null) return

    // Se o usuário já completou o onboarding e está na página de onboarding, redirecionar para o dashboard
    if (onboardingStatus.completed && location.pathname === '/onboarding') {
      navigate('/', { replace: true })
      return
    }

    // Se o usuário não completou o onboarding e não está na página de onboarding, redirecionar para o onboarding
    if (!onboardingStatus.completed && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
      return
    }
  }, [user, loading, onboardingStatus, navigate, location.pathname])

  // Este componente não renderiza nada, apenas executa a lógica de redirecionamento
  return null
}
