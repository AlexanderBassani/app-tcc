# MyApp - SvelteKit Application

A modern web application built with SvelteKit, TypeScript, and Tailwind CSS.

## 🚀 Features

- **SvelteKit** - Full-stack framework with SSR support
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first styling with plugins
- **Dark/Light Theme** - Theme toggle with persistent storage
- **API Client** - Built-in API integration layer with authentication
- **Authentication** - Login system with auth state management
- **Testing** - Unit tests (Vitest) and E2E tests (Playwright)
- **Linting & Formatting** - ESLint and Prettier configured

## 📦 Tech Stack

- [SvelteKit](https://kit.svelte.dev/) - Web framework
- [Svelte 5](https://svelte.dev/) - UI library with runes
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS v4](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Unit testing
- [Playwright](https://playwright.dev/) - E2E testing

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, pnpm, or yarn

### Installation

```sh
# Install dependencies
npm install
```

### Development

```sh
# Start development server
npm run dev

# Start with browser auto-open
npm run dev -- --open
```

The app will be available at `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type-check with svelte-check
- `npm run check:watch` - Type-check in watch mode
- `npm run lint` - Run linting
- `npm run format` - Format code with Prettier
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── api/          # API client utilities
│   ├── components/   # Reusable components
│   ├── config/       # Configuration files
│   └── stores/       # Svelte stores (auth, theme)
├── routes/           # SvelteKit routes
│   ├── login/        # Login page
│   └── exemplo-api/  # API example page
├── app.html          # HTML template
└── app.css           # Global styles
```

## 🔐 Authentication

The app includes an authentication system with:
- Auth store for state management (`src/lib/stores/auth.ts`)
- Token-based API authentication
- Login page (`src/routes/login`)

## 🌐 API Integration

API client is configured in `src/lib/api/client.ts` with support for:
- GET, POST, PUT, DELETE methods
- Automatic token handling
- Error handling
- TypeScript types

Configure your API URL in `src/lib/config/api.ts`

## 🎨 Theming

Theme toggle component with dark/light mode support:
- Persistent theme storage
- Theme store in `src/lib/stores/theme.ts`
- Toggle component in `src/lib/components/ThemeToggle.svelte`

## 🧪 Testing

### Unit Tests
```sh
npm run test:unit
```

### E2E Tests
```sh
npm run test:e2e
```

## 🚢 Deployment

```sh
# Build for production
npm run build

# Preview production build
npm run preview
```

You may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target deployment environment.

## 📄 License

Private project

## 🎓 Academic Project

This is a TCC (Trabalho de Conclusão de Curso) project for PUC.
