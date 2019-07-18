# signature-commons-metadata-api
Signature Commons Metadata API

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Production

### Environment
Some environment variables should be set to get things running--this can be done with a .env file. See `.env.example`.

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

### ORM Management
We use `typeorm` to manage the database, see `npx typeorm` for available options. It is recommended that synchronization be managed manually.

Determine whether or not the schema needs to be updated
```bash
# show queries that would be run if we are to sync
npx typeorm schema:log

# verify they make sense before executing them with
npx typeorm schema:sync

# show migrations and status
npx typeorm migration:show

# run any pending migrations
npx typeorm migration:run

# run a query on the database
npx typeorm query 'select * from signatures limit 1;'
```

#### Migration development
```bash
# create a migration
typeorm migration:create -n migration-name
# implement it (up/down methods in the generated file)
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
