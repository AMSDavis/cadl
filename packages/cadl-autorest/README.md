# Cadl AutoRest Library

This is a Cadl emitter library that will emit an enriched OpenAPI 2.0 specificiation that can be consumed by AutoRest.
The generated OpenAPI spec will have custom `x-ms-` extensions properties and conform to standards required by  AutoRest to generate a more accurate SDK.

## Getting started

1. Include `@azure-tools/cadl-autorest` dependencies in package.json

```json
{
  ...
  "dependencies": {
    ...
    "@azure-tools/cadl-autorest": "latest"
  }
}
```

2. Run `npm install` to install the dependency
3. Import `@azure-tools/cadl-autorest` in your `main.cadl` file

```cadl
import "@azure-tools/cadl-autorest";
```

4. Run `cadl compile`. This will result in a `swagger.json` file crated in `./cadl-output/swagger.json`

## Use in autorest

### Manually

Generate the OpenAPI spec as shown above then run autorest cli directly on it.

### Via Autorest

AutoRest provide a plugin that will directly take Cadl as input. Make sure to use `Autorest Core >=3.6.0`

```bash
autorest --cadl --input-file=./main.cadl
```

## Configuration

### Output path

Sepcify the `--output-path` option:

```bash
cadl compile --output-path=`./custom`
```

