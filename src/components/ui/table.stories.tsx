import type { Meta, StoryObj } from '@storybook/nextjs';

import { StatusDot } from '../signature/status-dot';

import { Table, Td, Th, Tr } from './table';

const meta: Meta = { title: 'Primitives/Tableau' };
export default meta;

export const Demandes: StoryObj = {
  render: () => (
    <Table>
      <thead>
        <tr>
          <Th>Réf.</Th>
          <Th>Demandeur</Th>
          <Th>Acte</Th>
          <Th>Statut</Th>
          <Th className="text-right">Délai</Th>
        </tr>
      </thead>
      <tbody>
        <Tr>
          <Td className="tnum text-xs">JB-2026-00409</Td>
          <Td className="font-medium">Awa Faye</Td>
          <Td className="text-ink-2">Mariage religieux</Td>
          <Td>
            <StatusDot status="under_verification" />
          </Td>
          <Td className="tnum text-right text-xs">7 j</Td>
        </Tr>
        <Tr selected>
          <Td className="tnum text-xs">JB-2026-00415</Td>
          <Td className="font-semibold">Jean-Baptiste Sène</Td>
          <Td className="text-ink-2">Confirmation</Td>
          <Td>
            <StatusDot status="info_requested" />
          </Td>
          <Td className="tnum text-right text-xs">2 j</Td>
        </Tr>
      </tbody>
    </Table>
  ),
};
