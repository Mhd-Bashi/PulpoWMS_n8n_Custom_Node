import {
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type ILoadOptionsFunctions,
	type INodePropertyOptions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { pulpoRequest, pulpoRequestAll } from './transport/request';

const EVENT_ALLOWED_TYPES: Record<string, string[]> = {
	goodsReceipt: ['incoming_good_created'],
	newUpdatedSalesOrder: ['sales_order_created', 'sales_order_updated'],
};

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
			{
				displayName: 'Warehouse Name or ID',
				name: 'warehouseId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWarehouses' },
				required: true,
				default: '',
				description: 'Only receive events from this warehouse. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getWarehouses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const records = await pulpoRequestAll(this, '/warehouses/', 'warehouses');
				return records.map((w) => ({
					name: (w.name as string) || `Warehouse ${w.id as number}`,
					value: w.id as number,
				}));
			},
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const nodeStaticData = this.getWorkflowStaticData('node');
				const webhookId = nodeStaticData.webhookId as string | undefined;

				if (webhookId) {
					const result = await pulpoRequest(this, 'GET', `/webhook/${webhookId}`);
					if (result) return true;
					delete nodeStaticData.webhookId;
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const warehouseId = this.getNodeParameter('warehouseId') as number;
				const nodeStaticData = this.getWorkflowStaticData('node');

				const body: IDataObject = {
					url: webhookUrl,
					allowed_types: EVENT_ALLOWED_TYPES[event] ?? [],
					enabled: true,
					method: 'POST',
					warehouse_id: warehouseId,
				};

				const result = await pulpoRequest(this, 'POST', '/webhook/', body);
				if (!result) return false;

				const webhooks = result.webhooks as IDataObject[] | undefined;
				const webhook = webhooks?.[0] ?? result;
				nodeStaticData.webhookId = webhook.id as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const nodeStaticData = this.getWorkflowStaticData('node');
				const webhookId = nodeStaticData.webhookId as string | undefined;
				if (!webhookId) return true;

				await pulpoRequest(this, 'DELETE', `/webhook/${webhookId}`);
				delete nodeStaticData.webhookId;
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
