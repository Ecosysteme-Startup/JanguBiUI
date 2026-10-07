import { paroleDay } from '@/testing/mocks/db-parole';

/**
 * FIXTURE DE TEST — forme d'une réponse `source: 'aelf'` (dimanche, quatre lectures).
 * Textes abrégés pour les tests, clés `aelf` reprises du format de l'API AELF ; ce n'est pas
 * un jour réel de l'AELF. Une `<script>` et un `onclick` vérifient l'assainissement.
 */
export const aelfSundayDay = {
  ...paroleDay,
  date: '2026-09-27',
  calendar: { ...paroleDay.calendar, celebration: '26e dimanche du Temps ordinaire', rank: 'dimanche' },
  source: 'aelf',
  edition: null,
  notice: '',
  audio_url: null,
  meditation: null,
  readings: [
    {
      type: 'lecture_1',
      citation: 'Am 6, 1a.4-7',
      text: '<p><span class="verse_number">1</span> Malheur à ceux qui vivent bien tranquilles.<script>alert(1)</script></p><p onclick="x()"><strong>(fixture)</strong></p>',
      verses: [],
      aelf: { type: 'lecture_1', ref: 'Am 6, 1a.4-7', titre: 'Lecture du livre du prophète Amos (fixture)', intro_lue: 'En ces jours-là (fixture),' },
    },
    {
      type: 'psaume',
      citation: 'Ps 145 (146)',
      text: '<p>Le Seigneur garde à jamais sa fidélité (fixture).</p>',
      verses: [],
      aelf: { type: 'psaume', ref: '145', refrain_psalmique: '<p>Chante, ô mon âme, la louange du Seigneur ! (fixture)</p>', ref_refrain: 'Ps 145, 1' },
    },
    {
      type: 'lecture_2',
      citation: '1 Tm 6, 11-16',
      text: '<p>Toi, homme de Dieu, recherche la justice (fixture).</p>',
      verses: [],
      aelf: { type: 'lecture_2', titre: 'Lecture de la première lettre de saint Paul apôtre à Timothée (fixture)' },
    },
    {
      type: 'evangile',
      citation: 'Lc 16, 19-31',
      text: '<p>Il y avait un homme riche (fixture).</p>',
      verses: [],
      aelf: {
        type: 'evangile',
        verset_evangile: '<p>Jésus Christ s’est fait pauvre (fixture).</p>',
        ref_verset: 'cf. 2 Co 8, 9',
      },
    },
    { type: 'antienne_x', citation: 'Xx 1', text: '<p>Texte d’un type inconnu (fixture).</p>', verses: [], aelf: null },
  ],
};
