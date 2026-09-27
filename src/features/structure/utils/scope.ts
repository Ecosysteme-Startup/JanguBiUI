/** « l’archidiocèse », « le diocèse », « le doyenné », « la province » (phrases d'en-tête). */
export const scopeOf = (node: { name: string; type: { code: string; label: string } }): string => {
  if (/^archidioc/i.test(node.name)) return 'l’archidiocèse';
  const known: Record<string, string> = { diocese: 'le diocèse', doyenne: 'le doyenné', province: 'la province', paroisse: 'la paroisse' };
  return known[node.type.code] ?? node.name;
};
