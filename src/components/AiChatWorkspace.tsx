import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Terminal,
  Zap,
  Brain,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  timestamp: string;
}

export const AiChatWorkspace: React.FC = () => {
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: 'model',
      text: `**Ecom-Growth-Agent Online.**
Role: Elite Full-Stack E-commerce Architect & Growth Marketing CTO/CMO.

Primary Directives:
• Zero-cost headless Next.js & PostgreSQL architectures
• Google Merchant Center RSS 2.0 XML compliance & PMax scaling
• CJ Dropshipping inventory sync & marketing automation
• High-converting B2B wholesale outreach & Apollo lead processing

Select your reasoning tier above or submit an architecture directive below.`,
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || loading) return;

    setErrorMsg(null);
    const userMsg: ChatTurn = {
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with Growth Agent engine.');
      }

      const modelMsg: ChatTurn = {
        role: 'model',
        text: data.text,
        modelUsed: data.modelUsed || selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('[Chat Error]:', err);
      setErrorMsg(err.message || 'Execution failed. Check backend logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'model',
        text: 'Architect session cleared. Ready for new technical specifications.',
        modelUsed: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header & Model Selector */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Multi-Turn Architect Interface</span>
            <span aria-hidden="true">·</span>
            <span>Server-Side @google/genai</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Ecom-Growth-Agent AI Architect
          </h2>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs w-full sm:w-auto">
            <button
              onClick={() => setSelectedModel('gemini-4-argon')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded font-medium transition-colors text-center ${
                selectedModel === 'gemini-4-argon'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">gemini-4-argon (High Thinking)</span>
              <span className="sm:hidden">Argon (Thinking)</span>
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.8-flash')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded font-medium transition-colors text-center ${
                selectedModel === 'gemini-3.8-flash'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">gemini-3.8-flash (General)</span>
              <span className="sm:hidden">Flash</span>
            </button>

            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded font-medium transition-colors text-center ${
                selectedModel === 'gemini-3.1-flash-lite'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">gemini-3.1-flash-lite (Fast)</span>
              <span className="sm:hidden">Lite</span>
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Suggested Fast Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        <span className="text-slate-500 font-mono text-[11px] shrink-0">Quick Queries:</span>
        <button
          onClick={() =>
            handleSendMessage(
              'Provide Next.js App Router route for Google Merchant Center XML feed with PostgreSQL error handling.'
            )
          }
          className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          Next.js GMC Feed Route
        </button>
        <button
          onClick={() =>
            handleSendMessage(
              'How to resolve GMC account suspension for Misrepresentation and missing physical address for UK/US stores?'
            )
          }
          className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          GMC Misrepresentation Fix
        </button>
        <button
          onClick={() =>
            handleSendMessage(
              'Write a Node.js batch sync script for CJ Dropshipping to Supabase with inventory webhook alerting.'
            )
          }
          className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:border-emerald-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          CJ to Supabase Script
        </button>
      </div>

      {/* Scrollable Chat History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 h-[520px] overflow-y-auto space-y-4">
        {messages.map((turn, idx) => {
          const isUser = turn.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 space-y-2 border ${
                  isUser
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-950 text-slate-200 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[11px] opacity-70">
                  <span className="font-semibold">{isUser ? 'Engineer (You)' : 'Growth Agent Architect'}</span>
                  <div className="flex items-center gap-2">
                    {turn.modelUsed && !isUser && (
                      <span className="font-mono text-[10px] text-emerald-400">{turn.modelUsed}</span>
                    )}
                    <span>{turn.timestamp}</span>
                  </div>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs">{turn.text}</div>

                {!isUser && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleCopyMessage(turn.text, idx)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/40 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
                <Brain className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {selectedModel === 'gemini-4-argon'
                    ? 'Synthesizing technical response with ThinkingLevel.HIGH...'
                    : 'Generating response...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Execution Notice</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask architect (e.g., 'Write dynamic XML feed route with PostgreSQL', 'Explain GTIN check digit calculation')..."
          className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 text-slate-950 text-xs font-semibold rounded-lg hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
