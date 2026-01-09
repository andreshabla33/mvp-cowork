
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const createTaskFunctionDeclaration: FunctionDeclaration = {
  name: 'createTask',
  parameters: {
    type: Type.OBJECT,
    description: 'Crea una nueva tarea en el tablero de Cowork.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'El título de la tarea.',
      },
      description: {
        type: Type.STRING,
        description: 'Descripción detallada de la tarea.',
      },
      startDate: {
        type: Type.STRING,
        description: 'Fecha de inicio en formato YYYY-MM-DD.',
      },
      dueDate: {
        type: Type.STRING,
        description: 'Fecha de entrega en formato YYYY-MM-DD.',
      },
    },
    required: ['title'],
  },
};

export const generateChatResponse = async (prompt: string, context: any) => {
  // Always initialize GoogleGenAI inside the function to use the most recent API key from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `Eres Viben, el asistente de IA del espacio de trabajo virtual "Cowork". 
        Contexto actual del espacio:
        Usuario: ${context.userName}
        Rol: ${context.role}
        Tareas Activas: ${context.tasks}
        
        Responde en Español de forma concisa y profesional. 
        Enfócate en la productividad del equipo.
        Tienes la capacidad de crear tareas si el usuario te lo pide explícitamente.
        La fecha actual es: ${new Date().toISOString().split('T')[0]}.`,
        tools: [{ functionDeclarations: [createTaskFunctionDeclaration] }],
        temperature: 0.7,
      }
    });

    return response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
