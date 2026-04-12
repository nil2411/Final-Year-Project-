"""
Memory Service - Manages conversation memory using LangChain ConversationBufferMemory
"""
from typing import Dict, List, Optional, TYPE_CHECKING, Any
from collections import defaultdict

if TYPE_CHECKING:
    from langchain.memory import ConversationBufferMemory

try:
    from langchain.memory import ConversationBufferMemory
    from langchain.schema import BaseMessage, HumanMessage, AIMessage
    LANGCHAIN_AVAILABLE = True
except ImportError:
    try:
        from langchain.memory import ConversationBufferMemory
        from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
        LANGCHAIN_AVAILABLE = True
    except ImportError:
        LANGCHAIN_AVAILABLE = False
        ConversationBufferMemory = None  # type: ignore
        BaseMessage = None  # type: ignore
        HumanMessage = None  # type: ignore
        AIMessage = None  # type: ignore
        print("Warning: LangChain not available, using simple memory implementation")


class MemoryService:
    """Service for managing conversation memory per session"""
    
    def __init__(self, max_messages: int = 15):
        """
        Initialize memory service
        
        Args:
            max_messages: Maximum number of message exchanges to keep (default: 15)
        """
        self.max_messages = max_messages
        self.memories: Dict[str, Any] = {}  # Use Any to avoid type issues when LangChain unavailable
        self.simple_memories: Dict[str, List[Dict[str, str]]] = defaultdict(list)
        self.use_langchain = LANGCHAIN_AVAILABLE
    
    def get_memory(self, conversation_id: str) -> Any:
        """Get or create memory for a conversation"""
        if not LANGCHAIN_AVAILABLE or ConversationBufferMemory is None:
            raise RuntimeError("LangChain is not available. Cannot use ConversationBufferMemory.")
        
        if conversation_id not in self.memories:
            self.memories[conversation_id] = ConversationBufferMemory(
                return_messages=True,
                memory_key="history"
            )
        return self.memories[conversation_id]
    
    def add_message(self, conversation_id: str, role: str, content: str):
        """
        Add a message to conversation memory
        
        Args:
            conversation_id: Unique conversation identifier
            role: 'user' or 'assistant'
            content: Message content
        """
        if self.use_langchain and LANGCHAIN_AVAILABLE:
            try:
                memory = self.get_memory(conversation_id)
                if role == "user":
                    memory.chat_memory.add_user_message(content)
                else:
                    memory.chat_memory.add_ai_message(content)
            except RuntimeError:
                # Fallback to simple memory if LangChain fails
                self.simple_memories[conversation_id].append({
                    "role": role,
                    "content": content
                })
                if len(self.simple_memories[conversation_id]) > self.max_messages * 2:
                    self.simple_memories[conversation_id] = self.simple_memories[conversation_id][-self.max_messages * 2:]
        else:
            # Simple fallback implementation
            self.simple_memories[conversation_id].append({
                "role": role,
                "content": content
            })
            # Keep only last max_messages
            if len(self.simple_memories[conversation_id]) > self.max_messages * 2:
                self.simple_memories[conversation_id] = self.simple_memories[conversation_id][-self.max_messages * 2:]
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, str]]:
        """
        Get conversation history as list of messages
        
        Returns:
            List of dicts with 'role' and 'content' keys
        """
        if self.use_langchain and LANGCHAIN_AVAILABLE:
            try:
                memory = self.get_memory(conversation_id)
                messages = memory.chat_memory.messages
                
                history = []
                for msg in messages[-self.max_messages * 2:]:  # Keep last max_messages exchanges
                    # Check message type - handle both LangChain message types and dict-like objects
                    if HumanMessage is not None and isinstance(msg, HumanMessage):
                        history.append({"role": "user", "content": msg.content})
                    elif AIMessage is not None and isinstance(msg, AIMessage):
                        history.append({"role": "assistant", "content": msg.content})
                    elif hasattr(msg, 'type'):
                        if msg.type == 'human':
                            history.append({"role": "user", "content": msg.content})
                        elif msg.type == 'ai':
                            history.append({"role": "assistant", "content": msg.content})
                
                return history
            except (RuntimeError, AttributeError):
                # Fallback to simple memory if LangChain fails
                pass
        
        # Simple fallback (used when LangChain unavailable or fails)
        return self.simple_memories[conversation_id][-self.max_messages * 2:]
    
    def get_context_summary(self, conversation_id: str) -> str:
        """
        Get a summary of conversation context for LLM prompt
        
        Returns:
            Formatted string with conversation summary
        """
        history = self.get_conversation_history(conversation_id)
        
        if not history:
            return ""
        
        summary_parts = []
        for msg in history[-6:]:  # Last 6 messages (3 exchanges)
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content:
                summary_parts.append(f"{role.upper()}: {content[:200]}")
        
        return "\n".join(summary_parts)
    
    def clear_memory(self, conversation_id: str):
        """Clear memory for a conversation"""
        if conversation_id in self.memories:
            del self.memories[conversation_id]
        if conversation_id in self.simple_memories:
            del self.simple_memories[conversation_id]
    
    def infer_context(self, conversation_id: str, query: str) -> str:
        """
        Infer context from pronouns and references in query
        
        Args:
            conversation_id: Conversation identifier
            query: Current user query
            
        Returns:
            Expanded query with explicit context
        """
        history = self.get_conversation_history(conversation_id)
        
        if not history:
            return query
        
        # Look for pronouns and references
        pronouns = ["it", "this", "that", "them", "they", "these", "those"]
        query_lower = query.lower()
        
        # Find most recent topic
        recent_topic = None
        for msg in reversed(history[-6:]):
            if msg.get("role") == "user":
                content = msg.get("content", "").strip()
                # Extract topic from queries like "tell me about X"
                if "about" in content.lower():
                    parts = content.lower().split("about")
                    if len(parts) > 1:
                        recent_topic = parts[1].strip()
                        # Clean up common words
                        for word in ["the", "a", "an", "some", "more"]:
                            if recent_topic.startswith(word + " "):
                                recent_topic = recent_topic[len(word)+1:].strip()
                        break
                # Extract from "what is X"
                elif "what is" in content.lower() or "what are" in content.lower():
                    parts = content.lower().split("what is" if "what is" in content.lower() else "what are")
                    if len(parts) > 1:
                        recent_topic = parts[1].strip()
                        break
        
        # Expand query if pronouns found
        if recent_topic and any(pronoun in query_lower for pronoun in pronouns):
            # Replace pronouns with explicit topic
            expanded = query
            for pronoun in pronouns:
                if pronoun in query_lower:
                    expanded = expanded.replace(f" {pronoun} ", f" {recent_topic} ")
                    expanded = expanded.replace(f" {pronoun},", f" {recent_topic},")
                    expanded = expanded.replace(f", {pronoun} ", f", {recent_topic} ")
            return expanded
        
        return query


# Global instance
memory_service = MemoryService(max_messages=15)

