# Agentic Tutor - AI-Powered Learning Assistant

## 🧠 How It Works

The Agentic Tutor is built around a sophisticated agent system that processes user queries through multiple specialized agents. Here's a detailed breakdown of the process:

### Core Architecture

The system is centered around `agentService.ts`, which implements a multi-agent architecture with the following key components:

1. **Main Tutor Agent**: The entry point that routes queries to appropriate specialists
2. **Specialist Agents**: Domain-specific agents (Math, Physics, Chemistry, etc.)
3. **Function Executors**: Specialized functions for precise calculations and data lookups

### Query Processing Flow

1. **User Query Reception**:
   - The `processUserMessage` function in `agentService.ts` receives the user's query
   - It initializes the Gemini AI client if not already done

2. **Initial Processing**:
   - The query is passed to the Main Tutor Agent via `callGeminiAgent`
   - The agent uses `mainTutorSystemPrompt` to understand its role in routing queries

3. **Decision Making**:
   - The Main Tutor analyzes the query to determine if it should:
     - Respond directly (for general queries)
     - Delegate to a specialist agent (for domain-specific queries)

4. **Specialist Handling**:
   - If delegated, the query is forwarded to the appropriate specialist agent
   - Each specialist has access to specific functions (e.g., physics functions, math calculations)
   - The specialist processes the query using its specialized knowledge and functions

5. **Function Execution**:
   - Specialists can execute specific functions like:
     - `calculateForce(mass, acceleration)`
     - `solveQuadratic(a, b, c)`
     - `getElementInfo(element)`
   - These functions provide precise, deterministic results

6. **Response Generation**:
   - The result is formatted into a user-friendly response
   - The response includes which agent handled the query
   - The final message is returned through the `createResponseMessage` function

### Key Components in agentService.ts

- **Agent Configuration**:
  ```typescript
  export const AGENT_CONFIG = {
    GEMINI_MODEL: "gemini-1.5-flash",
    MAX_RETRIES: 3,
    TIMEOUT_MS: 30000,
    SUPPORTED_AGENTS: ['tutor', 'math', 'physics', 'chemistry', ...]
  };
  ```

- **Agent Types**:
  - Each agent type (math, physics, chemistry, etc.) has its own set of functions
  - Agents are defined as objects with specific methods for their domain

- **Function Registry**:
  - Each agent has access to a set of specialized functions
  - Functions are called through the `executeFunction` utility
  - Functions are type-safe and validate their parameters

### Example Flow: Calculating Force

1. User asks: "What is the force if mass is 10kg and acceleration is 2m/s²?"
2. Main Tutor identifies this as a physics calculation
3. Delegates to Physics Agent with the query
4. Physics Agent parses the parameters and calls `calculateForce({ mass: 10, acceleration: 2 })`
5. The function returns "Using F=ma, the force is 20 N"
6. The response is formatted and returned to the user

### Data Sources

The system includes several built-in data sources:

- `physicsConstantsData`: Common physics constants
- `chemicalElementsData`: Information about chemical elements
- `historicalEventsData`: Key historical events and information


