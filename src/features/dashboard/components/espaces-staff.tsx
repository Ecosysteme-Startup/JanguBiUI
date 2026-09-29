'use client';

import {
  BarChart3,
  BookOpen,
  Calendar,
  Church,
  Clock,
  CreditCard,
  FileText,
  HandCoins,
  HandHeart,
  History,
  Landmark,
  Library,
  ListTree,
  Settings2,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
} from 'lucide-react';

import { Link } from '@/components/ui/link/link';
import { paths } from '@/config/paths';
import { useUser, type User } from '@/lib/auth';
import { type Capacite, aUneCapacite } from '@/lib/staff/capacites';
import { cn } from '@/lib/utils';

type Espace = {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  capacites: Capacite[];
};

type Groupe = { titre: string; espaces: Espace[] };

// Chaque entrée n'apparaît qu'avec une des capacités qui l'ouvrent
// (docs/BRANCHEMENT-STAFF.md). Le back reste seul juge (403).
export const GROUPES_STAFF: Groupe[] = [
  {
    titre: 'Paroisse',
    espaces: [
      {
        label: 'Demandes d’actes',
        description: 'Traiter les demandes de la paroisse',
        href: paths.app.admin.documents.getHref(),
        icon: FileText,
        capacites: ['actes.traiter'],
      },
      {
        label: 'Annonces',
        description: 'Rédiger et publier',
        href: paths.app.admin.articles.getHref(),
        icon: BookOpen,
        capacites: ['annonces.publier'],
      },
      {
        label: 'Intentions de messe',
        description: 'Planifier les intentions reçues',
        href: paths.app.paroisse.intentions.getHref(),
        icon: HandHeart,
        capacites: ['intentions.gerer'],
      },
      {
        label: 'Agenda',
        description: 'Événements et inscriptions',
        href: paths.app.admin.agenda.getHref(),
        icon: Calendar,
        capacites: ['evenements.gerer'],
      },
      {
        label: 'Horaires et lieux',
        description: 'Messes et lieux de culte',
        href: paths.app.paroisse.horaires.getHref(),
        icon: Clock,
        capacites: ['horaires.gerer'],
      },
      {
        label: 'Confessions',
        description: 'Créneaux et planning',
        href: paths.app.paroisse.confessions.getHref(),
        icon: Church,
        capacites: ['confessions.gerer', 'confessions.voir_planning'],
      },
      {
        label: 'Équipe et offices',
        description: 'Nominations de la communauté',
        href: paths.app.admin.nominations.getHref(),
        icon: Users,
        capacites: ['offices.nommer'],
      },
      {
        label: 'Paroissiens',
        description: 'Membres de la paroisse',
        href: paths.app.paroisse.paroissiens.getHref(),
        icon: UsersRound,
        capacites: ['paroissiens.gerer'],
      },
      {
        label: 'Sonothèque',
        description: 'Enregistrements',
        href: paths.app.paroisse.sonotheque.getHref(),
        icon: Library,
        capacites: ['audio.publier'],
      },
      {
        label: 'Dons et quêtes',
        description: 'Fonds, quêtes, opérations',
        href: paths.app.paroisse.dons.getHref(),
        icon: HandCoins,
        capacites: [
          'dons.voir_fonds',
          'dons.gerer_fonds',
          'dons.saisir_quete',
          'dons.exporter',
        ],
      },
      {
        label: 'Paramètres',
        description: 'Secrétariat, délais des actes, messagerie',
        href: paths.app.paroisse.parametres.getHref(),
        icon: Settings2,
        capacites: [
          'horaires.gerer',
          'structure.gerer',
          'messagerie.recevoir_fideles',
        ],
      },
    ],
  },
  {
    titre: 'Diocèse',
    espaces: [
      {
        label: 'Structure',
        description: 'Zones, doyennés, paroisses',
        href: paths.app.admin.org.getHref(),
        icon: ListTree,
        capacites: ['structure.gerer'],
      },
      {
        label: 'Vérifications',
        description: 'Statuts cléricaux déclarés',
        href: paths.app.admin.users.validation.getHref(),
        icon: UserCheck,
        capacites: ['personnes.verifier'],
      },
      {
        label: 'Comptes du clergé',
        description: 'Inviter, valider, activer',
        href: paths.app.admin.users.clerge.getHref(),
        icon: UserPlus,
        capacites: ['comptes.valider'],
      },
      {
        label: 'Dons du diocèse',
        description: 'Agrégats des paroisses',
        href: paths.app.diocese.dons.getHref(),
        icon: Landmark,
        capacites: ['dons.voir_agregats'],
      },
      {
        label: 'Quêtes impérées',
        description: 'Définir et suivre',
        href: paths.app.diocese.quetesImperees.getHref(),
        icon: HandCoins,
        capacites: ['dons.definir_quete_imperee'],
      },
      {
        label: 'Journal d’audit',
        description: 'Actions sensibles',
        href: paths.app.admin.audit.getHref(),
        icon: History,
        capacites: ['audit.voir'],
      },
    ],
  },
  {
    titre: 'Plateforme',
    espaces: [
      {
        label: 'Comptes',
        description: 'Accès et MFA',
        href: paths.app.admin.users.list.getHref(),
        icon: ShieldCheck,
        capacites: ['plateforme.admin'],
      },
      {
        label: 'Référentiels',
        description: 'Types de nœuds et offices',
        href: paths.app.plateforme.referentiels.getHref(),
        icon: BarChart3,
        capacites: ['plateforme.admin'],
      },
      {
        label: 'Paiements',
        description: 'Santé des paiements',
        href: paths.app.plateforme.paiements.getHref(),
        icon: CreditCard,
        capacites: ['plateforme.admin'],
      },
    ],
  },
];

export const groupesVisibles = (user: User | null | undefined): Groupe[] =>
  GROUPES_STAFF.map((g) => ({
    ...g,
    espaces: g.espaces.filter((e) => aUneCapacite(user, e.capacites)),
  })).filter((g) => g.espaces.length > 0);

/** Tuiles des espaces ouverts par les capacités de la personne. */
export function EspacesStaff() {
  const { data: user } = useUser();
  const groupes = groupesVisibles(user);
  return (
    <div className="space-y-6">
      {groupes.map((g) => (
        <section key={g.titre} aria-label={g.titre} className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {g.titre}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {g.espaces.map((e) => {
              const Icon = e.icon;
              return (
                <li key={e.href + e.label}>
                  <Link
                    href={e.href}
                    className={cn(
                      'flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 no-underline transition-colors hover:bg-muted hover:no-underline',
                    )}
                  >
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <span className="text-sm font-semibold text-foreground">
                      {e.label}
                    </span>
                    <span className="text-[11px] leading-tight text-muted-foreground">
                      {e.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
