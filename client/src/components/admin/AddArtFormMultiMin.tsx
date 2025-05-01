import React from 'react';
import { useForm } from 'react-hook-form';
import { FileImage } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AddArtFormMultiMin() {
  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white pb-8">
          <div className="flex items-center mb-2">
            <FileImage className="h-6 w-6 mr-2" />
            <CardTitle>Adicionar Arte Multi-Formato</CardTitle>
          </div>
          <CardDescription className="text-blue-100">
            Crie uma arte com variações para diferentes formatos (feed, stories, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 px-6">
          <p>Formulário simplificado para teste</p>
        </CardContent>
      </Card>
    </div>
  );
}