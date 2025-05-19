
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const HotmartWebhookTester = () => {
  const [webhookToken, setWebhookToken] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testWebhook = async () => {
    if (!webhookToken) {
      setTestResult({
        success: false,
        message: 'Por favor, insira o token do webhook'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/webhooks/hotmart/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhookToken })
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Erro ao testar as credenciais do webhook'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Testador PRO - Webhook Hotmart</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Token do Webhook Hotmart
          </label>
          <Input
            type="text"
            value={webhookToken}
            onChange={(e) => setWebhookToken(e.target.value)}
            placeholder="Insira o token do webhook"
            className="w-full"
          />
        </div>

        <Button
          onClick={testWebhook}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testando...' : 'Testar Webhook'}
        </Button>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {testResult.success ? 'Sucesso!' : 'Erro'}
            </AlertTitle>
            <AlertDescription>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default HotmartWebhookTester;
