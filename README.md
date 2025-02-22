# localmart

localmart is a platform for local businesses to sell their products and services to local customers.

## Prerequisites

Docker, Docker Compose

## Usage

To start the next.js frontend, the Python backend, and the database, run:
```bash
docker compose --build up
```

To clear the database
```bash
rm -rf ./volumes
```

## Debugging Tips
If the app is not loading porperly on your machine, try clear the cache and restart.

To rebuild the backend:
```bash
make
```
To rebuild the frontend, if NextJS is giving errors:
```bash
cd frontend/
rm -rf .next
make
```
