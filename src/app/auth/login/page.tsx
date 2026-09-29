'use client';

import { KeycloakRedirect } from '@/features/auth/components/keycloak-redirect';

const LoginPage = () => <KeycloakRedirect action="login" />;

export default LoginPage;
