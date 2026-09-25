import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

/** Espaces réservés aux personnes connectées (le backend reste l'autorité sur chaque requête). */
const PROTECTED = ['/app', '/espace', '/plateforme', '/bienvenue'];

export const proxy = auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();
  if (request.auth && !request.auth.error) return NextResponse.next();
  const login = new URL('/connexion', request.nextUrl.origin);
  login.searchParams.set('redirectTo', `${pathname}${search}`);
  return NextResponse.redirect(login);
});

export const config = { matcher: ['/app/:path*', '/espace/:path*', '/plateforme/:path*', '/bienvenue'] };
