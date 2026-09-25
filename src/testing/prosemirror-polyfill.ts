/**
 * jsdom n'implémente pas la géométrie du DOM dont ProseMirror (TipTap) a besoin pour
 * faire défiler la sélection. À appeler dans `beforeAll` des tests qui tapent dans l'éditeur.
 */
export const installProseMirrorPolyfill = () => {
  const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) };
  const rects = () => Object.assign([rect], { item: () => rect }) as unknown as DOMRectList;
  Element.prototype.getClientRects = rects;
  Range.prototype.getClientRects = rects;
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
  document.elementFromPoint = () => null;
};
