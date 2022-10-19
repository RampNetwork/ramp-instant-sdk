module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  transform: {
    ".(ts|tsx)": "ts-jest"
  },
  testEnvironment: "node",
  testRegex: "(/test/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js"
  ]
};
