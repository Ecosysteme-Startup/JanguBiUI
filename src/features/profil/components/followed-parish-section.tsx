'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useDebounce } from '@/hooks/use-debounce';
import type { Me } from '@/hooks/use-me';
import { nodeAncestorsQueryOptions } from '@/hooks/use-node-ancestors';

import { useSearchParishes } from '../api/search-parishes';
import { useSetFollowedParish } from '../api/set-followed-parish';

const ParishSearch = ({ currentId, onClose }: { currentId?: string; onClose: () => void }) => {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q, 300);
  const { data, isError } = useSearchParishes(debounced);
  const change = useSetFollowedParish({
    onSuccess: () => {
      toast.ok('Votre paroisse suivie a changé.');
      onClose();
    },
  });
  const results = (data?.results ?? []).filter((p) => p.id !== currentId);

  return (
    <div className="mt-4 flex flex-col gap-3">
      <Field id="pf-paroisse-q" label="Nom, quartier ou ville">
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder="Par exemple : Point E, Thiès" />
      </Field>
      {isError && <p className="m-0 text-sm text-err">La recherche n’a pas abouti. Réessayez.</p>}
      {results.length > 0 && (
        <ul aria-label="Paroisses trouvées" className="m-0 flex list-none flex-col gap-2 p-0">
          {results.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded border border-line bg-surface px-4 py-3">
              <span className="min-w-0">
                <span className="block text-base font-semibold text-ink">{p.name}</span>
                {(p.address || p.city) && <span className="block text-sm text-ink-2">{[p.address, p.city].filter(Boolean).join(' · ')}</span>}
              </span>
              <Button variant="secondary" size="sm" disabled={change.isPending} onClick={() => change.mutate(p.id)} aria-label={`Suivre ${p.name}`}>
                Suivre
              </Button>
            </li>
          ))}
        </ul>
      )}
      {change.isError && (
        <p role="alert" className="m-0 text-sm text-err">
          Le changement n’a pas pu être enregistré.
        </p>
      )}
      <Button variant="tertiary" className="self-start" onClick={onClose}>
        Annuler
      </Button>
    </div>
  );
};

/** 02 — Paroisse suivie : changement libre ; les demandes d'actes restent à la paroisse du sacrement. */
export const FollowedParishSection = ({ me }: { me: Me }) => {
  const [changing, setChanging] = useState(false);
  const paroisse = me.paroisse_suivie;
  const { data: ancestors } = useQuery({ ...nodeAncestorsQueryOptions(paroisse?.id ?? ''), enabled: Boolean(paroisse) });

  return (
    <section aria-labelledby="pf-paroisse">
      <h2 id="pf-paroisse" className="tnum m-0 border-t border-line-strong pt-2 text-meta font-normal text-ink-2">
        <span className="text-primary">02</span> — Paroisse suivie
      </h2>
      {paroisse ? (
        <>
          <p className="m-0 mt-4 font-serif text-h3 text-ink">{paroisse.name}</p>
          {ancestors && ancestors.length > 0 && (
            <p className="m-0 mt-1 text-sm text-ink-2">
              {ancestors
                .slice(-2)
                .map((a) => a.name)
                .join(' · ')}
            </p>
          )}
        </>
      ) : (
        <p className="m-0 mt-4 text-base text-ink-2">Vous ne suivez aucune paroisse.</p>
      )}
      {changing ? (
        <ParishSearch currentId={paroisse?.id} onClose={() => setChanging(false)} />
      ) : (
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setChanging(true)}>
          {paroisse ? 'Changer de paroisse' : 'Choisir ma paroisse'}
        </Button>
      )}
      <p className="m-0 mt-3 text-sm text-ink-3">Vos demandes d’actes restent adressées à la paroisse du sacrement.</p>
    </section>
  );
};
