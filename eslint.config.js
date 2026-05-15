import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueTs from '@vue/eslint-config-typescript'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Vue single-file components (essential + strongly-recommended, no formatting rules)
  ...pluginVue.configs['flat/strongly-recommended'],

  // Vue + TypeScript integration
  ...vueTs(),

  // Disable all formatting rules (Prettier owns that)
  prettier,

  // Project-specific quality rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      'vue/multi-word-component-names': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always'],
    }
  }
)
