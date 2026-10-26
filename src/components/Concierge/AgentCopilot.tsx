'use client';

import React, { useState } from 'react';
import { parseAgentCommand, type AgentAction } from '@/lib/concierge/agentActions';

export interface AgentCopilotProps {
  readonly onExecuteAction: (action: AgentAction) => void;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

interface ChatMessage {
  readonly id: string;
  readonly sender: 'user' | 'agent';
  readonly text: string;
  readonly log?: readonly string[];
  readonly guardrailBlocked?: boolean;
}

const QUICK_CHIPS = [
  'Scale guest count to 420, add a Sangeet Soundcheck task to the critical path, and jump to the CPM Event Graph',
  'Launch Chaos Monkey disruption',
  'Scan vendor contract for predatory clauses',
  'Find nearby vendors',
];

const INITIAL_MESSAGES: readonly ChatMessage[] = [
  {
    id: 'msg-init',
    sender: 'agent',
    text: "Namaste! I'm your Jashn Agentic Copilot. I autonomously control and mutate your living plan. Tell me what to change!",
  },
];

function CopilotHeader({ onToggle }: { readonly onToggle: () => void }): React.JSX.Element {
  return (
    <div className="p-3.5 bg-gradient-to-r from-amber-800 to-amber-950 text-white rounded-t-3xl flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-base">🤖</span>
        <div>
          <h3 className="text-xs font-bold tracking-tight">Jashn Agentic AI Copilot</h3>
          <p className="text-[10px] text-amber-200">🛡️ Guardrails Active: Injection • PII • Bounds</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Close Agent Copilot"
        className="text-amber-200 hover:text-white p-1 rounded-lg text-xs"
      >
        ✕
      </button>
    </div>
  );
}

function ExecutionLogPills({ log }: { readonly log: readonly string[] }): React.JSX.Element {
  return (
    <div className="mt-2 pt-2 border-t border-amber-200/60 flex flex-wrap gap-1">
      {log.map((item, idx) => {
        const isShield = item.startsWith('🛡️');
        const color = isShield
          ? 'bg-rose-100 text-rose-900 border-rose-300'
          : 'bg-emerald-100 text-emerald-900 border-emerald-300';
        return (
          <span
            key={`log-${idx}`}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shadow-2xs ${color}`}
          >
            {item}
          </span>
        );
      })}
    </div>
  );
}

function ChatMessageBubble({ msg }: { readonly msg: ChatMessage }): React.JSX.Element {
  const isAgent = msg.sender === 'agent';
  const isBlocked = Boolean(msg.guardrailBlocked);
  const bubbleBg = isAgent
    ? isBlocked
      ? 'bg-rose-50 text-rose-950 border border-rose-300 rounded-tl-xs'
      : 'bg-amber-50/90 text-stone-800 border border-amber-200/80 rounded-tl-xs'
    : 'bg-amber-800 text-white rounded-tr-xs';

  return (
    <div className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
      <div className={`max-w-[85%] p-2.5 rounded-2xl text-xs ${bubbleBg}`}>
        {isBlocked && (
          <div className="flex items-center gap-1 font-bold text-rose-700 text-[10px] uppercase mb-1 border-b border-rose-200 pb-1">
            <span>🛡️</span>
            <span>AI Guardrail Intercepted: Input Blocked</span>
          </div>
        )}
        <p className="leading-relaxed">{msg.text}</p>
        {isAgent && msg.log && msg.log.length > 0 && <ExecutionLogPills log={msg.log} />}
      </div>
    </div>
  );
}

function MessageArea({
  messages,
  onSelectPrompt,
}: {
  readonly messages: readonly ChatMessage[];
  readonly onSelectPrompt: (p: string) => void;
}): React.JSX.Element {
  return (
    <div className="p-3 space-y-2.5 max-h-72 overflow-y-auto">
      {messages.map((m) => (
        <ChatMessageBubble key={m.id} msg={m} />
      ))}
      <div className="pt-2">
        <p className="text-[10px] font-bold uppercase text-stone-400 mb-1.5">Autonomous Agent Actions:</p>
        <div className="flex flex-col gap-1">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={`chip-${idx}`}
              type="button"
              onClick={() => onSelectPrompt(chip)}
              className="text-left text-[11px] p-1.5 rounded-lg bg-stone-100 hover:bg-amber-100/70 text-stone-700 hover:text-amber-900 transition-colors border border-stone-200/60 font-medium line-clamp-1"
            >
              ⚡ {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopilotInputForm({
  input,
  setInput,
  onSubmit,
}: {
  readonly input: string;
  readonly setInput: (v: string) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
}): React.JSX.Element {
  return (
    <form onSubmit={onSubmit} className="p-2.5 border-t border-stone-200 flex gap-1.5 bg-stone-50 rounded-b-3xl">
      <input
        type="text"
        id="copilot-command-input"
        aria-label="Ask Jashn AI Agent"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a command (e.g., Scale guests to 420...)"
        className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600"
      />
      <button
        type="submit"
        id="copilot-submit-btn"
        className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
      >
        Send
      </button>
    </form>
  );
}

function CopilotLauncherButton({ onToggle }: { readonly onToggle: () => void }): React.JSX.Element {
  return (
    <button
      type="button"
      id="copilot-launcher-btn"
      onClick={onToggle}
      aria-label="Open Jashn AI Agent Copilot"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white font-bold text-xs shadow-xl hover:scale-105 transition-transform border border-amber-400/40"
    >
      <span className="text-sm">💬</span>
      <span>Ask Jashn AI Agent</span>
    </button>
  );
}

function useCopilotMessages(onExecuteAction: (a: AgentAction) => void) {
  const [messages, setMessages] = useState<readonly ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const handleSendCommand = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, sender: 'user', text };
    const parsed = parseAgentCommand(text);
    const agentMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      sender: 'agent',
      text: parsed.reply,
      log: parsed.executionLog,
      guardrailBlocked: parsed.guardrailBlocked,
    };
    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput('');
    if (!parsed.guardrailBlocked) {
      for (const act of parsed.actions) onExecuteAction(act);
    }
  };

  return { messages, input, setInput, handleSendCommand };
}

/**
 * Intelligent Agentic Copilot providing conversational assistance and autonomous workspace execution.
 */
export function AgentCopilot({
  onExecuteAction,
  isOpen,
  onToggle,
}: AgentCopilotProps): React.JSX.Element {
  const { messages, input, setInput, handleSendCommand } = useCopilotMessages(onExecuteAction);

  if (!isOpen) return <CopilotLauncherButton onToggle={onToggle} />;

  return (
    <div
      role="dialog"
      aria-label="Agentic AI Copilot"
      className="fixed bottom-5 right-5 z-50 w-full sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <CopilotHeader onToggle={onToggle} />
      <MessageArea messages={messages} onSelectPrompt={handleSendCommand} />
      <CopilotInputForm
        input={input}
        setInput={setInput}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendCommand(input);
        }}
      />
    </div>
  );
}
