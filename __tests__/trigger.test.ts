import { PulpoWmsTrigger } from '../nodes/PulpoWms/PulpoWmsTrigger.node';
import { AUTH_RESPONSE, makeFullResponse, makeMockContext } from './helpers/mockContext';

const trigger = new PulpoWmsTrigger();
const { default: webhookMethods } = trigger.webhookMethods;

describe('webhookMethods.checkExists', () => {
	it('returns false when no webhookId in static data', async () => {
		const httpRequest = jest.fn();
		const ctx = makeMockContext(httpRequest, {}, {});

		const result = await webhookMethods.checkExists.call(ctx as never);
		expect(result).toBe(false);
		expect(httpRequest).not.toHaveBeenCalled();
	});

	it('returns true when stored webhook is found in Pulpo', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { id: 'wh-42', url: 'https://n8n.example.com/webhook/abc' }));

		const staticData = { webhookId: 'wh-42' };
		const ctx = makeMockContext(httpRequest, {}, staticData);

		const result = await webhookMethods.checkExists.call(ctx as never);
		expect(result).toBe(true);
		const call = httpRequest.mock.calls[1][0];
		expect(call.url).toContain('/webhook/wh-42');
	});

	it('returns false and clears stale ID when Pulpo returns 404', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(404, null));

		const staticData: { [k: string]: string | string[] | undefined } = { webhookId: 'wh-stale' };
		const ctx = makeMockContext(httpRequest, {}, staticData);

		const result = await webhookMethods.checkExists.call(ctx as never);
		expect(result).toBe(false);
		expect(staticData.webhookId).toBeUndefined();
	});
});

describe('webhookMethods.create', () => {
	it('registers a goods-receipt webhook and stores the ID', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { webhooks: [{ id: 'wh-new' }] }));

		const staticData: { [k: string]: string | string[] | undefined } = {};
		const ctx = makeMockContext(
			httpRequest,
			{ event: 'goodsReceipt', warehouseId: 3 },
			staticData,
		);

		const result = await webhookMethods.create.call(ctx as never);
		expect(result).toBe(true);
		expect(staticData.webhookId).toBe('wh-new');

		const body = httpRequest.mock.calls[1][0].body;
		expect(body.allowed_types).toEqual(['incoming_good_created']);
		expect(body.warehouse_id).toBe(3);
		expect(body.url).toBe('https://n8n.example.com/webhook/abc');
		expect(body.method).toBe('POST');
	});

	it('registers a sales-order webhook with correct allowed_types', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { webhooks: [{ id: 'wh-so' }] }));

		const staticData: { [k: string]: string | string[] | undefined } = {};
		const ctx = makeMockContext(
			httpRequest,
			{ event: 'newUpdatedSalesOrder', warehouseId: 1 },
			staticData,
		);

		await webhookMethods.create.call(ctx as never);
		const body = httpRequest.mock.calls[1][0].body;
		expect(body.allowed_types).toEqual(['sales_order_created', 'sales_order_updated']);
	});

	it('returns false when Pulpo returns null', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(404, null));

		const ctx = makeMockContext(httpRequest, { event: 'goodsReceipt', warehouseId: 1 }, {});
		const result = await webhookMethods.create.call(ctx as never);
		expect(result).toBe(false);
	});
});

describe('webhookMethods.delete', () => {
	it('calls DELETE on the stored webhook ID and clears it', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, {}));

		const staticData: { [k: string]: string | string[] | undefined } = { webhookId: 'wh-del' };
		const ctx = makeMockContext(httpRequest, {}, staticData);

		const result = await webhookMethods.delete.call(ctx as never);
		expect(result).toBe(true);
		expect(staticData.webhookId).toBeUndefined();

		const call = httpRequest.mock.calls[1][0];
		expect(call.url).toContain('/webhook/wh-del');
		expect(call.method).toBe('DELETE');
	});

	it('returns true immediately when no webhookId stored', async () => {
		const httpRequest = jest.fn();
		const ctx = makeMockContext(httpRequest, {}, {});

		const result = await webhookMethods.delete.call(ctx as never);
		expect(result).toBe(true);
		expect(httpRequest).not.toHaveBeenCalled();
	});
});

describe('webhook handler', () => {
	it('passes body data through as workflow data', async () => {
		const httpRequest = jest.fn();
		const ctx = makeMockContext(httpRequest);

		const result = await trigger.webhook.call(ctx as never);
		expect(result.workflowData).toEqual([[{ json: { id: 42, state: 'queue' } }]]);
	});
});
