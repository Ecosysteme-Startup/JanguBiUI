import type { Decorator, Preview } from '@storybook/nextjs';
import React from 'react';

import '../src/styles/globals.css';

// 4 palettes × clair/sombre (ADR-F04) : chaque story se relit dans toutes les variantes.
const withTheme: Decorator = (Story, context) => {
  const { palette, mode } = context.globals as { palette: string; mode: string };
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = palette;
    root.classList.toggle('dark', mode === 'sombre');
  }, [palette, mode]);
  return (
    <div className="bg-paper p-6 font-sans text-ink">
      <Story />
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    palette: {
      description: 'Palette',
      toolbar: { title: 'Palette', items: ['ciel', 'lumiere', 'atlantique', 'cathedrale'], dynamicTitle: true },
    },
    mode: {
      description: 'Thème',
      toolbar: { title: 'Thème', items: ['clair', 'sombre'], dynamicTitle: true },
    },
  },
  initialGlobals: { palette: 'ciel', mode: 'clair' },
  decorators: [withTheme],
  parameters: { a11y: { test: 'error' }, nextjs: { appDirectory: true } },
};

export default preview;
