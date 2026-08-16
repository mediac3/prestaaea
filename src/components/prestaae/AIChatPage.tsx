'use client';

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Send, CalendarClock, Clock, BarChart3, AlertTriangle } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const suggestions = [
  { label: 'Próximos cobros', message: '¿Cuáles son los próximos cobros a realizar?', icon: CalendarClock },
  { label: 'Pagos pendientes', message: '¿Qué clientes tienen pagos pendientes?', icon: Clock },
  { label: 'Resumen del portafolio', message: 'Dame un resumen del portafolio actual', icon: BarChart3 },
  { label: 'Clientes morosos', message: '¿Cuáles clientes están en mora?', icon: AlertTriangle },
];

export default function AIChatPage() {
  const { user } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMessages([
      {
        role: 'ai',
        content:
          '¡Hola! Soy tu asistente de gestión de créditos. Puedo ayudarte con información sobre próximos cobros, clientes con pagos pendientes, estado del portafolio y más. ¿En qué te puedo ayudar?',
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          _audit: {
            userId: user?.id || '',
            userName: user?.name || '',
            userEmail: user?.email || '',
          },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: data.response || 'Lo siento, no pude generar una respuesta.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Error de conexión. Por favor, intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      {/* Suggestions Bar */}
      <div className="flex flex-wrap gap-2 flex-shrink-0">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => sendMessage(s.message)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#111827] border border-[#1E293B] rounded-xl text-sm text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <s.icon className="w-4 h-4 text-emerald-400" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div
        ref={containerRef}
        className="flex-1 bg-[#111827] border border-[#1E293B] rounded-2xl overflow-y-auto p-4 md:p-6 space-y-4 min-h-0"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-md'
                  : 'bg-slate-800 text-slate-200 rounded-bl-md border border-[#1E293B]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-[#1E293B] px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={loading}
          className="flex-1 bg-[#111827] border border-[#1E293B] rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center justify-center w-11 h-11 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
