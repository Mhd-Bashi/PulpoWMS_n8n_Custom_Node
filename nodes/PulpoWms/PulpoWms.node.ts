import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';
import { productOperations, productFields } from './descriptions/product';
import { purchaseOrderOperations, purchaseOrderFields } from './descriptions/purchaseOrder';
import { salesOrderOperations, salesOrderFields } from './descriptions/salesOrder';
import { thirdPartyOperations, thirdPartyFields } from './descriptions/thirdParty';
import { pulpoRequest, pulpoRequestAll } from './transport/request';

export class PulpoWms implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pulpo WMS',
		name: 'pulpoWms',
		icon: { light: 'file:pulpoWms.svg', dark: 'file:pulpoWms.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Pulpo WMS API',
		defaults: { name: 'Pulpo WMS' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'pulpoWmsApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Incoming Good', value: 'incomingGood' },
					{ name: 'Inventory Stock', value: 'inventoryStock' },
					{ name: 'Product', value: 'product' },
					{ name: 'Purchase Order', value: 'purchaseOrder' },
					{ name: 'Sales Order', value: 'salesOrder' },
					{ name: 'Sales Order Fulfillment', value: 'salesOrderFulfillment' },
					{ name: 'Third Party', value: 'thirdParty' },
				],
				default: 'salesOrder',
			},
			...productOperations,
			...productFields,
			...purchaseOrderOperations,
			...purchaseOrderFields,
			...salesOrderOperations,
			...salesOrderFields,
			...thirdPartyOperations,
			...thirdPartyFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'product') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (returnAll) {
							const products = await pulpoRequestAll(this, '/inventory/products', 'products', qs);
							returnData.push(...products.map((item) => ({ json: item, pairedItem: { item: i } })));
						} else {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							const offset = this.getNodeParameter('offset', i, 0) as number;
							const result = await pulpoRequest(this, 'GET', '/inventory/products', undefined, {
								...qs,
								limit,
								offset,
							});
							const products = (result?.products as IDataObject[]) ?? [];
							returnData.push(...products.map((item) => ({ json: item, pairedItem: { item: i } })));
						}
					} else if (operation === 'get') {
						const productId = this.getNodeParameter('productId', i) as number;
						const result = await pulpoRequest(this, 'GET', `/inventory/products/${productId}`);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'create') {
						const sku = this.getNodeParameter('sku', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const body: IDataObject = { sku, name, ...additionalFields };
						const result = await pulpoRequest(this, 'POST', '/inventory/products', body);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'update') {
						const productId = this.getNodeParameter('productId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const result = await pulpoRequest(this, 'PUT', `/inventory/products/${productId}`, updateFields);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: "${operation}"`, { itemIndex: i });
					}
				} else if (resource === 'purchaseOrder') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (returnAll) {
							const records = await pulpoRequestAll(this, '/reception/purchase_orders', 'purchase_orders', qs);
							returnData.push(...records.map((item) => ({ json: item, pairedItem: { item: i } })));
						} else {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							const offset = this.getNodeParameter('offset', i, 0) as number;
							const result = await pulpoRequest(this, 'GET', '/reception/purchase_orders', undefined, {
								...qs,
								limit,
								offset,
							});
							const records = (result?.purchase_orders as IDataObject[]) ?? [];
							returnData.push(...records.map((item) => ({ json: item, pairedItem: { item: i } })));
						}
					} else if (operation === 'get') {
						const purchaseOrderId = this.getNodeParameter('purchaseOrderId', i) as number;
						const result = await pulpoRequest(this, 'GET', `/reception/purchase_orders/${purchaseOrderId}`);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'create') {
						const orderNum = this.getNodeParameter('orderNum', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const body: IDataObject = { order_num: orderNum, ...additionalFields };
						const result = await pulpoRequest(this, 'POST', '/reception/purchase_orders', body);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'update') {
						const purchaseOrderId = this.getNodeParameter('purchaseOrderId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const result = await pulpoRequest(this, 'PUT', `/reception/purchase_orders/${purchaseOrderId}`, updateFields);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: "${operation}"`, { itemIndex: i });
					}
				} else if (resource === 'salesOrder') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (returnAll) {
							const records = await pulpoRequestAll(this, '/sales/orders', 'sales_orders', qs);
							returnData.push(...records.map((item) => ({ json: item, pairedItem: { item: i } })));
						} else {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							const offset = this.getNodeParameter('offset', i, 0) as number;
							const result = await pulpoRequest(this, 'GET', '/sales/orders', undefined, {
								...qs,
								limit,
								offset,
							});
							const records = (result?.sales_orders as IDataObject[]) ?? [];
							returnData.push(...records.map((item) => ({ json: item, pairedItem: { item: i } })));
						}
					} else if (operation === 'get') {
						const salesOrderId = this.getNodeParameter('salesOrderId', i) as number;
						const result = await pulpoRequest(this, 'GET', `/sales/orders/${salesOrderId}`);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'create') {
						const orderNum = this.getNodeParameter('orderNum', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const body: IDataObject = { order_num: orderNum, ...additionalFields };
						const result = await pulpoRequest(this, 'POST', '/sales/orders', body);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'update') {
						const salesOrderId = this.getNodeParameter('salesOrderId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const result = await pulpoRequest(this, 'PUT', `/sales/orders/${salesOrderId}`, updateFields);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: "${operation}"`, { itemIndex: i });
					}
				} else if (resource === 'thirdParty') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (returnAll) {
							const records = await pulpoRequestAll(this, '/iam/third_parties', 'third_parties', qs);
							returnData.push(...records.map((item) => ({ json: item, pairedItem: { item: i } })));
						} else {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							const offset = this.getNodeParameter('offset', i, 0) as number;
							const result = await pulpoRequest(this, 'GET', '/iam/third_parties', undefined, {
								...qs,
								limit,
								offset,
							});
							const records = (result?.third_parties as IDataObject[]) ?? [];
							returnData.push(...records.map((item) => ({ json: item, pairedItem: { item: i } })));
						}
					} else if (operation === 'get') {
						const thirdPartyId = this.getNodeParameter('thirdPartyId', i) as number;
						const result = await pulpoRequest(this, 'GET', `/iam/third_parties/${thirdPartyId}`);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'create') {
						const name = this.getNodeParameter('name', i) as string;
						const identifierType = this.getNodeParameter('identifierType', i) as string;
						const identifierNumber = this.getNodeParameter('identifierNumber', i) as string;
						const thirdType = this.getNodeParameter('thirdType', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						const body: IDataObject = {
							name,
							identifier_type: identifierType,
							identifier_number: identifierNumber,
							third_type: thirdType,
							...additionalFields,
						};
						const result = await pulpoRequest(this, 'POST', '/iam/third_parties', body);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else if (operation === 'update') {
						const thirdPartyId = this.getNodeParameter('thirdPartyId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const result = await pulpoRequest(this, 'PUT', `/iam/third_parties/${thirdPartyId}`, updateFields);
						if (result) {
							returnData.push({ json: result, pairedItem: { item: i } });
						}
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: "${operation}"`, { itemIndex: i });
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`Resource "${resource}" is not yet implemented.`,
						{ itemIndex: i },
					);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
