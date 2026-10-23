/**
 * CELEBRAI BUDGET ARCHITECT & COMMAND CENTER
 * Handles financial calculations, interactive SVG charts, expense CRUD,
 * threshold warnings, and budget optimizer suggestions.
 */

class BudgetManager {
  constructor() {
    this.palette = [
      '#E43D12', // Coral Vermilion
      '#D6536D', // Berry Rose
      '#EFB11D', // Amber Gold
      '#FFA2B6', // Blush
      '#9B2C2C', // Deep Crimson
      '#B7791F', // Ochre Gold
      '#D53F8C', // Deep Rose
      '#ED8936'  // Warm Tangerine
    ];
  }

  init() {
    this.render();
    // Subscribe to state updates
    window.eventState.subscribe((event, changeType) => {
      if (['event_switched', 'budget_item_added', 'budget_item_updated', 'budget_item_deleted', 'event_reset', 'data_imported', 'metadata_updated'].includes(changeType)) {
        this.render();
      }
    });
  }

  getCalculations() {
    const ev = window.eventState.getCurrentEvent();
    const items = ev.budgetItems || [];
    const totalBudget = Number(ev.totalBudget) || 1;

    let totalEstimated = 0;
    let totalActual = 0;
    let totalPaid = 0;

    const categoryMap = {};

    items.forEach(item => {
      const est = Number(item.estimated) || 0;
      const act = Number(item.actual) || 0;
      totalEstimated += est;
      totalActual += act;

      if (item.status === 'paid') totalPaid += act;
      else if (item.status === 'deposit') totalPaid += (act * 0.5);

      const cat = item.category || 'Other';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, estimated: 0, actual: 0, count: 0 };
      }
      categoryMap[cat].estimated += est;
      categoryMap[cat].actual += act;
      categoryMap[cat].count += 1;
    });

    const categories = Object.values(categoryMap).sort((a, b) => b.actual - a.actual);
    const variance = totalBudget - totalActual;
    const percentUsed = Math.min(Math.round((totalActual / totalBudget) * 100), 100);

    return {
      currency: ev.currency || '$',
      totalBudget,
      totalEstimated,
      totalActual,
      totalPaid,
      variance,
      percentUsed,
      categories,
      items
    };
  }

  formatMoney(amount, currency = '$') {
    return `${currency}${Number(amount).toLocaleString('en-US')}`;
  }

  render() {
    const calc = this.getCalculations();
    
    // Update KPI displays
    const elTotal = document.getElementById('kpi-total-budget');
    const elSpent = document.getElementById('kpi-total-spent');
    const elRemaining = document.getElementById('kpi-remaining-budget');
    const elPct = document.getElementById('kpi-budget-pct');

    if (elTotal) elTotal.textContent = this.formatMoney(calc.totalBudget, calc.currency);
    if (elSpent) elSpent.textContent = this.formatMoney(calc.totalActual, calc.currency);
    if (elRemaining) {
      elRemaining.textContent = this.formatMoney(Math.abs(calc.variance), calc.currency);
      elRemaining.style.color = calc.variance >= 0 ? '#196f3d' : '#e74c3c';
      const label = document.getElementById('kpi-remaining-label');
      if (label) label.textContent = calc.variance >= 0 ? 'Remaining Balance' : 'Over Budget by';
    }
    if (elPct) elPct.textContent = `${calc.percentUsed}% Committed`;

    // Render Donut Chart
    this.renderDonutChart(calc);

    // Render Expense Table
    this.renderExpenseTable(calc);

    // Render AI Optimizer Banner
    this.renderAIOptimizerAlert(calc);
  }

  renderDonutChart(calc) {
    const svg = document.getElementById('budget-donut-svg');
    const legendContainer = document.getElementById('budget-chart-legend');
    const centerAmount = document.getElementById('chart-center-amount');
    
    if (centerAmount) {
      centerAmount.textContent = this.formatMoney(calc.totalActual, calc.currency);
    }

    if (!svg || !legendContainer) return;

    svg.innerHTML = '';
    legendContainer.innerHTML = '';

    const size = 220;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let cumulativeOffset = 0;
    const total = calc.totalActual > 0 ? calc.totalActual : 1;

    calc.categories.forEach((cat, index) => {
      const color = this.palette[index % this.palette.length];
      const slicePct = cat.actual / total;
      const strokeLength = slicePct * circumference;
      const strokeDashoffset = circumference - cumulativeOffset;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center);
      circle.setAttribute('cy', center);
      circle.setAttribute('r', radius);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', strokeWidth);
      circle.setAttribute('stroke-dasharray', `${strokeLength} ${circumference}`);
      circle.setAttribute('stroke-dashoffset', strokeDashoffset);
      circle.setAttribute('transform', `rotate(-90 ${center} ${center})`);
      circle.classList.add('chart-segment');

      circle.setAttribute('title', `${cat.name}: ${this.formatMoney(cat.actual, calc.currency)} (${Math.round(slicePct * 100)}%)`);
      svg.appendChild(circle);

      cumulativeOffset += strokeLength;

      // Legend Item
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <span class="legend-dot" style="background-color: ${color}"></span>
        <span class="legend-label"><strong>${escapeHtml(cat.name)}</strong>: ${Math.round(slicePct * 100)}%</span>
      `;
      legendContainer.appendChild(legendItem);
    });
  }

  renderExpenseTable(calc) {
    const tbody = document.getElementById('expense-table-body');
    if (!tbody) return;

    if (calc.items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No expenses recorded yet. Click "+ Add Expense" to begin.</td></tr>`;
      return;
    }

    tbody.innerHTML = calc.items.map(item => {
      const statusClass = item.status === 'paid' ? 'badge-success' : item.status === 'deposit' ? 'badge-gold' : 'badge-coral';
      const statusLabel = item.status === 'paid' ? 'Paid in Full' : item.status === 'deposit' ? 'Deposit Paid' : 'Pending';

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(item.name)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(item.notes || '')}</div>
          </td>
          <td><span class="badge badge-blush">${escapeHtml(item.category)}</span></td>
          <td style="font-family: var(--font-mono);">${this.formatMoney(item.estimated, calc.currency)}</td>
          <td style="font-family: var(--font-mono); font-weight: 700;">${this.formatMoney(item.actual, calc.currency)}</td>
          <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-sm btn-ghost" onclick="window.budgetManager.editItem('${item.id}')" title="Edit Expense" aria-label="Edit ${escapeHtml(item.name)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="btn btn-sm btn-ghost" style="color: #e74c3c;" onclick="window.budgetManager.deleteItem('${item.id}')" title="Delete Expense" aria-label="Delete ${escapeHtml(item.name)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderAIOptimizerAlert(calc) {
    const alertBox = document.getElementById('budget-ai-alert');
    if (!alertBox) return;

    // Check for anomalies
    const catering = calc.categories.find(c => c.name.toLowerCase().includes('cater') || c.name.toLowerCase().includes('bar'));
    const venue = calc.categories.find(c => c.name.toLowerCase().includes('venue'));

    let alertTitle = 'AI Budget Health: Well-Balanced';
    let alertMsg = 'Your category allocations are within healthy celebration benchmarks.';

    if (catering && (catering.actual / calc.totalBudget) > 0.40) {
      alertTitle = 'AI Optimizer Alert: High Catering Share';
      alertMsg = `Catering currently accounts for ${Math.round((catering.actual / calc.totalBudget) * 100)}% of your total budget. Consider offering a dual-entrée buffet or negotiating signature cocktail batching to save $800–$1,500.`;
    } else if (venue && (venue.actual / calc.totalBudget) > 0.38) {
      alertTitle = 'AI Optimizer Alert: Venue Allocation';
      alertMsg = `Venue rental is taking up ${Math.round((venue.actual / calc.totalBudget) * 100)}% of total funds. Inquire if chairs, lighting, and audio equipment can be bundled at no extra cost.`;
    } else if (calc.variance < 0) {
      alertTitle = 'AI Budget Alert: Projected Deficit';
      alertMsg = `You are currently ${this.formatMoney(Math.abs(calc.variance), calc.currency)} over your original target. Check the contingency and decor lines for potential quick reductions.`;
    }

    alertBox.innerHTML = `
      <div class="ai-optimizer-banner">
        <div class="ai-optimizer-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
        </div>
        <div>
          <div class="ai-optimizer-title">${escapeHtml(alertTitle)}</div>
          <div class="ai-optimizer-text">${escapeHtml(alertMsg)}</div>
        </div>
      </div>
    `;
  }

  showAddModal() {
    const modal = document.getElementById('expense-modal');
    if (modal) {
      document.getElementById('expense-form').reset();
      document.getElementById('expense-edit-id').value = '';
      document.getElementById('expense-modal-title').textContent = 'Add New Expense Item';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  editItem(id) {
    const ev = window.eventState.getCurrentEvent();
    const item = ev.budgetItems.find(b => b.id === id);
    if (!item) return;

    document.getElementById('expense-edit-id').value = item.id;
    document.getElementById('expense-name').value = item.name;
    document.getElementById('expense-category').value = item.category;
    document.getElementById('expense-estimated').value = item.estimated;
    document.getElementById('expense-actual').value = item.actual;
    document.getElementById('expense-status').value = item.status;
    document.getElementById('expense-notes').value = item.notes || '';
    document.getElementById('expense-modal-title').textContent = 'Edit Expense Item';

    const modal = document.getElementById('expense-modal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  saveForm(e) {
    e.preventDefault();
    const editId = document.getElementById('expense-edit-id').value;
    const name = document.getElementById('expense-name').value.trim();
    const category = document.getElementById('expense-category').value;
    const estimated = parseFloat(document.getElementById('expense-estimated').value) || 0;
    const actual = parseFloat(document.getElementById('expense-actual').value) || 0;
    const status = document.getElementById('expense-status').value;
    const notes = document.getElementById('expense-notes').value.trim();

    if (!name) {
      alert('Please enter an item name.');
      return;
    }

    if (editId) {
      window.eventState.updateBudgetItem(editId, { name, category, estimated, actual, status, notes });
      if (window.toast) window.toast.show('Expense updated successfully!', 'success');
    } else {
      window.eventState.addBudgetItem({ name, category, estimated, actual, status, notes });
      if (window.toast) window.toast.show('New expense added!', 'success');
    }

    this.closeModal();
  }

  deleteItem(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
      window.eventState.deleteBudgetItem(id);
      if (window.toast) window.toast.show('Expense removed', 'gold');
    }
  }

  closeModal() {
    const modal = document.getElementById('expense-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  exportCSV() {
    const calc = this.getCalculations();
    let csv = 'Name,Category,Estimated,Actual,Status,Notes\r\n';
    calc.items.forEach(i => {
      csv += `"${i.name}","${i.category}",${i.estimated},${i.actual},"${i.status}","${i.notes || ''}"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Budget_${window.eventState.getCurrentEvent().title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Global singleton
window.budgetManager = new BudgetManager();
