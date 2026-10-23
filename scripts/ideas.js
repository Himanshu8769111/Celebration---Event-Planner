/**
 * CELEBRAI BESPOKE IDEAS & MOOD BOARD GALLERY
 * Displays curated personalized concepts, filters, bookmarks, and one-click adoption to plan.
 */

class IdeasManager {
  constructor() {
    this.activeFilter = 'all';
  }

  init() {
    this.render();
    window.eventState.subscribe((event, changeType) => {
      if (['event_switched', 'idea_added', 'idea_bookmarked', 'event_reset', 'data_imported'].includes(changeType)) {
        this.render();
      }
    });
  }

  setFilter(filter) {
    this.activeFilter = filter;
    const buttons = document.querySelectorAll('.ideas-filter-btn');
    buttons.forEach(b => {
      if (b.dataset.filter === filter) b.classList.add('active');
      else b.classList.remove('active');
    });
    this.render();
  }

  render() {
    const container = document.getElementById('ideas-grid');
    if (!container) return;

    const ev = window.eventState.getCurrentEvent();
    const ideas = ev.ideas || [];

    let filtered = ideas;
    if (this.activeFilter === 'saved') {
      filtered = ideas.filter(i => i.bookmarked);
    } else if (this.activeFilter !== 'all') {
      filtered = ideas.filter(i => i.category.toLowerCase().includes(this.activeFilter.toLowerCase()));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg); border: 1.5px dashed rgba(239,177,29,0.3);">
          <h4 style="margin-bottom: 0.5rem;">No concepts found</h4>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">Use the AI Generator above to spark bespoke ideas!</p>
          <button class="btn btn-primary" onclick="window.scrollTo({top: document.getElementById('ai-studio').offsetTop - 80, behavior: 'smooth'})">✨ Spark Ideas with AI</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(idea => {
      const isBookmarked = !!idea.bookmarked;
      const defaultImg = ev.coverImage || 'assets/images/wedding.jpg';

      return `
        <div class="idea-card hover-lift card-luxury">
          <div style="position: relative;">
            <img src="${idea.image || defaultImg}" alt="${escapeHtml(idea.title)}" class="idea-image-banner" loading="lazy" />
            <button class="btn btn-sm" 
                    style="position: absolute; top: 0.75rem; right: 0.75rem; border-radius: 50%; width: 34px; height: 34px; padding: 0; background: rgba(255,255,255,0.9); box-shadow: 0 2px 8px rgba(0,0,0,0.15);"
                    onclick="window.eventState.toggleBookmarkIdea('${idea.id}')"
                    aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark idea'}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookmarked ? 'var(--color-coral)' : 'none'}" stroke="var(--color-coral)" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <span class="badge badge-gold" style="position: absolute; bottom: 0.75rem; left: 0.75rem;">
              ${escapeHtml(idea.category)}
            </span>
          </div>

          <div class="idea-body">
            <div>
              <h3 class="idea-title">${escapeHtml(idea.title)}</h3>
              <p class="idea-desc">${escapeHtml(idea.description)}</p>
              
              <div class="idea-meta-tags">
                ${(idea.tags || []).map(t => `<span class="badge badge-blush">#${escapeHtml(t)}</span>`).join('')}
              </div>
            </div>

            <div style="border-top: 1px solid rgba(214, 83, 109, 0.12); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <button class="btn btn-sm btn-outline-gold" onclick="window.ideasManager.adoptIdea('${idea.id}')">
                ✨ Adopt to My Plan
              </button>
              <span style="font-size: 0.78rem; color: var(--color-rose-dark); font-weight: 600;">GenAI Curated</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  adoptIdea(id) {
    const ev = window.eventState.getCurrentEvent();
    const idea = ev.ideas.find(i => i.id === id);
    if (!idea) return;

    // Convert into a milestone task
    window.eventState.addTimelineTask({
      title: `Implement Idea: ${idea.title}`,
      phase: 'Week of Event',
      dueDate: 'Scheduled',
      priority: 'high'
    });

    if (window.toast) {
      window.toast.show(`"${idea.title}" added to your Timeline Milestones!`, 'success');
    }
  }

  showAddModal() {
    const modal = document.getElementById('idea-modal');
    if (modal) {
      document.getElementById('idea-form').reset();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  saveIdeaForm(e) {
    e.preventDefault();
    const title = document.getElementById('idea-title-input').value.trim();
    const category = document.getElementById('idea-category-input').value.trim() || 'Creative Concept';
    const description = document.getElementById('idea-desc-input').value.trim();
    const tagsRaw = document.getElementById('idea-tags-input').value.trim();
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()) : ['Personal Touch'];

    if (!title || !description) {
      alert('Please fill in title and description.');
      return;
    }

    const currentEv = window.eventState.getCurrentEvent();
    window.eventState.addIdea({
      title,
      category,
      description,
      tags,
      bookmarked: true,
      image: currentEv.coverImage || 'assets/images/wedding.jpg'
    });

    if (window.toast) window.toast.show('Idea added to your mood board!', 'success');
    this.closeModal();
  }

  closeModal() {
    const modal = document.getElementById('idea-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }
}

// Global instance
window.ideasManager = new IdeasManager();
