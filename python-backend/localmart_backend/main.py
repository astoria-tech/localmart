import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router as api_router

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LocalMart Backend",
    description="Backend API for LocalMart application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:3000",

        # Staging
        "https://localmart-frontend.fly.dev",
        "https://demo.localmart.nyc",

        # Production
        "https://localmart-frontend-prod.fly.dev",
        "https://localmart.nyc"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting Localmart backend...")
    
    # Print all routes on startup with clickable URLs
    host = "http://localhost:8000"  # Default FastAPI host
    print("\n🚀 Available routes:")
    for route in app.routes:
        if hasattr(route, "methods"):
            methods = ", ".join(route.methods)
            url = f"{host}{route.path}"
            print(f"{methods:20} {url}")
    print()

@app.get("/", response_model=dict)
async def hello_world():
    """Root endpoint for health checks."""
    return {"message": "This is the Localmart API"}

# Include all API routes
app.include_router(api_router)