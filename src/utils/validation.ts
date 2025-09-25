import type { ValidationResult } from '../types/index.js';

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    errors.push('Invalid UUID format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate score range (0-10)
 */
export function validateScore(score: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (score < 0 || score > 10) {
    errors.push('Score must be between 0 and 10');
  }

  if (score < 1) {
    warnings.push('Very low score - consider if this is intentional');
  } else if (score > 9) {
    warnings.push('Very high score - consider if this is realistic');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate weight range (0-1)
 */
export function validateWeight(weight: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (weight < 0 || weight > 1) {
    errors.push('Weight must be between 0 and 1');
  }

  if (weight < 0.1) {
    warnings.push('Very low weight - consider if this criteria is important');
  } else if (weight > 0.8) {
    warnings.push('Very high weight - consider if this criteria dominates others');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate confidence range (0-1)
 */
export function validateConfidence(confidence: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (confidence < 0 || confidence > 1) {
    errors.push('Confidence must be between 0 and 1');
  }

  if (confidence < 0.3) {
    warnings.push('Low confidence - consider gathering more information');
  } else if (confidence > 0.9) {
    warnings.push('Very high confidence - consider potential overconfidence bias');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate text length
 */
export function validateTextLength(text: string, minLength: number = 1, maxLength: number = 10000): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (text.length < minLength) {
    errors.push(`Text must be at least ${minLength} characters long`);
  }

  if (text.length > maxLength) {
    errors.push(`Text must be no more than ${maxLength} characters long`);
  }

  if (text.length < minLength * 2) {
    warnings.push('Text is quite short - consider providing more detail');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate array length
 */
export function validateArrayLength<T>(array: T[], minLength: number = 1, maxLength: number = 1000): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (array.length < minLength) {
    errors.push(`Array must have at least ${minLength} items`);
  }

  if (array.length > maxLength) {
    errors.push(`Array must have no more than ${maxLength} items`);
  }

  if (array.length === 0) {
    warnings.push('Empty array - consider if this is intentional');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (startDate >= endDate) {
    errors.push('Start date must be before end date');
  }

  const now = new Date();
  if (startDate < now) {
    warnings.push('Start date is in the past');
  }

  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    warnings.push('Date range is longer than a year');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate required fields
 */
export function validateRequiredFields(obj: Record<string, unknown>, requiredFields: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  requiredFields.forEach(field => {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate numeric range
 */
export function validateNumericRange(value: number, min: number, max: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (value < min || value > max) {
    errors.push(`Value must be between ${min} and ${max}`);
  }

  if (value === min || value === max) {
    warnings.push(`Value is at the boundary (${value})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Combine multiple validation results
 */
export function combineResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  results.forEach(result => {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}