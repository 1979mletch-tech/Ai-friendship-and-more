import { useState, useRef, useEffect, type FC } from 'react';
import { sendCustomerMessage, type CustomerAiResponse } from '../services/customerAiService';
import { getTradeCategoryGuidance } from '../config/pricingGuidance';
import type { TradeCategory } from '../types';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  escalated?: boolean;
}

interface CustomerAiChatProps {
  isOpen: boolean;
  onClose: () => void;
  onPreFillJob?: (jobData: { tradeCategory?: TradeCategory; description?: string; suggestedBudgetMin?: number; suggestedBudgetMax?: number }) => void;
}

export const CustomerAiChat: FC<CustomerAiChatProps> = ({ isOpen, onClose, onPreFillJob }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm Rushie, your BuildRush AI assistant. I'm here to help you describe repair jobs, check realistic UK price benchmarks, understand trade categories, or explain how our marketplace works.\n\nHow can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'tradesperson'>('customer');
  const [sessionId] = useState<string>(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return 'cust-sess-' + crypto.randomUUID()
    }
    return 'cust-sess-' + Date.now().toString(36)
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsgId = 'msg-' + Date.now();
    const userMsg: MessageItem = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const resp: CustomerAiResponse = await sendCustomerMessage({
        message: text,
        userRole: selectedRole,
        sessionId,
      });

      const assistantMsg: MessageItem = {
        id: 'resp-' + Date.now(),
        role: 'assistant',
        content: resp.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        escalated: resp.escalateToHuman,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content:
            "I'm sorry, I'm having trouble connecting to the network right now. Our support team can be reached at support@thebuildrush.com for urgent repair requests.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  const handlePriceGuidanceQuickCheck = (trade: TradeCategory) => {
    const g = getTradeCategoryGuidance(trade);
    const text = `What is the typical UK price range for ${g.displayName.toLowerCase()} work?`;
    handleSend(text);
  };

  return (
    <div className="buildrush-chat-overlay" role="dialog" aria-modal="true" aria-labelledby="chat-title">
      <div className="buildrush-chat-window">
        {/* Chat Header */}
        <div className="buildrush-chat-header">
          <div className="buildrush-chat-identity">
            <img
              src="/buildrush/customer-ai-avatar.svg"
              alt="Rushie avatar"
              className="buildrush-chat-avatar"
            />
            <div>
              <div className="buildrush-chat-name-row">
                <span id="chat-title" className="buildrush-chat-name">Rushie</span>
                <span className="buildrush-badge buildrush-badge-ai">AI ASSISTANT</span>
              </div>
              <p className="buildrush-chat-subtitle">BuildRush Customer &amp; Tradesperson Guide</p>
            </div>
          </div>
          <button
            type="button"
            className="buildrush-chat-close-btn"
            onClick={onClose}
            aria-label="Close AI Assistant chat"
          >
            ✕
          </button>
        </div>

        {/* Role Selector & Disclaimer */}
        <div className="buildrush-chat-banner">
          <div className="buildrush-role-toggle">
            <button
              type="button"
              className={`buildrush-role-pill ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => setSelectedRole('customer')}
            >
              I need work done
            </button>
            <button
              type="button"
              className={`buildrush-role-pill ${selectedRole === 'tradesperson' ? 'active' : ''}`}
              onClick={() => setSelectedRole('tradesperson')}
            >
              I am a Tradesperson
            </button>
          </div>
          <p className="buildrush-chat-disclaimer">
            Rushie is an AI. Quotes, pricing benchmarks and timings are estimates only and not contractual promises.
          </p>
        </div>

        {/* Messages List */}
        <div className="buildrush-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`buildrush-msg buildrush-msg-${m.role}`}>
              {m.role === 'assistant' && (
                <img
                  src="/buildrush/customer-ai-avatar.svg"
                  alt=""
                  className="buildrush-msg-avatar"
                  aria-hidden="true"
                />
              )}
              <div className="buildrush-msg-bubble">
                <div className="buildrush-msg-text">{m.content}</div>
                {m.escalated && (
                  <div className="buildrush-escalation-alert">
                    <strong>Support Escalation:</strong> A support ticket has been flagged. Our team will review within standard business hours.
                  </div>
                )}
                <span className="buildrush-msg-time">{m.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="buildrush-msg buildrush-msg-assistant">
              <img
                src="/buildrush/customer-ai-avatar.svg"
                alt=""
                className="buildrush-msg-avatar"
                aria-hidden="true"
              />
              <div className="buildrush-msg-bubble buildrush-msg-loading">
                <span className="buildrush-dot" />
                <span className="buildrush-dot" />
                <span className="buildrush-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="buildrush-chips-tray">
          <button
            type="button"
            className="buildrush-chip"
            onClick={() => handleQuickPrompt('How do I post a job and get bids?')}
          >
            📋 How to post a job
          </button>
          <button
            type="button"
            className="buildrush-chip"
            onClick={() => handlePriceGuidanceQuickCheck('plumbing')}
          >
            🔧 Plumbing rate check
          </button>
          <button
            type="button"
            className="buildrush-chip"
            onClick={() => handlePriceGuidanceQuickCheck('electrical')}
          >
            ⚡ Electrical rate check
          </button>
          <button
            type="button"
            className="buildrush-chip"
            onClick={() => handleQuickPrompt('Can I get a repair done today or within 48 hours?')}
          >
            ⏱️ Response timing
          </button>
          {onPreFillJob && (
            <button
              type="button"
              className="buildrush-chip buildrush-chip-action"
              onClick={() => {
                onClose();
                onPreFillJob({ tradeCategory: 'plumbing' });
              }}
            >
              ✍️ Open Job Post Form
            </button>
          )}
        </div>

        {/* Chat Input */}
        <form
          className="buildrush-chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="buildrush-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              selectedRole === 'customer'
                ? 'Describe your job or ask about pricing...'
                : 'Ask about subscriptions, jobs or alerts...'
            }
            disabled={loading}
          />
          <button
            type="submit"
            className="buildrush-chat-send-btn"
            disabled={loading || !inputValue.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
