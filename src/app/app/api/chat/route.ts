import {
  consumeStream,
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  stepCountIs,
} from 'ai';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { env } from '@/config/env';

export const maxDuration = 60;

/* ───────────────────────────────────────
   Mock data – pretres disponibles
   ─────────────────────────────────────── */
const pretresData = [
  {
    id: 1,
    name: 'Pere Jean-Baptiste Diouf',
    type: 'pretre',
    paroisse: 'Paroisse Saint-Charles de Pikine',
    localisation: 'Pikine, Dakar',
    zone: 'dakar',
    disponibilite: 'Lundi-Vendredi, 9h-12h / 15h-18h',
    phone: '+221770001122',
    online: true,
  },
  {
    id: 2,
    name: 'Pere Michel Ndiaye',
    type: 'pretre',
    paroisse: 'Cathedrale de Dakar',
    localisation: 'Plateau, Dakar',
    zone: 'dakar',
    disponibilite: 'Mardi-Samedi, 10h-17h',
    phone: '+221770002233',
    online: true,
  },
  {
    id: 3,
    name: 'Soeur Marie-Therese Faye',
    type: 'soeur',
    paroisse: 'Communaute de Keur Moussa',
    localisation: 'Keur Moussa, Thies',
    zone: 'thies',
    disponibilite: 'Tous les jours, 8h-11h / 14h-16h',
    phone: '+221770003344',
    online: false,
  },
  {
    id: 4,
    name: 'Frere Thomas Senghor',
    type: 'moine',
    paroisse: 'Monastere de Keur Moussa',
    localisation: 'Keur Moussa, Thies',
    zone: 'thies',
    disponibilite: 'Lundi-Samedi, 9h-11h30',
    phone: '+221770004455',
    online: true,
  },
  {
    id: 5,
    name: 'Pere Paul Mendy',
    type: 'pretre',
    paroisse: 'Paroisse Sainte-Anne de Ziguinchor',
    localisation: 'Ziguinchor, Casamance',
    zone: 'casamance',
    disponibilite: 'Lundi-Vendredi, 8h-12h / 15h-18h',
    phone: '+221770005566',
    online: false,
  },
  {
    id: 6,
    name: 'Pere Augustin Sarr',
    type: 'pretre',
    paroisse: 'Paroisse Notre-Dame de Lourdes',
    localisation: 'Saint-Louis',
    zone: 'saint-louis',
    disponibilite: 'Mercredi-Dimanche, 10h-18h',
    phone: '+221770006677',
    online: true,
  },
];

/* ───────────────────────────────────────
   Tools
   ─────────────────────────────────────── */
