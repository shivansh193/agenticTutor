Okay, let's pull back the curtain and take a closer look at the elegant dance of logic and intelligence that happens every time a user asks OmniTutor a question. This isn't just code executing; it's a carefully choreographed process designed for clarity, accuracy, and adaptability.

🧠 The Journey of a Query: A Deep Dive into the Process

Imagine you're sending a question into this system. What happens next? It's a multi-step journey involving smart agents and precise tools.

Phase 1: The Greeting - User Query Arrives
+-------------------+
|   User's Query    |  "What is the force if mass is 10kg and acceleration is 2m/s²?"
+-------------------+
         |
         V
+-------------------------+
| `processUserMessage`    |  (The Entry Point)
| (agentService.ts)       |
+-------------------------+


Your question, as a simple string of text, is the starting pistol. It's received by the main processUserMessage function, which acts as the central hub for the entire operation.

Phase 2: The Grand Orchestrator - The Main Tutor Agent Takes the Helm

The first intelligent entity your query meets is the Main Tutor Agent. This agent is powered by Gemini, but its behavior is strictly guided by the mainTutorSystemPrompt.

+-------------------------+
| `processUserMessage`    |
+-------------------------+
         |
         V
+-----------------------------------+     +----------------------------------------+
| Call Gemini API with:             | --> |        `mainTutorSystemPrompt`         |
| - Main Tutor System Prompt        |     | (Instructions: Analyze, Route, or     |
| - User's Query                    |     |  Respond. Know available specialists)  |
+-----------------------------------+     +----------------------------------------+
         |
         V
+-----------------------------------+
|   Gemini (as Main Tutor Agent)    |  Analyzes query based on its instructions.
|   evaluates & decides.            |  "This looks like a physics question involving calculation."
+-----------------------------------+
         |
         V
+-----------------------------------+
| Main Tutor's Structured Response  |  e.g., "TO_AGENT: physics\nWhat is the force if mass is 10kg and acc is 2m/s²?"
+-----------------------------------+
         |
         V
+-----------------------------------+
| `parseMainAgentResponse`          |  Decodes the Main Tutor's instructions.
+-----------------------------------+
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Initial Contact & Briefing: The processUserMessage function sends your raw query, along with the mainTutorSystemPrompt, to the Gemini API. This prompt is crucial – it tells the AI:

"You are the Main Tutor."

"Your job is to understand the user's general intent."

"Here's a list of specialist agents you can delegate to (math, physics, etc.) and the kinds of topics they handle."

"Decide if you should answer directly (like a greeting) or pass it to a specialist."

"If delegating, tell me which specialist using TO_AGENT: [agent_name]."

"If answering, use TO_USER: [your_response]."

Intelligent Triage: The Main Tutor Agent (Gemini) then processes your query against its instructions. It's not just keyword matching; it's using its language understanding to categorize the request.

For "Hello!", it might decide: TO_USER: Hello! I can help with various subjects...

For "What is 5 times 12?", it might decide: TO_AGENT: math\nWhat is 5 times 12?

For our example, "What is the force if mass is 10kg and acceleration is 2m/s²?", it recognizes physics terms and the need for a calculation, leading to: TO_AGENT: physics\nWhat is the force if mass is 10kg and acceleration is 2m/s²?

Decoding the Orders: The system then parses this structured response from the Main Tutor. If it's TO_USER, the journey might end here, and that response is sent back. If it's TO_AGENT, we move to the next phase.

Phase 3: Calling in the Expert - The Specialist Agent is Summoned

Now that the Main Tutor has identified the right field, the designated Specialist Agent (e.g., Physics Agent, Math Agent) is activated.

+-----------------------------------+
| `parseMainAgentResponse`          | Determines specialist is 'physics'
| (Identifies AgentId & Query)      | and the query for it.
+-----------------------------------+
         |
         V
+-----------------------------------+     +--------------------------------------------------+
| Call Gemini API with:             | --> | `createSpecialistSystemPrompt('physics', ...)`   |
| - Specialist System Prompt        |     | (Instructions: You are PHYSICS agent. You can use|
| - Query for Specialist            |     |  `getPhysicsConstant`, `calculateForce`, etc.    |
|                                   |     |  Output in EXECUTE_FUNCTION or TO_USER format.)  |
+-----------------------------------+     +--------------------------------------------------+
         |
         V
+-----------------------------------+
| Gemini (as Physics Specialist)    |  Analyzes query based on its *specific* tools.
| evaluates & decides.              |  "I have a `calculateForce` function. The user gave mass & acceleration."
+-----------------------------------+
         |
         V
+-----------------------------------+
| Specialist's Structured Response  |  e.g., "EXECUTE_FUNCTION: calculateForce\nPARAMS: {"mass": 10, "acceleration": 2}"
+-----------------------------------+
         |
         V
+-----------------------------------+
| `parseSpecialistAgentResponse`    |  Decodes the Specialist's plan.
+-----------------------------------+
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Specialist Briefing: Another call is made to the Gemini API. This time, the prompt is dynamically generated by createSpecialistSystemPrompt. This prompt is highly specific:

"You are the PHYSICS Specialist Agent." (Or MATH, CHEMISTRY, etc.)

"Here is a list of exact functions you have access to: getPhysicsConstant, calculateForce, calculateKineticEnergy." (The actual functions available to that agent.)

"If you can use one of these functions to answer the query, respond with EXECUTE_FUNCTION: [exact_function_name] and then PARAMS: {"param_name": "value"}."

"Extract the necessary parameters from the user's query for the function."

"If no function fits, or you need to clarify, respond with TO_USER: [your_detailed_response]."

Focused Analysis & Parameter Extraction: The Specialist Agent (Gemini, again, but with a different "hat" on) now looks at the query through the lens of its available tools. It tries to match the user's intent to one of its functions and, crucially, extract the values for the function's parameters.

For our "force" query, it identifies calculateForce as the right tool and extracts mass: 10 and acceleration: 2.

If the query was "Tell me about gravity," it might choose TO_USER: Gravity is a fundamental force... because there isn't a simple function for a general explanation.

Action Plan Decoded: The system parses the Specialist Agent's response. If it's TO_USER, that response is prepared to be sent back. If it's EXECUTE_FUNCTION, we head to the workshop!

Phase 4: The Workshop - Precise Execution by Local Functions

This is where the system transitions from AI-driven interpretation to deterministic code execution.

+-----------------------------------+
| `parseSpecialistAgentResponse`    | Identifies 'calculateForce' and params: {mass: 10, acc: 2}
+-----------------------------------+
         |
         V
+-----------------------------------+
| `executeFunction`                 |  Locates `physicsFunctions.calculateForce`
| (with agentId, funcName, params)  |  Passes {mass: 10, acceleration: 2} to it.
+-----------------------------------+
         |
         V
+-----------------------------------+
| `physicsFunctions.calculateForce` |  (Local TypeScript Function)
| const force = params.mass *       |  Calculates 10 * 2 = 20.
|               params.acceleration;|  Formats the string: "Using F=ma, the force is 20 N..."
| return `...${force} N...`;        |
+-----------------------------------+
         |
         V
+-----------------------------------+
|         Function Result           |  "Using F=ma, the force is 20 N..."
+-----------------------------------+
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Tool Selection: The executeFunction helper takes the functionName (e.g., calculateForce) and params (e.g., {mass: 10, acceleration: 2}) provided by the Specialist Agent.

Calling the Code: It looks up the actual TypeScript function within the corresponding agent's function map (e.g., physicsFunctions['calculateForce']).

Deterministic Operation: The local function runs. This code is predictable: calculateForce will always multiply mass by acceleration. It might also access curated data (like physicsConstantsData for getPhysicsConstant).

The Output: The function returns a string, which is the direct result of its operation.

Phase 5: The Final Word - Assembling and Delivering the Response

Whether the answer came directly from the Main Tutor, the Specialist Agent, or the result of a local function, it's now time to package it up.

+-----------------------------------+
| Function Result / Agent Response  |
+-----------------------------------+
         |
         V
+-----------------------------------+
| `createResponseMessage`           |  Wraps result in a Message object,
|                                   |  adding ID, sender, timestamp, agent.
+-----------------------------------+
         |
         V
+-------------------+
|  Formatted Message|  (Sent back to the user's application)
|  to User          |
+-------------------+
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

The createResponseMessage function takes the content, identifies which agent was ultimately responsible (or the function's parent agent), and formats it into the standard Message object. This object is then returned to whatever client application called processUserMessage.

📊 Visualizing the Flow: A Simplified Diagram

Here's a bird's-eye view of the common path involving delegation and function execution:

User Query
    |
    V
[Main Tutor Agent (Gemini)] -- (Prompt 1: General Routing)
    |  (Analyzes Query)
    |
    +-- [Direct Response?] --> TO_USER --> Output
    |
    +-- [Delegate?] --> TO_AGENT: [Specialist_ID]
                           |
                           V
        [Specialist Agent (Gemini)] -- (Prompt 2: Specific Task/Function Mapping for Specialist_ID)
                           |  (Analyzes Query against its functions)
                           |
                           +-- [Direct Response?] --> TO_USER --> Output
                           |
                           +-- [Execute Function?] --> EXECUTE_FUNCTION: [Func_Name], PARAMS
                                                           |
                                                           V
                                            [Local TypeScript Function (e.g., mathFunctions.add)]
                                                           | (Performs calculation/lookup)
                                                           V
                                                       [Result] --> Output
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

This multi-layered approach, combining the natural language understanding of Gemini with the precision of coded functions and curated data, allows OmniTutor to be both intelligent and reliable in its responses. Each step is designed to refine the understanding of the user's need and select the most appropriate way to fulfill it.