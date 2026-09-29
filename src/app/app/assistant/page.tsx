import { FeatureGate } from '@/components/feature-gate';
import { FEATURES } from '@/config/features';
import { AssistantChat } from '@/features/assistant/components/assistant-chat';

// Route manquante côté backend (`/v1/rag/`) : écran derrière l'indicateur.
export default function AssistantPage() {
  return (
    <FeatureGate feature={FEATURES.assistant}>
      <AssistantChat />
    </FeatureGate>
  );
}
