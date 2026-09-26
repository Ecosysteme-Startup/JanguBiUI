import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bell,
  BellDot,
  BookMarked,
  BookOpen,
  BookOpenText,
  Bookmark,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Church,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock,
  Copy,
  Download,
  Ellipsis,
  EllipsisVertical,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Headphones,
  History,
  House,
  Image,
  Inbox,
  Info,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Link,
  List,
  ListFilter,
  ListOrdered,
  LoaderCircle,
  Lock,
  LogOut,
  type LucideIcon,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Minus,
  Moon,
  Navigation,
  Network,
  Paperclip,
  Pause,
  Pencil,
  Phone,
  Pin,
  Play,
  Plus,
  Printer,
  Quote,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  TriangleAlert,
  Type,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { SVGProps } from 'react';

/**
 * Icônes de la maquette « Ciel produit » : Lucide, trait 1,75, currentColor (WEB-Design-System).
 * Les noms restent en français (API stable pour les écrans) ; chaque nom pointe vers une icône
 * Lucide, sauf le chapelet et la confession, sans équivalent Lucide, dessinés au même trait.
 * Décoratives par défaut ; passer `label` pour une icône porteuse de sens.
 */
const LUCIDE = {
  // Navigation
  'menu': Menu,
  'accueil': House,
  'aujourdhui': Sun,
  'tableau-de-bord': LayoutDashboard,
  'parole': BookOpen,
  'bible': BookMarked,
  'livre': BookOpenText,
  'paroisse': Church,
  'diocese': Landmark,
  'annonce': Megaphone,
  'calendrier': Calendar,
  'calendrier-horloge': CalendarClock,
  'calendrier-ok': CalendarCheck,
  'document': FileText,
  'registre': ScrollText,
  'message': MessageCircle,
  'profil': User,
  'utilisateur-ok': UserCheck,
  'utilisateur-plus': UserPlus,
  'utilisateurs': Users,
  'structure': Network,
  'reglages': Settings,
  'cloche': Bell,
  'cloche-point': BellDot,
  'recherche': Search,
  'filtre': ListFilter,
  'archive': Archive,
  // Actions
  'plus': Plus,
  'moins': Minus,
  'crayon': Pencil,
  'corbeille': Trash2,
  'copier': Copy,
  'partager': Share2,
  'imprimer': Printer,
  'import': Download,
  'export': Upload,
  'envoyer': Send,
  'lien': Link,
  'lien-externe': ExternalLink,
  'trombone': Paperclip,
  'signet': Bookmark,
  'epingle': Pin,
  'deconnexion': LogOut,
  'rafraichir': RefreshCw,
  'historique': History,
  'lecture': Play,
  'pause': Pause,
  'taille-texte': Type,
  'ecouter': Headphones,
  'itineraire': Navigation,
  'plus-horizontal': Ellipsis,
  'plus-vertical': EllipsisVertical,
  // Directions
  'fleche-droite': ArrowRight,
  'fleche-gauche': ArrowLeft,
  'fleche-haut': ArrowUp,
  'fleche-bas': ArrowDown,
  'chevron-bas': ChevronDown,
  'chevron-haut': ChevronUp,
  'chevron-droite': ChevronRight,
  'chevron-gauche': ChevronLeft,
  'chevrons-haut-bas': ChevronsUpDown,
  // États
  'check': Check,
  'check-double': CheckCheck,
  'x': X,
  'alerte': TriangleAlert,
  'erreur': CircleAlert,
  'succes': CircleCheck,
  'info': Info,
  'aide': CircleHelp,
  'chargement': LoaderCircle,
  'cadenas': Lock,
  'cle': KeyRound,
  'bouclier': ShieldCheck,
  'bouclier-alerte': ShieldAlert,
  'oeil': Eye,
  'oeil-barre': EyeOff,
  'boite': Inbox,
  'image': Image,
  // Contact et lieux
  'pin': MapPin,
  'horloge': Clock,
  'telephone': Phone,
  'mobile': Smartphone,
  'mail': Mail,
  'globe': Globe,
  'liste': List,
  'liste-numerotee': ListOrdered,
  'citation': Quote,
  'clair': Sun,
  'sombre': Moon,
} as const satisfies Record<string, LucideIcon>;

/** Pictogrammes propres à Jàngu Bi (pas d'équivalent Lucide), tracés sur la grille 24 de Lucide. */
const CUSTOM = {
  chapelet: (
    <>
      <circle cx="12" cy="8.5" r="5.5" strokeDasharray="0.1 2.6" strokeWidth="2.2" />
      <path d="M12 14v7.5M9.5 17.5h5" />
    </>
  ),
  confession: (
    <>
      <path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17" />
      <path d="M9.5 7.5h5v4h-5zM12 7.5v4M15 15v1.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof LUCIDE | keyof typeof CUSTOM;
export const ICON_NAMES = [...Object.keys(LUCIDE), ...Object.keys(CUSTOM)] as IconName[];

/** Épaisseur de trait des maquettes (stroke-width="1.75" sur 871 icônes). */
export const ICON_STROKE = 1.75;

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'ref'> & {
  name: IconName;
  size?: number;
  label?: string;
};

export const Icon = ({ name, size = 20, label, strokeWidth = ICON_STROKE, ...props }: IconProps) => {
  const a11y = {
    'aria-hidden': label ? undefined : true,
    role: label ? 'img' : undefined,
    'aria-label': label,
    focusable: 'false' as const,
  };
  if (name in CUSTOM) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...a11y}
        {...props}
      >
        {CUSTOM[name as keyof typeof CUSTOM]}
      </svg>
    );
  }
  const Component = LUCIDE[name as keyof typeof LUCIDE];
  return <Component size={size} strokeWidth={strokeWidth} {...a11y} {...props} />;
};
