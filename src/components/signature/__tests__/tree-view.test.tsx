import { render, screen } from '@testing-library/react';

import { TreeView } from '../tree-view';

describe('TreeView', () => {
  it('garde les noms longs lisibles : retour à la ligne et infobulle, pas de troncature (A11Y-18)', () => {
    render(
      <TreeView
        label="Arbre des juridictions"
        onSelect={() => {}}
        defaultExpanded={['dakar']}
        nodes={[{ id: 'dakar', label: 'Archidiocèse de Dakar', children: [{ id: 'sd', label: 'Sainte-Thérèse de Grand-Dakar' }] }]}
      />,
    );
    const label = screen.getByTitle('Sainte-Thérèse de Grand-Dakar');
    expect(label).toHaveClass('break-words');
    expect(label).not.toHaveClass('truncate');
    expect(screen.getByRole('treeitem', { name: /Sainte-Thérèse de Grand-Dakar/ })).toBeInTheDocument();
  });
});
