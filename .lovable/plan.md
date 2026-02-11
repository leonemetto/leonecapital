

## Security Fixes Plan

### Finding 1: Add DELETE policy to profiles table (FIX)
Add an RLS policy so users can delete their own profile. This is a legitimate gap — without it, users cannot remove their data.

**SQL Migration:**
```sql
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE
USING (auth.uid() = user_id);
```

### Finding 2: Account balance manipulation (DISMISS)
This warning flags that users can edit their own `current_balance` and `starting_balance`. Since this is a **personal trading journal** where users manage their own accounts, this is expected and intended behavior — not a security issue. This finding will be marked as ignored.

### Finding 3: Trade P&L manipulation (DISMISS)
Same reasoning: users editing their own trade records (including P&L) is the core functionality of a personal journal app. There's no multi-user audit requirement. This finding will be marked as ignored.

### Technical Steps
1. Run a database migration to add the DELETE policy on `profiles`
2. Mark finding 1 as resolved (delete from scan results)
3. Mark findings 2 and 3 as ignored with explanation that this is a personal journal app where users own and manage their own data

No frontend code changes are needed.
