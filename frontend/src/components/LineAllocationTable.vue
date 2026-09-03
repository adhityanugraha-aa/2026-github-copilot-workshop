<template>
  <div class="card-panel">
    <div class="table-header">
      <p class="form-section-title" style="margin: 0">Approved PR Lines</p>
      <button type="button" class="btn btn-outline" @click="emit('refresh')">
        Refresh Open Lines
      </button>
    </div>

    <div class="table-wrapper">
      <table class="allocation-table">
        <thead>
          <tr>
            <th class="col-select">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleAllSelection"
                title="Select all"
              />
            </th>
            <th class="col-pr-no">PR No</th>
            <th class="col-pr-line">PR Line</th>
            <th class="col-item-code">Item Code</th>
            <th class="col-item-name">Item Name</th>
            <th class="col-uom">UOM</th>
            <th class="col-qty">Requested QTY</th>
            <th class="col-qty">Allocated QTY</th>
            <th class="col-qty">Remaining QTY</th>
            <th class="col-qty">Order QTY</th>
            <th class="col-delivery">Delivery Address</th>
            <th class="col-date">Delivery Date</th>
            <th class="col-price">Unit Price</th>
            <th class="col-amount">Line Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in lines" :key="line.id" :class="{ selected: isLineSelected(line.id) }">
            <!-- Select checkbox -->
            <td class="col-select">
              <input
                type="checkbox"
                :checked="isLineSelected(line.id)"
                @change="toggleLineSelection(line.id)"
              />
            </td>
            
            <!-- PR No -->
            <td class="col-pr-no">{{ line.prNo }}</td>
            
            <!-- PR Line -->
            <td class="col-pr-line">{{ line.prLine }}</td>
            
            <!-- Item Code -->
            <td class="col-item-code">{{ line.itemCode }}</td>
            
            <!-- Item Name -->
            <td class="col-item-name">{{ line.itemName }}</td>
            
            <!-- UOM -->
            <td class="col-uom">{{ line.uom }}</td>
            
            <!-- Requested QTY -->
            <td class="col-qty">{{ line.requestedQty }}</td>
            
            <!-- Allocated QTY -->
            <td class="col-qty">{{ line.allocatedQty }}</td>
            
            <!-- Remaining QTY -->
            <td class="col-qty">{{ line.remainingQty }}</td>
            
            <!-- Order QTY (editable) -->
            <td class="col-qty">
              <input
                v-model.number="line.orderQty"
                type="number"
                min="0"
                :max="line.remainingQty"
                @input="emit('update-order-qty', line.id, line.orderQty)"
                placeholder="0"
                :disabled="!isLineSelected(line.id)"
              />
            </td>
            
            <!-- Delivery Address (editable) -->
            <td class="col-delivery">
              <input
                v-model="line.deliveryAddress"
                type="text"
                placeholder="Type..."
                :disabled="!isLineSelected(line.id)"
              />
            </td>
            
            <!-- Delivery Date (editable) -->
            <td class="col-date">
              <input
                v-model="line.deliveryDate"
                type="date"
                :disabled="!isLineSelected(line.id)"
              />
            </td>
            
            <!-- Unit Price (editable) -->
            <td class="col-price">
              <input
                v-model.number="line.unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                @input="emit('update-unit-price', line.id, line.unitPrice)"
                :disabled="!isLineSelected(line.id)"
              />
            </td>
            
            <!-- Line Amount (calculated) -->
            <td class="col-amount">
              {{ formatNumber(calculateLineAmount(line)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  lines: {
    type: Array,
    default: () => [],
    required: true
  },
  selectedLines: {
    type: Array,
    default: () => [],
    required: true
  }
});

const emit = defineEmits([
  'update-selected',
  'update-order-qty',
  'update-unit-price',
  'update-delivery-address',
  'update-delivery-date',
  'refresh'
]);

/**
 * Check if all lines are selected
 */
const allSelected = computed(() => {
  return props.lines.length > 0 && props.selectedLines.length === props.lines.length;
});

/**
 * Check if a specific line is selected
 */
function isLineSelected(lineId) {
  return props.selectedLines.includes(lineId);
}

/**
 * Toggle selection for a single line
 */
function toggleLineSelection(lineId) {
  const newSelection = isLineSelected(lineId)
    ? props.selectedLines.filter(id => id !== lineId)
    : [...props.selectedLines, lineId];
  emit('update-selected', newSelection);
}

/**
 * Toggle selection for all lines
 */
function toggleAllSelection() {
  const newSelection = allSelected.value ? [] : props.lines.map(line => line.id);
  emit('update-selected', newSelection);
}

/**
 * Calculate line amount (orderQty * unitPrice)
 */
function calculateLineAmount(line) {
  if (!line.orderQty || !line.unitPrice) return 0;
  return line.orderQty * line.unitPrice;
}

/**
 * Format number as currency
 */
function formatNumber(value) {
  if (!value) return '0';
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-input);
  border: 1px solid var(--border);
}

.allocation-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--white);
}

.allocation-table thead {
  background: var(--table-header);
}

.allocation-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.allocation-table td {
  padding: 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

.allocation-table tbody tr:hover {
  background: rgba(255, 64, 129, 0.02);
}

.allocation-table tbody tr.selected {
  background: rgba(255, 64, 129, 0.04);
}

.allocation-table input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary);
}

.allocation-table input[type="text"],
.allocation-table input[type="number"],
.allocation-table input[type="date"] {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Open Sans', sans-serif;
  background: var(--white);
  color: var(--text);
}

.allocation-table input[type="text"]:focus,
.allocation-table input[type="number"]:focus,
.allocation-table input[type="date"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: inset 0 0 0 1px rgba(255, 64, 129, 0.3);
}

.allocation-table input:disabled {
  background: #f9f9f9;
  color: var(--text-muted);
  cursor: not-allowed;
}

/* Column width classes */
.col-select { width: 50px; text-align: center; }
.col-pr-no { width: 70px; }
.col-pr-line { width: 60px; }
.col-item-code { width: 90px; }
.col-item-name { min-width: 150px; }
.col-uom { width: 60px; }
.col-qty { width: 100px; text-align: right; }
.col-delivery { min-width: 120px; }
.col-date { width: 120px; }
.col-price { width: 90px; text-align: right; }
.col-amount { width: 100px; text-align: right; }
</style>
