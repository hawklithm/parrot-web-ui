# Parrot Web UI

Web UI for Parrot Agent system.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck
```

## Configuration

The API proxy is configured in `vite.config.ts` to forward `/api` requests to `http://localhost:3100`.

Make sure your Parrot Agent backend is running on port 3100.

## Environment Variables

Create a `.env.local` file to override defaults:

```env
VITE_API_BASE_URL=http://localhost:3100
```
