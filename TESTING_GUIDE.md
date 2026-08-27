# SAMUDRA AI - FISHERMAN APP TESTING GUIDE

## 🚀 QUICK START

### Prerequisites:
- Node.js v18+ installed
- Modern browser (Chrome/Edge/Safari recommended for voice support)
- Terminal access

---

## 📋 STEP-BY-STEP TESTING

### 1. Fix Build System (One-time setup)

If you encounter esbuild errors, run:

```bash
cd /Users/ishanni/Downloads/orca-project\ 2

# Option A: Rebuild native modules
npm rebuild

# Option B: Fresh install
rm -rf node_modules package-lock.json
npm install

# Option C: If tsx continues to fail, use node + ts-node
npm install --save-dev ts-node @types/node
```

### 2. Start the Backend Server

```bash
# Terminal 1: Start main server
cd /Users/ishanni/Downloads/orca-project\ 2
npm run dev

# Wait for: "Server listening on port 3000"
```

### 3. (Optional) Start ML Service

```bash
# Terminal 2: Start ML prediction service
cd /Users/ishanni/Downloads/orca-project\ 2/ml-service
python -m uvicorn main:app --port 8000

# Wait for: "Application startup complete"
```

**Note:** The app works WITHOUT the ML service (falls back to procedural PFZ).

### 4. Open Application

```
Browser: http://localhost:3000/
```

---

## ✅ TEST CHECKLIST

### Test 1: Landing Page
- [ ] Background video plays automatically
- [ ] Three role cards displayed (Fisherman, Scientist, Public)
- [ ] Fisherman card shows "COASTAL COMMUNITY" badge
- [ ] Fisherman card clickable

### Test 2: Fisherman Auth Modal
- [ ] Click Fisherman card
- [ ] **SAMUDRA AI Fisherman Companion** modal appears
- [ ] Modal shows welcome message
- [ ] Name input field is focused
- [ ] Example names shown below input
- [ ] Enter name: "Ravi" (or your choice)
- [ ] Press Enter OR click "Continue"
- [ ] Modal closes

### Test 3: Auto-Greeting
- [ ] Fisherman app opens immediately
- [ ] Welcome message appears in the voice advisory card
- [ ] Greeting includes fisherman name (e.g., "வணக்கம் Ravi!")
- [ ] **AUTOMATIC VOICE SPEAKS** the greeting
- [ ] Voice is in Tamil (or selected language)
- [ ] "SPEAKING (VOICE TTS)" badge appears during playback
- [ ] After speech, status returns to "IDLE (READY)"

### Test 4: Language Selection
- [ ] Language selector shows: தமிழ் | हिन्दी | తెలుగు | മലയാളം | ಕನ್ನಡ | English
- [ ] Click Hindi (हिन्दी)
- [ ] Interface updates to Hindi
- [ ] Sample queries appear in Hindi

### Test 5: Voice Input (English)
- [ ] Switch to English
- [ ] Click microphone button
- [ ] Button turns red with "LISTENING" label
- [ ] "LISTENING (MIC ACTIVE)" badge appears
- [ ] Speak clearly: "Where can I fish today?"
- [ ] Transcript appears below microphone
- [ ] Mic automatically stops when finished
- [ ] Status changes: PLANNING → EXECUTING → SYNTHESIZING
- [ ] Response appears in voice advisory card
- [ ] **Voice automatically speaks the response**

### Test 6: Voice Input (Tamil)
- [ ] Switch to தமிழ்
- [ ] Click microphone
- [ ] Speak in Tamil: "இன்று கடலுக்கு செல்வது பாதுகாப்பானதா?"
- [ ] Tamil transcript appears
- [ ] Response generated in Tamil
- [ ] **Voice speaks Tamil response**

### Test 7: Quick Query Chips
- [ ] Click any quick query chip below microphone
- [ ] Query executes automatically
- [ ] Response generated
- [ ] Voice speaks response

### Test 8: PFZ (Fishing Zone) Recommendations
- [ ] After asking "Where can I fish?", check left panel
- [ ] PFZ zone cards appear
- [ ] Each card shows:
  - Zone name
  - Distance and bearing
  - Confidence percentage
  - Water temperature
  - Expected fish species
  - Wave/wind conditions
