'use client';

import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { FilterPills } from '@/components/ui/filter-pills';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvents } from '@/features/agenda/api/get-events';
import { EventCard } from '@/features/agenda/components/event-card';
import { EventForm } from '@/features/agenda/components/event-form';
import { useUser } from '@/lib/auth';
import { isAdmin, isClergy } from '@/lib/authorization';

const EVENT_TYPE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'mass', label: 'Messes' },
  { value: 'conference', label: 'Conférences' },
  { value: 'retreat', label: 'Retraites' },
  { value: 'ordination', label: 'Ordinations' },
  { value: 'other', label: 'Autres' },
];

const canManageAgenda = (user: Parameters<typeof isAdmin>[0]) =>
  isClergy(user) || isAdmin(user);

export default function AdminAgendaPage() {
  const { data: user } = useUser();
  const [selectedType, setSelectedType] = useState('');
  const [showForm, setShowForm] = useState(false);

  const canManage = canManageAgenda(user);
  const { data, isLoading: eventsLoading } = useEvents(
    selectedType ? { type: selectedType } : undefined,
    canManage,
  );

  return (
    <AdminPageLayout
      title="Gestion des événements"
      subtitle="Créer et gérer les événements de votre paroisse"
      allow={canManageAgenda}
      headerAction={
        <Button
          size="sm"
          icon={<CalendarPlus className="size-4" />}
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? 'Annuler' : 'Nouvel événement'}
        </Button>
      }
      toolbar={
        <FilterPills
          options={EVENT_TYPE_FILTERS}
          value={selectedType}
          onChange={setSelectedType}
          ariaLabel="Filtrer par type d'événement"
        />
      }
    >
      <div className="space-y-6">
        {showForm && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Nouvel événement
            </h2>
            <EventForm onSuccess={() => setShowForm(false)} />
          </section>
        )}

        {eventsLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} variant="elevated" className="space-y-3 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        )}

        {!eventsLoading && data?.results.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucun événement publié.
          </p>
        )}

        {!eventsLoading && data && data.results.length > 0 && (
          <div className="space-y-4">
            {data.results.map((event) => (
              <EventCard key={event.id} event={event} canDelete />
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
