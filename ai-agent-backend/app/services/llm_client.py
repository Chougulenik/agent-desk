import asyncio
import json
from google import genai
from app.core.config import settings

# Initialize client if API key is present and not the placeholder
api_key = settings.GEMINI_API_KEY
client = genai.Client(api_key=api_key) if api_key and api_key != "your_gemini_api_key_here" else None

async def stream_llm_tokens(prompt: str):
    """
    Connects to the Gemini model to stream tokens to the FastAPI endpoint.
    """
    if not client:
        yield json.dumps({"type": "error", "message": "GEMINI_API_KEY not configured in .env"})
        return
        
    try:
        print("Client:", client, flush=True)
        # Use normal call and simulate streaming word by word
        print("1. Query received", flush=True)
        print("2. Before Gemini", flush=True)

        response = await client.aio.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
        )

        print("3. Gemini response received", flush=True)
        print("4. Response text:", response.text, flush=True)

        if response.text:
            import re
            tokens = re.findall(r'\S+|\s+', response.text)
            print("5. Number of tokens:", len(tokens), flush=True)
            for token in tokens:
                print(f"Gemini streaming output: {repr(token)}", flush=True)
                yield json.dumps({"type": "text_delta", "delta": token})
                # Yield control to the event loop to simulate typing/streaming
                await asyncio.sleep(0.001)
                
    except Exception as e:
        yield json.dumps({"type": "error", "message": f"LLM Error: {str(e)}"})
