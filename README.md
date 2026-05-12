# SupplyLens 🔍

> AI-powered supply chain intelligence. Real news, live market data, procurement-ready analysis — in seconds.

**Live Demo:** [supplylens-lilac.vercel.app](https://supplylens-lilac.vercel.app)

---

## What is SupplyLens?

SupplyLens monitors live supply chain news from 10+ industry sources, analyzes each article using Claude AI with real commodity prices and economic data, and delivers structured intelligence tailored to your industry role.

Built for supply chain professionals, procurement managers, and analysts who need to act on breaking news — not react to it hours later.

---

## Key Features

**🔴 Live Intelligence Feed**

- Fetches and analyzes articles from 10+ RSS sources in real time
- Full article text fetched before analysis — zero hallucination
- Every summary point shows exact source quote from the article

**🎯 Industry Lens System**

- 9 professional perspectives: General, Automotive, Semiconductors, Energy, Electronics, Retail, Pharma, Food & Agriculture, Procurement
- Each lens produces role-specific action plans and insights

**📊 Per-Article Analysis**

- Supply chain summary with source attribution
- Ripple effect: Trigger → 1st → 2nd → 3rd order impacts
- Geographic risk map with affected countries and ports
- Action plan: NOW / 30D / LONG TERM
- Live commodity market signal connected to the article

**🔗 URL Analyzer**

- Paste any news URL for instant supply chain analysis
- Works on any publicly accessible article

**📄 Export Features**

- **Procurement PDF** — 4-page report with source quotes, ripple chain, action plan, live market data
- **Risk Report** — 7-page ERM report with 15 prioritized risks and 4-scenario planning (Best/Base/Worst/Black Swan)

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | React (Create React App)            |
| Backend          | Node.js + Express                   |
| AI Engine        | Anthropic Claude (Sonnet 4 + Haiku) |
| Market Data      | Yahoo Finance (live)                |
| Economic Data    | World Bank API                      |
| News Sources     | RSS Parser (10+ sources)            |
| Maps             | Leaflet.js + Carto Dark tiles       |
| Frontend Hosting | Vercel                              |
| Backend Hosting  | Render.com                          |

---

## Running Locally

### Prerequisites

- Node.js 18+
- Anthropic API key

### Backend

```bash
cd backend
npm install
echo "ANTHROPIC_API_KEY=your_key_here" > .env
node server.js
# Runs on http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3001
```

---

## Key Design Decisions

| Decision                                    | Reason                                                  |
| ------------------------------------------- | ------------------------------------------------------- |
| Full article scraping                       | Eliminates hallucination — Claude analyzes real content |
| Source quote grounding                      | Every claim shows exact article quote                   |
| Lens re-analysis                            | Better UX than separate industry feeds                  |
| Haiku for analysis, Sonnet for risk reports | Cost optimization without quality loss                  |
| News rotation                               | Refresh always delivers unseen articles                 |

---

## Roadmap

- [ ] Historical commodity price charts
- [ ] Daily email digest
- [ ] Supplier-specific monitoring
- [ ] Slack/Teams integration

---

## Cost

| Service           | Cost                |
| ----------------- | ------------------- |
| Anthropic API     | ~$0.001 per article |
| Yahoo Finance     | Free                |
| World Bank API    | Free                |
| Vercel + Render   | Free                |
| **Total per day** | **< $0.10**         |

---

Built by [Sarvarbek Botirov](https://github.com/SarvarbekBotirov)
