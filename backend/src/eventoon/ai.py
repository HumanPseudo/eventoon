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
                max_tokens=500
            )

    async def get_event_suggestion(self, user_input: str) -> str:
        if not self.llm:
            return "AI Service is currently unavailable (missing API key)."

        try:
            # Usamos LangChain PromptTemplates para manejar el contexto
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a professional event marketing expert. Your goal is to write a compelling event description. DO NOT ask questions. Deliver a ready-to-use description immediately."),
                ("user", "{input}")
            ])

            # Definimos la cadena (Chain)
            chain = prompt | self.llm | StrOutputParser()

            # Ejecutamos la cadena
            return await chain.ainvoke({"input": user_input})
        except Exception as e:
            logger.error(f"Error in LangChain event suggestion: {e}")
            return "Error generating suggestion via LangChain."

    async def get_stats_summary(self, event_name: str, total_registrations: int, max_capacity: int) -> str:
        if not self.llm:
            return "AI Summary is unavailable (missing API key)."

        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a data analyst. Provide a 2-sentence summary of the event status. Event: {name}. Status: {registrations}/{capacity}."),
                ("user", "Summarize this data concisely.")
            ])

            # Chain con temperatura más baja para análisis de datos
            stats_llm = self.llm.copy(update={"temperature": 0.2})
            chain = prompt | stats_llm | StrOutputParser()

            return await chain.ainvoke({
                "name": event_name,
                "registrations": total_registrations,
                "capacity": max_capacity
            })
        except Exception as e:
            logger.error(f"Error in LangChain stats summary: {e}")
            return "Unable to generate AI summary at this moment."
