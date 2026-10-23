/**
 * CELEBRAI STATE MANAGEMENT MODULE
 * Central reactive store handling events, budgets, timelines, vendors, and ideas.
 * Includes localStorage persistence and sample event templates.
 */

const STORAGE_KEY = 'celebrai_event_store_v2';
const API_KEY_STORAGE = 'celebrai_gemini_api_key';

// Universal Security & Input Sanitization
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
if (typeof globalThis !== 'undefined') globalThis.escapeHtml = escapeHtml;
if (typeof window !== 'undefined') window.escapeHtml = escapeHtml;

// Sample Event Templates aligned with user requirements (Weddings, Birthdays, Community Events)
const DEFAULT_EVENTS = {
  wedding: {
    id: 'wedding-aurora',
    type: 'wedding',
    title: 'The Royal Champagne & Coral Gala',
    subtitle: 'Ceremony & Grand Reception in the Botanical Orangery',
    date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '16:30',
    location: 'Verona Glass Conservatory, Napa Valley',
    guestCount: 140,
    totalBudget: 48000,
    currency: '$',
    coverImage: 'assets/images/wedding.jpg',
    theme: {
      name: 'Sunset Coral & Gilded Rose',
      description: 'An ethereal romantic aesthetic featuring cascading coral florals, warm amber candlelight, rose quartz textures, and gilded champagne touches.',
      vibe: 'Opulent & Romantic',
      colors: ['#E43D12', '#D6536D', '#FFA2B6', '#EFB11D', '#EBE9E1']
    },
    budgetItems: [
      { id: 'b1', category: 'Venue', name: 'Conservatory & Garden Ballroom', estimated: 14000, actual: 13500, status: 'deposit', notes: 'Includes ceremony lawn & bridal suite' },
      { id: 'b2', category: 'Catering', name: 'Artisan 4-Course Plated Banquet', estimated: 12500, actual: 12800, status: 'deposit', notes: 'Organic seasonal menu with paired wines' },
      { id: 'b3', category: 'Photography', name: 'Fine Art Photo & Drone Cinematography', estimated: 5200, actual: 4900, status: 'deposit', notes: 'Full 10-hour day coverage + drone aerials' },
      { id: 'b4', category: 'Florals & Decor', name: 'Coral Rose Arch & Candelabra Tablescapes', estimated: 6500, actual: 6500, status: 'pending', notes: 'Peonies, coral ranunculus, and warm fairy lights' },
      { id: 'b5', category: 'Music & Sound', name: 'Acoustic String Trio & Evening 6-Piece Brass Band', estimated: 4200, actual: 4000, status: 'pending', notes: 'Strings for ceremony; live brass for reception' },
      { id: 'b6', category: 'Attire & Beauty', name: 'Haute Couture Gown, Tuxedo & Hair/Makeup', estimated: 3800, actual: 3600, status: 'paid', notes: 'Alterations included' },
      { id: 'b7', category: 'Invitations & Favors', name: 'Gold Foil Letterpress Suite & Scented Keepsakes', estimated: 1800, actual: 1650, status: 'paid', notes: 'Wax seals with custom monogram' }
    ],
    timeline: [
      { id: 't1', phase: '6-12 Months Out', title: 'Finalize Conservatory Booking & Date', dueDate: 'Completed', completed: true, priority: 'high' },
      { id: 't2', phase: '6-12 Months Out', title: 'Contract Lead Fine Art Photographer', dueDate: 'Completed', completed: true, priority: 'high' },
      { id: 't3', phase: '3-6 Months Out', title: 'Floral Mockup & Color Swatch Approval', dueDate: 'In 3 Weeks', completed: false, priority: 'high' },
      { id: 't4', phase: '3-6 Months Out', title: 'Menu & Artisan Cake Tasting Session', dueDate: 'In 4 Weeks', completed: false, priority: 'medium' },
      { id: 't5', phase: '1-2 Months Out', title: 'Send Gold Letterpress Invitations with RSVP Cards', dueDate: 'In 6 Weeks', completed: false, priority: 'high' },
      { id: 't6', phase: 'Week of Event', title: 'Final Seating Chart & Dietary Handover to Chef', dueDate: 'Week Before', completed: false, priority: 'high' },
      { id: 't7', phase: 'Week of Event', title: 'Rehearsal Walkthrough & Bridal Luncheon', dueDate: 'Day Before', completed: false, priority: 'medium' }
    ],
    runOfShow: [
      { id: 'r1', time: '10:00 AM', title: 'Hair & Makeup Suite Arrival', description: 'Champagne toast with bridal entourage; glam styling commences', assignee: 'Bridal Party & Stylist', completed: false },
      { id: 'r2', time: '12:30 PM', title: 'Vendor Load-In & Floral Installation', description: 'Florals setup on ceremonial arch; lighting sound check', assignee: 'Florist & Production Team', completed: false },
      { id: 'r3', time: '03:30 PM', title: 'First Look & Intimate Portraits', description: 'Photographer captures couple in private conservatory garden', assignee: 'Photographer', completed: false },
      { id: 'r4', time: '04:30 PM', title: 'Guest Arrival & Welcome Spritzers', description: 'Acoustic string quartet performs classical preludes', assignee: 'Greeters & Quartet', completed: false },
      { id: 'r5', time: '05:00 PM', title: 'Processional & Ceremony Exchange', description: 'Vows, ring exchange, and coral petal shower recessional', assignee: 'Officiant & Wedding Party', completed: false },
      { id: 'r6', time: '06:00 PM', title: 'Golden Hour Cocktail Reception', description: 'Hors d’oeuvres, signature cocktails, and live jazz trio', assignee: 'Catering & Quartet', completed: false },
      { id: 'r7', time: '07:30 PM', title: 'Grand Entrance & 4-Course Dinner', description: 'Welcome speeches, culinary banquet served, sparkling toasts', assignee: 'Maitre D’ & MC', completed: false },
      { id: 'r8', time: '09:00 PM', title: 'Cake Cutting & Dance Floor Opening', description: 'First dance followed by 6-piece live band dance party', assignee: 'Band Leader & Guests', completed: false }
    ],
    vendors: [
      { id: 'v1', name: 'Verona Conservatory Estates', category: 'Venue', status: 'Contract Signed', quote: 14000, negotiated: 13500, contact: 'events@veronaconservatory.com', deliverables: 'Exclusive 14hr venue access, tables, crossback chairs' },
      { id: 'v2', name: 'Maison Épicure Catering', category: 'Catering', status: 'Deposit Paid', quote: 13000, negotiated: 12800, contact: 'chef@maisonepicure.com', deliverables: '4-course plated dinner, sommeliers, vegan options' },
      { id: 'v3', name: 'Lumière Fine Art Photo', category: 'Photography', status: 'Contract Signed', quote: 5200, negotiated: 4900, contact: 'hello@lumierephotos.com', deliverables: '2 principal photographers, 800+ edited prints, drone' },
      { id: 'v4', name: 'Atelier Flora & Bloom', category: 'Florals', status: 'Proposal Received', quote: 6500, negotiated: 6200, contact: 'flora@atelierblooms.com', deliverables: 'Ceremonial arch, 14 centerpiece urns, boutonnières' },
      { id: 'v5', name: 'Velvet Brass Quintet', category: 'Music', status: 'Researching', quote: 4200, negotiated: 4000, contact: 'booking@velvetbrass.com', deliverables: 'Ceremony acoustic trio + 3-hour reception brass band' }
    ],
    ideas: [
      { id: 'i1', title: 'Champagne Tower with Coral Berry Garnish', category: 'Drinks & Revelry', description: 'A 5-tier vintage coupe champagne tower illuminated with amber uplighting and frozen raspberry pearls.', tags: ['Signature Cocktail', 'Luxe', 'Photo Op'], bookmarked: true, image: 'assets/images/wedding.jpg' },
      { id: 'i2', title: 'Wax-Sealed Botanical Escort Cards', category: 'Stationery', description: 'Handmade deckled edge paper with gold leaf accents and pressed blush ranunculus petals.', tags: ['DIY Luxe', 'Keepsake'], bookmarked: true, image: 'assets/images/wedding.jpg' },
      { id: 'i3', title: 'Late-Night Artisan Churros & Gelato Cart', category: 'Late-Night Snacks', description: 'Surprise guests around 10:30 PM with warm cinnamon sugar churros and espresso gelato cups.', tags: ['Guest Favorite', 'Fun'], bookmarked: false, image: 'assets/images/birthday.jpg' },
      { id: 'i4', title: 'Sparkler & Confetti Archway Sendoff', category: 'Grand Finale', description: 'Golden smokeless sparklers with biodegradable blush confetti as the couple departs.', tags: ['Finale', 'Photography'], bookmarked: false, image: 'assets/images/community.jpg' }
    ],
    rsvp: { confirmed: 96, pending: 36, declined: 8 }
  },

  birthday: {
    id: 'birthday-jubilee',
    type: 'birthday',
    title: 'The Golden Hour 30th Birthday Gala',
    subtitle: 'A Sunset Rooftop Celebration of Milestones, Cocktails & Beats',
    date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '19:00',
    location: 'Skyline Penthouse Terrace, Downtown',
    guestCount: 65,
    totalBudget: 12000,
    currency: '$',
    coverImage: 'assets/images/birthday.jpg',
    theme: {
      name: 'Retro Glamour & Velvet Glow',
      description: 'Chic modern lounge styling with velvet blush armchairs, warm amber string lights, coral accent balloons, and custom neon moniker.',
      vibe: 'Modern Festive & Chic',
      colors: ['#E43D12', '#EFB11D', '#FFA2B6', '#D6536D', '#EBE9E1']
    },
    budgetItems: [
      { id: 'bb1', category: 'Venue', name: 'Penthouse Skyline Terrace Rental', estimated: 3800, actual: 3800, status: 'deposit', notes: 'Includes rooftop heated bar & sound system' },
      { id: 'bb2', category: 'Catering & Bar', name: 'Craft Cocktail Open Bar & Gourmet Tapas', estimated: 4200, actual: 4000, status: 'deposit', notes: '3 signature cocktails + slider grazing table' },
      { id: 'bb3', category: 'DJ & Sound', name: 'Live Deep House DJ & Saxophone Duo', estimated: 1800, actual: 1800, status: 'pending', notes: '3-hour set with live saxophone soloist' },
      { id: 'bb4', category: 'Cake & Dessert', name: '2-Tier Gold Leaf & Coral Macaron Cake', estimated: 650, actual: 600, status: 'paid', notes: 'Salted caramel & raspberry passionfruit flavors' },
      { id: 'bb5', category: 'Photo & Video', name: 'Vintage 360 Video Booth & Polaroids', estimated: 950, actual: 900, status: 'pending', notes: 'Instant magnetic polaroid prints for guests' },
      { id: 'bb6', category: 'Decor & Lighting', name: 'Custom Neon Sign & Balloon Floral Arch', estimated: 800, actual: 750, status: 'paid', notes: '“Cheers to 30” custom amber-white neon' }
    ],
    timeline: [
      { id: 'bt1', phase: '2 Months Out', title: 'Confirm Skyline Penthouse Terrace Booking', dueDate: 'Completed', completed: true, priority: 'high' },
      { id: 'bt2', phase: '1 Month Out', title: 'Design & Send Digital Interactive Invitations', dueDate: 'In 1 Week', completed: false, priority: 'high' },
      { id: 'bt3', phase: '2 Weeks Out', title: 'Custom Signature Cocktail Tasting & Bar Menu', dueDate: 'In 2 Weeks', completed: false, priority: 'medium' },
      { id: 'bt4', phase: 'Week Of', title: 'Finalize DJ Playlist & Highlight Songs', dueDate: 'In 3 Weeks', completed: false, priority: 'medium' },
      { id: 'bt5', phase: 'Day of Event', title: 'Balloon Installation & Neon Sign Rigging', dueDate: '15:00', completed: false, priority: 'high' }
    ],
    runOfShow: [
      { id: 'br1', time: '05:00 PM', title: 'Terrace Setup & Lighting Check', description: 'DJ soundcheck, neon sign test, floral placement', assignee: 'Event Host & Decor Team', completed: false },
      { id: 'br2', time: '07:00 PM', title: 'Guests Arrive & Welcome Champagne', description: 'Sunset skyline photo ops and aperitif cocktails', assignee: 'Bartenders & Host', completed: false },
      { id: 'br3', time: '08:15 PM', title: 'Tapas Grazing & Live Sax Improvisation', description: 'Live saxophone jams over deep house lounge tracks', assignee: 'DJ & Saxophonist', completed: false },
      { id: 'br4', time: '09:30 PM', title: 'Birthday Toast & Cake Lighting', description: 'Friends gather for celebratory speech and sparkler candles', assignee: 'Best Friends & Host', completed: false },
      { id: 'br5', time: '10:00 PM', title: 'Dance Floor Surge & Confetti Cannons', description: 'High-energy dance playlist and 360 photo booth rush', assignee: 'DJ & Guests', completed: false }
    ],
    vendors: [
      { id: 'bv1', name: 'Skyline Terrace Penthouse', category: 'Venue', status: 'Contract Signed', quote: 3800, negotiated: 3800, contact: 'skyline@penthouseevents.com', deliverables: 'Private rooftop 6pm-1am, patio heaters, bar counter' },
      { id: 'bv2', name: 'Mixology Craft Co.', category: 'Bar & Drinks', status: 'Deposit Paid', quote: 4200, negotiated: 4000, contact: 'cheers@mixologycraft.com', deliverables: '2 flair bartenders, glassware, 3 signature cocktails' },
      { id: 'bv3', name: 'DJ Aurelius & Live Sax', category: 'Entertainment', status: 'Proposal Received', quote: 1800, negotiated: 1800, contact: 'aurelius@beatlive.com', deliverables: 'Sound system, wireless mic, 4hr set' },
      { id: 'bv4', name: 'SugarArt Atelier', category: 'Bakery', status: 'Deposit Paid', quote: 650, negotiated: 600, contact: 'orders@sugarart.com', deliverables: '2-tier sculpted cake + 36 gold dusted macarons' }
    ],
    ideas: [
      { id: 'bi1', title: 'Audio Guestbook Vintage Rotary Phone', category: 'Guest Engagement', description: 'Guests pick up a retro blush telephone and record funny voice messages for the host to keep forever.', tags: ['Keepsake', 'Viral Trend'], bookmarked: true, image: 'assets/images/birthday.jpg' },
      { id: 'bi2', title: 'Custom Printed Cocktail Foam Toppers', category: 'Bar Feature', description: 'Edible rice paper prints of funny childhood photos floated on espresso martinis.', tags: ['Hilarious', 'Photo Op'], bookmarked: true, image: 'assets/images/birthday.jpg' },
      { id: 'bi3', title: 'Glitter & Flash Tattoo Lounge', category: 'Activities', description: 'A pop-up corner with metallic gold temporary tattoos and face jewels for guests.', tags: ['Festival Vibes', 'Fun'], bookmarked: false, image: 'assets/images/community.jpg' }
    ],
    rsvp: { confirmed: 48, pending: 14, declined: 3 }
  },

  community: {
    id: 'community-fest',
    type: 'community',
    title: 'The Solstice Cultural & Food Festival',
    subtitle: 'Annual Community Celebration with Live Stages, Artisans & Culinary Bazaars',
    date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '12:00',
    location: 'Oakridge Civic Park & Amphitheater',
    guestCount: 650,
    totalBudget: 28500,
    currency: '$',
    coverImage: 'assets/images/community.jpg',
    theme: {
      name: 'Vibrant Harmony & Community Lanterns',
      description: 'A multicultural festival of warmth, communal picnic tables, glowing amber lanterns, interactive art pavilions, and sustainable decor.',
      vibe: 'Vibrant, Warm & Inclusive',
      colors: ['#EFB11D', '#E43D12', '#D6536D', '#FFA2B6', '#EBE9E1']
    },
    budgetItems: [
      { id: 'cb1', category: 'City Permits & Venue', name: 'Park Rental, Civic Permits & Sanitation', estimated: 4500, actual: 4200, status: 'paid', notes: 'Sound ordinance permit & portable restrooms' },
      { id: 'cb2', category: 'Stage & Production', name: 'Covered Stage, PA Array & Sound Technicians', estimated: 7200, actual: 7000, status: 'deposit', notes: 'Full stage lighting and dual wireless mics' },
      { id: 'cb3', category: 'Performers & Acts', name: 'Cultural Dance Troupes, Local Bands & Emcee', estimated: 5500, actual: 5200, status: 'pending', notes: 'Honorariums for 8 community performance groups' },
      { id: 'cb4', category: 'Art & Decor', name: 'Hanging Lantern Banners & Eco Bunting', estimated: 3200, actual: 3000, status: 'paid', notes: '100% biodegradable and reusable fabric decor' },
      { id: 'cb5', category: 'Logistics & Safety', name: 'Event Security, First Aid Tent & Waste Bins', estimated: 3800, actual: 3600, status: 'deposit', notes: 'Licensed security team and paramedic station' },
      { id: 'cb6', category: 'Marketing & Signage', name: 'Wayfinding Boards, QR Programs & Posters', estimated: 2200, actual: 1900, status: 'paid', notes: 'Bilingual community directional signs' }
    ],
    timeline: [
      { id: 'ct1', phase: '3 Months Out', title: 'Submit Municipal Park & Sound Permits', dueDate: 'Completed', completed: true, priority: 'high' },
      { id: 'ct2', phase: '2 Months Out', title: 'Open Artisan & Food Truck Vendor Applications', dueDate: 'Completed', completed: true, priority: 'high' },
      { id: 'ct3', phase: '1 Month Out', title: 'Publish Stage Schedule & Volunteer Callout', dueDate: 'In 2 Weeks', completed: false, priority: 'high' },
      { id: 'ct4', phase: '2 Weeks Out', title: 'Safety Briefing with City Fire Marshal & Police', dueDate: 'In 3 Weeks', completed: false, priority: 'high' },
      { id: 'ct5', phase: 'Day of Event', title: 'Early Morning Stage Rigging & Booth Layout', dueDate: '07:00 AM', completed: false, priority: 'high' }
    ],
    runOfShow: [
      { id: 'cr1', time: '07:30 AM', title: 'Park Gates Open & Vendor Load-In', description: 'Food trucks park; artisan tables assigned and powered up', assignee: 'Logistics Committee', completed: false },
      { id: 'cr2', time: '11:00 AM', title: 'Soundcheck & Safety Inspection', description: 'Inspect emergency exits, fire extinguishers, stage audio', assignee: 'Safety Officer', completed: false },
      { id: 'cr3', time: '12:00 PM', title: 'Opening Ceremony & Drum Troupe', description: 'City mayor welcome address and energetic drumming performance', assignee: 'Mayor & Drummers', completed: false },
      { id: 'cr4', time: '02:00 PM', title: 'Community Culinary Showcase & Tasting', description: 'Cooking demonstrations by local heritage chefs', assignee: 'Culinary Stage Lead', completed: false },
      { id: 'cr5', time: '04:30 PM', title: 'Youth Dance Battles & Art Auction', description: 'Open public dance circle and community mural charity bidding', assignee: 'Emcee & Youth Lead', completed: false },
      { id: 'cr6', time: '07:00 PM', title: 'Headline Brass Collective & Lantern Lighting', description: 'Sunset concert accompanied by simultaneous festival lantern lighting', assignee: 'Headliner Band', completed: false },
      { id: 'cr7', time: '09:30 PM', title: 'Festival Conclusion & Clean-Up Sprint', description: 'Eco-crew packs recyclable waste and strikes stages', assignee: 'Volunteer Clean Crew', completed: false }
    ],
    vendors: [
      { id: 'cv1', name: 'Apex Sound & Stage Systems', category: 'Production', status: 'Contract Signed', quote: 7200, negotiated: 7000, contact: 'staging@apexsound.com', deliverables: '24ft covered mobile stage, line array PA, tech' },
      { id: 'cv2', name: 'Civic Guard Security Corp', category: 'Security & Safety', status: 'Deposit Paid', quote: 3800, negotiated: 3600, contact: 'dispatch@civicguard.com', deliverables: '6 licensed guards, crowd barriers, radio comms' },
      { id: 'cv3', name: 'EcoSan Sanitation Rentals', category: 'Logistics', status: 'Contract Signed', quote: 2600, negotiated: 2500, contact: 'rentals@ecosan.com', deliverables: '10 luxury restrooms, 4 handwash stations, waste bins' },
      { id: 'cv4', name: 'Oakridge Food Truck Guild', category: 'Catering', status: 'Proposal Received', quote: 1500, negotiated: 1500, contact: 'guild@oakridgefoodtrucks.org', deliverables: 'Coordinates 12 food trucks + 10% festival donation' }
    ],
    ideas: [
      { id: 'ci1', title: 'Interactive Community "Wishing Ribbon" Tree', category: 'Public Art', description: 'Attendees write wishes and hopes on coral and gold ribbons, tying them to a centerpiece heritage oak.', tags: ['Art Installation', 'Heartwarming', 'Free'], bookmarked: true, image: 'assets/images/community.jpg' },
      { id: 'ci2', title: 'Sunset Paper Lantern Flotilla / Illumination', category: 'Spectacle', description: 'Solar-powered LED lanterns floated along the park pond during the twilight musical performance.', tags: ['Eco-Friendly', 'Magic Hour'], bookmarked: true, image: 'assets/images/community.jpg' },
      { id: 'ci3', title: 'Zero-Waste Water Refill & Hydration Station', category: 'Sustainability', description: 'Free chilled water stations with fruit infusions (citrus, mint, berry) encouraging BYO bottle.', tags: ['Green Event', 'Wellness'], bookmarked: false, image: 'assets/images/wedding.jpg' }
    ],
    rsvp: { confirmed: 512, pending: 110, declined: 28 }
  }
};

