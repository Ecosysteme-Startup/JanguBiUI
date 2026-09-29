import type {
  CanalLigne,
  LieuLigne,
  MoyenLigne,
} from '../api/get-analyse-dons';

/** Ligne d'une répartition affichée (canal, moyen, lieu), ordre du serveur. */
export type LigneRepartition = {
  code: string;
  libelle: string;
  montant: number;
  nombre: number | null;
  /** 0 = ligne principale, 1 = sous-ligne (retrait de 16 px). */
  niveau: 0 | 1;
  /** Libellé du compteur (« dons », « quêtes »). */
  unite: string | null;
  /** Ligne « lieu non renseigné » : barre grise, libellé atténué. */
  non_renseigne: boolean;
};

/** Canaux (en ligne, espèces) suivis, pour l'en ligne, de leurs sources. */
export const lignesCanal = (canaux: CanalLigne[]): LigneRepartition[] =>
  canaux.flatMap((c) => [
    {
      code: c.canal,
      libelle: c.libelle,
      montant: c.total,
      nombre: c.nombre,
      niveau: 0 as const,
      unite: c.canal === 'especes' ? 'quêtes' : 'dons',
      non_renseigne: false,
    },
    ...c.sources.map((s) => ({
      code: `${c.canal}.${s.source}`,
      libelle: s.libelle,
      montant: s.total,
      nombre: s.nombre,
      niveau: 1 as const,
      unite: 'dons',
      non_renseigne: false,
    })),
  ]);

/** Moyens de paiement des dons en ligne, ordre canonique du serveur. */
export const lignesMoyen = (moyens: MoyenLigne[]): LigneRepartition[] =>
  moyens.map((m) => ({
    code: m.moyen,
    libelle: m.libelle,
    montant: m.total,
    nombre: m.nombre,
    niveau: 0,
    unite: 'dons',
    non_renseigne: m.moyen === 'inconnu',
  }));

/** Lieux : principal, puis alphabétique, puis « Lieu non renseigné ». */
export const lignesLieu = (lieux: LieuLigne[]): LigneRepartition[] =>
  lieux.map((l) => ({
    code: l.lieu_id === null ? 'non_renseigne' : String(l.lieu_id),
    libelle: l.nom,
    montant: l.total,
    nombre: l.nombre,
    niveau: 0,
    unite: l.en_ligne === 0 && l.especes > 0 ? 'quêtes' : 'dons',
    non_renseigne: l.lieu_id === null,
  }));
