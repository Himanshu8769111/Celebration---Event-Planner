/**
 * CELEBRAI APPLICATION ORCHESTRATOR
 * Bootstraps modules, manages event switching, AI form synthesis,
 * copilot chat drawer, modals, toasts, and keyboard shortcuts.
 */

// Simple Toast Notification Component
class ToastNotification {
  constructor() {
    this.container = document.querySelector('.toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    if (type === 'success') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else if (type === 'gold') {
      icon = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      `;
    }

    toast.innerHTML = `
      <div>${icon}</div>
      <div style="flex: 1; font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${escapeHtml(message)}</div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }
}

window.toast = new ToastNotification();

// Application Main Class
class App {
  constructor() {
    this.latestGeneratedBlueprint = null;
  }

  init() {
    // Initialize Submodules
    window.budgetManager.init();
    window.timelineManager.init();
    window.vendorManager.init();
    window.ideasManager.init();
    window.scrollEffects.init();

    this.bindEvents();
    this.updateHeroView();

    // Subscribe to state changes for UI syncing
    window.eventState.subscribe((event, changeType) => {
      this.updateHeroView();
    });

    console.log('%c✨ CelebraAI Event Architect Initialized', 'font-size: 14px; font-weight: bold; color: #E43D12;');
  }

  bindEvents() {
    // Header select change
    const headerSelect = document.getElementById('header-event-select');
    if (headerSelect) {
      headerSelect.addEventListener('change', (e) => {
        window.eventState.setCurrentEvent(e.target.value);
        this.syncTabsWithState(e.target.value);
      });
    }

    // Hero Event Type Tabs
    const typeButtons = document.querySelectorAll('.event-type-btn');
    typeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        window.eventState.setCurrentEvent(type);
        this.syncTabsWithState(type);
      });
    });

    // AI Generator Form Submit
    const aiForm = document.getElementById('ai-blueprint-form');
    if (aiForm) {
      aiForm.addEventListener('submit', (e) => this.handleGenerateBlueprint(e));
    }

    // AI Output Tabs
    const aiTabs = document.querySelectorAll('.ai-tab-btn');
    aiTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        aiTabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.ai-tab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(tab.dataset.target);
        if (panel) panel.classList.add('active');
      });
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => {
          m.classList.remove('open');
          m.setAttribute('aria-hidden', 'true');
        });
        const chatDrawer = document.getElementById('chat-drawer');
        if (chatDrawer) chatDrawer.classList.remove('open');
      }

      // Ctrl + Alt + T opens test runner
      if (e.ctrlKey && e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        window.testRunner.showModal();
      }
    });

    // Chat Drawer Handlers
    const chatInput = document.getElementById('chat-user-input');
    if (chatInput) {
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendChatMessage();
        }
      });
    }
  }

  syncTabsWithState(type) {
    const headerSelect = document.getElementById('header-event-select');
    if (headerSelect) headerSelect.value = type;

    const typeButtons = document.querySelectorAll('.event-type-btn');
    typeButtons.forEach(btn => {
      if (btn.dataset.type === type) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // Update AI Form Event Type
    const formType = document.getElementById('ai-event-type');
    if (formType) formType.value = type;
  }

  updateHeroView() {
    const ev = window.eventState.getCurrentEvent();
    
    // Titles & text
    const heroTitle = document.getElementById('hero-event-title');
    const heroSubtitle = document.getElementById('hero-event-subtitle');
    const heroDate = document.getElementById('hero-event-date');
    const heroLocation = document.getElementById('hero-event-location');
    const heroGuests = document.getElementById('hero-event-guests');
    const heroImg = document.getElementById('hero-cover-image');
    const heroBadge = document.getElementById('hero-type-badge');

    if (heroTitle) heroTitle.innerHTML = `<span class="gradient-text">${escapeHtml(ev.title)}</span>`;
    if (heroSubtitle) heroSubtitle.textContent = ev.subtitle || '';
    if (heroDate) heroDate.textContent = new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (heroLocation) heroLocation.textContent = ev.location || '';
    if (heroGuests) heroGuests.textContent = `${ev.guestCount} Guests`;
    if (heroImg && ev.coverImage) heroImg.src = ev.coverImage;
    if (heroBadge) heroBadge.textContent = `${ev.type.toUpperCase()} ARCHITECTURE`;

    // Metrics strip
    const calc = window.budgetManager.getCalculations();
    const metricBudget = document.getElementById('metric-budget');
    const metricVendors = document.getElementById('metric-vendors');
    const metricTasks = document.getElementById('metric-tasks');
    const metricRsvp = document.getElementById('metric-rsvp');

    if (metricBudget) metricBudget.textContent = window.budgetManager.formatMoney(ev.totalBudget, ev.currency);
    if (metricVendors) metricVendors.textContent = `${(ev.vendors || []).length} Contracted`;
    if (metricTasks) {
      const completed = (ev.timeline || []).filter(t => t.completed).length;
      metricTasks.textContent = `${completed}/${(ev.timeline || []).length} Milestones`;
    }
    if (metricRsvp) {
      const rsvp = ev.rsvp || { confirmed: 0 };
      metricRsvp.textContent = `${rsvp.confirmed} Attending`;
    }

    this.syncTabsWithState(window.eventState.currentEventKey);
  }

  async handleGenerateBlueprint(e) {
    e.preventDefault();
    const btn = document.getElementById('ai-generate-submit-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-slow" style="animation: spinSlow 1s linear infinite;">
        <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line>
      </svg>
      <span>Synthesizing Bespoke Blueprint...</span>
    `;

    const eventType = document.getElementById('ai-event-type').value;
    const budget = parseFloat(document.getElementById('ai-budget').value) || 25000;
    const guestCount = parseInt(document.getElementById('ai-guests').value) || 100;
    const vibe = document.getElementById('ai-vibe').value;
    const specialNotes = document.getElementById('ai-special-notes').value;

    try {
      const blueprint = await window.aiGenerator.generateEventBlueprint({
        eventType,
        budget,
        guestCount,
        vibe,
        specialNotes
      });

      this.latestGeneratedBlueprint = blueprint;
      this.renderBlueprintResults(blueprint);
      window.toast.show('✨ Bespoke Blueprint Generated!', 'success');
      window.scrollEffects.celebrateBurst();
    } catch (err) {
      console.error('Error generating blueprint:', err);
      window.toast.show('Generation error: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  renderBlueprintResults(bp) {
    const container = document.getElementById('ai-results-content');
    if (!container) return;

    // 1. Theme Panel
    const themePanel = document.getElementById('tab-theme');
    if (themePanel) {
      themePanel.innerHTML = `
        <h3 style="margin-bottom: 0.5rem; color: var(--color-coral);">${escapeHtml(bp.theme.name)}</h3>
        <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
          ${escapeHtml(bp.theme.description)}
        </p>

        <h4 style="font-size: 0.82rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">
          Signature Color Harmonization
        </h4>
        <div class="palette-swatches">
          ${bp.theme.colors.map(c => `
            <div class="swatch-item">
              <span class="swatch-color" style="background: ${c};"></span>
              <span>${c}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 2. Budget Allocation Panel
    const budgetPanel = document.getElementById('tab-allocations');
    if (budgetPanel) {
      budgetPanel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          ${bp.budgetBreakdown.map(b => `
            <div style="background: #FAF8F5; border-radius: var(--radius-sm); padding: 0.85rem; border-left: 4px solid var(--color-gold);">
              <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 0.25rem;">
                <span>${escapeHtml(b.category)}</span>
                <span style="font-family: var(--font-mono); color: var(--color-coral);">$${b.amount.toLocaleString()} (${b.percentage}%)</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">${escapeHtml(b.notes)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 3. Run of Show Panel
    const runPanel = document.getElementById('tab-runofshow');
    if (runPanel) {
      runPanel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${bp.runOfShow.map(r => `
            <div style="display: flex; gap: 1rem; align-items: flex-start; padding: 0.6rem 0; border-bottom: 1px dashed rgba(214,83,109,0.15);">
              <span style="font-family: var(--font-mono); font-weight: 700; color: var(--color-coral); min-width: 80px;">${escapeHtml(r.time)}</span>
              <div>
                <strong style="font-size: 0.9rem;">${escapeHtml(r.title)}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.description)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // 4. Vendors Panel
    const vendorPanel = document.getElementById('tab-vendors');
    if (vendorPanel) {
      vendorPanel.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${bp.vendorChecklist.map(v => `
            <div style="padding: 0.75rem; border: 1px solid rgba(214,83,109,0.2); border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>${escapeHtml(v.name)}</strong>
                <span class="badge badge-blush" style="margin-left: 0.5rem;">${escapeHtml(v.category)}</span>
                <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(v.deliverables)}</div>
              </div>
              <span style="font-family: var(--font-mono); font-weight: 700;">$${v.quote.toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Show "Adopt Blueprint" Action
    const adoptBtn = document.getElementById('ai-adopt-blueprint-btn');
    if (adoptBtn) adoptBtn.style.display = 'inline-flex';
  }

  applyLatestBlueprint() {
    if (!this.latestGeneratedBlueprint) return;
    const bp = this.latestGeneratedBlueprint;
    const currentEv = window.eventState.getCurrentEvent();

    // Update Theme
    currentEv.theme = bp.theme;
    
    // Update Budget items
    if (bp.budgetBreakdown) {
      currentEv.budgetItems = bp.budgetBreakdown.map((b, idx) => ({
        id: 'bp_b_' + idx,
        category: b.category,
        name: `${b.category} Package`,
        estimated: b.amount,
        actual: b.amount,
        status: idx === 0 ? 'deposit' : 'pending',
        notes: b.notes
      }));
    }

    // Update Run of Show
    if (bp.runOfShow) {
      currentEv.runOfShow = bp.runOfShow.map((r, idx) => ({
        id: 'bp_r_' + idx,
        time: r.time,
        title: r.title,
        description: r.description,
        assignee: r.assignee || 'Coordinator',
        completed: false
      }));
    }

    // Update Ideas
    if (bp.ideas) {
      bp.ideas.forEach(i => {
        window.eventState.addIdea({
          title: i.title,
          category: i.category,
          description: i.description,
          tags: i.tags || ['GenAI'],
          bookmarked: true,
          image: currentEv.coverImage
        });
      });
    }

    window.eventState.notify('blueprint_applied');
    window.toast.show('✨ Entire Blueprint applied to your active event!', 'success');
    window.scrollEffects.celebrateBurst();
  }

  // Copilot Chat Drawer
  toggleChatDrawer() {
    const drawer = document.getElementById('chat-drawer');
    if (drawer) {
      drawer.classList.toggle('open');
      if (drawer.classList.contains('open')) {
        document.getElementById('chat-user-input')?.focus();
      }
    }
  }

  async sendChatMessage(presetText) {
    const input = document.getElementById('chat-user-input');
    const msg = presetText || input?.value.trim();
    if (!msg) return;

    if (input && !presetText) input.value = '';

    const messagesContainer = document.getElementById('chat-messages-body');
    if (!messagesContainer) return;

    // Render User Msg
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.textContent = msg;
    messagesContainer.appendChild(userDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Loading indicator
    const botDiv = document.createElement('div');
    botDiv.className = 'chat-msg bot';
    botDiv.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">Aura AI is thinking...</span>';
    messagesContainer.appendChild(botDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const response = await window.aiGenerator.answerCopilotPrompt(msg, window.eventState.getCurrentEvent());

    botDiv.innerHTML = `
      <div>${markedConvert(response.text)}</div>
      ${response.chips ? `
        <div class="chat-msg-chips">
          ${response.chips.map(chip => `
            <button class="chat-chip" onclick="window.app.sendChatMessage('${escapeHtml(chip)}')">${escapeHtml(chip)}</button>
          `).join('')}
        </div>
      ` : ''}
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // API Key Settings Modal
  showApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    const input = document.getElementById('gemini-api-key-input');
    if (modal && input) {
      input.value = window.eventState.getGeminiApiKey();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  saveApiKey(e) {
    e.preventDefault();
    const input = document.getElementById('gemini-api-key-input');
    const key = input ? input.value : '';
    window.eventState.setGeminiApiKey(key);
    window.toast.show(key ? 'Google Gemini API Key securely saved!' : 'API Key removed. Using offline AI engine.', 'gold');
    this.closeApiKeyModal();
  }

  closeApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Export / Import
  exportEventData() {
    const json = window.eventState.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CelebraAI_Events_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.toast.show('Events exported as JSON backup', 'success');
  }

  triggerImport() {
    document.getElementById('import-file-input')?.click();
  }

  handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = window.eventState.importData(event.target.result);
      if (ok) {
        window.toast.show('Backup successfully imported & synchronized!', 'success');
        window.scrollEffects.celebrateBurst();
      } else {
        window.toast.show('Invalid JSON format in imported file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  resetCurrentTemplate() {
    if (confirm('Reset this event to default template data? Any unsaved edits will be cleared.')) {
      window.eventState.resetCurrentEvent();
      window.toast.show('Event reset to template defaults', 'gold');
    }
  }
}

// Simple markdown converter for Copilot responses (bolding, lists)
function markedConvert(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<div style="margin-left: 0.5rem;">• $1</div>')
    .replace(/\n/g, '<br/>');
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
