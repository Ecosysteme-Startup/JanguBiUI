import { useEffect, useRef } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/utils/cn';
import { dayjs, hour } from '@/utils/dates';

import type { Message } from '../api/schemas';

type Group = {
  key: string;
  mine: boolean;
  sender: string;
  messages: Message[];
};
type Day = { key: string; label: string; groups: Group[] };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const dayLabel = (iso: string, now = dayjs()) => {
  const d = dayjs(iso);
  if (d.isSame(now, 'day')) return 'Aujourd’hui';
  if (d.isSame(now.subtract(1, 'day'), 'day')) return 'Hier';
  return capitalize(d.format('dddd D MMMM'));
};

/** Regroupe par jour, puis par suite de messages d'un même auteur (FID-Conversation). */
export const groupMessages = (
  messages: Message[],
  meId: string | undefined,
  peerName: string,
): Day[] =>
  messages.reduce<Day[]>((days, message) => {
    const dayKey = dayjs(message.created_at).format('YYYY-MM-DD');
    const day = days.at(-1)?.key === dayKey ? days.at(-1)! : null;
    const mine = message.sender_id === meId;
    const current: Day = day ?? {
      key: dayKey,
      label: dayLabel(message.created_at),
      groups: [],
    };
    const lastGroup = current.groups.at(-1);
    const groups =
      lastGroup && lastGroup.mine === mine
        ? [
            ...current.groups.slice(0, -1),
            { ...lastGroup, messages: [...lastGroup.messages, message] },
          ]
        : [
            ...current.groups,
            {
              key: message.id,
              mine,
              sender: message.sender_name || peerName,
              messages: [message],
            },
          ];
    const next = { ...current, groups };
    return day ? [...days.slice(0, -1), next] : [...days, next];
  }, []);

const Bubble = ({ message, mine }: { message: Message; mine: boolean }) => (
  <div
    className={cn(
      'whitespace-pre-line break-words rounded-md px-4 py-3 text-body',
      mine
        ? 'bg-primary-fill text-on-primary'
        : 'border border-line bg-surface text-ink',
      message.content === null && 'italic opacity-80',
    )}
  >
    {message.content ?? 'Message supprimé'}
  </div>
);

const GroupMeta = ({ group }: { group: Group }) => {
  const last = group.messages.at(-1)!;
  const time = hour(last.created_at);
  const text = group.mine
    ? `${last.read_at ? 'Lu' : 'Envoyé'} · ${time}`
    : `${group.sender} · ${time}`;
  return <span className="tnum text-meta text-ink-3">{text}</span>;
};

/** Fil des messages, ancré en bas ; les plus anciens défilent au-dessus. */
export const MessageLog = ({
  messages,
  meId,
  peerName,
  peerTyping,
}: {
  messages: Message[];
  meId: string | undefined;
  peerName: string;
  peerTyping: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages.length]);

  return (
    <div
      ref={ref}
      role="log"
      aria-label={`Messages avec ${peerName}`}
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 lg:px-6"
    >
      <div className="mt-auto" />
      {messages.length === 0 && (
        <p className="m-0 text-center text-sm text-ink-3">
          Aucun message pour l’instant. Écrivez le premier.
        </p>
      )}
      {groupMessages(messages, meId, peerName).map((day) => (
        <div key={day.key} className="flex flex-col gap-4">
          <p className="tnum m-0 flex items-center gap-4 text-meta text-ink-3">
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
            {day.label}
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>
          {day.groups.map((group) =>
            group.mine ? (
              <div
                key={group.key}
                className="ml-auto flex max-w-[85%] flex-col items-end gap-1 lg:max-w-[80%]"
              >
                {group.messages.map((m) => (
                  <Bubble key={m.id} message={m} mine />
                ))}
                <GroupMeta group={group} />
              </div>
            ) : (
              <div
                key={group.key}
                className="flex max-w-[90%] items-end gap-2 lg:max-w-[86%]"
              >
                <Avatar
                  name={group.sender}
                  size={32}
                  className="mb-[22px] hidden sm:inline-flex"
                />
                <div className="flex flex-col items-start gap-1">
                  {group.messages.map((m) => (
                    <Bubble key={m.id} message={m} mine={false} />
                  ))}
                  <GroupMeta group={group} />
                </div>
              </div>
            ),
          )}
        </div>
      ))}
      {peerTyping && (
        <p className="tnum m-0 text-meta text-ink-3">{peerName} écrit…</p>
      )}
    </div>
  );
};
