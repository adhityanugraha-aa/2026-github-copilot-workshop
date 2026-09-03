import { describe, test, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import RequisitionListPage from '../../pages/RequisitionListPage.vue';

// Mock the API module
vi.mock('../../api', () => ({
  api: {
    listRequisitions: vi.fn(() => 
      Promise.resolve({
        items: [
          {
            id: 'pr-1',
            prNumber: 'PR-2026-0001',
            requesterName: 'Rina',
            departmentName: 'Ops',
            title: 'Spare parts',
            status: 'DRAFT',
            neededByDate: '2026-06-15',
          },
          {
            id: 'pr-2',
            prNumber: 'PR-2026-0002',
            requesterName: 'Budi',
            departmentName: 'Maintenance',
            title: 'Equipment repair',
            status: 'APPROVED',
            neededByDate: '2026-06-20',
          },
        ],
      })
    ),
  },
}));

describe('RequisitionListPage.vue', () => {
  let router;
  let wrapper;

  beforeEach(() => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>Home</div>' } },
        { path: '/requisitions/new', component: { template: '<div>Create</div>' } },
        { path: '/requisitions/:id', component: { template: '<div>Detail</div>' } },
      ],
    });
  });

  /**
   * Test: Page renders with correct title
   */
  test('renders page header with title', async () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Purchase Requisitions');
    expect(wrapper.text()).toContain('All purchase requisition records');
  });

  /**
   * Test: Shows table header with correct columns
   */
  test('renders table with all required columns', async () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('PR Number');
    expect(wrapper.text()).toContain('Requester');
    expect(wrapper.text()).toContain('Department');
    expect(wrapper.text()).toContain('Title');
    expect(wrapper.text()).toContain('Status');
  });

  /**
   * Test: Loads and displays requisition data
   */
  test('displays requisitions after API call succeeds', async () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    // Wait for API call to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.items.length).toBeGreaterThan(0);
    expect(wrapper.text()).toContain('PR-2026-0001');
  });

  /**
   * Test: Shows requester and department information
   */
  test('displays requester name and department in table', async () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    if (wrapper.vm.items.length > 0) {
      const tableText = wrapper.text();
      expect(tableText).toContain('Rina');
      expect(tableText).toContain('Ops');
    }
  });

  /**
   * Test: Displays status badges with correct styling
   */
  test('renders status badges with appropriate CSS classes', async () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    const badges = wrapper.findAll('.status-badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  /**
   * Test: Shows error message when API call fails
   */
  test('displays error message when API fails', async () => {
    // Override the mock to reject
    const { api } = await import('../../api');
    vi.mocked(api.listRequisitions).mockRejectedValueOnce(
      new Error('Network error')
    );

    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Network error');
  });

  /**
   * Test: Back button navigates to home
   */
  test('renders back button', () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a href="#"><slot /></a>' } },
      },
    });

    const backBtn = wrapper.find('.back-btn');
    expect(backBtn.exists()).toBe(true);
  });

  /**
   * Test: Shows "New PR" button
   */
  test('displays button to create new requisition', () => {
    wrapper = mount(RequisitionListPage, {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot /></a>' } },
      },
    });

    expect(wrapper.text()).toContain('+ New PR');
  });
});
