// Export CSV côté client des agrégats affichés (aucun nom de donateur : le
// contrat d'analyse n'en contient pas). Séparateur « ; » pour les tableurs
// configurés en français.

type Cellule = string | number | null | undefined;

const echapper = (v: Cellule) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const versCsv = (
  blocs: { titre: string; lignes: Cellule[][] }[],
): string =>
  blocs
    .map((b) =>
      [b.titre, ...b.lignes.map((l) => l.map(echapper).join(';'))].join('\n'),
    )
    .join('\n\n');

export const telechargerCsv = (nom: string, contenu: string) => {
  const blob = new Blob([`\uFEFF${contenu}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
};
