// lib/agentService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Configuration ---
export const AGENT_CONFIG = {
  GEMINI_MODEL: "gemini-1.5-flash",
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000,
  SUPPORTED_AGENTS: ['tutor', 'math', 'physics', 'chemistry', 'biology', 'history', 'literature', 'coding', 'finance', 'health'] as const
};

// --- Type Definitions ---
export type AgentId = 'tutor' | 'math' | 'physics' | 'chemistry' | 'biology' | 'history' | 'literature' | 'coding' | 'finance' | 'health';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  agent?: AgentId;
  isLoading?: boolean;
}

interface FunctionCallParams {
  [key: string]: string | number | boolean | object;
}

// --- Data Sources ---
const physicsConstantsData: { [key: string]: { symbol: string; value: string; unit: string; description: string } } = {
  "speed of light": { symbol: "c", value: "299,792,458", unit: "m/s", description: "Speed of light in vacuum" },
  "planck constant": { symbol: "h", value: "6.626 × 10⁻³⁴", unit: "J⋅s", description: "Planck's constant" },
  "gravitational constant": { symbol: "G", value: "6.674 × 10⁻¹¹", unit: "m³⋅kg⁻¹⋅s⁻²", description: "Gravitational constant" },
  "electron mass": { symbol: "mₑ", value: "9.109 × 10⁻³¹", unit: "kg", description: "Rest mass of electron" },
  "avogadro number": { symbol: "Nₐ", value: "6.022 × 10²³", unit: "mol⁻¹", description: "Avogadro's number" },
  "boltzmann constant": { symbol: "k", value: "1.381 × 10⁻²³", unit: "J/K", description: "Boltzmann constant" },
  "elementary charge": { symbol: "e", value: "1.602 × 10⁻¹⁹", unit: "C", description: "Elementary electric charge" }
};

const chemicalElementsData: { [key: string]: { symbol: string; atomicNumber: number; atomicMass: string; description: string } } = {
  "hydrogen": { symbol: "H", atomicNumber: 1, atomicMass: "1.008", description: "Lightest chemical element" },
  "helium": { symbol: "He", atomicNumber: 2, atomicMass: "4.003", description: "Noble gas, second lightest element" },
  "carbon": { symbol: "C", atomicNumber: 6, atomicMass: "12.011", description: "Basis of organic chemistry" },
  "oxygen": { symbol: "O", atomicNumber: 8, atomicMass: "15.999", description: "Essential for respiration" },
  "nitrogen": { symbol: "N", atomicNumber: 7, atomicMass: "14.007", description: "Makes up 78% of Earth's atmosphere" },
  "sodium": { symbol: "Na", atomicNumber: 11, atomicMass: "22.990", description: "Alkali metal, essential for life" },
  "chlorine": { symbol: "Cl", atomicNumber: 17, atomicMass: "35.453", description: "Halogen gas, used in disinfection" },
  "iron": { symbol: "Fe", atomicNumber: 26, atomicMass: "55.845", description: "Essential for blood and steel production" },
  "copper": { symbol: "Cu", atomicNumber: 29, atomicMass: "63.546", description: "Excellent conductor of electricity" },
  "gold": { symbol: "Au", atomicNumber: 79, atomicMass: "196.967", description: "Precious metal, chemically inert" }
};

const historicalEventsData: { [key: string]: { year: string; description: string; significance: string } } = {
  "world war 2": { year: "1939-1945", description: "Global war involving most nations", significance: "Reshaped global politics and led to decolonization" },
  "world war 1": { year: "1914-1918", description: "The Great War, first global conflict", significance: "Led to fall of empires and rise of new nations" },
  "moon landing": { year: "1969", description: "Apollo 11 first crewed moon landing", significance: "Demonstrated human capability for space exploration" },
  "fall of berlin wall": { year: "1989", description: "End of divided Berlin", significance: "Symbolized end of Cold War" },
  "renaissance": { year: "14th-17th century", description: "Cultural rebirth in Europe", significance: "Revival of art, science, and learning" },
  "industrial revolution": { year: "1760-1840", description: "Mechanization of production", significance: "Transformed society from agricultural to industrial" },
  "french revolution": { year: "1789-1799", description: "Overthrow of French monarchy", significance: "Spread democratic ideals across Europe" },
  "american revolution": { year: "1775-1783", description: "American colonies gained independence", significance: "Established first modern democratic republic" }
};

