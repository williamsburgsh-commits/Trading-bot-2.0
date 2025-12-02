module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/lib'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts
: 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'lib/**/*.ts',
    '!src/**/*.test.ts',
    '!lib/**/*.test.ts',
    '!src/**/__tests__/**',
    '!lib/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
