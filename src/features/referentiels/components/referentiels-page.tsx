'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { CAPABILITY_LABELS } from '@/components/signature/capability-chips';
import { Button } from '@/components/ui/button';
import { Card, cardClasses } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { TabLinks } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { nodeTypeLabel, type NodeType, useNodeTypes } from '@/hooks/use-node-types';
import { CAPACITES } from '@/lib/capacites';
import { cn } from '@/utils/cn';

import { type CapabilityOverride, useCreateOverride, useDeleteOverride, useOverrides } from '../api/capability-overrides';
import { useDioceses } from '../api/get-dioceses';
import { type OfficeType, REQUIRED_ORDER, useOfficeCatalogue } from '../api/get-office-catalogue';
import type { ReferentielTab } from '../utils/tabs';

const tabHref = (tab: ReferentielTab) => `${paths.plateforme.referentiels.getHref()}?onglet=${tab}`;

const Loading = () => <LoadingBlock label="Chargement du référentiel…" lines={5} />;
const Failed = ({ message }: { message: string }) => (
  <EmptyState tone="err" icon="alerte" title="Le référentiel n’a pas pu être chargé">
    {message}
  </EmptyState>
);

/** Carte de tableau (rayon 16, ombre carte), tableaux du référentiel. */
const TableCard = ({ children }: { children: React.ReactNode }) => (
  <Card padding="none" className="overflow-hidden">
    {children}
  </Card>
);

