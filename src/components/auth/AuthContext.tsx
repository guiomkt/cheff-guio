import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useOnboardingStore } from '../../store/onboardingStore'

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
  onboardingStatus: {
    completed: boolean
    currentStep: number
  } | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, userData?: object) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  checkOnboardingStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState<{
    completed: boolean
    currentStep: number
  } | null>(null)
  const { setCurrentStep } = useOnboardingStore()

  // Função para verificar o status do onboarding
  const checkOnboardingStatus = async () => {
    if (!user) return

    try {
      // Buscar informações do restaurante associado ao usuário
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, onboarding_completed, onboarding_step')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 é o código para "nenhum resultado encontrado"
        console.error('Erro ao verificar status do onboarding:', error)
        return
      }

      if (data) {
        // Atualizar o estado com as informações do onboarding
        setOnboardingStatus({
          completed: data.onboarding_completed || false,
          currentStep: data.onboarding_step || 1,
        })

        // Atualizar o estado do onboarding no store
        setCurrentStep(data.onboarding_step || 1)
      } else {
        // Se não houver restaurante, considerar como não tendo iniciado o onboarding
        setOnboardingStatus({
          completed: false,
          currentStep: 1,
        })
      }
    } catch (error) {
      console.error('Erro ao verificar status do onboarding:', error)
    }
  }

  useEffect(() => {
    // Obter a sessão atual
    const getSession = async () => {
      setLoading(true)
      try {
        const { data } = await supabase.auth.getSession()
        setSession(data.session)
        setUser(data.session?.user ?? null)

        // Se houver um usuário autenticado, verificar o status do onboarding
        if (data.session?.user) {
          await checkOnboardingStatus()
        }
      } catch (error) {
        console.error('Erro ao obter sessão:', error)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      // Se o evento for de login ou token atualizado e houver um usuário, verificar o status do onboarding
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user) {
        await checkOnboardingStatus()
      }

      setLoading(false)
    })

    // Limpar listener ao desmontar
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Função para fazer login
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        // Verificar o status do onboarding após login bem-sucedido
        await checkOnboardingStatus()
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  // Função para registrar
  const signUp = async (email: string, password: string, userData?: object) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })
      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  // Função para sair
  const signOut = async () => {
    await supabase.auth.signOut()
    setOnboardingStatus(null)
  }

  // Função para redefinir senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      return { error }
    } catch (error: any) {
      return { error }
    }
  }

  const value = {
    session,
    user,
    loading,
    onboardingStatus,
    signIn,
    signUp,
    signOut,
    resetPassword,
    checkOnboardingStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personalizado para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
