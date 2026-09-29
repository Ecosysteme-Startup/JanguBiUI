import { Icon } from '@/components/ui/icon';

/**
 * Indicateur de confidentialité de la messagerie. Le chiffrement de bout en bout est
 * reporté après le pilote (ADR-014 backend) : on n'affiche que ce qui est vrai —
 * messages chiffrés sur nos serveurs, illisibles pour tout administrateur (RG-09).
 */
export const EncryptionBadge = ({ correspondent }: { correspondent?: string }) => (
  <p className="tnum m-0 flex items-center justify-center gap-2 text-center text-meta text-ok">
    <Icon name="cadenas" size={14} />
    {correspondent
      ? `Messages chiffrés · échange privé avec ${correspondent}, aucun administrateur n\u2019y a accès`
      : 'Messages chiffrés · aucun administrateur n\u2019y a accès'}
  </p>
);
