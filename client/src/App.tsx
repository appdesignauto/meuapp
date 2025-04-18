import { Switch, Route, Router, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ScrollToTop } from "@/hooks/useScrollTop";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Collections from "@/pages/Collections";
import Categories from "@/pages/Categories";
import CategoryPage from "@/pages/CategoryPage";
import ArtsPage from "@/pages/ArtsPage";
import ArtDetail from "@/pages/ArtDetail";
import Designers from "@/pages/Designers";
import DesignerProfile from "@/pages/DesignerProfile";
import AdminDashboard from "@/pages/admin/Dashboard";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Páginas do Painel do Usuário
import { ProtectedPainelRoute } from "@/components/painel/ProtectedPainelRoute";
import PainelInicio from "@/pages/painel/PainelInicio";
import PainelArtes from "@/pages/painel/PainelArtes";
import PainelFavoritas from "@/pages/painel/PainelFavoritas";
import PainelSeguindo from "@/pages/painel/PainelSeguindo";
import PainelDownloads from "@/pages/painel/PainelDownloads";
import PainelAssinatura from "@/pages/painel/PainelAssinatura";
import PainelPerfil from "@/pages/painel/PainelPerfil";

// Componente para decidir se mostra o layout padrão
function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // Não mostrar o layout padrão para páginas administrativas ou do painel
  if (location.startsWith('/admin') || location.startsWith('/painel')) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      {/* Rotas públicas */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/collections" component={Collections} />
      <Route path="/categories" component={Categories} />
      <Route path="/categories/:slug" component={CategoryPage} />
      <Route path="/arts" component={ArtsPage} />
      <Route path="/arts/:id" component={ArtDetail} />
      <Route path="/designers" component={Designers} />
      <Route path="/designers/:username" component={DesignerProfile} />
      
      {/* Rotas do Painel do Usuário */}
      <ProtectedPainelRoute path="/painel/inicio" component={PainelInicio} />
      <ProtectedPainelRoute path="/painel/artes" component={PainelArtes} />
      <ProtectedPainelRoute path="/painel/favoritas" component={PainelFavoritas} />
      <ProtectedPainelRoute path="/painel/seguindo" component={PainelSeguindo} />
      <ProtectedPainelRoute path="/painel/downloads" component={PainelDownloads} />
      <ProtectedPainelRoute path="/painel/assinatura" component={PainelAssinatura} />
      <ProtectedPainelRoute path="/painel/perfil" component={PainelPerfil} />
      
      {/* Redirecionamento da raiz do painel para /painel/inicio */}
      <Route path="/painel">
        {() => {
          window.location.href = "/painel/inicio";
          return null;
        }}
      </Route>
      
      {/* Rotas Administrativas */}
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        roles={['admin', 'designer_adm']} 
      />
      <ProtectedRoute 
        path="/admin/:page" 
        component={AdminDashboard}
        roles={['admin', 'designer_adm']} 
      />
      
      {/* Página não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
