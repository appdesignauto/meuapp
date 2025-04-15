import { Switch, Route, Router, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Collections from "@/pages/Collections";
import Categories from "@/pages/Categories";
import AdminDashboard from "@/pages/admin/Dashboard";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Componente para decidir se mostra o layout padrão
function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  // Não mostrar o layout padrão para páginas administrativas
  if (location.startsWith('/admin')) {
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
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/collections" component={Collections} />
      <Route path="/categories" component={Categories} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
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
