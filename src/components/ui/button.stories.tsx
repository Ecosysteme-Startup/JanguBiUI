import type { Meta, StoryObj } from '@storybook/nextjs';

import { Button } from './button';
import { Icon } from './icon';

const meta: Meta<typeof Button> = { title: 'Primitives/Bouton', component: Button, args: { children: 'Envoyer' } };
export default meta;
type Story = StoryObj<typeof Button>;

export const Primaire: Story = { args: { variant: 'primary' } };
export const Secondaire: Story = { args: { variant: 'secondary', children: 'Modifier' } };
export const Tertiaire: Story = { args: { variant: 'tertiary', children: 'Tout voir' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Rejeter' } };
export const Desactive: Story = { args: { disabled: true } };
export const Tailles: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="lg">
        Se connecter <Icon name="fleche-droite" size={16} />
      </Button>
      <Button size="md">44</Button>
      <Button size="sm" variant="secondary">
        36 dense
      </Button>
    </div>
  ),
};
