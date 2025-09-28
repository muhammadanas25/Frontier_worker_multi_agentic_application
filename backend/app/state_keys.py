# Canonical session state keys for consistent data flow

CASE_ID = "case_id"
CASE_TYPE = "case_type"              # "health" | "crime" | "disaster" | "unknown"
URGENCY = "urgency"                  # "low" | "medium" | "high" | "critical"
LITE = "lite"                        # bool
USER_MESSAGE = "user_message"
LOCATION = "location"                # {"lat":..., "lon":...}
TARGET = "target"                    # service dict returned by directory tool
BOOKING = "booking"                  # dict of booking info
CONFIRMATION_TEXT = "confirmation_text"

