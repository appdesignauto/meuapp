import React from 'react';
import { FileImage } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleFormMulti() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileImage className="mr-2 h-5 w-5" />
            Adicionar Arte Multi-Formato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Formulário em manutenção</p>
        </CardContent>
      </Card>
    </div>
  );
}