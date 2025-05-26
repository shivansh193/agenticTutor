"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Calculator, Atom, Plus, Trash2, MessageSquare, Sparkles, Brain, Zap } from 'lucide-react';
import { processUserMessage, AgentId as ServiceAgentId } from './lib/agentService'; // UPDATED IMPORT PATH

// Types
export interface Message { // Export if used by agentService.ts
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  agent?: ServiceAgentId; // Use ServiceAgentId from agentService
  isLoading?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
  preview?: string;
}

interface Agent {
  id: ServiceAgentId; // Use ServiceAgentId
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  description: string;
}

// Agent configurations
const agents: Agent[] = [
  {
    id: 'tutor',
    name: 'AI Tutor',
    icon: Bot,
    color: 'from-purple-500 to-pink-500',
    description: 'Main tutoring assistant'
  },
  {
    id: 'math',
    name: 'Math Agent',
    icon: Calculator,
    color: 'from-blue-500 to-cyan-500',
    description: 'Mathematics specialist'
  },
  {
    id: 'physics',
    name: 'Physics Agent',
    icon: Atom,
    color: 'from-green-500 to-emerald-500',
    description: 'Physics specialist'
  },
  {
    id: 'chemistry',
    name: 'Chemistry Agent',
    icon: Zap,
    color: 'from-red-500 to-orange-500',
    description: 'Chemistry specialist'
  },
  {
    id: 'biology',
    name: 'Biology Agent',
    icon: Brain,
    color: 'from-teal-500 to-green-500',
    description: 'Biology specialist'
  },
  {
    id: 'history',
    name: 'History Agent',
    icon: MessageSquare,
    color: 'from-amber-500 to-yellow-500',
    description: 'History specialist'
  },
  {
    id: 'literature',
    name: 'Literature Agent',
    icon: MessageSquare,
    color: 'from-rose-500 to-pink-500',
    description: 'Literature specialist'
  },
  {
    id: 'coding',
    name: 'Coding Agent',
    icon: Bot,
    color: 'from-indigo-500 to-blue-500',
    description: 'Coding specialist'
  },
  {
    id: 'finance',
    name: 'Finance Agent',
    icon: Bot,
    color: 'from-emerald-500 to-teal-500',
    description: 'Finance specialist'
  },
  {
    id: 'health',
    name: 'Health Agent',
    icon: Brain,
    color: 'from-sky-500 to-blue-500',
    description: 'Health specialist'
  }
];

