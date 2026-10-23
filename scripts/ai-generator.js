/**
 * CELEBRAI GENAI ENGINE & COPILOT
 * Provides intelligent blueprint generation, mood boards, budget allocations,
 * and conversational planning assistance.
 * Supports both offline heuristic synthesis and live Google Gemini API calling.
 */

// Global helper to sanitize text and disarm XSS attack vectors
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  // Disarm all inline event handlers (onerror=, onclick=, onload=, etc.) and javascript: protocols
  let disarmed = str.replace(/on[a-zA-Z]+\s*=/gi, 'data-disabled-attr=')
                    .replace(/javascript\s*:/gi, 'blocked-scheme:');
  return disarmed.replace(/[&<>"']/g, function(match) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return map[match];
  });
}
window.escapeHtml = escapeHtml;

class AIGenerator {
  constructor() {
    this.isGenerating = false;
  }

  /**
   * Main generation method.
   * If Gemini API Key exists, tries Gemini API; falls back smoothly to heuristic synthesis engine.
   */
  async generateEventBlueprint(params) {
    this.isGenerating = true;
    const apiKey = window.eventState.getGeminiApiKey();

    try {
      if (apiKey) {
        try {
          const liveResult = await this.callGeminiAPI(apiKey, params);
          if (liveResult) return liveResult;
        } catch (apiError) {
          console.warn('Gemini API call returned error, falling back to built-in synthesis engine:', apiError);
        }
      }
      // Built-in intelligent synthesis engine (always reliable, instant, offline-capable)
      return await this.synthesizeBlueprint(params);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Google Gemini Live API integration
   */
  async callGeminiAPI(apiKey, params) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemPrompt = `You are an elite luxury celebration architect & event producer.
Synthesize a comprehensive, high-end event blueprint for:
Event Type: ${params.eventType}
Budget: $${params.budget}
Guests: ${params.guestCount}
Aesthetic Vibe: ${params.vibe}
Special Requests: ${params.specialNotes}

You MUST return strictly valid JSON matching this exact structure:
{
  "theme": {
    "name": "...",
    "description": "...",
    "vibe": "...",
    "colors": ["#E43D12", "#D6536D", "#FFA2B6", "#EFB11D", "#EBE9E1"]
  },
  "budgetBreakdown": [
    { "category": "Venue & Ambiance", "percentage": 30, "amount": 0, "notes": "..." },
    { "category": "Catering & Bar", "percentage": 30, "amount": 0, "notes": "..." },
    { "category": "Photo & Cinema", "percentage": 12, "amount": 0, "notes": "..." },
    { "category": "Florals & Decor", "percentage": 13, "amount": 0, "notes": "..." },
    { "category": "Music & Entertainment", "percentage": 8, "amount": 0, "notes": "..." },
    { "category": "Favors & Contingency", "percentage": 7, "amount": 0, "notes": "..." }
  ],
  "timelineMilestones": [
    { "phase": "Planning Kickoff", "title": "...", "dueDate": "Month 1", "priority": "high" },
    { "phase": "Mid-Phase", "title": "...", "dueDate": "Month 2", "priority": "medium" },
    { "phase": "Final Sprint", "title": "...", "dueDate": "Week 1", "priority": "high" }
  ],
  "runOfShow": [
    { "time": "02:00 PM", "title": "Vendor Arrival & Staging", "description": "...", "assignee": "Coordinator" },
    { "time": "05:00 PM", "title": "Guest Arrival & Welcome Cocktails", "description": "...", "assignee": "Staff" },
    { "time": "07:00 PM", "title": "Dinner Banquet & Toasts", "description": "...", "assignee": "MC" },
    { "time": "09:00 PM", "title": "Dance Floor & Revelry", "description": "...", "assignee": "DJ" }
  ],
  "vendorChecklist": [
    { "name": "Curated Venue Partner", "category": "Venue", "status": "Researching", "quote": 0, "deliverables": "..." },
    { "name": "Artisan Catering Studio", "category": "Catering", "status": "Researching", "quote": 0, "deliverables": "..." },
    { "name": "Cinematic Storyteller", "category": "Photography", "status": "Researching", "quote": 0, "deliverables": "..." }
  ],
  "ideas": [
    { "title": "...", "category": "Atmosphere", "description": "...", "tags": ["AI Curated", "Aesthetic"] },
    { "title": "...", "category": "Culinary", "description": "...", "tags": ["Gourmet", "Signature"] },
    { "title": "...", "category": "Memories", "description": "...", "tags": ["Guest Experience"] }
  ]
}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      return JSON.parse(rawText);
    }
    throw new Error('Empty response from Gemini');
  }

  /**
   * Built-in intelligent synthesis engine
   * Calculates realistic proportional allocations based on budget & guest count.
   */
  async synthesizeBlueprint(params) {
    // Artificial slight delay for realistic AI generation feel
    await new Promise(r => setTimeout(r, 650));

    const totalBudget = Number(params.budget) || 20000;
    const guests = Number(params.guestCount) || 80;
    const perHead = Math.round(totalBudget / guests);
    const eventType = params.eventType || 'wedding';
    const vibe = params.vibe || 'Opulent Romantic';

    // Tailored theme names and sensory descriptions
    const themeMatrix = {
      wedding: {
        name: `Celestial Coral & Amber Radiance (${vibe})`,
        description: `A bespoke romantic celebration marrying warm sunset coral florals (#E43D12), delicate blush peony accents (#FFA2B6), and antique gold candelabras (#EFB11D) over alabaster ivory linens (#EBE9E1).`,
        colors: ['#E43D12', '#D6536D', '#FFA2B6', '#EFB11D', '#EBE9E1']
      },
      birthday: {
        name: `Velvet Sunburst Jubilee (${vibe})`,
        description: `A dynamic festive gala filled with golden ambient fairy lights, berry rose velvet lounges (#D6536D), coral neon highlights (#E43D12), and artisan sparkling champagne cocktails.`,
        colors: ['#EFB11D', '#E43D12', '#D6536D', '#FFA2B6', '#EBE9E1']
      },
      community: {
        name: `The Solstice Civic Harmony Bazaar (${vibe})`,
        description: `A vibrant communal festival powered by hanging amber lanterns (#EFB11D), handcrafted artisan market pavilions, live acoustic stages, and interactive community wishing ribbons.`,
        colors: ['#EFB11D', '#D6536D', '#E43D12', '#FFA2B6', '#EBE9E1']
      }
    };

    const theme = themeMatrix[eventType] || themeMatrix.wedding;

    // Intelligent Budget Allocation according to event dynamics
    let allocations = [];
    if (eventType === 'wedding') {
      allocations = [
        { category: 'Venue & Grounds', pct: 0.32, notes: 'Exclusive access, bridal suites, tables & luxury seating' },
        { category: 'Catering & Open Bar', pct: 0.30, notes: `Plated culinary banquet ($${Math.round(perHead * 0.3)}/person) + sommelier pairings` },
        { category: 'Photography & Cinema', pct: 0.12, notes: 'Full day coverage, drone aerials, preview teaser reel' },
        { category: 'Florals & Tablescapes', pct: 0.12, notes: 'Ceremonial arch, 12 luxury floral centerpieces, bridal bouquets' },
        { category: 'Music & Entertainment', pct: 0.08, notes: 'Ceremony acoustic strings + evening 6-piece live band' },
        { category: 'Stationery & Favors', pct: 0.06, notes: 'Gold foil deckled suites, wax seals, bespoke guest gifts' }
      ];
    } else if (eventType === 'birthday') {
      allocations = [
        { category: 'Venue & Rooftop Lounge', pct: 0.35, notes: 'Panoramic terrace lounge with heated seating & skyline bar' },
        { category: 'Artisan Bar & Tapas', pct: 0.32, notes: 'Custom craft cocktails with edible prints & gourmet grazing table' },
        { category: 'DJ & Live Saxophone', pct: 0.15, notes: '4-hour energetic dance set with saxophone soloist' },
        { category: 'Sculpted Cake & Desserts', pct: 0.08, notes: 'Multi-tier coral & gold leaf cake with macaron towers' },
        { category: '360 Video Booth & Decor', pct: 0.10, notes: 'Instant magnetic polaroids, custom neon monogram, and balloon arch' }
      ];
    } else {
      allocations = [
        { category: 'Park Permits & Civic Facilities', pct: 0.20, notes: 'Municipal park licensing, power generators, luxury portable restrooms' },
        { category: 'Stage, Sound & Rigging', pct: 0.30, notes: 'Covered mobile concert stage, line-array audio, dynamic lighting' },
        { category: 'Community Performers & Acts', pct: 0.22, notes: 'Honorariums for 6 local musical bands, dance troupes, and emcee' },
        { category: 'Lanterns, Decor & Signage', pct: 0.14, notes: 'Eco-friendly hanging lanterns, directional wayfinding signs' },
        { category: 'Public Safety & First Aid', pct: 0.14, notes: 'Licensed crowd security, certified paramedic station, sanitation' }
      ];
    }

    const budgetBreakdown = allocations.map(item => ({
      category: item.category,
      percentage: Math.round(item.pct * 100),
      amount: Math.round(totalBudget * item.pct),
      notes: item.notes
    }));

    // Dynamic Run of Show
    const runOfShow = [
      { time: '11:00 AM', title: 'Vendor Load-In & Technical Rigging', description: 'Sound checks, lighting arrays, floral installation check', assignee: 'Production Lead' },
      { time: '02:00 PM', title: 'Aesthetic Staging & Welcome Table Polish', description: 'Place cards set, candle lanterns lit, audio levels verified', assignee: 'Host / Coordinator' },
      { time: '04:30 PM', title: 'Guest Arrival & Aperitif Welcome', description: 'Signature spritzers served as background acoustic melody plays', assignee: 'Hospitality Staff' },
      { time: '05:30 PM', title: 'Main Program & Keynote / Ceremony', description: 'Central presentation, toast or ceremony vows', assignee: 'Host & Celebrants' },
      { time: '07:00 PM', title: 'Gourmet Banquet & Culinary Grazing', description: 'Curated courses served with celebration toasts', assignee: 'Catering Lead' },
      { time: '08:45 PM', title: 'Dance Surge & Live Entertainment', description: 'Full musical ensemble takes stage, dessert stations open', assignee: 'Band / DJ' },
      { time: '11:00 PM', title: 'Grand Finale & Sparkler Sendoff', description: 'Final musical encore, celebration favors distributed', assignee: 'All Guests' }
    ];

    // Tailored Ideas
    const ideas = [
      {
        title: `Signature "${theme.name.split(' ')[0]}" Cocktail Bar`,
        category: 'Food & Beverage',
        description: `Craft cocktail featuring Aperol, blood orange prosecco, edible gold glitter, and sprigs of fresh rosemary.`,
        tags: ['Signature Drink', 'Photo Op', 'Luxe'],
        image: 'assets/images/wedding.jpg'
      },
      {
        title: 'Warm Amber Filament & Hanging Lantern Canopy',
        category: 'Decor & Ambiance',
        description: 'Overhead festoon lighting web woven with warm amber filament Edison bulbs and suspended coral rose globes.',
        tags: ['Lighting', 'Warm Glow', 'Must-Have'],
        image: 'assets/images/birthday.jpg'
      },
      {
        title: 'Interactive Audio Guestbook & Polaroid Wall',
        category: 'Guest Experience',
        description: 'A vintage blush rotary phone for guest voice messages paired with an instant polaroid guestbook with metallic gold pens.',
        tags: ['Memories', 'Interactive', 'Favorite'],
        image: 'assets/images/community.jpg'
      }
    ];

    const vendorChecklist = budgetBreakdown.slice(0, 4).map((b, idx) => ({
      name: `Premier ${b.category.split('&')[0].trim()} Specialist`,
      category: b.category.split('&')[0].trim(),
      status: idx === 0 ? 'Contract Signed' : 'Proposal Received',
      quote: b.amount,
      negotiated: Math.round(b.amount * 0.96),
      deliverables: b.notes
    }));

    return {
      theme,
      budgetBreakdown,
      runOfShow,
      vendorChecklist,
      ideas
    };
  }

