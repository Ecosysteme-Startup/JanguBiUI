'use client';

import type * as React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import { Field } from '@/components/ui/field';
import { Icon, type IconName } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { dayjs } from '@/utils/dates';

import type { StaffArticle } from '../api/staff-article';
import { nextSundays, sundayLabel } from '../utils/sundays';

import type { EditorValues } from './editor-schema';

/** Rangée d'option (icône, libellé, aide, interrupteur) dans la liste encadrée de « Publication ». */
const OptionRow = ({ icon, children }: { icon: IconName; children: React.ReactNode }) => (
  <div className="flex items-start gap-3.5 border-b border-line px-4 py-3.5 last:border-b-0">
    <Icon name={icon} size={20} className="mt-0.5 shrink-0 text-ink-2" />
    <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
  </div>
);

type PublicationPanelProps = { form: UseFormReturn<EditorValues>; article: StaffArticle | null };

/** Carte « Publication » de PAR-Annonce-Editeur : moment, date et heure, dimanche, notification. */
export const PublicationPanel = ({ form, article }: PublicationPanelProps) => {
  const { register, control, watch, formState } = form;
  const when = watch('when');
  const isSunday = watch('is_sunday_notice');
  const sundayDate = watch('sunday_date');
  const sundays = nextSundays(dayjs());
  const sundayOptions = sundayDate && !sundays.includes(sundayDate) ? [sundayDate, ...sundays] : sundays;
  const status = article?.status ?? 'draft';
  const canSchedule = status !== 'published';

  return (
    <section aria-labelledby="ed-publication" className="flex flex-col gap-4 rounded-16 border border-line bg-paper p-5 shadow-card">
      <h2 id="ed-publication" className="m-0 text-20 font-semibold text-ink">
        Publication
      </h2>
      {canSchedule && (
        <>
          <Controller
            control={control}
            name="when"
            render={({ field }) => (
              <SegmentedControl
                label="Moment de publication"
                value={field.value}
                onChange={field.onChange}
                size="lg"
                className="grid grid-cols-2"
                options={[
                  ['now', 'Maintenant'],
                  ['schedule', 'Programmer'],
                ]}
              />
            )}
          />
          {when === 'schedule' && (
            <div className="grid grid-cols-[minmax(0,1fr)_120px] items-start gap-3">
              <Field id="ed-jour" label="Date" error={formState.errors.publish_date?.message}>
                <Input type="date" {...register('publish_date')} controlSize="sm" className="text-15" />
              </Field>
              <Field id="ed-heure" label="Heure">
                <Input type="time" {...register('publish_time')} controlSize="sm" className="tnum text-15" />
              </Field>
            </div>
          )}
        </>
      )}
      <div className="overflow-hidden rounded-12 border border-line">
        <OptionRow icon="calendrier">
          <Controller
            control={control}
            name="is_sunday_notice"
            render={({ field }) => (
              <Switch
                size="lg"
                id="ed-dim"
                checked={field.value}
                onCheckedChange={field.onChange}
                label="Annonce du dimanche"
                description="En tête de « Ma paroisse » et de la feuille du dimanche"
              />
            )}
          />
          {isSunday && (
            <Field id="ed-date-dim" label="Dimanche concerné" required error={formState.errors.sunday_date?.message}>
              <Select {...register('sunday_date')} controlSize="sm" className="text-15">
                <option value="">Choisir un dimanche</option>
                {sundayOptions.map((d) => (
                  <option key={d} value={d}>
                    {sundayLabel(d)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </OptionRow>
        {canSchedule && (
          <OptionRow icon="cloche">
            <Controller
              control={control}
              name="notify_followers"
              render={({ field }) => (
                <Switch
                  size="lg"
                  id="ed-notifier"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  label="Notifier les fidèles"
                  description="Aux fidèles rattachés, à l’heure de publication"
                />
              )}
            />
          </OptionRow>
        )}
      </div>
    </section>
  );
};
