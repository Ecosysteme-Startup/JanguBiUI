export interface Crumb {
  label: string;
  href: string;
}

/**
 * Libellés du fil d'Ariane par chemin COMPLET — désambiguïse les segments
 * homonymes selon leur contexte (ex. « new » = « Nouvelle demande » sous
 * /documents mais « Nouvel article » sous /admin/articles ; « messages » =
 * « Messages » au niveau racine mais « Messagerie inter-clergé » sous /clerge).
 */
const PATH_LABELS: Record<string, string> = {
  '/app': 'Accueil',
  '/app/actus': 'Actus',
  '/app/spirituel': 'Spiritualité',
  '/app/spirituel/liturgie': 'Liturgie du jour',
  '/app/spirituel/heures': 'Liturgie des Heures',
  '/app/bible': 'Bible',
  '/app/chapelet': 'Chapelet',
  '/app/chapelet/communautaire': 'Chapelet communautaire',
  '/app/documents': 'Documents',
  '/app/documents/new': 'Nouvelle demande',
  '/app/agenda': 'Agenda',
  '/app/dons': 'Dons & Quêtes',
  '/app/intentions': 'Intentions de messe',
  '/app/transfert': 'Transfert paroissial',
  '/app/messages': 'Messages',
  '/app/messages/new': 'Nouveau message',
  '/app/profil': 'Profil',
  '/app/assistant': 'Assistant',
  '/app/tv': 'JanguBi TV',
  '/app/ecouter': 'Écouter',
  '/app/ecouter/recherche': 'Recherche',
  '/app/ecouter/bibliotheque': 'Ma bibliothèque',
  '/app/paroisse/sonotheque': 'Sonothèque',
  '/app/paroisse/intentions': 'Intentions de messe',
  '/app/recherche': 'Recherche',
  '/app/paroisse/sonotheque/ajouter': 'Ajouter des enregistrements',
  '/app/clerge': 'Clergé',
  '/app/clerge/messages': 'Messagerie inter-clergé',
  '/app/clerge/transferts': 'Transferts',
  '/app/admin': 'Administration',
  '/app/admin/agenda': 'Agenda',
  '/app/admin/articles': 'Articles',
  '/app/admin/articles/new': 'Nouvel article',
  '/app/admin/documents': 'Demandes de documents',
  '/app/admin/tv': 'TV',
  '/app/admin/org': 'Structure',
  '/app/admin/users': 'Utilisateurs',
  '/app/admin/users/clerge': 'Validation du clergé',
  '/app/admin/users/validation': 'Validation',
};

/** Libellés par segment terminal (suffixes connus, ex. « edit »). */
const SUFFIX_LABELS: Record<string, string> = {
  edit: 'Modifier',
};

/**
 * Construit le fil d'Ariane à partir du `pathname`. Le segment racine `/app`
 * n'est pas affiché. Le dernier segment dynamique (ex. `/app/actus/[id]`) prend
 * `leafLabel` s'il est fourni (titre réel via `usePageMeta`), sinon un repli.
 * Les segments dynamiques intermédiaires (ex. l'id dans `/admin/articles/[id]/edit`)
 * sont omis.
 */
export function buildBreadcrumbs(
  pathname: string,
  leafLabel?: string | null,
): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] !== 'app') return [];

  const crumbs: Crumb[] = [];
  let acc = '';
  segments.forEach((segment, index) => {
    acc += `/${segment}`;
    if (acc === '/app') return; // racine non affichée

    const isLast = index === segments.length - 1;
    let label = PATH_LABELS[acc] ?? SUFFIX_LABELS[segment];

    if (!label) {
      // Segment dynamique (id) : libellé réel sur le dernier crumb, sinon omis.
      if (!isLast) return;
      label = leafLabel || 'Détail';
    }

    crumbs.push({ label, href: acc });
  });

  return crumbs;
}
