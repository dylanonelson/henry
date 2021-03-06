module.exports = {
  'env': {
    browser: true,
    commonjs: true,
    es6: true,
  },
  'extends': ['eslint:recommended'],
  'parser': 'babel-eslint',
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true
    },
    'ecmaVersion': 6,
    'sourceType': 'module'
  },
  'rules': {
    'no-unused-vars': [2, { 'args': 'none' }],
    'no-console': [
      1,
      {
        'allow': ['debug', 'warn', 'error']
      }
    ],
    'no-debugger': 0,
    'comma-dangle': [2, 'always-multiline'],
    'sort-keys': [2, 'asc', { caseSensitive: true }],
  }
};
