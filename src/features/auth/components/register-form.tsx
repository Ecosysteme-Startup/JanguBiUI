'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button/button';
import { Form, Input, Select } from '@/components/ui/form/index';
import { paths } from '@/config/paths';
import { useRegister, registerInputSchema } from '@/lib/auth';

type RegisterFormProps = {
  onSuccess: () => void;
};

const titleOptions = [
  { label: 'Monsieur', value: 'MR' },
  { label: 'Madame', value: 'MRS' },
];

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const registering = useRegister({ onSuccess });
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  // Le compte est créé INACTIF : seul le lien envoyé par email l'active
  // (`apps/users/services.py`). Rediriger vers l'application after inscription
  // renvoyait donc l'utilisateur sur un formulaire de connexion vide, sans la
  // moindre explication — et une tentative de connexion lui répondait « e-mail
  // ou mot de passe incorrect », ce qui est faux et l'envoyait réinitialiser un
  // mot de passe parfaitement valide (audit beta 2026-07-20).
  if (registering.isSuccess) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <p className="font-semibold">Votre compte a été créé.</p>
          <p className="mt-1">
            Un email de vérification vient de vous être envoyé. Ouvrez-le et
            cliquez sur le lien pour activer votre compte, puis connectez-vous.
          </p>
        </div>
        <NextLink
          href={paths.auth.login.getHref(redirectTo)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Aller à la connexion
        </NextLink>
      </div>
    );
  }

  return (
    <div>
      <Form
        onSubmit={(values) => {
          registering.mutate(values);
        }}
        schema={registerInputSchema}
        options={{
          shouldUnregister: true,
        }}
      >
        {({ register, formState }) => (
          <>
            <Select
              label="Civilité"
              error={formState.errors['title']}
              registration={register('title')}
              options={titleOptions}
            />
            <Input
              type="text"
              label="Prénom"
              error={formState.errors['first_name']}
              registration={register('first_name')}
            />
            <Input
              type="text"
              label="Nom"
              error={formState.errors['last_name']}
              registration={register('last_name')}
            />
            <Input
              type="email"
              label="Adresse email"
              error={formState.errors['email']}
              registration={register('email')}
            />
            <Input
              type="tel"
              label="Téléphone"
              placeholder="+221 77 000 00 00"
              error={formState.errors['phone_number']}
              registration={register('phone_number')}
            />
            <Input
              type="password"
              label="Mot de passe"
              error={formState.errors['password']}
              registration={register('password')}
            />
            <Input
              type="password"
              label="Confirmer le mot de passe"
              error={formState.errors['confirmPassword']}
              registration={register('confirmPassword')}
            />

            <div>
              <Button
                isLoading={registering.isPending}
                type="submit"
                className="w-full"
              >
                Créer mon compte
              </Button>
            </div>
          </>
        )}
      </Form>
      <div className="mt-2 flex items-center justify-end">
        <div className="text-sm">
          <NextLink
            href={paths.auth.login.getHref(redirectTo)}
            className="font-medium text-primary hover:text-primary/80"
          >
            Se connecter
          </NextLink>
        </div>
      </div>
    </div>
  );
};
