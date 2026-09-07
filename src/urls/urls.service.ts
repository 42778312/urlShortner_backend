import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { Url } from './entities/url.entity';

const SHORT_CODE_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const MAX_GENERATION_ATTEMPTS = 10;

@Injectable()
export class UrlsService {
  private readonly shortCodeLength: number;
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Url)
    private readonly urlsRepository: Repository<Url>,
    private readonly configService: ConfigService,
  ) {
    this.shortCodeLength = Number(
      this.configService.get<string>('SHORT_CODE_LENGTH') ?? 6,
    );
    this.baseUrl = (
      this.configService.get<string>('BASE_URL') ?? 'http://localhost:3000'
    ).replace(/\/+$/, '');
  }

  async create(createUrlDto: CreateUrlDto): Promise<UrlResponseDto> {
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const shortCode = this.generateShortCode();

      try {
        const url = this.urlsRepository.create({
          originalUrl: createUrlDto.url,
          shortCode,
        });
        const saved = await this.urlsRepository.save(url);
        return this.toResponseDto(saved);
      } catch (error) {
        if (this.isUniqueConstraintViolation(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      'Failed to generate a unique short code after multiple attempts',
    );
  }

  async findByCode(shortCode: string): Promise<UrlResponseDto> {
    const url = await this.urlsRepository.findOne({ where: { shortCode } });
    if (!url) {
      throw new NotFoundException('Short URL not found');
    }
    return this.toResponseDto(url);
  }

  async findOriginalUrl(shortCode: string): Promise<string> {
    const url = await this.urlsRepository.findOne({ where: { shortCode } });
    if (!url) {
      throw new NotFoundException('Short URL not found');
    }
    return url.originalUrl;
  }

  private generateShortCode(): string {
    const bytes = randomBytes(this.shortCodeLength);
    let code = '';
    for (let i = 0; i < this.shortCodeLength; i++) {
      code += SHORT_CODE_ALPHABET[bytes[i] % SHORT_CODE_ALPHABET.length];
    }
    return code;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = (error as QueryFailedError & { code?: string })
      .driverError as { code?: string } | undefined;
    return (
      driverError?.code === 'SQLITE_CONSTRAINT' ||
      error.message.includes('UNIQUE constraint failed')
    );
  }

  private toResponseDto(url: Url): UrlResponseDto {
    return {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      shortUrl: `${this.baseUrl}/${url.shortCode}`,
      createdAt: url.createdAt,
    };
  }
}
