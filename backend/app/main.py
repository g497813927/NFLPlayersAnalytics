"""FastAPI application assembly; run uvicorn app.main:app on port 8000."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api_docs import API_DESCRIPTION, API_TAGS
from .config import settings
from .database import engine
from .errors import install_error_handlers
from .request_tracking import correlate_request
from .routes import router
from .sql_debug import install_sql_capture

app = FastAPI(
    title="NFL Players Analytics — synthetic prototype",
    version="0.1.0",
    description=API_DESCRIPTION,
    openapi_tags=API_TAGS,
    debug=False,
    docs_url="/docs/api",
    swagger_ui_oauth2_redirect_url="/docs/api/oauth2-redirect",
    swagger_ui_parameters={
        "docExpansion": "list",
        "deepLinking": True,
        "filter": True,
        "displayRequestDuration": True,
    },
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Request-ID"],
)
install_error_handlers(app)

if settings.debug_ui_enabled:
    install_sql_capture(engine)

app.middleware("http")(correlate_request)
app.include_router(router)
