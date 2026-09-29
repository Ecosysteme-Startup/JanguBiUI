import { z } from 'zod';

// Chapelet — backend apps/rosary/serializers.py (listes NUES, pas de pagination).
//   GET /v1/rosary/today/   → { day: RosaryDay, standalone_prayers: Prayer[] }
//   GET /v1/rosary/groups/  → Group[]
// Les fichiers audio sont absents (null) quand rien n'a été téléversé.

export const prayerSchema = z.object({
  id: z.number(),
  type: z.string(),
  type_display: z.string().default(''),
  language: z.string().default('FR'),
  text: z.string(),
  source: z.string().default(''),
});

export const mysterySchema = z.object({
  id: z.number(),
  order: z.number(),
  title: z.string(),
  meditation: z.string().nullable().optional(),
  meditation_source: z.string().nullable().optional(),
  fruit: z.string().nullable().optional(),
  audio_file: z.string().nullable().default(null),
  audio_duration: z.number().nullable().optional(),
  prayers: z.array(z.unknown()).default([]),
});

export const rosaryGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  audio_file: z.string().nullable().default(null),
  mysteries: z.array(mysterySchema).default([]),
});

export const rosaryDaySchema = z.object({
  id: z.number(),
  weekday: z.number().optional(),
  weekday_display: z.string(),
  group: rosaryGroupSchema,
});

export const todayRosarySchema = z.object({
  day: rosaryDaySchema,
  standalone_prayers: z.array(prayerSchema).default([]),
});

export type Prayer = z.infer<typeof prayerSchema>;
export type Mystery = z.infer<typeof mysterySchema>;
export type RosaryGroup = z.infer<typeof rosaryGroupSchema>;
export type TodayRosary = z.infer<typeof todayRosarySchema>;
