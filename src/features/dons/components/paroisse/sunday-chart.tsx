import { dayjs } from '@/utils/dates';

import { amount, fcfa } from '../../utils/format';

import { weekSunday } from './period';

/**
 * Une barre par dimanche. `online` et `cash` sont facultatifs : la synthèse de l'API ne donne
 * aujourd'hui que le total par jour (`daily`), sans la répartition en ligne / espèces. Dès que le
 * serveur la fournira, les barres s'empilent (espèces en bas, en ligne au-dessus), comme sur la maquette.
 */
export type SundayBar = {
  sunday: string;
  total: number;
  online?: number;
  cash?: number;
};

/** Regroupe les totaux quotidiens par semaine terminée le dimanche. */
export const sundayBars = (
  daily: { date: string; total: number }[],
): SundayBar[] => {
  const byWeek = new Map<string, number>();
  daily.forEach((d) => {
    const key = weekSunday(d.date);
    byWeek.set(key, (byWeek.get(key) ?? 0) + d.total);
  });
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sunday, total]) => ({ sunday, total }));
};

const W = 640;
const LEFT = 56;
const TOP = 20;
const BASE = 196;
const BAR = 56;

const niceStep = (max: number) => {
  const raw = Math.max(max, 1) / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const m = raw / pow;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * pow;
};

const tick = (v: number) =>
  v >= 1_000_000
    ? `${String(v / 1_000_000).replace('.', ',')} M`
    : v >= 1000
      ? `${String(v / 1000).replace('.', ',')} k`
      : String(v);

/** Barre à coins supérieurs arrondis (rayon 4). */
const topRounded = (x: number, y: number, h: number) => {
  const r = Math.min(4, h / 2, BAR / 2);
  return `M${x} ${y + h} V${y + r} a${r} ${r} 0 0 1 ${r} ${-r} H${x + BAR - r} a${r} ${r} 0 0 1 ${r} ${r} V${y + h} Z`;
};

const sundayLabel = (d: string) => `dim. ${dayjs(d).format('D MMM')}`;

export const SundayChart = ({
  bars,
  title,
}: {
  bars: SundayBar[];
  title: string;
}) => {
  const split = bars.some(
    (b) => b.online !== undefined || b.cash !== undefined,
  );
  const step = niceStep(Math.max(...bars.map((b) => b.total), 0));
  const top = step * 4;
  const y = (v: number) => BASE - ((BASE - TOP) * v) / top;
  const slot = (W - LEFT) / Math.max(bars.length, 1);
  const description = bars
    .map((b) =>
      split
        ? `${sundayLabel(b.sunday)} : ${fcfa(b.online ?? 0)} en ligne et ${fcfa(b.cash ?? 0)} en espèces`
        : `${sundayLabel(b.sunday)} : ${fcfa(b.total)}`,
    )
    .join('. ');

  return (
    <div>
      <div className="flex flex-wrap items-center gap-5 text-13 text-ink-2">
        {split ? (
          <>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-3 bg-tint-400"
              />
              En ligne
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-3 rounded-3 bg-primary-strong"
              />
              Espèces (quêtes saisies)
            </span>
          </>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-3 bg-tint-400" />
            Total affecté (en ligne et espèces)
          </span>
        )}
      </div>
      <div className="mt-5">
        <svg
          viewBox={`0 0 ${W} 232`}
          role="img"
          aria-label={`${title}. ${description}.`}
          className="block h-auto w-full overflow-visible"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line
                x1={LEFT}
                x2={W}
                y1={y(step * i)}
                y2={y(step * i)}
                className="stroke-line"
                strokeWidth={1}
              />
              <text
                x={46}
                y={y(step * i)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-ink-3 text-12"
              >
                {tick(step * i)}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const x = LEFT + slot * (i + 0.5) - BAR / 2;
            const cash = split ? (b.cash ?? 0) : 0;
            const online = split ? (b.online ?? 0) : b.total;
            const cashTop = y(cash);
            const onlineH = BASE - y(online);
            const onlineY = (cash > 0 ? cashTop - 2 : BASE) - onlineH;
            return (
              <g key={b.sunday}>
                {cash > 0 && (
                  <path
                    d={topRounded(x, cashTop, BASE - cashTop)}
                    className="fill-primary-strong"
                  />
                )}
                {online > 0 && (
                  <path
                    d={topRounded(x, onlineY, onlineH)}
                    className="fill-tint-400"
                  />
                )}
                <text
                  x={x + BAR / 2}
                  y={Math.min(onlineY, cashTop) - 8}
                  textAnchor="middle"
                  className="tnum fill-ink text-13 font-semibold"
                >
                  {amount(b.total)}
                </text>
                <text
                  x={x + BAR / 2}
                  y={218}
                  textAnchor="middle"
                  className="fill-ink-3 text-12"
                >
                  {sundayLabel(b.sunday)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
