import { cn } from '@/utils/cn';

export type ChurchDrawingVariant = 'arche' | 'cathedrale' | 'clocher' | 'facade' | 'chapelle' | 'nef';

const VIEWBOX: Record<ChurchDrawingVariant, string> = {
  arche: '0 0 384 176',
  cathedrale: '0 0 384 176',
  clocher: '0 0 384 176',
  facade: '0 0 792 360',
  chapelle: '0 0 388 174',
  nef: '0 0 388 174',
};

const Drawing = ({ variant }: { variant: ChurchDrawingVariant }) => {
  switch (variant) {
    case 'arche':
      return (
        <>
          <path d="M0 176v-40h384v40z" className="fill-tint-100" />
          <path d="M146 176V92a46 46 0 0 1 92 0v84" className="fill-tint-100" />
          <path d="M164 176V98a28 28 0 0 1 56 0v78" className="fill-tint-50" />
          <path d="M192 16v36M180 28h24" className="stroke-tint-300" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'cathedrale':
      return (
        <>
          <path d="M0 176v-40h384v40z" className="fill-tint-100" />
          <path d="M96 176V88h192v88z" className="fill-tint-100" />
          <path d="M120 176V70a18 18 0 0 1 36 0v106M228 176V70a18 18 0 0 1 36 0v106" className="fill-tint-200" />
          <path d="M168 176v-62a24 24 0 0 1 48 0v62" className="fill-tint-50" />
          <circle cx="192" cy="68" r="12" fill="none" className="stroke-tint-300" strokeWidth="1.5" />
        </>
      );
    case 'clocher':
      return (
        <>
          <path d="M0 176v-40h384v40z" className="fill-tint-100" />
          <path d="M132 176v-76l60-44 60 44v76z" className="fill-tint-100" />
          <path d="M172 176v-44a20 20 0 0 1 40 0v44" className="fill-tint-50" />
          <circle cx="192" cy="96" r="10" fill="none" className="stroke-tint-300" strokeWidth="1.5" />
          <path d="M192 20v28M182 30h20" className="stroke-tint-300" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'facade':
      return (
        <>
          <path d="M0 360v-80h792v80z" className="fill-tint-100" />
          <path d="M290 360V190a106 106 0 0 1 212 0v170" className="fill-tint-100" />
          <path d="M326 360V200a70 70 0 0 1 140 0v160" className="fill-tint-50" />
          <path d="M396 36v72M372 60h48" className="stroke-tint-300" strokeWidth="3" strokeLinecap="round" />
          <path d="M396 130 140 360M396 130 652 360M396 130v230" className="stroke-tint-200" strokeWidth="1" />
          <circle cx="396" cy="250" r="26" fill="none" className="stroke-tint-200" strokeWidth="1.5" />
        </>
      );
    case 'chapelle':
      return (
        <>
          <path d="M0 174v-36h388v36z" className="fill-tint-100" />
          <path d="M134 174v-78l60-44 60 44v78z" className="fill-tint-100" />
          <path d="M176 174v-46a18 18 0 0 1 36 0v46" className="fill-tint-50" />
          <path d="M194 14v28M184 24h20" className="stroke-tint-300" strokeWidth="2" strokeLinecap="round" />
        </>
      );
    case 'nef':
      return (
        <>
          <path
            d="M60 174V70a40 40 0 0 1 80 0v104M154 174V70a40 40 0 0 1 80 0v104M248 174V70a40 40 0 0 1 80 0v104"
            fill="none"
            className="stroke-tint-200"
            strokeWidth="2"
          />
          <path d="M0 174v-24h388v24z" className="fill-tint-100" />
          <circle cx="194" cy="66" r="14" fill="none" className="stroke-tint-300" strokeWidth="1.5" />
        </>
      );
  }
};

/**
 * Dessin au trait d'église (maquettes « Ciel produit ») en attendant de vraies photos ;
 * `data-photo-slot` sert à les remplacer. Décoratif.
 */
export const ChurchDrawing = ({ variant, slot, className }: { variant: ChurchDrawingVariant; slot: string; className?: string }) => (
  <div data-photo-slot={slot} className={cn('overflow-hidden bg-tint-50', className)}>
    <svg viewBox={VIEWBOX[variant]} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full">
      <Drawing variant={variant} />
    </svg>
  </div>
);
