# VoiceFlow Integration Tests

## Test Setup

Before running tests, ensure:
1. All RunAnywhere SDK models are downloaded
2. Microphone and speaker access is enabled in browser
3. Test environment has proper CORS headers

## E2E Test Scenarios

### 1. Voice Input to STT Transcription

**Setup:**
- Load VoiceFlow component
- Initialize VAD and STT models

**Test Steps:**
1. Simulate audio input to AudioCapture
2. Trigger VAD speech detection
3. Verify STT produces accurate transcript

**Expected Results:**
- Transcript matches spoken content
- Processing time < 2 seconds for 5-second audio

```typescript
test('should transcribe voice to text', async () => {
  const voiceFlow = await setupVoiceFlow();
  const audioData = generateTestAudio('hello world');
  
  const transcript = await voiceFlow.transcribeAudio(audioData);
  expect(transcript.toLowerCase()).toContain('hello');
});
```

### 2. LLM Intent Recognition

**Setup:**
- Load LLM model (LFM2-1.2B-Tool)
- Configure tool calling system prompt

**Test Steps:**
1. Feed transcript to LLM
2. Parse LLM response for tool calls
3. Validate tool call parameters

**Expected Results:**
- Tool calls identified correctly
- Parameters match command intent

```typescript
test('should recognize fill form intent', async () => {
  const response = await llm.generate('Fill the contact form with name=John');
  const intent = ToolCallingParser.extractIntent(response);
  
  expect(intent).toBeTruthy();
  expect(intent?.tools[0].toolName).toBe('fillForm');
  expect(intent?.tools[0].parameters.values.name).toBe('John');
});
```

### 3. Browser Automation Execution

**Setup:**
- Create test form DOM
- Initialize BrowserAutomationExecutor

**Test Steps:**
1. Execute fillForm action on test form
2. Verify form fields contain correct values
3. Check if form submission triggered

**Expected Results:**
- All fields populated correctly
- Submit handler called
- No JavaScript errors

```typescript
test('should fill and submit form', async () => {
  const executor = new BrowserAutomationExecutor();
  
  const result = await executor.executeAction({
    type: 'fillForm',
    payload: {
      selectors: { email: '#email', name: '#name' },
      values: { email: 'test@test.com', name: 'Test' },
      submitSelector: '#submit'
    }
  });
  
  expect(result.success).toBe(true);
  expect(document.querySelector('#email').value).toBe('test@test.com');
});
```

### 4. TTS Voice Feedback

**Setup:**
- Load TTS model (Piper)
- Initialize AudioPlayback

**Test Steps:**
1. Trigger TTS synthesis
2. Generate audio from response text
3. Play audio through AudioPlayback

**Expected Results:**
- Audio generated without errors
- Audio duration matches text length
- Playback completes

```typescript
test('should synthesize and play response', async () => {
  const tts = await loadTTSModel();
  const audio = await tts.synthesize('Form submitted successfully');
  
  expect(audio).toBeTruthy();
  expect(audio.sampleRate).toBe(22050);
  
  const player = new AudioPlayback({ sampleRate: 22050 });
  await player.play(audio, 22050);
});
```

### 5. Full End-to-End Pipeline

**Setup:**
- Load all required models
- Initialize VoiceFlowOrchestrator
- Setup test page with form

**Test Steps:**
1. Start listening
2. Send simulated audio: "Fill the form with name John and email test@example.com"
3. Wait for processing
4. Verify form is filled and submitted

**Expected Results:**
- Transcript captured
- Intent recognized (fillForm)
- Form filled correctly
- TTS response played
- Command history updated

```typescript
test('should complete full voice command pipeline', async () => {
  const orchestrator = new VoiceFlowOrchestrator();
  await orchestrator.initialize();
  
  // Simulate user voice input
  const audioData = createTestAudio('fill form with test');
  
  // Process through pipeline
  let commandResult;
  orchestrator.onCommandChange(cmd => {
    commandResult = cmd;
  });
  
  await orchestrator.processVoiceSegment(audioData);
  
  // Verify results
  expect(commandResult.transcript).toBeTruthy();
  expect(commandResult.intent).toBeTruthy();
  expect(commandResult.result?.success).toBe(true);
});
```

## Performance Benchmarks

### Expected Timings

| Stage | Expected Duration |
|-------|------------------|
| Audio Capture | Real-time |
| VAD Processing | < 100ms per chunk |
| STT (5sec audio) | 1-2 seconds |
| LLM Processing | 2-4 seconds |
| DOM Automation | < 500ms |
| TTS Synthesis | 1-2 seconds |
| **Total E2E** | **6-10 seconds** |

### Memory Usage

| Component | Memory |
|-----------|--------|
| STT Model | ~100MB |
| LLM Model (1.2B) | ~800MB |
| TTS Model | ~65MB |
| VAD Model | ~5MB |
| Pipeline Buffers | ~50MB |
| **Total** | **~1GB** |

## Test Commands

```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- toolCallingParser.test.ts

# Run tests in watch mode
npm run test:watch

# Run integration tests (requires browser)
npm run test:e2e
```

## Debugging Failed Tests

### Common Issues

1. **Models not loaded**
   - Solution: Run `ensureModels()` before test
   - Check browser DevTools Network tab for model downloads

2. **Microphone permission denied**
   - Solution: Grant microphone permission in browser settings
   - For testing, use mock AudioCapture

3. **DOM elements not found**
   - Solution: Check that test DOM is properly initialized in `beforeEach`
   - Verify selectors match DOM structure

4. **Timing issues**
   - Solution: Increase timeout values for slow systems
   - Use `jest.useFakeTimers()` for deterministic tests

### Debug Mode

Enable verbose logging:

```typescript
// In test setup
process.env.DEBUG_VOICEFLOW = 'true';

// Component logs will include detailed information
console.log('[VoiceFlow]', 'Processing audio...');
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: VoiceFlow Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

## Test Coverage Goals

- **Line Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Statement Coverage**: > 80%

Current coverage can be checked with:
```bash
npm run test:coverage
```
