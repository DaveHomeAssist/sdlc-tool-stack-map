# SDLC Tool Stack Map -- Feature Analysis

**Date:** 2026-03-25
**Files analyzed:** `index.html`
**Stack:** Single-file static HTML + inline CSS + inline JS, GitHub Pages hosting

---

## Summary Table

| Feature | Status | Data Source / Persistence | Critical Gap |
|---|---|---|---|
| SDLC phase comparison table | Working | Hardcoded `rows` JS array (8 phases) | No user editing or persistence |
| Text search filter | Working | Live `input` event on search field | Searches all text columns (haystack join) |
| Stack type filter (dropdown) | Working | `select` element, 4 options | None |
| Phase filter (dropdown) | Working | `select` element, 9 options (all + 8 phases) | None |
| Color-coded stack badges | Working | CSS classes (atlassian/modern/hybrid) | None |
| Legend with colored dots | Working | Static HTML chips | None |
| Lifecycle loop sidebar | Working | Static 5-step timeline cards | None |
| Best-fit-by-team sidebar | Working | Static content panel | None |
| Quick read sidebar | Working | Static content panel | None |
| No-match feedback | Working | "No matches found" row appears | None |
| Responsive layout | Working | Media queries at 1024px, 900px | Table scrolls horizontally on mobile |
| Skip link | Working | `.skip-link` with focus reveal | None |
| OG/Twitter meta tags | Working | Static in `<head>` with image | Full social sharing support |
| Reduced-motion support | Working | `prefers-reduced-motion` | None |
| Back-to-hub link | Working | Fixed position link to DaveHomeAssist | None |
| Sticky table headers | Working | `position: sticky; top: 0` on `<th>` | None |

---

## Detailed Feature Analysis

### 1. SDLC Phase Comparison Table
**Problem it solves:** Provides a single-view comparison of how Atlassian, modern startup, and hybrid tool stacks map onto the 8 SDLC phases.
**Implementation:** 8 data objects in a `rows` array, each with `phase`, `atlassian`, `modern`, `hybrid`, `why`, and `stack` fields. The `render()` function builds `<tr>` elements from filtered data using template literals inserted via `innerHTML`.
**Tradeoffs:** Clean and effective for a reference tool. Using `innerHTML` with template literals has minor XSS risk, though all data is hardcoded so the practical risk is zero.

### 2. Combined Search + Filter System
**Problem it solves:** Lets users quickly find relevant phases/tools from 8 rows of dense information.
**Implementation:** Three controls: text search (filters across all fields), stack type dropdown (Atlassian/Modern/Hybrid), phase dropdown (jump to specific phase). All three filters are AND-combined in the `render()` function. Event listeners on `input` and `change` trigger re-render.
**Tradeoffs:** Simple and effective. The search is case-insensitive substring matching across a joined haystack string -- fast for 8 rows, would need optimization for larger datasets.

### 3. Two-Column Layout
**Problem it solves:** Balances the detailed table with contextual guidance panels.
**Implementation:** CSS Grid with `grid-template-columns: 1.2fr .95fr`. Left column: scrollable table. Right column: stacked cards (Quick Read, Lifecycle Loop timeline, Best Fit by Team). Collapses to single column at 1024px.
**Tradeoffs:** Good information hierarchy. The right sidebar content is entirely static -- it could be more useful if it updated based on the selected filter (e.g., showing Atlassian-specific guidance when that filter is active).

### 4. Visual Design
**Problem it solves:** Professional dark-mode reference tool aesthetic.
**Implementation:** Dark background gradient (`#0a0f1d` to `#0e1530`), card-based UI with `rgba` backgrounds and subtle borders. Custom properties for theming. Three accent colors for the three stacks (blue for Atlassian, mint for Modern, amber for Hybrid).
**Tradeoffs:** Polished and readable. The dark palette works well for a developer-facing reference tool.

---

## Top 3 Priorities

1. **Make the right sidebar context-aware.** When a user filters to "Atlassian only", the Quick Read and Best Fit panels could update to show Atlassian-specific guidance rather than generic content.

2. **Add print/export capability.** As a reference tool, users may want to save or share the filtered view. A simple "Copy as Markdown" or print stylesheet would add utility.

3. **Consider adding tool links.** Each tool mentioned (Jira, GitHub, Linear, Notion, etc.) could link to its product page, making this a true reference hub rather than just a comparison chart.
