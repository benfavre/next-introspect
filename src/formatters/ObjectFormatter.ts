import type { Formatter, IntrospectionResult, OutputFormat } from '../types.js';

/**
 * Object Formatter - Returns the raw JavaScript object
 *
 * This formatter provides the full TypeScript-typed result object
 * without any transformation, suitable for programmatic use.
 */
export class ObjectFormatter implements Formatter {
  /**
   * Format the introspection result as a JavaScript object
   */
  format(result: IntrospectionResult): IntrospectionResult {
    return result;
  }

  /**
   * Get the output format type
   */
  getFormatType(): OutputFormat {
    return 'object';
  }
}