- [ ] Click a PFZ card
- [ ] Map highlights the selected zone
- [ ] "Explain" button works for each zone

### Test 9: Interactive Map
- [ ] Map displays coastal area
- [ ] PFZ markers visible on map
- [ ] Zoom in/out works
- [ ] Pan/drag works
- [ ] Click PFZ marker → selects that zone
- [ ] Route displayed from current location to PFZ

### Test 10: Safety Status Cards
- [ ] Check 4 safety cards in grid:
  1. **Marine Safety Risk**: Shows SAFE/CAUTION/HIGH_RISK
  2. **Wave Height (SWH)**: Shows wave measurement
  3. **Wind Velocity**: Shows wind speed
  4. **Sea Surface Temp**: Shows SST and chlorophyll
- [ ] Values update after agent query
- [ ] "Live from agents" status shown

### Test 11: GPS Status
- [ ] Top banner shows GPS status badge
- [ ] If browser allows GPS:
  - Badge: "GPS (±XXm)" in blue
  - Shows actual latitude/longitude
  - "GPS Active" message
- [ ] If GPS denied/unavailable:
  - Badge: "GPS Denied" or "No GPS" in red
  - Shows "Demo • Kasimedu Fishing Harbour"
  - Retry button available
- [ ] Click retry button (if GPS was denied)
- [ ] Browser requests GPS permission again

### Test 12: Agent Orchestration
- [ ] Ask: "Is it safe to go fishing today?"
- [ ] Watch status badges change:
  - "PLANNING DAG"
  - "SUB-AGENTS EXECUTING" 
  - "SYNTHESIZING XAI"
  - "SPEAKING (VOICE TTS)"
- [ ] Check that multiple agents are mentioned in response
- [ ] Confidence score shown

### Test 13: Stop Voice Playback
- [ ] During voice speaking, click "Stop Audio" button
- [ ] Voice stops immediately
- [ ] Status returns to IDLE

### Test 14: Manual Voice Replay
- [ ] After a response is complete
- [ ] Click "Play Voice" button on advisory card
- [ ] Voice speaks the response again

### Test 15: Exit Fisherman Mode
- [ ] Click "← Exit Fisherman Mode" button (top right)
- [ ] Returns to landing page
- [ ] All voice stops
- [ ] Re-click Fisherman card
- [ ] **Auth modal appears again** (profile cleared)

---

## 🧪 ADVANCED TESTS

### Test A: Multi-language Voice Round-trip
1. Tamil: Ask question → Get Tamil response
2. Switch to Hindi: Ask question → Get Hindi response
3. Switch to English: Ask question → Get English response
4. **Verify:** Each response is in the correct language, both text AND voice

### Test B: ML Prediction (If ML service running)
1. Check terminal 2 for ML service logs
2. Ask: "Where can I fish?"
3. Look for HTTP POST to http://localhost:8000/predict/pfz
4. Check PFZ confidence scores
5. **Expected:** Real ML model predictions (not random)

### Test C: Geofence Check
1. Ask: "How far is the international maritime boundary?"
2. **Expected:** Distance to IMBL mentioned
3. Check geofence status in response

### Test D: Agent Evidence
1. Ask complex question: "Why is fishing good here?"
2. Scroll down to see evidence sources
3. **Expected:** Multiple data sources listed:
   - SST from INSAT-3DR
   - Chlorophyll from Oceansat-3
   - Wave from SWAN model
   - Geofence from Coast Guard

### Test E: Continuous Conversation
1. Ask: "Where can I fish today?"
2. Wait for response
3. Immediately ask follow-up: "Is it safe?"
4. **Expected:** Second query processes after first completes
5. No overlap in voice playback

---

## 🐛 TROUBLESHOOTING

### Problem: Server won't start
**Solution:**
```bash
# Check if port 3000 is in use
lsof -ti:3000 | xargs kill -9

# Rebuild dependencies
npm rebuild

# Try alternative: compile and run
npx tsc
node dist/server.cjs
```

### Problem: No voice output
**Check:**
- Browser supports Speech Synthesis
- System volume not muted
- No other tab playing audio
- Open browser console for errors

