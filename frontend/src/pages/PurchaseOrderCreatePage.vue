<template>
  <section class="content">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>Create Purchase Order</h2>
          <p class="muted">Pick approved PR lines and allocate order quantities</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-if="Object.keys(validationErrors).length > 0" class="validation-errors">
      <strong>Validation Errors:</strong>
      <ul>
        <li v-for="(msg, key) in validationErrors" :key="key" class="error-item">{{ msg }}</li>
      </ul>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- PO Header -->
      <POHeader
        v-model:vendor="form.vendor"
        v-model:neededByDate="form.neededByDate"
        v-model:currency="form.currency"
        v-model:paymentTerms="form.paymentTerms"
        v-model:notes="form.notes"
      />

      <!-- Approved PR Lines -->
      <LineAllocationTable
        :lines="allocatableLines"
        :selected-lines="form.selectedLines"
        @update-selected="updateSelectedLines"
        @update-order-qty="updateOrderQty"
        @update-unit-price="updateUnitPrice"
        @refresh="refreshOpenLines"
      />

      <!-- Summary and Action buttons -->
      <div class="card-panel summary-section">
        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">Selected Lines</span>
            <span class="summary-value">{{ form.selectedLines.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Estimated Total</span>
            <span class="summary-value">{{ formatNumber(estimatedTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="btn-group">
        <RouterLink to="/purchase-orders" class="btn btn-outline" :disabled="isSubmitting">Cancel</RouterLink>
        <button 
          class="btn btn-secondary" 
          type="button" 
          @click="saveDraft"
          :disabled="isSubmitting || isLoading"
        >
          {{ isSubmitting ? 'Saving...' : 'Save As Draft' }}
        </button>
        <button 
          class="btn btn-primary" 
          type="submit"
          :disabled="isSubmitting || isLoading"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit PO' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { api } from '../api.js';
import POHeader from '../components/POHeader.vue';
import LineAllocationTable from '../components/LineAllocationTable.vue';

const router = useRouter();
const errorMessage = ref('');
const validationErrors = ref({});
const allocatableLines = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);

const form = reactive({
  vendor: '',
  neededByDate: '',
  currency: 'IDR',
  paymentTerms: '',
  notes: '',
  selectedLines: []
});

/**
 * Calculate estimated total from selected lines
 */
const estimatedTotal = computed(() => {
  return form.selectedLines.reduce((sum, lineId) => {
    const line = allocatableLines.value.find(l => l.id === lineId);
    if (line && line.orderQty && line.unitPrice) {
      return sum + (line.orderQty * line.unitPrice);
    }
    return sum;
  }, 0);
});

/**
 * Format number as currency string
 */
function formatNumber(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Update selected lines
 */
function updateSelectedLines(selectedIds) {
  form.selectedLines = selectedIds;
}

/**
 * Update order quantity for a line
 */
function updateOrderQty(lineId, qty) {
  const line = allocatableLines.value.find(l => l.id === lineId);
  if (line) {
    line.orderQty = qty;
  }
}

/**
 * Update unit price for a line
 */
function updateUnitPrice(lineId, price) {
  const line = allocatableLines.value.find(l => l.id === lineId);
  if (line) {
    line.unitPrice = price;
  }
}

/**
 * Refresh open PR lines from API
 */
async function refreshOpenLines() {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Fetch approved requisitions and their open lines
    const requisitions = await api.listRequisitions();
    const approvedPrs = requisitions.items?.filter(r => r.status === 'APPROVED') || [];
    
    const allLines = [];
    for (const pr of approvedPrs) {
      const prDetail = await api.getRequisition(pr.id);
      const openLines = prDetail.lines || [];
      
      // Map to allocatable lines format
      openLines.forEach((line, idx) => {
        allLines.push({
          id: line.id,
          prId: pr.id,
          prNo: pr.prNumber,
          prLine: line.lineNo ?? idx + 1,
          itemCode: line.itemCode,
          itemName: line.itemName,
          uom: line.uom,
          siteCode: line.siteCode,
          requestedQty: line.qtyRequested,
          allocatedQty: line.qtyAllocated,
          remainingQty: line.qtyOpenForPo,
          deliveryAddress: '',
          deliveryDate: '',
          unitPrice: 0,
          orderQty: 0,
        });
      });
    }
    
    allocatableLines.value = allLines;
  } catch (error) {
    errorMessage.value = `Failed to load PR lines: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

/**
 * Validate form before submission
 */
function validateForm() {
  validationErrors.value = {};
  
  if (!form.vendor?.trim()) {
    validationErrors.value.vendor = 'Vendor name is required';
  }
  
  if (form.selectedLines.length === 0) {
    validationErrors.value.lines = 'Select at least one line to allocate';
  }
  
  // Validate each selected line
  for (const lineId of form.selectedLines) {
    const line = allocatableLines.value.find(l => l.id === lineId);
    if (!line) continue;
    
    if (!line.orderQty || line.orderQty <= 0) {
      validationErrors.value[lineId] = 'Order quantity must be greater than 0';
    } else if (line.orderQty > line.remainingQty) {
      validationErrors.value[lineId] = `Quantity ${line.orderQty} exceeds available ${line.remainingQty}`;
    }
    
    if (line.unitPrice < 0) {
      validationErrors.value[`${lineId}-price`] = 'Unit price cannot be negative';
    }
  }
  
  return Object.keys(validationErrors.value).length === 0;
}

/**
 * Build PO payload from form
 */
function buildPoPayload() {
  const poLines = form.selectedLines.map(lineId => {
    const line = allocatableLines.value.find(l => l.id === lineId);
    return {
      prLineId: line.id,
      qtyOrdered: line.orderQty,
      itemCode: line.itemCode,
      itemName: line.itemName,
      unitPrice: line.unitPrice,
      uom: line.uom,
      siteCode: line.siteCode || '',
      requiredDate: line.deliveryDate || undefined,
    };
  });
  
  return {
    vendorName: form.vendor.trim(),
    lines: poLines,
  };
}

/**
 * Handle over-allocation error and display line-level validation
 */
function handleOverAllocationError(error) {
  // Parse 422 over-allocation error to extract which line has the issue
  const message = error.message || '';
  
  // Try to identify which line from the error message
  // Backend error format: "Allocated quantity X exceeds available Y for PR line UUID"
  const lineMatch = message.match(/PR line ([a-f0-9-]+)/);
  if (lineMatch) {
    const prLineId = lineMatch[1];
    validationErrors.value[prLineId] = message;
  }
  
  errorMessage.value = 'Over-allocation error: ' + message;
}

/**
 * Save PO as draft
 */
async function saveDraft() {
  if (!validateForm()) {
    errorMessage.value = 'Please fix validation errors before saving';
    return;
  }
  
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    validationErrors.value = {};
    
    const payload = buildPoPayload();
    const result = await api.createPurchaseOrder(payload);
    
    // PO created as DRAFT, redirect to detail page
    router.push(`/purchase-orders/${result.id}`);
  } catch (error) {
    if (error.message.includes('exceeds available')) {
      handleOverAllocationError(error);
    } else {
      errorMessage.value = error.message || 'Failed to save PO';
    }
  } finally {
    isSubmitting.value = false;
  }
}

/**
 * Submit PO (create as DRAFT first, then submit)
 */
async function handleSubmit() {
  if (!validateForm()) {
    errorMessage.value = 'Please fix validation errors before submitting';
    return;
  }
  
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    validationErrors.value = {};
    
    const payload = buildPoPayload();
    const result = await api.createPurchaseOrder(payload);
    
    // PO created as DRAFT, now submit it
    const submittedPo = await api.submitPurchaseOrder(result.id);
    
    // Redirect to detail page
    router.push(`/purchase-orders/${submittedPo.id}`);
  } catch (error) {
    if (error.message.includes('exceeds available')) {
      handleOverAllocationError(error);
    } else {
      errorMessage.value = error.message || 'Failed to submit PO';
    }
  } finally {
    isSubmitting.value = false;
  }
}

// Load allocatable lines on mount
onMounted(() => {
  refreshOpenLines();
});

// Mock fallback data for development (only used if API doesn't load data)
const mockFallbackData = [
  {
    id: 'line-1',
    prNo: 'PR-001',
    prLine: 1,
    itemCode: 'ITEM-001',
    itemName: 'Bearing-6205',
    uom: 'PCS',
    requestedQty: 20,
    allocatedQty: 5,
    remainingQty: 15,
    deliveryAddress: '',
    unitPrice: 150000,
    orderQty: 10
  },
  {
    id: 'line-2',
    prNo: 'PR-001',
    prLine: 2,
    itemCode: 'ITEM-009',
    itemName: 'Grease High Temp',
    uom: 'TUBE',
    requestedQty: 12,
    allocatedQty: 0,
    remainingQty: 12,
    deliveryAddress: '',
    unitPrice: 0,
    orderQty: 0
  },
  {
    id: 'line-3',
    prNo: 'PR-004',
    prLine: 1,
    itemCode: 'ITEM-015',
    itemName: 'Bearing-6205',
    uom: 'PAIR',
    requestedQty: 50,
    allocatedQty: 10,
    remainingQty: 40,
    deliveryAddress: '',
    unitPrice: 32000,
    orderQty: 20
  }
];
</script>

<style scoped>
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

.validation-errors {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #991b1b;
}

.validation-errors strong {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.validation-errors ul {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.4;
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
</style>
