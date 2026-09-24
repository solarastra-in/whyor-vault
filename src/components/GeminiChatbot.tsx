import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Zap, 
  Brain, 
  Cpu, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  ChevronRight,
  HelpCircle,
  Lock,
  Layers,
  CheckCircle2,
  FileQuestion
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

export interface AppVaultContext {
  screen?: string;
  isConfigured?: boolean;
  isLocked?: boolean;
  itemCount?: number;
  partitionCount?: number;
  userEmail?: string;
}

interface GeminiChatbotProps {
  appContext: AppVaultContext;
  theme?: 'light' | 'dark';
}

type ModelTier = 'fast' | 'general' | 'complex';

const MODEL_INFO: Record<ModelTier, { name: string; modelId: string; icon: any; desc: string; badge: string }> = {
  fast: {
    name: 'Fast Lite',
    modelId: 'gemini-3.1-flash-lite',
    icon: Zap,
    desc: 'Rapid micro-responses for quick next steps',
    badge: '⚡ Fast'
  },
  general: {
    name: 'Balanced',
    modelId: 'gemini-3.5-flash',
    icon: Brain,
    desc: 'General comprehensive operational guidance',
    badge: '🧠 Balanced'
  },
  complex: {
    name: 'Deep Pro',
    modelId: 'gemini-3.1-pro-preview',
    icon: Cpu,
    desc: 'Advanced reasoning on cryptographic enclave architecture',
    badge: '🔬 Deep Reason'
  },
};

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ appContext, theme = 'dark' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modelTier, setModelTier] = useState<ModelTier>('general');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Generate initial contextual welcome message
    const welcome = getContextualWelcome(appContext);
    return [
      {
        id: 'init-msg',
        role: 'model',
        content: welcome,
        modelUsed: 'gemini-3.5-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of thread on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  function getContextualWelcome(ctx: AppVaultContext): string {
    const s = ctx.screen || 'auth';
    if (s === 'auth') {
      return `👋 **Welcome to WhyOr Vault!** I'm your **Security Concierge & Next-Step Navigator**.\n\nYou are currently on the **Landing & Authentication Screen**.\n\n### What you should do next:\n1. **Sign in with Google OAuth** to establish your secure vault identity, or\n2. Click **"Test in Sandbox Mode"** for an immediate, zero-commitment interactive tour.\n\n*Zero-knowledge reminder:* Your master keys are always derived strictly in your local browser and never leave your device unencrypted.\n\nHow can I help you get started?`;
    } else if (s === 'setup') {
      return `🔐 **Vault Initialization Phase Detected!**\n\nYou are creating your cryptographic enclave. Here are your required next steps:\n\n1. **Choose a High-Entropy Master Passphrase** (minimum 12 chars).\n2. **Configure 3 Security Recovery Challenge Questions** (creates your emergency salt-splits).\n3. **Download your Emergency Master Recovery Key** and save it offline.\n\nAsk me anytime if you want advice on strong passphrases or recovery procedures!`;
    } else if (s === 'verify' || s === 'member_verify') {
      return `🛡️ **Enclave Locked Session**\n\nTo access your vault records, enter your **Master Passphrase** to derive your AES-256 session key.\n\n*Need to know what to do next?*\n- Enter your passphrase to unlock your active partition.\n- If you forgot your passphrase, you can click **"Use Master Key"** to activate catastrophic recovery.\n\nLet me know if you need assistance unlocking!`;
    } else if (s === 'vault') {
      return `🎉 **Vault Unlocked & Active!**\n\nYour cryptographic session is active (${ctx.itemCount ?? 0} items secured).\n\n### Top Recommended Next Steps:\n1. **Add your first sensitive credential:** Click **"+ Add Entry"** to encrypt a card, bank account, passport, or secret note.\n2. **Create Partitions:** Organize items into Personal, Family, or Business vaults.\n3. **Audit Security:** Check your **Vault Health Score**.\n4. **Set Up Estate Contingency:** Configure Nominated Trustee Escrow in Settings.\n\nWhat would you like to accomplish next?`;
    }
    return `👋 **Hello!** I am your **WhyOr Vault Next-Step Concierge**. Ask me anything about what to do next, how your zero-knowledge encryption works, or how to manage partitions!`;
  }

  // Quick contextual prompt suggestions
  const getQuickPrompts = (): string[] => {
    const s = appContext.screen || 'auth';
    if (s === 'auth') {
      return [
        'What should I do next?',
        'How does Zero-Knowledge protect my credentials?',
        'How does Sandbox Mode work?'
      ];
    } else if (s === 'setup') {
      return [
        'What makes a strong master passphrase?',
        'How do security challenge questions work?',
        'What is the Emergency Master Recovery Key?'
      ];
    } else if (s === 'verify' || s === 'member_verify') {
      return [
        'What do I do if I forgot my passphrase?',
        'How does the Emergency Master Key work?',
        'Is my data safe during brute-force attempts?'
      ];
    } else {
      return [
        'What should I do next to secure my vault?',
        'How do I create and share a Family Partition?',
        'How does Nominated Trustee Escrow work?',
        'How do I export an encrypted offline backup?'
      ];
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          modelMode: modelTier,
          appContext
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to reach Gemini Assistant');
      }

      const botMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        modelUsed: data.modelUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Gemini Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Connection Notice:** Unable to reach Gemini assistant (${err?.message || 'Server error'}). Please ensure your network is connected and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcome = getContextualWelcome(appContext);
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'model',
        content: welcome,
        modelUsed: MODEL_INFO[modelTier].modelId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Basic formatted markdown text renderer
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-sm text-indigo-300 mt-2 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={idx} className="font-bold text-sm text-white border-b border-slate-700/60 pb-1 mt-2.5 mb-1.5">
                {line.replace('## ', '')}
              </h3>
            );
          }

          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const clean = line.trim().replace(/^[\*\-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-indigo-400 mt-0.5">•</span>
                <span>{renderInlineStyles(clean)}</span>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-mono text-indigo-400 font-bold shrink-0">{numMatch[1]}.</span>
                <span>{renderInlineStyles(numMatch[2])}</span>
              </div>
            );
          }

          // Horizontal divider
          if (line.trim() === '---') {
            return <hr key={idx} className="border-slate-700/50 my-2" />;
          }

          return <p key={idx}>{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  // Inline formatting for **bold** and `code`
  const renderInlineStyles = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-[11px] border border-slate-700/50">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white rounded-full shadow-2xl shadow-indigo-950/60 border border-indigo-400/30 transition-all transform hover:scale-105 active:scale-95 group"
          title="Open Gemini Next-Step Navigator"
          aria-label="Open Gemini Next-Step Navigator"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-indigo-100 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-950" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold tracking-wide">Next-Step Navigator</span>
            <span className="text-[10px] text-indigo-200/80 font-mono">Gemini AI Concierge</span>
          </div>
        </button>
      )}

      {/* Chatbot Window Container */}
      {isOpen && (
        <div 
          className={`fixed z-50 flex flex-col bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl shadow-black/80 rounded-2xl overflow-hidden transition-all duration-200 ${
            isExpanded 
              ? 'inset-4 md:inset-8' 
              : 'bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-[440px] h-[640px] max-h-[calc(100vh-2rem)]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-100 tracking-wide">Next-Step Navigator</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Gemini
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Context: <strong className="text-slate-200 capitalize">{appContext.screen || 'auth'}</strong></span>
                  {appContext.itemCount !== undefined && (
                    <span className="text-slate-500">• {appContext.itemCount} items</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
                title={isExpanded ? "Collapse" : "Expand window"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">Model Tier:</span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(MODEL_INFO) as ModelTier[]).map((tier) => {
                const info = MODEL_INFO[tier];
                const Icon = info.icon;
                const isSelected = modelTier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setModelTier(tier)}
                    title={info.desc}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                      isSelected 
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950 font-bold' 
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Thread (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderFormattedText(msg.content)
                    )}
                  </div>
                  
                  {/* Meta badge */}
                  <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-slate-500 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-400/80">{msg.modelUsed.replace('gemini-', '')}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-slate-400 text-xs flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  <span className="font-mono text-[11px] animate-pulse">
                    Gemini ({MODEL_INFO[modelTier].modelId}) analyzing next steps...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/60 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Suggested:
            </span>
            {getQuickPrompts().map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] bg-slate-800/80 hover:bg-indigo-950/60 hover:text-indigo-200 hover:border-indigo-500/50 text-slate-300 border border-slate-700/60 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input & Action Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask what to do next, or how WhyOr Vault works..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition-colors disabled:text-slate-600 disabled:cursor-not-allowed shrink-0 shadow-sm shadow-indigo-950"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-500">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Zero-Knowledge Privacy: Keys never shared</span>
              </div>
              <span className="font-mono text-slate-600">Model: {MODEL_INFO[modelTier].modelId}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
