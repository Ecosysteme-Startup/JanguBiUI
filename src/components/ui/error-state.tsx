import type * as React from 'react';

import { Button } from './button';
import { EmptyState } from './empty-state';
import { Icon } from './icon';

/**
 * Erreur de chargement d'un bloc (WEB-Design-System, « Chargement, progression, vide ») : état
 * vide au ton « erreur » et, si la donnée peut être redemandée, un seul bouton « Réessayer ».
 */
export const ErrorState = ({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger ces données pour le moment.',
  onRetry,
  retryLabel = 'Réessayer',
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) => (
  <EmptyState
    tone="err"
    icon="erreur"
    title={title}
    className={className}
    action={
      onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <Icon name="rafraichir" size={16} />
          {retryLabel}
        </Button>
      )
    }
  >
    {description}
  </EmptyState>
);
