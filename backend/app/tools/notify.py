def send_sms(to: str, text: str) -> dict:
    """Send SMS notification (MVP: print to console)."""
    # MVP: print; later wire to a provider
    print(f"[SMS to {to}] {text}")
    return {"ok": True}

def send_email(to: str, subject: str, text: str) -> dict:
    """Send email notification (MVP: print to console)."""
    # MVP: print; later wire to a provider
    print(f"[EMAIL to {to}] Subject: {subject}\n{text}")
    return {"ok": True}

def send_app_push(user_id: str, title: str, message: str) -> dict:
    """Send app push notification (MVP: print to console)."""
    # MVP: print; later wire to a provider
    print(f"[PUSH to {user_id}] {title}: {message}")
    return {"ok": True}

