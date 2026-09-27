import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'calendrier',
    title: 'Des horaires toujours justes',
    text: 'Le secrétariat publie une fois les messes, les changements et les annonces du dimanche. Les fidèles qui suivent la paroisse sont prévenus, sur le web et sur leur téléphone.',
  },
  {
    icon: 'document',
    title: 'Les demandes d’actes dans une seule file',
    text: 'Chaque demande arrive complète, avec son motif. Vous voyez les statuts, les compléments attendus et les retards. L’acte reste un original papier, signé et scellé, retiré au secrétariat.',
  },
  {
    icon: 'message',
    title: 'Des prêtres joignables, dans un cadre',
    text: 'Chaque prêtre choisit s’il est joignable et quand. Les fidèles majeurs lui écrivent en messagerie chiffrée, et réservent un créneau de confession en présentiel, sans rien préciser.',
  },
];

const NAV = ['Aujourd’hui', 'Demandes d’actes', 'Messagerie', 'Confessions', 'Annonces', 'Horaires et lieux', 'Agenda'];

const ROWS: { title: string; meta: string; status: string; tone: 'neutral' | 'warn' | 'info' | 'ok'; late?: boolean }[] = [
  { title: 'Certificat de première communion', meta: 'JB-2026-00420', status: 'Soumise', tone: 'neutral' },
  { title: 'Extrait d’acte de baptême', meta: 'JB-2026-00416 · pour mariage', status: 'Complément demandé', tone: 'warn' },
  { title: 'Attestation de parrain ou marraine', meta: 'JB-2026-00405', status: 'En vérification', tone: 'info' },
  { title: 'Attestation de mariage religieux', meta: 'JB-2026-00403', status: 'En vérification', tone: 'info', late: true },
  { title: 'Extrait d’acte de baptême', meta: 'JB-2026-00408 · pour mariage', status: 'Prête à retirer', tone: 'ok' },
];

const TONES = {
  neutral: 'bg-surface-2 text-ink-2',
  warn: 'bg-warn-bg text-warn',
  info: 'bg-tint-50 text-tint-800',
  ok: 'bg-ok-bg text-ok',
} as const;
const DOTS = { neutral: '', warn: 'bg-warn-dot', info: 'bg-primary-fill', ok: '' } as const;

/** Aperçu de l'espace paroisse (file des demandes d'actes), illustration non interactive. */
const BackofficePreview = () => (
  <div aria-hidden="true" className="hidden overflow-hidden rounded-16 border border-line bg-paper shadow-menu md:grid md:grid-cols-[176px_minmax(0,1fr)]">
    <div className="flex flex-col gap-0.5 border-r border-line bg-surface px-3 py-4 text-13">
      <div className="mb-3 flex items-center gap-2 rounded-10 border border-line bg-paper p-2">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-tint-100 text-primary-strong">
          <Icon name="paroisse" size={14} />
        </span>
        <span className="truncate font-semibold text-ink">Votre paroisse</span>
      </div>
      {NAV.map((item) => (
        <span
          key={item}
          className={cn('flex justify-between rounded-8 px-2.5 py-[7px]', item === 'Demandes d’actes' ? 'bg-tint-50 font-semibold text-tint-800' : 'text-ink-2')}
        >
          {item}
        </span>
      ))}
    </div>
    <div className="min-w-0 px-5 pb-4 pt-5">
      <div className="text-18 font-semibold text-ink">Demandes d&apos;actes</div>
      <div className="mt-3 flex gap-4 border-b border-line text-13">
        <span className="-mb-px border-b-2 border-primary-fill pb-2 font-semibold text-ink">Toutes</span>
        <span className="pb-2 text-ink-3">Soumises</span>
        <span className="pb-2 text-ink-3">En vérification</span>
        <span className="pb-2 text-ink-3">Prêtes</span>
      </div>
      <div className="text-13">
        {ROWS.map((row, index) => (
          <div key={row.meta} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3', index < ROWS.length - 1 && 'border-b border-line')}>
            <div className="min-w-0">
              <div className="truncate text-14 font-semibold text-ink">{row.title}</div>
              <div className="tnum truncate text-ink-3">
                {row.meta}
                {row.late && <span className="font-medium text-err"> · 8 jours, en retard</span>}
              </div>
            </div>
            <span className={cn('inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-12 font-medium', TONES[row.tone])}>
              {DOTS[row.tone] && <span className={cn('size-1.5 rounded-full', DOTS[row.tone])} />}
              {row.status}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-10 bg-surface px-3 py-2.5 text-12 text-ink-2">Une demande passe en retard après 5 jours ouvrés sans changement de statut.</div>
    </div>
  </div>
);

/** « Ce que votre paroisse y gagne » (WEB-Pour-les-paroisses) : trois bénéfices et l'aperçu de l'espace paroisse. */
export const OfferBenefits = () => (
  <section aria-labelledby="gains-titre" className="border-y border-line bg-surface">
    <div className="jb-container py-16 md:py-24">
      <h2 id="gains-titre" className="m-0 text-28 font-semibold text-ink md:text-32">
        Ce que votre paroisse y gagne
      </h2>
      <p className="m-0 mt-2 text-18 text-ink-2">Moins de répétitions au secrétariat, et des fidèles mieux informés.</p>
      <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[440px_minmax(0,1fr)]">
        <div className="flex flex-col">
          {BENEFITS.map((benefit, index) => (
            <div key={benefit.title} className={cn(index === 0 ? 'pb-8' : 'py-8', index < BENEFITS.length - 1 && 'border-b border-line', index === BENEFITS.length - 1 && 'pb-0')}>
              <h3 className="m-0 flex items-center gap-3 text-20 font-semibold text-ink">
                <Icon name={benefit.icon} size={22} className="shrink-0 text-primary" />
                {benefit.title}
              </h3>
              <p className="m-0 mt-2 text-16 leading-[26px] text-ink-2">{benefit.text}</p>
            </div>
          ))}
        </div>
        <BackofficePreview />
      </div>
    </div>
  </section>
);
