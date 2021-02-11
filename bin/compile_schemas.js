const fs = require('fs');
const process = require('process');
const glob = require('glob');
const path = require('path');
const parseArgs = require('minimist');
const {loadSchema, compileJSONSchemaToTs} = require('./compile_common');

main(
  parseArgs(process.argv.slice(2), {
    alias: {
      help: ['h'],
      input: ['i'],
      output: ['o'],
    },
  }),
);

function main(argv) {
  if (argv.help === true) {
    console.log('usage: -i <input-glob> -o <output_file.ts>');
  } else if (argv.input !== undefined) {
    let input_root;
    let inputs;
    const pivot = argv.input.indexOf('*');
    if (pivot !== -1) {
      // some kind of glob
      input_root = argv.input.substr(0, pivot);
      inputs = glob.sync(argv.input);
    } else {
      // file
      input_root = path.dirname(argv.input);
      inputs = [argv.input];
    }
    const schemas = inputs.map(file => ({
      inputFile: path.relative(input_root, file),
      outputFile: path.relative(path.dirname(argv.output), file),
      schema: loadSchema(file),
    }));
    compileJSONSchemaToTs({schemas, input_root}).then(ts =>
      fs.writeFileSync(argv.output, ts),
    );
  }
}
