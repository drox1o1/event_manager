"""The super-admin-controlled city list (homepage_settings.active_cities).

Events may only be created in one of these cities -- the organiser and admin
create/edit endpoints validate against allowed_cities(), and the public site
uses the same list for its navbar/city filter via GET /site-chrome.
"""

from sqlalchemy import select

from common.models import HomepageSettings

# Used until the super admin has ever saved site settings.
DEFAULT_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Ahmedabad", "Chennai", "Hyderabad", "Kolkata"]


def allowed_cities(session) -> list[str]:
    settings = session.execute(select(HomepageSettings).limit(1)).scalar_one_or_none()
    if settings and settings.active_cities:
        return list(settings.active_cities)
    return list(DEFAULT_CITIES)


def canonical_city(session, city: str) -> str | None:
    """The admin's spelling of `city` if it's an allowed city (case-insensitive), else None."""
    wanted = city.strip().lower()
    for c in allowed_cities(session):
        if c.strip().lower() == wanted:
            return c
    return None
