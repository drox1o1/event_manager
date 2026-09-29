"""Admin-facing content management: platform settings, homepage CMS,
categories, and freeform site pages (About, Careers, ...). Public reads of
these live in public_api; this module is the admin write side.
"""

import re

from app import app
from app import parse_request_body as _parse_body
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from common.db import get_session
from common.helpers import ConflictError
from common.models import (
    Category,
    Event,
    HomepageSection,
    HomepageSectionEvent,
    HomepageSectionMode,
    HomepageSectionType,
    HomepageSettings,
    PlatformSettings,
    SitePage,
)
from common.schemas import (
    SLUG_PATTERN,
    CategoriesReplaceRequest,
    CategorySummary,
    HomepageReplaceRequest,
    PlatformSettingsResponse,
    PlatformSettingsUpdateRequest,
    SitePageListItem,
    SitePageResponse,
    SitePageUpsertRequest,
)
from context import require_admin_id
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# --- Admin: platform settings (authenticated) ---


def _get_or_create_settings(session) -> PlatformSettings:
    settings = session.execute(select(PlatformSettings).limit(1)).scalar_one_or_none()
    if settings is None:
        settings = PlatformSettings()
        session.add(settings)
        session.flush()
    return settings


@app.get("/admin/settings")
def get_settings():
    require_admin_id()

    with get_session() as session:
        settings = _get_or_create_settings(session)
        return PlatformSettingsResponse.model_validate(settings).model_dump(mode="json")


@app.patch("/admin/settings")
def update_settings():
    require_admin_id()
    body = _parse_body(PlatformSettingsUpdateRequest)

    with get_session() as session:
        settings = _get_or_create_settings(session)
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)
        session.flush()
        return PlatformSettingsResponse.model_validate(settings).model_dump(mode="json")


# --- Admin: homepage CMS (authenticated) ---


def _get_or_create_homepage_settings(session) -> HomepageSettings:
    settings = session.execute(select(HomepageSettings).limit(1)).scalar_one_or_none()
    if settings is None:
        settings = HomepageSettings()
        session.add(settings)
        session.flush()
    return settings


def _homepage_settings_dict(s: HomepageSettings) -> dict:
    return {
        "hero_eyebrow": s.hero_eyebrow,
        "hero_headline": s.hero_headline,
        "hero_subheadline": s.hero_subheadline,
        "hero_search_enabled": s.hero_search_enabled,
        "banner_enabled": s.banner_enabled,
        "banner_text": s.banner_text,
        "banner_link_url": s.banner_link_url,
        "footer_tagline": s.footer_tagline,
        "footer_columns": s.footer_columns or [],
        "active_cities": s.active_cities or [],
    }


def _homepage_section_dict(sec: HomepageSection) -> dict:
    return {
        "id": str(sec.id),
        "title": sec.title,
        "section_type": sec.section_type.value,
        "mode": sec.mode.value,
        "enabled": sec.enabled,
        "sort_order": sec.sort_order,
        "category_id": str(sec.category_id) if sec.category_id else None,
        "event_ids": [str(e.event_id) for e in sorted(sec.events, key=lambda e: e.sort_order)],
    }


@app.get("/admin/homepage")
def get_homepage():
    require_admin_id()

    with get_session() as session:
        settings = _get_or_create_homepage_settings(session)
        sections = (
            session.execute(
                select(HomepageSection)
                .options(selectinload(HomepageSection.events))
                .order_by(HomepageSection.sort_order.asc())
            )
            .scalars()
            .all()
        )
        return {
            "settings": _homepage_settings_dict(settings),
            "sections": [_homepage_section_dict(s) for s in sections],
        }


@app.put("/admin/homepage")
def replace_homepage():
    """Replace-all: persist hero/banner settings and the full ordered section
    list (with curated event picks) in one atomic save."""
    require_admin_id()
    body = _parse_body(HomepageReplaceRequest)

    with get_session() as session:
        settings = _get_or_create_homepage_settings(session)
        for field, value in body.settings.model_dump().items():
            setattr(settings, field, value)

        # Rebuild sections wholesale. Deleting the parent rows cascades to
        # homepage_section_events (ON DELETE CASCADE).
        session.execute(HomepageSection.__table__.delete())

        created = []
        for idx, sec_in in enumerate(body.sections):
            section = HomepageSection(
                title=sec_in.title,
                section_type=HomepageSectionType(sec_in.section_type),
                mode=HomepageSectionMode(sec_in.mode),
                enabled=sec_in.enabled,
                sort_order=idx,
                category_id=sec_in.category_id,
            )
            session.add(section)
            session.flush()
            for e_idx, event_id in enumerate(sec_in.event_ids):
                session.add(
                    HomepageSectionEvent(section_id=section.id, event_id=event_id, sort_order=e_idx)
                )
            created.append((section, sec_in.event_ids))

        result = [
            {
                "id": str(section.id),
                "title": section.title,
                "section_type": section.section_type.value,
                "mode": section.mode.value,
                "enabled": section.enabled,
                "sort_order": section.sort_order,
                "category_id": str(section.category_id) if section.category_id else None,
                "event_ids": [str(eid) for eid in event_ids],
            }
            for section, event_ids in created
        ]

        return {"settings": _homepage_settings_dict(settings), "sections": result}


