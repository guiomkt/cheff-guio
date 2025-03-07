import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { TableManagement } from './pages/TableManagement';
import { Chat } from './pages/Chat';
import { Crm } from './pages/Crm';
import { WaitingList } from './pages/WaitingList';
import { Settings } from './pages/Settings';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { supabase } from './lib/supabase';

// Páginas temporárias para demonstrar navegação
const TemporaryPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <h1 className="text-2xl font-bold">{title} - Em Construção</h1>
  </div>
);

function App() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // Check if any restaurants exist with onboarding completed
        const { data, error } = await supabase
          .from('restaurants')
          .select('id')
          .eq('onboarding_completed', true)
          .limit(1);

        if (error) {
          console.error('Error checking onboarding status:', error);
          setHasCompletedOnboarding(false);
        } else {
          // If we found at least one restaurant with completed onboarding
          setHasCompletedOnboarding(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error:', error);
        setHasCompletedOnboarding(false);
      } finally {
        setLoading(false);
      }
    }

    checkOnboardingStatus();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="chefguio-theme">
      <Router>
        <Routes>
          {/* Redirect to onboarding if not completed */}
          <Route path="/" element={
            hasCompletedOnboarding ? (
              <MainLayout title="Dashboard">
                <Dashboard />
              </MainLayout>
            ) : (
              <Navigate to="/onboarding" replace />
            )
          } />
          
          {/* Onboarding route */}
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Other routes */}
          <Route path="/reservas" element={
            <MainLayout title="Reservas">
              <TemporaryPage title="Reservas" />
            </MainLayout>
          } />
          
          <Route path="/fila" element={
            <MainLayout title="Fila de Espera">
              <WaitingList />
            </MainLayout>
          } />
          
          <Route path="/mesas" element={
            <MainLayout title="Gestão de Mesas">
              <TableManagement />
            </MainLayout>
          } />
          
          <Route path="/clientes" element={
            <MainLayout title="Clientes">
              <TemporaryPage title="Clientes" />
            </MainLayout>
          } />
          
          <Route path="/cardapio" element={
            <MainLayout title="Cardápio">
              <TemporaryPage title="Cardápio" />
            </MainLayout>
          } />
          
          <Route path="/chat" element={
            <MainLayout title="Atendimento">
              <Chat />
            </MainLayout>
          } />
          
          <Route path="/crm" element={
            <MainLayout title="CRM">
              <Crm />
            </MainLayout>
          } />
          
          <Route path="/insights" element={
            <MainLayout title="Insights">
              <TemporaryPage title="Insights" />
            </MainLayout>
          } />
          
          <Route path="/configuracoes" element={
            <MainLayout title="Configurações">
              <Settings />
            </MainLayout>
          } />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;