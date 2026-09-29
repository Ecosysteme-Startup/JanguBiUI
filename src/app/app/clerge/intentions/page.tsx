import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

/** Ancienne adresse : la file vit dans l'espace paroisse (`intentions.gerer`). */
export default function ClergeIntentionsPage() {
  redirect(paths.app.paroisse.intentions.getHref());
}
