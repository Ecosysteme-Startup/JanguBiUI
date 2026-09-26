/**
 * Onglets de la page Référentiels.
 *
 * Module neutre (sans « use client ») : la page serveur `app/plateforme/referentiels`
 * lit cette constante pour valider `?onglet=`. Importée depuis un module client,
 * elle n'est qu'une référence client côté serveur et `.includes` plante (A11Y-01).
 */
export const REFERENTIEL_TABS = ['offices', 'types', 'capacites', 'retraits'] as const;
export type ReferentielTab = (typeof REFERENTIEL_TABS)[number];

export const parseReferentielTab = (value: string | undefined): ReferentielTab =>
  (REFERENTIEL_TABS as readonly string[]).includes(value ?? '') ? (value as ReferentielTab) : 'offices';
