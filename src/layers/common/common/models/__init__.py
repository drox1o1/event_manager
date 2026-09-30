"""SQLAlchemy models — the full CyRokx schema, split by domain:

  base.py      Base, the shared primary-key helper
  auth.py      Organiser, AdminUser -- who can sign in
  events.py    Category, Event, EventFormField, EventImage -- event authoring
  tickets.py   TicketTier, Ticket -- what's sold, what's issued
  orders.py    Order and everything checkout produces (items, form answers,
               refund requests, buyer queries)
  content.py   PlatformSettings, the homepage CMS, freeform site pages
  activity.py  ActivityLog -- the audit trail

Every name below is re-exported here so existing call sites keep working
unchanged: `from common.models import Event` resolves the same as it did
when this was one file. Import the submodule directly (e.g.
`from common.models.events import Event`) only if you specifically want to
document which domain a model lives in.

Cross-file relationships (e.g. Event.organiser referencing Organiser,
defined in auth.py) work via SQLAlchemy's string-based forward refs
(Mapped["Organiser"], back_populates="...") -- resolved lazily against the
shared Base registry the first time mappers are configured, not at class
definition time, so import order among these submodules doesn't matter. It
only matters that every submodule has been imported at least once before
that first use, which importing this package guarantees.
"""

from .activity import ActivityLog
from .auth import AdminUser, Organiser, OrganiserStatus
from .base import Base
from .content import (
    HomepageSection,
    HomepageSectionEvent,
    HomepageSectionMode,
    HomepageSectionType,
    HomepageSettings,
    PlatformSettings,
    SitePage,
)
from .events import (
    Category,
    Event,
    EventFormField,
    EventImage,
    EventStatus,
    FormFieldType,
    event_categories,
)
from .orders import (
    Order,
    OrderFormResponse,
    OrderItem,
    OrderQuery,
    PaymentStatus,
    RefundRequest,
    RefundStatus,
)
from .tickets import Ticket, TicketTier

__all__ = [
    "ActivityLog",
    "AdminUser",
    "Base",
    "Category",
    "Event",
    "EventFormField",
    "EventImage",
    "EventStatus",
    "FormFieldType",
    "HomepageSection",
    "HomepageSectionEvent",
    "HomepageSectionMode",
    "HomepageSectionType",
    "HomepageSettings",
    "Order",
    "OrderFormResponse",
    "OrderItem",
    "OrderQuery",
    "Organiser",
    "OrganiserStatus",
    "PaymentStatus",
    "PlatformSettings",
    "RefundRequest",
    "RefundStatus",
    "SitePage",
    "Ticket",
    "TicketTier",
    "event_categories",
]
