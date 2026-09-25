import type { Metadata } from 'next';

import { NotificationsCenter } from '@/features/notifications/components/notifications-center';

export const metadata: Metadata = { title: 'Notifications' };

const NotificationsPage = () => <NotificationsCenter />;

export default NotificationsPage;
