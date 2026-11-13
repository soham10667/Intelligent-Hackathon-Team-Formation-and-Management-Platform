from datetime import datetime, timedelta, timezone
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.database import SessionLocal
from app.models.models import IdempotencyKey

class IdempotencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        idempotency_key = request.headers.get("X-Idempotency-Key")
        
        # Only process state-changing operations
        if not idempotency_key or request.method not in ["POST", "PUT", "PATCH", "DELETE"]:
            return await call_next(request)

        db = SessionLocal()
        try:
            cached = db.query(IdempotencyKey).filter(
                IdempotencyKey.key == idempotency_key
            ).first()

            now = datetime.now(timezone.utc)
            if cached:
                cached_exp = cached.expires_at
                if cached_exp.tzinfo is None:
                    cached_exp = cached_exp.replace(tzinfo=timezone.utc)
                if cached_exp > now:
                    return Response(
                        content=cached.response_body,
                        status_code=cached.response_code,
                        media_type="application/json",
                        headers={"X-Cache-Lookup": "HIT-IDEMPOTENT"}
                    )

            # Execute endpoint
            response = await call_next(request)

            # Cache successful 2xx responses
            if 200 <= response.status_code < 300:
                response_body_bytes = b""
                async for chunk in response.body_iterator:
                    response_body_bytes += chunk if isinstance(chunk, bytes) else chunk.encode("utf-8")

                async def generate_chunks():
                    yield response_body_bytes

                response.body_iterator = generate_chunks()
                body_str = response_body_bytes.decode("utf-8")

                # Store cached idempotency entry
                new_key = IdempotencyKey(
                    key=idempotency_key,
                    user_id=1,
                    endpoint=request.url.path,
                    response_code=response.status_code,
                    response_body=body_str,
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
                )
                db.add(new_key)
                db.commit()

            return response
        except Exception:
            db.rollback()
            return await call_next(request)
        finally:
            db.close()
