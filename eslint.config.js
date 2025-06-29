// eslint.config.js
import globals from 'globals';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import configGoogle from 'eslint-config-google';

// Mimic CommonJS variables for FlatCompat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default [
  {
    ignores: [
      'node_modules/',
      'docs/',
      'content/',
      '.prettierrc.json',
      'jsdoc.json',
      '.git/',
      '.vscode/',
      '*.md',
      'eslint.config.js',
      'package-lock.json',
      'package.json',
    ],
  },

  js.configs.recommended,
  ...compat.config(configGoogle),

  {
    files: ['**/*.js'],
    plugins: {
      jsdoc: jsdocPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      indent: 'off',
      'max-len': [
        'warn',
        {
          code: 80,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignorePattern: '^goog\\.(module|require)',
        },
      ],
      'no-console': 'off',
      'require-jsdoc': 'off', // Turn off Google's version
      'valid-jsdoc': 'off', // Turn off Google's version

      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: true,
          },
          publicOnly: false,
          contexts: [
            'MethodDefinition[kind="method"]',
            'FunctionDeclaration',
            'ClassDeclaration',
            'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]',
            'ExportNamedDeclaration[declaration.type="ClassDeclaration"]',
          ],
          enableFixer: false,
        },
      ],
      'jsdoc/check-types': 'warn',
      'jsdoc/check-tag-names': [
        'warn',
        {
          definedTags: ['final', 'abstract', 'virtual', 'override', 'package'],
        },
      ],
      'jsdoc/check-param-names': [
        'warn',
        { checkDestructured: false, enableFixer: false },
      ],
      'jsdoc/require-param': [
        'warn',
        {
          checkDestructured: false,
          checkRestProperty: true,
          enableFixer: false,
        },
      ],
      'jsdoc/require-param-name': 'warn',
      'jsdoc/require-param-type': 'warn',
      'jsdoc/require-param-description': 'warn',
      'jsdoc/require-returns': [
        'warn',
        { checkGetters: false, enableFixer: false },
      ],
      'jsdoc/require-returns-type': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/no-undefined-types': ['warn', { disableReporting: true }],
      'jsdoc/require-hyphen-before-param-description': ['warn', 'never'],
      'jsdoc/tag-lines': ['warn', 'never', { applyToEndTag: false }],
      'jsdoc/check-alignment': 'warn',
      // 'jsdoc/check-indentation': 'warn', // Often conflicts with Prettier, keep commented

      semi: ['error', 'always'],
      quotes: [
        'warn',
        'single',
        { avoidEscape: true, allowTemplateLiterals: true },
      ],
      'comma-dangle': 'off', // Let Prettier handle this
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
      'space-infix-ops': 'warn',
      curly: ['warn', 'all'],
      'no-var': 'error',
      'prefer-const': ['warn', { destructuring: 'all' }],
      eqeqeq: ['warn', 'always', { null: 'ignore' }],
      'one-var': ['warn', 'never'],
      'padded-blocks': ['warn', 'never'],
      'space-before-blocks': 'warn',
      'space-before-function-paren': [
        'warn',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      'keyword-spacing': ['warn', { before: true, after: true }],
      'space-in-parens': ['warn', 'never'],
      'no-trailing-spaces': 'warn',
    },
  },
];
