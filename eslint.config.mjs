import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ...js.configs.recommended,
    files: ['lib/**/*.js', 'test/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node
    }
  }
];