const tools = {
  rechercherPretres: tool({
    description:
      "Recherche des pretres, moines ou soeurs disponibles selon le lieu, l'horaire ou le type. Utilise cet outil quand l'utilisateur demande de trouver un pretre disponible, cherche un religieux pres de chez lui, ou pose une question sur les horaires de disponibilite des pretres.",
    inputSchema: z.object({
      zone: z
        .string()
        .nullable()
        .describe(
          'La zone geographique: dakar, thies, casamance, saint-louis, ou null pour toutes',
        ),
      type: z
        .string()
        .nullable()
        .describe('Le type: pretre, moine, soeur, ou null pour tous'),
      disponibleMaintenant: z
        .boolean()
        .nullable()
        .describe(
          'true pour ne montrer que ceux en ligne, false/null pour tous',
        ),
    }),
    execute: async ({ zone, type, disponibleMaintenant }) => {
      let results = [...pretresData];
      if (zone) {
        results = results.filter(
          (p) => p.zone.toLowerCase() === zone.toLowerCase(),
        );
      }
      if (type) {
        results = results.filter(
          (p) => p.type.toLowerCase() === type.toLowerCase(),
        );
      }
      if (disponibleMaintenant) {
        results = results.filter((p) => p.online);
      }
      return {
        count: results.length,
        pretres: results.map((p) => ({
          name: p.name,
          type: p.type,
          paroisse: p.paroisse,
          localisation: p.localisation,
          disponibilite: p.disponibilite,
          enLigne: p.online,
          lienWhatsApp: `https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`,
        })),
      };
    },
  }),

  consulterBible: tool({
    description:
      "Consulte un passage biblique ou fournit des informations sur un livre, chapitre ou verset de la Bible. Utilise cet outil quand l'utilisateur demande un verset, un passage, une reference biblique, ou des explications sur un texte de la Bible.",
    inputSchema: z.object({
      livre: z.string().describe('Le nom du livre (ex: Genese, Jean, Psaumes)'),
      chapitre: z.number().nullable().describe('Le numero du chapitre ou null'),
      verset: z.number().nullable().describe('Le numero du verset ou null'),
    }),
    execute: async ({ livre, chapitre, verset }) => {
      const passages: Record<string, string> = {
        'Jean 3:16':
          "Car Dieu a tant aime le monde qu'il a donne son Fils unique, afin que quiconque croit en lui ne perisse point, mais qu'il ait la vie eternelle.",
        'Psaumes 23':
          "L'Eternel est mon berger: je ne manquerai de rien. Il me fait reposer dans de verts paturages, il me dirige pres des eaux paisibles. Il restaure mon ame, il me conduit dans les sentiers de la justice, a cause de son nom.",
        'Genese 1:1': 'Au commencement, Dieu crea les cieux et la terre.',
        'Matthieu 5:3':
          'Heureux les pauvres en esprit, car le royaume des cieux est a eux!',
        'Proverbes 3:5':
          "Confie-toi en l'Eternel de tout ton coeur, et ne t'appuie pas sur ta sagesse.",
        'Romains 8:28':
          'Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appeles selon son dessein.',
        'Isaie 41:10':
          'Ne crains rien, car je suis avec toi; ne promene pas des regards inquiets, car je suis ton Dieu; je te fortifie, je viens a ton secours, je te soutiens de ma droite triomphante.',
        'Philippiens 4:13': 'Je puis tout par celui qui me fortifie.',
      };

      const ref = verset
        ? `${livre} ${chapitre}:${verset}`
        : chapitre
          ? `${livre} ${chapitre}`
          : livre;

      const found = Object.entries(passages).find(
        ([key]) => key.toLowerCase() === ref.toLowerCase(),
      );

      return {
        reference: ref,
        texte: found
          ? found[1]
          : `Passage de ${ref} - Ce passage est disponible dans l'application Jangu Bi. Rendez-vous dans l'onglet Bible pour lire le texte complet.`,
        conseil:
          "Vous pouvez acceder au texte complet dans l'onglet Bible de Jangu Bi.",
      };
    },
  }),

  infoChapelet: tool({
    description:
      "Fournit des informations sur le chapelet, les mysteres du rosaire, et comment prier le chapelet. Utilise cet outil quand l'utilisateur pose des questions sur le chapelet, les mysteres (joyeux, lumineux, douloureux, glorieux), ou la priere du rosaire.",
    inputSchema: z.object({
      sujet: z
        .string()
        .describe(
          "Le sujet : 'mysteres-joyeux', 'mysteres-lumineux', 'mysteres-douloureux', 'mysteres-glorieux', 'comment-prier', 'mystere-du-jour', ou une question libre",
        ),
    }),
    execute: async ({ sujet }) => {
      const mysteres: Record<
        string,
        { nom: string; jour: string; liste: string[] }
      > = {
        'mysteres-joyeux': {
          nom: 'Mysteres Joyeux',
          jour: 'Lundi et Samedi',
          liste: [
            "L'Annonciation de l'ange Gabriel a Marie",
            'La Visitation de Marie a sa cousine Elisabeth',
            'La Naissance de Jesus a Bethleem',
            'La Presentation de Jesus au Temple',
            'Le Recouvrement de Jesus au Temple',
          ],
        },
        'mysteres-lumineux': {
          nom: 'Mysteres Lumineux',
          jour: 'Jeudi',
          liste: [
            'Le Bapteme de Jesus dans le Jourdain',
            'Les Noces de Cana',
            "L'Annonce du Royaume de Dieu",
            'La Transfiguration',
            "L'Institution de l'Eucharistie",
          ],
        },
        'mysteres-douloureux': {
          nom: 'Mysteres Douloureux',
          jour: 'Mardi et Vendredi',
          liste: [
            "L'Agonie de Jesus au Jardin des Oliviers",
            'La Flagellation de Jesus',
            "Le Couronnement d'epines",
            'Le Portement de la Croix',
            'La Crucifixion et la mort de Jesus',
          ],
        },
        'mysteres-glorieux': {
          nom: 'Mysteres Glorieux',
          jour: 'Mercredi et Dimanche',
          liste: [
            'La Resurrection de Jesus',
            "L'Ascension de Jesus au Ciel",
            'La Descente du Saint-Esprit a la Pentecote',
            "L'Assomption de Marie au Ciel",
            'Le Couronnement de Marie au Ciel',
          ],
        },
      };

      if (sujet === 'comment-prier') {
        return {
          titre: 'Comment prier le Chapelet',
          etapes: [
            '1. Faites le signe de la Croix',
            '2. Recitez le Credo des Apotres (Je crois en Dieu)',
            '3. Priez un Notre Pere',
            '4. Priez trois Je vous salue Marie',
            '5. Priez le Gloire au Pere',
            '6. Annoncez le premier mystere, puis priez un Notre Pere',
            '7. Priez dix Je vous salue Marie en meditant le mystere',
            '8. Priez le Gloire au Pere et la priere de Fatima',
            '9. Repetez les etapes 6-8 pour les 4 mysteres restants',
            '10. Terminez par le Salve Regina',
          ],
          conseil:
            "Utilisez le guide interactif dans l'onglet Chapelet de Jangu Bi pour etre accompagne pas a pas.",
        };
      }

      if (sujet === 'mystere-du-jour') {
        const dayIndex = new Date().getDay();
        const mysteresDuJour: Record<number, string> = {
          0: 'mysteres-glorieux',
          1: 'mysteres-joyeux',
          2: 'mysteres-douloureux',
          3: 'mysteres-glorieux',
          4: 'mysteres-lumineux',
          5: 'mysteres-douloureux',
          6: 'mysteres-joyeux',
        };
        const key = mysteresDuJour[dayIndex];
        return {
          ...mysteres[key],
          info: `Aujourd'hui, nous meditons les ${mysteres[key].nom}.`,
        };
      }

      if (mysteres[sujet]) {
        return mysteres[sujet];
      }

      return {
        info: 'Le chapelet est une priere mariale composee de 5 dizaines. Chaque dizaine est associee a un mystere de la vie de Jesus et de Marie.',
        mysteres_disponibles: Object.keys(mysteres),
        conseil:
          "Demandez-moi un mystere specifique ou comment prier le chapelet. Vous pouvez aussi utiliser le guide interactif dans l'onglet Chapelet.",
      };
    },
  }),

  lecturesDuJour: tool({
    description:
      "Fournit les lectures liturgiques du jour (1ere lecture, Psaume, 2eme lecture, Evangile). Utilise cet outil quand l'utilisateur demande les lectures du jour, l'evangile du jour, ou les textes de la messe du jour.",
    inputSchema: z.object({
      type: z
        .string()
        .nullable()
        .describe(
          "Type specifique: '1ere-lecture', 'psaume', '2eme-lecture', 'evangile', ou null pour toutes",
        ),
    }),
    execute: async ({ type }) => {
      const lectures = {
        date: new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        tempsLiturgique: 'Temps Ordinaire',
        lectures: [
          {
            type: '1ere-lecture',
            reference: 'Isaie 55, 10-11',
            extrait:
              "Ainsi parle le Seigneur : La pluie et la neige qui descendent des cieux n'y retournent pas sans avoir arrose la terre...",
          },
          {
            type: 'psaume',
            reference: 'Psaume 33 (34)',
            extrait:
              'Je benirai le Seigneur en tout temps, sa louange sans cesse a mes levres.',
          },
          {
            type: '2eme-lecture',
            reference: 'Romains 8, 18-23',
            extrait:
              "J'estime que les souffrances du temps present ne sont pas comparables a la gloire a venir qui sera revelee pour nous.",
          },
          {
            type: 'evangile',
            reference: 'Matthieu 6, 7-15',
            extrait:
              'En ce temps-la, Jesus disait a ses disciples: Lorsque vous priez, ne rabachaz pas comme les paiens...',
          },
        ],
      };

      if (type) {
        const found = lectures.lectures.find(
          (l) => l.type.toLowerCase() === type.toLowerCase(),
        );
        return found
          ? {
              date: lectures.date,
              tempsLiturgique: lectures.tempsLiturgique,
              lecture: found,
            }
          : { erreur: `Lecture de type "${type}" non trouvee.` };
      }

      return lectures;
    },
  }),
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  // Jeton Keycloak du client (en-tête Authorization), vérifié par l'API.
  const authorization = req.headers.get('authorization');
  const authRes = await fetch(`${env.API_URL}/v1/me/`, {
    headers: {
      Cookie: cookieHeader,
      Accept: 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    credentials: 'include',
  });

  if (!authRes.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'openai/gpt-5-mini',
    system: `Tu es l'assistant spirituel de l'application Jangu Bi, un compagnon catholique bienveillant.
    
Ton role :
- Repondre aux questions sur la Bible (passages, versets, exegese, contexte historique)
- Guider les fideles dans la priere du chapelet (mysteres, meditations, methode)
- Aider a trouver des pretres, moines ou soeurs disponibles selon le lieu et les horaires
- Fournir les lectures liturgiques du jour
- Offrir des conseils spirituels bienveillants

Regles :
- Reponds toujours en francais
- Sois chaleureux, respectueux et pastoral dans ton ton
- Quand tu fournis des resultats de recherche de pretres, formate-les clairement avec le nom, lieu, horaires et lien WhatsApp
- Quand tu cites la Bible, indique toujours la reference
- Pour le chapelet, encourage l'utilisation du guide interactif de l'application
- Si tu ne connais pas une information, dis-le honnetement et oriente vers les ressources de l'application
- Utilise les outils disponibles pour donner des reponses precises plutot que d'inventer des informations`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  });
}
