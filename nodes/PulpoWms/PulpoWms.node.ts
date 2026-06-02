import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type JsonObject,
} from 'n8n-workflow';

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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;

				switch (resource) {
					case 'incomingGood':
					case 'inventoryStock':
					case 'product':
					case 'purchaseOrder':
					case 'salesOrder':
					case 'salesOrderFulfillment':
					case 'thirdParty':
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown resource: "${resource}"`,
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
