import type { IDataObject, GenericValue } from 'n8n-workflow';

export const MOCK_CREDS = {
	environment: 'test',
	username: 'user@test.com',
	password: 'secret',
};

export const MOCK_NODE = {
	id: 'node-1',
	name: 'Pulpo WMS',
	type: 'pulpoWms',
	typeVersion: 1,
	position: [0, 0] as [number, number],
	parameters: {},
};

export const AUTH_RESPONSE = { access_token: 'tok-123' };

export function makeFullResponse(statusCode: number, body: unknown) {
	return { statusCode, body };
}

type StaticData = { [key: string]: IDataObject | GenericValue | GenericValue[] | IDataObject[] };

export function makeMockContext(
	httpRequestImpl: jest.Mock,
	nodeParams: Record<string, unknown> = {},
	staticData: StaticData = {},
) {
	return {
		getCredentials: jest.fn().mockResolvedValue(MOCK_CREDS),
		getNode: jest.fn().mockReturnValue(MOCK_NODE),
		helpers: {
			httpRequest: httpRequestImpl,
		},
		getNodeParameter: jest.fn((name: string) => nodeParams[name]),
		getNodeWebhookUrl: jest.fn().mockReturnValue('https://n8n.example.com/webhook/abc'),
		getWorkflowStaticData: jest.fn().mockReturnValue(staticData),
		getBodyData: jest.fn().mockReturnValue({ id: 42, state: 'queue' }),
	};
}
