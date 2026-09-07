import { ApiProperty } from '@nestjs/swagger';

export class UrlResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the shortened URL record',
    example: '3f1b1c2e-2c3a-4a1a-9b1a-2f5b6a7c8d9e',
  })
  id: string;

  @ApiProperty({
    description: 'The original, full-length URL',
    example: 'https://www.example.com/some/very/long/path?foo=bar',
  })
  originalUrl: string;

  @ApiProperty({
    description: 'The generated unique short code',
    example: 'aB82xK',
  })
  shortCode: string;

  @ApiProperty({
    description: 'The full short URL that redirects to the original URL',
    example: 'http://localhost:3000/aB82xK',
  })
  shortUrl: string;

  @ApiProperty({
    description: 'Timestamp when the short URL was created',
    example: '2026-09-07T10:00:00.000Z',
  })
  createdAt: Date;
}