// Custom hook for chat management
const useChat = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with a default session
  useEffect(() => {
    const defaultSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Welcome Chat',
      timestamp: new Date().toISOString(),
      messages: [{
        id: '1',
        content: "Hello! I'm your AI Tutor. I can help you with mathematics and physics. What would you like to learn today?",
        sender: 'assistant',
        timestamp: new Date(),
        agent: 'tutor'
      }],
      preview: "Hello! I'm your AI Tutor..."
    };
    setSessions([defaultSession]);
    setCurrentSession(defaultSession);
    setMessages(defaultSession.messages);
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: new Date().toISOString(),
      messages: [],
      preview: ''
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    setMessages([]);
  }, []);

  const switchSession = useCallback((session: ChatSession) => {
    setCurrentSession(session);
    setMessages(session.messages);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      // If current session is deleted, try to switch to the first available, or create new
      if (sessions.length > 1) {
        const newCurrent = sessions.find(s => s.id !== sessionId);
        if (newCurrent) {
          switchSession(newCurrent);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    }
  }, [currentSession, createNewSession, sessions, switchSession]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentSession) return;

    console.log('User sending message:', content);

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    // Create a temporary loading message that matches the structure of other assistant messages
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(), // Unique ID
      content: '', // Placeholder for actual content
      sender: 'assistant',
      timestamp: new Date(),
      agent: 'tutor', // Default to tutor, will be updated by actual response
      isLoading: true,
    };
    
    // Add user message and loading message to the UI immediately
    // Pass current messages to setMessages to ensure we're working with the latest state
    setMessages(prevMessages => [...prevMessages, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      // Call the new agent service
      // The context (previous messages) could be passed to processUserMessage if needed by agents
      // const contextMessages = messages; // or prevMessages from setMessages
      const assistantMessage = await processUserMessage(content /*, contextMessages */);

      // Replace the loading message with the actual assistant message
      setMessages(prevMessages => {
        const updated = [...prevMessages];
        const loadingMsgIndex = updated.findIndex(msg => msg.isLoading === true);
        if (loadingMsgIndex !== -1) {
          updated[loadingMsgIndex] = assistantMessage;
        } else {
          // Fallback if loading message wasn't found (should not happen in normal flow)
          updated.push(assistantMessage);
        }
        return updated;
      });
      
      // Update session (after state has been updated with the final assistant message)
      // Use a callback with setSessions and setCurrentSession to ensure latest state
      setSessions(prevSessions => {
        return prevSessions.map(s => {
          if (s.id === currentSession.id) {
            // Construct messages for session update using the state *after* assistant message is set
            // This requires a bit of care since setMessages is async
            // A safer way might be to construct updatedMessages directly here
            const finalMessagesForSession = [...messages, userMessage, assistantMessage].filter(m => !m.isLoading);

            return {
              ...s,
              messages: finalMessagesForSession,
              preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              title: finalMessagesForSession.length === 2 ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : s.title,
              timestamp: new Date().toISOString() // Update timestamp
            };
          }
          return s;
        });
      });
      setCurrentSession(prevCurrent => {
        if (prevCurrent && prevCurrent.id === currentSession.id) {
          const finalMessagesForSession = [...messages, userMessage, assistantMessage].filter(m => !m.isLoading);
          return {
            ...prevCurrent,
            messages: finalMessagesForSession,
            preview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            title: finalMessagesForSession.length === 2 ? content.substring(0, 30) + (content.length > 30 ? '...' : '') : prevCurrent.title,
            timestamp: new Date().toISOString()
          };
        }
        return prevCurrent;
      });


    } catch (error) {
      console.error('Error sending message via agent service:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Sorry, I encountered an error trying to process your request.",
        sender: 'assistant',
        timestamp: new Date(),
        agent: 'tutor'
      };
      // Replace loading message with error message
       setMessages(prev => {
        const updated = prev.filter(msg => !msg.isLoading);
        return [...updated, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, messages]); // Added messages to dependency array for context construction if needed

  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage
  };
};

// Message Bubble Component (Mostly unchanged, ensure agent.id checks work with new AgentId type)
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const agentInfo = agents.find(a => a.id === message.agent); // Renamed for clarity
  const IconComponent = agentInfo?.icon || (message.sender === 'user' ? User : Bot);

  return (
    <div className={`flex gap-3 mb-6 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fadeInUp`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        message.sender === 'user' 
          ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
          : `bg-gradient-to-br ${agentInfo?.color || 'from-gray-500 to-gray-600'}`
      } shadow-lg`}>
        {message.sender === 'user' ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <IconComponent className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={`max-w-[70%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
        {message.sender === 'assistant' && agentInfo && (
          <div className="flex items-center gap-2 mb-1">
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              agentInfo.id === 'math' ? 'bg-blue-500/20 text-blue-300' :
              agentInfo.id === 'physics' ? 'bg-green-500/20 text-green-300' :
              agentInfo.id === 'chemistry' ? 'bg-red-500/20 text-red-300' :
              agentInfo.id === 'biology' ? 'bg-teal-500/20 text-teal-300' :
              agentInfo.id === 'history' ? 'bg-amber-500/20 text-amber-300' :
              agentInfo.id === 'literature' ? 'bg-rose-500/20 text-rose-300' :
              agentInfo.id === 'coding' ? 'bg-indigo-500/20 text-indigo-300' :
              agentInfo.id === 'finance' ? 'bg-emerald-500/20 text-emerald-300' :
              agentInfo.id === 'health' ? 'bg-sky-500/20 text-sky-300' :
              'bg-purple-500/20 text-purple-300'
            }`}>
              <div className="flex items-center gap-1">
                <IconComponent className="w-3 h-3" />
                <span>{agentInfo.name}</span>
              </div>
            </div>
            {agentInfo.id !== 'tutor' && (
              <div className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Specialized Agent</span>
              </div>
            )}
          </div>
        )}
        
        <div className={`p-4 rounded-2xl shadow-lg backdrop-blur-sm ${
          message.sender === 'user'
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : message.agent === 'math' ? 'bg-blue-900/30 border border-blue-700/30 text-gray-100' :
              message.agent === 'physics' ? 'bg-green-900/30 border border-green-700/30 text-gray-100' :
              message.agent === 'chemistry' ? 'bg-red-900/30 border border-red-700/30 text-gray-100' :
              message.agent === 'biology' ? 'bg-teal-900/30 border border-teal-700/30 text-gray-100' :
              message.agent === 'history' ? 'bg-amber-900/30 border border-amber-700/30 text-gray-100' :
              message.agent === 'literature' ? 'bg-rose-900/30 border border-rose-700/30 text-gray-100' :
              message.agent === 'coding' ? 'bg-indigo-900/30 border border-indigo-700/30 text-gray-100' :
              message.agent === 'finance' ? 'bg-emerald-900/30 border border-emerald-700/30 text-gray-100' :
              message.agent === 'health' ? 'bg-sky-900/30 border border-sky-700/30 text-gray-100' :
              'bg-white/10 border border-white/20 text-gray-100'
        } ${message.isLoading ? 'animate-pulse' : ''}`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-400">AI is thinking...</span>
            </div>
          ) : (
            <div>
              {message.agent && message.agent !== 'tutor' && message.sender === 'assistant' && (
                <div className="mb-2 text-xs text-gray-400 italic">
                  Using specialized {message.agent === 'math' ? 'mathematics' : 
                                    message.agent === 'physics' ? 'physics' : 
                                    message.agent === 'chemistry' ? 'chemistry' : 
                                    message.agent === 'biology' ? 'biology' : 
                                    message.agent === 'history' ? 'history' : 
                                    message.agent === 'literature' ? 'literature' : 
                                    message.agent === 'coding' ? 'coding' : 
                                    message.agent === 'finance' ? 'finance' : 
                                    message.agent === 'health' ? 'health' : 
                                    message.agent} knowledge to answer this question...
                </div>
              )}
              <div className="text-sm leading-relaxed">
                {message.content.split('\n').map((paragraph, index) => {
                  let processedParagraph = paragraph;
                  
                  const agentPrefixRegex = /(Math Agent:|Physics Agent:|Chemistry Agent:|Biology Agent:|History Agent:|Literature Agent:|Coding Agent:|Finance Agent:|Health Agent:|AI Tutor:|Tutor Agent:)\s*(.*)/i;
                  const agentPrefixMatch = paragraph.match(agentPrefixRegex);
                  
                  let agentPrefix = '';
                  let contentWithoutPrefix = processedParagraph;
                  
                  if (agentPrefixMatch) {
                    agentPrefix = agentPrefixMatch[1];
                    contentWithoutPrefix = agentPrefixMatch[2];
                    processedParagraph = contentWithoutPrefix;
                  }
                  
                  const toolsUsedRegex = /Tools Used:\s*(.+)/i;
                  const toolsUsedMatch = processedParagraph.match(toolsUsedRegex);
                  
                  if (toolsUsedMatch) {
                    return ( // Return directly to avoid further processing for tools line
                        <div key={index} className="mt-3 pt-2 border-t border-gray-700/50">
                          <span className="text-xs font-semibold text-gray-400">Tools Used:</span> 
                          <span className="text-xs bg-gray-800/50 px-2 py-1 rounded-md ml-2">{toolsUsedMatch[1]}</span>
                        </div>
                      );
                  }
                  
                  if (processedParagraph.includes('=') || 
                      /[a-z]\^[0-9]/.test(processedParagraph) || 
                      processedParagraph.includes('sqrt')) {
                    if (/^\s*([a-zA-Z0-9\s\+\-\*\/\(\)=\^\.\<\>]|=>)+\s*$/.test(processedParagraph) && !agentPrefix) { // Don't format prefix line as equation
                      processedParagraph = `<div class="my-2 py-1 px-2 bg-gray-800/30 rounded-md text-center">${processedParagraph}</div>`;
                    }
                  }
                  
                  if (agentPrefix) {
                    let agentClass = '';
                    if (agentPrefix.toLowerCase().includes('math')) agentClass = 'border-blue-500/50';
                    else if (agentPrefix.toLowerCase().includes('physics')) agentClass = 'border-green-500/50';
                    else agentClass = 'border-purple-500/50';
                    
                    return (
                      <div key={index} className={`my-1 p-1 border-l-2 ${agentClass} pl-2 text-xs italic`}>
                        <div className="font-medium mb-0.5">{agentPrefix}</div>
                        <div dangerouslySetInnerHTML={{ __html: contentWithoutPrefix }} />
                      </div>
                    );
                  }
                  
                  return paragraph ? (
                    <p key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: processedParagraph }} />
                  ) : <br key={index} />;
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

// Chat Sidebar Component (Unchanged)
const ChatSidebar: React.FC<{
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}> = ({ sessions, currentSession, onSelectSession, onNewChat, onDeleteSession }) => {
  return (
    <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Tutor</h1>
            <p className="text-sm text-gray-400">Multi-Agent Learning Assistant</p>
          </div>
        </div>
        
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                currentSession?.id === session.id
                  ? 'bg-white/10 border border-white/20'
                  : 'hover:bg-white/5'
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {session.title}
                  </h3>
                  {session.preview && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                      {session.preview}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Suggested Question Component
const SuggestedQuestion: React.FC<{
  question: string;
  onClick: () => void;
  bgColor: string;
}> = ({ question, onClick, bgColor }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs text-white bg-gradient-to-r ${bgColor} hover:opacity-90 transition-opacity duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95`}
    >
      {question}
    </button>
  );
};

// Input Area Component (Unchanged)
const InputArea: React.FC<{
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'; // Max height 120px
  };

  return (
    <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="relative flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about math, physics, or any subject..."
            className="w-full p-4 pr-12 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '120px' }} // Ensure minHeight is applied
            disabled={isLoading}
          />
          {input && ( // Show char count only if there's input
            <div className="absolute right-3 bottom-3"> {/* Adjusted position */}
              <div className="text-xs text-gray-400">
                {input.length}/1000 {/* Example max length */}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Suggested Questions */}
      <div className="mt-4">
        <div className="text-xs text-gray-400 mb-2">Try asking:</div>
        <div className="flex flex-wrap gap-2">
          <SuggestedQuestion 
            question="What is the molar mass of hydrogen?" 
            onClick={() => {
              setInput("What is the molar mass of hydrogen?");
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
              }
            }}
            bgColor="from-red-500 to-orange-500" // Chemistry
          />
          <SuggestedQuestion 
            question="Calculate kinetic energy of an object moving at 5m/s with mass of 5 grams" 
            onClick={() => {
              setInput("Calculate kinetic energy of an object moving at 5m/s with mass of 5 grams");
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
              }
            }}
            bgColor="from-green-500 to-emerald-500" // Physics
          />
          <SuggestedQuestion 
            question="What is Avogadro's constant?" 
            onClick={() => {
              setInput("What is Avogadro's constant?");
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
              }
            }}
            bgColor="from-red-500 to-orange-500" // Chemistry
          />
          <SuggestedQuestion 
            question="Explain the process of photosynthesis" 
            onClick={() => {
              setInput("Explain the process of photosynthesis");
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
              }
            }}
            bgColor="from-teal-500 to-green-500" // Biology
          />
          <SuggestedQuestion 
            question="Calculate compound interest on $1000 at 5% for 3 years" 
            onClick={() => {
              setInput("Calculate compound interest on $1000 at 5% for 3 years");
              if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
              }
            }}
            bgColor="from-emerald-500 to-teal-500" // Finance
          />
        </div>
      </div>
      
      <div className="flex items-center justify-center mt-4 gap-6 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Multi-Agent AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>Instant Expert Help</span>
        </div>
      </div>
    </div>
  );
};


// Main Chat Interface Component (Unchanged structure, uses the modified useChat hook)
const ChatInterface: React.FC = () => {
  const {
    sessions,
    currentSession,
    messages,
    isLoading,
    createNewSession,
    switchSession,
    deleteSession,
    sendMessage
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages change

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={switchSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Chat Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {currentSession?.title || 'AI Tutor Chat'}
              </h2>
              <p className="text-sm text-gray-400">
                Get help with math, physics, and more
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-gray-400">Online</span>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !currentSession?.messages.find(m => m.id === '1') ? ( // Check for initial welcome message too
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Start a Conversation!</h3>
              <p className="text-gray-400 mb-8 max-w-md">
                Ask a question about math or physics to get started. For example: &quot;What is the speed of light?&quot; or &quot;Add 5 and 7&quot;.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                {agents.map((agent) => {
                  const IconComponent = agent.icon;
                  return (
                    <div key={agent.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center mb-3`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-medium text-white mb-1">{agent.name}</h4>
                      <p className="text-sm text-gray-400">{agent.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <InputArea onSendMessage={sendMessage} isLoading={isLoading} />
      </div>

      <style jsx global>{` // Changed to global for keyframes and utility classes potentially used outside this specific component scope if refactored
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;