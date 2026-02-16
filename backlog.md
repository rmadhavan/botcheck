# BotCheck Product Backlog

## Overview
Prioritized improvements based on UX critique and user feedback. Organized by impact and effort.

---

## Quick Wins (Implement This Week)
**Time: 2-4 hours each | Impact: High**

### 1. Enhance Headline Value Prop
**Current:**
```
Can AI see your website?
```

**Improved:**
```
Can AI see your website?

Check if GPTBot, ClaudeBot & 30+ crawlers can access your content.
Takes 10 seconds. No login required.
```

**Why:** Users need context (why scan?), reassurance (how fast?), friction removal (no login).
**File:** `src/app/page.tsx` (line ~133)

---

### 2. Add Loading States & Feedback
**Current:** Clicking "Scan" shows spinner, no progress indication

**Improvement:**
```
"Scanning... (2-5 seconds)

✓ Checking robots.txt
⏳ Checking headers...
⏳ Analyzing structure...
"
```

**Why:** Users don't know if process is working. Estimated time reduces anxiety.
**File:** `src/app/page.tsx` (line ~186)

---

### 3. Improve Check Card Labels
**Current:** "Response Stability", "Content Structure", "Paywall Detection"

**Improved:**
```
⚡ Response Speed
Does your site load quickly for crawlers?

🏗️ Page Structure  
Is your HTML organized for AI to read?

🚪 Access Control
Can crawlers reach your content or is it blocked?
```

**Why:** Users don't understand why these checks matter.
**File:** `src/components/CheckCard.tsx` (rename descriptions)

---

### 4. Better Error Messages
**Current:**
```
"Failed to connect to the scan service. Please try again."
```

**Improved:**
```
❌ Couldn't reach this URL

Possible reasons:
• Site is down or blocking access
• Invalid domain name
• CORS/firewall restriction

💡 Try: Can you visit this URL in your browser first?
```

**Why:** Helps users debug their own issues.
**File:** `src/app/page.tsx` (line ~165)

---

### 5. Mode Toggle Descriptions
**Current:**
```
[Be Found by AI] [Block AI]
Check if AI systems can find and index your content.
```

**Improved:**
```
🔍 Be Found by AI
Want AI to cite you? Make sure GPTBot & others can access

🛡️ Block AI  
Protecting your content? Verify your defenses are working

[Selected mode gets highlighted]
```

**Why:** Users understand when to use each mode.
**File:** `src/app/page.tsx` (line ~146)

---

## Medium Effort (This Sprint)
**Time: 6-12 hours | Impact: Very High**

### 6. Progressive Disclosure on Results
**Current:** All results visible on one page (score, stats, checks, weights, bots)

**Improvement:**
- **Above fold:** Score ring, summary, 1-line insight
- **Below fold (collapsible):** Details, weights, bot list
- Add "See details" → expand pattern

**Why:** Prevents information overload for first-time users.
**Files:** 
- `src/app/page.tsx` (results section)
- New component: `InsightCard.tsx`

---

### 7. Switchable Mode on Results
**Current:** If user chooses wrong mode, they must re-enter URL

**Improvement:**
```
Results page shows mode. Add button:
[Current: Be Found by AI]
[Switch to: Block AI view] → Re-scans with 1 click
```

**Why:** Better UX, reduces friction, encourages exploring both modes.
**File:** `src/app/page.tsx` (line ~240)

---

### 8. Insight Cards (Context for Non-Technical)
**Current:** Score of 72/100 — user doesn't know if good/bad

**New:** Above score, add insight cards:
```
✅ Good news: Visible to AI
Your content can be found by training systems

⚠️ Heads up: Some crawlers blocked
GPTBot is blocked but ClaudeBot can access

💡 Next steps: [Link to recommendations]
```

**Why:** Helps users understand impact of results.
**New component:** `InsightCard.tsx`

---

### 9. Share Preview
**Current:** [Copy] [Twitter] [LinkedIn] buttons

