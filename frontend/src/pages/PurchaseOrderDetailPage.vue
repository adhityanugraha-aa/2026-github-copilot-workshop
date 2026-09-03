<template>
  <section class="content">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>{{ po.poNumber || 'Purchase Order' }}</h2>
          <p class="muted">Vendor: {{ po.vendorName }}</p>
        </div>
      </div>
      <div class="page-header-right">
        <span v-if="po.status" :class="['status-badge', 'status-' + po.status.toLowerCase()]">
          {{ po.status }}
        </span>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading">Loading purchase order...</div>

    <!-- PO Details -->
    <template v-else-if="po.id">
      <!-- Header Info Card -->
      <div class="card-panel">
        <h3 class="card-title">Order Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">PO Number</span>
            <span class="value">{{ po.poNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">Status</span>
            <span :class="['status-badge', 'status-' + po.status.toLowerCase()]">
              {{ po.status }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Vendor</span>
            <span class="value">{{ po.vendorName }}</span>
          </div>
          <div class="info-item">
            <span class="label">Created</span>
            <span class="value">{{ formatDate(po.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- PO Lines Table -->
      <div class="card-panel">
        <h3 class="card-title">Order Lines</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Line</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Qty Ordered</th>
              <th>Qty Received</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, idx) in po.lines" :key="line.id">
              <td>{{ idx + 1 }}</td>
              <td>{{ line.itemCode }}</td>
              <td>{{ line.itemName }}</td>
              <td class="text-right">{{ line.qtyOrdered }}</td>
              <td class="text-right">{{ line.qtyReceived }}</td>
              <td class="text-right">{{ formatCurrency(line.unitPrice) }}</td>
              <td class="text-right">{{ formatCurrency(line.qtyOrdered * line.unitPrice) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Allocation Info -->
      <div v-if="allocations.length > 0" class="card-panel">
        <h3 class="card-title">PR Line Allocations</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>PR Number</th>
              <th>PR Line</th>
              <th>Item</th>
              <th>Allocated Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alloc in allocations" :key="alloc.id">
              <td>
                <RouterLink 
                  :to="`/requisitions/${alloc.prId}`"
                  class="link"
                >
                  {{ alloc.prNumber }}
                </RouterLink>
              </td>
              <td>{{ alloc.prLine }}</td>
              <td>{{ alloc.itemName }}</td>
              <td class="text-right">{{ alloc.allocatedQty }}</td>
              <td>
                <span class="status-badge status-active">Allocated</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="card-panel summary-section">
        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">Total Lines</span>
            <span class="summary-value">{{ po.lines?.length || 0 }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Order Total</span>
            <span class="summary-value">{{ formatCurrency(orderTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="btn-group">
        <RouterLink to="/purchase-orders" class="btn btn-outline">Back to List</RouterLink>
        <button 
          v-if="po.status === 'DRAFT'"
          class="btn btn-primary" 
          @click="submitPO"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit PO' }}
        </button>
      </div>
    </template>

    <div v-else class="empty-state">
      <p>Purchase order not found</p>
      <RouterLink to="/purchase-orders" class="btn btn-outline">Back to List</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRouter, useRoute } from 'vue-router';
import { api } from '../api.js';

const route = useRoute();
const router = useRouter();
const errorMessage = ref('');
const isLoading = ref(false);
const isSubmitting = ref(false);

const po = ref({});
const allocations = ref([]);

/**
 * Format date string
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format number as currency
 */
function formatCurrency(value) {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculate order total
 */
const orderTotal = computed(() => {
  return (po.value.lines || []).reduce((sum, line) => {
    return sum + (line.qtyOrdered * line.unitPrice);
  }, 0);
});

/**
 * Load PO detail
 */
async function loadPurchaseOrder() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    const result = await api.getPurchaseOrderById(route.params.id);
    
    po.value = {
      id: result.id,
      poNumber: result.poNumber ?? result.po_number,
      vendorName: result.vendorName ?? result.vendor_name,
      status: result.status,
      createdAt: result.createdAt ?? result.created_at,
      lines: (result.lines ?? result.po_lines ?? []).map((line) => ({
        id: line.id,
        itemCode: line.itemCode ?? line.item_code,
        itemName: line.itemName ?? line.item_name,
        qtyOrdered: line.qtyOrdered ?? line.qty_ordered,
        qtyReceived: line.qtyReceived ?? line.qty_received,
        unitPrice: line.unitPrice ?? line.unit_price,
      })),
    };
    
    // Load allocation data
    // Note: Backend would need to return allocations in the detail response
    // For now, we'll show allocation info from po_lines relationship
    allocations.value = (result.allocations || []).map(alloc => ({
      id: alloc.id,
      prId: alloc.pr_id,
      prNumber: alloc.pr_number,
      prLine: alloc.pr_line,
      itemName: alloc.item_name,
      allocatedQty: alloc.allocated_qty,
    }));
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load purchase order';
  } finally {
    isLoading.value = false;
  }
}

/**
 * Submit PO
 */
async function submitPO() {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    const result = await api.submitPurchaseOrder(route.params.id);
    
    // Update local state
    po.value.status = result.status;
    
    // Show success message (could use a toast notification)
    errorMessage.value = '';
    alert('Purchase order submitted successfully');
  } catch (error) {
    errorMessage.value = error.message || 'Failed to submit purchase order';
  } finally {
    isSubmitting.value = false;
  }
}

// Load PO on mount
onMounted(() => {
  loadPurchaseOrder();
});
</script>

<style scoped>
.page-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.info-item .value {
  font-size: 16px;
  color: var(--text);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.data-table thead {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  font-size: 14px;
}

.data-table tbody tr:hover {
  background-color: var(--bg-secondary);
}

.text-right {
  text-align: right;
}

.link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-draft {
  background-color: #f3f4f6;
  color: #6b7280;
}

.status-submitted {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.summary-section {
  margin-top: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.summary-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-state p {
  margin-bottom: 16px;
  font-size: 16px;
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-secondary);
}
</style>