// --- Agent Functions ---
// Physics Agent Functions
const physicsFunctions = {
  getPhysicsConstant: (params: { name: string }): string => {
    const constantName = params.name.toLowerCase();
    const constant = physicsConstantsData[constantName];
    if (constant) {
      return `The ${constantName} (${constant.symbol}) is ${constant.value} ${constant.unit}. Description: ${constant.description}`;
    }
    return `Sorry, I don't have information for the constant "${params.name}". Known constants are: ${Object.keys(physicsConstantsData).join(', ')}.`;
  },

  calculateForce: (params: { mass: number; acceleration: number }): string => {
    if (typeof params.mass !== 'number' || typeof params.acceleration !== 'number') {
      return "Error: Mass and acceleration must be numbers.";
    }
    const force = params.mass * params.acceleration;
    return `Using F = ma, the force is ${force} N (Newtons). Mass: ${params.mass} kg, Acceleration: ${params.acceleration} m/s²`;
  },

  calculateKineticEnergy: (params: { mass: number; velocity: number }): string => {
    if (typeof params.mass !== 'number' || typeof params.velocity !== 'number') {
      return "Error: Mass and velocity must be numbers.";
    }
    const energy = 0.5 * params.mass * Math.pow(params.velocity, 2);
    return `Using KE = ½mv², the kinetic energy is ${energy} J (Joules). Mass: ${params.mass} kg, Velocity: ${params.velocity} m/s`;
  }
};

// Math Agent Functions
const mathFunctions = {
  add: (params: { a: number; b: number }): string => {
    if (typeof params.a !== 'number' || typeof params.b !== 'number') {
      return "Error: Both parameters must be numbers.";
    }
    return `The sum of ${params.a} and ${params.b} is ${params.a + params.b}.`;
  },

  multiply: (params: { a: number; b: number }): string => {
    if (typeof params.a !== 'number' || typeof params.b !== 'number') {
      return "Error: Both parameters must be numbers.";
    }
    return `The product of ${params.a} and ${params.b} is ${params.a * params.b}.`;
  },

  solveQuadratic: (params: { a: number; b: number; c: number }): string => {
    const { a, b, c } = params;
    if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') {
      return "Error: All coefficients must be numbers.";
    }
    if (a === 0) return "Error: 'a' cannot be zero for a quadratic equation.";

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
      return `For equation ${a}x² + ${b}x + ${c} = 0, there are no real solutions (discriminant = ${discriminant}).`;
    } else if (discriminant === 0) {
      const x = -b / (2 * a);
      return `For equation ${a}x² + ${b}x + ${c} = 0, there is one solution: x = ${x}.`;
    } else {
      const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      return `For equation ${a}x² + ${b}x + ${c} = 0, the solutions are: x₁ = ${x1}, x₂ = ${x2}.`;
    }
  },

  calculateDerivative: (params: { polynomial: string }): string => {
    // Simple polynomial differentiation
    const terms = params.polynomial.replace(/\s+/g, '').replace('-', '+-').split('+').filter(t => t.length > 0);
    const differentiatedTerms = terms.map(term => {
      term = term.trim();
      if (term.match(/^-?\d+$/)) return "0"; // Constant

      const match = term.match(/(-?\d*\.?\d*)?x(?:\^(-?\d+\.?\d*))?/);
      if (!match) return `Cannot differentiate: ${term}`;

      let coeff = 1;
      if (match[1]) {
        if (match[1] === '-') coeff = -1;
        else if (match[1] !== '+') coeff = parseFloat(match[1]);
      }

      let power = 1;
      if (match[2]) power = parseFloat(match[2]);

      if (power === 0) return "0";

      const newCoeff = coeff * power;
      const newPower = power - 1;

      if (newPower === 0) return `${newCoeff}`;
      if (newPower === 1) return `${newCoeff === 1 ? '' : newCoeff === -1 ? '-' : newCoeff}x`;
      return `${newCoeff === 1 ? '' : newCoeff === -1 ? '-' : newCoeff}x^${newPower}`;
    });

    const finalTerms = differentiatedTerms.filter(t => t !== "0");
    const result = finalTerms.length === 0 ? "0" : finalTerms.join(" + ").replace(/\+ -/g, '- ');
    return `The derivative of ${params.polynomial} is ${result}.`;
  }
};

