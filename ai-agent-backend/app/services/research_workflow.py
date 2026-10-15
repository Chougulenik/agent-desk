import asyncio
import json
import uuid
from typing import Dict, AsyncGenerator

# Research Lifecycle States
STATES = ["IDLE", "PLANNING", "SEARCHING", "READING", "ANALYZING", "WRITING", "REVIEWING", "COMPLETE"]

class ResearchTask:
    def __init__(self, query: str):
        self.task_id = str(uuid.uuid4())
        self.query = query
        self.state = "IDLE"
        self.is_paused = False
        self.is_cancelled = False
        
        # We use a queue to push events to the streaming endpoint
        self.event_queue = asyncio.Queue()
        
        # Keep track of progress to resume from the right state
        self.current_state_idx = 1 # Start at PLANNING
        
        # Store execution task reference so we can cancel if needed
        self.execution_task = None

# In-memory persistence for tasks
TASKS_DB: Dict[str, ResearchTask] = {}

async def _execute_research_workflow(task: ResearchTask):
    """The actual state machine executor."""
    try:
        while task.current_state_idx < len(STATES) - 1:
            if task.is_cancelled:
                await task.event_queue.put({"type": "error", "message": "Research cancelled by user."})
                break
                
            while task.is_paused:
                if task.is_cancelled:
                    break
                await asyncio.sleep(1)
                
            if task.is_cancelled:
                break
                
            task.state = STATES[task.current_state_idx]
            
            # Dispatch state update event
            await task.event_queue.put({
                "type": "status_update",
                "status": task.state,
                "message": f"Entered phase: {task.state}"
            })
            
            # Simulate work for this phase
            await task.event_queue.put({"type": "tool_started", "toolName": f"{task.state}_Tool", "toolInput": {"query": task.query}})
            await asyncio.sleep(3) # Simulate long-running work
            
            if task.is_paused or task.is_cancelled:
                continue # Re-evaluate pause/cancel before advancing
                
            await task.event_queue.put({"type": "tool_completed", "toolName": f"{task.state}_Tool", "result": f"Completed {task.state} phase."})
            
            # Advance state
            task.current_state_idx += 1
            
        if not task.is_cancelled:
            task.state = "COMPLETE"
            await task.event_queue.put({
                "type": "status_update",
                "status": "COMPLETE",
                "message": "Research complete."
            })
            await task.event_queue.put({"type": "text_delta", "delta": "\n\n**Deep Research Complete!** Here is the synthesized report based on your query."})
            
    except Exception as e:
        await task.event_queue.put({"type": "error", "message": str(e)})
    finally:
        await task.event_queue.put({"type": "workflow_end"})

def start_research(query: str) -> str:
    task = ResearchTask(query)
    TASKS_DB[task.task_id] = task
    task.execution_task = asyncio.create_task(_execute_research_workflow(task))
    return task.task_id

def pause_research(task_id: str):
    if task_id in TASKS_DB:
        TASKS_DB[task_id].is_paused = True

def resume_research(task_id: str):
    if task_id in TASKS_DB:
        TASKS_DB[task_id].is_paused = False

def cancel_research(task_id: str):
    if task_id in TASKS_DB:
        TASKS_DB[task_id].is_cancelled = True
        # Note: In a real system, you might want to cancel the asyncio task itself, 
        # but our loop gracefully checks for `is_cancelled`.

async def stream_research_events(task_id: str) -> AsyncGenerator[str, None]:
    if task_id not in TASKS_DB:
        yield json.dumps({"type": "error", "message": "Task not found."})
        return
        
    task = TASKS_DB[task_id]
    
    # If resuming an already running/paused task, yield the current state first
    yield json.dumps({"type": "status_update", "status": task.state, "message": f"Resuming from {task.state}"})
    
    while True:
        # Wait for the next event in the queue
        event = await task.event_queue.get()
        
        if event.get("type") == "workflow_end":
            break
            
        yield json.dumps(event)
