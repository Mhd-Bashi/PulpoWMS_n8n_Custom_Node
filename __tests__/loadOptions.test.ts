import { PulpoWms } from '../nodes/PulpoWms/PulpoWms.node';
import { AUTH_RESPONSE, makeFullResponse, makeMockContext } from './helpers/mockContext';

const node = new PulpoWms();

describe('loadOptions.getWarehouses', () => {
	it('returns warehouses mapped to {name, value}', async () => {
		const warehouses = [
			{ id: 1, name: 'Main Warehouse' },
			{ id: 2, name: 'Secondary Depot' },
		];
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { warehouses, total_results: 2 }));

		const ctx = makeMockContext(httpRequest);
		const result = await node.methods.loadOptions.getWarehouses.call(ctx as never);

		expect(result).toEqual([
			{ name: 'Main Warehouse', value: 1 },
			{ name: 'Secondary Depot', value: 2 },
		]);
	});

	it('falls back to "Warehouse {id}" when name is missing', async () => {
		const warehouses = [{ id: 7 }];
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { warehouses, total_results: 1 }));

		const ctx = makeMockContext(httpRequest);
		const result = await node.methods.loadOptions.getWarehouses.call(ctx as never);

		expect(result).toEqual([{ name: 'Warehouse 7', value: 7 }]);
	});

	it('returns empty array when no warehouses exist', async () => {
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { warehouses: [], total_results: 0 }));

		const ctx = makeMockContext(httpRequest);
		const result = await node.methods.loadOptions.getWarehouses.call(ctx as never);

		expect(result).toEqual([]);
	});
});

describe('loadOptions.getLocations', () => {
	it('returns locations mapped to {name, value} using code as name', async () => {
		const locations = [
			{ id: 10, code: 'A-01-01' },
			{ id: 11, code: 'A-01-02' },
		];
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { locations, total_results: 2 }));

		const ctx = makeMockContext(httpRequest);
		const result = await node.methods.loadOptions.getLocations.call(ctx as never);

		expect(result).toEqual([
			{ name: 'A-01-01', value: 10 },
			{ name: 'A-01-02', value: 11 },
		]);
	});

	it('falls back to "Location {id}" when code is missing', async () => {
		const locations = [{ id: 99 }];
		const httpRequest = jest.fn()
			.mockResolvedValueOnce(AUTH_RESPONSE)
			.mockResolvedValueOnce(makeFullResponse(200, { locations, total_results: 1 }));

		const ctx = makeMockContext(httpRequest);
		const result = await node.methods.loadOptions.getLocations.call(ctx as never);

		expect(result).toEqual([{ name: 'Location 99', value: 99 }]);
	});
});
