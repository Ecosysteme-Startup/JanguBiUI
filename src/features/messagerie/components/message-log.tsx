import { useEffect, useRef } from 'react';

import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';
import { dayjs } from '@/utils/dates';

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

/** Rayons des bulles : l'angle « queue » est côté auteur, les suivantes s'empilent (FID-Conversation). */
const bubbleRadius = (mine: boolean, index: number) => {
  if (mine) return 'rounded-[16px_16px_4px_16px]';
  return index === 0 ? 'rounded-[16px_16px_16px_4px]' : 'rounded-[4px_16px_16px_4px]';
};

const Bubble = ({ message, mine, index }: { message: Message; mine: boolean; index: number }) => (
  <p
    className={cn(
      'm-0 whitespace-pre-line break-words px-4 py-3 text-15 text-ink',
      bubbleRadius(mine, index),
      mine ? 'bg-tint-100' : 'border border-line bg-surface',
      message.content === null && 'italic text-ink-3',
    )}
  >
    {message.content ?? 'Message supprimé'}
  </p>
);

const GroupMeta = ({ group }: { group: Group }) => {
  const last = group.messages.at(-1)!;
  const time = dayjs(last.created_at).format('HH:mm');
  if (!group.mine) {
    return (
      <span className="tnum text-12 text-ink-3">
        <span className="sr-only">{group.sender}, </span>
        {time}
      </span>
    );
  }
  return (
    <span className="tnum inline-flex items-center gap-1 text-12 text-ink-3">
      {last.read_at ? (
        <>
          <Icon name="check-double" size={14} />
          Lu · {time}
        </>
      ) : (
        <>
          <span className="sr-only">Envoyé · </span>
          {time}
        </>
      )}
    </span>
  );
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
      className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 lg:px-8"
    >
      <div className="mt-auto" />
      {messages.length === 0 && <p className="m-0 text-center text-14 text-ink-3">Aucun message pour l’instant. Écrivez le premier.</p>}
      {groupMessages(messages, meId, peerName).map((day, dayIndex) => (
        <div key={day.key} className="flex flex-col">
          {dayIndex === 0 ? (
            <p className="m-0 mb-4 self-center rounded-full border border-line bg-surface px-3.5 py-2 text-13 text-ink-2">{day.label}</p>
          ) : (
            <p className="m-0 mb-3 mt-5 self-center text-13 font-medium text-ink-3">{day.label}</p>
          )}
          {day.groups.map((group, groupIndex) => (
            <div
              key={group.key}
              className={cn(
                'flex max-w-[min(520px,85%)] flex-col gap-1',
                groupIndex > 0 && 'mt-3',
                group.mine ? 'items-end self-end' : 'items-start self-start',
              )}
            >
              {group.messages.map((m, index) => (
                <Bubble key={m.id} message={m} mine={group.mine} index={index} />
              ))}
              <GroupMeta group={group} />
            </div>
          ))}
        </div>
      ))}
      {peerTyping && <p className="m-0 mt-3 text-13 text-ink-3">{peerName} écrit…</p>}
    </div>
  );
};
