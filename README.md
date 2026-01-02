# Modernized EspoCRM

A modern React frontend for [EspoCRM](https://www.espocrm.com/) - completely rewriting the legacy Backbone.js UI with React 19, TypeScript, Vite, and Tailwind CSS.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

## Overview

This project provides a modern, mobile-first React frontend that works alongside EspoCRM's PHP backend. It offers:

- **Modern UI/UX**: Clean, responsive design built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with strict typing
- **Fast Development**: Vite-powered dev server with hot module replacement
- **Component Architecture**: Modular, reusable components following React best practices
- **Dual Frontend**: Run alongside the legacy Backbone UI at `/classic` for gradual migration

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 19, TypeScript 5.9, Vite 7.2 |
| **Styling** | Tailwind CSS 3.4, Radix UI primitives |
| **State** | Zustand, TanStack React Query |
| **Forms** | React Hook Form, Zod validation |
| **Routing** | React Router DOM 6 |
| **Backend** | EspoCRM (PHP 8.3+, Slim 4) |
| **Database** | PostgreSQL 15 |
| **Proxy** | Traefik 2.10 |

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/AnshulaChowdhury/modernizedEspoCRM.git
cd modernizedEspoCRM
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings (optional for local dev)
```

### 3. Start the Application
```bash
./scripts/start.sh
```

### 4. Access the Application
- **React Frontend**: http://localhost:9000
- **Classic EspoCRM**: http://localhost:9000/classic
- **Traefik Dashboard**: http://localhost:9001

Default credentials:
- Username: `admin`
- Password: `admin123`

## Project Structure

```
modernizedEspoCRM/
├── docker-compose.yml           # Docker orchestration
├── scripts/
│   └── start.sh                 # Development startup script
├── traefik/                     # Reverse proxy configuration
│   ├── traefik.yml
│   └── dynamic.yml
└── services/espocrm/
    ├── application/             # EspoCRM PHP backend
    │   └── Espo/
    │       ├── Controllers/     # REST API endpoints
    │       ├── Entities/        # Data models
    │       ├── Services/        # Business logic
    │       └── ...
    ├── frontend-react/          # React frontend (main focus)
    │   ├── src/
    │   │   ├── api/             # API client
    │   │   ├── components/      # Reusable UI components
    │   │   ├── features/        # Feature modules
    │   │   │   ├── auth/        # Authentication
    │   │   │   ├── admin/       # Admin panel
    │   │   │   ├── dashboard/   # Dashboard
    │   │   │   └── entities/    # Generic CRUD views
    │   │   ├── fields/          # Field type components
    │   │   ├── hooks/           # Custom React hooks
    │   │   └── types/           # TypeScript definitions
    │   ├── package.json
    │   └── vite.config.ts
    └── client/                  # Legacy Backbone frontend
```

## Development

### Running Individual Services

```bash
# Start all services
docker-compose up

# Start specific services
docker-compose up espocrm react

# Rebuild after changes
docker-compose up --build
```

### React Frontend Development

```bash
cd services/espocrm/frontend-react

# Install dependencies
npm install

# Start dev server (if running outside Docker)
npm run dev

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build
```

### Backend Development

The EspoCRM backend is mounted as a volume, so changes are reflected immediately. For PHP changes:

```bash
# Clear cache
docker-compose exec espocrm php clear_cache.php

# Run unit tests
docker-compose exec espocrm vendor/bin/phpunit
```

## Architecture

### Routing (Traefik)

Traefik handles request routing:
- `/api/*` → EspoCRM PHP backend
- `/classic/*` → Legacy Backbone frontend
- `/*` → React frontend (catch-all)

### API Integration

The React frontend communicates with EspoCRM via its REST API:

```typescript
// Example: Fetch entities
const { data } = useQuery({
  queryKey: ['contacts'],
  queryFn: () => api.get('/api/v1/Contact')
});
```

### Field System

The frontend implements a dynamic field system matching EspoCRM's entity definitions:

```typescript
// Field types: text, email, phone, date, datetime, select, etc.
<FieldRenderer
  type="email"
  name="emailAddress"
  value={contact.emailAddress}
/>
```

## Features

### Implemented
- User authentication (login/logout)
- Entity list views with pagination
- Entity detail views
- Entity create/edit forms
- Admin panel with layout manager
- Dynamic field rendering
- Search and filtering

### In Progress
- Dashboard widgets
- Kanban board views
- Calendar views
- Email integration
- Activity stream

## Roadmap

### Backend Migration to Python FastAPI

We are planning to migrate the backend from EspoCRM's PHP to a modern **Python FastAPI** stack. This will provide:

- **Better Performance**: FastAPI's async capabilities for high-throughput APIs
- **Modern Python Ecosystem**: Integration with ML/AI libraries, data science tools
- **Type Safety**: Pydantic models with automatic validation and documentation
- **OpenAPI/Swagger**: Auto-generated API documentation
- **Developer Experience**: Modern tooling, better debugging, async support

The migration will be gradual, maintaining backward compatibility with the existing API structure.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

This is a derivative work building upon [EspoCRM](https://www.espocrm.com/), which is also GPL-licensed.

## Acknowledgments

- [EspoCRM](https://www.espocrm.com/) - The underlying CRM platform
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vite](https://vitejs.dev/) - Build tool
- [shadcn/ui](https://ui.shadcn.com/) - UI component inspiration
