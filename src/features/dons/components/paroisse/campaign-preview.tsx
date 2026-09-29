import { Icon } from '@/components/ui/icon';

import type { Authorization } from '../../types/schemas';
import { fcfa, progressPercent } from '../../utils/format';
import { FundProgress } from '../shared/fund-progress';

import { CampaignImage } from './campaign-art';
import { KindTag, panelClasses } from './parts';
import { dateRange } from './period';

type Props = {
  title: string;
  description: string;
  goal: number | null;
  raised: number;
  startsOn: string;
  endsOn: string;
  imageUrl: string | null;
  statusLabel: string;
  authorization: Pick<Authorization, 'text'> | null | undefined;
};

const excerpt = (text: string, max = 110) => (text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text);

/** « Aperçu pour les fidèles » : la carte campagne sur le web et dans l'application (non interactive). */
export const CampaignPreview = ({ title, description, goal, raised, startsOn, endsOn, imageUrl, statusLabel, authorization }: Props) => {
  const shownTitle = title.trim() || 'Titre de la campagne';
  const range = startsOn && endsOn && endsOn >= startsOn ? dateRange(startsOn, endsOn) : null;
  const percent = progressPercent(raised, goal);
  return (
    <aside aria-labelledby="campagne-t-apercu" className={`${panelClasses} p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="campagne-t-apercu" className="m-0 text-16 font-semibold text-ink">
          Aperçu pour les fidèles
        </h2>
        <span className="text-13 text-ink-3">{statusLabel}</span>
      </div>
      <div className="mt-4 rounded-16 border border-line bg-surface p-4">
        <p className="m-0 mb-3 flex items-center gap-1.5 text-13 font-medium text-ink-3">
          <Icon name="globe" size={14} />
          Sur le web, page « Soutenir la paroisse »
        </p>
        <div className="flex flex-col gap-3 rounded-16 border border-line bg-paper p-3.5 shadow-card">
          <CampaignImage url={imageUrl} className="h-32 w-full rounded-12" />
          <div className="flex items-center gap-2">
            <KindTag>Campagne</KindTag>
            {range && <span className="tnum text-13 text-ink-3">{range}</span>}
          </div>
          <p className="m-0 text-17 font-semibold text-ink">{shownTitle}</p>
          {description.trim() && <p className="m-0 text-14 text-ink-2">{excerpt(description.trim())}</p>}
          {goal ? (
            <div className="flex flex-col gap-1.5">
              <FundProgress raised={raised} goal={goal} />
              <div className="tnum flex justify-between text-13 text-ink-2">
                <span>
                  <strong className="font-semibold text-ink">{fcfa(raised)}</strong> sur {fcfa(goal)}
                </span>
                <span>{percent}&nbsp;%</span>
              </div>
            </div>
          ) : null}
          <span className="inline-flex h-10 items-center justify-center rounded-12 bg-surface-2 text-14 font-semibold text-ink">Voir la campagne</span>
        </div>
        <p className="m-0 mb-3 mt-5 flex items-center gap-1.5 text-13 font-medium text-ink-3">
          <Icon name="mobile" size={14} />
          Dans l’application, onglet Paroisse
        </p>
        <div className="flex gap-3 rounded-14 border border-line bg-paper p-3">
          <CampaignImage url={imageUrl} className="size-18 shrink-0 rounded-10" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="line-clamp-2 text-15 font-semibold text-ink">{shownTitle}</span>
            {goal ? (
              <>
                <FundProgress raised={raised} goal={goal} />
                <span className="tnum text-13 text-ink-3">Objectif {fcfa(goal)}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      {authorization?.text && (
        <p className="m-0 mt-3 flex gap-2 text-13 text-ink-3">
          <Icon name="bouclier" size={14} className="mt-0.5 shrink-0" />
          <span>Sous le bouton de don&nbsp;: « {authorization.text} »</span>
        </p>
      )}
    </aside>
  );
};
