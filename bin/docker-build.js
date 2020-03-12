const shell = require('shelljs');
const process = require('process');
const packageJson = require('../package.json');

if (
  shell.exec(`
    docker build \
      -t ${process.env.DOCKER_TAG}:${packageJson.version} \
      .
  `).code !== 0
) {
  shell.echo('Error: Docker build failed');
  shell.exit(1);
}
