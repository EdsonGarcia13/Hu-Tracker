import reducer, { addHU, editHU, loadFromExcel } from '../store/huSlice';

describe('huSlice', () => {
  test('addHU adds normalized HU and selects initiative', () => {
    const initial = { items: [], initiatives: [], selectedInitiative: '' };
    const action = addHU({ Title: 'Test', 'Original Estimate': 10, Initiative: 'Proj1' });
    const state = reducer(initial, action);
    expect(state.items).toHaveLength(1);
    expect(state.items[0]['Remaining Work']).toBe(10);
    expect(state.selectedInitiative).toBe('Proj1');
  });

  test('editHU updates completed work and remaining work', () => {
    const initial = {
      items: [{
        Title: 'Test',
        State: 'ToDo',
        'Assigned To': '',
        'Original Estimate': 10,
        'Completed Work': 0,
        'Remaining Work': 10,
        'Start Date': '',
        'Due Date': '',
        Initiative: 'Proj1',
        Sprint: '',
        isAdditional: false,
      }],
      initiatives: [],
      selectedInitiative: 'Proj1',
    };
    const action = editHU({ index: 0, key: 'Completed Work', value: 4 });
    const state = reducer(initial, action);
    expect(state.items[0]['Completed Work']).toBe(4);
    expect(state.items[0]['Remaining Work']).toBe(6);
  });

  test('loadFromExcel normalizes rows and sets selected initiative', () => {
    const data = [
      { Title: 'A', Initiative: 'Init1', 'Original Estimate': 5, 'Completed Work': 2 },
      { Title: 'B', Initiative: 'Init2', 'Original Estimate': 3, 'Completed Work': 1 },
    ];
    const state = reducer(undefined, loadFromExcel(data));
    expect(state.items).toHaveLength(2);
    expect(state.items[0]['Remaining Work']).toBe(3);
    expect(state.selectedInitiative).toBe('Init1');
  });
});
