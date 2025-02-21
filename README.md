# Blockchain Demo App

A simple blockchain demo with a Rust backend written using the Actix web framework and Next.js frontend.

## Prerequisites

- Rust (latest stable)
- Cargo (latest stable)
- Node.js
- npm or yarn
- Docker (for deployment)

## Setup & Running

### Backend (Rust)

```bash
# Local development
cargo run

# Build Docker image
docker build -t blockchain-demo .

# Run Docker container
docker run -p 8080:8080 blockchain-demo
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

The application can be configured using the following environment variables:

```bash
# Server configuration
PORT=8080        # Port number for the server
HOST=0.0.0.0     # Host address to bind to
```

### Local Development

Create a `.env` file in the root directory:

```bash
PORT=8080
HOST=127.0.0.1
```

### Railway Deployment

Set the following variables in Railway dashboard:
- `PORT`: Automatically set by Railway
- `HOST`: Set to "0.0.0.0"

## Deployment

### Deploy Backend to Railway

1. Create a new Railway project
2. Connect your GitHub repository
3. Add a new service using "Deploy from Dockerfile"
4. Railway will automatically detect the Dockerfile and build/deploy your app
5. The service will be available at the Railway-provided URL

Environment Variables (set in Railway dashboard):
- `PORT`: Set automatically by Railway
- `HOST`: "0.0.0.0"

### Update Frontend Configuration

After deploying the backend, update the API URL in your frontend:

```typescript
// frontend/app/page.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getBlockchain(): Promise<Blockchain> {
  const response = await fetch(`${API_URL}/chain`, { 
    cache: 'no-store'
  });
  // ...
}
```
