import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { User } from '@/lib/auth';
import { createUser } from '@/testing/data-generators';

// Comptes de démonstration des tableaux de bord des dons (serveur de mocks et
// captures) : la connexion avec l'un de ces e-mails renvoie un compte staff
// doté des capacités correspondantes, que /me renvoie ensuite.
const COMPTES_DEMO_DONS: Record<string, Partial<User>> = {
  'cecile.coly@saint-dominique.sn': {
    role: 'parish_admin',
    is_admin: true,
    capabilities: ['dons.voir_fonds', 'dons.saisir_quete', 'dons.exporter'],
    profile: {
      first_name: 'Cécile',
      last_name: 'Coly',
      title: 'Mme',
      primary_parish: null,
      avatar: null,
    },
  },
  'bernard.coly@archidiocese-dakar.sn': {
    role: 'diocese_admin',
    is_admin: true,
    capabilities: ['dons.voir_agregats'],
    profile: {
      first_name: 'Bernard',
      last_name: 'Coly',
      title: 'M.',
      primary_parish: null,
      avatar: null,
    },
  },
  'moustoifa.ben@numerisen.sn': {
    role: 'super_admin',
    is_admin: true,
    capabilities: ['plateforme.admin'],
    profile: {
      first_name: 'Moustoifa',
      last_name: 'Ben',
      primary_parish: null,
      avatar: null,
    },
  },
};
let compteDemo: User | null = null;

export const authHandlers = [
  http.post(`${env.API_URL}/v1/auth/jwt/login/`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'invalid@test.com') {
      return HttpResponse.json(
        { message: 'Email ou mot de passe incorrect.' },
        { status: 401 },
      );
    }

    const demo = COMPTES_DEMO_DONS[body.email];
    const user = createUser({ email: body.email, ...demo });
    if (demo) compteDemo = user;
    return HttpResponse.json({
      access: 'fake-access-token',
      refresh: 'fake-refresh-token',
      user,
    });
  }),

  http.post(`${env.API_URL}/v1/auth/jwt/refresh/`, async ({ request }) => {
    const body = (await request.json()) as { refresh?: string };
    if (!body.refresh) {
      return HttpResponse.json(
        { detail: 'No active account found with the given credentials' },
        { status: 401 },
      );
    }
    return HttpResponse.json({
      access: 'refreshed-access-token',
      refresh: 'rotated-refresh-token',
    });
  }),

  http.post(`${env.API_URL}/v1/auth/jwt/logout/`, () => {
    return HttpResponse.json({});
  }),

  http.get(`${env.API_URL}/v1/auth/me/`, () => {
    return HttpResponse.json(compteDemo ?? createUser());
  }),

  http.post(`${env.API_URL}/v1/users/register/`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      phone_number: string;
      first_name: string;
      last_name: string;
      title: string;
      password: string;
    };

    if (body.email === 'taken@test.com') {
      return HttpResponse.json(
        { message: 'Un compte existe déjà avec cet email.' },
        { status: 400 },
      );
    }

    const user = createUser({
      email: body.email,
      profile: {
        first_name: body.first_name,
        last_name: body.last_name,
        title: body.title,
        phone: body.phone_number,
        primary_parish: null,
        avatar: null,
      },
    });

    return HttpResponse.json(
      {
        access: 'fake-access-token',
        refresh: 'fake-refresh-token',
        user,
      },
      { status: 201 },
    );
  }),

  http.post(
    `${env.API_URL}/v1/users/password/reset/request/`,
    async ({ request }) => {
      const body = (await request.json()) as { email: string };
      if (body.email === 'error@test.com') {
        return HttpResponse.json(
          { message: 'Erreur serveur' },
          { status: 500 },
        );
      }
      return HttpResponse.json({ detail: 'Email envoyé si le compte existe.' });
    },
  ),

  http.post(
    `${env.API_URL}/v1/users/password/reset/confirm/`,
    async ({ request }) => {
      const body = (await request.json()) as {
        token: string;
        new_password: string;
      };
      if (body.token === 'invalid-token') {
        return HttpResponse.json(
          { message: 'Lien invalide ou expiré.' },
          { status: 400 },
        );
      }
      return HttpResponse.json({ detail: 'Mot de passe réinitialisé.' });
    },
  ),

  http.post(`${env.API_URL}/v1/users/password/change/`, async ({ request }) => {
    const body = (await request.json()) as {
      old_password: string;
      new_password: string;
    };
    if (body.old_password === 'wrong') {
      return HttpResponse.json(
        { message: 'Mot de passe actuel incorrect.' },
        { status: 400 },
      );
    }
    return HttpResponse.json({ detail: 'Mot de passe modifié.' });
  }),

  http.patch(`${env.API_URL}/v1/users/me/update/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const user = createUser({
      profile: {
        first_name: String(body.first_name ?? ''),
        last_name: String(body.last_name ?? ''),
        phone: String(body.phone ?? ''),
        primary_parish: null,
        avatar: null,
      },
    });
    return HttpResponse.json(user);
  }),

  http.delete(`${env.API_URL}/v1/users/me/delete/`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${env.API_URL}/v1/users/email/change/request/`, () => {
    return HttpResponse.json({ detail: 'Code OTP envoyé.' });
  }),

  http.post(`${env.API_URL}/v1/users/email/change/confirm/`, () => {
    return HttpResponse.json({ detail: 'Email modifié.' });
  }),

  http.post(`${env.API_URL}/v1/users/verify-email/`, () => {
    return HttpResponse.json({ detail: 'Email vérifié.' });
  }),
];
