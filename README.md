# House Rental Management Frontend

A modern React frontend for the House Rental Management System, built with Vite, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI** - Clean, professional design with Tailwind CSS
- 🔐 **Authentication** - Secure login with JWT tokens
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- ⚡ **Fast** - Built with Vite for lightning-fast development
- 🛡️ **Type Safe** - Full TypeScript support
- 🎯 **User Friendly** - Intuitive interface for property management

## Tech Stack

- **React 19** - Latest React with hooks
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form handling and validation
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Default Login

- **Email/Phone**: admin@example.com
- **Password**: admin123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (Sidebar, Header)
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx
│   └── Login.tsx
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## Features Overview

### Dashboard
- Overview statistics (properties, tenants, leases, maintenance)
- Recent activity feed
- Quick access to urgent items
- Revenue and occupancy metrics

### Authentication
- Secure login with JWT tokens
- Automatic token refresh
- Protected routes
- User session management

### Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interface
- Optimized for all screen sizes

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api` and includes:

- Automatic token handling
- Request/response interceptors
- Error handling
- Loading states

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Update the sidebar navigation in `src/components/Layout/Sidebar.tsx`

### Styling

The project uses Tailwind CSS with custom components. Check `src/index.css` for custom styles and `tailwind.config.js` for theme configuration.

### API Calls

Use the `apiService` from `src/services/api.ts` for all API calls. It handles authentication and error handling automatically.

## Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new files
3. Add proper error handling
4. Test on multiple screen sizes
5. Update documentation as needed