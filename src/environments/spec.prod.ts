// Hack to set host and schemes for generated code
// TODO: Configure apigen properly so that this can be removed

const spec: api.OpenApiSpec = {
	host: 'apps.odysseuslarp.dev',
	schemes: ['https'],
	basePath: '',
	contentTypes: [],
	accepts: ['application/json'],
	securityDefinitions: {},
};
export default spec;