const RowHead = ({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) => (
  <th scope="row" className="h-14 border-b border-line py-2 pl-5 pr-4 text-left align-middle">
    <span className="block text-15 font-semibold text-ink">{children}</span>
    {sub && <span className="block text-13 font-normal text-ink-3">{sub}</span>}
  </th>
);

const OfficesTab = ({ offices, types }: { offices: OfficeType[]; types: NodeType[] | undefined }) => {
  const officeLabel = (code: string) => offices.find((o) => o.code === code)?.label ?? code;
  return (
    <section aria-label="Catalogue d’offices" className="flex flex-col gap-3">
      <TableCard>
        <Table>
          <thead>
            <tr>
              <Th className="h-10">Office</Th>
              <Th className="h-10">S’exerce sur</Th>
              <Th className="h-10">Condition d’ordre</Th>
              <Th className="h-10">Titulaires</Th>
              <Th className="h-10">Nommé par</Th>
              <Th className="h-10">Héritage</Th>
            </tr>
          </thead>
          <tbody>
            {offices.map((o) => (
              <Tr key={o.code}>
                <RowHead>{o.label}</RowHead>
                <Td className="h-14 text-ink-2">{o.node_types.map((t) => nodeTypeLabel(types, t)).join(', ')}</Td>
                <Td className="h-14 text-ink-2">{REQUIRED_ORDER[o.required_order ?? 'aucun']}</Td>
                <Td className="h-14 text-ink-2">{o.cardinality === 'one' ? 'Un seul' : 'Plusieurs'}</Td>
                <Td className="h-14 text-ink-2">{o.appointed_by_platform ? 'Plateforme' : o.appointed_by.map(officeLabel).join(', ') || '—'}</Td>
                <Td className="h-14 text-ink-2">{o.inherits_down ? 'Sous-arbre' : 'Nœud seul'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard>
      <p className="m-0 flex gap-2 text-13 text-ink-3">
        <Icon name="info" size={16} className="mt-px shrink-0" />
        <span>
          Pour adapter un diocèse, retirez-lui une capacité d’un office dans l’onglet{' '}
          <NextLink href={tabHref('retraits')} className="font-semibold">
            Retraits par diocèse
          </NextLink>
          .
        </span>
      </p>
    </section>
  );
};

const TypesTab = ({ types }: { types: NodeType[] }) => (
  <section aria-label="Types de nœuds">
    <TableCard>
      <Table>
        <thead>
          <tr>
            <Th className="h-10">Type</Th>
            <Th className="h-10">Code</Th>
            <Th className="h-10">Territorial</Th>
            <Th className="h-10">Tient des registres</Th>
            <Th className="h-10">Parents autorisés</Th>
          </tr>
        </thead>
        <tbody>
          {[...types]
            .sort((a, b) => a.order - b.order)
            .map((t) => (
              <Tr key={t.code}>
                <RowHead>{t.label}</RowHead>
                <Td className="tnum h-14 text-13 text-ink-3">{t.code}</Td>
                <Td className="h-14 text-ink-2">{t.is_territorial ? 'Oui' : 'Non'}</Td>
                <Td className="h-14 text-ink-2">{t.holds_registers ? 'Oui' : 'Non'}</Td>
                <Td className="h-14 text-ink-2">{t.allowed_parent_types.map((p) => nodeTypeLabel(types, p)).join(', ') || 'Racine'}</Td>
              </Tr>
            ))}
        </tbody>
      </Table>
    </TableCard>
  </section>
);

/** Colonnes de la matrice, regroupées comme WEB-PLA-Referentiels (plateforme.admin exclue : rôle realm). */
const MATRIX_GROUPS: { label: string; columns: { code: string; label: string }[] }[] = [
  {
    label: 'Vie paroissiale',
    columns: [
      { code: 'annonces.publier', label: 'Publier des annonces' },
      { code: 'horaires.gerer', label: 'Horaires et lieux' },
      { code: 'evenements.gerer', label: 'Agenda' },
    ],
  },
  {
    label: 'Demandes d’actes',
    columns: [
      { code: 'actes.traiter', label: 'Traiter les demandes' },
      { code: 'actes.superviser', label: 'Superviser' },
    ],
  },
  {
    label: 'Pastorale',
    columns: [
      { code: 'messagerie.recevoir_fideles', label: 'Recevoir des messages' },
      { code: 'confessions.gerer', label: 'Ouvrir des créneaux' },
      { code: 'confessions.voir_planning', label: 'Voir le planning' },
    ],
  },
  {
    label: 'Gouvernance',
    columns: [
      { code: 'structure.gerer', label: 'Modifier la structure' },
      { code: 'offices.nommer', label: 'Nommer' },
      { code: 'personnes.verifier', label: 'Vérifier les clercs' },
      { code: 'tableau_bord.voir', label: 'Voir les agrégats' },
      { code: 'audit.voir', label: 'Journal d’audit' },
    ],
  },
];

/** Case de la matrice (lecture seule) : case cochée b600, sinon contour lineField. */
const Box = ({ checked, label }: { checked: boolean; label?: string }) =>
  checked ? (
    <span role="img" aria-label={label} className="inline-flex size-5 items-center justify-center rounded-6 bg-primary-fill text-on-primary">
      <Icon name="check" size={14} strokeWidth={2.5} />
    </span>
  ) : (
    <span aria-hidden="true" className="inline-block size-5 rounded-6 border-1.5 border-line-field" />
  );

const MatrixTab = ({ offices, types }: { offices: OfficeType[]; types: NodeType[] | undefined }) => (
  <section aria-label="Matrice des capacités" className="flex flex-col gap-4">
    <div aria-hidden="true" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-13 text-ink-2">
      <span className="inline-flex items-center gap-2">
        <Box checked />
        Accordée
      </span>
      <span className="inline-flex items-center gap-2">
        <Box checked={false} />
        Non accordée
      </span>
    </div>
    <TableCard>
      <Table label="Matrice des capacités, défilement horizontal" className="text-13">
        <thead>
          <tr>
            <td rowSpan={2} className="border-b border-line bg-surface pl-5 align-bottom">
              <span className="block pb-3 text-13 font-medium text-ink-2">Office · portée</span>
            </td>
            {MATRIX_GROUPS.map((g) => (
              <th
                key={g.label}
                scope="colgroup"
                colSpan={g.columns.length}
                className="bg-surface px-2 pb-2 pt-3 text-center text-13 font-semibold text-ink"
              >
                <span className="block border-b border-line pb-2">{g.label}</span>
              </th>
            ))}
          </tr>
          <tr>
            {MATRIX_GROUPS.flatMap((g) => g.columns).map((c) => (
              <th
                key={c.code}
                scope="col"
                title={c.code}
                className="w-18 border-b border-line bg-surface px-1 pb-3 pt-1 text-center align-bottom text-12 font-normal leading-4 text-ink-2"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {offices.map((o) => (
            <Tr key={o.code}>
              <RowHead sub={o.node_types.map((t) => nodeTypeLabel(types, t)).join(', ')}>{o.label}</RowHead>
              {MATRIX_GROUPS.flatMap((g) => g.columns).map((c) => (
                <Td key={c.code} className="h-14 px-1 text-center first:pl-1 last:pr-1">
                  {o.capabilities.includes(c.code) ? (
                    <Box checked label={`${o.label} : ${c.code}`} />
                  ) : (
                    <>
                      <Box checked={false} />
                      <span className="sr-only">Non</span>
                    </>
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
    </TableCard>
    <p className="m-0 flex gap-2 text-13 text-ink-3">
      <Icon name="info" size={16} className="mt-px shrink-0" />
      Une capacité vaut pour le nœud de l’office et tout son sous-arbre. Aucune ne donne accès au contenu des messages.
      « Plateforme » (plateforme.admin) est réservée au rôle realm platform_admin, jamais attribuée par un office.
    </p>
  </section>
);

const OverrideForm = ({ offices }: { offices: OfficeType[] }) => {
  const dioceses = useDioceses();
  const create = useCreateOverride();
  const [diocese, setDiocese] = React.useState('');
  const [office, setOffice] = React.useState('');
  const [capability, setCapability] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const capabilities = offices.find((o) => o.code === office)?.capabilities ?? [];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!diocese || !office || !capability) {
      setError('Choisissez le diocèse, l’office et la capacité à retirer.');
      return;
    }
    setError(null);
    create.mutate(
      { diocese_node_id: diocese, office, capability },
      {
        onSuccess: () => {
          toast.ok('Capacité retirée. Inscrit au journal d’audit.');
          setCapability('');
        },
        onError: (e) => setError(e.message),
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate aria-labelledby="r-ajout" className={cn(cardClasses({ padding: 'none' }), 'flex flex-col gap-4 px-6 py-5')}>
      <h3 id="r-ajout" className="m-0 text-18 font-semibold leading-[26px] text-ink">
        Retirer une capacité
      </h3>
      <Field id="r-diocese" label="Diocèse" required>
        <Select controlSize="sm" value={diocese} onChange={(e) => setDiocese(e.target.value)}>
          <option value="">Choisir…</option>
          {(dioceses.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="r-office" label="Office" required>
        <Select
          controlSize="sm"
          value={office}
          onChange={(e) => {
            setOffice(e.target.value);
            setCapability('');
          }}
        >
          <option value="">Choisir…</option>
          {offices.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="r-capacite" label="Capacité retirée" required>
        <Select controlSize="sm" value={capability} onChange={(e) => setCapability(e.target.value)} disabled={!office}>
          <option value="">Choisir…</option>
          {capabilities.map((c) => (
            <option key={c} value={c}>
              {CAPABILITY_LABELS[c] ?? c} ({c})
            </option>
          ))}
        </Select>
      </Field>
      <div aria-live="polite">{error && <Notice tone="err" title={error} />}</div>
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? 'Enregistrement…' : 'Retirer la capacité'}
      </Button>
    </form>
  );
};

const OverridesTab = ({ offices }: { offices: OfficeType[] }) => {
  const overrides = useOverrides();
  const dioceses = useDioceses();
  const remove = useDeleteOverride();
  const [pending, setPending] = React.useState<CapabilityOverride | null>(null);
  const officeLabel = (code: string) => offices.find((o) => o.code === code)?.label ?? code;
  const dioceseName = (id: string) => dioceses.data?.find((d) => d.id === id)?.name ?? 'Diocèse';

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section aria-label="Retraits de capacités par diocèse" className="min-w-0">
        {overrides.isPending ? (
          <Loading />
        ) : overrides.isError ? (
          <Failed message={overrides.error.message} />
        ) : overrides.data.length === 0 ? (
          <Card padding="lg">
            <EmptyState icon="check" title="Aucun retrait">
              Tous les diocèses appliquent le catalogue complet.
            </EmptyState>
          </Card>
        ) : (
          <TableCard>
          <Table>
            <thead>
              <tr>
                <Th className="h-10">Diocèse</Th>
                <Th className="h-10">Office</Th>
                <Th className="h-10">Capacité retirée</Th>
                <Th className="h-10">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {overrides.data.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-semibold">{dioceseName(o.diocese_node_id)}</Td>
                  <Td className="text-ink-2">{officeLabel(o.office)}</Td>
                  <Td>
                    <span className="block">{CAPABILITY_LABELS[o.capability] ?? o.capability}</span>
                    <span className="tnum block text-13 text-ink-3">{o.capability}</span>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPending(o)}
                      aria-label={`Rétablir ${o.capability} pour ${officeLabel(o.office)}`}
                    >
                      Rétablir
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          </TableCard>
        )}
      </section>
      <div className="min-w-0">
        <OverrideForm offices={offices} />
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Rétablir cette capacité ?"
        description={
          pending ? `${officeLabel(pending.office)} · ${pending.capability} · ${dioceseName(pending.diocese_node_id)}` : undefined
        }
        confirmLabel="Rétablir"
        pending={remove.isPending}
        onConfirm={() =>
          pending &&
          remove.mutate(pending.id, {
            onSuccess: () => {
              toast.ok('Capacité rétablie.');
              setPending(null);
            },
            onError: (e) => toast.err(e.message),
          })
        }
      />
    </div>
  );
};

const TabBody = ({ tab }: { tab: ReferentielTab }) => {
  const offices = useOfficeCatalogue();
  const types = useNodeTypes();
  if (tab === 'types') {
    if (types.isPending) return <Loading />;
    if (types.isError) return <Failed message={types.error.message} />;
    return <TypesTab types={types.data} />;
  }
  if (offices.isPending) return <Loading />;
  if (offices.isError) return <Failed message={offices.error.message} />;
  if (tab === 'capacites') return <MatrixTab offices={offices.data} types={types.data} />;
  if (tab === 'retraits') return <OverridesTab offices={offices.data} />;
  return <OfficesTab offices={offices.data} types={types.data} />;
};

/** Référentiels de la plateforme (PLA-Referentiels). */
export const ReferentielsPage = ({ tab }: { tab: ReferentielTab }) => {
  const offices = useOfficeCatalogue();
  const types = useNodeTypes();
  const items = [
    { tab: 'types' as const, label: 'Types de nœuds', count: types.data?.length },
    { tab: 'offices' as const, label: 'Catalogue d’offices', count: offices.data?.length },
    { tab: 'capacites' as const, label: 'Matrice des capacités', count: CAPACITES.length - 1 },
    { tab: 'retraits' as const, label: 'Retraits par diocèse' },
  ];

  return (
    <div>
      <PageHeader compact title="Référentiels" description="Types de nœuds, offices et capacités, communs à tous les diocèses." />
      <Notice tone="info" icon="cadenas" title="Catalogue fermé" className="mt-6">
        Offices, types de nœuds et capacités sont fixés par le socle (RG-14) : les modifier demande une décision et une mise à jour de la
        plateforme. Un diocèse s’adapte par des retraits de capacités.
      </Notice>
      <TabLinks
        label="Référentiels"
        countPill
        className="mt-6 gap-7 px-0"
        items={items.map((i) => ({ href: tabHref(i.tab), label: i.label, count: i.count, active: i.tab === tab }))}
      />
      <div className="mt-6">
        <TabBody tab={tab} />
      </div>
    </div>
  );
};
