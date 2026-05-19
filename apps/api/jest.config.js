/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@connectify/utils$': '<rootDir>/../../../packages/utils/src/index.ts',
    '^@connectify/types$': '<rootDir>/../../../packages/types/src/index.ts',
    '^@connectify/config$': '<rootDir>/../../../packages/config/src/index.ts',
  },
};
