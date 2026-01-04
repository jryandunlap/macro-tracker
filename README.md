# Macro Tracker - AI-Powered Nutrition Tracking

A mobile-first nutrition tracking app with AI-powered food logging using Claude API and Supabase backend.

## Features

- 📊 **Smart Onboarding**: Personalized macro calculations based on your stats and goals
- 🤖 **AI Food Parsing**: Natural language food logging powered by Claude
- 🎯 **Daily Tracking**: Visual progress indicators for calories and macros
- 🔥 **Streaks & Stats**: Track your consistency and weekly averages
- ⚡ **Quick-Add**: Auto-generated shortcuts from your most frequent foods

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Deployment**: Vercel

## Deployment Instructions

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new account (if you don't have one)
2. Click "New Project"
3. Enter project details:
   - Name: `macro-tracker`
   - Database Password: (create a strong password)
   - Region: (choose closest to you)
4. Wait for the project to be created (~2 minutes)
5. Once created, go to the SQL Editor (left sidebar)
6. Click "New Query"
7. Copy and paste the entire contents of `supabase-schema.sql` from this project
8. Click "Run" to create all tables
9. Go to Settings > API to get your credentials:
   - Copy `Project URL` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy `anon/public` key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 2. Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to "API Keys" in the left sidebar
4. Click "Create Key"
5. Name it "macro-tracker" and create
6. Copy the key (this is your `ANTHROPIC_API_KEY`)
7. **Important**: This key can only be viewed once, save it securely!

### 3. Deploy to Vercel

#### Option A: Deploy from GitHub (Recommended)

1. Push this code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign up/login
3. Click "Add New..." > "Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ANTHROPIC_API_KEY=<your-anthropic-api-key>
   ```
7. Click "Deploy"
8. Wait for deployment (~2-3 minutes)
9. Your app will be live at `https://your-project.vercel.app`

#### Option B: Deploy with Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to the project directory:
   ```bash
   cd macro-tracker-app
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? (select your account)
   - Link to existing project? **N**
   - Project name? **macro-tracker**
   - Directory? **./**
   - Override settings? **N**

5. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add ANTHROPIC_API_KEY
   ```
   (Paste each value when prompted)

6. Deploy to production:
   ```bash
   vercel --prod
   ```

### 4. Test Your App

1. Open your Vercel URL
2. Complete the onboarding flow
3. Try logging some food (e.g., "grilled chicken breast with rice")
4. Check that the AI parses it correctly
5. View your dashboard and stats

## Local Development

If you want to run locally:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```
4. Run development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

### Food Logging with AI
When you log food, the app:
1. Sends your description to Claude API
2. Claude analyzes and returns:
   - Canonical name (normalized)
   - Estimated calories, protein, carbs, fat
   - Portion assumptions
3. Saves to Supabase with both original description and canonical name

### Smart Quick-Adds
The app automatically:
1. Analyzes your food log from the last 30 days
2. Groups similar items by canonical name (AI-normalized)
3. Calculates average nutrition per item
4. Shows your top 4 most frequent foods
5. Updates as your habits change

### Nutrition Calculations
- **TDEE**: Uses Mifflin-St Jeor equation
- **Protein**: 0.8-1.0g per lb based on goal
- **Fat**: 25% of total calories
- **Carbs**: Fills remaining calories

## Troubleshooting

**Food logging not working?**
- Check Anthropic API key is set correctly
- Verify you have API credits
- Check browser console for errors

**Data not saving?**
- Verify Supabase credentials
- Check that tables were created (run schema.sql)
- Make sure RLS policies are enabled

**Deployment failed?**
- Ensure all environment variables are set
- Check build logs in Vercel dashboard
- Verify Node.js version compatibility

## Future Enhancements

- [ ] Voice input for food logging
- [ ] Photo-based food logging
- [ ] Meal planning suggestions
- [ ] Export data to CSV
- [ ] Integration with fitness apps
- [ ] Multi-user support with authentication
- [ ] Edit/delete food entries
- [ ] Custom food database
- [ ] Micronutrient tracking

## Cost Estimates

- **Vercel**: Free tier (plenty for personal use)
- **Supabase**: Free tier (500MB database, 50,000 monthly active users)
- **Anthropic API**: 
  - Claude Sonnet: ~$3 per million input tokens, ~$15 per million output tokens
  - Estimate: ~$0.01-0.02 per food log
  - Monthly cost for daily logging: ~$0.30-0.60

## License

MIT
