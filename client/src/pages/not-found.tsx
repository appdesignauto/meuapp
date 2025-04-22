import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  const [isResetPasswordPage, setIsResetPasswordPage] = useState(false);
  
  useEffect(() => {
    // Verificar se é uma página de redefinição de senha com token
    const path = window.location.pathname;
    const isResetPage = path.includes("/reset-password") || path.includes("/password/reset");
    setIsResetPasswordPage(isResetPage);
    
    if (isResetPage) {
      console.log("Página de redefinição de senha não encontrada ou token inválido");
    }
  }, []);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Página Não Encontrada</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            {isResetPasswordPage ? 
              "O link de redefinição de senha parece ser inválido ou expirado." : 
              "A página que você está procurando não existe."}
          </p>

          {isResetPasswordPage && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4 text-left">
              <p className="text-yellow-800 text-sm">
                <strong>Atenção:</strong> Para redefinir sua senha, certifique-se de:
                <br /><br />
                1. Usar o link completo enviado por e-mail<br />
                2. Verificar se o link não foi cortado (deve conter um parâmetro <code>token=</code>)<br />
                3. Solicitar um novo link caso o atual tenha expirado
              </p>
            </div>
          )}
          
          <div className="mt-6">
            <Button asChild className="w-full">
              <Link href={isResetPasswordPage ? "/password/forgot" : "/"}>
                {isResetPasswordPage ? "Solicitar novo link" : "Voltar para a página inicial"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
