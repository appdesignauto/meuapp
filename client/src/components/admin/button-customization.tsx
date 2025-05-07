import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ButtonCustomizationProps {
  buttonRadius: number;
  buttonWidth: string;
  onRadiusChange: (value: number[]) => void;
  onWidthChange: (value: string) => void;
}

export function ButtonCustomization({
  buttonRadius,
  buttonWidth,
  onRadiusChange,
  onWidthChange
}: ButtonCustomizationProps) {
  return (
    <div>
      <Label>Personalização do botão</Label>
      <div className="space-y-4 mt-2">
        <div>
          <Label htmlFor="buttonRadius" className="text-xs">Arredondamento do botão</Label>
          <div className="flex items-center space-x-2 mt-1">
            <Slider
              id="buttonRadius"
              min={0}
              max={24}
              step={1}
              value={[buttonRadius]}
              onValueChange={onRadiusChange}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-9 text-right">{buttonRadius}px</span>
          </div>
        </div>
        
        <div>
          <Label htmlFor="buttonWidth" className="text-xs">Largura do botão</Label>
          <Select
            value={buttonWidth}
            onValueChange={onWidthChange}
          >
            <SelectTrigger id="buttonWidth">
              <SelectValue placeholder="Selecione a largura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático</SelectItem>
              <SelectItem value="100%">100% (Largura total)</SelectItem>
              <SelectItem value="75%">75%</SelectItem>
              <SelectItem value="50%">50%</SelectItem>
              <SelectItem value="25%">25%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}