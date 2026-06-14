from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from eventoon.schemas import EventCreate, RegistrationCreate
from eventoon.services import EventService, get_session
from eventoon.ai import AIService, get_ai_service

router = APIRouter(tags=["events"])


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_event(data: EventCreate, session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.create(data)


@router.get("/events")
async def list_events(session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.list_all()


@router.get("/events/{event_id}")
async def get_event(event_id: int, session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.get_by_id(event_id)


@router.post("/events/{event_id}/register", status_code=status.HTTP_201_CREATED)
async def register_attendee(
    event_id: int, data: RegistrationCreate, session: AsyncSession = Depends(get_session)
):
    service = EventService(session)
    return await service.register(event_id, data)


@router.get("/events/{event_id}/stats")
async def get_stats(event_id: int, session: AsyncSession = Depends(get_session)):
    service = EventService(session)
    return await service.stats(event_id)


@router.get("/events/{event_id}/stats/summary")
async def get_stats_summary(
    event_id: int, 
    session: AsyncSession = Depends(get_session),
    ai: AIService = Depends(get_ai_service),
):
    from eventoon.repositories import EventAIInsightRepository
    service = EventService(session)
    insight_repo = EventAIInsightRepository(session)
    
    stats = await service.stats(event_id)
    
    cached = await insight_repo.get_cached_insight(event_id, stats.total_registrations, stats.max_capacity)
    if cached:
        return {"summary": cached, "cached": True}
    
    summary = await ai.get_stats_summary(stats.name, stats.total_registrations, stats.max_capacity)
    summary = summary[:2000]
    
    await insight_repo.save_insight(event_id, stats.total_registrations, stats.max_capacity, summary)
    
    return {"summary": summary, "cached": False}
