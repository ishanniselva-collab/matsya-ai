# 🚀 SAMUDRA AI - DEPLOYMENT GUIDE

**Quick Setup: Get SAMUDRA AI running live in 5 minutes!**

---

## ⚡ FASTEST METHOD: Railway (Recommended)

Railway is the fastest way to deploy - it's free and takes 3 minutes.

### Step 1: Get Gemini API Key (1 minute)
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AI...`)
4. Save it somewhere - you'll need it in Step 3

### Step 2: Deploy to Railway (1 minute)
1. Go to: https://railway.app/
2. Click "Start a New Project"
3. Choose "Deploy from GitHub repo"
4. Connect your GitHub account
5. Push your code to GitHub (or use Railway CLI - see below)
6. Select the repository
7. Railway will auto-detect the Node.js app

### Step 3: Add Environment Variable (30 seconds)
1. In Railway dashboard, click your project
2. Go to "Variables" tab
3. Click "New Variable"
4. Name: `GEMINI_API_KEY`
5. Value: Paste your API key from Step 1
6. Click "Add"

### Step 4: Test Your App! (30 seconds)
1. Railway will give you a URL like: `https://your-app.up.railway.app`
2. Click the URL
3. You should see SAMUDRA AI landing page!
4. Click the Fisherman card
5. Enter your name
6. Test the voice features!

**Done! 🎉**

---

## 📦 Alternative: Using Railway CLI

If you don't want to use GitHub:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Add environment variable
railway variables set GEMINI_API_KEY=your_key_here

# Deploy
railway up
```

Railway will give you a URL immediately!

---

## 🔧 Alternative Method: Render

Render is another good free option.

### Step 1: Get Gemini API Key
Same as Railway Step 1 above.

### Step 2: Deploy to Render
1. Go to: https://render.com/
2. Sign up / Login
3. Click "New +"
4. Choose "Web Service"
5. Connect GitHub or use "Public Git Repository"
6. Enter your repo URL
7. Render auto-detects settings from `render.yaml`

### Step 3: Add Environment Variable
1. In "Environment" section
2. Add: `GEMINI_API_KEY` = your key
3. Click "Create Web Service"

### Step 4: Wait & Test
1. Render builds and deploys (takes 2-3 minutes)
2. You'll get a URL like: `https://samudra-ai.onrender.com`
3. Test the app!

---

## 🐙 Alternative: Push to GitHub First

If you haven't already:

```bash
cd "/Users/ishanni/Downloads/orca-project 2"

# Initialize git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "SAMUDRA AI - Complete Fisherman Experience"

# Create GitHub repo (via website or CLI)
# Then push:
git remote add origin https://github.com/yourusername/samudra-ai.git
git branch -M main
git push -u origin main
```

Then use Railway or Render with GitHub integration.

---

## 🌐 Alternative: Vercel (Frontend Only)

**Note:** Vercel works best for frontend-only. Backend agents need Railway/Render.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Add GEMINI_API_KEY when asked
```

---

## ✅ WHAT YOU NEED

### Required:
- **Gemini API Key** (free from Google)
  - Get it: https://makersuite.google.com/app/apikey
  - Used for: AI agent responses

### Optional:
- **ML Service** (for advanced PFZ predictions)
  - App works without it
  - Falls back to baseline PFZ data

---

## 🧪 TESTING YOUR DEPLOYMENT

Once deployed, test these features:

### 1. Landing Page ✅
- Ocean video background loads
- Three role cards visible
- Click Fisherman card

### 2. Authentication ✅
- Modal appears
- Enter name (e.g., "Test User")
- Click Continue

### 3. Auto-Greeting 🔊
- **Turn on sound!**
- SAMUDRA should speak automatically
- Should say your name
- Tamil by default

### 4. Voice Interaction 🎤
- Click microphone button (large circle)
- **Allow microphone permission**
- Speak: "Where can I fish today?"
- Watch: PLANNING → EXECUTING → SPEAKING
- Listen: Voice response
- See: PFZ zones on map

### 5. Multi-Language 🌍
- Switch language (top right)
- Try Tamil, Hindi, English
- Voice should respond in same language

### 6. Navigation 🧭
- Click "Navigate to [Zone]" button
- Full-screen navigation opens
- Distance, ETA shown
- (GPS works on mobile devices)

### 7. Bottom Navigation 📱
- Click "HOME" - Map view
- Click "MY TRIPS" - History (after completing a trip)
- Click "SAFETY" - Risk status

---

## 🐛 TROUBLESHOOTING

### "API Key Invalid"
- Check your Gemini API key
- Make sure it starts with `AI...`
- Make sure it's set in environment variables
- Restart the deployment after adding

### "Voice not working"
- Allow microphone permission in browser
- Use Chrome or Edge (best support)
- Some languages may use English voice (browser limitation)

### "Page loads but app doesn't work"
- Check browser console for errors (F12)
- Make sure environment variables are set
- Check deployment logs

### "Build failed"
- This shouldn't happen with tsx in dependencies
- Check deployment logs
- Make sure Node 18+ is used

---

## 📊 DEPLOYMENT STATUS

After deployment, your app will have:

✅ Professional Fisherman UI  
✅ Voice-first interaction (6 languages)  
✅ Auto-greeting with name  
✅ Agent orchestration (8 agents)  
✅ Real ML model (PFZ predictions)  
✅ Interactive map  
✅ GPS tracking (on mobile)  
✅ Navigation mode  
✅ Trip history  
✅ Safety alerts  
✅ Bottom navigation  

---

## 💡 TIPS

1. **First deployment takes 3-5 minutes**
   - Subsequent deployments are faster
   - Railway/Render cache dependencies

2. **Free tier limitations:**
   - Railway: Free with GitHub Student Pack
   - Render: Free tier available
   - May sleep after inactivity (wakes on visit)

3. **Mobile testing:**
   - Open the deployed URL on your phone
   - Voice and GPS work better on mobile
   - Add to home screen (PWA-like experience)

4. **For SIH Demo:**
   - Test the full flow before demo
   - Keep the URL handy
   - Have a backup (screenshot/video)
   - Test on mobile device

---

## 🎯 SUMMARY

**Recommended Flow:**

1. Get Gemini API Key → https://makersuite.google.com/app/apikey
2. Deploy to Railway → https://railway.app/
3. Add GEMINI_API_KEY environment variable
4. Get your URL (e.g., `https://samudra-ai.up.railway.app`)
5. Test the app!
6. Share the URL with anyone to demo

**Total Time:** ~5 minutes

**Cost:** $0 (Free tier)

---

## 📞 NEED HELP?

Check these files:
- `PRODUCTION_READY_SUMMARY.md` - What's implemented
- `QUICK_START_GUIDE.md` - Testing guide
- `.env.production.example` - Environment variables reference

---

**Your SAMUDRA AI app is ready to deploy! 🌊🐟**

Choose Railway for fastest deployment (recommended), or Render for alternative.

Both are free and work perfectly for this app.

Good luck with your hackathon demo! 🚀
