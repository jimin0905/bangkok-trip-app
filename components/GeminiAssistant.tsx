import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

const GeminiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '您好，我是您的曼谷私人嚮導。請問有什麼可以協助您？' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const historyForApi = messages
        .filter(m => !m.isError)
        .map(m => ({ role: m.role, text: m.text }));

      const { text, sources } = await sendMessageToGemini(userMessage, historyForApi);
      
      setMessages(prev => [
        ...prev, 
        { role: 'model', text, sources }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { role: 'model', text: '連線異常，請稍後再試。', isError: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Button - Minimalist Style */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-stone-800 text-white p-4 rounded-full shadow-lg hover:bg-stone-700 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        aria-label="Open AI Assistant"
      >
        <Sparkles size={20} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#F9F9F7] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="bg-stone-800 p-4 text-white flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center">
              <Sparkles size={16} className="text-orange-200" />
            </div>
            <div>
              <h3 className="font-medium text-sm tracking-wide">Bangkok Buddy</h3>
              <p className="text-[10px] text-stone-300 uppercase tracking-wider">AI Concierge</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="hover:bg-stone-700 p-2 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-stone-800 text-white rounded-br-none' 
                    : 'bg-white text-stone-700 border border-stone-100 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Sources</p>
                    <ul className="space-y-1">
                      {msg.sources.map((src, i) => (
                        <li key={i}>
                          <a 
                            href={src.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs underline opacity-90 hover:opacity-100 truncate"
                          >
                            <ExternalLink size={10} />
                            {src.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2 text-stone-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-stone-100">
          <div className="flex gap-2 items-center bg-stone-50 rounded-full px-2 border border-stone-200 focus-within:border-stone-400 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 bg-transparent text-stone-800 placeholder-stone-400 px-3 py-3 text-sm focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 text-stone-800 hover:text-stone-600 disabled:opacity-30 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default GeminiAssistant;