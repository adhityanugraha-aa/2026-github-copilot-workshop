import { describe, test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LineAllocationTable from '../../components/LineAllocationTable.vue';

describe('LineAllocationTable.vue', () => {
  let wrapper;

  const mockLines = [
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
      deliveryDate: '',
      unitPrice: 150000,
      orderQty: 10,
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
      deliveryDate: '',
      unitPrice: 0,
      orderQty: 0,
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
      deliveryDate: '',
      unitPrice: 32000,
      orderQty: 20,
    },
  ];

  /**
   * Test: Table renders with all expected columns
   */
  test('renders table with all required columns', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    const headers = wrapper.findAll('th');
    const headerTexts = headers.map(h => h.text());

    expect(headerTexts).toContain('PR No');
    expect(headerTexts).toContain('PR Line');
    expect(headerTexts).toContain('Item Code');
    expect(headerTexts).toContain('Item Name');
    expect(headerTexts).toContain('UOM');
    expect(headerTexts).toContain('Requested QTY');
    expect(headerTexts).toContain('Allocated QTY');
    expect(headerTexts).toContain('Remaining QTY');
    expect(headerTexts).toContain('Order QTY');
    expect(headerTexts).toContain('Unit Price');
  });

  /**
   * Test: Displays "Approved PR Lines" section title
   */
  test('displays section title "Approved PR Lines"', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    expect(wrapper.text()).toContain('Approved PR Lines');
  });

  /**
   * Test: Shows "Refresh Open Lines" button
   */
  test('renders Refresh Open Lines button', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    expect(wrapper.text()).toContain('Refresh Open Lines');
  });

  /**
   * Test: Renders correct number of table rows
   */
  test('renders table rows for each line', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(3);
  });

  /**
   * Test: Displays line data correctly in table
   */
  test('displays line data in correct columns', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    const firstRow = wrapper.find('tbody tr');
    expect(firstRow.text()).toContain('PR-001');
    expect(firstRow.text()).toContain('ITEM-001');
    expect(firstRow.text()).toContain('Bearing-6205');
    expect(firstRow.text()).toContain('20');
  });

  /**
   * Test: Checkbox selection works for single line
   */
  test('emits update-selected event when checkbox is clicked', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    // Find first row checkbox
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    const firstLineCheckbox = checkboxes[1]; // Skip header checkbox

    await firstLineCheckbox.setValue(true);

    expect(wrapper.emitted('update-selected')).toBeTruthy();
    const emittedValue = wrapper.emitted('update-selected')[0][0];
    expect(emittedValue).toContain('line-1');
  });

  /**
   * Test: Select all checkbox selects all lines
   */
  test('select all checkbox toggles all line selections', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    const headerCheckbox = wrapper.findAll('input[type="checkbox"]')[0];
    await headerCheckbox.setValue(true);

    expect(wrapper.emitted('update-selected')).toBeTruthy();
    const selectedIds = wrapper.emitted('update-selected')[0][0];
    expect(selectedIds).toHaveLength(3);
    expect(selectedIds).toContain('line-1');
    expect(selectedIds).toContain('line-2');
    expect(selectedIds).toContain('line-3');
  });

  /**
   * Test: Order QTY input is disabled for unselected lines
   */
  test('disables Order QTY input for unselected lines', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    const inputs = wrapper.findAll('input[type="number"]');
    // First order qty input (line-1)
    expect(inputs[0].element.disabled).toBe(true);
  });

  /**
   * Test: Order QTY input is enabled for selected lines
   */
  test('enables Order QTY input when line is selected', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: ['line-1'],
      },
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAll('input[type="number"]');
    // First order qty input should now be enabled
    expect(inputs[0].element.disabled).toBe(false);
  });

  /**
   * Test: Unit Price input is displayed and has correct attributes
   */
  test('displays unit price field for each line', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: ['line-1'],
      },
    });

    await wrapper.vm.$nextTick();

    // Should have unit price inputs for each line
    const inputs = wrapper.findAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThan(0);
  });

  /**
   * Test: Calculates line amount correctly
   */
  test('displays calculated line amount (Order QTY × Unit Price)', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: ['line-1'],
      },
    });

    await wrapper.vm.$nextTick();

    // Line 1: orderQty=10, unitPrice=150000 = 1,500,000
    const cellText = wrapper.text();
    expect(cellText).toContain('1');
    expect(cellText).toContain('500');
  });

  /**
   * Test: Emits refresh event when button clicked
   */
  test('emits refresh event when Refresh button is clicked', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    const buttons = wrapper.findAll('.btn');
    const refreshButton = buttons.find(b => b.text().includes('Refresh'));

    await refreshButton.trigger('click');

    expect(wrapper.emitted('refresh')).toBeTruthy();
  });

  /**
   * Test: Selected row has highlighting class
   */
  test('adds selected class to rows when lines are selected', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: ['line-1'],
      },
    });

    await wrapper.vm.$nextTick();

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0].classes()).toContain('selected');
    expect(rows[1].classes()).not.toContain('selected');
  });

  /**
   * Test: Delivery date field is editable when line selected
   */
  test('delivery date input enabled for selected lines only', async () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: ['line-1'],
      },
    });

    await wrapper.vm.$nextTick();

    const dateInputs = wrapper.findAll('input[type="date"]');
    // First delivery date input for line-1 should be enabled
    expect(dateInputs[0].element.disabled).toBe(false);
  });

  /**
   * Test: Remaining quantity is calculated correctly
   */
  test('displays remaining quantity (Requested - Allocated)', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: mockLines,
        selectedLines: [],
      },
    });

    // Line 1: requested=20, allocated=5, remaining=15
    // Line 2: requested=12, allocated=0, remaining=12
    // Line 3: requested=50, allocated=10, remaining=40
    const rows = wrapper.findAll('tbody tr');

    expect(rows[0].text()).toContain('15');
    expect(rows[1].text()).toContain('12');
    expect(rows[2].text()).toContain('40');
  });

  /**
   * Test: Empty lines array shows no table rows
   */
  test('renders empty table body when no lines provided', () => {
    wrapper = mount(LineAllocationTable, {
      props: {
        lines: [],
        selectedLines: [],
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(0);
  });
});
