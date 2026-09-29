'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { PageHeader } from '@/components/ui/page-header';
import { env } from '@/config/env';
import { RequireCapability } from '@/lib/can';

import { CheminsComptesProvider } from './chemins';
import { NavComptes } from './commun';

/**
 * Coquille des écrans « Comptes » : garde `comptes.gerer` sur le nœud (ou la plateforme),
 * en-tête et onglets de la section.
 */
export function PageComptes({
  nodeId,
  title,
  subtitle,
  children,
}: {
  /** `null` : espace plateforme. */
  nodeId: string | null;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <CheminsComptesProvider nodeId={nodeId}>
      <RequireCapability
        capacite={
          nodeId ? ['comptes.gerer', 'plateforme.admin'] : 'plateforme.admin'
        }
        nodeId={nodeId}
        fallback={
          <EmptyState icon="cadenas" title="Cette page ne vous est pas ouverte">
            L’administration des comptes demande la capacité « comptes.gerer »
            sur ce nœud.
          </EmptyState>
        }
      >
        <div className="flex flex-col gap-6">
          <PageHeader
            compact
            title={title}
            description={subtitle}
            actions={
              !nodeId &&
              env.KEYCLOAK_CONSOLE_URL && (
                <Button asChild variant="outline" className="min-h-11 text-14">
                  <a
                    href={env.KEYCLOAK_CONSOLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon
                      name="lien-externe"
                      size={18}
                      className="text-ink-2"
                    />
                    Console Keycloak
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </Button>
              )
            }
          />
          <div>
            <NavComptes />
            {children}
          </div>
        </div>
      </RequireCapability>
    </CheminsComptesProvider>
  );
}
