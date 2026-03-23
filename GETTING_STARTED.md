# VoiceFlow - Getting Started Guide

## 🎯 What is VoiceFlow?

VoiceFlow is a voice-controlled browser automation tool that lets you control web pages entirely through voice commands. It uses local AI models running in your browser for complete privacy and zero external dependencies.

## 🚀 Quick Start (2 minutes)

### Step 1: Start the Server
```bash
cd D:\Runanywhere\web-project-name
npm run dev
```

Your browser should open automatically to `http://localhost:5175`, or visit that URL manually.

### Step 2: Click VoiceFlow Tab
In the top navigation, click the **🤖 VoiceFlow** button.

### Step 3: Grant Microphone Permission
When your browser asks for microphone access, click **Allow**.

### Step 4: Click "Start Listening"
Press the **🎤 Start Listening** button.

### Step 5: Give a Command
Say something like:
- "Navigate to google dot com"
- "Click the submit button"
- "Extract the main heading"

### Step 6: See Results
Your voice will be transcribed, interpreted, and executed. The results are shown on screen and spoken back to you.

## 📚 Full Documentation

After basic testing, read these for more details:

| Document | Purpose |
|----------|---------|
| **VOICEFLOW_QUICK_START.md** | 5-minute quick reference |
| **VOICEFLOW_README.md** | Complete API and features |
| **BUILD_SUMMARY.md** | Technical implementation details |
| **VALIDATION_REPORT.md** | Testing and verification results |

## 🧠 How It Works

```
1. You speak → Microphone captures audio
2. VAD detects → Speech activity recognition
3. STT transcribes → Speech to text
4. LLM interprets → Determines your intent
5. Tool calling → Extracts what to do
6. Automation → Performs browser actions
7. TTS responds → Generates voice response
8. Audio plays → You hear the result
```

**Total time: 6-10 seconds typically**

## 🎤 Example Commands

### Navigation
- "Go to google.com"
- "Navigate to wikipedia.org"
- "Open amazon.com"

### Form Filling
- "Fill the contact form with name John and email john@example.com"
- "Fill the login form with username admin and password secret"
- "Enter John into the name field"

### Data Extraction
- "Extract the article title"
- "Get the main heading from the page"
- "Show me all the paragraph text"

### Clicking
- "Click the submit button"
- "Click sign up"
- "Click the download link"

### Combinations
- "Navigate to google.com and search for cats"
- "Go to the form and fill it with John"
- "Click the link and extract the title"

## ⚙️ System Requirements

- **Browser**: Chrome 96+ or Edge 96+
- **RAM**: 2GB minimum (4GB recommended)
- **Storage**: 1GB for models (downloaded once)
- **Microphone**: Working microphone and speakers
- **Network**: Broadband for first model download

## 🔧 Troubleshooting

### "Microphone not working"
1. Check browser permissions (Settings → Privacy → Microphone)
2. Test microphone in other apps
3. Try a different browser
4. Restart your computer

### "Models won't download"
1. Check internet connection
2. Clear browser cache (DevTools → Application → Clear storage)
3. Try incognito/private browsing mode
4. Wait - models are large (~970MB)

### "Commands not recognized"
1. Speak clearly and naturally
2. Reduce background noise
3. Try simpler commands first
4. Wait for previous command to complete

### "Form filling not working"
1. Make sure form is visible on page
2. Try a simpler form first (single field)
3. Open DevTools (F12) and verify element exists
4. Check browser console for error messages

## 📊 What You Can Automate

✅ **Forms**: Fill text fields, select dropdowns, check boxes, submit  
✅ **Navigation**: Go to websites and wait for content  
✅ **Data**: Extract text, HTML, and values from pages  
✅ **Interaction**: Click buttons, links, and other elements  
✅ **Screenshots**: Capture page or element screenshots  
✅ **Timing**: Wait for specific durations  

❌ **Not Supported**: PDF manipulation, file downloads, complex JavaScript

## 🔐 Privacy Guarantee

VoiceFlow runs 100% locally in your browser:
- ✅ No data sent to servers
- ✅ No cloud processing
- ✅ No analytics or tracking
- ✅ No form data stored
- ✅ Your voice never leaves your device

## 🎓 Learning Path

### Beginner (5 minutes)
1. Try clicking a button
2. Try navigating to a website
3. Try extracting text

### Intermediate (15 minutes)
1. Try filling a simple form
2. Try multiple commands in sequence
3. Check command history

### Advanced (30+ minutes)
1. Try complex automation sequences
2. Read full documentation
3. Understand API usage
4. Customize system prompt

## 💾 Persistence

VoiceFlow:
- ✅ Keeps command history during session
- ✅ Caches models for faster reuse
- ✅ Remembers settings per browser tab
- ❌ Does NOT store data between sessions (by design)

## 🎯 Pro Tips

1. **Speak naturally** - Don't pause between words
2. **Use context** - Reference visible elements
3. **Check history** - Learn from previous commands
4. **Be specific** - Use field names when available
5. **Wait between** - Let command complete before new one

## 🆘 Getting Help

### For Issues:
1. Check browser console (F12 → Console)
2. Look at command history
3. Read the quick start guide
4. Review test examples

### For Features:
1. Read VOICEFLOW_README.md
2. Check test files for examples
3. Explore the source code

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 96+ | ✅ Full support |
| Edge | 96+ | ✅ Full support |
| Firefox | 94+ | ⚠️ Limited (no WebGPU) |
| Safari | 15+ | ⚠️ Limited (no SharedArrayBuffer) |

## 🚀 Next Steps

1. ✅ Try the quick start above
2. ✅ Experiment with different commands
3. ✅ Read VOICEFLOW_QUICK_START.md
4. ✅ Check examples in tests/
5. ✅ Read VOICEFLOW_README.md for full details

## 📚 All Documentation

### Getting Started
- This file ← Start here!
- VOICEFLOW_QUICK_START.md ← Quick reference

### Detailed Info
- VOICEFLOW_README.md ← Full documentation
- BUILD_SUMMARY.md ← Technical details
- VALIDATION_REPORT.md ← Testing results

### Code Examples
- tests/voiceflow.types.test.ts
- tests/toolCallingParser.test.ts
- tests/browserAutomation.test.ts
- tests/INTEGRATION_TESTS.md

## ⏱️ Typical Workflow

```
1. Open VoiceFlow tab (instant)
2. Wait for models to load (first use: 2-5 minutes)
3. Click "Start Listening" (instant)
4. Give voice command (3-5 seconds)
5. Command executed (3-7 seconds)
6. Result shown and spoken (instantly)
┌─────────────────────────────┐
│ Total time: 6-12 seconds    │
└─────────────────────────────┘
```

## 🎉 Ready to Go!

You're all set up to use VoiceFlow. The server is running, models will download automatically, and you're ready to give voice commands.

**Start here**: Click the VoiceFlow tab and say "Click this button" to test!

---

**Questions?** Read VOICEFLOW_README.md for comprehensive documentation.

**Issues?** Check the Troubleshooting section above or browser console (F12).

**Ready to dive deeper?** Read VOICEFLOW_QUICK_START.md for a detailed guide.

**Happy voice commanding!** 🎤✨
