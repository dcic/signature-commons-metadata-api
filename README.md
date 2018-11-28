# signature-commons-metadata-api
Signature Commons Metadata API

[![LoopBack](https://github.com/strongloop/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)

## Production

### Environment
Some environment variables should be set to get things running--this can be done with a .env file.

```bash
export POSTGRESQL=posgresql://${user}:${pass}@${host}:${port}/${db}
```

Where the ${} variables should be substituted with your own values.

### Deployment
```bash
docker build -t maayanlab/signature-commons-metadata-api:1.0.0 .
docker push maayanlab/signature-commons-metadata-api:1.0.0
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
source setup-postgresql.sh
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
