"""Keep database details in the backend and return predictable UI messages."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str, fields=None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.fields = fields


def error_response(status_code: int, code: str, message: str, fields=None):
    payload = {"code": code, "message": message}
    if fields:
        payload["fields"] = fields
    return JSONResponse(status_code=status_code, content={"error": payload})


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def application_error(_request: Request, exc: AppError):
        return error_response(exc.status_code, exc.code, exc.message, exc.fields)

    @app.exception_handler(RequestValidationError)
    async def invalid_input(_request: Request, exc: RequestValidationError):
        fields = []
        for error in exc.errors():
            location = ".".join(str(part) for part in error["loc"] if part != "body")
            message = error["msg"].removeprefix("Value error, ")
            fields.append({"field": location, "message": message})
        message = "Please check the highlighted fields."
        if fields:
            message = f"{fields[0]['field'] or 'Record'}: {fields[0]['message']}"
        return error_response(422, "invalid_input", message, fields)

    @app.exception_handler(IntegrityError)
    async def integrity_error(request: Request, exc: IntegrityError):
        # Match internally only. Never put this driver text into an API response.
        driver_message = str(exc.orig).lower()
        resource = request.url.path.strip("/").split("/")[1:2]
        resource = resource[0] if resource else ""
        logger.info("Database rejected %s %s", request.method, request.url.path)
        if "foreign key" in driver_message:
            if request.method == "DELETE":
                message = {
                    "teams": "This team has rosters or game records and cannot be deleted while they exist.",
                    "athletes": "This athlete has roster memberships or statistics and cannot be deleted while they exist.",
                }.get(resource, "This record is still used by other records and cannot be deleted.")
                return error_response(
                    409, "record_in_use", message
                )
            return error_response(
                422, "invalid_reference",
                "A related record no longer exists. Refresh the page and choose it again."
            )
        if "unique" in driver_message or "duplicate" in driver_message:
            message = {
                "teams": "A team with this name already exists in the selected league.",
                "rosters": "This team already has a roster for the selected season.",
                "memberships": "This athlete already has a membership in this roster with the same start date.",
                "performance-statistics": "This subject already has this statistic recorded for the selected game. Edit the existing value instead.",
                "games": "A game cannot have duplicate teams or duplicate home/away roles.",
            }.get(resource, "A record with this name or combination already exists. Please choose different values.")
            return error_response(
                409, "duplicate_record", message
            )
        if "not null" in driver_message:
            return error_response(422, "missing_value", "Please fill in all required fields.")
        return error_response(
            422, "invalid_record",
            "These values do not meet the record's rules. Check the dates, scores, and selected records."
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_request: Request, exc: SQLAlchemyError):
        logger.error("Database operation failed (%s)", type(exc).__name__)
        return error_response(
            503, "database_unavailable",
            "The database could not complete this operation. Check that it has been initialized, then try again."
        )

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, exc: HTTPException):
        message = "This page or record could not be found." if exc.status_code == 404 else "The request could not be completed."
        return error_response(exc.status_code, "request_failed", message)

    @app.exception_handler(Exception)
    async def unexpected_error(_request: Request, exc: Exception):
        logger.error("Unexpected application error", exc_info=exc)
        return error_response(500, "unexpected_error", "Something went wrong. Please try again.")
