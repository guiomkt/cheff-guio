import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
  redirectPath?: string
  requireOnboardingComplete?: boolean
}

export function ProtectedRoute({
  children,
  redirectPath = '/login',
  requireOnboardingComplete = false,
}: ProtectedRouteProps) {
  const { user, loading, onboardingStatus } = useAuth()
  const location = useLocation()

  if (loading) {
    // Exibir um indicador de carregamento enquanto verifica a autenticação
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Se o usuário não estiver autenticado, redirecionar para a página de login
  if (!user) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  // Se a rota requer onboarding completo e o usuário não completou, redirecionar para o onboarding
  if (requireOnboardingComplete && onboardingStatus && !onboardingStatus.completed) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  // Se o usuário estiver autenticado e atender aos requisitos de onboarding, renderizar o conteúdo protegido
  return <>{children}</>
}
