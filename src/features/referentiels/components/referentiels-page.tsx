'use client';

import NextLink from 'next/link';
import * as React from 'react';

import { CAPABILITY_LABELS } from '@/components/signature/capability-chips';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading } from '@/components/ui/section-heading';
import { Select } from '@/components/ui/select';
import { LoadingBlock } from '@/components/ui/skeleton';
import { Table, Td, Th, Tr } from '@/components/ui/table';
import { TabLinks } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { paths } from '@/config/paths';
import { nodeTypeLabel, type NodeType, useNodeTypes } from '@/hooks/use-node-types';
import { CAPACITES } from '@/lib/capacites';

import { type CapabilityOverride, useCreateOverride, useDeleteOverride, useOverrides } from '../api/capability-overrides';
import { useDioceses } from '../api/get-dioceses';
import { type OfficeType, REQUIRED_ORDER, useOfficeCatalogue } from '../api/get-office-catalogue';

export const REFERENTIEL_TABS = ['offices', 'types', 'capacites', 'retraits'] as const;
export type ReferentielTab = (typeof REFERENTIEL_TABS)[number];

const tabHref = (tab: ReferentielTab) => `${paths.plateforme.referentiels.getHref()}?onglet=${tab}`;

const Loading = () => <LoadingBlock label="Chargement du référentiel…" lines={5} />;
const Failed = ({ message }: { message: string }) => (
  <EmptyState tone="err" icon="alerte" title="Le référentiel n’a pas pu être chargé">
    {message}
  </EmptyState>
);

