// Mechanical coding rules from AGENTS.md, checked by `npm run lint` (and CI).
// Only rules we enforce are on; add a rule here instead of a sentence in AGENTS.md.
import tseslint from 'typescript-eslint'

export default tseslint.config({
  files: ['src/**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  rules: {
    // A ternary picks between two simple values; anything more is an if/switch in a named method.
    'no-nested-ternary': 'error',
  },
})
