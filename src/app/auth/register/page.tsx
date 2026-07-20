'use client';

import { RegisterForm } from '@/features/auth/components/register-form';

const RegisterPage = () => {
  // Pas de redirection après inscription : le compte est créé INACTIF et n'est
  // activé que par le lien envoyé par email. Naviguer vers l'application
  // renvoyait l'utilisateur sur un formulaire de connexion vide, sans lui dire
  // qu'il devait consulter sa boîte mail. `RegisterForm` affiche désormais
  // l'écran de confirmation lui-même (audit beta 2026-07-20).
  return <RegisterForm onSuccess={() => undefined} />;
};

export default RegisterPage;
