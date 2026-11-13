from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Notification
from app.websocket.manager import manager

async def create_and_send_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None
) -> Notification:
    """
    Creates a persistent notification in the database and pushes it live
    via WebSocket to the user if online.
    """
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        metadata_json=metadata_json or {},
        is_read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # Push to live WebSocket connection if user is connected
    payload = {
        "event": "new_notification",
        "data": {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "link": notification.link,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
            "metadata": notification.metadata_json
        }
    }
    await manager.send_personal_message(payload, user_id)
    return notification

