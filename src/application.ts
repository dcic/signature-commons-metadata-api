import { AuthenticationBindings, AuthenticationComponent } from '@loopback/authentication';
import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import { RepositoryMixin } from '@loopback/repository';
import { RestApplication, RestBindings } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import {
  Resource as ResourceController,
  Library as LibraryController,
  Signature as SignatureController,
  Entity as EntityController,
  Schema as SchemaController,
} from './generic-controllers';
import { AuthStrategyProvider } from './providers/auth-strategy.provider';
import { SmartTrieRouter } from './router';
import { Sequence } from './sequence';

export class App extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Add authentication
    this.component(AuthenticationComponent);
    this.bind(AuthenticationBindings.STRATEGY).toProvider(
      AuthStrategyProvider,
    );

    // Manually setup named custom generic controllers
    this.controller(ResourceController, 'Resource');
    this.controller(LibraryController, 'Library');
    this.controller(SignatureController, 'Signature');
    this.controller(EntityController, 'Entity');
    this.controller(SchemaController, 'Schema');

    // Set up custom router
    this.bind(RestBindings.ROUTER).toClass(SmartTrieRouter);

    // Set up the custom sequence
    this.sequence(Sequence);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
