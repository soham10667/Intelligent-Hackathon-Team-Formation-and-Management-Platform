from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog

def log_activity(
    db: Session,
    action: str,
    actor_id: Optional[int] = None,
    hackathon_id: Optional[int] = None,
    team_id: Optional[int] = None,
    target_user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """
    Appends an immutable audit log entry within the active database transaction.
    """
    log_entry = AuditLog(
        actor_id=actor_id,
        hackathon_id=hackathon_id,
        team_id=team_id,
        action=action,
        target_user_id=target_user_id,
        details=details or {}
    )
    db.add(log_entry)
    # Flushed as part of caller's transaction
    return log_entry

