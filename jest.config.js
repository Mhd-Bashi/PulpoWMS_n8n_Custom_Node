/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/__tests__/**/*.test.ts'],
	transform: {
		'^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
	},
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
