# Back Office POS Management System

## Overview
This is a comprehensive Point of Sale (POS) back office management system built with React, TypeScript, and Vite. The application provides a complete management interface for cooperative businesses, including business units, products, transactions, financial reports, and member management.

**Current Status:** Fully configured and running on Replit
**Last Updated:** October 6, 2025

## Project Architecture

### Frontend Stack
- **Framework:** React 19.1.1 with TypeScript
- **Build Tool:** Vite 6.2.0
- **Styling:** TailwindCSS v4.1.14 (via npm with @tailwindcss/postcss)
- **Color Theme:** Custom primary color #e7000b (red)
- **Charts:** Recharts 3.1.2
- **Module System:** ES Modules with import maps

### Backend Integration
- **External API:** `https://api.majukoperasiku.my.id`
- **Authentication:** Token-based authentication via `/auth/account`
- **Data Management:** RESTful API endpoints for all CRUD operations

### Key Features
1. **Dashboard** - Overview analytics and quick stats
2. **Business Management (Usaha)**
   - Business Unit Management
   - Outlet Management
   - Product Management (Goods & Rentals)
   - Product Categories
   - Transaction History
   - Employee Management
   - Customer Management
   - Customer Categories
   - Tax Management
   - Payment Methods
   - Units Management
   - Promotions
   - Profit/Loss Reports

3. **Financial Management (Keuangan)**
   - Journal Entries
   - Balance Sheet Reports
   - Financial Ratio Analysis
   - Chart of Accounts
   - Cash Flow Reports
   - Equity Change Reports

4. **Cooperative Management (Koperasi)**
   - Member Management
   - Cooperative Operations

5. **Budget Proposals (Pengajuan)**
   - Budget submission and approval workflow

6. **Settings (Pengaturan)**
   - User Management
   - System Configuration

## Development Setup

### Replit Configuration
- **Dev Server Port:** 5000
- **Host:** 0.0.0.0 (allows Replit proxy access)
- **HMR Protocol:** WSS on port 443
- **Workflow:** "Dev Server" running `npm run dev`

### Running Locally
```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5000`

## Deployment

The project is configured for Replit Autoscale deployment:
- **Build Command:** `npm run build`
- **Run Command:** `npx vite preview --port 5000 --host`
- **Deployment Type:** Autoscale (stateless web application)

## File Structure

```
/
├── components/          # React components
│   ├── icons/          # Icon components
│   ├── placeholders/   # Placeholder/stub components
│   └── *.tsx           # Main feature components
├── contexts/           # React contexts
│   └── NotificationContext.tsx
├── hooks/              # Custom React hooks
│   └── usePosData.ts
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
├── types.ts            # TypeScript type definitions
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## User Preferences
None documented yet.

## Recent Changes
- **October 15, 2025**: Custom color theme implementation
  - Migrated from Tailwind CSS CDN to npm-based Tailwind v4.1.14
  - Implemented custom primary color palette with #e7000b as brand color
  - Replaced all indigo colors with primary red across all components
  - Updated navigation (TopNav, Sidebar), buttons, and UI elements with new color scheme
  - Configured @tailwindcss/postcss for proper Tailwind v4 support
  
- **October 6, 2025**: Initial import and Replit configuration
  - Updated Vite config to use port 5000 with proper HMR settings
  - Configured deployment for Autoscale
  - Set up Dev Server workflow
  - Dependencies installed successfully

## Important Notes

### Authentication
The application connects to an external API for authentication and data management. Users must have valid credentials for the `majukoperasiku.my.id` API to use the application.

### State Management
The application uses React Context for notifications and localStorage for:
- User authentication state
- Current view state (main and sub-views)
- Selected business unit

### External Dependencies
- **Tailwind CSS**: npm package v4.1.14 with @tailwindcss/postcss
- **React & Dependencies**: Loaded via AI Studio CDN (aistudiocdn.com)

### Custom Theming
The application uses a custom color palette with #e7000b as the primary brand color:
- Primary 50-950: Complete color scale from lightest to darkest
- Applied consistently across navigation, buttons, links, and interactive elements
- Semantic colors (green for success, yellow for warnings, red for errors) remain unchanged

### API Endpoints
The application communicates with the following main endpoints:
- `/auth/account` - Authentication
- `/manage/business` - Business units
- `/manage/outlets` - Outlet management
- `/manage/products` - Product management
- `/manage/finance/*` - Financial reports and data
- `/manage/customers` - Customer management
- `/manage/members` - Cooperative member management
- `/manage/budget-proposals` - Budget proposals

## Known Issues
None at this time.

## Future Improvements
- Consider migrating from CDN-based dependencies to npm packages for better offline support
- Implement proper error boundary components
- Add loading states and skeleton screens
- Consider implementing Progressive Web App (PWA) features
