import { 
  isValidEmail, 
  sanitizeTextInput, 
  validateHUData, 
  validateInitiativeData,
  validateBulkHUData 
} from '../utils/dataValidation';

describe('dataValidation utility', () => {
  describe('isValidEmail', () => {
    test('validates correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(isValidEmail('user123@sub.domain.org')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeTextInput', () => {
    test('removes script tags and dangerous content', () => {
      const dangerous = '<script>alert("xss")</script>Hello';
      expect(sanitizeTextInput(dangerous)).toBe('Hello');
      
      const withJavascript = 'javascript:alert("hack")';
      expect(sanitizeTextInput(withJavascript)).toBe('alert("hack")');
    });

    test('handles non-string input safely', () => {
      expect(sanitizeTextInput(null)).toBe('');
      expect(sanitizeTextInput(undefined)).toBe('');
      expect(sanitizeTextInput(123)).toBe('');
    });

    test('trims whitespace', () => {
      expect(sanitizeTextInput('  hello  ')).toBe('hello');
    });
  });

  describe('validateHUData', () => {
    const validHU = {
      Title: 'Test Story',
      State: 'ToDo',
      'Original Estimate': 10,
      'Completed Work': 0,
      'Remaining Work': 10,
      'Start Date': '2024-01-01',
      'Due Date': '2024-01-15',
      'Assigned To': 'test@example.com',
      Initiative: 'Test Project'
    };

    test('validates correct HU data', () => {
      const result = validateHUData(validHU);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('requires title', () => {
      const invalid = { ...validHU, Title: '' };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    test('validates state values', () => {
      const invalid = { ...validHU, State: 'InvalidState' };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('State must be one of: ToDo, In Progress, Done');
    });

    test('validates numeric fields', () => {
      const invalid = { ...validHU, 'Original Estimate': -5 };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Original Estimate must be a positive number');
    });

    test('enforces business rule: completed <= original', () => {
      const invalid = { ...validHU, 'Completed Work': 15, 'Original Estimate': 10 };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Completed Work cannot exceed Original Estimate');
    });

    test('validates date formats', () => {
      const invalid = { ...validHU, 'Start Date': 'invalid-date' };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start Date must be a valid date');
    });

    test('validates due date is after start date', () => {
      const invalid = { 
        ...validHU, 
        'Start Date': '2024-01-15',
        'Due Date': '2024-01-10'
      };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Due Date must be after Start Date');
    });

    test('validates assigned email format', () => {
      const invalid = { ...validHU, 'Assigned To': 'invalid-email' };
      const result = validateHUData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Assigned To must be a valid email address');
    });

    test('sanitizes text fields in output', () => {
      const huWithDangerousContent = {
        ...validHU,
        Title: '<script>alert("xss")</script>Clean Title',
        'Assigned To': 'test@example.com'
      };
      const result = validateHUData(huWithDangerousContent);
      expect(result.sanitizedData.Title).toBe('Clean Title');
    });
  });

  describe('validateInitiativeData', () => {
    const validInitiative = {
      name: 'Test Initiative',
      startDate: '2024-01-01',
      dueDate: '2024-12-31',
      sprintDays: 14
    };

    test('validates correct initiative data', () => {
      const result = validateInitiativeData(validInitiative);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('requires initiative name', () => {
      const invalid = { ...validInitiative, name: '' };
      const result = validateInitiativeData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initiative name is required');
    });

    test('validates date formats', () => {
      const invalid = { ...validInitiative, startDate: 'invalid' };
      const result = validateInitiativeData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be valid');
    });

    test('validates sprint days as positive number', () => {
      const invalid = { ...validInitiative, sprintDays: -5 };
      const result = validateInitiativeData(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sprint days must be a positive number');
    });
  });

  describe('validateBulkHUData', () => {
    const validHU = {
      Title: 'Test Story',
      State: 'ToDo',
      'Original Estimate': 10,
      'Completed Work': 0
    };

    test('validates array of valid HUs', () => {
      const huArray = [validHU, { ...validHU, Title: 'Another Story' }];
      const result = validateBulkHUData(huArray);
      expect(result.isValid).toBe(true);
      expect(result.validItems).toHaveLength(2);
      expect(result.invalidItems).toHaveLength(0);
    });

    test('handles mixed valid and invalid HUs', () => {
      const huArray = [
        validHU,
        { ...validHU, Title: '' }, // Invalid
        { ...validHU, Title: 'Valid Story' }
      ];
      const result = validateBulkHUData(huArray);
      expect(result.isValid).toBe(false);
      expect(result.validItems).toHaveLength(2);
      expect(result.invalidItems).toHaveLength(1);
      expect(result.invalidItems[0].index).toBe(1);
    });

    test('rejects non-array input', () => {
      const result = validateBulkHUData('not an array');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Input must be an array');
    });
  });
});