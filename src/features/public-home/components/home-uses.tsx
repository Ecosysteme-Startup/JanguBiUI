import type { ReactNode } from 'react';

import { PhotoSlot } from '@/components/signature/photo-slot';
import { StatusDot } from '@/components/signature/status-dot';
import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/utils/cn';

const BigNumber = ({ children }: { children: string }) => (
  <span aria-hidden="true" className="font-serif text-[58px] leading-none tracking-[-0.02em] text-primary">
    {children}
  </span>
);

const STEPS = [
  { date: 'Lun. 21.09', label: 'Soumise', state: 'done' },
  { date: 'Depuis 22.09', label: 'Registre ouvert', state: 'current' },
  { date: 'À venir', label: 'Prête à retirer', state: 'todo' },
  { date: 'À venir', label: 'Retirée', state: 'todo' },
] as const;

/** Emplacement photo de la brique « Ma paroisse » (maquette Main, Fig. 2). */
export const HomeParvisSlot = () => <PhotoSlot slot="main-parvis-annonces" caption="Parvis, sortie de la messe de 9 h 30" ratio="3:2" />;

/**
 * « II — Ce que vous y trouvez » : les quatre usages. La demande d'acte présentée est un
 * exemple ; la dernière annonce publiée est passée en emplacement, et sa bannière (`photo`)
 * remplace alors l'emplacement photo.
 */
export const HomeUses = ({ announcement, photo }: { announcement?: ReactNode; photo?: ReactNode }) => (
  <section aria-labelledby="briques-titre" className="flex flex-col">
    <SectionHeading number="II" title="Ce que vous y trouvez" aside="Quatre usages" />
    <div className="mt-8 grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
      <h2 id="briques-titre" className="m-0 font-serif text-h2 font-normal text-ink lg:col-span-7 lg:text-title">
        Lire, s&apos;informer, demander, rencontrer.
      </h2>
      <p className="m-0 text-body text-ink-2 lg:col-span-4 lg:col-start-9">
        Jàngu Bi ne remplace ni la messe, ni le secrétariat, ni le confessionnal. Il simplifie ce qui se fait déjà dans la paroisse, pour
        les fidèles comme pour l&apos;équipe.
      </p>
    </div>

    <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-6">
      <article className="flex flex-col border-t border-ink pt-6 lg:col-span-4">
        <BigNumber>01</BigNumber>
        <h3 className="m-0 mt-6 font-serif text-h3 font-normal text-ink lg:text-[29px]">La Parole du jour</h3>
        <p className="m-0 mt-3 text-body text-ink-2">
          Les lectures de la messe chaque matin, la Bible à portée de main et le chapelet guidé, mystère après mystère.
        </p>
        <ul className="m-0 mt-6 list-none border-b border-line p-0">
          {['Lectures et psaume du jour', 'La Bible, livre par livre', 'Le chapelet, jour après jour'].map((item) => (
            <li key={item} className="flex h-12 items-center gap-3 border-t border-line text-base">
              <Icon name="check" size={16} className="text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </article>

      <article className="flex flex-col border-t border-ink pt-6 lg:col-span-7 lg:col-start-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <div>
            <BigNumber>02</BigNumber>
            <h3 className="m-0 mt-6 font-serif text-h3 font-normal text-ink lg:text-[29px]">Ma paroisse</h3>
          </div>
          <p className="m-0 max-w-[36ch] text-body text-ink-2 md:mt-20">
            Les annonces du dimanche, les horaires de chaque lieu de culte et l&apos;agenda, publiés par le secrétariat, au même endroit.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-7">
          <div className={cn(announcement ? 'md:col-span-4' : 'md:col-span-7')}>{photo ?? <HomeParvisSlot />}</div>
          {announcement && <div className="md:col-span-3">{announcement}</div>}
        </div>
      </article>

      <article className="flex flex-col border-t border-ink pt-6 lg:col-span-7">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[120px_minmax(0,1fr)]">
          <BigNumber>03</BigNumber>
          <div>
            <h3 className="m-0 font-serif text-h3 font-normal text-ink lg:text-[29px]">Mes demandes d&apos;actes</h3>
            <p className="m-0 mt-3 max-w-[58ch] text-body text-ink-2">
              Extrait de baptême, attestation de confirmation ou de mariage religieux : la demande part vers la paroisse du sacrement,
              et vous suivez chaque étape. L&apos;acte vous est remis en original papier, signé et scellé.
            </p>
          </div>
        </div>
        <figure className="m-0 mt-8 border border-line bg-surface p-6">
          <figcaption className="tnum text-meta text-ink-3">Exemple de suivi</figcaption>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="m-0 text-lead font-semibold text-ink">Extrait d&apos;acte de baptême, pour mariage</p>
              <p className="m-0 mt-1 text-sm text-ink-2">Envoyée à la paroisse du sacrement</p>
            </div>
            <StatusDot status="under_verification" />
          </div>
          <ol aria-label="Étapes de la demande" className="m-0 mt-6 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4">
            {STEPS.map((step) => (
              <li
                key={step.label}
                aria-current={step.state === 'current' ? 'step' : undefined}
                className={cn(
                  'border-t-2 pt-2.5',
                  step.state === 'done' ? 'border-primary' : step.state === 'current' ? 'border-ink' : 'border-line',
                )}
              >
                <span className={cn('tnum block text-meta', step.state === 'done' ? 'text-primary' : step.state === 'current' ? 'text-ink' : 'text-ink-3')}>
                  {step.date}
                </span>
                <span className={cn('mt-1 block text-sm', step.state === 'todo' ? 'text-ink-3' : 'font-medium text-ink')}>{step.label}</span>
              </li>
            ))}
          </ol>
          <p className="m-0 mt-5 flex items-center gap-2 text-sm text-ink-2">
            <Icon name="document" size={16} />
            Original papier à retirer au secrétariat. Aucun acte n&apos;est délivré en PDF.
          </p>
        </figure>
      </article>

      <article className="flex flex-col border-t border-ink pt-6 lg:col-span-4 lg:col-start-9">
        <BigNumber>04</BigNumber>
        <h3 className="m-0 mt-6 font-serif text-h3 font-normal text-ink lg:text-[29px]">Parler à un prêtre</h3>
        <p className="m-0 mt-3 text-body text-ink-2">
          Une messagerie confidentielle avec les prêtres joignables de votre paroisse, et la prise de rendez-vous de confession.
        </p>
        <p className="tnum m-0 mt-5 flex items-center gap-2 text-meta text-ok">
          <Icon name="cadenas" size={14} />
          Messages chiffrés · aucun administrateur n&apos;y a accès
        </p>
        <div role="note" className="mt-5 flex items-start gap-4 rounded border border-ink bg-surface px-5 py-4">
          <Icon name="confession" size={24} className="shrink-0 text-ink" />
          <div>
            <p className="m-0 font-serif text-h4 italic leading-tight text-ink">La confession ne se fait pas par message.</p>
            <p className="m-0 mt-1 text-sm text-ink-2">Le rendez-vous est pris en ligne ; le sacrement est reçu en présence du prêtre.</p>
          </div>
        </div>
      </article>
    </div>
  </section>
);
