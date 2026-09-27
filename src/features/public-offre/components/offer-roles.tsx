import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

const ROLES = [
  { office: 'Curé', rights: ['Tout l’espace paroisse', 'Nomme l’équipe', 'Messagerie'] },
  { office: 'Vicaire', rights: ['Messagerie', 'Créneaux de confession', 'Agenda'] },
  { office: 'Secrétaire paroissiale', rights: ['Demandes d’actes', 'Annonces', 'Horaires et lieux', 'Agenda'] },
  { office: 'Référent numérique', rights: ['Paramètres de la paroisse', 'Invitations'] },
];

const GUARANTEES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'bouclier', title: 'Double authentification obligatoire', text: 'Tout le personnel se connecte avec un mot de passe et un code à usage unique.' },
  {
    icon: 'cadenas',
    title: 'Aucun accès au contenu des messages',
    text: 'Les échanges entre un fidèle et un prêtre sont chiffrés. Ni le secrétariat, ni le diocèse, ni Numerisen ne peuvent les lire.',
  },
  { icon: 'utilisateurs', title: 'Des accès qui suivent les nominations', text: 'Quand un office prend fin, l’accès se ferme à la date prévue. Chaque action est tracée.' },
  { icon: 'document', title: 'Données personnelles protégées', text: 'Traitement déclaré conformément à la loi n° 2008-12. Les registres paroissiaux restent au secrétariat.' },
];

/** « Rôles et sécurité » (WEB-Pour-les-paroisses) : ce que chaque office permet, et les garanties. */
export const OfferRoles = () => (
  <section aria-labelledby="roles-titre" className="jb-container pt-16 md:pt-24">
    <h2 id="roles-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
      Rôles et sécurité
    </h2>
    <p className="m-0 mt-2 max-w-[760px] text-18 text-ink-2">
      Chacun voit ce que son office lui permet, et rien de plus. Les offices sont nommés et datés par le diocèse.
    </p>
    <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px] xl:gap-12">
      <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-16 border border-line bg-paper text-left shadow-card">
        <thead>
          <tr className="bg-surface text-13 font-medium text-ink-3">
            <th scope="col" className="border-b border-line px-4 py-3 font-medium sm:w-[200px] sm:px-6">
              Office
            </th>
            <th scope="col" className="border-b border-line px-4 py-3 font-medium sm:px-6">
              Ce qu&apos;il permet dans l&apos;espace paroisse
            </th>
          </tr>
        </thead>
        <tbody>
          {ROLES.map((role, index) => (
            <tr key={role.office}>
              <th scope="row" className={cn('px-4 py-4 align-top text-16 font-semibold text-ink sm:px-6', index < ROLES.length - 1 && 'border-b border-line')}>
                {role.office}
              </th>
              <td className={cn('px-4 py-4 sm:px-6', index < ROLES.length - 1 && 'border-b border-line')}>
                <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                  {role.rights.map((right) => (
                    <li key={right} className="inline-flex h-[26px] items-center rounded-full bg-surface-2 px-2.5 text-13 text-ink-2">
                      {right}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="m-0 list-none rounded-16 border border-line bg-paper p-0">
        {GUARANTEES.map((item, index) => (
          <li key={item.title} className={cn('flex gap-4 px-6 py-5', index < GUARANTEES.length - 1 && 'border-b border-line')}>
            <Icon name={item.icon} size={20} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <div className="text-16 font-semibold text-ink">{item.title}</div>
              <div className="text-14 text-ink-2">{item.text}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
