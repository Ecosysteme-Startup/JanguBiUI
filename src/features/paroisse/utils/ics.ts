import type { ParishEvent } from '../api/get-events';

type IcsEvent = Pick<ParishEvent, 'id' | 'title' | 'description' | 'location' | 'start_at' | 'end_at'>;

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Fichier iCalendar (RFC 5545) d'un événement, pour « Ajouter au calendrier ». */
export const eventIcs = (event: IcsEvent, url: string, now: Date = new Date()): string =>
  [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jàngu Bi//Agenda paroissial//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:evenement-${event.id}@jangubi`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(new Date(event.start_at))}`,
    `DTEND:${stamp(new Date(event.end_at))}`,
    `SUMMARY:${escape(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escape(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');

/** Télécharge l'événement au format .ics (ouvert par l'agenda du téléphone ou de l'ordinateur). */
export const downloadIcs = (event: IcsEvent) => {
  const blob = new Blob([eventIcs(event, window.location.href)], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `evenement-${event.id}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
};
