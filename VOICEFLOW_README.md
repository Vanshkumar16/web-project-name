# VoiceFlow - Voice-Controlled Browser Automation Tool

A powerful web application that enables users to control browser tasks entirely through voice commands, powered by local LLMs running on-device for privacy and zero latency.

## 🎯 Features

### Core Capabilities

- **🎤 Voice Command Processing**: Real-time speech recognition with on-device VAD (Voice Activity Detection)
- **🧠 Local LLM Intelligence**: Intent recognition using LFM2 1.2B Tool model
- **🛠️ Browser Automation**: Fill forms, navigate pages, extract data, and more
- **🔊 Voice Feedback**: Natural TTS responses using Piper
- **🔐 Privacy-First**: All processing happens in-browser, no data leaves the device
- **📊 Command History**: Track and review all executed commands
- **⚡ Real-time Processing**: Full end-to-end latency typically under 10 seconds

### Browser Automation Tools

1. **fillForm** - Fill out forms with provided values and submit
2. **navigate** - Navigate to URLs with optional element waiting
3. **extractData** - Extract text, HTML, or values from page elements
4. **click** - Click elements on the page
5. **screenshot** - Capture screenshots of page or elements
6. **wait** - Pause execution for specified duration

## 📋 Project Structure

```
src/
├── lib/
│   ├── voiceflow.types.ts          # Type definitions
│   ├── voiceflowOrchestrator.ts     # Main orchestration logic
│   ├── toolCallingParser.ts         # LLM response parsing
│   └── browserAutomation.ts         # DOM automation executor
├── hooks/
│   ├── useVoiceFlow.ts              # React hook for VoiceFlow
│   └── useModelLoader.ts            # Model loading hook
├── components/
│   ├── VoiceFlowTab.tsx             # UI component
│   └── ModelBanner.tsx              # Model loading indicator
└── styles/
    └── voiceflow.css                # Styling

tests/
├── voiceflow.types.test.ts          # Type tests
├── toolCallingParser.test.ts        # Parser tests
├── browserAutomation.test.ts        # Automation tests
└── INTEGRATION_TESTS.md             # E2E test guide
```

## 🚀 Quick Start

### Installation

The project already has RunAnywhere SDK integrated. Models will be loaded automatically when needed.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Using VoiceFlow

1. **Navigate to VoiceFlow Tab**: Click the "🤖 VoiceFlow" tab in the application
2. **Wait for Models**: First use will download required models (~1.8GB total)
3. **Start Listening**: Click "🎤 Start Listening" button
4. **Speak Command**: Give a voice command like:
   - "Fill the contact form with name John and email john@example.com"
   - "Navigate to example.com"
   - "Extract text from the main heading"
   - "Click the submit button"
5. **Review Results**: See transcript, intent, and execution results

## 💻 API Usage

### Basic Setup

```typescript
import { useVoiceFlow } from './hooks/useVoiceFlow';

function MyComponent() {
  const voiceFlow = useVoiceFlow({
    autoInitialize: true,
    systemPrompt: 'Custom system prompt here'
  });

  const start = async () => {
    try {
      await voiceFlow.startListening();
    } catch (error) {
      console.error('Failed to start:', error);
    }
  };

  return (
    <div>
      <button onClick={start} disabled={voiceFlow.isListening}>
        {voiceFlow.isListening ? 'Listening...' : 'Start'}
      </button>
      
      {voiceFlow.currentCommand && (
        <div>
          <p>You said: {voiceFlow.currentCommand.transcript}</p>
          {voiceFlow.currentCommand.intent && (
            <p>Intent: {voiceFlow.currentCommand.intent.description}</p>
          )}
        </div>
      )}
      
      <div>
        <h3>History</h3>
        {voiceFlow.commandHistory.map(cmd => (
          <div key={cmd.id}>{cmd.transcript}</div>
        ))}
      </div>
    </div>
  );
}
```

### VoiceFlowOrchestrator

```typescript
import { VoiceFlowOrchestrator } from './lib/voiceflowOrchestrator';

const orchestrator = new VoiceFlowOrchestrator(systemPrompt);
await orchestrator.initialize();

// Subscribe to state changes
orchestrator.onStateChange((state) => {
  console.log('Listening:', state.isListening);
  console.log('Processing:', state.isProcessing);
  console.log('Speaking:', state.isSpeaking);
});

// Subscribe to commands
orchestrator.onCommandChange((command) => {
  console.log('Transcript:', command.transcript);
  console.log('Intent:', command.intent);
  console.log('Result:', command.result);
});

// Start listening
await orchestrator.startListening();

// Stop listening
orchestrator.stopListening();

// Get history
const history = orchestrator.getCommandHistory();

// Cleanup
orchestrator.dispose();
```

### Tool Calling

```typescript
import { ToolCallingParser } from './lib/toolCallingParser';

const llmResponse = `
  I'll help you fill the form with the provided information.
  <tool_call>
    <name>fillForm</name>
    <parameters>
      <selectors>{"email": "#email-field", "name": "#name-input"}</selectors>
      <values>{"email": "user@example.com", "name": "John Doe"}</values>
      <submitSelector>#submit-btn</submitSelector>
    </parameters>
  </tool_call>
`;

const toolCalls = ToolCallingParser.parseToolCalls(llmResponse);
const intent = ToolCallingParser.extractIntent(llmResponse);

console.log('Tools to execute:', toolCalls);
console.log('Intent:', intent.description);
```

### Browser Automation

