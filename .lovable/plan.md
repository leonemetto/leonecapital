

# Save Your Data to the Cloud

Right now, all your trades and accounts are stored in your browser's local storage -- meaning if you open a different browser or clear your data, everything is lost. Here's the plan to make your data persistent and accessible from anywhere.

## What You'll Get
- **Sign up / Log in** with email and password so your data is yours
- **All trades and accounts saved to the cloud** -- accessible from any browser or device
- **Updates won't erase anything** -- edits modify only what you change, everything else stays intact

## Plan

### Step 1: Create Database Tables
Set up two tables in your backend:

**accounts table**
- id, user_id, name, type (live/demo/prop), starting_balance, current_balance, currency, created_at

**trades table**
- id, user_id, date, instrument, direction, strategy, session, outcome, pnl, notes, account_id (links to accounts), created_at

Both tables will have security policies so each user can only see and modify their own data.

### Step 2: Add Authentication
- Create a simple **Login / Sign Up page** with email and password
- Protect all routes so only logged-in users can access the app
- Add a **logout button** to the navigation

### Step 3: Migrate Hooks to Use the Database
- Replace the localStorage-based `useTrades` and `useAccounts` hooks with versions that read/write from the cloud database
- Use React Query for efficient data fetching and caching
- All CRUD operations (add, update, delete) will go through the database

### Step 4: Update Contexts
- Update `TradesContext` and `AccountsContext` to use the new database-backed hooks
- No changes needed to the pages themselves -- they already use the shared contexts

## Technical Details

```text
Browser (React App)
    |
    v
Auth Gate (login/signup)
    |
    v
Contexts (TradesProvider, AccountsProvider)
    |
    v
Hooks (useTrades, useAccounts) -- now using Supabase client
    |
    v
Cloud Database (with Row Level Security per user)
```

- **Row Level Security (RLS)**: Each table will have policies ensuring users can only SELECT, INSERT, UPDATE, DELETE their own rows (matched by `auth.uid()`)
- **No data loss**: The migration adds cloud storage; existing localStorage data won't be touched, though new data will go to the database
- **Auto-confirm emails will NOT be enabled** -- you'll need to verify your email to sign in

