import type { Meta, StoryObj } from '@storybook/nextjs';

import { Pagination } from './pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta = { title: 'Primitives/Onglets et pages' };
export default meta;

export const Tous: StoryObj = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-6">
      <Tabs defaultValue="cours">
        <TabsList aria-label="Filtrer les demandes">
          <TabsTrigger value="cours" count={2}>
            En cours
          </TabsTrigger>
          <TabsTrigger value="finies" count={5}>
            Terminées
          </TabsTrigger>
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
        </TabsList>
        <TabsContent value="cours" className="pt-4">
          Demandes en cours
        </TabsContent>
      </Tabs>
      <Pagination offset={0} limit={10} total={17} onChange={() => {}} />
    </div>
  ),
};
