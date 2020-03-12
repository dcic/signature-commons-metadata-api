const shell = require('shelljs');
const process = require('process');
const packageJson = require('../package.json');

if (
  shell.exec(`
    docker push \
      ${process.env.DOCKER_TAG}:${packageJson.version}
  `).code !== 0 ||
  shell.exec(`
    docker tag \
      ${process.env.DOCKER_TAG}:${packageJson.version} \
      ${process.env.DOCKER_TAG}:latest
  `).code !== 0 ||
  shell.exec(`
    docker push ${process.env.DOCKER_TAG}:latest
  `).code !== 0
) {
  shell.echo('Error: Docker deployment failed');
  shell.exit(1);
}
