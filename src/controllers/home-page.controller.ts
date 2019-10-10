import { get } from '@loopback/openapi-v3';
import { api } from '@loopback/rest';
import * as fs from 'fs';
import * as path from 'path';
import { inject } from '@loopback/context';
import { RestBindings, Response, Request } from '@loopback/rest';
import { authenticate } from '@loopback/authentication';

@api({
  basePath: process.env.PREFIX,
  paths: {},
})
export class HomePageController {
  private html: string;
  constructor(
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @inject(RestBindings.Http.REQUEST) private request: Request,
  ) {
    this.html = new Function('PREFIX', `return \`${fs.readFileSync(
      path.join(__dirname, '../../../public/index.html'),
      'utf-8',
    )}\`;`)(process.env.PREFIX)
  }

  @authenticate('GET.explorer')
  @get('/explorer', {
    tags: [],
    responses: {
      '302': {
        description: 'API Explorer'
      },
    },
  })
  explorer() {
    let protocol, hostname, pathname, port
    protocol = this.request.protocol
    if (process.env.SERVERNAME !== undefined) {
      hostname = process.env.SERVERNAME
      if (process.env.PREFIX !== undefined) {
        pathname = process.env.PREFIX
      } else {
        pathname = this.request.path.replace(/\/explorer$/, '')
      }
    } else {
      hostname = this.request.headers.host
      pathname = this.request.path.replace(/\/explorer$/, '')
    }
    this.response.redirect(
      `http://explorer.loopback.io/?url=${protocol}://${hostname}${pathname}/openapi.json`
    );
  }

  @authenticate('GET.index')
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
