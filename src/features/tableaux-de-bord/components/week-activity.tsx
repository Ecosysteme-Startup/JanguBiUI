import type * as React from 'react';

import { plural } from '@/utils/plural';

import type { NodeDashboard } from '../api/get-node-dashboard';
import { days, hours, n } from '../utils/format';

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3 border-t border-line py-3">
    <dt className="text-14 text-ink-2">{label}</dt>
    <dd className="tnum m-0 text-right text-14 text-ink-3">{children}</dd>
  </div>
);

const Strong = ({ children }: { children: React.ReactNode }) => <strong className="text-15 font-semibold text-ink">{children}</strong>;

/** « Activité » (maquette PAR-Tableau-de-bord) : agrégats de la paroisse sur la période. */
export const WeekActivity = ({ data }: { data: NodeDashboard }) => (
  <section aria-labelledby="tb-activite" className="rounded-16 border border-line bg-paper px-6 pb-6 pt-5 shadow-card">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id="tb-activite" className="m-0 text-20 font-semibold text-ink">
        Activité de la semaine
      </h2>
      <span className="text-13 text-ink-3">
        {data.period_days} derniers jours · données de la paroisse seule
      </span>
    </div>
    <dl className="m-0 mt-5 grid grid-cols-1 gap-x-8 md:grid-cols-2">
      <Row label="Fidèles actifs">
        <Strong>{n(data.fideles.active)}</Strong> sur {n(data.fideles.attached)}
      </Row>
      <Row label="Nouveaux rattachements">
        <Strong>{n(data.fideles.new)}</Strong>
      </Row>
      <Row label="Lectures d’annonces">
        <Strong>{n(data.annonces.reads)}</Strong>
      </Row>
      <Row label="Annonces publiées">
        <Strong>{n(data.annonces.published)}</Strong>
      </Row>
      <Row label="Demandes d’actes reçues">
        <Strong>{n(data.actes.received)}</Strong>
      </Row>
      <Row label="Délai médian des actes">
        <Strong>{days(data.actes.median_days_to_collect)}</Strong>
      </Row>
      <Row label="Conversations ouvertes">
        <Strong>{n(data.messagerie.conversations)}</Strong>
      </Row>
      <Row label="Première réponse, médiane">
        <Strong>{hours(data.messagerie.median_first_reply_hours)}</Strong>
      </Row>
      <Row label="Événements à venir">
        <Strong>{n(data.evenements.upcoming)}</Strong> · {plural(data.evenements.registrations, 'inscription', 'inscriptions')}
      </Row>
      <Row label="Confessions honorées">
        <Strong>{n(data.confessions.honoured)}</Strong> sur {n(data.confessions.booked)} prises
      </Row>
    </dl>
  </section>
);
