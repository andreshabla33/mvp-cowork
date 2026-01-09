
import React, { useState, useRef, useEffect } from 'react';
import { generateChatResponse } from '../services/geminiService';
import { useStore } from '../store/useStore';
import { TaskStatus, Task } from '../types';

interface Message {
  role: 'user' | 'viben';
  text: string;
  timestamp: number;
}

interface VibenAssistantProps {
  onClose: () => void;
}

const STORAGE_KEY = 'viben_chat_history';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const VibenAssistant: React.FC<VibenAssistantProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { tasks, currentUser, addTask } = useStore();
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        const validMessages = parsed.filter(m => now - m.timestamp < THIRTY_DAYS_MS);
        
        if (validMessages.length > 0) {
          setMessages(validMessages);
        } else {
          setMessages([{ 
            role: 'viben', 
            text: '¡Hola! Soy Viben. ¿En qué puedo ayudarte hoy?', 
            timestamp: now 
          }]);
        }
      } catch (error) {
        console.error("Error parsing chat history:", error);
      }
    } else {
      setMessages([{ 
        role: 'viben', 
        text: '¡Hola! Soy Viben. ¿En qué puedo ayudarte hoy?', 
        timestamp: now 
      }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isMinimized]);

  const handleStopExecution = () => {
    abortControllerRef.current = true;
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    const now = Date.now();
    setInput('');
    abortControllerRef.current = false;
    
    const newUserMessage: Message = { role: 'user', text: userMsg, timestamp: now };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      const context = {
        tasks: tasks.map(t => `${t.title} (${t.status})`).join(', '),
        userName: currentUser.name,
        role: currentUser.role
      };
      
      const response = await generateChatResponse(userMsg, context);
      
      if (abortControllerRef.current) return;

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'createTask') {
            const args = fc.args as any;
            const newTask: Task = {
              id: Math.random().toString(36).substr(2, 9),
              title: args.title || 'Nueva Tarea',
              description: args.description || '',
              startDate: args.startDate,
              dueDate: args.dueDate,
              status: TaskStatus.TODO,
              attachments: [],
            };
            addTask(newTask);
            
            const confirmationMsg: Message = {
              role: 'viben',
              text: `✅ He creado la tarea: "${newTask.title}".`,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, confirmationMsg]);
          }
        }
      } else {
        const textResponse = response.text || "Lo siento, no pude procesar tu solicitud.";
        const newVibenMessage: Message = { role: 'viben', text: textResponse, timestamp: Date.now() };
        setMessages(prev => [...prev, newVibenMessage]);
      }
    } catch (error) {
      if (abortControllerRef.current) return;
      const errorMessage: Message = { 
        role: 'viben', 
        text: 'Lo siento, tuve un problema. Intenta de nuevo.', 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex flex-col bg-zinc-900 border border-indigo-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 ease-in-out w-full ${isMinimized ? 'h-[56px]' : 'h-[480px] max-h-[75vh]'}`}>
      {/* Header - Compacto */}
      <div 
        onClick={() => setIsMinimized(!isMinimized)}
        className="bg-indigo-600 p-3 flex items-center justify-between shadow-md z-10 cursor-pointer hover:bg-indigo-700 transition-colors shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center animate-pulse text-xs">✨</div>
          <div>
            <h3 className="text-[11px] font-black leading-tight text-white uppercase tracking-wider">Viben Assistant</h3>
            <p className="text-[8px] text-indigo-200 uppercase font-bold">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className={`transition-transform duration-300 ${isMinimized ? 'rotate-180' : ''}`}>
              <svg className="w-3.5 h-3.5 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
           </div>
           <button 
             onClick={(e) => { e.stopPropagation(); onClose(); }} 
             className="text-indigo-200 hover:text-white transition-colors p-1"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-950 scroll-smooth custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-xl px-3 py-2 text-[11px] shadow-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-zinc-800 text-zinc-300 rounded-bl-none border border-zinc-700/50'
                }`}>
                  {m.text}
                  <div className={`text-[7px] mt-1 opacity-40 font-bold ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center gap-2">
                <div className="bg-zinc-800 rounded-xl px-3 py-2 text-[10px] text-zinc-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <button 
                  onClick={handleStopExecution}
                  className="text-red-500 text-[8px] font-black uppercase tracking-widest hover:underline"
                >
                  Detener
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-zinc-900 border-t border-zinc-800 shrink-0">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe aquí..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[11px] text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder:opacity-20"
              />
              <button onClick={handleSend} disabled={isTyping} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 p-2.5 rounded-xl transition-all shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
