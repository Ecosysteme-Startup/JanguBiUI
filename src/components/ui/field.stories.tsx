import type { Meta, StoryObj } from '@storybook/nextjs';

import { Field } from './field';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';

const meta: Meta = { title: 'Primitives/Champs' };
export default meta;

export const Tous: StoryObj = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-2 gap-6">
      <Field id="par" label="Paroisse du sacrement" required success="Paroisse trouvée · Archidiocèse de Dakar">
        <Input defaultValue="Sainte-Thérèse de Grand-Dakar" valid />
      </Field>
      <Field id="annee" label="Année du baptême" required error="Quatre chiffres, par exemple 1992.">
        <Input defaultValue="199" />
      </Field>
      <Field id="acte" label="Type d\u2019acte" hint="Remis en original papier, signé et scellé.">
        <Select>
          <option>Extrait d\u2019acte de baptême</option>
          <option>Attestation de confirmation</option>
        </Select>
      </Field>
      <Field id="motif" label="Motif de la demande" hint="Visible par le secrétariat." counter={{ value: 44, max: 500 }}>
        <Textarea defaultValue="Mariage religieux prévu le 12 décembre 2026." rows={2} />
      </Field>
    </div>
  ),
};
