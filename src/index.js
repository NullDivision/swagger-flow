#! /usr/bin/env node

const argv = require('yargs-parser')(process.argv.slice(2));
const join = require('path').join;
const jsonToFlow = require('json-to-flow');
const readFile = require('fs').readFile;
const http = require('http');

const getTypeValue = (type, list) => {
  if (type === 'integer') {
    return 'number';
  }

  if (list) {
    return list.map((value) => `'${value}'`).join('|');
  }

  return type;
};

const reduceEntry = (acc, [key, value]) => {
  const { properties, required = [] } = value;
  const entries = Object.entries(properties);
  const _refs = entries
    .map(([, value]) => value)
    .filter(({ $ref, items }) => $ref || (items && '$ref' in items))
    .map(({ $ref, items }) =>
      $ref ? $ref.replace('#/definitions/', '') : items.$ref.replace('#/definitions/', '')
    );

  return {
    ...acc,
    [key]: Object
      .entries(properties)
      .reduce(
        (acc, [propKey, propValue]) => {
          const { enum: list, type, ...rest } = propValue;

          return {
            ...acc,
            [propKey]: { required: required.includes(propKey), type: getTypeValue(type, list), ...rest }
          };
        },
        { _refs }
      )
  };
};

const getFlowCongifs = (entries) => entries.reduce(reduceEntry, {});

const getSchema = (definitions) => getFlowCongifs(Object.entries(definitions));

const getContent = (url) => new Promise((resolve, reject) => {
  readFile(url, (err, data) => {
    if (err) {}

    resolve(data.toString());
  });
});

console.log(getContent(argv._[0]));

readFile(argv._[0], (err, data) => {
  if (err) {
    console.log(request);
  }

  const schema = getSchema(JSON.parse(data.toString()).definitions);

  jsonToFlow(
    schema,
    {
      preTemplateFn: ({ modelSchema: { _additionalTypes, _refs, ...modelSchema }, ...data }) =>
        ({ modelSchema, refs: _refs, ...data }),
      targetPath: join(__dirname, '../tmp'),
      templatePath: string = join(__dirname, '../src/template.ejs')
    },
    () => console.log('Done')
  );
});

