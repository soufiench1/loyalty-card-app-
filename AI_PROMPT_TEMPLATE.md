# AI Prompt: Build a Digital Loyalty Card System

## Project Overview
Create a complete digital loyalty card system for small businesses that replaces traditional paper punch cards with QR code-based digital cards. The system should track customer points per individual item/product and automatically award rewards when thresholds are met.

## Core Requirements

### 1. Customer Registration System
- Simple registration form with customer name and 4-digit PIN
- Generate unique customer ID (format: LC + timestamp)
- Create downloadable QR code with customer's name as filename
- Display customer ID under QR code for manual entry option
- Store customer data securely

### 2. QR Code Generation & Management
- Generate QR codes locally (not using external services)
- QR codes should encode the customer ID
- Provide download functionality with customer name in filename
- Display QR code immediately after registration
- Include copy-to-clipboard functionality for customer ID

### 3. Item-Based Point System
- Admin can create/edit/delete items with individual point values
- Each item has: name, description, point value, price, active status
- Track points separately for each item per customer
- When customer reaches point threshold for ANY item, they earn a reward
- Reset that item's points to zero after reward, keep other items' points

### 4. Admin Dashboard
- Secure login with configurable credentials (default: admin/password123)
- View all customers and their point totals
- Manage items (CRUD operations)
- View system statistics (total customers, rewards redeemed, etc.)
- Configure system settings (store PIN, points needed for reward, admin credentials)
- Session management with 30-minute timeout

### 5. QR Code Scanning System
- Camera-based QR code scanner using device camera
- Manual customer ID entry as backup
- Display customer information after scanning (name, current points per item, total rewards)
- Select purchased item and automatically add points
- Show updated point totals after transaction
- Admin authentication required (shares session with admin dashboard)

### 6. Database Schema
\`\`\`sql
-- Customers table
customers: id (text), name (text), pin (text), points (int), rewards (int), qr_code (text), created_at (timestamp)

-- Items table  
items: id (serial), name (text), description (text), points_value (int), price (decimal), is_active (boolean), created_at (timestamp)

-- Customer item points (tracks points per item per customer)
customer_item_points: id (serial), customer_id (text), item_id (int), points (int), created_at (timestamp)

-- Settings table
settings: id (serial), store_pin (text), points_for_reward (int), admin_username (text), admin_password (text), updated_at (timestamp)

-- Transaction log
point_transactions: id (serial), customer_id (text), item_id (int), points_added (int), reward_earned (boolean), created_at (timestamp)
\`\`\`

### 7. Technical Stack
- **Frontend**: Next.js 14 with React 18, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **QR Generation**: qrcode npm package (local generation)
- **QR Scanning**: jsqr npm package with HTML5 camera API
- **Authentication**: JWT with localStorage session management
- **Deployment**: Vercel

### 8. Key Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Session Management**: 30-minute sessions with countdown timer
- **Real-time Updates**: Points update immediately after scanning
- **Offline-First QR Generation**: No external API dependencies
- **Security**: PIN protection for customers, admin authentication
- **Analytics**: Basic reporting on customer activity and popular items

### 9. User Flows

#### Customer Registration Flow:
1. Customer visits homepage
2. Enters name and 4-digit PIN
3. System generates unique ID and QR code
4. Customer downloads QR code (named with their name)
5. Customer saves QR code to phone

#### Point Addition Flow:
1. Admin/staff logs into scan page
2. Customer shows QR code or provides ID
3. Staff scans QR code or enters ID manually
4. System displays customer info and current points per item
5. Staff selects purchased item
6. System adds points, checks for rewards, updates display
7. Customer notified if reward earned

#### Admin Management Flow:
1. Admin logs into dashboard
2. Views customer list, statistics, and system health
3. Manages items (add/edit/delete products)
4. Configures system settings
5. Accesses scan page directly from admin panel

### 10. Environment Variables Needed
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret
\`\`\`

### 11. File Structure
\`\`\`
app/
├── page.tsx (customer registration)
├── admin/page.tsx (admin dashboard)
├── scan/page.tsx (QR scanning interface)
├── api/
│   ├── customers/register/route.ts
│   ├── customers/[id]/points/route.ts
│   ├── admin/login/route.ts
│   ├── admin/customers/route.ts
│   ├── admin/stats/route.ts
│   ├── admin/settings/route.ts
│   ├── items/route.ts
│   ├── items/[id]/route.ts
│   ├── points/add/route.ts
│   └── points/add-admin/route.ts
├── components/
│   └── qr-scanner.tsx
└── lib/
    ├── supabase.ts
    ├── qr-generator.ts
    └── session.ts
\`\`\`

### 12. Special Requirements
- Auto-launch camera when entering scan page
- No PIN required for admin scanning (separate from customer PIN)
- Session shared between admin and scan pages
- Default sample items created during database setup
- Comprehensive error handling and user feedback
- Mobile-first responsive design
- Accessibility features (ARIA labels, keyboard navigation)

### 13. Business Logic Rules
- Points are tracked separately for each item per customer
- Rewards earned when ANY item reaches the threshold (default: 10 points)
- Only the specific item's points are reset after reward redemption
- Inactive items don't appear in scanning interface
- Admin can modify point values and reward thresholds
- All transactions are logged for audit purposes

### 14. Success Criteria
- Customer can register and download QR code in under 2 minutes
- Staff can scan QR code and add points in under 30 seconds
- System handles 100+ concurrent users without performance issues
- All data persists reliably in database
- Admin can manage entire system through web interface
- Works reliably on mobile devices and various browsers

Build this system with clean, maintainable code, comprehensive error handling, and a user-friendly interface suitable for non-technical business owners.
