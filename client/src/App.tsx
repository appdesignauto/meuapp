import { Switch, Route, Router, useLocation } from "wouter";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ScrollToTop } from "@/hooks/useScrollTop";
import { ThemeProvider } from "@/components/theme-provider";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Collections from "@/pages/Collections";
import Categories from "@/pages/Categories";
import CategoryPage from "@/pages/CategoryPage";
import ArtsPage from "@/pages/ArtsPage";
import ArtDetail from "@/pages/ArtDetail";
import Designers from "@/pages/Designers";
import DesignerProfile from "@/pages/DesignerProfile";
import PlanosPage from "@/pages/PlanosPage";
import ProfilePage from "@/pages/profile-page";
import AdminDashboard from "@/pages/admin/Dashboard";
import LogoUploadPage from "@/pages/admin/LogoUploadPage";
import StorageTestPage from "@/pages/admin/StorageTestPage";
import AddArtMultiFormatPage from "@/pages/admin/AddArtMultiFormat";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import AvatarTestPage from "@/pages/AvatarTestPage";
import SupabaseAuthTestPage from "@/pages/SupabaseAuthTestPage";

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
      {/* Rotas de autenticação */}
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={AuthPage} />
      
      {/* Rota legada para compatibilidade - redireciona para /login */}
      <Route path="/auth">
        {() => {
          window.location.href = "/login";
          return null;
        }}
      </Route>
      <Route path="/password/forgot">
        {() => {
          const ForgotPasswordPage = lazy(() => import("@/pages/password/forgot"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <ForgotPasswordPage />
            </Suspense>
          );
        }}
      </Route>
      <Route path="/password/reset">
        {() => {
          const ResetPasswordPage = lazy(() => import("@/pages/password/reset"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <ResetPasswordPage />
            </Suspense>
          );
        }}
      </Route>
      {/* Rota de redirecionamento para manter compatibilidade com emails antigos */}
      <Route path="/reset-password">
        {() => {
          window.location.href = "/password/reset" + window.location.search;
          return null;
        }}
      </Route>
      <Route path="/email/verify">
        {() => {
          const EmailVerificationPage = lazy(() => import("@/pages/email/verify"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <EmailVerificationPage />
            </Suspense>
          );
        }}
      </Route>
      {/* Rota adicional para verificação de email para compatibilidade */}
      <Route path="/email-verification">
        {() => {
          window.location.href = "/email/verify";
          return null;
        }}
      </Route>
      <Route path="/auth/supabase">
        {() => {
          const SupabaseAuthPage = lazy(() => import("@/pages/supabase-auth-page"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <SupabaseAuthPage />
            </Suspense>
          );
        }}
      </Route>
      <Route path="/collections" component={Collections} />
      <Route path="/categories" component={Categories} />
      <Route path="/categories/:slug" component={CategoryPage} />
      <Route path="/arts" component={ArtsPage} />
      <Route path="/arts/:id" component={ArtDetail} />
      <Route path="/designers" component={Designers} />
      <Route path="/designers/:username" component={DesignerProfile} />
      <Route path="/planos" component={PlanosPage} />
      
      {/* Rota de perfil do usuário */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
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
      
      {/* Página de teste de autenticação Supabase */}
      <Route
        path="/supabase-auth-test"
        component={SupabaseAuthTestPage}
      />
      
      {/* Página de teste de upload de avatar */}
      <ProtectedRoute
        path="/avatar-test"
        component={AvatarTestPage}
      />
      
      {/* Rotas Administrativas */}
      <ProtectedRoute 
        path="/admin" 
        component={AdminDashboard} 
        roles={['admin', 'designer_adm']} 
      />
      <ProtectedRoute
        path="/admin/storage-test"
        component={StorageTestPage}
        roles={['admin']}
      />
      <ProtectedRoute 
        path="/admin/logo-upload" 
        component={LogoUploadPage}
        roles={['admin', 'designer_adm']} 
      />
      <ProtectedRoute 
        path="/admin/add-art-multi" 
        component={AddArtMultiFormatPage}
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
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <SupabaseAuthProvider>
            <Router>
              <ScrollToTop />
              <AppLayout>
                <AppRoutes />
              </AppLayout>
            </Router>
            <Toaster />
          </SupabaseAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
