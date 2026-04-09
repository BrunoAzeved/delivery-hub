import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, Sparkles, Terminal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';

export default function ChatAgent() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Delivery Hub Agent. I can help you manage Jira tasks, check GitHub PRs, and analyze Databricks trends using MCP. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Check if API Key exists
      const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
      
      if (hasApiKey) {
        // Initialize Gemini (only if key is valid)
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        // In a real implementation, we might use Gemini here to pre-process the message
      }
      
      // Call Backend for Agent Logic (which uses Mocks if real integrations aren't configured)
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      
      const data = await response.json();

      // Simulate a slightly delayed response for "thinking" feel
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          tools: data.tools_used
        }]);
        setIsTyping(false);
      }, 800);

    } catch (error) {
      console.error('Agent Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error connecting to the MCP servers. Please check your configuration.' }]);
      setIsTyping(false);
    }
  };

  const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Delivery Intelligence Agent</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full animate-pulse ${hasApiKey ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                {hasApiKey ? 'MCP Connected: Jira, GitHub, Databricks' : 'MOCK MODE: No API Key Detected'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!hasApiKey && (
            <Badge variant="outline" className="text-[10px] font-bold uppercase border-amber-200 text-amber-600 bg-amber-50">
              Local Test
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-bold uppercase border-neutral-200">v1.0-beta</Badge>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-neutral-100 text-black' : 'bg-black text-white'
                  }`}>
                    {msg.role === 'assistant' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="space-y-2">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'assistant' 
                        ? 'bg-neutral-50 border border-neutral-100 text-neutral-800' 
                        : 'bg-black text-white'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.tools && (
                      <div className="flex flex-wrap gap-2">
                        {msg.tools.map(tool => (
                          <div key={tool} className="flex items-center gap-1 text-[10px] font-mono bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 text-neutral-500">
                            <Terminal className="w-2.5 h-2.5" />
                            {tool}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-neutral-100 bg-white">
        <div className="relative flex items-center gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your Jira board, GitHub PRs or Databricks metrics..."
            className="flex-1 h-12 bg-neutral-50 border-neutral-200 rounded-xl px-4 text-sm focus-visible:ring-black"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="h-12 w-12 rounded-xl bg-black hover:bg-neutral-800 text-white shrink-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-neutral-400 mt-3 font-medium uppercase tracking-widest">
          Powered by Model Context Protocol & Gemini 3.0
        </p>
      </div>
    </div>
  );
}
