import { z } from 'zod';

/**
 * Formes réelles des serializers `apps/messaging/serializers.py` (le code fait foi).
 * `last_message` : `{id, sender_id, content, sent_at} | null` (`sender_id` facultatif pour les
 * serveurs antérieurs au correctif de contrat).
 */
export const participantSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
});
export type Participant = z.infer<typeof participantSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  participant_a: participantSchema,
  participant_b: participantSchema,
  last_message: z
    .object({
      id: z.string(),
      sender_id: z.string().optional(),
      content: z.string().nullable(),
      sent_at: z.string(),
    })
    .nullable(),
  last_message_at: z.string().nullable().optional(),
  is_archived: z.boolean().optional().default(false),
  unread_count: z.number().default(0),
  confession_notice: z.string(),
  created_at: z.string().optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const messageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  sender_name: z.string().nullable(),
  content: z.string().nullable(),
  client_message_id: z.string().nullable().optional(),
  read_at: z.string().nullable().optional(),
  is_deleted: z.boolean().optional().default(false),
  created_at: z.string(),
});
export type Message = z.infer<typeof messageSchema>;
