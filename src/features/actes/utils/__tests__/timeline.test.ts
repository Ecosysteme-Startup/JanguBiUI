import { requestSchema } from '../../types/request';
import { buildTimeline, messagesOf, pendingInfoRequest, progressOf } from '../timeline';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

const request = (over: Record<string, unknown>) =>
  requestSchema.parse({
    id: 'r1',
    reference: 'DOC-1',
    document_type: 'baptism',
    document_type_label: 'Certificat de baptême',
    reason: 'personal',
    status: 'submitted',
    status_label: 'Soumise',
    target_node: { id: 'p1', name: 'Sainte-Thérèse' },
    requester_last_name: 'Diouf',
    requester_first_names: 'Marie',
    date_of_birth: '1992-03-14',
    place_of_birth: 'Dakar',
    contact_phone: '+221',
    contact_email: 'm@example.sn',
    father_last_name: 'P',
    mother_last_name: 'M',
    sacrament_approximate_date: '1992',
    sacrament_location: 'Sainte-Thérèse',
    pickup: null,
    can_cancel: true,
    created_at: '2026-09-21T10:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    history: [{ from_status: '', to_status: 'submitted', comment: '', created_at: '2026-09-21T10:00:00Z' }],
    ...over,
  });

describe('buildTimeline', () => {
  it('suit le chemin nominal : soumise en cours, puis vérification, retrait et remise à venir', () => {
    const steps = buildTimeline(request({}));
    expect(steps.map((s) => [s.title, s.state])).toEqual([
      ['Demande soumise', 'current'],
      ['En vérification dans le registre', 'upcoming'],
      ['Prête à retirer', 'upcoming'],
      ['Retirée', 'upcoming'],
    ]);
    expect(steps[0].detail).toMatch(/paroisse du sacrement/);
  });

  it('insère le complément demandé comme étape en cours, sans sauter les suivantes', () => {
    const r = request({
      status: 'info_requested',
      history: [
        { from_status: '', to_status: 'submitted', comment: '', created_at: '2026-09-21T10:00:00Z' },
        { from_status: 'submitted', to_status: 'under_verification', comment: '', created_at: '2026-09-22T10:00:00Z' },
        { from_status: 'under_verification', to_status: 'info_requested', comment: 'Nom de la marraine ?', created_at: '2026-09-23T10:00:00Z' },
      ],
    });
    const steps = buildTimeline(r);
    expect(steps.map((s) => s.state)).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming']);
    expect(steps[2].detail).toBe('Nom de la marraine ?');
    expect(pendingInfoRequest(r)?.comment).toBe('Nom de la marraine ?');
  });

  it('termine sur le rejet, sans étape à venir', () => {
    const steps = buildTimeline(
      request({
        status: 'rejected',
        rejection_reason: 'Aucun acte à ce nom.',
        history: [
          { from_status: '', to_status: 'submitted', comment: '', created_at: '2026-09-21T10:00:00Z' },
          { from_status: 'submitted', to_status: 'under_verification', comment: '', created_at: '2026-09-22T10:00:00Z' },
          { from_status: 'under_verification', to_status: 'rejected', comment: '', created_at: '2026-09-23T10:00:00Z' },
        ],
      }),
    );
    expect(steps.at(-1)).toMatchObject({ title: 'Demande rejetée', state: 'current', detail: 'Aucun acte à ce nom.' });
    expect(steps.some((s) => s.state === 'upcoming')).toBe(false);
  });

  it('marque toutes les étapes faites une fois l’original retiré', () => {
    const steps = buildTimeline(
      request({ status: 'collected', history: [{ from_status: 'ready_for_pickup', to_status: 'collected', comment: '', created_at: '2026-09-23T10:00:00Z' }] }),
    );
    expect(steps.every((s) => s.state === 'done')).toBe(true);
  });
});

describe('messagesOf', () => {
  it('attribue la réponse du complément au fidèle et le reste à la paroisse', () => {
    const r = request({
      status: 'under_verification',
      history: [
        { from_status: '', to_status: 'submitted', comment: 'ignoré', created_at: '2026-09-21T10:00:00Z' },
        { from_status: 'under_verification', to_status: 'info_requested', comment: 'Précisez.', created_at: '2026-09-22T10:00:00Z' },
        { from_status: 'info_requested', to_status: 'under_verification', comment: 'Complément fourni par le demandeur.', created_at: '2026-09-22T12:00:00Z' },
      ],
    });
    expect(messagesOf(r).map((m) => [m.from, m.text])).toEqual([
      ['paroisse', 'Précisez.'],
      ['fidele', 'Complément fourni par le demandeur.'],
    ]);
  });
});

describe('progressOf', () => {
  const now = new Date('2026-09-24T12:00:00');
  it('situe une demande en vérification : deux segments franchis, la vérification en cours', () => {
    const r = request({
      status: 'under_verification',
      history: [
        { from_status: '', to_status: 'submitted', comment: '', created_at: '2026-09-16T10:12:00' },
        { from_status: 'submitted', to_status: 'under_verification', comment: '', created_at: '2026-09-24T09:05:00' },
      ],
    });
    expect(progressOf(r, now)).toEqual([
      { key: 'submitted', label: 'Soumise', when: '16 sept.', state: 'done' },
      { key: 'under_verification', label: 'Vérification', when: 'aujourd’hui', state: 'current' },
      { key: 'ready_for_pickup', label: 'Prête à retirer', when: null, state: 'upcoming' },
      { key: 'collected', label: 'Retirée', when: null, state: 'upcoming' },
    ]);
  });

  it('range un complément demandé dans l’étape de vérification', () => {
    const r = request({ status: 'info_requested', history: [{ from_status: 'submitted', to_status: 'info_requested', comment: '', created_at: '2026-09-20T09:00:00' }] });
    expect(progressOf(r, now).map((s) => s.state)).toEqual(['done', 'current', 'upcoming', 'upcoming']);
  });

  it('marque tout franchi une fois l’original retiré, et rien pour une demande rejetée', () => {
    expect(progressOf(request({ status: 'collected' }), now).every((s) => s.state === 'done')).toBe(true);
    expect(progressOf(request({ status: 'rejected' }), now)).toEqual([]);
  });
});
