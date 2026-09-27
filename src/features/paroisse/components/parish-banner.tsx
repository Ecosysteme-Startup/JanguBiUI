import { cn } from '@/utils/cn';

/**
 * Bandeau de « Ma paroisse » (FID-Ma-Paroisse) : deux emplacements photo dessinés au trait
 * (façade de l'église, lieu secondaire) en attendant de vraies photos. `data-photo-slot`
 * permet de les remplacer ; jamais de photo factice.
 */
export const ParishBanner = ({ name, secondPlace, className }: { name: string; secondPlace?: string; className?: string }) => (
  <div className={cn('grid gap-3', secondPlace ? 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : '', className)}>
    <div
      data-photo-slot="paroisse-facade"
      role="img"
      aria-label={`Emplacement photo : façade de l’église, ${name}`}
      className="h-[184px] overflow-hidden rounded-16 bg-tint-50"
    >
      <svg width="100%" height="100%" viewBox="0 0 690 184" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 184v-36h690v36z" fill="var(--jb-tint-100)" />
        <path d="M265 232V120a80 80 0 0 1 160 0v112" fill="var(--jb-tint-100)" />
        <path d="M292 232V128a53 53 0 0 1 106 0v104" fill="var(--jb-tint-50)" />
        <path d="M345 18v52M328 36h34" stroke="var(--jb-tint-300)" strokeWidth="3" strokeLinecap="round" />
        <path d="M345 86 120 232M345 86 570 232M345 86v146" stroke="var(--jb-tint-200)" strokeWidth="1" />
        <circle cx="345" cy="164" r="20" fill="none" stroke="var(--jb-tint-200)" strokeWidth="1.5" />
      </svg>
    </div>
    {secondPlace && (
      <div
        data-photo-slot="paroisse-lieu-secondaire"
        role="img"
        aria-label={`Emplacement photo : ${secondPlace}`}
        className="hidden h-[184px] overflow-hidden rounded-16 bg-tint-50 sm:block"
      >
        <svg width="100%" height="100%" viewBox="0 0 340 184" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M0 184v-30h340v30z" fill="var(--jb-tint-100)" />
          <path d="M110 184v-96l60-50 60 50v96z" fill="var(--jb-tint-100)" />
          <path d="M150 184v-52a20 20 0 0 1 40 0v52" fill="var(--jb-tint-50)" />
          <path d="M170 8v24M160 18h20" stroke="var(--jb-tint-300)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    )}
  </div>
);
