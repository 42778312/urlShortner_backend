import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The original URL to shorten. Must be a valid HTTP or HTTPS URL.',
    example: 'https://www.example.com/some/very/long/path?foo=bar',
  })
  @IsNotEmpty({ message: 'url should not be empty' })
  @IsString()
  @MaxLength(2048, { message: 'url must not exceed 2048 characters' })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'url must be a valid HTTP or HTTPS URL' },
  )
  url: string;
}