// Chemistry Agent Functions
const chemistryFunctions = {
  getElementInfo: (params: { element: string }): string => {
    const elementName = params.element.toLowerCase();
    const element = chemicalElementsData[elementName];
    if (element) {
      return `${elementName.charAt(0).toUpperCase() + elementName.slice(1)} (${element.symbol}) - Atomic Number: ${element.atomicNumber}, Atomic Mass: ${element.atomicMass} u. ${element.description}`;
    }
    return `Sorry, I don't have information for "${params.element}". Known elements: ${Object.keys(chemicalElementsData).join(', ')}.`;
  },

  balanceSimpleEquation: (params: { equation: string }): string => {
    // Very basic balancing for simple equations like H2 + O2 -> H2O
    const eq = params.equation.trim();
    if (eq.toLowerCase().includes("h2") && eq.toLowerCase().includes("o2") && eq.toLowerCase().includes("h2o")) {
      return `Balanced equation: 2H₂ + O₂ → 2H₂O (Synthesis of water)`;
    }
    return `I can help balance simple equations. For complex balancing, please provide the specific equation. Example provided: ${eq}`;
  },

  calculateMolarMass: (params: { compound: string }): string => {
    // Simple calculation for basic compounds
    const compound = params.compound.toLowerCase();
    // Masses defined but used implicitly in the hardcoded calculations below
    // const masses: { [key: string]: number } = { h: 1.008, o: 15.999, c: 12.011, n: 14.007 };

    if (compound === "h2o") {
      return `Molar mass of H₂O: (2 × 1.008) + (1 × 15.999) = 18.015 g/mol`;
    } else if (compound === "co2") {
      return `Molar mass of CO₂: (1 × 12.011) + (2 × 15.999) = 44.009 g/mol`;
    }
    return `I can calculate molar mass for basic compounds like H2O, CO2. For "${compound}", please provide the molecular formula.`;
  }
};

// Biology Agent Functions
const biologyFunctions = {
  explainPhotosynthesis: (): string => {
    return `Photosynthesis: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. Plants convert carbon dioxide and water into glucose and oxygen using sunlight and chlorophyll.`;
  },

  describeCellDivision: (params: { type: string }): string => {
    const divisionType = params.type.toLowerCase();
    if (divisionType === "mitosis") {
      return `Mitosis: Cell division producing two identical diploid cells. Phases: Prophase, Metaphase, Anaphase, Telophase. Used for growth and repair.`;
    } else if (divisionType === "meiosis") {
      return `Meiosis: Cell division producing four genetically different haploid gametes. Two divisions (I & II). Used for sexual reproduction.`;
    }
    return `I can explain mitosis or meiosis. You asked about: ${params.type}`;
  },

  explainDNA: (): string => {
    return `DNA (Deoxyribonucleic Acid): Double helix structure with four bases - Adenine (A), Thymine (T), Guanine (G), Cytosine (C). A pairs with T, G pairs with C. Stores genetic information.`;
  }
};

// History Agent Functions
const historyFunctions = {
  getHistoricalEvent: (params: { event: string }): string => {
    const eventName = params.event.toLowerCase();
    const event = historicalEventsData[eventName];
    if (event) {
      return `${params.event}: Occurred in ${event.year}. ${event.description}`;
    }
    return `Sorry, I don't have information for "${params.event}". Known events: ${Object.keys(historicalEventsData).join(', ')}.`;
  },

  compareTimePeriods: (params: { period1: string; period2: string }): string => {
    return `Comparing ${params.period1} and ${params.period2}: Both periods had significant cultural, political, and technological developments. Each shaped modern civilization in unique ways.`;
  }
};

