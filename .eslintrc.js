module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.dev.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
  },
  ignorePatterns: ['.eslintrc.js', 'jest.config.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-magic-numbers': 'error',
    '@typescript-eslint/return-await': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'error',
    '@typescript-eslint/method-signature-style': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/explicit-member-accessibility': 'warn',
    '@typescript-eslint/typedef': [
      'error',
      {
        'arrayDestructuring': false,
        'arrowParameter': false,
        'memberVariableDeclaration': true,
        'objectDestructuring': false,
        'parameter': false,
        'propertyDeclaration': true,
        'variableDeclaration': true,
        'variableDeclarationIgnoreFunction': false,
      },
    ],
    'no-wrap-func': true,
    'no-irregular-whitespace': 'error',
    'one-var': 'error',
    'no-invalid-this': 'error',
    'no-console': 'error',
    'require-await': 'off',
    '@typescript-eslint/require-await': 'error',
    'no-return-await': 'off',
    'no-magic-numbers': 'off',
    'prettier/prettier': 'warn',
    'comma-dangle': 'error',
    'sort-keys': 'off',
    'no-multiple-empty-lines': 'error',
    'quote-props': ['error', 'as-needed'],
    'consistent-return': 'error',
    'key-spacing': ['error', {
      'align': {
          'beforeColon': true,
          'afterColon': true,
          'on': 'colon'
      }
    }],
    'object-shorthand': 'error',
    'max-len': [2, { code: 100, ignoreUrls: true, ignorePattern: '<.*>' }]
  }
};
