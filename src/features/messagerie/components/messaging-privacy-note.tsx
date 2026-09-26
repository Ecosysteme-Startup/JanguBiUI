import { Icon } from '@/components/ui/icon';
import { cn } from '@/utils/cn';

/**
 * Rappel de confidentialité de la messagerie. Pas de chiffrement de bout en bout en V1
 * (ADR-014 reporté) : on dit ce qui est vrai, chiffrée sur nos serveurs, illisible pour tout
 * administrateur (RG-09), réservée aux majeurs (RG-13).
 */
export const MessagingPrivacyNote = ({ className }: { className?: string }) => (
  <p className={cn('m-0 flex items-start gap-2 text-13 text-ink-3', className)}>
    <Icon name="cadenas" size={16} className="mt-px shrink-0" />
    <span>
      Messages chiffrés, aucun administrateur n’y a accès : ni le secrétariat de la paroisse, ni l’équipe de Jàngu Bi. Messagerie
      réservée aux fidèles majeurs.
    </span>
  </p>
);
