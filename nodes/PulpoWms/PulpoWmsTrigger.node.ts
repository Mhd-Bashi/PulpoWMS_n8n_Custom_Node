import {
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

export class PulpoWmsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pulpo WMS Trigger',
		name: 'pulpoWmsTrigger',
		icon: { light: 'file:pulpoWms.svg', dark: 'file:pulpoWms.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when Pulpo WMS events occur',
		defaults: { name: 'Pulpo WMS Trigger' },
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'pulpoWmsApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Goods Receipt',
						value: 'goodsReceipt',
						description: 'Triggers when an incoming good is created',
						action: 'When a goods receipt is created',
					},
					{
						name: 'New/Updated Sales Order',
						value: 'newUpdatedSalesOrder',
						description: 'Triggers when a sales order is created or updated',
						action: 'When a sales order is created or updated',
					},
				],
				default: 'newUpdatedSalesOrder',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as IDataObject;
		return {
			workflowData: [[{ json: bodyData }]],
		};
	}
}
