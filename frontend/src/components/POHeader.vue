<template>
  <div class="card-panel">
    <p class="form-section-title">PO Header</p>
    
    <div class="form-row">
      <div class="form-group">
        <label>Vendor</label>
        <input
          :value="vendor"
          @input="emit('update:vendor', $event.target.value)"
          placeholder="Type..."
          type="text"
          required
        />
      </div>
      
      <div class="form-group">
        <label>Needed By date</label>
        <div class="date-input-wrapper">
          <input
            :value="neededByDate"
            @input="emit('update:neededByDate', $event.target.value)"
            type="date"
          />
          <svg class="calendar-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/>
            <path d="M7 10h2v2H7zm3 0h2v2h-2zm3 0h2v2h-2zm3 0h2v2h-2zM7 15h2v2H7zm3 0h2v2h-2zm3 0h2v2h-2z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      
      <div class="form-group">
        <label>Currency</label>
        <select
          :value="currency"
          @input="emit('update:currency', $event.target.value)"
        >
          <option value="IDR">IDR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="SGD">SGD</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Payment Terms</label>
        <input
          :value="paymentTerms"
          @input="emit('update:paymentTerms', $event.target.value)"
          placeholder="Type..."
          type="text"
        />
      </div>
    </div>
    
    <div class="form-group full">
      <label>Notes</label>
      <textarea
        :value="notes"
        @input="emit('update:notes', $event.target.value)"
        placeholder="Type..."
        rows="3"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
defineProps({
  vendor: {
    type: String,
    default: ''
  },
  neededByDate: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'IDR'
  },
  paymentTerms: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'update:vendor',
  'update:neededByDate',
  'update:currency',
  'update:paymentTerms',
  'update:notes'
]);
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: capitalize;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-input);
  font-size: 13px;
  font-family: 'Open Sans', sans-serif;
  background: var(--white);
  color: var(--text);
  min-height: 45px;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 64, 129, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23222' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input-wrapper input {
  flex: 1;
}

.calendar-icon {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  pointer-events: none;
  color: var(--primary);
}

.form-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 24px;
}
</style>
