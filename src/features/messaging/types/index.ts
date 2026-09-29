import { z } from 'zod';

// Contrat réel apps/messaging (ConversationOutput, MessageOutput).
const participantSchema = z.object({
  id: z.string(),
  email: z.string().default(''),
  full_name: z.string().optional(),
});

const lastMessageSchema = z.object({
  id: z.string(),
  sender_id: z.string().optional(),
  // null pour un message supprimé.
  content: z
    .string()
    .nullable()
    .transform((c) => c ?? ''),
  sent_at: z.string().nullable().optional(),
});

export const conversationSchema = z.object({
  id: z.string(),
  participant_a: participantSchema,
  participant_b: participantSchema,
  last_message: lastMessageSchema.nullable().optional(),
  last_message_at: z.string().nullable().optional(),
  unread_count: z.number().default(0),
  is_archived: z.boolean().default(false),
  // Rappel affiché en tête d'échange : la messagerie n'est pas la confession.
  confession_notice: z.string().default(''),
});

export const messageAttachmentSchema = z.object({
  id: z.number(),
  url: z.string(),
  file_name: z.string(),
});
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

export const messageSchema = z.object({
  id: z.string(),
  client_message_id: z.string().optional().nullable(),
  content: z.string(),
  content_type: z.string().default('text'),
  sender_id: z.string(),
  sender_name: z.string().optional().nullable(),
  reply_to_id: z.string().optional().nullable(),
  read_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  is_deleted: z.boolean().default(false),
  reactions: z.array(z.unknown()).default([]),
  attachments: z.array(messageAttachmentSchema).default([]),
  created_at: z.string(),
  is_mine: z.boolean().default(false),
});

export type Conversation = z.infer<typeof conversationSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessagesResponse = { count: number; results: Message[] };
