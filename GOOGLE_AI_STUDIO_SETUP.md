# 🔗 GOOGLE AI STUDIO - COMPLETE SETUP GUIDE

**Connect your SAMUDRA AI project to Google AI Studio in 5 minutes**

---

## ✅ YOUR PROJECT IS READY

Your project already uses:
- ✅ `@google/genai` package (Google's official SDK)
- ✅ Gemini API integration in orchestrator
- ✅ Multi-model fallback (gemini-3.7-flash, gemini-3.1-flash-lite)
- ✅ Proper error handling

**Location:** `server/agents/orchestrator.ts` (lines 58-100)

---

## 🔑 STEP 1: GET YOUR API KEY (1 minute)

### Option A: Google AI Studio (Recommended)

1. **Open:** https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click:** "Create API key"
4. **Choose:** 
   - "Create API key in new project" (easiest)
   - OR select existing Google Cloud project
5. **Copy** the API key (starts with `AIza...`)
6. **Save it** - you'll need it in Step 3

### Option B: Google Cloud Console

1. **Open:** https://console.cloud.google.com/
2. **Enable** Generative Language API
3. **Create** API key in "APIs & Services" → "Credentials"
4. **Copy** the key

---

## 📊 STEP 2: UNDERSTAND YOUR INTEGRATION

### Current Setup (Already Working!)

Your `orchestrator.ts` uses Gemini AI for:

```typescript
// File: server/agents/orchestrator.ts
private initGemini() {
  if (process.env.GEMINI_API_KEY) {
    this.aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
}
```

### Models Used (Automatic Fallback)

1. **Primary:** `gemini-3.7-flash` (fastest, latest)
2. **Fallback 1:** `gemini-3.1-flash-lite` (lighter)
3. **Fallback 2:** `gemini-flash-latest` (stable)

The system automatically tries each model if one fails!

### What Gemini Does

- **Natural Language Understanding** - Understands fisherman queries
- **Multilingual Responses** - Generates answers in 6 languages
- **Marine Intelligence** - Synthesizes ocean data into natural explanations
- **Conversational AI** - Creates friendly, contextual responses

---

## 🚀 STEP 3: DEPLOY WITH API KEY

### Option A: Railway (Recommended)

```bash
# Quick deployment
railway login
railway init
railway variables set GEMINI_API_KEY="your_key_here"
railway up
```

### Option B: Render

1. Go to https://render.com/
2. Create Web Service
3. Add environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your API key from Step 1
4. Deploy

### Option C: Vercel

```bash
vercel
# When prompted, add environment variable:
# GEMINI_API_KEY = your_key_here
```

### Option D: Google Cloud Run

```bash
# Build and deploy
gcloud run deploy samudra-ai \
  --source . \
  --platform managed \
  --region asia-south1 \
  --set-env-vars GEMINI_API_KEY="your_key_here"
```

---

## 🧪 STEP 4: TEST THE INTEGRATION

### Quick Test

1. **Deploy** using Step 3
2. **Open** your app URL
3. **Click** Fisherman card
4. **Enter** your name
5. **Say:** "Where can I fish today?"
6. **Watch:** Agents execute
7. **Listen:** AI-generated response

### Verify Gemini is Working

Check these in the response:
- ✅ Natural language (not templated)
- ✅ Context-aware explanations
- ✅ Proper language (Tamil/Hindi/English)
- ✅ Synthesized marine intelligence

### Check Logs (Railway/Render)

Look for:
```
[Orchestrator] Gemini client initialized
[Orchestrator] Using model: gemini-3.7-flash
```

If you see:
```
[Orchestrator] Gemini initialization error
```
→ Check your API key!

---

## 📈 STEP 5: MONITOR USAGE (Optional)

### View API Usage

1. **Go to:** https://aistudio.google.com/app/apikey
2. **Click** your API key
3. **View** usage statistics:
   - Total requests
   - Tokens used
   - Errors
   - Rate limits

### Free Tier Limits

**Gemini Flash (Free):**
- ✅ 15 requests per minute
- ✅ 1 million tokens per day
- ✅ 1,500 requests per day

**For Your App:**
- Each fisherman query = ~1-2 requests
- Plenty for demos and testing!
- ~500-1000 queries per day

### Upgrade (If Needed)

For production/heavy use:
1. **Go to:** https://console.cloud.google.com/billing
2. **Enable** billing
3. **Upgrade** to paid tier
4. **Get:** Higher limits + faster models

---

## 🔧 STEP 6: OPTIMIZE YOUR INTEGRATION

### Current Implementation

Your code already has:
- ✅ **Multi-model fallback** (tries 3 models)
- ✅ **Error handling** (graceful degradation)
- ✅ **Proper headers** (`User-Agent: aistudio-build`)
- ✅ **Environment variable** (secure)

### Optional: Add Retry Logic

If you want even more reliability:

```typescript
// In server/agents/orchestrator.ts
// Add after line 100

private async callGeminiWithRetry(
  prompt: string, 
  maxRetries = 3
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await this.callGemini(prompt);
    if (result) return result;
    
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return null;
}
```

### Optional: Add Usage Logging

Track your API usage:

```typescript
// After line 97 in orchestrator.ts
console.log(`[Gemini] Request successful with ${model}`);
console.log(`[Gemini] Response length: ${response.text.length}`);
```

---

## 🌍 STEP 7: REGIONAL OPTIMIZATION

### Best Regions for India

For lowest latency, deploy in:

**Railway:**
- Auto-selects closest region

**Render:**
- Singapore (asia-southeast1)

**Google Cloud Run:**
```bash
--region asia-south1  # Mumbai
--region asia-southeast1  # Singapore
```

**Vercel:**
- Automatically uses edge network

---

## 🔐 STEP 8: SECURITY BEST PRACTICES

### ✅ Already Implemented

Your project already does:
- ✅ API key in environment variable (not hardcoded)
- ✅ Server-side calls only (not exposed to client)
- ✅ Proper error handling (no key leakage)

### Additional Security (Optional)

**1. Restrict API Key (Recommended)**

In Google AI Studio:
1. **Click** your API key
2. **Set restrictions:**
   - IP restrictions (your server IP)
   - HTTP referrers (your domain)

**2. Rotate Keys Regularly**

Every 90 days:
1. Create new API key
2. Update environment variable
3. Delete old key

**3. Monitor for Abuse**

Check usage dashboard daily during demo period.

---

## 📱 STEP 9: MULTILINGUAL TESTING

### Test Each Language

Your Gemini integration supports:

1. **Tamil** - தமிழ்
   - Query: "இன்று எங்கே மீன்பிடிக்கலாம்?"
   - Gemini generates Tamil response

2. **Hindi** - हिन्दी
   - Query: "आज मछली कहाँ पकड़ सकता हूँ?"
   - Gemini generates Hindi response

3. **Telugu** - తెలుగు
   - Query: "ఈరోజు ఎక్కడ చేపలు పట్టవచ్చు?"
   - Gemini generates Telugu response

4. **Malayalam** - മലയാളം
   - Query: "ഇന്ന് എവിടെ മീൻ പിടിക്കാം?"
   - Gemini generates Malayalam response

5. **Kannada** - ಕನ್ನಡ
   - Query: "ಇಂದು ಎಲ್ಲಿ ಮೀನು ಹಿಡಿಯಬಹುದು?"
   - Gemini generates Kannada response

6. **English**
   - Query: "Where can I fish today?"
   - Gemini generates English response

### How It Works

```typescript
// Your orchestrator automatically:
1. Receives query in any language
2. Passes to Gemini with language context
3. Gemini generates response in same language
4. Returns to user via voice
```

---

## 🎯 STEP 10: VERIFY EVERYTHING WORKS

### Complete Test Checklist

- [ ] API key created in AI Studio
- [ ] Environment variable set in deployment
- [ ] App deployed and accessible
- [ ] Fisherman login works
- [ ] Auto-greeting speaks (without Gemini)
- [ ] Voice query triggers agents
- [ ] **Gemini generates natural response** ✨
- [ ] Response is in correct language
- [ ] Response makes sense (contextual)
- [ ] PFZ/map data displayed
- [ ] No errors in logs

### Expected Behavior

**Without Gemini (fallback):**
- Templated responses
- Still works, but less natural

**With Gemini (working):**
- Natural language responses
- Context-aware explanations
- Proper grammar in all languages
- Synthesizes marine data intelligently

---

## 🐛 TROUBLESHOOTING

### "API Key Invalid"

**Solutions:**
```bash
# 1. Check key format (must start with AIza...)
echo $GEMINI_API_KEY

# 2. Verify in AI Studio
# Go to: https://aistudio.google.com/app/apikey
# Check: Key is enabled

# 3. Restart deployment after adding key
railway restart  # or
render redeploy  # or
vercel redeploy
```

### "Quota Exceeded"

**Free tier limit reached:**
- ✅ Wait 24 hours (resets daily)
- ✅ Or upgrade to paid tier
- ✅ Or use fallback responses (automatic)

### "Model Not Found"

**Model name changed:**
- ✅ Your code tries 3 models
- ✅ At least one should work
- ✅ Check logs for actual model used

### "Network Error"

**Firewall/region issue:**
- ✅ Check server region (Asia preferred)
- ✅ Check firewall rules
- ✅ Verify outbound HTTPS allowed

---

## 📊 WHAT GEMINI POWERS IN YOUR APP

### 1. Natural Language Synthesis (Main Use)

**Input:** Raw ocean data + fisherman query  
**Gemini:** Synthesizes into natural explanation  
**Output:** "I found a suitable fishing zone 8.2 km northeast..."

### 2. Multilingual Generation

**Input:** Query in Tamil  
**Gemini:** Generates response in Tamil  
**Output:** "சாதகமான மீன்பிடி மண்டலம் கண்டுபிடிக்கப்பட்டது..."

### 3. Contextual Explanations

**Input:** "Why is this a good fishing area?"  
**Gemini:** Explains based on SST, chlorophyll, currents  
**Output:** Detailed but fisherman-friendly explanation

### 4. Follow-up Understanding

**Input:** "Take me there" (context: previous PFZ recommendation)  
**Gemini:** Understands reference  
**Output:** Navigates to previously mentioned zone

---

## 🎓 FOR YOUR HACKATHON

### Demo Talking Points

1. **"We use Google's Gemini AI"**
   - Latest Gemini 3.7 Flash model
   - Multi-model fallback for reliability
   - Real-time natural language generation

2. **"6 Language Support"**
   - Gemini generates responses in all Indian languages
   - Context-aware translations
   - Natural, not templated

3. **"Intelligent Synthesis"**
   - Combines 8 specialized agents
   - Gemini synthesizes into one answer
   - Explainable AI (XAI)

### Live Demo Flow

1. Show English query → Natural response
2. Switch to Tamil → Tamil response
3. Ask complex question → Gemini synthesizes
4. Highlight: "This is real AI, not templates!"

---

## ✅ SUMMARY

### What You Have Now

- ✅ **Google Gemini Integration** (already in code)
- ✅ **Multi-model Fallback** (3 models)
- ✅ **6 Language Support** (via Gemini)
- ✅ **Intelligent Synthesis** (marine data → natural language)
- ✅ **Production Ready** (error handling, security)

### What You Need to Do

1. **Get API key** (1 minute) → https://aistudio.google.com/app/apikey
2. **Deploy with key** (3 minutes) → Railway/Render
3. **Test voice queries** (2 minutes) → Verify Gemini works

### Total Time

**~5 minutes** to connect everything!

---

## 📞 RESOURCES

- **AI Studio:** https://aistudio.google.com/
- **API Keys:** https://aistudio.google.com/app/apikey
- **Documentation:** https://ai.google.dev/docs
- **Usage Dashboard:** https://aistudio.google.com/app/apikey
- **SDK Reference:** https://github.com/google/generative-ai-js

---

**Your SAMUDRA AI is ready to connect to Google AI Studio! 🚀**

Just get your API key and deploy - the integration is already complete and production-ready.
