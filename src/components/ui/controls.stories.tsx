import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { Chip, ChipGroup } from './chip';
import { Choice } from './choice';
import { Switch } from './switch';

const meta: Meta = { title: 'Primitives/Contrôles' };
export default meta;

const SwitchDemo = () => {
  const [on, setOn] = useState(true);
  return <Switch checked={on} onCheckedChange={setOn} label="Annonces" />;
};

export const Tous: StoryObj = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Choice label="Recevoir les annonces du dimanche" defaultChecked />
      <Choice type="radio" name="retrait" label="Paroisse du sacrement" defaultChecked />
      <Choice type="radio" name="retrait" label="Transmis à Saint-Dominique" />
      <SwitchDemo />
      <ChipGroup label="Filtrer par statut">
        <Chip pressed>Toutes · 17</Chip>
        <Chip pressed={false}>Soumises</Chip>
        <Chip pressed={false}>En retard · 2</Chip>
      </ChipGroup>
    </div>
  ),
};
