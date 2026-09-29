// Comptes de démonstration du mode mocks (NEXT_PUBLIC_API_MOCKING=true) : ils
// remplacent la page Keycloak. Le serveur de mocks renvoie, pour chacun, le
// profil (/v1/me/) et les capacités (/v1/me/capacites/) correspondants.

export type DemoAccount = {
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  /** Ce que le compte permet de voir (affiché sous le nom). */
  description: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'marie-therese.diouf@example.sn',
    first_name: 'Marie-Thérèse',
    last_name: 'Diouf',
    title: 'Mme',
    description: 'Fidèle, paroisse Saint-Dominique',
  },
  {
    email: 'cecile.coly@saint-dominique.sn',
    first_name: 'Cécile',
    last_name: 'Coly',
    title: 'Mme',
    description: 'Économe, paroisse Saint-Dominique',
  },
  {
    email: 'germaine.faye@saint-dominique.sn',
    first_name: 'Germaine',
    last_name: 'Faye',
    title: 'Mme',
    description: 'Secrétaire paroissiale, sonothèque',
  },
  {
    email: 'bernard.coly@archidiocese-dakar.sn',
    first_name: 'Bernard',
    last_name: 'Coly',
    title: 'M.',
    description: 'Économe diocésain, archidiocèse de Dakar',
  },
  {
    email: 'moustoifa.ben@numerisen.sn',
    first_name: 'Moustoifa',
    last_name: 'Ben',
    title: 'M.',
    description: 'Administrateur de la plateforme',
  },
];
