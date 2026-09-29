'use client';

import { KeycloakRedirect } from '@/features/auth/components/keycloak-redirect';

const RegisterPage = () => <KeycloakRedirect action="register" />;

export default RegisterPage;
