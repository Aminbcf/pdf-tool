import uvicorn
from adapters.inbound.api import app  # noqa: F401 — re-exported for uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "adapters.inbound.api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
