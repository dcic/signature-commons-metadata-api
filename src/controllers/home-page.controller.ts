import { get } from '@loopback/openapi-v3';
import { api } from '@loopback/rest';
import * as fs from 'fs';
import * as path from 'path';
import { inject } from '@loopback/context';
import { RestBindings, Response } from '@loopback/rest';

@api({
  basePath: '/signature-commons-metadata-api',
  paths: {},
})
export class HomePageController {
  private html: string;
  constructor(@inject(RestBindings.Http.RESPONSE) private response: Response) {
    this.html = fs.readFileSync(
      path.join(__dirname, '../../../public/index.html'),
      'utf-8',
    );
  }

  @get('/explorer', {
    tags: [],
    responses: {
      '302': {
        description: 'API Explorer'
      },
    },
  })
  explorer() {
    return this.response.redirect('http://explorer.loopback.io/?url=http://amp.pharm.mssm.edu/signature-commons-metadata-api/openapi.json');
  }

  @get('', {
    tags: [],
    responses: {
      '200': {
        description: 'Home Page',
        content: { 'text/html': { schema: { type: 'string' } } },
      },
    },
  })
  homePage() {
    this.response
      .status(200)
      .contentType('html')
      .send(this.html);
    return this.response;
  }
}
