import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUrlDto } from './dto/create-url.dto';
import { UrlResponseDto } from './dto/url-response.dto';
import { UrlsService } from './urls.service';

@ApiTags('URLs')
@Controller('api/urls')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a short URL',
    description:
      'Accepts a valid HTTP/HTTPS URL, generates a unique short code, stores the mapping, and returns the shortened URL.',
  })
  @ApiBody({
    type: CreateUrlDto,
    examples: {
      example: {
        summary: 'Example request',
        value: { url: 'https://www.example.com/some/long/url' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The short URL was created successfully.',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The request body is missing, empty, or contains an invalid URL.',
  })
  create(@Body() createUrlDto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlsService.create(createUrlDto);
  }

  @Get(':code')
  @ApiOperation({
    summary: 'Look up a short URL',
    description:
      'Returns information about a shortened URL by its short code, without performing a redirect. Useful for testing and inspection.',
  })
  @ApiParam({ name: 'code', description: 'The short code to look up', example: 'aB82xK' })
  @ApiOkResponse({
    description: 'The short URL record was found.',
    type: UrlResponseDto,
  })
  @ApiNotFoundResponse({ description: 'No URL was found for the given short code.' })
  findOne(@Param('code') code: string): Promise<UrlResponseDto> {
    return this.urlsService.findByCode(code);
  }
}