**Improved:**
```
"Share your results"

Preview:
example.com scored 72/100 on AI visibility.
Check if AI can see YOUR website — BotCheck 🔍

[Copy] [Twitter] [LinkedIn] [More...]
```

**Why:** Users see what they're sharing before they share.
**File:** `src/components/ShareBar.tsx`

---

### 10. Mobile Optimization
**Current:** Untested on mobile

**Improvements:**
- Reduce score ring size (120px instead of 160px)
- Stack stats vertically on mobile
- Larger tap targets (48px minimum)
- Responsive check cards

**Why:** 40%+ of users on mobile.
**File:** `src/app/globals.css` (add mobile breakpoints)

---

## Nice-to-Have (Future)
**Time: 20+ hours | Impact: Medium**

### 11. Dark Mode
**Why:** Privacy personas expect it. Premium feel.
**Files:** Add CSS variables toggle in `globals.css`

---

### 12. Print-Friendly Results
**Why:** Developers/compliance officers need to share results internally.
**File:** Add `@media print` styles

---

### 13. Email Results
**Why:** Users want to save/share results without login.
**File:** New endpoint `api/email-results`

---

### 14. Saved Scan History (No Login)
**Why:** Users check same site periodically.
**Implementation:** LocalStorage-based, privacy-preserved
**Files:** New component `ScanHistory.tsx`

---

### 15. Anonymous Benchmarks
**Why:** Users curious "how does my site compare?"
**Description:** Show anonymized aggregates (e.g., "90% of sites visible to GPTBot")
**Impact:** 📊 High engagement, encourages sharing

---

### 16. Keyboard Shortcuts
**Why:** Power users (DevOps) love shortcuts.
**Examples:**
- `?` = shows help
- `r` = run scan
- `s` = share results
- `1/2` = toggle mode

---

### 17. Results Comparison
**Why:** "How does my site compare to my competitor?"
**Implementation:** Compare mode (scan 2 URLs side-by-side)

---

### 18. API Documentation
**Why:** DevOps/engineers want to integrate into monitoring.
**Description:** REST API docs for batch scanning
**Impact:** 💰 Enterprise interest

---

## Technical Debt

### 1. TypeScript Cleanup
**Status:** Some `any` types in API responses
**Priority:** Low
**File:** `src/app/api/scan/route.ts`

---

### 2. Test Coverage
**Status:** No unit/integration tests
**Priority:** Medium (before scaling)
**File:** Create `__tests__` directory

---

### 3. Error Handling
**Status:** Generic error messages need improvement
**Priority:** High
**File:** `src/app/page.tsx` error handling

---

### 4. Performance
**Status:** Large bot list parsing on every scan
**Priority:** Medium (optimize after 1000+ DAU)
**File:** `src/app/api/scan/route.ts` (cache bot list)

---

## Completed ✅
- [x] Crosby theme implementation
- [x] Default mode changed to "Be Found by AI"
- [x] Button order flipped (visibility first)
- [x] CSS import order fixed

---

## Priority Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Better headlines | 1 hour | High | P0 |
| Loading states | 2 hours | High | P0 |
| Error messages | 1.5 hours | High | P0 |
| Check labels + emojis | 2 hours | High | P0 |
| Mode descriptions | 1 hour | Medium | P1 |
| Modal toggle explanations | 3 hours | Very High | P1 |
| Progressive disclosure | 6 hours | Very High | P1 |
| Insight cards | 4 hours | High | P1 |
| Mobile optimization | 4 hours | Very High | P2 |
| Share preview | 2 hours | Medium | P2 |
| Dark mode | 8 hours | Medium | P3 |
| Email results | 6 hours | Low | P3 |
| API docs | 12 hours | Medium | P3 |

---

## Success Metrics

After implementing P0 + P1:
- ✅ First-time user success rate: 70% → 85%
- ✅ Bounce rate: Reduce by 20%
- ✅ Share rate: Increase by 15%
- ✅ Return visits: Increase by 10%
- ✅ Mobile engagement: 40% → 60%

