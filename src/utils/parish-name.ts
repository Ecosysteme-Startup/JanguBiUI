/**
 * Libellés d'un nœud dans une phrase. Le nom vient de l'annuaire et contient parfois déjà son
 * type (« Paroisse Saint-Dominique »), parfois non (« Sainte-Thérèse de Grand-Dakar ») :
 * on évite « Paroisse Paroisse … » et « de Paroisse … ».
 */
const TYPED = /^(paroisse|quasi-paroisse|aumônerie|cathédrale|sanctuaire|basilique|chapelle)\b/i;

/** « Paroisse Saint-Dominique » (inchangé) ou « Paroisse Sainte-Thérèse de Grand-Dakar ». */
export const parishLabel = (name: string): string => (TYPED.test(name) ? name : `Paroisse ${name}`);

const lowerType = (name: string) => name.replace(TYPED, (type) => type.toLowerCase());

/** « de la paroisse Saint-Dominique » ou « de Sainte-Thérèse de Grand-Dakar ». */
export const ofParish = (name: string): string => (TYPED.test(name) ? `de la ${lowerType(name)}` : `de ${name}`);

/** « à la paroisse Saint-Dominique » ou « à Sainte-Thérèse de Grand-Dakar ». */
export const atParish = (name: string): string => (TYPED.test(name) ? `à la ${lowerType(name)}` : `à ${name}`);
