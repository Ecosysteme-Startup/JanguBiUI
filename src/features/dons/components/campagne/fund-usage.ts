/**
 * Lecture du texte « usage des fonds » d'une campagne (l'API ne donne qu'une `description`) :
 * les lignes « Libellé : 1 650 000 FCFA » (ou « Libellé — détail : montant ») forment un budget
 * ligne à ligne ; le reste est le texte du projet.
 */
export type BudgetLine = {
  label: string;
  detail: string | null;
  amount: number;
};
export type FundUsage = {
  prose: string[];
  budget: BudgetLine[];
  total: number | null;
};

const LINE =
  /^\s*(?:[-–•*]\s*)?(.+?)\s*:\s*(\d[\d\s.]*?)\s*(?:F\s?CFA|F)?\s*\.?\s*$/i;
const DETAIL = /\s+[—–-]\s+/;

export const parseFundUsage = (
  description: string | undefined | null,
): FundUsage => {
  const lines = (description ?? '').split(/\r?\n/);
  const budget: BudgetLine[] = [];
  let total: number | null = null;
  const rest: string[] = [];
  lines.forEach((line) => {
    const match = LINE.exec(line);
    if (!match) {
      rest.push(line);
      return;
    }
    const value = Number(match[2].replace(/[\s.]/g, ''));
    const [label, ...detail] = match[1].split(DETAIL);
    if (/^total$/i.test(label.trim())) total = value;
    else
      budget.push({
        label: label.trim(),
        detail: detail.join(' — ').trim() || null,
        amount: value,
      });
  });
  // Une seule ligne « x : nombre » ne fait pas un budget (« Objectif : 2026 »).
  if (budget.length < 2)
    return { prose: paragraphs(lines), budget: [], total: null };
  return {
    prose: paragraphs(rest),
    budget,
    total: total ?? budget.reduce((sum, l) => sum + l.amount, 0),
  };
};

const paragraphs = (lines: string[]) =>
  lines
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
