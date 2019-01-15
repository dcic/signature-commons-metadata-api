import { AuthenticateFn, AuthenticationBindings } from '@loopback/authentication';
import { inject } from '@loopback/context';
import { FindRoute, InvokeMethod, ParseParams, Reject, RequestContext, RestBindings, Send, SequenceHandler, StaticAssetsRoute } from '@loopback/rest';

const SequenceActions = RestBindings.SequenceActions;

export class Sequence implements SequenceHandler {
  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.AUTH_ACTION) protected authenticateRequest: AuthenticateFn,
  ) { }

  async handle(context: RequestContext) {
    try {
      const start = Date.now()
      const { request, response } = context;
      const route = this.findRoute(request);
      request.setTimeout(0, () => { });

      // Hotfix from https://github.com/strongloop/loopback-next/issues/1144#issuecomment-438359985
      if (!(route instanceof StaticAssetsRoute)) {
        if (request.headers === undefined) {
          request.headers = {}
        }
        if (request.headers.authorization === undefined) {
          request.headers.authorization = 'Basic ' + Buffer.from(
            'guest:guest'
          ).toString('base64')
        }

        await this.authenticateRequest(request);
      }

      const args = await this.parseParams(request, route);
      const result = await this.invoke(route, args);

      // Don't throw errors when we can't do this because we don't care
      try {
        response.setHeader('X-Duration', JSON.stringify(Number(Date.now() - start) / 1000));
      } catch (e) { }

      this.send(response, result);
    } catch (err) {
      this.reject(context, err);
    }
  }
}
