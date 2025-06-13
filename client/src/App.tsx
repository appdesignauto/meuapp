import { Switch, Route, Router, useLocation } from "wouter";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ScrollToTop } from "@/hooks/useScrollTop";
import { ThemeProvider } from "@/components/theme-provider";
import { PopupContainer } from "@/components/Popup";
import { HelmetProvider } from "react-helmet-async";
import DynamicFavicon from "@/components/global/DynamicFavicon";
import { measureWebVitals } from "./lib/measureWebVitals";
import { useMetaPixel } from "@/hooks/useMetaPixel";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageViewTracker from "@/components/PageViewTracker";
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
import UpdatedDashboard from "@/pages/admin/UpdatedDashboard";
import FinanceiroPage from "@/pages/admin/Financeiro";
import LogoUploadPage from "@/pages/admin/LogoUploadPage";
import TestSubscriptionSettingsPage from "@/pages/admin/TestSubscriptionSettingsPage";
import StorageTestPage from "@/pages/admin/StorageTestPage";
import AddArtMultiFormatPage from "@/pages/admin/AddArtMultiFormat";
import GerenciarCursosPage from "@/pages/admin/GerenciarCursos";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import AvatarTestPage from "@/pages/AvatarTestPage";
import SupabaseAuthTestPage from "@/pages/SupabaseAuthTestPage";
import VideoaulasPage from "@/pages/videoaulas";
import ComunidadePage from "@/pages/comunidade";
import FerramentasPage from "@/pages/ferramentas";
import WebhookDiagnostics from "@/pages/webhook-diagnostics";
import WebhookLogsPage from "@/pages/admin/WebhookLogs";

// Páginas do Footer
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Collaborator from "@/pages/Collaborator";
import Affiliate from "@/pages/Affiliate";
import PV from "@/pages/PV";

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
  
  // Não mostrar o layout padrão para páginas administrativas, do painel ou página de vendas
  if (location.startsWith('/admin') || location.startsWith('/painel') || location === '/pv') {
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
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas legadas para compatibilidade - redirecionam para /auth */}
      <Route path="/login">
        {() => {
          window.location.href = "/auth?tab=login";
          return null;
        }}
      </Route>
      <Route path="/register">
        {() => {
          window.location.href = "/auth?tab=register";
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
      <Route path="/categorias" component={Categories} />
      <Route path="/categorias/:slug" component={CategoryPage} />
      <Route path="/artes" component={ArtsPage} />
      {/* Rota de redirecionamento para manter compatibilidade com /arts */}
      <Route path="/arts">
        {() => {
          window.location.href = "/artes";
          return null;
        }}
      </Route>
      <Route path="/artes/:id" component={ArtDetail} />
      <Route path="/designers" component={Designers} />
      <Route path="/designers/:username" component={DesignerProfile} />
      <Route path="/planos" component={PlanosPage} />
      <Route path="/videoaulas" component={VideoaulasPage} />
      <Route path="/ferramentas" component={FerramentasPage} />
      <Route path="/ferramentas/categoria/:slug" component={FerramentasPage} />
      
      {/* Páginas do Footer */}
      <Route path="/sobre" component={About} />
      <Route path="/duvidas" component={FAQ} />
      <Route path="/termos" component={Terms} />
      <Route path="/privacidade" component={Privacy} />
      <Route path="/colaboradores" component={Collaborator} />
      <Route path="/afiliacao" component={Affiliate} />
      <Route path="/pv" component={PV} />
      <Route path="/suporte">
        {() => {
          const SuportePage = lazy(() => import("@/pages/suporte/index"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <SuportePage />
            </Suspense>
          );
        }}
      </Route>
      {/* Rota de redirecionamento para manter compatibilidade */}
      <Route path="/support">
        {() => {
          window.location.href = "/suporte";
          return null;
        }}
      </Route>
      <Route path="/videoaulas/:id">
        {() => {
          const VideoLessonPage = lazy(() => import("@/pages/videoaulas/[id]"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <VideoLessonPage />
            </Suspense>
          );
        }}
      </Route>
      
      {/* Rotas da Comunidade */}
      <Route path="/comunidade" component={ComunidadePage} />
      <Route path="/comunidade/post/:id">
        {() => {
          const PostDetailPage = lazy(() => import("@/pages/comunidade/post/[id]"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <PostDetailPage />
            </Suspense>
          );
        }}
      </Route>
      <ProtectedRoute path="/comunidade/criar" component={() => {
          const CreatePostPage = lazy(() => import("@/pages/comunidade/criar"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <CreatePostPage />
            </Suspense>
          );
        }} />
      
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
        component={UpdatedDashboard} 
        roles={['admin', 'designer_adm', 'suporte']} 
      />
      <ProtectedRoute 
        path="/admin/financeiro" 
        component={FinanceiroPage} 
        roles={['admin']} 
      />
      <ProtectedRoute
        path="/admin/storage-test"
        component={StorageTestPage}
        roles={['admin']}
      />
      <ProtectedRoute 
        path="/admin/logo-upload" 
        component={LogoUploadPage}
        roles={['admin']} 
      />
      <ProtectedRoute 
        path="/admin/add-art-multi" 
        component={AddArtMultiFormatPage}
        roles={['admin']} 
      />
      {/* Rota normal protegida que requer papel de admin */}
      <ProtectedRoute 
        path="/admin/test-subscription-settings" 
        component={TestSubscriptionSettingsPage}
        roles={['admin']} 
      />

      
      {/* Rota alternativa sem proteção para teste */}
      <Route path="/test-subscription-settings">
        <TestSubscriptionSettingsPage />
      </Route>
      <ProtectedRoute 
        path="/admin/gerenciar-cursos" 
        component={GerenciarCursosPage}
        roles={['admin', 'designer_adm']} 
      />
      <ProtectedRoute 
        path="/admin/webhook-diagnostics" 
        component={WebhookDiagnostics}
        roles={['admin']} 
      />
      <ProtectedRoute 
        path="/admin/webhooks" 
        component={WebhookLogsPage}
        roles={['admin']} 
      />
      <ProtectedRoute
        path="/admin/analytics"
        component={() => {
          const AnalyticsPage = lazy(() => import("@/pages/admin/analytics"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <AnalyticsPage />
            </Suspense>
          );
        }}
        roles={['admin']}
      />
      <ProtectedRoute
        path="/admin/app-config"
        component={() => {
          const AppConfigPage = lazy(() => import("@/pages/admin/AppConfigPage"));
          return (
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
              <AppConfigPage />
            </Suspense>
          );
        }}
        roles={['admin']}
      />

      <ProtectedRoute 
        path="/admin/webhooks" 
        component={WebhookLogsPage}
        roles={['admin']} 
      />
      <ProtectedRoute 
        path="/admin/:page" 
        component={UpdatedDashboard}
        roles={['admin', 'designer_adm']} 
      />
      
      {/* Página não encontrada */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Inicializar métricas de Web Vitals quando o componente é montado
  useEffect(() => {
    // Iniciar medição de métricas de performance
    measureWebVitals();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <SupabaseAuthProvider>
              <Router>
                <ScrollToTop />
                <DynamicFavicon />
                <PageViewTracker />
                <AppLayout>
                  <AppRoutes />
                </AppLayout>
              </Router>
              <Toaster />
              <PopupContainer />
            </SupabaseAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
