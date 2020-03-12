import {
  AuthenticationBindings,
  AuthenticationMetadata,
  UserProfile as LbUserProfile,
} from '@loopback/authentication';
import {inject, Provider, ValueOrPromise} from '@loopback/context';
import {repository} from '@loopback/repository';
import {Strategy} from 'passport';
import {BasicStrategy} from 'passport-http';
import {UserProfile} from '../models';
import {UserProfileRepository} from '../repositories/user-profile.repository';

export class AuthStrategyProvider implements Provider<Strategy | undefined> {
  constructor(
    @repository(UserProfileRepository)
    public userProfileRepository: UserProfileRepository,
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata,
  ) {}

  value(): ValueOrPromise<Strategy | undefined> {
    if (!this.metadata) {
      return undefined;
    }

    return new BasicStrategy((...args) =>
      this.verify(this.metadata.strategy, ...args),
    );
  }

  verify(
    strategy: string,
    username: string,
    password: string,
    cb: (err: Error | null, user?: LbUserProfile | false) => void,
  ) {
    (async () => {
      let user;
      if (username === 'guest' && password === 'guest') {
        user = {
          id: 'guest',
          username: 'guest',
          password: 'guest',
          roles: '^(BULK|GET\\..+)$',
        } as UserProfile;
      } else {
        user = await this.userProfileRepository.findOne({
          where: {
            username: username,
            password: password,
          },
        });
      }
      return user;
    })()
      .then((user: UserProfile | null) => {
        if (user === null) {
          cb(null, false);
        } else {
          if (new RegExp(user.roles).test(strategy)) {
            cb(null, user as LbUserProfile);
          } else {
            cb(null, false);
          }
        }
      })
      .catch((e: any) => cb(e, false));
  }
}
