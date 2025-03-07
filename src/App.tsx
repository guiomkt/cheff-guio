import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { Dashboard } from './pages/Dashboard'
import { Onboarding } from './pages/Onboarding'
import { TableManagement } from './pages/TableManagement'
import { Chat } from './pages/Chat'
import { Crm } from './pages/Crm'
import { WaitingList } from './pages/WaitingList'
import { Settings } from './pages/Settings'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ResetPassword } from './pages/ResetPassword'
import { UpdatePassword } from './pages/UpdatePassword'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { AuthProvider } from './components/auth/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AuthRedirect } from './components/auth/AuthRedirect'
import { supabase } from './lib/supabase'

// Páginas temporárias para demonstrar navegação
const TemporaryPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <h1 className="text-2xl font-bold">{title} - Em Construção</h1>
  </div>
)

// Componente para exibir mensagens de estado
function AuthMessage() {
  const location = useLocation()
  const state = location.state as { message?: string } | null

  return state?.message ? (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
      {state.message}
    </div>
  ) : null
}

function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // Check if any restaurants exist with onboarding completed
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('onboarding_completed', true)
          .limit(1)

        if (error) {
          console.error('Error checking onboarding status:', error)
          setHasCompletedOnboarding(false)
        } else {
          // If we found at least one restaurant with completed onboarding
          setHasCompletedOnboarding(data && data.length > 0)
        }
      } catch (error) {
        console.error('Error:', error)
        setHasCompletedOnboarding(false)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="chefguio-theme">
      <AuthProvider>
        <Router>
          <AuthRedirect />
          <AuthMessage />
          <Routes>
            {/* Rotas de autenticação */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />

            {/* Rota de onboarding - não requer onboarding completo */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Dashboard e outras rotas - requerem onboarding completo */}
            <Route
              path="/"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Dashboard">
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Other routes */}
            <Route
              path="/reservas"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Reservas">
                    <TemporaryPage title="Reservas" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/fila"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Fila de Espera">
                    <WaitingList />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/mesas"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Gestão de Mesas">
                    <TableManagement />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/clientes"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Clientes">
                    <TemporaryPage title="Clientes" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/cardapio"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Cardápio">
                    <TemporaryPage title="Cardápio" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/chat"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Atendimento">
                    <Chat />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/crm"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="CRM">
                    <Crm />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/insights"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Insights">
                    <TemporaryPage title="Insights" />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute requireOnboardingComplete>
                  <MainLayout title="Configurações">
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
