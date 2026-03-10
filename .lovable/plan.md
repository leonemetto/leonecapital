

# Add Guide Tab to AppSidebar

Adding `BookMarked` icon import and Guide entry to the `navItems` array in `AppSidebar.tsx`.

## Changes

**`src/components/layout/AppSidebar.tsx`**
- Add `BookMarked` to the lucide-react import
- Add `{ title: 'Guide', path: '/guide', icon: BookMarked }` to `navItems`

