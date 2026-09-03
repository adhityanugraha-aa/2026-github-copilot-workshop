import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PurchaseOrderListPage from '../../pages/PurchaseOrderListPage.vue';
import * as apiModule from '../../api.js';

// Mock API responses
const mockPurchaseOrders = {
  items: [
    {
      id: 'po-1',
      po_number: 'PO-2026-0001',
      vendor_name: 'PT Supplier A',
      status: 'DRAFT',
      created_at: '2026-09-03T00:00:00Z',
    },
    {
      id: 'po-2',
      po_number: 'PO-2026-0002',
      vendor_name: 'PT Supplier B',
      status: 'SUBMITTED',
      created_at: '2026-09-02T00:00:00Z',
    },
  ],
};

describe('PurchaseOrderListPage.vue', () => {
  let router;
  let wrapper;

  beforeEach(() => {
    // Mock the API
    vi.spyOn(apiModule, 'api', 'get').mockReturnValue({
      listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
    });

    // Create a minimal router for RouterLink components
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/purchase-orders/new', component: { template: '<div>Create</div>' } },
        { path: '/purchase-orders/:id', component: { template: '<div>Detail</div>' } },
      ],
    });
  });

  /**
   * Test: Page renders with correct title and description
   */
  test('renders page header with title and description', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    expect(wrapper.text()).toContain('Purchase Orders');
    expect(wrapper.text()).toContain('View and manage all purchase orders');
  });

  /**
   * Test: Shows "Create PO" button in header
   */
  test('renders "New PO" button in header', () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    const newButton = wrapper.text();
    expect(newButton).toContain('+ New PO');
  });

  /**
   * Test: Shows PO records after API call completes
   */
  test('displays purchase orders after API call completes', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    // Wait for API call to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();
    
    expect(wrapper.vm.purchaseOrders.length).toBe(2);
  });

  /**
   * Test: Renders table with PO records after loading
   */
  test('renders table with purchase order data', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    // Wait for API call to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const table = wrapper.find('table');
    expect(table.exists()).toBe(true);

    // Check table headers
    expect(wrapper.text()).toContain('PO Number');
    expect(wrapper.text()).toContain('Vendor');
    expect(wrapper.text()).toContain('Status');
    expect(wrapper.text()).toContain('Created');
  });

  /**
   * Test: Shows PO data in table rows
   */
  test('displays PO records in table rows', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(wrapper.text()).toContain('PT Supplier A');
    expect(wrapper.text()).toContain('DRAFT');
  });

  /**
   * Test: Shows status badge with correct styling
   */
  test('renders status badge with correct CSS class', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    const statusBadge = wrapper.find('.status-badge');
    expect(statusBadge.exists()).toBe(true);
    expect(statusBadge.classes()).toContain('draft');
  });

  /**
   * Test: Shows empty state message when no POs exist
   */
  test('displays empty state message when no records', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    // Manually override the component state to show empty state
    wrapper.vm.purchaseOrders = [];
    wrapper.vm.isLoading = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No purchase orders yet');
  });

  /**
   * Test: Formats dates correctly
   */
  test('formats date correctly in table', async () => {
    wrapper = mount(PurchaseOrderListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
        mocks: {
          $api: {
            listPurchaseOrders: vi.fn().mockResolvedValue(mockPurchaseOrders),
          },
        },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    await wrapper.vm.$nextTick();

    // Check that date is formatted (not ISO string)
    const tableText = wrapper.text();
    expect(tableText).not.toContain('T00:00:00'); // Not ISO format
    expect(tableText).toMatch(/[A-Za-z]+ \d+, \d{4}/); // Month Day, Year format
  });
});
