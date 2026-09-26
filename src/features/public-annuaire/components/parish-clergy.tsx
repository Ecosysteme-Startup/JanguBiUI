import { SectionHeading } from '@/components/ui/section-heading';

import type { ParishClergy as Clergy } from '../api/get-parish-by-code';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** « 04 — Clergé » : prêtres et diacres nommés sur la paroisse (nom et office). */
export const ParishClergy = ({ clergy }: { clergy: Clergy }) => (
  <section aria-labelledby="h-clerge">
    <SectionHeading id="h-clerge" number="04" title="Clergé" />
    {clergy.length === 0 ? (
      <p className="m-0 mt-2 text-sm text-ink-2">Aucun clerc n&apos;est encore renseigné pour cette paroisse.</p>
    ) : (
      <ul className="m-0 list-none p-0">
        {clergy.map((member) => (
          <li key={`${member.name}-${member.office}`} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-4 border-b border-line py-3">
            <span aria-hidden="true" className="tnum flex size-10 items-center justify-center rounded-full bg-surface text-meta text-ink-2">
              {initials(member.name)}
            </span>
            <span className="flex flex-col">
              <span className="text-base font-medium text-ink">{member.name}</span>
              <span className="text-sm text-ink-3">{member.office}</span>
            </span>
          </li>
        ))}
      </ul>
    )}
  </section>
);
