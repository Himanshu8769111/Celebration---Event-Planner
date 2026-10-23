/**
 * CELEBRAI TIMELINE MASTER & RUN-OF-SHOW
 * Handles Phase Milestones, Day-of Schedules, Countdown timer, and readiness tracking.
 */

class TimelineManager {
  constructor() {
    this.currentView = 'roadmap'; // 'roadmap' | 'runofshow'
    this.countdownTimer = null;
  }

  init() {
    this.startCountdown();
    this.render();

    window.eventState.subscribe((event, changeType) => {
      if (['event_switched', 'task_toggled', 'timeline_task_added', 'timeline_task_deleted', 'run_item_toggled', 'run_item_added', 'run_item_deleted', 'event_reset', 'data_imported', 'metadata_updated'].includes(changeType)) {
        this.startCountdown();
        this.render();
      }
    });
  }

  setView(viewName) {
    this.currentView = viewName;
    const btnRoadmap = document.getElementById('view-btn-roadmap');
    const btnRun = document.getElementById('view-btn-run');
    const roadmapContainer = document.getElementById('timeline-roadmap-view');
    const runContainer = document.getElementById('timeline-run-view');

    if (viewName === 'roadmap') {
      if (btnRoadmap) btnRoadmap.classList.add('active');
      if (btnRun) btnRun.classList.remove('active');
      if (roadmapContainer) roadmapContainer.style.display = 'block';
      if (runContainer) runContainer.style.display = 'none';
    } else {
      if (btnRoadmap) btnRoadmap.classList.remove('active');
      if (btnRun) btnRun.classList.add('active');
      if (roadmapContainer) roadmapContainer.style.display = 'none';
      if (runContainer) runContainer.style.display = 'block';
    }
  }

