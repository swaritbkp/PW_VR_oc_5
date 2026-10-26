'use client';

import React, { useState } from 'react';
import { parseAgentCommand, type AgentAction } from '@/lib/concierge/agentActions';
import { MessageArea, type ChatMessage } from './CopilotMessageArea';

export interface AgentCopilotProps {
  readonly onExecuteAction: (action: AgentAction) => void;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

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

function CopilotDrawerDialog({
  onToggle,
  messages,
  input,
  setInput,
  onSend,
}: {
  readonly onToggle: () => void;
  readonly messages: readonly ChatMessage[];
  readonly input: string;
  readonly setInput: (v: string) => void;
  readonly onSend: (cmd: string) => void;
}): React.JSX.Element {
  return (
    <div
      role="dialog"
      aria-label="Agentic AI Copilot"
      className="fixed bottom-5 right-5 z-50 w-full sm:w-96 bg-white rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <CopilotHeader onToggle={onToggle} />
      <MessageArea messages={messages} onSelectPrompt={onSend} />
      <CopilotInputForm
        input={input}
        setInput={setInput}
        onSubmit={(e) => {
          e.preventDefault();
          onSend(input);
        }}
      />
    </div>
  );
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

  if (!isOpen) {
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

  return (
    <CopilotDrawerDialog
      onToggle={onToggle}
      messages={messages}
      input={input}
      setInput={setInput}
      onSend={handleSendCommand}
    />
  );
}
