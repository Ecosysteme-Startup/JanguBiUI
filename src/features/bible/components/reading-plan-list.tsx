'use client';

import { BookOpen, Calendar, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/lib/auth';
import { isPretre } from '@/lib/authorization';

import { useCreateReadingPlan } from '../api/create-reading-plan';
import type { CreateReadingPlanInput } from '../api/create-reading-plan';
import { useReadingPlans } from '../api/get-reading-plans';
import type { ReadingPlan } from '../api/get-reading-plans';
import {
  useSubscribeReadingPlan,
  useUnsubscribeReadingPlan,
} from '../api/subscribe-reading-plan';

function PlanCard({ plan }: { plan: ReadingPlan }) {
  const { mutate: subscribe, isPending: subscribing } =
    useSubscribeReadingPlan();
  const { mutate: unsubscribe, isPending: unsubscribing } =
    useUnsubscribeReadingPlan();

  return (
    <Card variant="elevated" className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="size-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{plan.title}</h3>
          {plan.description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {plan.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              <span>
                {new Date(plan.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            {plan.author_email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                <span>{plan.author_email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => subscribe(plan.id)}
          disabled={subscribing || unsubscribing}
          className="flex-1"
        >
          {subscribing ? 'Inscription…' : "S'inscrire"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => unsubscribe(plan.id)}
          disabled={subscribing || unsubscribing}
          className="text-muted-foreground"
        >
          Se désinscrire
        </Button>
      </div>
    </Card>
  );
}

type CreatePlanFormValues = {
  title: string;
  description: string;
};

function CreatePlanForm({ onClose }: { onClose: () => void }) {
  const { mutate: createPlan, isPending } = useCreateReadingPlan({
    onSuccess: onClose,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePlanFormValues>({
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = (data: CreatePlanFormValues) => {
    // ReadingPlanInput : titre et description ; la publication est une
    // action distincte (POST /v1/bible/reading-plans/<id>/publish/).
    createPlan(data satisfies CreateReadingPlanInput);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-foreground">
        Nouveau parcours de lecture
      </h3>

      <div className="space-y-1">
        <label
          htmlFor="plan-title"
          className="text-xs font-medium text-muted-foreground"
        >
          Titre *
        </label>
        <input
          id="plan-title"
          {...register('title', { required: true })}
          placeholder="Ex. Parcours évangile de Marc — 30 jours"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        {errors.title && (
          <p className="text-xs text-destructive">Le titre est requis.</p>
        )}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="plan-description"
          className="text-xs font-medium text-muted-foreground"
        >
          Description
        </label>
        <textarea
          id="plan-description"
          {...register('description')}
          rows={3}
          placeholder="Décrivez le parcours et ses objectifs…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending} className="flex-1">
          {isPending ? 'Création…' : 'Créer le parcours'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

export function ReadingPlanList() {
  const { data: user } = useUser();
  const { data, isLoading, isError } = useReadingPlans();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const canCreate = isPretre(user);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive text-center py-6">
        Erreur lors du chargement des plans.
      </p>
    );
  }

  const plans = data?.results ?? [];

  return (
    <div className="space-y-4">
      {canCreate && (
        <div>
          {showCreateForm ? (
            <CreatePlanForm onClose={() => setShowCreateForm(false)} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="size-4" />
              Créer un parcours
            </Button>
          )}
        </div>
      )}

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun parcours de lecture disponible.
        </p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