const OfficesTab = ({ offices, types }: { offices: OfficeType[]; types: NodeType[] | undefined }) => {
  const officeLabel = (code: string) => offices.find((o) => o.code === code)?.label ?? code;
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section aria-labelledby="r-cat" className="min-w-0 lg:col-span-9">
        <SectionHeading id="r-cat" number="01" title="Catalogue d’offices" aside={`${offices.length} offices`} />
        <Table>
          <thead>
            <tr>
              <Th>Office</Th>
              <Th>S’exerce sur</Th>
              <Th>Condition d’ordre</Th>
              <Th>Titulaires</Th>
              <Th>Nommé par</Th>
              <Th>Héritage</Th>
            </tr>
          </thead>
          <tbody>
            {offices.map((o) => (
              <Tr key={o.code}>
                <th scope="row" className="h-14 border-b border-line pr-4 text-left text-sm font-semibold text-ink">
                  {o.label}
                </th>
                <Td>{o.node_types.map((t) => nodeTypeLabel(types, t)).join(', ')}</Td>
                <Td>{REQUIRED_ORDER[o.required_order ?? 'aucun']}</Td>
                <Td>{o.cardinality === 'one' ? 'Un seul' : 'Plusieurs'}</Td>
                <Td>{o.appointed_by_platform ? 'Plateforme' : o.appointed_by.map(officeLabel).join(', ') || '—'}</Td>
                <Td>{o.inherits_down ? 'Sous-arbre' : 'Nœud seul'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </section>
      <aside aria-labelledby="r-note" className="min-w-0 lg:col-span-3">
        <SectionHeading id="r-note" number="02" title="Catalogue fermé" />
        <p className="m-0 text-sm text-ink-2">
          Offices, types de nœuds et capacités sont fixés par le socle (RG-14) : les modifier demande une décision et une mise à jour de la
          plateforme.
        </p>
        <p className="m-0 mt-3 text-sm text-ink-2">
          Pour adapter un diocèse, retirez-lui une capacité d’un office dans l’onglet{' '}
          <NextLink href={tabHref('retraits')} className="text-primary">
            Retraits par diocèse
          </NextLink>
          .
        </p>
      </aside>
    </div>
  );
};

const TypesTab = ({ types }: { types: NodeType[] }) => (
  <section aria-labelledby="r-types">
    <SectionHeading id="r-types" number="01" title="Types de nœuds" aside={`${types.length} types`} />
    <Table>
      <thead>
        <tr>
          <Th>Type</Th>
          <Th>Code</Th>
          <Th>Territorial</Th>
          <Th>Tient des registres</Th>
          <Th>Parents autorisés</Th>
        </tr>
      </thead>
      <tbody>
        {[...types]
          .sort((a, b) => a.order - b.order)
          .map((t) => (
            <Tr key={t.code}>
              <th scope="row" className="h-14 border-b border-line pr-4 text-left text-sm font-semibold text-ink">
                {t.label}
              </th>
              <Td className="tnum text-meta text-ink-3">{t.code}</Td>
              <Td>{t.is_territorial ? 'Oui' : 'Non'}</Td>
              <Td>{t.holds_registers ? 'Oui' : 'Non'}</Td>
              <Td>{t.allowed_parent_types.map((p) => nodeTypeLabel(types, p)).join(', ') || 'Racine'}</Td>
            </Tr>
          ))}
      </tbody>
    </Table>
  </section>
);

const MatrixTab = ({ offices }: { offices: OfficeType[] }) => (
  <section aria-labelledby="r-mat">
    <SectionHeading id="r-mat" number="01" title="Matrice offices × capacités" aside="Marqué : capacité incluse dans l’office" />
    <Table className="text-xs">
      <thead>
        <tr>
          <Th>Office</Th>
          {CAPACITES.map((c) => (
            <Th key={c} title={c} className="h-auto whitespace-normal py-2 text-center align-bottom">
              {CAPABILITY_LABELS[c] ?? c}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {offices.map((o) => (
          <Tr key={o.code}>
            <th scope="row" className="h-11 border-b border-line pr-4 text-left text-sm font-semibold text-ink">
              {o.label}
            </th>
            {CAPACITES.map((c) => (
              <Td key={c} className="h-11 text-center">
                {c === 'plateforme.admin' ? (
                  <span className="text-ink-3" title="Réservé au rôle realm platform_admin">
                    <span aria-hidden="true">·</span>
                    <span className="sr-only">Réservé au rôle realm</span>
                  </span>
                ) : o.capabilities.includes(c) ? (
                  <Icon name="check" size={16} className="inline text-primary" label={`${o.label} : ${c}`} />
                ) : (
                  <span className="sr-only">Non</span>
                )}
              </Td>
            ))}
          </Tr>
        ))}
      </tbody>
    </Table>
    <p className="m-0 mt-3 text-meta text-ink-3">plateforme.admin : réservé au rôle realm platform_admin, jamais attribué par un office.</p>
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
    <form onSubmit={submit} noValidate aria-labelledby="r-ajout" className="flex flex-col gap-4 border border-line bg-surface p-5">
      <h3 id="r-ajout" className="m-0 font-serif text-h4 font-normal text-ink">
        Retirer une capacité
      </h3>
      <Field id="r-diocese" label="Diocèse" required>
        <Select value={diocese} onChange={(e) => setDiocese(e.target.value)}>
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
        <Select value={capability} onChange={(e) => setCapability(e.target.value)} disabled={!office}>
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
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <section aria-labelledby="r-retraits" className="min-w-0 lg:col-span-8">
        <SectionHeading
          id="r-retraits"
          number="01"
          title="Retraits de capacités par diocèse"
          aside={overrides.data ? `${overrides.data.length}` : undefined}
        />
        {overrides.isPending ? (
          <Loading />
        ) : overrides.isError ? (
          <Failed message={overrides.error.message} />
        ) : overrides.data.length === 0 ? (
          <EmptyState icon="check" title="Aucun retrait">
            Tous les diocèses appliquent le catalogue complet.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Diocèse</Th>
                <Th>Office</Th>
                <Th>Capacité retirée</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {overrides.data.map((o) => (
                <Tr key={o.id}>
                  <Td className="font-medium">{dioceseName(o.diocese_node_id)}</Td>
                  <Td>{officeLabel(o.office)}</Td>
                  <Td className="tnum">{o.capability}</Td>
                  <Td className="text-right">
                    <Button
                      variant="tertiary"
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
        )}
      </section>
      <div className="min-w-0 lg:col-span-4">
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
  if (tab === 'capacites') return <MatrixTab offices={offices.data} />;
  if (tab === 'retraits') return <OverridesTab offices={offices.data} />;
  return <OfficesTab offices={offices.data} types={types.data} />;
};

/** Référentiels de la plateforme (PLA-Referentiels). */
export const ReferentielsPage = ({ tab }: { tab: ReferentielTab }) => {
  const offices = useOfficeCatalogue();
  const types = useNodeTypes();
  const items = [
    { tab: 'offices' as const, label: 'Catalogue d’offices', count: offices.data?.length },
    { tab: 'types' as const, label: 'Types de nœuds', count: types.data?.length },
    { tab: 'capacites' as const, label: 'Capacités', count: CAPACITES.length },
    { tab: 'retraits' as const, label: 'Retraits par diocèse' },
  ];

  return (
    <div>
      <PageHeader number="02" eyebrow="Paramétrage · catalogue en vigueur" title="Référentiels" />
      <TabLinks
        label="Référentiels"
        className="mt-8"
        items={items.map((i) => ({ href: tabHref(i.tab), label: i.label, count: i.count, active: i.tab === tab }))}
      />
      <div className="mt-8">
        <TabBody tab={tab} />
      </div>
    </div>
  );
};
