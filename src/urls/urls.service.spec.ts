import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { UrlsService } from './urls.service';

describe('UrlsService', () => {
  let service: UrlsService;
  let repository: Repository<Url>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Url],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Url]),
      ],
      providers: [UrlsService],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    repository = module.get<Repository<Url>>(getRepositoryToken(Url));
  });

  afterEach(async () => {
    await module.close();
  });

  it('creates a URL record and returns a well-formed response', async () => {
    const result = await service.create({ url: 'https://www.example.com/path?a=1' });

    expect(result.id).toBeDefined();
    expect(result.originalUrl).toBe('https://www.example.com/path?a=1');
    expect(result.shortCode).toHaveLength(6);
    expect(result.shortUrl.endsWith(result.shortCode)).toBe(true);
    expect(result.createdAt).toBeDefined();

    const stored = await repository.findOne({ where: { shortCode: result.shortCode } });
    expect(stored).not.toBeNull();
    expect(stored?.originalUrl).toBe('https://www.example.com/path?a=1');
  });

  it('generates unique short codes across multiple creations', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }).map((_, i) =>
        service.create({ url: `https://example.com/item/${i}` }),
      ),
    );
    const codes = results.map((r) => r.shortCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('returns the stored URL data when looking up an existing code', async () => {
    const created = await service.create({ url: 'https://example.com/lookup' });
    const found = await service.findByCode(created.shortCode);

    expect(found.originalUrl).toBe('https://example.com/lookup');
    expect(found.shortCode).toBe(created.shortCode);
  });

  it('throws NotFoundException when looking up an unknown code', async () => {
    await expect(service.findByCode('doesNotExist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws NotFoundException when resolving an unknown code for redirect', async () => {
    await expect(service.findOriginalUrl('doesNotExist')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('resolves the original URL for redirect purposes', async () => {
    const created = await service.create({ url: 'https://example.com/redirect-me' });
    const originalUrl = await service.findOriginalUrl(created.shortCode);
    expect(originalUrl).toBe('https://example.com/redirect-me');
  });
});
