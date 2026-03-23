# VoiceFlow - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Start the Application

```bash
cd D:\Runanywhere\web-project-name
npm run dev
```

Open browser to `http://localhost:5173`

### 2. Navigate to VoiceFlow

Click the **🤖 VoiceFlow** tab in the application header

### 3. Wait for Model Loading

On first use, models will download (~970MB total):
- ✅ VAD (Speech Detection) - 5MB
- ✅ STT (Speech Recognition) - 100MB  
- ✅ LLM (Intent Recognition) - 800MB
- ✅ TTS (Voice Synthesis) - 65MB

A loading indicator shows progress. This is one-time only.

### 4. Click "Start Listening"

Grant microphone permissions when prompted by browser

### 5. Give a Voice Command

Examples:
- "Fill the contact form with name John and email test@example.com"
- "Navigate to Google.com"
- "Extract the main heading text"
- "Click the submit button"

### 6. Review Results

See:
- 📝 What you said (transcript)
- 🧠 What it understood (intent)
- 🛠️ What it did (tools executed)
- ✅ If it succeeded

## 📖 Supported Commands

### Form Automation
```
"Fill the [form name] with [field] as [value]"
Examples:
- "Fill the contact form with name as John and email as john@example.com"
- "Fill the login form with username admin and password secret123"
```

### Page Navigation
```
"Navigate to [URL]"
"Go to [website]"
Examples:
- "Navigate to google.com"
- "Go to github.com"
```

### Data Extraction
```
"Extract [element] from the page"
"Get the [content type] from [area]"
Examples:
- "Extract the article title"
- "Get all headings from the page"
```

### Element Interaction
```
"Click [element]"
"Click the [button/link] button"
Examples:
- "Click the submit button"
- "Click on sign up"
```

### Screenshots
```
"Take a screenshot"
"Screenshot of [area]"
Examples:
- "Take a screenshot"
- "Screenshot of the form"
```

## 🎯 Use Cases

### 1. Fill Multi-Step Forms
```
Command 1: "Fill the registration form with email test@example.com"
Command 2: "Fill the form with password MyPassword123"
Command 3: "Click the continue button"
Result: Multi-step form completed entirely by voice
```

### 2. Quick Research
```
Command 1: "Navigate to example.com"
Command 2: "Extract the article title"
Command 3: "Extract all paragraphs"
Result: Content extracted and read back
```

### 3. Hands-Free Browsing
```
Command 1: "Navigate to gmail.com"
Command 2: "Click the compose button"
Command 3: "Fill the email form with recipient john@example.com"
Result: Compose window opened and recipient field filled
```

### 4. Data Collection
```
Multiple navigations and extractions to collect data
All results saved in command history
Export history for analysis
```

## ⚙️ Settings & Customization

### System Prompt
Edit the system prompt in `src/components/VoiceFlowTab.tsx` to customize AI behavior:

```typescript
systemPrompt: `You are a helpful voice assistant for browser automation...`
```

### Model Selection
Change models in `src/runanywhere.ts`:

```typescript
// Use smaller/larger models
'lfm2-350m-q4_k_m'        // Smaller, faster
'lfm2-1.2b-tool-q4_k_m'   // Recommended (current)
```

### Audio Settings
Adjust audio capture in `src/lib/voiceflowOrchestrator.ts`:

```typescript
new AudioCapture({ sampleRate: 16000 }) // Sample rate
```

## 🔧 Troubleshooting

### "Models Won't Download"
- ✅ Check internet connection is stable
- ✅ Clear browser cache: DevTools → Application → Clear site data
- ✅ Ensure 2GB free disk space
- ✅ Try incognito/private window

### "Microphone Not Working"
- ✅ Grant microphone permission (browser prompt)
- ✅ Check System Settings → Privacy → Microphone
- ✅ Test microphone in other apps first
- ✅ Try a different browser

### "Commands Not Recognized"
- ✅ Speak clearly and naturally
- ✅ Reduce background noise
- ✅ Speak complete sentences
- ✅ Try simple commands first: "Click button"

### "Form Filling Fails"
- ✅ Verify element exists on page (open DevTools)
- ✅ Try extracting from that element first
- ✅ Use precise field names in commands
- ✅ Check browser console for errors

## 📊 Performance Tips

### Faster Processing
1. Use shorter commands (< 20 words)
2. Speak naturally without long pauses
3. Use specific element names from the page
4. Wait for previous command to complete

### Better Recognition
1. Speak clearly and at normal pace
2. Use proper names and spellings
3. Reduce background noise
4. Ensure microphone is close

### Lower Memory Usage
1. Close other browser tabs
2. Clear history/cache regularly
3. Restart browser if slow
4. Use recommended browser version

## 🔐 Privacy & Security

VoiceFlow is 100% private:
- ✅ No data sent to servers
- ✅ All processing in-browser
- ✅ No analytics or tracking
- ✅ No form data stored
- ✅ Models cached locally

Your voice and data never leave your device.

## 🐛 Report Issues

Having problems? Check:
1. Browser console (F12 → Console tab)
2. Network tab for model downloads
3. System requirements (Chrome 96+)

Report issues with:
- Screenshot of error
- Browser version
- Steps to reproduce
- Console error messages

## 📚 Full Documentation

- **Detailed Docs**: See `VOICEFLOW_README.md`
- **API Reference**: See `src/lib/voiceflow.types.ts`
- **Test Examples**: See `tests/` directory
- **Components**: See `src/components/VoiceFlowTab.tsx`

## 🎓 Learning Path

1. **Beginner**: Start with simple commands like "Click button"
2. **Intermediate**: Try form filling with multiple fields
3. **Advanced**: Combine multiple commands in sequence
4. **Expert**: Customize system prompt and tool definitions

## 💡 Pro Tips

1. **Repeat Actions**: Prefix with "again" or "do it again"
2. **Combine Commands**: Give multiple instructions in one voice command
3. **Navigate & Fill**: Say "Go to X and fill the form with..."
4. **View History**: Check previous commands to learn patterns

## 🚀 Next Steps

1. ✅ Try your first voice command
2. ✅ Practice with different commands
3. ✅ Explore command history
4. ✅ Read full documentation
5. ✅ Customize for your use case

---

**Ready to go voice-controlled?** 🎤

Click the VoiceFlow tab and start speaking! Your browser automation journey begins now.
