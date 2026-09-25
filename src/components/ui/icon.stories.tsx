import type { Meta, StoryObj } from '@storybook/nextjs';

import { Avatar } from './avatar';
import { Icon, ICON_NAMES } from './icon';

const meta: Meta = { title: 'Fondations/Icônes' };
export default meta;

export const Jeu: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <ul className="m-0 grid list-none grid-cols-6 gap-4 p-0">
        {ICON_NAMES.map((name) => (
          <li key={name} className="flex flex-col items-center gap-2 text-meta text-ink-3">
            <Icon name={name} size={24} className="text-ink" />
            {name}
          </li>
        ))}
      </ul>
      <Avatar name="Augustin Ndiaye" />
    </div>
  ),
};
