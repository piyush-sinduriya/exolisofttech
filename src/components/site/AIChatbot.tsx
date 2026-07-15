import { useState, useRef, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { chatWithAI } from "@/lib/contact.functions";

interface Message {
  role: "user" | "model";
  text: string;
}

const QUICK_OPTIONS = [
  { label: "Website Dev 🌐", value: "Tell me about website development services." },
  { label: "Mobile Apps 📱", value: "Tell me about custom mobile app development." },
  { label: "AI Automation 🤖", value: "Tell me about AI and chatbot automation." },
  { label: "Marketing 📈", value: "Tell me about ROI-driven digital marketing." },
  { label: "Free Strategy Call 📞", value: "How do I book a free strategy call?" },
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your Explisoft AI assistant. How can I help you build your next website, mobile app, or automation workflow today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendChat = useServerFn(chatWithAI);

  const handleOptionClick = async (optionValue: string) => {
    if (isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: optionValue }]);
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await sendChat({
        data: {
          message: optionValue,
          history: historyPayload,
        },
      });

      setMessages((prev) => [...prev, { role: "model", text: response.text }]);
    } catch (err) {
      console.error("[chatbot] failed to generate response from option click:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I experienced a brief server connection issue. Please feel free to call us at +91 9650680558 or email explisoft@gmail.com!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      // Map current history to format expected by validation schema
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await sendChat({
        data: {
          message: userMessage,
          history: historyPayload,
        },
      });

      setMessages((prev) => [...prev, { role: "model", text: response.text }]);
    } catch (err) {
      console.error("[chatbot] failed to generate response:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I experienced a brief server connection issue. Please feel free to call us at +91 9650680558 or email explisoft@gmail.com!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format text and detect links, emails, and phone numbers
  const renderMessageText = (text: string) => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const phoneRegex = /(\+91\s?\d{10}|\d{10})/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    let parts: React.ReactNode[] = [text];

    // Helper to replace text with react elements
    const replacePattern = (
      regex: RegExp,
      transform: (match: string, index: number) => React.ReactNode
    ) => {
      const newParts: React.ReactNode[] = [];
      parts.forEach((part) => {
        if (typeof part === "string") {
          const splitText = part.split(regex);
          const matches = part.match(regex);
          let matchIndex = 0;

          splitText.forEach((segment, i) => {
            newParts.push(segment);
            if (matches && i < splitText.length - 1) {
              newParts.push(transform(matches[matchIndex], matchIndex));
              matchIndex++;
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    };

    // Format emails
    replacePattern(emailRegex, (match, idx) => (
      <a key={`email-${idx}`} href={`mailto:${match}`} className="text-[color:var(--cyan)] underline hover:text-white transition-colors">
        {match}
      </a>
    ));

    // Format phone numbers
    replacePattern(phoneRegex, (match, idx) => (
      <a key={`phone-${idx}`} href={`tel:${match.replace(/\s+/g, "")}`} className="text-[color:var(--cyan)] underline hover:text-white transition-colors">
        {match}
      </a>
    ));

    // Format URLs
    replacePattern(urlRegex, (match, idx) => (
      <a key={`url-${idx}`} href={match} target="_blank" rel="noopener noreferrer" className="text-[color:var(--cyan)] underline hover:text-white transition-colors">
        {match}
      </a>
    ));

    return parts;
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <motion.button
          onClick={handleOpenToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand text-white shadow-[0_8px_30px_rgba(99,102,241,0.5)] border border-white/20 focus:outline-none"
          aria-label="Toggle AI Chatbot"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          
          {/* Unread Message Indicator Pulse */}
          {!isOpen && hasNewMessage && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border border-white text-[9px] font-bold items-center justify-center text-white">1</span>
            </span>
          )}
        </motion.button>
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-[9998] flex h-[500px] w-[350px] sm:w-[380px] flex-col rounded-3xl border border-white/10 bg-black/75 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header Banner */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
                  <Bot className="h-5 w-5 text-cyan-300" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-purple-600"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-sm font-bold text-white tracking-wide">
                    Explisoft Assistant
                    <Sparkles className="h-3 w-3 text-cyan-300 fill-cyan-300" />
                  </div>
                  <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">AI Assistant</span>
                </div>
              </div>
              <button
                onClick={handleOpenToggle}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, index) => {
                const isBot = m.role === "model";
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${!isBot ? "flex-row-reverse" : ""}`}
                  >
                    {/* Bubble Avatar icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border text-xs font-semibold ${
                        isBot
                          ? "bg-white/5 border-white/10 text-cyan-400"
                          : "bg-gradient-brand border-white/10 text-white"
                      }`}
                    >
                      {isBot ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                    </div>

                    {/* Bubble Text Card */}
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                        isBot
                          ? "rounded-tl-none bg-white/5 border border-white/5 text-foreground/90"
                          : "rounded-tr-none bg-gradient-brand text-white"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{renderMessageText(m.text)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Bot Loading Bubble */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white/5 border-white/10 text-cyan-400">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-white/5 border border-white/5 p-3.5 shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Options pills */}
            <div className="flex flex-wrap gap-1.5 px-4 py-2 border-t border-white/5 bg-black/20 max-h-[85px] overflow-y-auto">
              {QUICK_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleOptionClick(opt.value)}
                  className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-xs text-foreground/80 hover:bg-gradient-brand hover:text-white hover:border-transparent transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Input Submission Bar Footer */}
            <form onSubmit={handleSubmit} className="border-t border-white/5 p-3.5 bg-black/30 flex gap-2.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pricing, services, strategies..."
                maxLength={1000}
                required
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-foreground/45 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
