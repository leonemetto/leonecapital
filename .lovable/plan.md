

# Add Guide Tab to AppSidebar

The Guide tab is in `TopNav.tsx` but missing from `AppSidebar.tsx`, which is the actual sidebar component used in `AppLayout`.

## Change

**`src/components/layout/AppSidebar.tsx`** (line 3-19):
- Import `BookMarked` from lucide-react
- Add `{ title: 'Guide', path: '/guide', icon: BookMarked }` to the `navItems` array

One file, two-line change.

