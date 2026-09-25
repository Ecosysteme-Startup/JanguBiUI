import type { operations } from './api';

/**
 * Passerelle entre le schéma OpenAPI du backend et le code client.
 *
 * `src/types/api.ts` est **généré** depuis drf-spectacular (`yarn generate-api`)
 * et décrit donc le contrat réel du serveur. Mais un type généré que personne
 * n'utilise ne protège de rien : plusieurs pannes de production sont venues
 * d'un client qui inventait sa propre forme de payload alors que le bon type
 * dormait dans ce fichier — un `message` envoyé là où le serveur lisait
 * `comment` (email parti sans motif, en 200), un `file_id` obligatoire omis
 * (dépôt en 400 systématique, coffre-fort jamais alimenté).
 *
 * Les alias ci-dessous permettent de **dériver** le type d'un payload depuis
 * l'opération correspondante. Le compilateur refuse alors tout écart : un champ
 * mal nommé ou manquant devient une erreur de build, pas une panne silencieuse.
 *
 * Usage :
 * ```ts
 * type DepositBody = RequestBody<'v1_documents_admin_requests_deposit_create'>;
 * const body: DepositBody = { file_id: id, label: 'Document officiel' };
 * ```
 */

export type OperationId = keyof operations;

/** Corps de requête attendu par le serveur pour cette opération. */
export type RequestBody<Id extends OperationId> =
  operations[Id] extends {
    requestBody?: { content: { 'application/json': infer Body } };
  }
    ? Body
    : never;

/** Charge utile renvoyée en cas de succès (200 ou 201). */
export type ResponseBody<Id extends OperationId> =
  operations[Id] extends {
    responses: { 200: { content: { 'application/json': infer Body } } };
  }
    ? Body
    : operations[Id] extends {
          responses: { 201: { content: { 'application/json': infer Body } } };
        }
      ? Body
      : never;

/**
 * Vérifie à la compilation qu'un type écrit à la main correspond au contrat du
 * serveur. À utiliser quand on ne peut pas dériver directement le type — un
 * schéma zod, par exemple, doit rester pour valider la réponse à l'exécution,
 * mais rien ne garantit qu'il décrive la même forme que le serveur.
 *
 * ```ts
 * type _Check = Expect<Matches<MonType, ResponseBody<'...'>>>;
 * ```
 *
 * ⚠️ Le détour par `Expect` n'est pas cosmétique. Une première version se
 * contentait d'un alias valant `never` en cas d'écart — or un alias de type
 * inutilisé ne fait rien échouer, et la garde ne mordait sur RIEN (vérifié en
 * renommant un champ : zéro erreur). C'est la CONTRAINTE `T extends true` qui
 * produit l'erreur de compilation.
 */
export type Expect<T extends true> = T;

/**
 * Égalité stricte de deux types, dans les deux sens. Les tuples autour de `A`
 * et `B` neutralisent la distribution sur les unions, sans quoi `never` ou un
 * type union donnerait un verdict faussement positif.
 */
export type Matches<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
