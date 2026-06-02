import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
	IN8nHttpFullResponse,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export type PulpoContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IHookFunctions
	| IWebhookFunctions;

const PAGE_SIZE = 100;

async function acquireToken(context: PulpoContext): Promise<string> {
	const credentials = await context.getCredentials('pulpoWmsApi');
	const baseUrl = `https://${credentials.environment as string}.pulpo.co/api/v1`;

	const response = await context.helpers.httpRequest({
		method: 'POST',
		url: `${baseUrl}/auth`,
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			username: credentials.username as string,
			password: credentials.password as string,
			scope: 'default',
			grant_type: 'password',
		}).toString(),
	});

	const token = (response as IDataObject).access_token as string | undefined;
	if (!token) {
		throw new NodeApiError(context.getNode(), {
			message: 'Pulpo WMS authentication failed: no access token returned',
		} as JsonObject);
	}
	return token;
}

export async function pulpoRequest(
	context: PulpoContext,
	method: IHttpRequestOptions['method'],
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
): Promise<IDataObject | null> {
	const credentials = await context.getCredentials('pulpoWmsApi');
	const baseUrl = `https://${credentials.environment as string}.pulpo.co/api/v1`;
	const token = await acquireToken(context);

	const hasBody = body !== undefined && Object.keys(body).length > 0;

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			...(hasBody ? {} : {}),
		},
		...(qs && Object.keys(qs).length > 0 ? { qs } : {}),
		...(hasBody ? { body } : {}),
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	let response: IN8nHttpFullResponse;
	try {
		response = (await context.helpers.httpRequest(options)) as IN8nHttpFullResponse;
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}

	if (response.statusCode === 404) {
		return null;
	}

	if (response.statusCode >= 400) {
		throw new NodeApiError(context.getNode(), response.body as JsonObject, {
			httpCode: String(response.statusCode),
		});
	}

	return response.body as IDataObject;
}

export async function pulpoFormRequest(
	context: PulpoContext,
	endpoint: string,
	formFields: IDataObject,
): Promise<IDataObject | null> {
	const credentials = await context.getCredentials('pulpoWmsApi');
	const baseUrl = `https://${credentials.environment as string}.pulpo.co/api/v1`;
	const token = await acquireToken(context);

	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(formFields)) {
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, String(value));
		}
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	let response: IN8nHttpFullResponse;
	try {
		response = (await context.helpers.httpRequest(options)) as IN8nHttpFullResponse;
	} catch (error) {
		throw new NodeApiError(context.getNode(), error as JsonObject);
	}

	if (response.statusCode === 404) {
		return null;
	}

	if (response.statusCode >= 400) {
		throw new NodeApiError(context.getNode(), response.body as JsonObject, {
			httpCode: String(response.statusCode),
		});
	}

	return response.body as IDataObject;
}

export async function pulpoRequestAll(
	context: PulpoContext,
	endpoint: string,
	resultKey: string,
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const records: IDataObject[] = [];
	let offset = 0;

	while (true) {
		const result = await pulpoRequest(context, 'GET', endpoint, undefined, {
			...qs,
			limit: PAGE_SIZE,
			offset,
		});

		if (!result) break;

		const batch = (result[resultKey] as IDataObject[]) ?? [];
		records.push(...batch);

		const totalResults = (result.total_results as number) ?? 0;
		offset += PAGE_SIZE;

		if (records.length >= totalResults || batch.length < PAGE_SIZE) break;
	}

	return records;
}
