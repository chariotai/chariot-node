# Uses openapi-generator to generate the SDK from the OpenAPI spec using our custom template overrides
# After generating new version, update version in package.json and npm run build && npm publish
openapi-generator generate -i http://localhost/openapi-generator.yaml -g typescript-axios -o . -p supportsES6=true -t ./sdk-template-overrides/typescript-axios

# Use this command to get all templates for the typescript-axios generator
# openapi-generator author template -g typescript-axios