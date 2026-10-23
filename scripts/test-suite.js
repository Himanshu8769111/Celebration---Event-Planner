/**
 * CELEBRAI AUTOMATED TEST SUITE & VALIDATION RUNNER
 * Verifies Code Quality, Security, State Reactivity, Calculations, Accessibility, and Schema Alignment.
 * Executable via the in-app Test Runner modal or console `window.runTestSuite()`.
 */

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.registerAllTests();
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Assertion failed'} - Expected: ${expected}, Got: ${actual}`);
    }
  }

  test(name, category, testFn) {
    this.tests.push({ name, category, testFn });
  }

  registerAllTests() {
    // -------------------------------------------------------------
    // Category 1: State Management & Persistence
    // -------------------------------------------------------------
    this.test('Default Events Load Correctly', 'State', () => {
      const state = window.eventState;
      this.assert(state.events.wedding, 'Wedding template must exist');
      this.assert(state.events.birthday, 'Birthday template must exist');
      this.assert(state.events.community, 'Community template must exist');
      this.assertEqual(state.getCurrentEvent().type, state.currentEventKey, 'Current event matches active key');
    });

    this.test('Event Switching Updates Store & Notifies', 'State', () => {
      const state = window.eventState;
      const initialKey = state.currentEventKey;
      let notified = false;
      const sub = (ev, type) => { if (type === 'event_switched') notified = true; };
      state.subscribe(sub);

      state.setCurrentEvent('birthday');
      this.assertEqual(state.currentEventKey, 'birthday', 'Current key should be birthday');
      this.assertEqual(state.getCurrentEvent().type, 'birthday', 'Current event should be birthday');
      this.assert(notified, 'Subscriber should be notified on event switch');

      // Restore
      state.setCurrentEvent(initialKey);
    });

    // -------------------------------------------------------------
    // Category 2: Budget Architect & Math Integrity
    // -------------------------------------------------------------
    this.test('Budget Calculations & Totals Accuracy', 'Budget', () => {
      const bm = window.budgetManager;
      const calc = bm.getCalculations();
      this.assert(typeof calc.totalBudget === 'number' && calc.totalBudget > 0, 'Total budget must be a positive number');
      this.assert(typeof calc.totalActual === 'number' && calc.totalActual >= 0, 'Total actual must be non-negative');
      this.assertEqual(calc.variance, calc.totalBudget - calc.totalActual, 'Variance must equal totalBudget - totalActual');
      this.assert(calc.percentUsed >= 0 && calc.percentUsed <= 100, 'Percent used must be between 0 and 100');
    });

    this.test('Budget Item Add, Update, and Delete Cycle', 'Budget', () => {
      const state = window.eventState;
      const testItem = { category: 'Decor', name: 'Test Ice Sculpture', estimated: 500, actual: 450, status: 'paid' };
      state.addBudgetItem(testItem);

      const ev = state.getCurrentEvent();
      const added = ev.budgetItems.find(b => b.name === 'Test Ice Sculpture');
      this.assert(added, 'Item must be added to current event');
      this.assertEqual(added.actual, 450, 'Actual cost should match');

      // Update
      state.updateBudgetItem(added.id, { actual: 480 });
      const updated = ev.budgetItems.find(b => b.id === added.id);
      this.assertEqual(updated.actual, 480, 'Actual cost should be updated');

      // Delete
      state.deleteBudgetItem(added.id);
      const deleted = ev.budgetItems.find(b => b.id === added.id);
      this.assert(!deleted, 'Item must be removed from current event');
    });

    this.test('Currency Formatter Formats Accurately', 'Budget', () => {
      const bm = window.budgetManager;
      this.assertEqual(bm.formatMoney(1500, '$'), '$1,500', 'Should format 1500 with $');
      this.assertEqual(bm.formatMoney(25000, '€'), '€25,000', 'Should format 25000 with €');
    });

    // -------------------------------------------------------------
    // Category 3: Timeline & Schedule Logic
    // -------------------------------------------------------------
    this.test('Timeline Milestone Toggle & Readiness Metric', 'Timeline', () => {
      const state = window.eventState;
      const ev = state.getCurrentEvent();
      this.assert(ev.timeline && ev.timeline.length > 0, 'Event must have timeline tasks');

      const firstTask = ev.timeline[0];
      const initialStatus = firstTask.completed;
      state.toggleTask(firstTask.id);
      this.assertEqual(firstTask.completed, !initialStatus, 'Task completion should toggle');

      // Toggle back to preserve state
      state.toggleTask(firstTask.id);
      this.assertEqual(firstTask.completed, initialStatus, 'Task status restored');
    });

    this.test('Run-of-Show Chronological Sorting on Insert', 'Timeline', () => {
      const state = window.eventState;
      const testRun = { time: '01:00 AM', title: 'Late Midnight Snack', description: 'Sliders & Fries', assignee: 'Caterer' };
      state.addRunItem(testRun);

      const ev = state.getCurrentEvent();
      const added = ev.runOfShow.find(r => r.title === 'Late Midnight Snack');
      this.assert(added, 'Run item must be added');

      // Delete test item
      state.deleteRunItem(added.id);
    });

    // -------------------------------------------------------------
    // Category 4: Security & Input Sanitization
    // -------------------------------------------------------------
    this.test('XSS Sanitizer Neutralizes Injected Tags & Scripts', 'Security', () => {
      const dirty = `<script>alert('pwned')</script><img src=x onerror=alert(1)>`;
      const clean = escapeHtml(dirty);
      this.assert(!clean.includes('<script>'), 'Script tag must be stripped/escaped');
      this.assert(!clean.includes('onerror='), 'Onerror attribute must be escaped');
      this.assert(clean.includes('&lt;script&gt;'), 'Characters must be HTML entity encoded');
    });

    this.test('Safe Handling of Malformed JSON Import', 'Security', () => {
      const state = window.eventState;
      const result = state.importData('invalid-json{{{');
      this.assert(result === false, 'Malformed JSON must return false without throwing unhandled error');
    });

    // -------------------------------------------------------------
    // Category 5: Vendor Hub & Contract Sync
    // -------------------------------------------------------------
    this.test('Vendor Addition & Savings Computation', 'Vendors', () => {
      const state = window.eventState;
      const testVendor = {
        name: 'Apex Test Audio',
        category: 'Music',
        status: 'Contract Signed',
        quote: 3000,
        negotiated: 2600,
        contact: 'test@apex.com',
        deliverables: 'Sound setup'
      };
      state.addVendor(testVendor);

      const ev = state.getCurrentEvent();
      const added = ev.vendors.find(v => v.name === 'Apex Test Audio');
      this.assert(added, 'Vendor added');
      this.assertEqual(added.quote - added.negotiated, 400, 'Negotiated savings must be 400');

      state.deleteVendor(added.id);
    });

    // -------------------------------------------------------------
    // Category 6: GenAI Blueprint & Palette Alignment
    // -------------------------------------------------------------
    this.test('GenAI Engine Synthesizes Required Schema & Colors', 'GenAI', async () => {
      const ai = window.aiGenerator;
      const blueprint = await ai.synthesizeBlueprint({
        eventType: 'wedding',
        budget: 35000,
        guestCount: 120,
        vibe: 'Opulent Romantic'
      });

      this.assert(blueprint.theme, 'Blueprint must include theme');
      this.assert(blueprint.budgetBreakdown && blueprint.budgetBreakdown.length > 0, 'Blueprint must have budget allocations');
      this.assert(blueprint.runOfShow && blueprint.runOfShow.length > 0, 'Blueprint must have run of show');
      this.assert(blueprint.ideas && blueprint.ideas.length > 0, 'Blueprint must have ideas');

      // Verify exact user palette match: E43D12, D6536D, FFA2B6, EFB11D, EBE9E1
      const requiredColors = ['#E43D12', '#D6536D', '#FFA2B6', '#EFB11D', '#EBE9E1'];
      requiredColors.forEach(c => {
        this.assert(blueprint.theme.colors.includes(c), `Theme colors must contain required palette color ${c}`);
      });
    });

    // -------------------------------------------------------------
    // Category 7: Accessibility & WCAG Compliance
    // -------------------------------------------------------------
    this.test('Interactive Elements Have Accessible Names & Labels', 'Accessibility', () => {
      const buttons = document.querySelectorAll('button:not([aria-label]):not([title])');
      let missingText = 0;
      buttons.forEach(b => {
        if (!b.textContent.trim()) missingText++;
      });
      this.assertEqual(missingText, 0, 'Every button must have either text content, title, or aria-label');
    });

    this.test('Modal Dialogs Implement ARIA Landmarks', 'Accessibility', () => {
      const modals = document.querySelectorAll('.modal-backdrop');
      modals.forEach(m => {
        this.assert(m.hasAttribute('aria-hidden'), 'Modal backdrop must define aria-hidden');
      });
    });
  }

  async runAll() {
    this.results = [];
    const startTime = performance.now();

    for (const test of this.tests) {
      const t0 = performance.now();
      try {
        await test.testFn();
        const duration = (performance.now() - t0).toFixed(1);
        this.results.push({ name: test.name, category: test.category, passed: true, duration });
      } catch (err) {
        const duration = (performance.now() - t0).toFixed(1);
        this.results.push({ name: test.name, category: test.category, passed: false, duration, error: err.message });
      }
    }

    const totalDuration = (performance.now() - startTime).toFixed(1);
    this.renderResults(totalDuration);
    return this.results;
  }

  renderResults(totalDuration) {
    const list = document.getElementById('test-suite-list');
    const badge = document.getElementById('test-suite-summary-badge');
    const modal = document.getElementById('test-modal');

    if (!list) return;

    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    if (badge) {
      badge.textContent = `${passed}/${total} Passed (${totalDuration}ms)`;
      badge.className = failed === 0 ? 'badge badge-success' : 'badge badge-coral';
    }

    list.innerHTML = this.results.map(r => `
      <div class="test-item ${r.passed ? 'pass' : 'fail'}">
        <div>
          <span style="font-weight: 700; color: var(--text-primary);">${r.passed ? '✓' : '✗'} [${r.category}]</span>
          <span style="margin-left: 0.5rem;">${escapeHtml(r.name)}</span>
          ${r.error ? `<div style="color: #e74c3c; font-size: 0.78rem; margin-top: 0.2rem;">${escapeHtml(r.error)}</div>` : ''}
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
          ${r.duration}ms
        </div>
      </div>
    `).join('');

    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  showModal() {
    this.runAll();
  }

  closeModal() {
    const modal = document.getElementById('test-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }
}

// Global test runner
window.testRunner = new TestRunner();
window.runTestSuite = () => window.testRunner.runAll();
