// src/utils/dataValidation.js

/**
 * Validates and sanitizes user input for HU (Historia de Usuario) data
 * This utility helps ensure data integrity and security when processing user inputs
 */

/**
 * Validates if a string is a valid email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitizes text input by removing potentially dangerous characters
 * @param {string} input - The text input to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeTextInput(input) {
  if (typeof input !== "string") return "";
  
  // Remove script tags and potential XSS content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Validates HU data structure and values
 * @param {Object} huData - The HU data object to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateHUData(huData) {
  const errors = [];
  
  // Check required fields
  if (!huData.Title || huData.Title.trim() === "") {
    errors.push("Title is required");
  }
  
  if (!huData.State || !["ToDo", "In Progress", "Done"].includes(huData.State)) {
    errors.push("State must be one of: ToDo, In Progress, Done");
  }
  
  // Validate numeric fields
  const originalEstimate = Number(huData["Original Estimate"]);
  if (isNaN(originalEstimate) || originalEstimate < 0) {
    errors.push("Original Estimate must be a positive number");
  }
  
  const completedWork = Number(huData["Completed Work"]);
  if (isNaN(completedWork) || completedWork < 0) {
    errors.push("Completed Work must be a positive number");
  }
  
  // Business rule: completed work cannot exceed original estimate
  if (completedWork > originalEstimate) {
    errors.push("Completed Work cannot exceed Original Estimate");
  }
  
  // Validate dates
  if (huData["Start Date"]) {
    const startDate = new Date(huData["Start Date"]);
    if (isNaN(startDate.getTime())) {
      errors.push("Start Date must be a valid date");
    }
  }
  
  if (huData["Due Date"]) {
    const dueDate = new Date(huData["Due Date"]);
    if (isNaN(dueDate.getTime())) {
      errors.push("Due Date must be a valid date");
    }
    
    // Check if due date is after start date
    if (huData["Start Date"]) {
      const startDate = new Date(huData["Start Date"]);
      if (dueDate <= startDate) {
        errors.push("Due Date must be after Start Date");
      }
    }
  }
  
  // Validate assigned user email if provided
  if (huData["Assigned To"] && !isValidEmail(huData["Assigned To"])) {
    errors.push("Assigned To must be a valid email address");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      ...huData,
      Title: sanitizeTextInput(huData.Title),
      "Assigned To": sanitizeTextInput(huData["Assigned To"] || ""),
      Initiative: sanitizeTextInput(huData.Initiative || ""),
    }
  };
}

/**
 * Validates initiative data structure
 * @param {Object} initiativeData - The initiative data to validate
 * @returns {Object} Validation result
 */
function validateInitiativeData(initiativeData) {
  const errors = [];
  
  if (!initiativeData.name || initiativeData.name.trim() === "") {
    errors.push("Initiative name is required");
  }
  
  if (initiativeData.startDate) {
    const startDate = new Date(initiativeData.startDate);
    if (isNaN(startDate.getTime())) {
      errors.push("Start date must be valid");
    }
  }
  
  if (initiativeData.dueDate) {
    const dueDate = new Date(initiativeData.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push("Due date must be valid");
    }
  }
  
  const sprintDays = Number(initiativeData.sprintDays);
  if (sprintDays && (isNaN(sprintDays) || sprintDays <= 0)) {
    errors.push("Sprint days must be a positive number");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      ...initiativeData,
      name: sanitizeTextInput(initiativeData.name || ""),
    }
  };
}

/**
 * Bulk validates an array of HU data
 * @param {Array} huArray - Array of HU objects to validate
 * @returns {Object} Overall validation result
 */
function validateBulkHUData(huArray) {
  if (!Array.isArray(huArray)) {
    return {
      isValid: false,
      errors: ["Input must be an array"],
      validItems: [],
      invalidItems: []
    };
  }
  
  const validItems = [];
  const invalidItems = [];
  
  huArray.forEach((hu, index) => {
    const validation = validateHUData(hu);
    if (validation.isValid) {
      validItems.push(validation.sanitizedData);
    } else {
      invalidItems.push({
        index,
        data: hu,
        errors: validation.errors
      });
    }
  });
  
  return {
    isValid: invalidItems.length === 0,
    errors: invalidItems.length > 0 ? [`${invalidItems.length} items failed validation`] : [],
    validItems,
    invalidItems
  };
}

export {
  isValidEmail,
  sanitizeTextInput,
  validateHUData,
  validateInitiativeData,
  validateBulkHUData
};