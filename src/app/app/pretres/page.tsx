'use client';

import NextLink from 'next/link';

import { ConfessionNotice } from '@/components/signature/confession-notice';
import { Icon } from '@/components/ui/icon';
import { SectionHeading } from '@/components/ui/section-heading';
import { paths } from '@/config/paths';
import { MyConversations } from '@/features/messagerie/components/my-conversations';
import { PriestList } from '@/features/pretres/components/priest-list';
import { useMe } from '@/hooks/use-me';
import { frenchTypo } from '@/utils/french-typo';
import { ofParish } from '@/utils/parish-name';

// Parler à un prêtre (FID-Pretres).
const PretresPage = () => {
  const me = useMe();
  const parish = me.data?.paroisse_suivie?.name ?? null;

  return (
    <>
      <NextLink
        href={paths.app.root.getHref()}
        className="mb-6 inline-flex h-11 items-center gap-2 text-sm font-medium text-primary"
      >
        <Icon name="fleche-gauche" size={16} />
        Retour · Accueil
      </NextLink>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
        <div>
          <p className="tnum m-0 text-meta text-ink-2">
            <span className="text-primary">04</span> — Parler à un prêtre
          </p>
          <h1 className="m-0 mt-3 font-serif text-title font-normal text-ink lg:text-[3.125rem] lg:leading-none">
            Parler à un <em className="italic text-primary">prêtre</em>
          </h1>
        </div>
        <p className="m-0 max-w-[440px] text-body text-ink-2">
          {frenchTypo(
            `Une question de foi, un accompagnement, un conseil avant un sacrement : les prêtres${
              parish ? ` ${ofParish(parish)}` : ' de votre paroisse'
            } vous répondent par écrit.`,
          )}
        </p>
      </div>

      <ConfessionNotice
        className="mt-6"
        bookingHref={paths.app.confession.getHref()}
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 lg:col-span-7">
          <PriestList parishName={parish} />
        </div>
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-5">
          <MyConversations />
          <section aria-labelledby="confidentialite">
            <SectionHeading
              id="confidentialite"
              number="03"
              title="Confidentialité des échanges"
            />
            <p className="m-0 mt-4 flex items-center gap-3 font-serif text-h3 text-ink">
              <Icon name="cadenas" size={20} className="shrink-0 text-ok" />
              Messages chiffrés
            </p>
            <p className="m-0 mt-2 text-base text-ink">
              {frenchTypo(
                'Vos messages sont chiffrés sur nos serveurs. Aucun administrateur n’y a accès : ni le secrétariat de la paroisse, ni l’équipe de Jàngu Bi.',
              )}
            </p>
            <p className="m-0 mt-2 text-sm text-ink-2">
              Les notifications n’affichent jamais le contenu d’un message.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default PretresPage;
