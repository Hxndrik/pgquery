# Sidebar Redesign - CORRECTED Plan

## Current Structure (WRONG)

```
[IconRail 52px]  [Sidebar 220px]           [Main Content Area]
   - Logo           - Connection pill          - Varies by view
   - Query icon     - "Queries" header         - If Explorer: TableExplorer (schemas/tables/data)
   - Explorer icon  - (empty for explorer!)    - If Queries: TabBar + Editor + Results
   - Tables icon                                - If History: History list
   - History icon                               - If Saved: Saved list
   - Saved icon
   - Theme toggle
```

## NEW CORRECT STRUCTURE

### Single Unified Left Sidebar (280px)

```
[Sidebar - ALWAYS SAME]                    [Main Content Area]
┌─────────────────────────┐                ┌──────────────────────┐
│ Logo (top)              │                │                      │
│ Connection pill         │                │  Content varies:     │
│ ─────────────────────── │                │                      │
│ 📝 Queries (nav item)   │                │  - Queries view:     │
│ 🔍 Explorer (nav item)  │                │    TabBar + Editor   │
│ 📊 Schema (nav item)    │                │    + Results         │
│ 🕐 History (nav item)   │                │                      │
│ 💾 Saved (nav item)     │                │  - Explorer view:    │
│ ─────────────────────── │                │    TableExplorer     │
│ (flexible space)        │                │    (data grid)       │
│                         │                │                      │
│ 🌙 Theme Toggle (bottom)│                │  - Schema view:      │
└─────────────────────────┘                │    ExplorerSection   │
                                           │    list (like        │
                                           │    schemas/tables)   │
                                           │                      │
                                           │  - History view:     │
                                           │    ExplorerSection   │
                                           │    list              │
                                           │                      │
                                           │  - Saved view:       │
                                           │    ExplorerSection   │
                                           │    list              │
                                           └──────────────────────┘
```

## Key Points

1. **NO IconRail** - Remove entirely
2. **Single sidebar** - Normal width (280px), always visible
3. **Navigation items** - Icon + Text buttons (like VSCode)
4. **Uniform shell** - Schema/History/Saved use ExplorerSection component
5. **Remove middle row** - No more "Postgres" / "Explorer" header row

## Implementation Steps

### Phase 1: Create NavItem Component
- [ ] Create `NavItem.tsx` - Icon + text button component
- [ ] Support active state styling
- [ ] Click handler

### Phase 2: Create New Unified Sidebar
- [ ] Create new `Sidebar.tsx` (replaces old + IconRail)
- [ ] Logo at top
- [ ] Connection pill below logo
- [ ] Navigation items (Queries, Explorer, Schema, History, Saved)
- [ ] Theme toggle at bottom
- [ ] Width: 280px

### Phase 3: Create View Components Using ExplorerSection
- [ ] `SchemaView.tsx` - Full-page ExplorerSection for schemas
- [ ] `HistoryView.tsx` - Full-page ExplorerSection for history
- [ ] `SavedView.tsx` - Full-page ExplorerSection for saved queries
- [ ] Each uses same shell: header, search, scrollable list

### Phase 4: Update AppLayout
- [ ] Remove IconRail import/usage
- [ ] Use new Sidebar component
- [ ] Route to correct view component based on selection
- [ ] Views: queries, explorer, schema, history, saved

### Phase 5: Cleanup
- [ ] Delete `IconRail.tsx`
- [ ] Delete old `Sidebar.tsx`
- [ ] Delete `SchemaExplorer.tsx`
- [ ] Update imports across codebase

## Files Summary

### Delete
- ❌ `IconRail.tsx`
- ❌ Old `Sidebar.tsx`
- ❌ `SchemaExplorer.tsx`

### Create
- ✅ New `Sidebar.tsx` - Unified sidebar with nav
- ✅ `NavItem.tsx` - Navigation button component
- ✅ `SchemaView.tsx` - Full-page schema list
- ✅ `HistoryView.tsx` - Full-page history list
- ✅ `SavedView.tsx` - Full-page saved queries list

### Modify
- 🔧 `AppLayout.tsx` - Remove IconRail, use new Sidebar
- 🔧 `ExplorerSection.tsx` - Ensure works as full-page view

## Visual Comparison

### BEFORE:
```
[IconRail 52px] [Sidebar 220px] [Content]
```

### AFTER:
```
[Sidebar 280px] [Content]
```

Cleaner, simpler, more space for navigation!
