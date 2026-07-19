export interface AlahiaAiChatRequest {
  idEmpresa: number;
  idUsuario: number;
  conversationId?: string | null;
  message: string;
  modulosPermitidos: string[];
}

export interface AlahiaAiChatResponse {
  conversationId: string;
  answer: string;
  intent: string;
  usedLlm: boolean;
  provider: string;
  suggestTicket: boolean;
  insights: string[];
}

export interface AlahiaAiResumenResponse {
  greeting: string;
  bullets: string[];
  provider: string;
  usedLlm: boolean;
  generatedAt: string;
}

export interface AlahiaAiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: Date;
  suggestTicket?: boolean;
}

/** Preguntas rápidas compartidas (hub, FAB, dashboard). */
export const ALAHIA_AI_TIPS: readonly string[] = [
  '¿Cuánto vendí hoy?',
  '¿Qué clientes me deben dinero?',
  '¿Qué productos tienen poco inventario?',
  '¿Cuál fue mi utilidad este mes?',
  '¿Cómo está mi caja y bancos?',
  '¿Cuáles son mis productos más rentables?',
  '¿Cuántos clientes tengo?',
  '¿Cuáles fueron mis gastos más altos?',
  '¿Qué facturas están vencidas?'
];
