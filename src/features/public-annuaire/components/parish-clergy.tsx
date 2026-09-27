import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/utils/cn';

import type { ParishClergy as Clergy } from '../api/get-parish-by-code';

/** « Clergé et secrétariat » de la fiche (WEB-Fiche-Paroisse) : clercs nommés (nom et office). */
export const ParishClergy = ({ clergy }: { clergy: Clergy }) => (
  <section aria-labelledby="h-clerge" className="rounded-16 border border-line bg-paper p-6 shadow-card">
    <h2 id="h-clerge" className="m-0 text-17 font-semibold text-ink">
      Clergé
    </h2>
    {clergy.length === 0 ? (
      <p className="m-0 mt-3 text-14 text-ink-2">Aucun clerc n&apos;est encore renseigné pour cette paroisse.</p>
    ) : (
      <ul className="m-0 mt-2 list-none p-0">
        {clergy.map((member, index) => (
          <li
            key={`${member.name}-${member.office}`}
            className={cn('flex items-center gap-3 py-3', index < clergy.length - 1 ? 'border-b border-line' : 'pb-0')}
          >
            <Avatar name={member.name} size={40} />
            <div>
              <div className="text-15 font-semibold text-ink">{member.name}</div>
              <div className="text-13 text-ink-2">{member.office}</div>
            </div>
          </li>
        ))}
      </ul>
    )}
    <p className="m-0 mt-4 text-13 text-ink-3">
      Pour écrire à un prêtre, connectez-vous à votre espace. Les messages sont chiffrés, aucun administrateur n&apos;y a accès.
    </p>
  </section>
);
