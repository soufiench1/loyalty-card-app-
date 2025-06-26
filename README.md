# Loyalty Card App

A digital loyalty card system for small businesses built with Next.js, Supabase, and Tailwind CSS.

## Features

- 🎯 Customer registration with QR codes (named with customer name)
- 📱 Item-based point scanning system
- 🛍️ Item management (add, edit, delete items)
- 🎁 Automatic reward redemption per item
- 👨‍💼 Admin dashboard with item management
- 🔐 Secure authentication
- 📊 Analytics and statistics

## Local Development Setup

### 1. Clone and Install

\`\`\`bash
git clone <your-repo>
cd loyalty-card-app
npm install
\`\`\`

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and anon key
3. Go to SQL Editor and run the setup script from `scripts/setup-database.sql`

### 3. Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
\`\`\`

### 4. Run Locally

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

## Deployment to Vercel

### 1. Push to GitHub

\`\`\`bash
git add .
git commit -m "Initial commit"
git push origin main
\`\`\`

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repository
2. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `JWT_SECRET`

### 3. Deploy

\`\`\`bash
vercel --prod
\`\`\`

## Usage

### Admin Access
- URL: `/admin`
- Default credentials: `admin` / `password123`

### Customer Registration
- URL: `/`
- Customers enter name and PIN (4 digits)
- QR code is generated and downloadable with customer name

### Item Management (Admin)
- Add, edit, delete items
- Set point values and prices for each item
- Activate/deactivate items

### QR Scanning
- URL: `/scan`
- Owner scans customer QR code
- Selects purchased item
- Points are added based on item's point value

## Default Settings

- **Store PIN**: `1234` (changeable in admin)
- **Points for reward**: `10` (changeable in admin)
- **Admin username**: `admin` (changeable in admin)
- **Admin password**: `password123` (changeable in admin)

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **QR Codes**: qrcode library (local generation)