/**
 * State Manager Singleton
 */
class StateManager {
  constructor() {
    this.subscribers = [];
    this.currentEventKey = 'wedding';
    this.events = this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored events, resetting to defaults', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_EVENTS));
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      console.error('Error saving event state to localStorage:', e);
    }
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
    }
  }

  notify(changeType = 'update', meta = {}) {
    this.saveToStorage();
    this.subscribers.forEach(cb => {
      try {
        cb(this.getCurrentEvent(), changeType, meta);
      } catch (err) {
        console.error('State subscriber callback error:', err);
      }
    });
  }

  getCurrentEvent() {
    return this.events[this.currentEventKey] || this.events.wedding;
  }

  setCurrentEvent(key) {
    if (this.events[key]) {
      this.currentEventKey = key;
      this.notify('event_switched', { key });
    }
  }

  updateEventMetadata(updates) {
    const ev = this.getCurrentEvent();
    Object.assign(ev, updates);
    this.notify('metadata_updated');
  }

  // Budget Items
  addBudgetItem(item) {
    const ev = this.getCurrentEvent();
    item.id = 'b_' + Date.now();
    ev.budgetItems.push(item);
    this.notify('budget_item_added', { item });
  }

  updateBudgetItem(id, updates) {
    const ev = this.getCurrentEvent();
    const idx = ev.budgetItems.findIndex(b => b.id === id);
    if (idx !== -1) {
      Object.assign(ev.budgetItems[idx], updates);
      this.notify('budget_item_updated', { id });
    }
  }

  deleteBudgetItem(id) {
    const ev = this.getCurrentEvent();
    ev.budgetItems = ev.budgetItems.filter(b => b.id !== id);
    this.notify('budget_item_deleted', { id });
  }

  // Timeline Items
  toggleTask(id) {
    const ev = this.getCurrentEvent();
    const task = ev.timeline.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.notify('task_toggled', { id, completed: task.completed });
    }
  }

  addTimelineTask(task) {
    const ev = this.getCurrentEvent();
    task.id = 't_' + Date.now();
    task.completed = false;
    ev.timeline.push(task);
    this.notify('timeline_task_added', { task });
  }

  deleteTimelineTask(id) {
    const ev = this.getCurrentEvent();
    ev.timeline = ev.timeline.filter(t => t.id !== id);
    this.notify('timeline_task_deleted', { id });
  }

  // Day-of Run-of-Show Items
  toggleRunItem(id) {
    const ev = this.getCurrentEvent();
    const item = ev.runOfShow.find(r => r.id === id);
    if (item) {
      item.completed = !item.completed;
      this.notify('run_item_toggled', { id, completed: item.completed });
    }
  }

  addRunItem(item) {
    const ev = this.getCurrentEvent();
    item.id = 'r_' + Date.now();
    item.completed = false;
    ev.runOfShow.push(item);
    // Sort chronologically by time
    ev.runOfShow.sort((a, b) => a.time.localeCompare(b.time));
    this.notify('run_item_added', { item });
  }

  deleteRunItem(id) {
    const ev = this.getCurrentEvent();
    ev.runOfShow = ev.runOfShow.filter(r => r.id !== id);
    this.notify('run_item_deleted', { id });
  }

  // Vendors
  addVendor(vendor) {
    const ev = this.getCurrentEvent();
    vendor.id = 'v_' + Date.now();
    ev.vendors.push(vendor);
    this.notify('vendor_added', { vendor });
  }

  updateVendor(id, updates) {
    const ev = this.getCurrentEvent();
    const idx = ev.vendors.findIndex(v => v.id === id);
    if (idx !== -1) {
      Object.assign(ev.vendors[idx], updates);
      this.notify('vendor_updated', { id });
    }
  }

  deleteVendor(id) {
    const ev = this.getCurrentEvent();
    ev.vendors = ev.vendors.filter(v => v.id !== id);
    this.notify('vendor_deleted', { id });
  }

  // Ideas & Mood Board
  toggleBookmarkIdea(id) {
    const ev = this.getCurrentEvent();
    const idea = ev.ideas.find(i => i.id === id);
    if (idea) {
      idea.bookmarked = !idea.bookmarked;
      this.notify('idea_bookmarked', { id, bookmarked: idea.bookmarked });
    }
  }

  addIdea(idea) {
    const ev = this.getCurrentEvent();
    idea.id = 'i_' + Date.now();
    ev.ideas.unshift(idea);
    this.notify('idea_added', { idea });
  }

  // Reset to Factory Default
  resetCurrentEvent() {
    this.events[this.currentEventKey] = JSON.parse(JSON.stringify(DEFAULT_EVENTS[this.currentEventKey]));
    this.notify('event_reset');
  }

  // Import / Export JSON
  exportData() {
    return JSON.stringify(this.events, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && typeof data === 'object') {
        this.events = data;
        this.saveToStorage();
        this.notify('data_imported');
        return true;
      }
    } catch (e) {
      console.error('Import parse error:', e);
    }
    return false;
  }

  // API Key management (stored locally and never leaked)
  getGeminiApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  }

  setGeminiApiKey(key) {
    if (key) {
      localStorage.setItem(API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(API_KEY_STORAGE);
    }
  }
}

// Global singleton instance
window.eventState = new StateManager();
