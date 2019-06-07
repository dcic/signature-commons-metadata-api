# signature-commons-metadata-api
Signature Commons Metadata API

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Production

### Environment
Some environment variables should be set to get things running--this can be done with a .env file.

```env
ADMIN_USERNAME=signaturestore
ADMIN_PASSWORD=signaturestore
POSTGRES_DB=signaturestore
POSTGRES_TEST_DB=test
POSTGRES_USER=signaturestore
POSTGRES_PASSWORD=signaturestore
TYPEORM_CONNECTION=postgres
TYPEORM_URL=postgres://signaturestore:signaturestore@localhost:5432/signaturestore
TYPEORM_TEST_URL=postgres://signaturestore:signaturestore@localhost:5432/signaturestore_test
TYPEORM_SYNCHRONIZE=false
TYPEORM_LOGGING=true
TYPEORM_ENTITIES=dist/src/entities/*.js
TYPEORM_ENTITIES_DIR=src/entities
TYPEORM_MIGRATIONS=dist/src/migration/*.js
TYPEORM_MIGRATIONS_DIR=src/migration
TYPEORM_SUBSCRIBERS=dist/src/subscriber/*.js
TYPEORM_SUBSCRIBERS_DIR=src/subscriber
```

### Deployment
```bash
docker-compose build meta-api
docker-compose push meta-api
```

## Development

### Setup
```bash
# Install development environment
npm install
```

### Running
```
npm start
```

### Testing
Docker is required for testing with a true postgresql database. The following
 command will setup a postgresql database for testing.
```bash
docker-compose up -d meta-db
```

This command will perform the tests, it will use `POSTGRESQL_TEST_URL` if defined
 (is is after the above command), else it will fallback to a memory db replacement.
```bash
npm test
```

### VSCode setup

We use Visual Studio Code for developing LoopBack and recommend the same to our
users.

Install the following extensions:

 - [tslint](https://marketplace.visualstudio.com/items?itemName=eg2.tslint)
 - [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Development workflow

#### Visual Studio Code

1. Start the build task (Cmd+Shift+B) to run TypeScript compiler in the
   background, watching and recompiling files as you change them. Compilation
   errors will be shown in the VSCode's "PROBLEMS" window.

2. Execute "Run Rest Task" from the Command Palette (Cmd+Shift+P) to re-run the
   test suite and lint the code for both programming and style errors. Linting
   errors will be shown in VSCode's "PROBLEMS" window. Failed tests are printed
   to terminal output only.

#### Other editors/IDEs

1. Open a new terminal window/tab and start the continous build process via
   `npm run build:watch`. It will run TypeScript compiler in watch mode,
   recompiling files as you change them. Any compilation errors will be printed
   to the terminal.

2. In your main terminal window/tab, run `npm run test:dev` to re-run the test
   suite and lint the code for both programming and style errors. You should run
   this command manually whenever you have new changes to test. Test failures
   and linter errors will be printed to the terminal.
