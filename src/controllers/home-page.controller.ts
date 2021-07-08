import {get} from '@loopback/openapi-v3';
import {api} from '@loopback/rest';
import * as fs from 'fs';
import * as path from 'path';
import {inject} from '@loopback/context';
import {RestBindings, Response, Request} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';

@api({
  basePath: process.env.PREFIX,
  paths: {},
})
export class HomePageController {
  private index_html: string;
  private swagger_html: string;

  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(RestBindings.Http.REQUEST) private request: Request,
  ) {
    this.index_html = new Function(
      'PREFIX',
      `return \`${fs.readFileSync(
        path.join(__dirname, '../../../public/index.html'),
        'utf-8',
      )}\`;`,
    )(process.env.PREFIX);
    this.swagger_html = fs.readFileSync(
      path.join(__dirname, '../../../public/swagger.html'),
      'utf-8',
    );
  }

  @authenticate('GET.explorer')
  @get('/explorer', {
    tags: [],
    responses: {
      '302': {
        description: 'API Explorer',
      },
    },
  })
  explorer() {
    this.response
      .status(200)
      .contentType('html')
      .send(this.swagger_html);
    return this.response;
  }

  @authenticate('GET.index')
  @get('', {
    tags: [],
    responses: {
      '200': {
        description: 'Home Page',
        content: {'text/html': {schema: {type: 'string'}}},
      },
    },
  })
  homePage() {
    this.response
      .status(200)
      .contentType('html')
      .send(this.index_html);
    return this.response;
  }
}
