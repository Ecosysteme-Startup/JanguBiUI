import type { Meta, StoryObj } from '@storybook/nextjs';

import { Logotype } from '@/components/layouts/brand';

import { Logo } from './logo';

const meta: Meta<typeof Logo> = { title: 'Fondations/Logo', component: Logo };
export default meta;

export const Tailles: StoryObj<typeof Logo> = {
  render: () => (
    <div className="flex items-end gap-6">
      {[16, 24, 32, 40, 64].map((size) => (
        <Logo key={size} size={size} />
      ))}
    </div>
  ),
};

export const Monochrome: StoryObj<typeof Logo> = {
  render: () => (
    <div className="flex gap-4">
      <span className="inline-flex rounded-12 bg-primary-fill p-4 text-on-primary">
        <Logo tone="mono" size={40} />
      </span>
      <span className="inline-flex rounded-12 bg-inverse p-4 text-on-inverse">
        <Logo tone="mono" size={40} />
      </span>
    </div>
  ),
};

export const Logotypes: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Logotype size="sm" />
      <Logotype size="md" />
      <Logotype size="lg" />
    </div>
  ),
};
