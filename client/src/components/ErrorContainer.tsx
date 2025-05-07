import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorContainerProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ErrorContainer: React.FC<ErrorContainerProps> = ({
  title,
  description,
  actionLabel = 'Tentar novamente',
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-6 max-w-lg mx-auto">
      <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-red-600 dark:text-red-400 mb-4">
          {description}
        </p>
      )}
      {onAction && (
        <Button 
          variant="outline"
          onClick={onAction}
          className="border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default ErrorContainer;