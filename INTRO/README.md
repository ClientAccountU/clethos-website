# CLETHOS Consultancy — Client pitch deck

Standalone presentation assets. **Not linked from the public website** and not included in the Vite build.

## Files

| File | Purpose |
|------|---------|
| `pitch-deck.html` | Full slide deck (open in any browser) |
| `access-config.js` | **Client access code** (edit before sharing) |
| `intro-gate.js` | Password gate logic (session unlock) |

## Slides (11)

1. Cover — CLETHOS Consultancy + hero visual  
2. Agenda — two-column, full-width list  
3. CLETHOS at a glance — full platform rundown + lead-in to Consultancy  
4. The opportunity — when Consultancy fits vs full stack  
5. What Consultancy is — discovery, match, ongoing representation, four-step flow  
6. **Partner lanes (interactive)** — click FX / Banking / Treasury / Unified to update detail below  
7. Full platform vs Consultancy — centered comparison table  
8. **Money movement** — global payments / FX partner capability (130+ currencies, stats, safeguarding)  
9. Fees + process + **Ideal for** — onboarding escrow, monthly retainer, five steps, three fit cards  
10. Why CLETHOS Consultancy — `security-trust.svg`  
11. Next steps — centered CTA + logo  

**Art is deck-only:** custom SVG diagrams in `INTRO/art/`. Deck logos use `INTRO/art/clethos-logo.png` (synced from `assets+/LOGO TRANSP.png` on `npm run build`). Cover hero uses `../assets+/hhj.png`. Open `pitch-deck.html` from the `INTRO` folder so paths resolve correctly.

## Client access (password)

The deck is gated for **invited clients only**. Footer links and direct URLs to `INTRO/pitch-deck.html` show a confidential access screen first.

1. Edit **`INTRO/access-config.js`** and set `CLETHOS_INTRO_ACCESS_PIN` to your code (4–8 digits).
2. Share that code with clients separately from the link.
3. After a correct code, access is remembered for the **browser tab session** (`sessionStorage`).

On **localhost**, the gate is skipped automatically and a small **Dev** toolbar appears (slide jump, mobile preview window).

## How to present

1. Open `INTRO/pitch-deck.html` in Chrome, Edge, or Safari, or use the site footer link **CLETHOS Consultancy**.
2. Local dev: `npm run dev` → http://localhost:5173/INTRO/pitch-deck.html (optional `?slide=6` to jump).
3. Use **Next / Previous**, **arrow keys**, or **Space** to advance slides.
4. Press **F** or click **Fullscreen** for client meetings.

**Mobile / tablet:** Each slide scrolls vertically. Swipe or tap the left/right edges to change slides.

## Export to PDF or PowerPoint

- **PDF:** In the browser, choose Print → Save as PDF. Each slide is set to print on its own page.
- **PowerPoint / Google Slides:** Copy slide content from the HTML, or paste screenshots per slide after presenting fullscreen.

## Customisation

Edit copy directly in `pitch-deck.html`. Colours match the site palette (`#22c55e` accent, Plus Jakarta Sans). All styles are in the `<style>` block in that file—no changes to `css/` or main HTML pages required.

The deck describes partner capabilities generically; CLETHOS Consultancy is positioned as your ongoing representative to regulated partners—not the regulated provider itself.
