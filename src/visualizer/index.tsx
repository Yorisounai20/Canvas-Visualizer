/**
 * Visualizer Compatibility Wrapper
 * 
 * This module provides a compatibility layer during the migration.
 * Currently, it just re-exports the existing visualizer-software component.
 * 
 * Future iterations will integrate CanvasView and gradually migrate logic.
 */

export { default } from '../visualizer-software';
export { CanvasView, type ModulesRoot, type CanvasViewProps } from './CanvasView';
