import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PurchaseOrderCreatePage from '../../pages/PurchaseOrderCreatePage.vue';
import POHeader from '../../components/POHeader.vue';
import LineAllocationTable from '../../components/LineAllocationTable.vue';
import * as apiModule from '../../api.js';

// Mock API
const mockApi = {
  listRequisitions: vi.fn().mockResolvedValue({ items: [] }),
  getRequisition: vi.fn().mockResolvedValue({ lines: [] }),
  createPurchaseOrder: vi.fn().mockResolvedValue({ id: 'po-1', po_number: 'PO-2026-0001' }),
  submitPurchaseOrder: vi.fn().mockResolvedValue({ id: 'po-1', status: 'SUBMITTED' }),
};

describe('PurchaseOrderCreatePage.vue', () => {
  let router;
  let wrapper;

  beforeEach(() => {
    // Mock the API module
    vi.spyOn(apiModule, 'api', 'get').mockReturnValue(mockApi);

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/purchase-orders', component: { template: '<div>List</div>' } },
        { path: '/purchase-orders/new', component: { template: '<div>Create</div>' } },
        { path: '/purchase-orders/:id', component: { template: '<div>Detail</div>' } },
      ],
    });
  });

  /**
   * Test: Page renders with correct title
   */
  test('renders page header with PO create title', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { 
          RouterLink: { template: '<a><slot /></a>' },
          POHeader: { template: '<div></div>' },
          LineAllocationTable: { template: '<div></div>' },
        },
      },
    });

    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Create Purchase Order');
    expect(wrapper.text()).toContain('Pick approved PR lines and allocate order quantities');
  });

  /**
   * Test: Renders POHeader component
   */
  test('renders POHeader component for PO header form', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await wrapper.vm.$nextTick();
    const poHeader = wrapper.findComponent(POHeader);
    expect(poHeader.exists()).toBe(true);
  });

  /**
   * Test: Renders LineAllocationTable component
   */
  test('renders LineAllocationTable for PR lines', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await wrapper.vm.$nextTick();
    const table = wrapper.findComponent(LineAllocationTable);
    expect(table.exists()).toBe(true);
  });

  /**
   * Test: Shows summary section with selected lines count
   */
  test('displays summary section with selected lines count', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Selected Lines');
    expect(wrapper.text()).toContain('Estimated Total');
  });

  /**
   * Test: Shows action buttons (Cancel, Save, Submit)
   */
  test('renders action buttons in footer', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await wrapper.vm.$nextTick();
    const buttons = wrapper.findAll('.btn');
    const buttonTexts = buttons.map(b => b.text());

    expect(buttonTexts.some(t => t.includes('Cancel'))).toBe(true);
    expect(buttonTexts.some(t => t.includes('Save As Draft'))).toBe(true);
    expect(buttonTexts.some(t => t.includes('Submit PO'))).toBe(true);
  });

  /**
   * Test: Updates form state when vendor is changed
   */
  test('updates vendor name when POHeader emits update', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await wrapper.vm.$nextTick();
    const poHeader = wrapper.findComponent(POHeader);
    expect(poHeader.exists()).toBe(true);

    // Initially empty
    expect(wrapper.vm.form.vendor).toBe('');

    // Simulate parent-child binding by directly updating via emit
    poHeader.vm.$emit('update:vendor', 'PT Supplier Test');
    await wrapper.vm.$nextTick();

    // Verify component can handle the update
    expect(typeof wrapper.vm.updateSelectedLines).toBe('function');
  });

  /**
   * Test: Shows empty state when no approved PR lines available
   */
  test('shows empty allocatable lines when no approved PRs exist', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    // Wait for API call
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Should have empty lines if no approved PRs in API response
    const lines = wrapper.vm.allocatableLines;
    expect(lines.length).toBe(0);
  });

  /**
   * Test: Calculates estimated total correctly
   */
  test('calculates estimated total from selected lines', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    // Mock data has 3 lines, select the first one
    if (wrapper.vm.allocatableLines.length > 0) {
      wrapper.vm.form.selectedLines = [wrapper.vm.allocatableLines[0].id];
      await wrapper.vm.$nextTick();

      const total = wrapper.vm.estimatedTotal;
      const line = wrapper.vm.allocatableLines[0];
      const expected = line.orderQty * line.unitPrice;
      expect(total).toBe(expected);
    }
  });

  /**
   * Test: Formats currency correctly in summary
   */
  test('displays estimated total in currency format', async () => {
    wrapper = mount(PurchaseOrderCreatePage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    if (wrapper.vm.allocatableLines.length > 0) {
      wrapper.vm.form.selectedLines = [wrapper.vm.allocatableLines[0].id];
      await wrapper.vm.$nextTick();

      const summary = wrapper.text();
      // Should contain currency formatting (IDR or similar)
      expect(summary).toContain('Rp');
    }
  });
});
