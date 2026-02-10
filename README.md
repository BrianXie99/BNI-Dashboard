# BNI Dashboard PWA

A Progressive Web App (PWA) for managing BNI (Business Network International) business activities, members, and insights with AI-powered recommendations.

## Features

- **Member Management** - Upload and manage member information
- **Weekly Activity Upload** - Upload weekly activity Excel files with automatic member matching
- **Terms/Meeting Tracking** - Track meeting terms and schedules
- **Dashboard** - Visual statistics with KPIs and charts
- **Reports** - Weekly summaries and member performance reports
- **AI Insights** - Business recommendations and member matching

## Tech Stack

- **Frontend**: Next.js 14+ (App Router) + React 18
- **UI**: shadcn/ui + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Excel Processing**: xlsx library
- **Charts**: Recharts
- **AI**: OpenAI API (optional)
- **PWA**: next-pwa

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Railway/Render/Neon for hosted DB)
- (Optional) OpenAI API key for AI features

## Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/bni_dashboard?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   OPENAI_API_KEY="your-openai-api-key-here" # Optional
   ```

4. **Set up the database**
   
   Generate Prisma client:
   ```bash
   npx prisma generate
   ```
   
   Run migrations:
   ```bash
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

## Excel Upload Format

### Members Excel

| Column | Description | Type | Required |
|--------|-------------|------|----------|
| Phone_ID | Unique phone identifier | String | Yes |
| Member_Number | Member number | String | Yes |
| Name | Member name | String | Yes |
| Industry | Business industry/category | String | Yes |
| Master | Master member (if applicable) | String | No |
| Join_Date | Date joined BNI | Date | Yes |
| Status | Member status (Active/Inactive) | String | Yes |

### Weekly Activity Excel

| Chinese Column | English Translation | Database Field | Type | Required |
|----------------|-------------------|----------------|------|----------|
| 名称 | Name | `memberName` | String | Yes |
| 身份 | Identity | `identity` | String | No |
| 出席情况 | Attendance Status | `attendance` | String | Yes |
| 提供内部引荐 | Provide Inside Referrals | `provideInsideRef` | Number | Yes |
| 提供外部引荐 | Provide Outside Referrals | `provideOutsideRef` | Number | Yes |
| 收到内部引荐 | Receive Inside Referrals | `receivedInsideRef` | Number | Yes |
| 收到外部引荐 | Receive Outside Referrals | `receivedOutsideRef` | Number | Yes |
| 来宾 | Visitors | `visitors` | Number | Yes |
| 一对一会面 | One-to-One Meeting | `oneToOneVisit` | Number | Yes |
| 交易价值 | Transaction Value | `tyfcb` | Number | Yes |
| CEU | CEU | `ceu` | Number | Yes |

**Attendance Status Values:**
- 出席 (Present)
- 缺席
- 迟到
- 替代人
- 请假

### Terms Excel

| Column | Description | Type | Required |
|--------|-------------|------|----------|
| terms | Term/period name | String | Yes |
| start time | Start time | DateTime | Yes |
| end time | End time | DateTime | Yes |
| weekNumber | Week number (1-52) | Number | Yes |
| date | Date | Date | Yes |
| meeting or not | Is meeting | Boolean | Yes |
| remarks | Remarks/notes | String | No |

## Project Structure

```
.
├── prisma/
│   └── schema.prisma          # Database schema
├── public/
│   └── manifest.json            # PWA manifest
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── members/       # Member CRUD
│   │   │   ├── activities/    # Activity upload
│   │   │   ├── terms/         # Terms management
│   │   │   └── dashboard/     # Dashboard data
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── members/            # Member pages
│   │   ├── activities/         # Activity pages
│   │   └── terms/              # Terms pages
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/            # Reusable components
│   └── lib/                  # Utilities
│       ├── prisma.ts          # Prisma client
│       └── excel-parser.ts     # Excel parsing
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── .env.example
```

## API Routes

### Members
- `GET /api/members` - Get all members
- `POST /api/members` - Create new member
- `PUT /api/members` - Update member
- `DELETE /api/members?id={id}` - Delete member

### Activities
- `POST /api/activities/upload/weekly` - Upload weekly activity Excel

