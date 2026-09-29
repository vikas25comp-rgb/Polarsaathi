import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  ShieldAlert,
  HelpCircle,
  Package,
  Layers,
  Wrench,
  Users,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Database,
  CloudSun,
  Activity,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Check,
  X,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { dataStore } from '../../lib/dataStore';
import { useAuth } from '../../context/AuthContext';

interface ToolEvent {
  id: string;
  toolName: string;
  params: any;
  resultSummary: string;
  timestamp: string;
}

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  targetStationId: string;
  actionType: string;
  impact?: string;
  parameters?: Record<string, any>;
  targetId?: string;
  createdAt?: string;
  status?: 'pending' | 'executed' | 'rejected';
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  toolEvents?: ToolEvent[];
  sources?: string[];
  recommendedAction?: RecommendedAction;
}

export const AiAssistantTab: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `### 🌟 Hello Explorer! Welcome to DHRUVYAN!
I am your **Polar Station Helper**! Think of this website like a superhero control room for our brave scientists living in the coldest, iciest places on Earth — Antarctica and the Arctic!

### 🏠 What is Happening at Our Bases Right Now
- **Bharati Base (Antarctica):** Cold and snowy (-24°C), everyone is cozy inside doing science!
- **Maitri Base (Antarctica):** Very chilly (-31°C), the warm heaters are humming happily!
- **Himadri Base (in the Arctic):** Cold and brisk (-12°C), watching the snowy polar skies!
- **53 brave team members** are living at the stations right now!
- **Big supply ship (MV Vasiliy Golovnin)** is sailing across the ocean bringing warm food, clothes, and fuel!

### 🎙️ Talk or Type to Me!
You can click the **big microphone button** 🎙️ and talk to me like a walkie-talkie! Ask me anything:
- *"Explain this whole website to me like I'm 8 years old!"*
- *"How much food and fuel do we have left?"*
- *"Can we go outside to play or drive snow trucks tomorrow?"*
- *"Where is our big supply ship right now?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'working'>('idle');
  const [workingStep, setWorkingStep] = useState<string>('Polar Helper Online');
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioPlaybackEnabled, setAudioPlaybackEnabled] = useState(true);
  const [childMode, setChildMode] = useState(true);
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, workingStep, interimTranscript]);

  // Setup Web Speech API for voice interaction with interim preview
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-IN';

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTranscript = event.results[i][0].transcript;
              setInterimTranscript('');
              setIsListening(false);
              if (finalTranscript.trim()) {
                handleSendMessage(finalTranscript.trim(), true);
              }
              return;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e);
          setIsListening(false);
          setInterimTranscript('');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported on this browser. You can type your question in the text box below!');
      return;
    }
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
    } else {
      setIsListening(true);
      setInterimTranscript('');
      // Stop any current text-to-speech so voice recognition doesn't hear itself
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech start error:', e);
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (!audioPlaybackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Extract speech or answer section and clean markdown
      const answerMatch = text.match(/### (?:🌟 Simple Answer|Answer)\s*([\s\S]*?)(?=###|$)/i);
      const toSpeak = answerMatch ? answerMatch[1].trim() : text;
      const clean = toSpeak.replace(/[*_#`\[\]]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.05; // Friendly, warm pitch
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis notice:', e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, isVoiceInput: boolean = false) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: isVoiceInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAgentStatus('working');

    // Simulate Agent Step Sequence for UI Observability (Section 25)
    setWorkingStep('Deciding required operational tools...');
    const stepTimer1 = setTimeout(() => setWorkingStep('Querying POLAR-SATHI PostgreSQL database...'), 400);
    const stepTimer2 = setTimeout(() => setWorkingStep('Fetching live meteorological telemetry & forecast...'), 900);
    const stepTimer3 = setTimeout(() => setWorkingStep('Evaluating supply autonomy vs resupply schedule...'), 1400);

    try {
      // Build conversation history for context memory (Section 16)
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      // Gather current local client state to synchronize server memory store
      const syncState = {
        inventory: dataStore.getInventory(),
        cargo: dataStore.getCargo(),
        assets: dataStore.getAssets(),
        personnel: dataStore.getPersonnel(),
        emergencies: dataStore.getEmergencies(),
        auditLogs: dataStore.getAuditLogs(),
      };

      const endpoint = voiceModeActive || isVoiceInput ? '/api/agent/voice' : '/api/agent/chat';
      const body = {
        prompt: text,
        transcript: text,
        conversationHistory: history,
        syncState,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text || 'Operational analysis complete.';

      const assistantMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolEvents: data.toolEvents || [],
        sources: data.sources || ['POLAR-SATHI PostgreSQL', 'Open-Meteo Polar Weather'],
        recommendedAction: data.recommendedAction,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Automatically open execution trace for the latest response so the user immediately sees tool activity
      if (data.toolEvents && data.toolEvents.length > 0) {
        setExpandedTraceId(assistantMsg.id);
      }

      if (voiceModeActive || isVoiceInput) {
        speakText(data.speechText || replyText);
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      console.warn('Agent error:', err);
      const errorMsg: Message = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        text: `### Answer
I could not reach the POLAR-SATHI service right now. Please check that the server and AI configuration are running, then try again.

I have not invented or changed any operational data.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ['POLAR-SATHI Service Status'],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setAgentStatus('idle');
      setWorkingStep('Agent Online');
    }
  };

  // Human-in-the-loop operational action confirmation.
  const handleApproveAction = async (messageId: string, action: RecommendedAction) => {
    if (!action.id || action.status === 'executed') return;

    try {
      setAgentStatus('working');
      setWorkingStep('Waiting for operational action execution...');

      const response = await fetch('/api/agent/confirm-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: action.id,
          confirmed: true,
          userName: user?.fullName || 'Confirmed Operator',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Operational action could not be executed.');
      }

      const result = data.result || {};
      const entity = result.entity || {};
      const actionType = action.actionType;

      // Keep the browser-side application state aligned with the confirmed server action.
      if (actionType === 'update_inventory' && entity.id) {
        const quantity = Number(result.newQuantity ?? entity.quantity);
        if (Number.isFinite(quantity)) {
          dataStore.updateInventoryQuantity(
            entity.id,
            quantity,
            action.description,
            user?.fullName || 'Confirmed Operator',
            'Correction'
          );
        }
      } else if (actionType === 'update_cargo_status' && entity.id) {
        dataStore.updateCargoStatus(
          entity.id,
          result.newStatus,
          entity.currentLocation || entity.current_location || 'Operational registry',
          user?.fullName || 'Confirmed Operator',
          action.description
        );
      } else if (actionType === 'update_asset_status' && entity.id) {
        dataStore.updateAssetStatus(
          entity.id,
          result.newStatus,
          user?.fullName || 'Confirmed Operator'
        );
      } else if (actionType === 'update_emergency_status' && entity.id) {
        dataStore.updateEmergencyStatus(
          entity.id,
          result.newStatus,
          entity.commanderNotes || entity.commander_notes,
          user?.fullName || 'Confirmed Operator'
        );
      } else if (actionType === 'create_emergency' && entity.id) {
        // Merge the server-created emergency into the browser store without issuing a second INSERT.
        dataStore.mergeEmergencyFromServer(entity);
      }

      dataStore.logAudit(
        user?.fullName || 'Confirmed Operator',
        `Operational Action Executed: ${action.title}`,
        'OperationalCommand',
        action.id,
        undefined,
        JSON.stringify(result)
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.recommendedAction
            ? { ...m, recommendedAction: { ...m.recommendedAction, status: 'executed' } }
            : m
        )
      );
    } catch (error: any) {
      console.error('Operational action execution failed:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, text: `${m.text}

### Execution Result
The action was NOT confirmed as completed. ${error.message || 'Execution failed.'}` }
            : m
        )
      );
    } finally {
      setAgentStatus('idle');
      setWorkingStep('Agent Online');
    }
  };

  const handleRejectAction = async (messageId: string, action?: RecommendedAction) => {
    if (action?.id) {
      try {
        await fetch('/api/agent/confirm-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: action.id,
            confirmed: false,
            userName: user?.fullName || 'Operator',
          }),
        });
      } catch (error) {
        console.warn('Action rejection request failed:', error);
      }
    }

    if (action) {
      dataStore.logAudit(
        user?.fullName || 'Operator',
        'Operational Action Rejected',
        'OperationalCommand',
        action.id,
        undefined,
        action.description
      );
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.recommendedAction
          ? { ...m, recommendedAction: { ...m.recommendedAction, status: 'rejected' } }
          : m
      )
    );
  };

  // Kid-Friendly Quick Starter Queries & Website Explorer
  const kidFriendlyQueries = [
    { label: '🎈 Explain Website (Kids)', query: 'Explain this whole website to me like I am 8 years old!' },
    { label: '❄️ How Cold in Antarctica?', query: 'How cold is it at Bharati and Maitri bases right now and can we go outside?' },
    { label: '🍲 Food & Warm Fuel', query: 'How much food and warm fuel is left in our stations right now?' },
    { label: '🚜 Snow Monster Trucks', query: 'What cool machines and snow trucks do we have at the stations?' },
    { label: '🚢 Where is the Big Ship?', query: 'Where is our big supply ship right now and what is it bringing?' },
    { label: '🧑‍🔬 Who Lives There?', query: 'Who are the brave scientists living at the bases right now?' },
  ];

  const funScienceQueries = [
    { label: '🌌 Southern Lights Magic', query: 'What makes the colorful Southern Lights (Aurora) dance in the polar sky?' },
    { label: '🧊 Ice Core Time Capsules', query: 'How do ice cores act like frozen time capsules from ancient times?' },
    { label: '🐧 Penguins in Antarctica', query: 'Tell me about the penguins and wildlife living around Antarctica!' },
    { label: '🤝 Antarctic Treaty Peace', query: 'What is the Antarctic Treaty peace promise in simple words?' },
    { label: '🗺️ What do all buttons do?', query: 'What do all the buttons and tabs on this website do?' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with Agent Status Indicator & Mode Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all border ${
                agentStatus === 'working'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  agentStatus === 'working' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span>{agentStatus === 'working' ? '● Helper Thinking...' : '● Helper Online'}</span>
            </span>

            {/* Child-Friendly Badge */}
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <span>🎈</span>
              <span>Child-Friendly (Zero Jargon)</span>
            </span>

            {agentStatus === 'working' && (
              <span className="text-xs text-amber-600 font-mono italic animate-in fade-in">
                {workingStep}
              </span>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mt-1">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>DHRUVYAN Station Helper &amp; Explorer Guide</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask anything about our polar bases, snow trucks, food, fuel, or science in simple, fun words!
          </p>
        </div>

        {/* Voice Audio Controls */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setAudioPlaybackEnabled(!audioPlaybackEnabled)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              audioPlaybackEnabled
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={audioPlaybackEnabled ? 'Audio speech voice is active' : 'Click to enable audio speech'}
          >
            {audioPlaybackEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioPlaybackEnabled ? 'Voice Voice Output: ON' : 'Voice Voice Output: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Walkie-Talkie Voice Card */}
      <div className={`p-4 rounded-3xl border transition-all ${
        isListening
          ? 'bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/10 border-red-300 shadow-md ring-2 ring-red-400/30'
          : isSpeaking
          ? 'bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-blue-500/10 border-blue-300 shadow-sm'
          : 'bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/80 border-blue-200 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Big Pulsing Mic Button */}
            <div className="relative">
              {isListening && (
                <>
                  <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                  <span className="absolute -inset-2.5 rounded-full bg-red-400/20 animate-pulse pointer-events-none" />
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white scale-105'
                    : 'bg-gradient-to-tr from-[#0f294a] to-[#2563eb] hover:from-[#1a3d6b] hover:to-[#1d4ed8] text-white hover:scale-105'
                }`}
                title={isListening ? 'Click to stop listening' : 'Click to talk over walkie-talkie'}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6 animate-pulse" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Status Information */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span>🎙️</span>
                  <span>Walkie-Talkie Voice Radio:</span>
                </span>
                {isListening ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white animate-pulse">
                    ● LISTENING NOW... SPEAK!
                  </span>
                ) : isSpeaking ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-600 text-white flex items-center gap-1">
                    <Volume2 className="w-3 h-3 animate-bounce" />
                    <span>SPEAKING ANSWER...</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600">
                    Ready to listen!
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-0.5">
                {isListening
                  ? 'Speak clearly into your microphone — your words will automatically send when you pause!'
                  : isSpeaking
                  ? 'The polar helper is speaking out loud to you! Click stop anytime.'
                  : 'Tap the big blue microphone to speak with your voice anytime! (No typing needed)'}
              </p>

              {/* Live Speech Recognition Transcription Bubble */}
              {interimTranscript && (
                <div className="mt-2 p-2 rounded-xl bg-white border border-red-200 text-xs text-slate-800 font-medium animate-fadeIn flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="italic">"{interimTranscript}..."</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons on the right of the walkie talkie */}
          <div className="flex items-center gap-2 shrink-0">
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Stop Speaking</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isListening ? 'Stop Recording' : 'Start Voice Input'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kid-Friendly Verification & Quick Questions */}
      <div className="space-y-3">
        {/* Simple Station & Website Queries */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
            <span className="flex items-center gap-1.5 text-blue-700 font-bold">
              <span>🏠</span>
              <span>Simple Questions About Our Polar Bases &amp; Website:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Tap any question</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {kidFriendlyQueries.map((tc, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(tc.query)}
                className="p-2.5 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-400 rounded-2xl text-left text-xs text-slate-700 hover:text-blue-700 transition-all font-medium truncate shadow-xs cursor-pointer"
                title={tc.query}
              >
                {tc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fun Science & Exploration Queries */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
            <span className="flex items-center gap-1.5 text-purple-700 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fun Polar Science &amp; Wonder Questions:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Zero jargon, easy to understand</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {funScienceQueries.map((tc, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(tc.query)}
                className="p-2.5 bg-white hover:bg-purple-50/80 border border-slate-200 hover:border-purple-400 rounded-2xl text-left text-xs text-slate-700 hover:text-purple-700 transition-all font-medium truncate shadow-xs cursor-pointer"
                title={tc.query}
              >
                {tc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Agent Chat Window */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[580px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#f8fafc]/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs shrink-0 font-bold ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#0b1a30] text-white shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-cyan-300" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-sans shadow-xs'
                }`}
              >
                <div className={`flex items-center justify-between gap-3 text-[10px] font-mono ${msg.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1.5">
                    <span>{msg.sender === 'user' ? 'Explorer Question' : 'DHRUVYAN Station Helper'}</span>
                    {msg.isVoice && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 text-[9px] font-bold flex items-center gap-0.5">
                        <Mic className="w-2.5 h-2.5" />
                        <span>Voice</span>
                      </span>
                    )}
                  </span>

                  <div className="flex items-center gap-2">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                        title="Read this answer out loud in friendly voice"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Agent Response Body */}
                <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                  {msg.text}
                </div>

                {/* Section 20: Observability & Tool Execution Trace Panel */}
                {msg.toolEvents && msg.toolEvents.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setExpandedTraceId(expandedTraceId === msg.id ? null : msg.id)}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>
                        {expandedTraceId === msg.id ? 'Hide' : 'Inspect'} Tools Checked ({msg.toolEvents.length} tools checked)
                      </span>
                      {expandedTraceId === msg.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {expandedTraceId === msg.id && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-500 border-b border-slate-200 pb-1">
                          <span>Live Database Tools Invoked</span>
                          <span className="text-emerald-600 font-bold">100% Dynamic Telemetry</span>
                        </div>

                        <div className="space-y-1.5 font-mono text-[11px]">
                          {msg.toolEvents.map((evt, idx) => (
                            <div key={evt.id} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700">
                              <div className="flex items-center justify-between text-blue-700 font-bold">
                                <span className="flex items-center gap-1">
                                  <span className="text-emerald-600">✓</span>
                                  <span>Step {idx + 1}: {evt.toolName}()</span>
                                </span>
                                <span className="text-[10px] text-slate-400">{evt.timestamp}</span>
                              </div>
                              <p className="text-[10px] text-slate-600 mt-0.5 font-sans">
                                ➔ {evt.resultSummary}
                              </p>
                            </div>
                          ))}
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-2">
                            <span className="font-bold">Information Sources:</span>
                            <span>{msg.sources.join(' • ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Human-in-the-Loop Action Card */}
                {msg.recommendedAction && (
                  <div className="mt-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Human Confirmation Required</span>
                      </div>
                      {msg.recommendedAction.status === 'executed' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          ✓ EXECUTED &amp; LOGGED
                        </span>
                      )}
                      {msg.recommendedAction.status === 'rejected' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                          DECLINED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-sans">
                      {msg.recommendedAction.description}
                    </p>

                    {msg.recommendedAction.status !== 'executed' && msg.recommendedAction.status !== 'rejected' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                        <button
                          onClick={() => handleApproveAction(msg.id, msg.recommendedAction!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm &amp; Execute</span>
                        </button>
                        <button
                          onClick={() => handleRejectAction(msg.id, msg.recommendedAction!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {agentStatus === 'working' && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0b1a30] text-cyan-400 flex items-center justify-center text-xs shrink-0 font-bold animate-pulse shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white border border-blue-200 rounded-2xl rounded-tl-none text-xs text-blue-700 flex items-center gap-2.5 shadow-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="font-mono">{workingStep}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white border-red-500 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title="Click to talk over walkie-talkie voice radio"
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder={
                isListening
                  ? 'Listening over voice radio... Speak into your mic now!'
                  : 'Ask in simple words: "Explain this website", "How much fuel is left?", "Can we play outside?"...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-sans"
            />

            <button
              type="submit"
              disabled={agentStatus === 'working' || !inputText.trim()}
              className="px-5 py-2.5 bg-[#0f294a] hover:bg-[#1a3d6b] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Helper</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
