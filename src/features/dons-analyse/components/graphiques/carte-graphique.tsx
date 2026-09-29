'use client';

import * as React from 'react';

import { cn } from '@/utils/cn';

import { BasculeGraphiqueTableau, type Vue } from './bascule-graphique-tableau';

interface CarteProps {
  titre: string;
  sousTitre?: React.ReactNode;
  /** Élément à droite de l'en-tête (lien, compteur). */
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  /** Identifiant du titre (aria-labelledby). */
  id?: string;
}

/** Carte de tableau de bord : titre, sous-titre (ce qu'on mesure), contenu. */
export function Carte({
  titre,
  sousTitre,
  action,
  className,
  children,
  id,
}: CarteProps) {
  const autoId = React.useId();
  const titreId = id ?? `carte-${autoId}`;
  return (
    <section
      aria-labelledby={titreId}
      className={cn(
        'rounded-2xl border border-border bg-card px-6 py-5 shadow-soft-sm',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            id={titreId}
            className="font-sans text-xl font-semibold leading-7 tracking-normal text-foreground"
          >
            {titre}
          </h2>
          {sousTitre && (
            <p className="mt-0.5 text-sm text-muted-foreground">{sousTitre}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

interface CarteGraphiqueProps extends Omit<CarteProps, 'children' | 'action'> {
  /** La figure. */
  graphique: React.ReactNode;
  /** Sa vue tableau jumelle, obligatoire (spec 03 §3.9). */
  tableau: React.ReactNode;
  /** Texte sous la figure, affiché dans les deux vues. */
  pied?: React.ReactNode;
  vueInitiale?: Vue;
}

/** Carte avec bascule « Graphique · Tableau » : toute figure a sa vue tableau. */
export function CarteGraphique({
  graphique,
  tableau,
  pied,
  vueInitiale = 'graphique',
  ...carte
}: CarteGraphiqueProps) {
  const [vue, setVue] = React.useState<Vue>(vueInitiale);
  return (
    <Carte
      {...carte}
      action={
        <BasculeGraphiqueTableau
          vue={vue}
          onChange={setVue}
          titre={carte.titre}
        />
      }
    >
      <div className="mt-4">{vue === 'graphique' ? graphique : tableau}</div>
      {pied && (
        <div className="mt-3 space-y-1 text-[13px] leading-[18px] text-muted-foreground">
          {pied}
        </div>
      )}
    </Carte>
  );
}
