<template>
  <section class="content">
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/" class="back-btn" title="Back to home">&#8592;</RouterLink>
        <div>
          <h2>Purchase Orders</h2>
          <p class="muted">View and manage all purchase orders</p>
        </div>
      </div>
      <RouterLink to="/purchase-orders/new" class="btn btn-primary">+ New PO</RouterLink>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-if="isLoading" class="card-panel">
      <p>Loading purchase orders...</p>
    </div>

    <div v-else-if="purchaseOrders.length === 0" class="card-panel">
      <p class="muted">No purchase orders yet. <RouterLink to="/purchase-orders/new">Create one</RouterLink></p>
    </div>

    <div v-else class="card-panel">
      <table>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="po in purchaseOrders" :key="po.id">
            <td><strong>{{ po.poNumber }}</strong></td>
            <td>{{ po.vendorName }}</td>
            <td>
              <span
                :class="['status-badge', po.status.toLowerCase()]"
              >
                {{ po.status }}
              </span>
            </td>
            <td>{{ formatDate(po.createdAt) }}</td>
            <td>
              <RouterLink
                :to="`/purchase-orders/${po.id}`"
                class="btn btn-outline"
                style="padding: 6px 12px; font-size: 12px"
              >
                View
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api.js';

const purchaseOrders = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

/**
 * Format date string to readable format
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Load all purchase orders from API
 */
async function loadPurchaseOrders() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const result = await api.listPurchaseOrders();
    purchaseOrders.value = (result.items || []).map((po) => ({
      id: po.id,
      poNumber: po.poNumber ?? po.po_number,
      vendorName: po.vendorName ?? po.vendor_name,
      status: po.status,
      createdAt: po.createdAt ?? po.created_at,
    }));
  } catch (err) {
    errorMessage.value = `Failed to load purchase orders: ${err.message}`;
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

// Load purchase orders on mount
onMounted(() => {
  loadPurchaseOrders();
});
</script>
