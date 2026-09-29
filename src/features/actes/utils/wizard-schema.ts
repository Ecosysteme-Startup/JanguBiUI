import { z } from 'zod';

import type { CreateRequestBody } from '../api/create-request';

/** Nom du sacrement selon l'acte demandé (titres et libellés de l'étape 3). */
export const SACRAMENT: Record<string, { title: string; noun: string }> = {
  baptism: { title: 'Le baptême', noun: 'du baptême' },
  first_communion: { title: 'La première communion', noun: 'de la première communion' },
  confirmation: { title: 'La confirmation', noun: 'de la confirmation' },
  religious_marriage: { title: 'Le mariage', noun: 'du mariage' },
  godparent: { title: 'La célébration', noun: 'de la célébration' },
  other: { title: 'Le sacrement', noun: 'du sacrement' },
};
export const sacramentOf = (type: string) => SACRAMENT[type] ?? SACRAMENT.other;

export const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const parishValue = z.object({ id: z.string(), name: z.string(), city: z.string().nullish(), address: z.string().nullish() });
export type ParishValue = z.infer<typeof parishValue>;

/**
 * Tous les champs sont permissifs au niveau de l'objet : les obligations sont vérifiées
 * dans `superRefine`, qui s'exécute ainsi même quand l'étape suivante n'est pas remplie
 * (validation étape par étape avec `trigger`).
 */
export const wizardSchema = z
  .object({
    document_type: z.string(),
    document_type_free: z.string(),
    parish: parishValue.nullable(),
    last_name: z.string(),
    first_names: z.string(),
    date_of_birth: z.string(),
    place_of_birth: z.string(),
    father: z.string(),
    mother: z.string(),
    contact_phone: z.string(),
    contact_email: z.string(),
    sacrament_month: z.string(),
    sacrament_year: z.string(),
    reason: z.string(),
    reason_free: z.string(),
    spouse_groom: z.string(),
    spouse_bride: z.string(),
    celebration_type: z.string(),
    additional_info: z.string(),
    pickup_mode: z.string(),
    consent: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const need = (path: keyof typeof v, message: string, ok: boolean) => {
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    };
    const filled = (s: string) => s.trim().length > 0;
    need('document_type', 'Choisissez l’acte que vous demandez.', filled(v.document_type));
    if (v.document_type === 'other') need('document_type_free', 'Précisez le document demandé.', filled(v.document_type_free));
    need('parish', 'Choisissez la paroisse où le sacrement a été célébré.', v.parish !== null);
    need('last_name', 'Indiquez votre nom de famille.', filled(v.last_name));
    need('first_names', 'Indiquez vos prénoms.', filled(v.first_names));
    need('date_of_birth', 'Date au format JJ/MM/AAAA, par exemple 14/03/1992.', isoDate(v.date_of_birth) !== null);
    need('place_of_birth', 'Indiquez votre lieu de naissance.', filled(v.place_of_birth));
    need('father', 'Indiquez le nom du père.', filled(v.father));
    need('mother', 'Indiquez le nom de jeune fille de la mère.', filled(v.mother));
    need('contact_phone', 'Indiquez un numéro où le secrétariat peut vous joindre.', /^[+\d][\d\s.-]{6,}$/.test(v.contact_phone.trim()));
    need('contact_email', 'Adresse électronique invalide.', z.string().email().safeParse(v.contact_email.trim()).success);
    need('sacrament_year', 'Quatre chiffres, par exemple 1992.', /^(1[89]|20)\d{2}$/.test(v.sacrament_year.trim()));
    need('reason', 'Choisissez le motif de la demande.', filled(v.reason));
    if (v.reason === 'other') need('reason_free', 'Précisez le motif.', filled(v.reason_free));
    if (v.document_type === 'religious_marriage') {
      need('spouse_groom', 'Indiquez le nom de l’époux.', filled(v.spouse_groom));
      need('spouse_bride', 'Indiquez le nom de l’épouse.', filled(v.spouse_bride));
    }
    if (v.document_type === 'godparent') need('celebration_type', 'Précisez la célébration (baptême, confirmation…).', filled(v.celebration_type));
    need('consent', 'Cet accord est nécessaire pour transmettre la demande.', v.consent);
  });
export type WizardValues = z.infer<typeof wizardSchema>;

export const STEP_FIELDS: (keyof WizardValues)[][] = [
  ['document_type', 'document_type_free'],
  ['parish'],
  [
    'last_name',
    'first_names',
    'date_of_birth',
    'place_of_birth',
    'father',
    'mother',
    'contact_phone',
    'contact_email',
    'sacrament_year',
    'reason',
    'reason_free',
    'spouse_groom',
    'spouse_bride',
    'celebration_type',
    'consent',
  ],
  [],
];

/** « 14/03/1992 » → « 1992-03-14 », ou null si la date n'existe pas. */
export const isoDate = (value: string): string | null => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (date.getUTCMonth() !== Number(m) - 1 || date.getUTCDate() !== Number(d) || Number(y) < 1900) return null;
  return `${y}-${m}-${d}`;
};

/** Date approximative (max 20 caractères côté serveur) : « 08/1992 » ou « 1992 ». */
export const approximateDate = (month: string, year: string) => (month ? `${month}/${year.trim()}` : year.trim());

export const toCreateBody = (v: WizardValues, attachmentId: number | null): CreateRequestBody => {
  const details: Record<string, string> = {};
  if (v.document_type === 'religious_marriage') {
    details.spouse_full_name_groom = v.spouse_groom.trim();
    details.spouse_full_name_bride = v.spouse_bride.trim();
  }
  if (v.document_type === 'godparent') details.celebration_type = v.celebration_type.trim();
  return {
    target_node_id: v.parish?.id ?? '',
    document_type: v.document_type as CreateRequestBody['document_type'],
    document_type_free: v.document_type === 'other' ? v.document_type_free.trim() : '',
    reason: v.reason as CreateRequestBody['reason'],
    reason_free: v.reason === 'other' ? v.reason_free.trim() : '',
    requester_last_name: v.last_name.trim(),
    requester_first_names: v.first_names.trim(),
    date_of_birth: isoDate(v.date_of_birth) ?? '',
    place_of_birth: v.place_of_birth.trim(),
    contact_phone: v.contact_phone.trim(),
    contact_email: v.contact_email.trim(),
    registered_last_name: '',
    registered_first_names: '',
    father_last_name: v.father.trim(),
    mother_last_name: v.mother.trim(),
    sacrament_approximate_date: approximateDate(v.sacrament_month, v.sacrament_year),
    sacrament_location: v.parish?.name ?? '',
    additional_info: v.additional_info.trim(),
    document_details: details,
    pickup_mode: v.pickup_mode as CreateRequestBody['pickup_mode'],
    consent_given: v.consent,
    attachment_file_id: attachmentId,
  };
};
