import logging
from functools import lru_cache

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_nvidia_ai_endpoints import ChatNVIDIA

from eventoon.config import settings

logger = logging.getLogger(__name__)


@lru_cache
def get_ai_service() -> "AIService":
    return AIService()


class AIService:
    def __init__(self):
        if not settings.NVIDIA_API_KEY:
            self.llm = None
            logger.warning("NVIDIA_API_KEY not set. LangChain features will be disabled.")
        else:
            self.llm = ChatNVIDIA(
                model=settings.NVIDIA_MODEL,
                nvidia_api_key=settings.NVIDIA_API_KEY,
                temperature=0.5,
                max_tokens=500,
            )

    async def get_event_suggestion(
        self, name: str, date: str, max_capacity: int, description: str
    ) -> str:
        if not self.llm:
            return "AI Service is currently unavailable (missing API key)."

        try:
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a professional event marketer. Improve the user's draft "
                        "description using the event context below. Keep the original idea, "
                        "make it compelling. Output AT MOST 900 characters. "
                        "DO NOT mention the event name, date, or capacity. "
                        "DO NOT wrap the output in quotes.",
                    ),
                    (
                        "user",
                        "Event: {name}\nDate: {date}\nCapacity: {capacity}\n\n"
                        "Draft description: {description}\n\nImproved description:",
                    ),
                ]
            )

            chain = prompt | self.llm | StrOutputParser()

            return await chain.ainvoke(
                {
                    "name": name,
                    "date": date,
                    "capacity": str(max_capacity),
                    "description": description,
                }
            )
        except Exception as e:
            logger.error(f"Error in LangChain event suggestion: {e}")
            return "Error generating suggestion via LangChain."

    async def get_stats_summary(
        self, event_name: str, total_registrations: int, max_capacity: int
    ) -> str:
        if not self.llm:
            return "AI Summary is unavailable (missing API key)."

        try:
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a data analyst. Provide a 2-sentence summary of the event "
                        "status. Event: {name}. Status: {registrations}/{capacity}.",
                    ),
                    ("user", "Summarize this data concisely."),
                ]
            )

            # Lower temperature for data analysis
            stats_llm = self.llm.model_copy(update={"temperature": 0.2})
            chain = prompt | stats_llm | StrOutputParser()

            return await chain.ainvoke(
                {"name": event_name, "registrations": total_registrations, "capacity": max_capacity}
            )
        except Exception as e:
            logger.error(f"Error in LangChain stats summary: {e}")
            return "Unable to generate AI summary at this moment."
