import { Controller, Get, HttpStatus, Param, Redirect } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UrlsService } from '../urls/urls.service';

@ApiTags('URLs')
@Controller()
export class RedirectController {
  constructor(private readonly urlsService: UrlsService) {}

  @Get(':code')
  @Redirect(undefined, HttpStatus.FOUND)
  @ApiOperation({
    summary: 'Redirect to the original URL',
    description:
      'Looks up the short code and, if found, responds with an HTTP 302 redirect to the original URL. This route is not prefixed with /api so that short links stay clean.',
  })
  @ApiParam({ name: 'code', description: 'The short code to redirect', example: 'aB82xK' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redirects to the original URL.',
  })
  @ApiNotFoundResponse({ description: 'No URL was found for the given short code.' })
  async redirect(@Param('code') code: string): Promise<{ url: string; statusCode: number }> {
    const originalUrl = await this.urlsService.findOriginalUrl(code);
    return { url: originalUrl, statusCode: HttpStatus.FOUND };
  }
}