  /**
   * AI Copilot Quick Assistant
   */
  async answerCopilotPrompt(userMessage, currentEvent) {
    const q = userMessage.toLowerCase();
    const eventType = currentEvent.type;
    const totalBudget = currentEvent.totalBudget;

    // Fast contextual heuristics
    if (q.includes('budget') || q.includes('save') || q.includes('cut') || q.includes('cost')) {
      return {
        text: `Based on your ${currentEvent.title} with a budget of $${totalBudget.toLocaleString()}:
1. **Catering Strategy**: Switching from full plated dinner to high-end family-style or grazing stations often saves 15-20% without losing luxury feel.
2. **Floral Repurposing**: Reuse ceremonial arch florals as the sweetheart or main stage backdrop during the reception.
3. **Seasonal Blooms**: Opt for garden coral roses and blush peonies in season to reduce floral freight surcharges by up to $1,200.`,
        chips: ['Optimize Budget Now', 'View Catering Breakdown', 'Add Contingency Line']
      };
    }

    if (q.includes('timeline') || q.includes('schedule') || q.includes('run of show') || q.includes('hours')) {
      return {
        text: `Here is a golden timing rule for a ${eventType}:
- Allow **45 minutes buffer** between setup and guest arrival.
- Keep welcome toasts under **15 minutes total** to prevent meal cooling.
- Schedule golden-hour photography exactly **45 minutes before local sunset** for best lighting warmth with your coral & gold palette.`,
        chips: ['Review Run of Show', 'Add First Look Buffer', 'Sync Photographer Hours']
      };
    }

    if (q.includes('theme') || q.includes('decor') || q.includes('color') || q.includes('vibe')) {
      return {
        text: `Your palette (#E43D12 Coral, #D6536D Berry Rose, #FFA2B6 Blush, #EFB11D Warm Gold, #EBE9E1 Alabaster) gives you rich depth:
- **Base**: Alabaster linens with warm gold cutlery.
- **Accents**: Coral napkins, berry rose glassware, and floating blush candles.
- **Lighting**: 2400K warm gold ambient lights ensure skin tones look radiant in all photography.`,
        chips: ['Regenerate Mood Board', 'Show Floral Checklist', 'Export Swatches']
      };
    }

    if (q.includes('vendor') || q.includes('contract') || q.includes('quote') || q.includes('tip')) {
      return {
        text: `Top vendor checklist questions for your ${eventType}:
1. "Does the venue quote include security, cleaning fees, and corkage fees?"
2. "What is your backup plan in case of equipment failure or weather shift?"
3. "Are travel expenses and meal allowances included in the quote?"`,
        chips: ['Add New Vendor', 'Check Vendor Statuses', 'Review Contracts']
      };
    }

    // Default response
    return {
      text: `I'm your CelebraAI Planning Concierge! I can optimize your budget allocation, generate bespoke theme aesthetics, refine your day-of run of show, or negotiate vendor deliverables for ${escapeHtml(currentEvent.title)}. What would you like to explore?`,
      chips: ['Suggest 3 Signature Cocktails', 'How to save $2,000 on decor?', 'Draft Run-of-Show Timeline']
    };
  }
}

// Global AI generator singleton
window.aiGenerator = new AIGenerator();
