import { NodeApiError } from 'n8n-workflow';
import { pulpoFormRequest, pulpoRequest, pulpoRequestAll } from '../nodes/PulpoWms/transport/request';
import {
	AUTH_RESPONSE,
	MOCK_CREDS,
	makeFullResponse,
	makeMockContext,
} from './helpers/mockContext';

describe('pulpoRequest', () => {
	it('acquires a token then makes an authenticated GET request', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { products: [] }));

		const ctx = makeMockContext(httpRequest);
		const result = await pulpoRequest(ctx as never, 'GET', '/inventory/products');

		expect(result).toEqual({ products: [] });
		expect(httpRequest).toHaveBeenCalledTimes(2);

		const authCall = httpRequest.mock.calls[0][0];
		expect(authCall.method).toBe('POST');
		expect(authCall.url).toContain('/auth');
		expect(authCall.body).toContain(`username=${encodeURIComponent(MOCK_CREDS.username)}`);

		const dataCall = httpRequest.mock.calls[1][0];
		expect(dataCall.method).toBe('GET');
		expect(dataCall.url).toContain('/inventory/products');
		expect(dataCall.headers.Authorization).toBe('Bearer tok-123');
	});

	it('returns null on 404', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(404, null));

		const ctx = makeMockContext(httpRequest);
		const result = await pulpoRequest(ctx as never, 'GET', '/inventory/products/999');

		expect(result).toBeNull();
	});

	it('throws NodeApiError on 4xx responses', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(422, { error: 'invalid' }));

		const ctx = makeMockContext(httpRequest);
		await expect(pulpoRequest(ctx as never, 'POST', '/inventory/products', { sku: '' }))
			.rejects.toBeInstanceOf(NodeApiError);
	});

	it('throws NodeApiError when auth returns no token', async () => {
		const httpRequest = jest.fn().mockResolvedValueOnce({});
		const ctx = makeMockContext(httpRequest);
		await expect(pulpoRequest(ctx as never, 'GET', '/inventory/products'))
			.rejects.toBeInstanceOf(NodeApiError);
	});

	it('includes body only when non-empty', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, {}));

		const ctx = makeMockContext(httpRequest);
		await pulpoRequest(ctx as never, 'POST', '/endpoint', { name: 'test' });

		const dataCall = httpRequest.mock.calls[1][0];
		expect(dataCall.body).toEqual({ name: 'test' });
	});

	it('omits body when empty object passed', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, {}));

		const ctx = makeMockContext(httpRequest);
		await pulpoRequest(ctx as never, 'POST', '/endpoint', {});

		const dataCall = httpRequest.mock.calls[1][0];
		expect(dataCall.body).toBeUndefined();
	});

	it('forwards query string parameters', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, {}));

		const ctx = makeMockContext(httpRequest);
		await pulpoRequest(ctx as never, 'GET', '/endpoint', undefined, { limit: 10, offset: 0 });

		const dataCall = httpRequest.mock.calls[1][0];
		expect(dataCall.qs).toEqual({ limit: 10, offset: 0 });
	});
});

describe('pulpoRequestAll', () => {
	it('returns all records across multiple pages', async () => {
		const page1 = { products: Array.from({ length: 100 }, (_, i) => ({ id: i })), total_results: 150 };
		const page2 = { products: Array.from({ length: 50 }, (_, i) => ({ id: i + 100 })), total_results: 150 };

		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, page1))
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, page2));

		const ctx = makeMockContext(httpRequest);
		const records = await pulpoRequestAll(ctx as never, '/inventory/products', 'products');

		expect(records).toHaveLength(150);
		const secondPageCall = httpRequest.mock.calls[3][0];
		expect(secondPageCall.qs.offset).toBe(100);
	});

	it('stops after a single page when total_results <= page size', async () => {
		const page = { items: [{ id: 1 }, { id: 2 }], total_results: 2 };
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, page));

		const ctx = makeMockContext(httpRequest);
		const records = await pulpoRequestAll(ctx as never, '/endpoint', 'items');

		expect(records).toHaveLength(2);
		expect(httpRequest).toHaveBeenCalledTimes(2);
	});

	it('returns empty array when endpoint returns null', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(404, null));

		const ctx = makeMockContext(httpRequest);
		const records = await pulpoRequestAll(ctx as never, '/endpoint', 'items');

		expect(records).toEqual([]);
	});
});

describe('pulpoFormRequest', () => {
	it('sends URL-encoded form data with POST', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { ok: true }));

		const ctx = makeMockContext(httpRequest);
		const result = await pulpoFormRequest(ctx as never, '/inventory/stocks/remove', {
			product_id: 5,
			location_id: 10,
			quantity: 3,
		});

		expect(result).toEqual({ ok: true });
		const dataCall = httpRequest.mock.calls[1][0];
		expect(dataCall.method).toBe('POST');
		expect(dataCall.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
		expect(dataCall.body).toContain('product_id=5');
		expect(dataCall.body).toContain('location_id=10');
		expect(dataCall.body).toContain('quantity=3');
	});

	it('omits null and empty-string fields', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, {}));

		const ctx = makeMockContext(httpRequest);
		await pulpoFormRequest(ctx as never, '/endpoint', {
			product_id: 5,
			batch_id: null,
			note: '',
		});

		const dataCall = httpRequest.mock.calls[1][0];
		expect(dataCall.body).toContain('product_id=5');
		expect(dataCall.body).not.toContain('batch_id');
		expect(dataCall.body).not.toContain('note');
	});

	it('returns null on 404', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(404, null));

		const ctx = makeMockContext(httpRequest);
		const result = await pulpoFormRequest(ctx as never, '/endpoint', { product_id: 1 });
		expect(result).toBeNull();
	});
});
