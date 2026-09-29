'use client';

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

import { env } from '@/config/env';
import {
  getAccessToken,
  getRefreshToken,
  tryRefreshAccess,
} from '@/lib/api-client';

import { donsAnalyseQueryKey, type Niveau } from '../api/get-analyse-dons';

// Flux SSE des tableaux de bord des dons (backend `docs/TEMPS-REEL.md` §3) :
// GET /v1/staff/dons/flux/?noeud=<uuid>, en-tête Bearer (fetch-event-source,
// pas d'EventSource natif). Les événements ne portent ni montant ni nom : à
// chacun, on invalide les requêtes d'analyse, regroupées (un rechargement par
// seconde au plus). La reprise (`Last-Event-ID`) rejoue les événements manqués ;
// au-delà, le serveur envoie `resync: true` et on recharge tout de même.

export type EtatFlux = 'ferme' | 'connexion' | 'ouvert';

export const EVENEMENTS_FLUX = [
  'dons.operation',
  'dons.synthese_invalidee',
] as const;

class ErreurAuth extends Error {}
class ErreurDefinitive extends Error {}
class FluxTermine extends Error {}

const jeton = async (): Promise<string | null> => {
  const courant = getAccessToken();
  if (courant) return courant;
  if (!getRefreshToken()) return null;
  try {
    await tryRefreshAccess();
  } catch {
    return null;
  }
  return getAccessToken();
};

/**
 * L'API accepte la reprise par l'en-tête `Last-Event-ID` ou par le paramètre
 * `?lastEventId=`. En cross-origin, l'en-tête n'est pas autorisé par le CORS du
 * backend (preflight refusé) : on le déplace dans l'URL, y compris quand
 * fetch-event-source le pose lui-même lors de ses reconnexions.
 */
export const fetchSansEnteteReprise: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  const id = headers.get('last-event-id');
  if (!id || typeof input !== 'string') return fetch(input, init);
  headers.delete('last-event-id');
  const url = new URL(input);
  url.searchParams.set('lastEventId', id);
  return fetch(url.toString(), { ...init, headers });
};

interface UseFluxDonsOptions {
  niveau: Niveau;
  /** Paroisse ou diocèse ; sans nœud, pas de flux. */
  noeud: string | undefined;
  /** Fenêtre de regroupement des rechargements (ms). */
  regroupement?: number;
}

export function useFluxDons({
  niveau,
  noeud,
  regroupement = 1000,
}: UseFluxDonsOptions): EtatFlux {
  const queryClient = useQueryClient();
  const [etat, setEtat] = React.useState<EtatFlux>('ferme');

  React.useEffect(() => {
    if (!noeud) return;
    const controleur = new AbortController();
    let dernierId: string | undefined;
    let minuteur: ReturnType<typeof setTimeout> | null = null;

    const planifierRechargement = () => {
      if (minuteur) return;
      minuteur = setTimeout(() => {
        minuteur = null;
        void queryClient.invalidateQueries({
          queryKey: donsAnalyseQueryKey(niveau),
        });
      }, regroupement);
    };

    const ouvrir = async () => {
      setEtat('connexion');
      // Une ouverture par tour : au 401, on rafraîchit le jeton et on rouvre
      // avec le dernier identifiant reçu (le serveur rejoue ce qui manque).
      let echecsAuth = 0;
      while (!controleur.signal.aborted && echecsAuth < 3) {
        const token = await jeton();
        if (controleur.signal.aborted) return;
        if (!token) {
          setEtat('ferme');
          return;
        }
        try {
          await fetchEventSource(
            `${env.API_URL}/v1/staff/dons/flux/?noeud=${encodeURIComponent(noeud)}`,
            {
              signal: controleur.signal,
              fetch: fetchSansEnteteReprise,
              headers: {
                Accept: 'text/event-stream',
                Authorization: `Bearer ${token}`,
                ...(dernierId ? { 'last-event-id': dernierId } : {}),
              },
              // Onglet masqué : le flux se ferme et se rouvre au retour, avec
              // `Last-Event-ID`.
              openWhenHidden: false,
              async onopen(res) {
                const type = res.headers.get('content-type') ?? '';
                if (res.ok && type.includes('text/event-stream')) {
                  echecsAuth = 0;
                  setEtat('ouvert');
                  return;
                }
                if (res.status === 401) throw new ErreurAuth();
                // 400, 403, 404 : pas de flux pour ce compte ou ce nœud.
                throw new ErreurDefinitive(String(res.status));
              },
              onmessage(ev) {
                if (ev.id) dernierId = ev.id;
                if ((EVENEMENTS_FLUX as readonly string[]).includes(ev.event)) {
                  planifierRechargement();
                }
              },
              onclose() {
                // Fin normale au bout de 30 min : on se reconnecte (les droits
                // sont revérifiés à l'ouverture).
                throw new FluxTermine();
              },
              onerror(err) {
                if (
                  err instanceof ErreurAuth ||
                  err instanceof ErreurDefinitive
                )
                  throw err;
                setEtat('connexion');
                // Réseau ou fin de flux : reconnexion automatique, au délai
                // `retry:` annoncé par le serveur.
                return undefined;
              },
            },
          );
          return;
        } catch (err) {
          if (controleur.signal.aborted) return;
          if (err instanceof ErreurAuth && getRefreshToken()) {
            echecsAuth += 1;
            try {
              await tryRefreshAccess();
              continue;
            } catch {
              // session expirée : pas de flux
            }
          }
          setEtat('ferme');
          return;
        }
      }
      if (!controleur.signal.aborted) setEtat('ferme');
    };

    void ouvrir();

    return () => {
      controleur.abort();
      if (minuteur) clearTimeout(minuteur);
      setEtat('ferme');
    };
  }, [noeud, niveau, regroupement, queryClient]);

  return etat;
}