  startCountdown() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    const update = () => {
      const ev = window.eventState.getCurrentEvent();
      const targetDate = new Date(`${ev.date}T${ev.time || '12:00'}:00`);
      const now = new Date();
      const diff = targetDate - now;

      const daysEl = document.getElementById('cd-days');
      const hoursEl = document.getElementById('cd-hours');
      const minsEl = document.getElementById('cd-mins');
      const secsEl = document.getElementById('cd-secs');

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minsEl) minsEl.textContent = '00';
        if (secsEl) secsEl.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
    };

    update();
    this.countdownTimer = setInterval(update, 1000);
  }

  render() {
    this.renderRoadmap();
    this.renderRunOfShow();
    this.renderReadinessMetric();
  }

  renderReadinessMetric() {
    const ev = window.eventState.getCurrentEvent();
    const tasks = ev.timeline || [];
    const total = tasks.length || 1;
    const completed = tasks.filter(t => t.completed).length;
    const pct = Math.round((completed / total) * 100);

    const bar = document.getElementById('timeline-readiness-bar');
    const label = document.getElementById('timeline-readiness-pct');
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}% Prepared (${completed}/${tasks.length} Milestones)`;
  }

  renderRoadmap() {
    const container = document.getElementById('timeline-roadmap-view');
    if (!container) return;

    const ev = window.eventState.getCurrentEvent();
    const tasks = ev.timeline || [];

    // Group tasks by phase
    const phaseOrder = ['6-12 Months Out', '3-6 Months Out', '1-2 Months Out', '2 Months Out', '1 Month Out', '2 Weeks Out', 'Week of Event', 'Week Of', 'Day of Event'];
    const grouped = {};

    tasks.forEach(task => {
      const p = task.phase || 'General Milestones';
      if (!grouped[p]) grouped[p] = [];
      grouped[p].push(task);
    });

    let html = '';
    const sortedPhases = Object.keys(grouped).sort((a, b) => {
      const idxA = phaseOrder.indexOf(a);
      const idxB = phaseOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return 0;
    });

    sortedPhases.forEach(phase => {
      const items = grouped[phase];
      html += `
        <div class="phase-group">
          <div class="phase-header">
            <span class="phase-badge">${escapeHtml(phase)}</span>
            <div class="phase-line"></div>
          </div>
          <div class="task-list">
            ${items.map(t => {
              const priorityClass = t.priority === 'high' ? 'badge-coral' : t.priority === 'medium' ? 'badge-gold' : 'badge-blush';
              return `
                <div class="task-card ${t.completed ? 'completed' : ''}">
                  <div class="task-left">
                    <button class="custom-checkbox ${t.completed ? 'checked' : ''}" 
                            onclick="window.eventState.toggleTask('${t.id}')"
                            aria-label="Toggle task ${escapeHtml(t.title)}">
                      ${t.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                    </button>
                    <div class="task-details">
                      <div class="task-title">${escapeHtml(t.title)}</div>
                      <div class="task-meta">
                        <span>Due: ${escapeHtml(t.dueDate)}</span>
                        <span class="badge ${priorityClass}">${escapeHtml(t.priority || 'Normal')}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button class="btn btn-sm btn-ghost" style="color: #e74c3c;" onclick="window.timelineManager.deleteTask('${t.id}')" title="Delete Milestone" aria-label="Delete milestone ${escapeHtml(t.title)}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = html || '<p style="color: var(--text-muted); text-align: center;">No roadmap milestones yet. Add one!</p>';
  }

  renderRunOfShow() {
    const container = document.getElementById('timeline-run-view');
    if (!container) return;

    const ev = window.eventState.getCurrentEvent();
    const runItems = ev.runOfShow || [];

    if (runItems.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No day-of schedule events yet.</p>';
      return;
    }

    container.innerHTML = `
      <div class="run-of-show-list">
        ${runItems.map(item => `
          <div class="run-item ${item.completed ? 'completed' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div class="run-time-tag">${escapeHtml(item.time)}</div>
                <h4 style="font-size: 1.05rem; margin-bottom: 0.25rem;">${escapeHtml(item.title)}</h4>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${escapeHtml(item.description)}</p>
                <div style="font-size: 0.78rem; color: var(--color-rose-dark); font-weight: 700;">
                  Assignee: ${escapeHtml(item.assignee || 'Event Coordinator')}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="custom-checkbox ${item.completed ? 'checked' : ''}" 
                        onclick="window.eventState.toggleRunItem('${item.id}')"
                        aria-label="Toggle schedule item ${escapeHtml(item.title)}">
                  ${item.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </button>
                <button class="btn btn-sm btn-ghost" style="color: #e74c3c;" onclick="window.timelineManager.deleteRunItem('${item.id}')" title="Delete Schedule Item" aria-label="Delete schedule item ${escapeHtml(item.title)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  showAddTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
      document.getElementById('task-form').reset();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  saveTaskForm(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const phase = document.getElementById('task-phase').value;
    const dueDate = document.getElementById('task-duedate').value.trim() || 'Upcoming';
    const priority = document.getElementById('task-priority').value;

    if (!title) {
      alert('Please enter a milestone title');
      return;
    }

    window.eventState.addTimelineTask({ title, phase, dueDate, priority });
    if (window.toast) window.toast.show('New milestone task scheduled!', 'success');
    this.closeTaskModal();
  }

  deleteTask(id) {
    if (confirm('Delete this milestone?')) {
      window.eventState.deleteTimelineTask(id);
      if (window.toast) window.toast.show('Milestone deleted', 'gold');
    }
  }

  closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  showAddRunModal() {
    const modal = document.getElementById('run-modal');
    if (modal) {
      document.getElementById('run-form').reset();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  saveRunForm(e) {
    e.preventDefault();
    const time = document.getElementById('run-time').value.trim();
    const title = document.getElementById('run-title-input').value.trim();
    const description = document.getElementById('run-description').value.trim();
    const assignee = document.getElementById('run-assignee').value.trim();

    if (!time || !title) {
      alert('Please fill in both time and event title.');
      return;
    }

    window.eventState.addRunItem({ time, title, description, assignee });
    if (window.toast) window.toast.show('Day-of schedule event added!', 'success');
    this.closeRunModal();
  }

  deleteRunItem(id) {
    if (confirm('Delete this schedule entry?')) {
      window.eventState.deleteRunItem(id);
      if (window.toast) window.toast.show('Schedule event deleted', 'gold');
    }
  }

  closeRunModal() {
    const modal = document.getElementById('run-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }
}

// Global instance
window.timelineManager = new TimelineManager();