# --- Admin: categories (authenticated) ---


@app.get("/admin/categories")
def list_categories_admin():
    require_admin_id()

    with get_session() as session:
        categories = session.execute(select(Category).order_by(Category.sort_order.asc())).scalars().all()
        return {"categories": [CategorySummary.model_validate(c).model_dump(mode="json") for c in categories]}


@app.put("/admin/categories")
def replace_categories():
    """Replace-all save, mirroring the homepage sections / registration form
    builder convention: rows with an id are updated, rows without one are
    created, and any existing category missing from the list is deleted --
    unless it still has events, in which case nothing is persisted and a 409
    names the categories blocking the delete."""
    require_admin_id()
    body = _parse_body(CategoriesReplaceRequest)

    names = [c.name.strip().lower() for c in body.categories]
    if len(names) != len(set(names)):
        raise BadRequestError("Category names must be unique")

    with get_session() as session:
        existing = {c.id: c for c in session.execute(select(Category)).scalars().all()}
        keep_ids = {c.id for c in body.categories if c.id is not None}
        to_delete = [c for cid, c in existing.items() if cid not in keep_ids]

        if to_delete:
            blocked = (
                session.execute(
                    select(Category.name)
                    .join(Event, Event.category_id == Category.id)
                    .where(Category.id.in_(c.id for c in to_delete))
                    .distinct()
                )
                .scalars()
                .all()
            )
            if blocked:
                raise ConflictError(
                    f"Can't delete {', '.join(blocked)} -- events still use "
                    f"{'this category' if len(blocked) == 1 else 'these categories'}."
                )

        for c in to_delete:
            session.delete(c)

        result = []
        for idx, cat_in in enumerate(body.categories):
            if cat_in.id is not None and cat_in.id in existing:
                category = existing[cat_in.id]
                category.name = cat_in.name
                category.icon = cat_in.icon
                category.sort_order = idx
            else:
                category = Category(name=cat_in.name, icon=cat_in.icon, sort_order=idx)
                session.add(category)
            result.append(category)

        session.flush()
        return {"categories": [CategorySummary.model_validate(c).model_dump(mode="json") for c in result]}


# --- Admin: site pages (authenticated; public reads by slug in public_api) ---


def _site_page_or_404(session, slug: str) -> SitePage:
    page = session.execute(select(SitePage).where(SitePage.slug == slug)).scalar_one_or_none()
    if page is None:
        raise NotFoundError("Page not found")
    return page


@app.get("/admin/site-pages")
def list_site_pages():
    require_admin_id()

    with get_session() as session:
        pages = session.execute(select(SitePage).order_by(SitePage.slug.asc())).scalars().all()
        return {"pages": [SitePageListItem.model_validate(p).model_dump(mode="json") for p in pages]}


@app.get("/admin/site-pages/<slug>")
def get_site_page_admin(slug: str):
    require_admin_id()

    with get_session() as session:
        page = _site_page_or_404(session, slug)
        return SitePageResponse.model_validate(page).model_dump(mode="json")


@app.put("/admin/site-pages/<slug>")
def upsert_site_page(slug: str):
    """Creates the page if `slug` doesn't exist yet (so admins can add brand
    new pages, not just edit the seeded six), otherwise updates it in place."""
    require_admin_id()
    if not re.match(SLUG_PATTERN, slug):
        raise BadRequestError("Slug must be lowercase letters, numbers and hyphens only")
    body = _parse_body(SitePageUpsertRequest)

    with get_session() as session:
        page = session.execute(select(SitePage).where(SitePage.slug == slug)).scalar_one_or_none()
        if page is None:
            page = SitePage(slug=slug, title=body.title, body=body.body)
            session.add(page)
        else:
            page.title = body.title
            page.body = body.body
        session.flush()
        return SitePageResponse.model_validate(page).model_dump(mode="json")


@app.delete("/admin/site-pages/<slug>")
def delete_site_page(slug: str):
    require_admin_id()

    with get_session() as session:
        page = _site_page_or_404(session, slug)
        session.delete(page)
        return {"deleted": slug}