```typescript
import { BrowserAutomationExecutor } from './lib/browserAutomation';

const executor = new BrowserAutomationExecutor();

// Fill form
const result = await executor.executeAction({
  type: 'fillForm',
  payload: {
    selectors: {
      email: '#email',
      name: '#name'
    },
    values: {
      email: 'test@example.com',
      name: 'Test User'
    },
    submitSelector: '#submit'
  }
});

// Navigate
const navResult = await executor.executeAction({
  type: 'navigate',
  payload: {
    url: 'https://example.com',
    waitSelector: '#main-content',
    timeout: 5000
  }
});

// Extract data
const extractResult = await executor.executeAction({
  type: 'extractData',
  payload: {
    selector: '.article-title',
    property: 'text'
  }
});

// Click element
const clickResult = await executor.executeAction({
  type: 'click',
  payload: {
    selector: '.submit-button'
  }
});
```

## 🔬 Testing

### Run Tests

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm run test -- toolCallingParser.test.ts
```

### Test Structure

- **voiceflow.types.test.ts** - Type definitions and tool catalog
- **toolCallingParser.test.ts** - LLM response parsing and validation
- **browserAutomation.test.ts** - DOM automation execution
- **INTEGRATION_TESTS.md** - E2E test scenarios and benchmarks

### Test Coverage

Expected coverage:
- Line: > 80%
- Branch: > 75%
- Function: > 80%
- Statement: > 80%

## 📊 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Browser | Chrome 96+ / Edge 96+ | Chrome 120+ / Edge 120+ |
| RAM | 2GB | 4GB+ |
| Storage | 2GB (models) | SSD preferred |
| Network | For model download | Broadband |

### Models Required

- **VAD**: Silero VAD v5 (~5MB)
- **STT**: Whisper Tiny English (~100MB)
- **LLM**: LFM2 1.2B Tool (~800MB)
- **TTS**: Piper TTS US English (~65MB)
- **Total**: ~970MB

## 🏗️ Architecture

### Data Flow

```
Voice Input
    ↓
AudioCapture (16kHz sampling)
    ↓
VAD (Silero) - Speech Activity Detection
    ↓
STT (Whisper) - Speech to Text
    ↓
LLM (LFM2 1.2B) - Intent Recognition
    ↓
Tool Calling Parser - Extract automation tasks
    ↓
BrowserAutomationExecutor - Execute actions
    ↓
TTS (Piper) - Text to Speech
    ↓
AudioPlayback - Voice Feedback
```

### State Management

VoiceFlow maintains state for:
- **isListening**: Currently capturing audio
- **isProcessing**: Processing through pipeline
- **isSpeaking**: Playing TTS response
- **currentCommand**: Active command being processed
- **commandHistory**: All executed commands

## 🔒 Privacy & Security

- ✅ All processing happens in-browser
- ✅ No data sent to external servers
- ✅ No API keys required
- ✅ Models cached in OPFS (Origin Private File System)
- ✅ Audio never stored or transmitted
- ✅ Form data never logged or exposed

## 🐛 Troubleshooting

### Models Won't Download

1. Check internet connection
2. Clear browser cache: DevTools → Application → Storage → Clear site data
3. Check browser console for specific errors
4. Ensure sufficient disk space (~2GB)

### No Audio Input

1. Grant microphone permission
2. Check browser microphone settings
3. Test microphone works in browser
4. Try different audio input device

### Commands Not Recognized

1. Speak clearly and naturally
2. Avoid background noise
3. Try simpler commands first
4. Check LLM model is fully loaded

### Form Filling Fails

1. Verify CSS selectors are correct
2. Check form is rendered (not hidden)
3. Try extracting data first to verify selectors work
4. Check browser console for DOM errors

## 📚 Examples

### Example 1: Contact Form Submission

```
User: "Fill the contact form with name John Smith, email john@example.com, and message Hello there"

System: 
- Transcribes speech to text
- Recognizes fillForm intent
- Extracts selectors and values from form
- Fills fields: name → "John Smith", email → "john@example.com", message → "Hello there"
- Clicks submit button
- Responds: "Successfully submitted your contact form"
- Plays audio response
```

### Example 2: Data Extraction

```
User: "Extract the article title from this page"

System:
- Recognizes extractData intent
- Uses AI to identify article title selector
- Extracts text: "Breaking News: New Technology Released"
- Responds: "The article title is: Breaking News: New Technology Released"
- Plays audio response
```

### Example 3: Page Navigation

```
User: "Go to the example dot com website and wait for the main content"

System:
- Recognizes navigate intent with URL
- Navigates to https://example.com
- Waits for #main-content element
- Responds: "Successfully navigated to example.com"
- Plays audio response
```

## 🤝 Contributing

To contribute improvements:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `npm run test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature/my-feature`
7. Open a Pull Request

## 📄 License

This project is part of the RunAnywhere SDK ecosystem.

## 🔗 Resources

- [RunAnywhere SDK Docs](https://docs.runanywhere.ai/web/introduction)
- [LFM2 Model Info](https://huggingface.co/LiquidAI/LFM2-1.2B-Tool-GGUF)
- [Whisper STT](https://github.com/openai/whisper)
- [Piper TTS](https://github.com/rhasspy/piper)
- [Silero VAD](https://github.com/snakers4/silero-vad)

## 🆘 Support

For issues, questions, or feedback:
- Open an issue on GitHub
- Check existing documentation
- Review test files for usage examples
- Check browser console for error messages

---

**VoiceFlow** - Bringing voice-controlled automation to the web browser! 🚀
