import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('URL Shortener (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/urls', () => {
    it('creates a short URL for a valid URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'https://www.example.com/some/long/path?foo=bar' })
        .expect(201);

      expect(response.body.originalUrl).toBe(
        'https://www.example.com/some/long/path?foo=bar',
      );
      expect(response.body.shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
      expect(response.body.shortUrl).toBe(
        `http://localhost:3000/${response.body.shortCode}`,
      );
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('rejects a missing url', async () => {
      await request(app.getHttpServer()).post('/api/urls').send({}).expect(400);
    });

    it('rejects an empty url', async () => {
      await request(app.getHttpServer()).post('/api/urls').send({ url: '' }).expect(400);
    });

    it('rejects a malformed url', async () => {
      await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'not-a-valid-url' })
        .expect(400);
    });

    it('rejects a non-http(s) protocol', async () => {
      await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'ftp://example.com/file' })
        .expect(400);
    });

    it('generates unique short codes for repeated identical submissions', async () => {
      const first = await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'https://example.com/duplicate' })
        .expect(201);
      const second = await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'https://example.com/duplicate' })
        .expect(201);

      expect(first.body.shortCode).not.toBe(second.body.shortCode);
    });
  });

  describe('GET /api/urls/:code', () => {
    it('returns URL data for an existing code', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'https://example.com/lookup-me' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/urls/${created.body.shortCode}`)
        .expect(200);

      expect(response.body.originalUrl).toBe('https://example.com/lookup-me');
      expect(response.body.shortCode).toBe(created.body.shortCode);
    });

    it('returns 404 for an unknown code', async () => {
      await request(app.getHttpServer()).get('/api/urls/doesNotExist').expect(404);
    });
  });

  describe('GET /:code (redirect)', () => {
    it('redirects with 302 to the original URL for an existing code', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/urls')
        .send({ url: 'https://example.com/redirect-target' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/${created.body.shortCode}`)
        .expect(302);

      expect(response.headers.location).toBe('https://example.com/redirect-target');
    });

    it('returns 404 for an unknown short code and does not redirect', async () => {
      const response = await request(app.getHttpServer()).get('/unknown123').expect(404);
      expect(response.headers.location).toBeUndefined();
    });
  });

  describe('GET /api/health', () => {
    it('reports ok status', async () => {
      const response = await request(app.getHttpServer()).get('/api/health').expect(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
