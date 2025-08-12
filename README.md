# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Backend usage/ad flow (MVP)

- POST `/api/interface/guest/init` { anon_id? } -> { anon_id, credits_remaining, is_new }
- GET `/api/interface/usage/status` (headers: X-Anon-Id) -> { credits_remaining, authenticated, ad_min_seconds, ad_bonus_credits }
- POST `/api/interface/ad/start` { anon_id? } -> { ad_session_id, ad_min_seconds }
- POST `/api/interface/ad/complete` { ad_session_id, watched_seconds } -> { awarded, credits_remaining, estimated_revenue_usd }
- POST `/api/interface/chat/create_by_id` { user_name, character_id } -> creates chat (persistent if logged-in)
- POST `/api/interface/chat/send` { chat_id, sender_id, content, anon_id? } (or header X-Anon-Id) -> consumes 1 credit; returns AI message and credits_remaining. 402 with detail.insufficient_credits when empty.

Credits
- New guest: 5 initial credits
- After signup: +10 credits bonus
- After ad 15s watch: +10 credits

Headers
- For guests, pass `X-Anon-Id: <anon_id>` on requests, or include `anon_id` in body of send.
