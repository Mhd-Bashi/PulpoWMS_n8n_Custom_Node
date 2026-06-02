import type {
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PulpoWmsApi implements ICredentialType {
	name = 'pulpoWmsApi';

	displayName = 'Pulpo WMS API';

	icon: Icon = 'file:../nodes/PulpoWms/pulpoWms.svg';

	documentationUrl = 'https://github.com/Mhd-Bashi/PulpoWMS_n8n_Custom_Node#readme';

	properties: INodeProperties[] = [
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Live', value: 'eu' },
				{ name: 'Test', value: 'eu-show' },
			],
			default: 'eu',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://{{$credentials.environment}}.pulpo.co/api/v1',
			url: '/auth',
			method: 'POST',
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
				scope: 'default',
				grant_type: 'password',
			},
		},
	};
}
