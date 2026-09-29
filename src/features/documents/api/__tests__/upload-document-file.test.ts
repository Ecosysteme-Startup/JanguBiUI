import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';

import { uploadDocumentFile } from '../upload-document-file';

const makeFile = (
  name = 'baptism.pdf',
  type = 'application/pdf',
  size = 1024,
) => {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
};

describe('uploadDocumentFile', () => {
  test('uploads a file and returns the created file id', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/files/upload/standard/`, () =>
        HttpResponse.json({ id: 7 }, { status: 201 }),
      ),
    );

    const result = await uploadDocumentFile(makeFile());
    expect(result).toEqual({ id: 7 });
  });

  test('sends the request as multipart/form-data', async () => {
    const capturedContentTypes: string[] = [];

    server.use(
      http.post(`${env.API_URL}/v1/files/upload/standard/`, ({ request }) => {
        capturedContentTypes.push(request.headers.get('content-type') ?? '');
        return HttpResponse.json({ id: 11 }, { status: 201 });
      }),
    );

    await uploadDocumentFile(makeFile('marriage.pdf'));

    expect(capturedContentTypes[0]).toMatch(/^multipart\/form-data/);
  });

  test('rejects when the API responds with an error', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/files/upload/standard/`, () =>
        HttpResponse.json({ message: 'Fichier invalide.' }, { status: 400 }),
      ),
    );

    await expect(uploadDocumentFile(makeFile())).rejects.toThrow(
      /fichier invalide/i,
    );
  });
});
