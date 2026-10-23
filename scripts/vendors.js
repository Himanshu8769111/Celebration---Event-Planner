/**
 * CELEBRAI VENDOR MANAGEMENT & CONTRACT PIPELINE
 * Manages vendor research, RFP quotes, contracts, contact cards, and budget syncing.
 */

class VendorManager {
  constructor() {
    this.activeCategoryFilter = 'all';
  }

  init() {
    this.render();
    window.eventState.subscribe((event, changeType) => {
      if (['event_switched', 'vendor_added', 'vendor_updated', 'vendor_deleted', 'event_reset', 'data_imported'].includes(changeType)) {
        this.render();
      }
    });
  }

  setCategoryFilter(category) {
    this.activeCategoryFilter = category;
    this.render();
  }

  render() {
    const container = document.getElementById('vendors-grid');
    if (!container) return;

    const ev = window.eventState.getCurrentEvent();
    const vendors = ev.vendors || [];
    const currency = ev.currency || '$';

    const filtered = this.activeCategoryFilter === 'all' 
      ? vendors 
      : vendors.filter(v => v.category.toLowerCase() === this.activeCategoryFilter.toLowerCase());

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface-elevated); border-radius: var(--radius-lg); border: 1px dashed rgba(214,83,109,0.3);">
          <h4 style="margin-bottom: 0.5rem;">No vendors found for this filter</h4>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">Add a new vendor or switch categories.</p>
          <button class="btn btn-primary" onclick="window.vendorManager.showAddModal()">+ Add New Vendor</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(v => {
      const quote = Number(v.quote) || 0;
      const negotiated = Number(v.negotiated) || quote;
      const savings = quote > negotiated ? (quote - negotiated) : 0;

      let statusBadge = 'badge-coral';
      if (v.status === 'Contract Signed') statusBadge = 'badge-gold';
      if (v.status === 'Deposit Paid') statusBadge = 'badge-success';
      if (v.status === 'Completed') statusBadge = 'badge-success';

      return `
        <div class="vendor-card hover-lift card-luxury">
          <div>
            <div class="vendor-header">
              <div>
                <h3 class="vendor-name">${escapeHtml(v.name)}</h3>
                <span class="vendor-category">${escapeHtml(v.category)}</span>
              </div>
              <span class="badge ${statusBadge}">${escapeHtml(v.status)}</span>
            </div>

            <div class="vendor-deliverables">
              <strong>Scope & Deliverables:</strong>
              <div>${escapeHtml(v.deliverables || 'Full event day coverage as agreed in RFP')}</div>
            </div>

            <ul class="vendor-details-list">
              <li>
                <strong>Contact:</strong> 
                <a href="mailto:${escapeHtml(v.contact)}" style="text-decoration: underline;">${escapeHtml(v.contact)}</a>
              </li>
              <li>
                <strong>Initial Quote:</strong> 
                <span>${currency}${quote.toLocaleString()}</span>
              </li>
              ${savings > 0 ? `
                <li style="color: #196f3d; font-weight: 700;">
                  <strong>Negotiated Savings:</strong> ${currency}${savings.toLocaleString()} saved
                </li>
              ` : ''}
            </ul>
          </div>

          <div class="vendor-footer">
            <div>
              <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Agreed Investment</div>
              <div class="vendor-price">${currency}${negotiated.toLocaleString()}</div>
            </div>

            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-sm btn-secondary" onclick="window.vendorManager.editVendor('${v.id}')" title="Edit Vendor" aria-label="Edit vendor ${escapeHtml(v.name)}">
                Edit
              </button>
              <button class="btn btn-sm btn-ghost" style="color: #e74c3c;" onclick="window.vendorManager.deleteVendor('${v.id}')" title="Delete Vendor" aria-label="Delete vendor ${escapeHtml(v.name)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  showAddModal() {
    const modal = document.getElementById('vendor-modal');
    if (modal) {
      document.getElementById('vendor-form').reset();
      document.getElementById('vendor-edit-id').value = '';
      document.getElementById('vendor-modal-title').textContent = 'Add Partner Vendor';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  editVendor(id) {
    const ev = window.eventState.getCurrentEvent();
    const vendor = ev.vendors.find(v => v.id === id);
    if (!vendor) return;

    document.getElementById('vendor-edit-id').value = vendor.id;
    document.getElementById('vendor-name').value = vendor.name;
    document.getElementById('vendor-category').value = vendor.category;
    document.getElementById('vendor-status').value = vendor.status;
    document.getElementById('vendor-quote').value = vendor.quote;
    document.getElementById('vendor-negotiated').value = vendor.negotiated;
    document.getElementById('vendor-contact').value = vendor.contact;
    document.getElementById('vendor-deliverables').value = vendor.deliverables || '';
    document.getElementById('vendor-modal-title').textContent = 'Edit Vendor Agreement';

    const modal = document.getElementById('vendor-modal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  saveVendorForm(e) {
    e.preventDefault();
    const editId = document.getElementById('vendor-edit-id').value;
    const name = document.getElementById('vendor-name').value.trim();
    const category = document.getElementById('vendor-category').value;
    const status = document.getElementById('vendor-status').value;
    const quote = parseFloat(document.getElementById('vendor-quote').value) || 0;
    const negotiated = parseFloat(document.getElementById('vendor-negotiated').value) || quote;
    const contact = document.getElementById('vendor-contact').value.trim();
    const deliverables = document.getElementById('vendor-deliverables').value.trim();
    const syncBudget = document.getElementById('vendor-sync-budget').checked;

    if (!name) {
      alert('Please enter a vendor name');
      return;
    }

    if (editId) {
      window.eventState.updateVendor(editId, { name, category, status, quote, negotiated, contact, deliverables });
      if (window.toast) window.toast.show('Vendor record updated!', 'success');
    } else {
      window.eventState.addVendor({ name, category, status, quote, negotiated, contact, deliverables });
      if (syncBudget) {
        // Automatically reflect in budget items
        window.eventState.addBudgetItem({
          category,
          name: `${name} (${category})`,
          estimated: quote,
          actual: negotiated,
          status: status === 'Deposit Paid' ? 'deposit' : status === 'Contract Signed' ? 'pending' : 'pending',
          notes: `Vendor contract: ${deliverables}`
        });
      }
      if (window.toast) window.toast.show('Vendor onboarded & synced with budget!', 'success');
    }

    this.closeModal();
  }

  deleteVendor(id) {
    if (confirm('Delete this vendor from your roster?')) {
      window.eventState.deleteVendor(id);
      if (window.toast) window.toast.show('Vendor removed', 'gold');
    }
  }

  closeModal() {
    const modal = document.getElementById('vendor-modal');
    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }
}

// Global instance
window.vendorManager = new VendorManager();
