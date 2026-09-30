import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import type { RequestBody } from '@/types/api-contract';

type AttendanceBody = RequestBody<'v1_staff_confessions_bookings_attendance_create'>;

/**
 * Le prêtre note si la personne est venue à SON rendez-vous passé (204 sans corps).
 * Seule la présence est enregistrée : aucun contenu n'est jamais demandé ni transmis.
 */
export const markAttendance = ({ bookingId, attended }: { bookingId: number; attended: boolean }) => {
  const body: AttendanceBody = { attended };
  return api.post(`/staff/confessions/bookings/${bookingId}/attendance/`, body);
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAttendance,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['confessions-planning'] }),
  });
};