// Literature Agent Functions
const literatureFunctions = {
  analyzePoetryDevice: (params: { device: string; example: string }): string => {
    const device = params.device.toLowerCase();
    const deviceExplanations: { [key: string]: string } = {
      metaphor: "A direct comparison between two unlike things without using 'like' or 'as'",
      simile: "A comparison using 'like' or 'as'",
      alliteration: "Repetition of initial consonant sounds",
      personification: "Giving human characteristics to non-human things"
    };

    const explanation = deviceExplanations[device] || "Literary device explanation not available";
    return `${device.charAt(0).toUpperCase() + device.slice(1)}: ${explanation}. Your example: "${params.example}"`;
  },

  explainNarrative: (params: { element: string }): string => {
    const element = params.element.toLowerCase();
    const narrativeElements: { [key: string]: string } = {
      plot: "The sequence of events in a story (exposition, rising action, climax, falling action, resolution)",
      character: "The people or beings who take part in the story's action",
      setting: "The time and place where the story occurs",
      theme: "The central message or underlying meaning of the story"
    };

    return narrativeElements[element] || `Narrative element "${params.element}" - please specify plot, character, setting, or theme.`;
  }
};

// Coding Agent Functions
const codingFunctions = {
  explainAlgorithm: (params: { algorithm: string }): string => {
    const algo = params.algorithm.toLowerCase();
    const algorithms: { [key: string]: string } = {
      "bubble sort": "Time: O(n²), Space: O(1). Repeatedly steps through list, compares adjacent elements and swaps them if wrong order.",
      "binary search": "Time: O(log n), Space: O(1). Searches sorted array by repeatedly dividing search interval in half.",
      "quick sort": "Time: O(n log n) average, Space: O(log n). Divide-and-conquer algorithm using pivot element.",
      "merge sort": "Time: O(n log n), Space: O(n). Divide-and-conquer algorithm that divides array and merges sorted halves."
    };

    return algorithms[algo] || `Algorithm "${params.algorithm}" - I can explain bubble sort, binary search, quick sort, merge sort.`;
  },

  debugCode: (params: { language: string; error: string }): string => {
    const lang = params.language.toLowerCase();
    const error = params.error.toLowerCase();

    if (error.includes("null") || error.includes("undefined")) {
      return `Common ${lang} null/undefined error: Check if variables are initialized before use. Use optional chaining (?.) or null checks.`;
    } else if (error.includes("syntax")) {
      return `${lang} syntax error: Check for missing semicolons, brackets, or parentheses. Verify proper indentation and quotes.`;
    }
    return `For ${lang} error "${params.error}": Check syntax, variable initialization, and logic flow. Use debugger or console logs.`;
  }
};

// Finance Agent Functions
const financeFunctions = {
  calculateCompoundInterest: (params: { principal: number; rate: number; time: number; frequency: number }): string => {
    const { principal, rate, time, frequency } = params;
    const amount = principal * Math.pow(1 + (rate / 100) / frequency, frequency * time);
    const interest = amount - principal;
    return `Compound Interest: Principal: $${principal}, Rate: ${rate}%, Time: ${time} years, Frequency: ${frequency}/year. Final Amount: $${amount.toFixed(2)}, Interest Earned: $${interest.toFixed(2)}`;
  },

  calculateROI: (params: { gain: number; cost: number }): string => {
    if (params.cost === 0) return "Error: Cost cannot be zero.";
    const roi = ((params.gain - params.cost) / params.cost) * 100;
    return `ROI = ((Gain - Cost) / Cost) × 100 = ((${params.gain} - ${params.cost}) / ${params.cost}) × 100 = ${roi.toFixed(2)}%`;
  }
};

