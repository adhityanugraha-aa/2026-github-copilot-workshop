import { describe, test, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import POHeader from '../../components/POHeader.vue';

describe('POHeader.vue', () => {
  let wrapper;

  /**
   * Test: Component renders form with all fields
   */
  test('renders all required form fields', () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const labels = wrapper.text();
    expect(labels).toContain('Vendor');
    expect(labels).toContain('Needed By date');
    expect(labels).toContain('Currency');
    expect(labels).toContain('Payment Terms');
    expect(labels).toContain('Notes');
  });

  /**
   * Test: Displays PO Header title
   */
  test('displays "PO Header" section title', () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    expect(wrapper.text()).toContain('PO Header');
  });

  /**
   * Test: Emits update:vendor when vendor input changes
   */
  test('emits update:vendor event on vendor field change', async () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const vendorInput = wrapper.find('input[placeholder="Type..."]');
    await vendorInput.setValue('PT Supplier A');

    expect(wrapper.emitted('update:vendor')).toBeTruthy();
    expect(wrapper.emitted('update:vendor')[0]).toEqual(['PT Supplier A']);
  });

  /**
   * Test: Emits update:currency when currency select changes
   */
  test('emits update:currency event on currency select change', async () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const currencySelect = wrapper.find('select');
    await currencySelect.setValue('USD');

    expect(wrapper.emitted('update:currency')).toBeTruthy();
    expect(wrapper.emitted('update:currency')[0]).toEqual(['USD']);
  });

  /**
   * Test: Currency select has all expected options
   */
  test('currency select includes IDR, USD, EUR, SGD options', () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const options = wrapper.findAll('select option');
    const optionValues = options.map(o => o.element.value);

    expect(optionValues).toContain('IDR');
    expect(optionValues).toContain('USD');
    expect(optionValues).toContain('EUR');
    expect(optionValues).toContain('SGD');
  });

  /**
   * Test: Displays calendar icon on date field
   */
  test('renders calendar icon on date input', () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const calendarIcon = wrapper.find('.calendar-icon');
    expect(calendarIcon.exists()).toBe(true);
  });

  /**
   * Test: Emits update:neededByDate when date changes
   */
  test('emits update:neededByDate event on date field change', async () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const dateInputs = wrapper.findAll('input[type="date"]');
    const neededByDateInput = dateInputs[0];

    await neededByDateInput.setValue('2026-06-15');

    expect(wrapper.emitted('update:neededByDate')).toBeTruthy();
    expect(wrapper.emitted('update:neededByDate')[0]).toEqual(['2026-06-15']);
  });

  /**
   * Test: Renders textarea for notes
   */
  test('renders textarea field for notes', () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);
    expect(textarea.attributes('placeholder')).toBe('Type...');
  });

  /**
   * Test: Emits update:notes when notes textarea changes
   */
  test('emits update:notes event on notes field change', async () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const textarea = wrapper.find('textarea');
    await textarea.setValue('Special delivery instructions');

    expect(wrapper.emitted('update:notes')).toBeTruthy();
    expect(wrapper.emitted('update:notes')[0]).toEqual(['Special delivery instructions']);
  });

  /**
   * Test: Receives and displays prop values
   */
  test('displays prop values in form fields', async () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: 'PT Supplier A',
        neededByDate: '2026-06-15',
        currency: 'USD',
        paymentTerms: 'Net 30',
        notes: 'Test notes',
      },
    });

    const inputs = wrapper.findAll('input');
    expect(inputs[0].element.value).toBe('PT Supplier A'); // vendor
    expect(inputs[1].element.value).toBe('2026-06-15'); // date

    const select = wrapper.find('select');
    expect(select.element.value).toBe('USD');

    const textarea = wrapper.find('textarea');
    expect(textarea.element.value).toBe('Test notes');
  });

  /**
   * Test: Form fields have correct styling classes
   */
  test('applies correct CSS classes to form elements', () => {
    wrapper = mount(POHeader, {
      props: {
        vendor: '',
        neededByDate: '',
        currency: 'IDR',
        paymentTerms: '',
        notes: '',
      },
    });

    const formGroup = wrapper.find('.form-group');
    expect(formGroup.exists()).toBe(true);

    const fullWidthGroup = wrapper.find('.form-group.full');
    expect(fullWidthGroup.exists()).toBe(true); // Notes field should be full width
  });
});
