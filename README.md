# MyApp - SvelteKit Application

A modern web application built with SvelteKit, TypeScript, and Tailwind CSS.

## 🚀 Features

- **SvelteKit** - Full-stack framework with SSR support
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first styling with plugins
- **Dark/Light Theme** - Theme toggle with persistent storage
- **API Client** - Built-in API integration layer with authentication
- **Authentication** - Login system with auth state management and protected routes
- **Vehicle Management** - Complete CRUD for vehicle registration and tracking
- **Searchable Select** - Custom searchable dropdown component with keyboard navigation
- **PWA Support** - Progressive Web App with offline support, installable on mobile/desktop
- **Camera Access** - Native camera integration for vehicle photos
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
│   │   ├── DashboardLayout.svelte
│   │   ├── ProtectedRoute.svelte
│   │   ├── SearchableSelect.svelte
│   │   ├── Sidebar.svelte
│   │   └── ThemeToggle.svelte
│   ├── config/       # Configuration files
│   ├── data/         # Static data (car brands, etc.)
│   ├── stores/       # Svelte stores (auth, theme)
│   └── types/        # TypeScript type definitions
├── routes/           # SvelteKit routes
│   ├── login/        # Login page
│   ├── vehicles/     # Vehicle management
│   │   ├── new/      # New vehicle form
│   │   └── [id]/     # Vehicle details
│   └── exemplo-api/  # API example page
├── app.html          # HTML template
└── app.css           # Global styles
```

## 🔐 Authentication

The app includes a complete authentication system with:
- Auth store for state management (`src/lib/stores/auth.ts`)
- Token-based API authentication
- Login page (`src/routes/login`)
- Protected routes using `ProtectedRoute` component
- Automatic redirect to login for unauthenticated users
- Persistent session with localStorage/sessionStorage

## 🌐 API Integration

API client is configured in `src/lib/api/client.ts` with support for:
- GET, POST, PUT, DELETE methods
- Automatic token handling
- Error handling
- TypeScript types

Configure your API URL in `src/lib/config/api.ts`

## 🚗 Vehicle Management

Complete CRUD system for vehicle tracking:
- List active and inactive vehicles
- Create new vehicle with searchable brand selector
- View vehicle details
- Edit vehicle information
- Soft delete (deactivate) vehicles
- Reactivate deleted vehicles
- All major Brazilian car brands included

## 🧩 Components

### SearchableSelect
Reusable searchable dropdown component with:
- Real-time search filtering
- Keyboard navigation (Arrow keys, Enter, Escape)
- Dark mode support
- Customizable options and placeholder

### ProtectedRoute
Authentication wrapper component:
- Automatically checks user authentication
- Redirects to login if not authenticated
- Shows loading state during verification
- Wraps any page that requires authentication

## 🎨 Theming

Theme toggle component with dark/light mode support:
- Persistent theme storage
- Theme store in `src/lib/stores/theme.ts`
- Toggle component in `src/lib/components/ThemeToggle.svelte`

## 📱 Progressive Web App (PWA)

The application is a fully functional PWA with the following capabilities:

### Features
- **📦 Installable**: Can be installed on mobile and desktop devices
- **🔌 Offline Support**: Works without internet connection using service worker caching
- **📸 Camera Access**: Take photos directly from the app for vehicle documentation
- **🔔 Push Notifications**: Support for push notifications (backend integration required)
- **⚡ Fast Loading**: Cached assets for instant loading
- **📲 App-like Experience**: Runs in standalone mode without browser UI

### Installation

#### On Mobile (Android/iOS)
1. Open the app in your mobile browser (Chrome, Safari, Edge)
2. Look for the "Install" or "Add to Home Screen" prompt
3. Tap "Install" or "Add"
4. The app icon will appear on your home screen
5. Open the app from your home screen for the full experience

#### On Desktop (Chrome, Edge)
1. Open the app in your browser
2. Look for the install icon (⊕) in the address bar
3. Click "Install" when prompted
4. The app will open in its own window
5. Access from your applications menu or desktop

### PWA Files

- `static/manifest.json` - PWA manifest with app metadata and icons
- `static/sw.js` - Service worker for offline caching and background sync
- `static/offline.html` - Fallback page when offline
- `static/icons/` - App icons in multiple sizes

### Camera Component

Use the `CameraCapture` component to take photos:

```svelte
<script>
  import CameraCapture from '$lib/components/CameraCapture.svelte';
  
  function handleCapture(imageData) {
    console.log('Photo captured:', imageData);
    // imageData is a base64 string
  }
</script>

<CameraCapture onCapture={handleCapture} label="Tirar Foto do Veículo" />
```

### Generating Icons

To generate PWA icons from the SVG source:

```bash
# Make the script executable
chmod +x scripts/generate-icons.sh

# Run the icon generator (requires ImageMagick or Inkscape)
./scripts/generate-icons.sh
```

Or use online tools:
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Testing PWA

1. Build for production: `npm run build`
2. Preview: `npm run preview`
3. Open DevTools → Application → Manifest
4. Verify service worker is registered
5. Test offline mode in DevTools → Network → Offline

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
