'use client';

import { CountUp } from '@/lib/motion/count-up';
import { Stagger, StaggerItem } from '@/lib/motion/reveal';

interface Stat {
  target: number;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { target: 2400, label: 'Fidèles actifs' },
  { target: 50, label: 'Paroisses' },
  { target: 7, label: 'Diocèses' },
  { target: 99.9, suffix: '%', label: 'Uptime' },
];

function formatValue(val: number, suffix?: string): string {
  if (val >= 1000) return `${(val / 1000).toFixed(1)}k+`;
  if (suffix) return `${val}${suffix}`;
  return String(val);
}

/** Valeur intermédiaire arrondie à l'entier ; valeur finale exacte (99.9 %). */
const formatterFor = (stat: Stat) => (v: number) =>
  v >= stat.target
    ? formatValue(stat.target, stat.suffix)
    : formatValue(Math.floor(v), stat.suffix);

export function StatsSection() {
  return (
    <section className="border-y border-border py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-10">
        <Stagger className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <StaggerItem key={stat.label} className="p-6 text-center">
              <div className="mb-1.5 font-serif text-4xl font-bold tabular-nums text-primary lg:text-5xl">
                <CountUp to={stat.target} format={formatterFor(stat)} />
              </div>
              <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
