'use client';

import NextLink from 'next/link';

import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { paths } from '@/config/paths';
import { isMinor, useMe } from '@/hooks/use-me';

import { useParishPriests } from '../api/get-parish-priests';
import type { ParishSheet } from '../api/get-parish-sheet';

type Person = { key: string; name: string; role: string; reachable: boolean };

const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/**
 * Clergé de la paroisse (offices actifs de la fiche publique) et prêtres joignables par message.
 * « Écrire » mène aux prêtres joignables ; le contenu des échanges n'est lisible d'aucun administrateur.
 */
export const ClergySection = ({ nodeId, sheet, className }: { nodeId: string; sheet: ParishSheet | undefined; className?: string }) => {
  const { data } = useParishPriests();
  const { data: me } = useMe();
  // La messagerie est réservée aux majeurs (RG-13) : un mineur reçoit une orientation, pas « Écrire ».
  const minor = isMinor(me);
  const reachable = (data ?? []).filter((p) => p.nodes.some((n) => n.id === nodeId));
  const accepts = (p: (typeof reachable)[number]) => p.availability?.accepts_new_conversations !== false;

  const people: Person[] = (sheet?.clergy ?? []).map((c) => {
    const match = reachable.find((p) => normalize(p.full_name) === normalize(c.name));
    return { key: `clerge-${c.name}`, name: c.name, role: c.office, reachable: Boolean(match && accepts(match)) };
  });
  reachable
    .filter((p) => !people.some((person) => normalize(person.name) === normalize(p.full_name)))
    .forEach((p) =>
      people.push({
        key: p.user_id,
        name: p.full_name,
        role: accepts(p) ? 'Joignable par message' : 'Ne prend pas de nouveaux échanges',
        reachable: accepts(p),
      }),
    );

  if (people.length === 0) return null;

  return (
    <Card as="section" aria-labelledby="mp-clerge" className={className}>
      <h2 id="mp-clerge" className="m-0 text-18 font-semibold text-ink">
        Clergé et secrétariat
      </h2>
      <ul className="m-0 mt-2 flex list-none flex-col p-0">
        {people.map((person, index) => (
          <li key={person.key} className={index < people.length - 1 ? 'flex items-center gap-3 border-b border-line py-2.5' : 'flex items-center gap-3 pt-2.5'}>
            <Avatar name={person.name} size={40} className="text-14" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-15 font-semibold text-ink">{person.name}</span>
              <span className="text-13 text-ink-3">{person.role}</span>
            </span>
            {person.reachable && !minor && (
              <NextLink href={paths.app.pretres.list.getHref()} className="hit text-14 font-semibold" aria-label={`Écrire à ${person.name}`}>
                Écrire
              </NextLink>
            )}
          </li>
        ))}
      </ul>
      {minor ? (
        <p className="m-0 mt-3 flex items-start gap-1.5 text-13 text-ink-3">
          <Icon name="info" size={14} className="mt-px shrink-0" />
          La messagerie est réservée aux majeurs. Si tu as moins de 18 ans, demande un rendez-vous ou passe au secrétariat de ta paroisse
          pour être accompagné par un prêtre.
        </p>
      ) : (
        <p className="m-0 mt-3 flex items-center gap-1.5 text-13 text-ink-3">
          <Icon name="cadenas" size={14} className="shrink-0" />
          Messages chiffrés, aucun administrateur n’y a accès.
        </p>
      )}
    </Card>
  );
};
