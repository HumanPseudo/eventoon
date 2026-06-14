from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class EventCreate(BaseModel):
    name: str
    description: str
    date: date
    max_capacity: int


class EventResponse(BaseModel):
    id: int
    name: str
    description: str
    date: date
    max_capacity: int

    model_config = {"from_attributes": True}


class RegistrationCreate(BaseModel):
    user_name: str
    email: EmailStr


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    user_name: str
    email: str
    registration_date: datetime

    model_config = {"from_attributes": True}


class EventStats(BaseModel):
    id: int
    name: str
    total_registrations: int
    max_capacity: int