**Test Speech Synthesis:**
```javascript
// In browser console:
speechSynthesis.speak(new SpeechSynthesisUtterance('Hello'))
```

### Problem: Voice input not working
**Check:**
- Browser has microphone permission
- Microphone not used by another app
- Try Chrome/Edge (best Web Speech Recognition support)

**Test Speech Recognition:**
```javascript
// In browser console:
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-IN';
recognition.start();
recognition.onresult = (e) => console.log(e.results[0][0].transcript);
```

### Problem: Tamil/Hindi voice sounds wrong
**Explanation:**
- Voice quality depends on OS/browser TTS engine
- Windows: Good Tamil/Hindi support
- Mac: May use English voice for Indian languages
- Linux: Install Indian language TTS packs

**Verify available voices:**
```javascript
// In browser console:
speechSynthesis.getVoices().filter(v => v.lang.includes('IN'))
```

### Problem: GPS not working
- Click retry button
- Check browser site permissions
- Allow location when prompted
- Falls back to demo GPS (Chennai) if denied

### Problem: PFZ zones not appearing
- Check if ML service is running (optional)
- App falls back to mock PFZ zones
- Check browser console for errors
- Verify API call to /api/agents/orchestrate succeeds

---

## 📊 EXPECTED RESULTS

### Successful Test Session:
```
✅ Landing page loads with video
✅ Fisherman auth modal works
✅ Auto-greeting speaks with name
✅ Voice input captures speech
✅ Agents execute (8 agents coordinated)
✅ Response in correct language
✅ Voice output speaks response
✅ PFZ zones displayed on map
✅ Safety cards show live data
✅ GPS tracking active (or demo mode)
✅ Language switching works
✅ Exit clears session properly
```

### Performance Benchmarks:
- Auto-greeting: < 1 second after entry
- Voice recognition: < 3 seconds
- Agent orchestration: 2-5 seconds
- Voice synthesis: Starts within 1 second
- Map rendering: < 2 seconds

---

## 📸 SCREENSHOT CHECKLIST

### Take screenshots of:
1. Landing page with Fisherman card
2. Fisherman auth modal
3. Fisherman app with auto-greeting
4. Voice listening state (red mic button)
5. Agent execution status badges
6. Voice advisory card with response
7. PFZ zones on map
8. Safety status cards
9. Multi-language example (Tamil, Hindi, English)
10. GPS status indicators

---

## 🎯 DEMO SCRIPT (For SIH Presentation)

### 5-Minute Demo Flow:

**1. Introduction (30s)**
"SAMUDRA AI provides voice-first marine intelligence for fishermen in their native language."

**2. Entry (30s)**
- Click Fisherman card
- Enter name "Ravi"
- Show auto-greeting in Tamil with voice

**3. Voice Query (1min)**
- Ask in Tamil: "இன்று எங்கே மீன்பிடிக்கலாம்?"
- Show agent orchestration
- Highlight 8 specialized agents
- Show PFZ on map

**4. Safety Check (1min)**
- Ask: "Is it safe today?"
- Show risk assessment
- Highlight wave, wind, weather factors
- Show geofence boundary distance

**5. Multi-language (1min)**
- Switch to Hindi
- Ask same question
- Show response in Hindi with voice
- Demonstrate language consistency

**6. ML Prediction (1min)**
- Show PFZ confidence scores
- Mention real ML model (Random Forest)
- Highlight SST, chlorophyll, gradient features

**7. Closing (30s)**
- Emphasize: Voice-first, multi-agent, real ML
- Mention offline capability (future)
- Exit fisherman mode

---

## ✅ FINAL CHECKLIST

Before demo/submission:
- [ ] Server starts without errors
- [ ] All 6 languages tested
- [ ] Voice input works in at least 3 languages
- [ ] Voice output works in all languages
- [ ] Auto-greeting working
- [ ] PFZ zones displayed correctly
- [ ] Map interactive and responsive
- [ ] GPS fallback working
- [ ] Agent orchestration visible
- [ ] ML model endpoints responding (or fallback working)
- [ ] No console errors in browser
- [ ] Existing website unchanged
- [ ] Screenshots/video recording ready

---

**Good luck with your testing and SIH demo! 🚀🌊**
