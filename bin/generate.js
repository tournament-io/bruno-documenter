#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const copydir = require('copy-dir');
const fs = require('fs');
const mkdirp = require('mkdirp');

program
  .option('-c, --config <location>', 'Location of the Bruno OpenCollection YAML (bruno.yml).')
  .option('-l, --logo <location>', 'Project logo location (48x48px PNG).')
  .option('-f, --favicon <location>', 'Project favicon location (ICO).')
  .option('-o, --output <location>', 'Where to save the file (defaults to current working directory).')
  .option('-d, --data-root <docs-root>', 'Docs root for the API documentation.', '')
  .parse(process.argv);


const { config, logo, favicon, output, dataRoot } = program;

if (!config) {
  console.log('You must provide a Bruno OpenCollection YAML file (e.g. bruno.yml).');
  process.exit(1);
}

const PACKAGE_DIST_PATH = path.resolve(__dirname, '..', 'public');
const outputPath = output ? path.resolve(process.cwd(), output) : process.cwd();
const logoPath = logo && path.resolve(process.cwd(), logo);
const faviconPath = favicon && path.resolve(process.cwd(), favicon);
const configPath = path.resolve(process.cwd(), config);

console.log('Getting files ready...');

mkdirp(outputPath, err => {
  if (err) {
    console.error(err);
    process.exit(127);
  }

  copydir.sync(PACKAGE_DIST_PATH, outputPath, {
    utimes: false,
    mode: false,
    cover: true
  });

  console.log('Adding Bruno YAML...');

  fs.copyFileSync(configPath, path.join(outputPath, 'bruno.yml'));

  if (logoPath) {
    console.log('Adding custom logo...');
    fs.copyFileSync(logoPath, path.join(outputPath, 'logo.png'));
  }

  try {
    const data = fs.readFileSync(path.join(outputPath, 'index.html'), 'utf8')
    var result = data.replace('<div id="app">', `<div id="app" data-root="${dataRoot}">`);
    fs.writeFileSync(path.join(outputPath, 'index.html'), result)
  } catch (err) {
    console.error(err)
  }

  if (faviconPath) {
    console.log('Adding custom favicon...');
    fs.copyFileSync(faviconPath, path.join(outputPath, 'favicon.ico'));

  }

  console.log('\n * * * Done! * * *\nYour documentation has been created and it\'s ready to be deployed!');

  process.exit();
});