// Health Agent Functions
const healthFunctions = {
  calculateBMI: (params: { weight: number; height: number }): string => {
    const bmi = params.weight / Math.pow(params.height, 2);
    let category = "";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal weight";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";

    return `BMI = ${bmi.toFixed(1)} (${category}). Formula: weight(kg) / height²(m). Weight: ${params.weight}kg, Height: ${params.height}m`;
  },

  explainNutrient: (params: { nutrient: string }): string => {
    const nutrient = params.nutrient.toLowerCase();
    const nutrients: { [key: string]: string } = {
      protein: "Builds and repairs tissues, makes enzymes and hormones. Sources: meat, fish, eggs, beans.",
      carbohydrates: "Primary energy source for the body. Sources: grains, fruits, vegetables.",
      fats: "Energy storage, insulation, vitamin absorption. Sources: oils, nuts, avocados.",
      vitamins: "Organic compounds essential for normal growth and development.",
      minerals: "Inorganic substances needed for bone health, nerve function, etc."
    };

    return nutrients[nutrient] || `Nutrient "${params.nutrient}" - I can explain protein, carbohydrates, fats, vitamins, minerals.`;
  }
};

// --- Gemini API Integration ---
let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Gemini API key is missing. Please check your .env file and ensure GEMINI_API_KEY is properly set.');
    throw new Error('Gemini API key is required. Check your .env configuration.');
  }
  
  try {
    console.log('Initializing Gemini with API key');
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Gemini:', error);
    throw new Error(`Failed to initialize Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const callGeminiAgent = async (systemPrompt: string, userQuery: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API not initialized. Call initializeGemini() first.');
  }

  try {
    console.log(`Calling Gemini with model: ${AGENT_CONFIG.GEMINI_MODEL}`);
    console.log(`System prompt: ${systemPrompt.substring(0, 100)}...`);
    console.log(`User query: ${userQuery}`);
    
    const model = genAI.getGenerativeModel({ model: AGENT_CONFIG.GEMINI_MODEL });
    // For Gemini 1.5, we need to use a different format without 'role'
    const combinedPrompt = `${systemPrompt}\n\nUser Query: ${userQuery}`;
    const result = await model.generateContent(combinedPrompt);
    const response = result.response;
    const responseText = response.text();
    
    console.log(`Gemini response: ${responseText.substring(0, 100)}...`);
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return `Sorry, I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// --- Agent System Prompts ---
const mainTutorSystemPrompt = `You are the Main Tutor Agent. Your job is to analyze user queries and decide whether to handle them yourself or delegate to specialist agents.

RESPONSE FORMAT - You must respond in exactly one of these formats:

1. To delegate to a specialist agent:
TO_AGENT: [agent_name]
[original_user_query]

2. To respond directly to user:
TO_USER: [your_response]

AVAILABLE AGENTS:
- math: arithmetic, algebra, calculus, equations
- physics: constants, mechanics, energy calculations
- chemistry: elements, equations, molecular calculations
- biology: life processes, cell division, genetics
- history: historical events, time periods
- literature: poetry devices, narrative elements
- coding: algorithms, debugging, programming concepts
- finance: interest calculations, ROI, investments
- health: BMI, nutrition, wellness information

DECISION RULES:
- If query contains math terms (add, solve, derivative, equation), delegate to math
- If query contains physics terms (force, energy, constant, physics), delegate to physics
- If query contains chemistry terms (element, molecule, reaction), delegate to chemistry
- If query contains biology terms (cell, DNA, photosynthesis), delegate to biology
- If query contains history terms (war, historical, timeline), delegate to history
- If query contains literature terms (poem, metaphor, story), delegate to literature
- If query contains coding terms (algorithm, debug, programming), delegate to coding
- If query contains finance terms (interest, investment, ROI), delegate to finance
- If query contains health terms (BMI, nutrition, health), delegate to health
- For greetings or general questions, respond directly

Examples:
User: "What is the speed of light?"
Response: TO_AGENT: physics
What is the speed of light?

User: "Hello, how can you help me?"
Response: TO_USER: Hello! I'm an AI tutor with expertise in math, physics, chemistry, biology, history, literature, coding, finance, and health. What would you like to learn about?`;

const createSpecialistSystemPrompt = (agentType: AgentId, functions: string[]): string => {
    return `You are the ${agentType.toUpperCase()} Specialist Agent. You MUST respond in one of these EXACT formats:
  
  1. To execute a function:
  EXECUTE_FUNCTION: [exact_function_name]
  PARAMS: {"param1": "value1", "param2": "value2"}
  
  2. To respond directly:
  TO_USER: [your detailed response]
  
  AVAILABLE FUNCTIONS for ${agentType}:
  ${functions.map(fn => `- ${fn}`).join('\n')}
  
  IMPORTANT: 
  - Use EXACT function names from the list above
  - Always include PARAMS line even if empty: PARAMS: {}
  - If you cannot use a function, use TO_USER format instead
  - Do NOT use any other response format
  
  Examples:
  For math questions: Use functions like "add", "multiply", "solveQuadratic", "calculateDerivative"
  For physics: Use "getPhysicsConstant", "calculateForce", "calculateKineticEnergy"
  For chemistry: Use "getElementInfo", "balanceSimpleEquation", "calculateMolarMass"
  
  Analyze the user query and choose the appropriate function or respond directly.`;
  };
// --- Agent Orchestration ---
export const processUserMessage = async (
  userInput: string,
): Promise<Message> => {
  try {
    if (!genAI) {
      initializeGemini();
    }

    // Step 1: Main Tutor Agent analyzes the query
    console.log('Step 1: Calling Main Tutor Agent');
    const mainAgentResponse = await callGeminiAgent(mainTutorSystemPrompt, userInput);
    const mainAgentParsed = parseMainAgentResponse(mainAgentResponse);
    console.log(`Main Agent parsed response type: ${mainAgentParsed.type}`);

    if (mainAgentParsed.type === 'TO_USER') {
      return createResponseMessage(mainAgentParsed.userResponse || "I'm here to help!", 'tutor');
    }

    if (mainAgentParsed.type === 'TO_AGENT' && mainAgentParsed.agentId) {
      const specialistAgentId = mainAgentParsed.agentId;
      const queryForSpecialist = mainAgentParsed.messageForSpecialist || userInput;

      // Step 2: Get specialist agent response
      console.log(`Step 2: Calling Specialist Agent: ${specialistAgentId}`);
      const { functions, functionMap } = getAgentFunctions(specialistAgentId);
      console.log(`Available functions for ${specialistAgentId}: ${Object.keys(functions).join(', ')}`);
      const specialistSystemPrompt = createSpecialistSystemPrompt(specialistAgentId, Object.keys(functions));
      
      const specialistResponse = await callGeminiAgent(specialistSystemPrompt, queryForSpecialist);
      const specialistParsed = parseSpecialistAgentResponse(specialistResponse);
      console.log(`Specialist Agent parsed response type: ${specialistParsed.type}`);
      console.log(`Specialist Agent response: ${specialistParsed.userResponse || specialistParsed.functionName}`);

      if (specialistParsed.type === 'TO_USER') {
        return createResponseMessage(specialistParsed.userResponse || "I couldn't process that request.", specialistAgentId);
      }

      if (specialistParsed.type === 'EXECUTE_FUNCTION' && specialistParsed.functionName) {
        // Step 3: Execute the function
        console.log(`Step 3: Executing function: ${specialistParsed.functionName}`);
        console.log(`Function parameters: ${JSON.stringify(specialistParsed.params || {})}`);
        const functionResult = executeFunction(
          specialistAgentId,
          specialistParsed.functionName,
          specialistParsed.params || {},
          functionMap
        );
        console.log(`Function execution result: ${functionResult.substring(0, 100)}...`);

        const responseContent = `${functionResult}\n\n🤖 Agent: ${specialistAgentId.toUpperCase()} | Function: ${specialistParsed.functionName}`;
        return createResponseMessage(responseContent, specialistAgentId);
      }
    }

    return createResponseMessage("I encountered an error processing your request.", 'tutor');
  } catch (error) {
    console.error('Error in processUserMessage:', error);
    return createResponseMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`, 'tutor');
  }
};

// --- Helper Functions ---
const parseMainAgentResponse = (responseText: string) => {
  console.log('Parsing main agent response');
  const lines = responseText.split('\n');
  const firstLine = lines[0].trim();
  console.log(`First line of response: ${firstLine}`);

  if (firstLine.startsWith('TO_AGENT:')) {
    const agentId = firstLine.substring('TO_AGENT:'.length).trim() as AgentId;
    const messageForSpecialist = lines.slice(1).join('\n').trim();
    console.log(`Delegating to agent: ${agentId}`);
    return { type: 'TO_AGENT' as const, agentId, messageForSpecialist };
  } else if (firstLine.startsWith('TO_USER:')) {
    const userResponse = responseText.substring('TO_USER:'.length).trim();
    console.log('Direct response to user');
    return { type: 'TO_USER' as const, userResponse };
  }
  
  console.log('No recognized format, treating as direct user response');
  return { type: 'TO_USER' as const, userResponse: responseText };
};

const parseSpecialistAgentResponse = (responseText: string) => {
  console.log('Parsing specialist agent response');
  const lines = responseText.split('\n');
  const firstLine = lines[0].trim();
  console.log(`First line of specialist response: ${firstLine}`);

  if (firstLine.startsWith('EXECUTE_FUNCTION:')) {
    const functionName = firstLine.substring('EXECUTE_FUNCTION:'.length).trim();
    console.log(`Function to execute: ${functionName}`);
    let params = {};

    const paramsLine = lines.find(line => line.trim().startsWith('PARAMS:'));
    if (paramsLine) {
      try {
        params = JSON.parse(paramsLine.substring('PARAMS:'.length).trim());
        console.log(`Parsed parameters: ${JSON.stringify(params)}`);
      } catch (e) {
        console.error("Failed to parse function params:", e);
      }
    } else {
      console.log('No parameters found in response');
    }

    return { type: 'EXECUTE_FUNCTION' as const, functionName, params };
  } else if (firstLine.startsWith('TO_USER:')) {
    const userResponse = responseText.substring('TO_USER:'.length).trim();
    console.log('Direct specialist response to user');
    return { type: 'TO_USER' as const, userResponse };
  }

  console.log('No recognized specialist format, treating as direct user response');
  return { type: 'TO_USER' as const, userResponse: responseText };
};

const getAgentFunctions = (agentId: AgentId) => {
  const functionMaps = {
    tutor: {}, // Added tutor property to match AgentId type
    math: mathFunctions,
    physics: physicsFunctions,
    chemistry: chemistryFunctions,
    biology: biologyFunctions,
    history: historyFunctions,
    literature: literatureFunctions,
    coding: codingFunctions,
    finance: financeFunctions,
    health: healthFunctions
  };

  const functionMap = functionMaps[agentId] || {};
  const functions = Object.keys(functionMap);

  return { functions, functionMap };
};

const executeFunction = (agentId: AgentId, functionName: string, params: FunctionCallParams, functionMap: Record<string, (params: FunctionCallParams) => string>): string => {
  console.log(`Executing function '${functionName}' for agent '${agentId}'`);
  try {
    if (functionName in functionMap) {
      console.log(`Function found, executing with params: ${JSON.stringify(params)}`);
      const result = functionMap[functionName](params);
      console.log(`Function execution successful`);
      return result;
    }
    console.log(`Function '${functionName}' not found for ${agentId} agent`);
    return `Function '${functionName}' not found for ${agentId} agent.`;
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return `Error executing ${functionName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

const createResponseMessage = (content: string, agent: AgentId): Message => {
  return {
    id: Date.now().toString(),
    content,
    sender: 'assistant',
    timestamp: new Date(),
    agent
  };
};
