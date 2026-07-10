import js from '@eslint/js';

export default [
  {
    ...js.configs.recommended,
    files: ['lib/**/*.js', 'test/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        clearTimeout: 'readonly',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly'
      }
    }
  }
];
