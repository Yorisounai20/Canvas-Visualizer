/**
 * Easing function metadata for UI components
 * Provides categorized list of easing functions with descriptions
 */

import { EasingFunction } from '../types';

export interface EasingOption {
  value: EasingFunction;
  label: string;
  description: string;
  category: string;
}

/**
 * Complete list of easing functions organized by category
 */
export const EASING_FUNCTIONS: EasingOption[] = [
  // Linear
  { value: 'linear', label: 'Linear', description: 'No easing, constant speed', category: 'Basic' },
  
  // Legacy cubic (backwards compatible)
  { value: 'easeIn', label: 'Ease In (Cubic)', description: 'Slow start, fast end', category: 'Legacy' },
  { value: 'easeOut', label: 'Ease Out (Cubic)', description: 'Fast start, slow end', category: 'Legacy' },
  { value: 'easeInOut', label: 'Ease In-Out (Cubic)', description: 'Slow start and end', category: 'Legacy' },
  
  // Sine - smooth and gentle
  { value: 'sineIn', label: 'Sine In', description: 'Gentle acceleration', category: 'Sine' },
  { value: 'sineOut', label: 'Sine Out', description: 'Gentle deceleration', category: 'Sine' },
  { value: 'sineInOut', label: 'Sine In-Out', description: 'Smooth sine curve', category: 'Sine' },
  
  // Quadratic - subtle acceleration
  { value: 'quadIn', label: 'Quad In', description: 'Subtle acceleration', category: 'Quadratic' },
  { value: 'quadOut', label: 'Quad Out', description: 'Subtle deceleration', category: 'Quadratic' },
  { value: 'quadInOut', label: 'Quad In-Out', description: 'Subtle S-curve', category: 'Quadratic' },
  
  // Cubic - moderate acceleration
  { value: 'cubicIn', label: 'Cubic In', description: 'Moderate acceleration', category: 'Cubic' },
  { value: 'cubicOut', label: 'Cubic Out', description: 'Moderate deceleration', category: 'Cubic' },
  { value: 'cubicInOut', label: 'Cubic In-Out', description: 'Moderate S-curve', category: 'Cubic' },
  
  // Quartic - strong acceleration
  { value: 'quartIn', label: 'Quart In', description: 'Strong acceleration', category: 'Quartic' },
  { value: 'quartOut', label: 'Quart Out', description: 'Strong deceleration', category: 'Quartic' },
  { value: 'quartInOut', label: 'Quart In-Out', description: 'Strong S-curve', category: 'Quartic' },
  
  // Quintic - very strong acceleration
  { value: 'quintIn', label: 'Quint In', description: 'Very strong acceleration', category: 'Quintic' },
  { value: 'quintOut', label: 'Quint Out', description: 'Very strong deceleration', category: 'Quintic' },
  { value: 'quintInOut', label: 'Quint In-Out', description: 'Very strong S-curve', category: 'Quintic' },
  
  // Exponential - dramatic acceleration
  { value: 'expoIn', label: 'Expo In', description: 'Dramatic acceleration', category: 'Exponential' },
  { value: 'expoOut', label: 'Expo Out', description: 'Dramatic deceleration', category: 'Exponential' },
  { value: 'expoInOut', label: 'Expo In-Out', description: 'Dramatic S-curve', category: 'Exponential' },
  
  // Circular - smooth circular motion
  { value: 'circIn', label: 'Circ In', description: 'Circular acceleration', category: 'Circular' },
  { value: 'circOut', label: 'Circ Out', description: 'Circular deceleration', category: 'Circular' },
  { value: 'circInOut', label: 'Circ In-Out', description: 'Circular S-curve', category: 'Circular' },
  
  // Back - overshoot and return
  { value: 'backIn', label: 'Back In', description: 'Pull back then accelerate', category: 'Back' },
  { value: 'backOut', label: 'Back Out', description: 'Overshoot then settle', category: 'Back' },
  { value: 'backInOut', label: 'Back In-Out', description: 'Pull back and overshoot', category: 'Back' },
  
  // Elastic - spring-like oscillation
  { value: 'elasticIn', label: 'Elastic In', description: 'Elastic wind-up', category: 'Elastic' },
  { value: 'elasticOut', label: 'Elastic Out', description: 'Elastic overshoot', category: 'Elastic' },
  { value: 'elasticInOut', label: 'Elastic In-Out', description: 'Elastic both ends', category: 'Elastic' },
  
  // Bounce - bouncing ball effect
  { value: 'bounceIn', label: 'Bounce In', description: 'Bouncing start', category: 'Bounce' },
  { value: 'bounceOut', label: 'Bounce Out', description: 'Bouncing end', category: 'Bounce' },
  { value: 'bounceInOut', label: 'Bounce In-Out', description: 'Bounce both ends', category: 'Bounce' },
];

/**
 * Get easing functions grouped by category
 */
export const EASING_BY_CATEGORY = EASING_FUNCTIONS.reduce((acc, option) => {
  if (!acc[option.category]) {
    acc[option.category] = [];
  }
  acc[option.category].push(option);
  return acc;
}, {} as Record<string, EasingOption[]>);

/**
 * Get easing option by value
 */
export function getEasingOption(value: EasingFunction): EasingOption | undefined {
  return EASING_FUNCTIONS.find(option => option.value === value);
}

/**
 * Category order for UI display
 */
export const EASING_CATEGORY_ORDER = [
  'Basic',
  'Legacy',
  'Sine',
  'Quadratic',
  'Cubic',
  'Quartic',
  'Quintic',
  'Exponential',
  'Circular',
  'Back',
  'Elastic',
  'Bounce',
];