### Terms
- `GET /api/terms` - Get all terms
- `POST /api/terms` - Create new term
- `PUT /api/terms` - Update term
- `DELETE /api/terms?id={id}` - Delete term

### Dashboard
- `GET /api/dashboard/summary?weekNumber={n}&year={y}` - Get dashboard summary

### Reports
- `GET /api/reports/weekly?year={y}` - Get weekly reports
- `GET /api/reports/activities?weekNumber={n}&year={y}` - Get member activities for a week

### AI Insights
- `GET /api/ai-insights` - Get AI insights, performance analysis, and member matches
- `POST /api/ai-insights/generate` - Generate new AI insights

## Testing

### Manual Testing Checklist

#### Authentication
- [ ] User can login with valid credentials
- [ ] User cannot login with invalid credentials
- [ ] User can logout successfully
- [ ] Protected routes redirect to login when not authenticated
- [ ] Session persists across page refreshes

#### Member Management
- [ ] Can view all members
- [ ] Can search members by name, number, or industry
- [ ] Can create a new member
- [ ] Can edit an existing member
- [ ] Can delete a member
- [ ] Member status badges display correctly

#### Dashboard
- [ ] Dashboard loads with correct statistics
- [ ] Can filter by week number
- [ ] Charts render correctly
- [ ] Top performers display correctly

#### Reports
- [ ] Can view weekly reports
- [ ] Can select different years
- [ ] Can select specific weeks
- [ ] Can export reports to CSV
- [ ] Can export member activities to CSV
- [ ] Can export all reports to CSV

#### AI Insights
- [ ] Can view AI insights
- [ ] Can generate new AI insights
- [ ] Performance analysis displays correctly
- [ ] Member matching displays correctly
- [ ] Insight badges have correct colors

#### PWA Features
- [ ] App installs as PWA on mobile
- [ ] App works offline
- [ ] Offline page displays correctly
- [ ] App icon displays correctly
- [ ] App theme color matches branding

### Running Tests

Currently, this project uses manual testing. To add automated testing:

```bash
# Install testing dependencies (when added)
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Run tests (when configured)
npm test
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` - Generate a random secret string
   - `OPENAI_API_KEY` - (Optional) Your OpenAI API key for AI features
4. Deploy
5. After deployment, run database migrations:
   ```bash
   npx prisma db push
   ```

### Railway

1. Create a new project in Railway
2. Connect PostgreSQL database (Railway provides a free tier)
3. Deploy from GitHub
4. Add environment variables in Railway dashboard
5. Railway will automatically build and deploy

### Render

1. Create a new web service in Render
2. Connect PostgreSQL database (Render provides a free tier)
3. Deploy from GitHub
4. Add environment variables in Render dashboard
5. Render will automatically build and deploy

### Environment Variables Required

All deployment platforms require these environment variables:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-random-secret-key"
OPENAI_API_KEY="sk-..."  # Optional, for AI features
```

### Generating NEXTAUTH_SECRET

Generate a secure random secret for production:

```bash
# On Linux/Mac
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database Setup on Production

After deployment, you need to set up your database:

1. Run Prisma migrations:
   ```bash
   npx prisma db push
   ```

2. Seed the database with admin user:
   ```bash
   npm run db:seed
   ```

3. Change the default admin password after first login!

### Troubleshooting Deployment

**Issue: Database connection errors**
- Verify `DATABASE_URL` is correct
- Ensure database allows remote connections
- Check SSL settings in connection string

**Issue: Auth not working**
- Verify `NEXTAUTH_URL` matches your domain
- Ensure `NEXTAUTH_SECRET` is set
- Check that cookies are enabled in browser

**Issue: PWA not installing**
- Ensure app is served over HTTPS (required for PWA)
- Verify manifest.json is accessible at `/manifest.json`
- Check service worker is registered

**Issue: Build errors**
- Ensure all dependencies are installed: `npm install`
- Clear Next.js cache: `rm -rf .next`
- Try building locally first: `npm run build`

## Development

### Run development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## License

MIT

## Support

For issues or questions, please refer to the architecture document at `plans/bni-dashboard-architecture.md`.
