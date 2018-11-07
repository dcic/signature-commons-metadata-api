import { Provider, inject, ValueOrPromise } from '@loopback/context';
import { Strategy } from 'passport';
import {
  AuthenticationBindings,
  AuthenticationMetadata,
  UserProfile,
} from '@loopback/authentication';
import { BasicStrategy } from 'passport-http';

export class AuthStrategyProvider implements Provider<Strategy | undefined> {
  constructor(
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
  ) { }

  value(): ValueOrPromise<Strategy | undefined> {
    if (!this.metadata) {
      return undefined;
    }

    return new BasicStrategy(
      (...args) => this.verify(this.metadata.strategy, ...args),
    );
  }

  verify(
    strategy: string,
    username: string,
    password: string,
    cb: (err: Error | null, user?: UserProfile | false) => void,
  ) {
    const users = [
      {
        id: 'guest',
        username: 'guest',
        password: 'guest',
        roles: /^GET\..+\.[^dbck]$/,
      }
    ]

    const possible_users = users.filter(
      (user) => username === user.username && password === user.password
    )

    if (possible_users.length >= 1 && possible_users[0].roles.test(strategy)) {
      cb(null, possible_users[0])
    } else {
      cb(null, false)
    }
  }
}
