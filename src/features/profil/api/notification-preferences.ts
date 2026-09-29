import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api, saveBlob } from '@/lib/api-client';

// `GET|PUT /v1/me/notification-preferences/` (NotificationPreference).
export const notificationPreferencesSchema = z.object({
  in_app: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
  topic_annonces: z.boolean(),
  topic_evenements: z.boolean(),
  /** « 22:00:00 » : heures calmes (pas de push). */
  quiet_start: z.string(),
  quiet_end: z.string(),
});
export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

const key = ['me', 'notification-preferences'] as const;

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: key,
    queryFn: () =>
      api
        .get<unknown>('/v1/me/notification-preferences/')
        .then((d) => notificationPreferencesSchema.parse(d)),
  });

export const useUpdateNotificationPreferences = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      api
        .put<unknown>('/v1/me/notification-preferences/', prefs)
        .then((d) => notificationPreferencesSchema.parse(d)),
    onMutate: async (prefs) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<NotificationPreferences>(key);
      qc.setQueryData(key, prefs);
      return { previous };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },
    onSuccess: (data) => qc.setQueryData(key, data),
  });
};

/** `GET /v1/me/export/` : copie de mes données (JSON), enregistrée localement. */
export const useExportMyData = () =>
  useMutation({
    mutationFn: async () => {
      const blob = await api.blob('/v1/me/export/');
      saveBlob(blob, 'jangubi-mes-donnees.json');
    },
  });
