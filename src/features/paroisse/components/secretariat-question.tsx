'use client';

import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';

import { useParish } from '../api/get-parish';
import { useParishSheet } from '../api/get-parish-sheet';

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** « Une question sur … ? » : horaires et téléphone du secrétariat, s'il est publié par la paroisse. */
export const SecretariatQuestion = ({ nodeId, title }: { nodeId: string; title: string }) => {
  const { data: parish } = useParish(nodeId);
  const { data: sheet } = useParishSheet(parish?.code);
  const secretariat = sheet?.secretariat;
  const phone = secretariat?.phone.trim();
  const hours = secretariat?.office_hours ?? [];
  if (!secretariat || (!phone && hours.length === 0)) return null;

  return (
    <Card as="section" tone="surface" aria-labelledby="question-titre">
      <h2 id="question-titre" className="m-0 text-16 font-semibold text-ink">
        {title}
      </h2>
      {hours.length > 0 && (
        <p className="m-0 mt-1 text-14 text-ink-2">
          Le secrétariat répond {hours.map((h) => `${lowerFirst(h.days)}, ${h.hours}`).join(' ; ')}.
        </p>
      )}
      {phone && (
        <a href={`tel:${phone.replace(/\s+/g, '')}`} className="tnum hit mt-3 inline-flex items-center gap-2 text-15 font-semibold">
          <Icon name="telephone" size={18} />
          {phone}
        </a>
      )}
    </Card>
  );
};
