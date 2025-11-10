import type { Formatter, IntrospectionResult, OutputFormat } from "../types.js";

/**
 * JSON Formatter - Serializes results to JSON format
 *
 * Provides pretty-printed JSON output with configurable indentation.
 */
export class JsonFormatter implements Formatter {
  private indent: number;

  constructor(indent: number = 2) {
    this.indent = indent;
  }

  /**
   * Format the introspection result as JSON
   */
  format(result: IntrospectionResult): string {
    return JSON.stringify(result, null, this.indent);
  }

  /**
   * Get the output format type
   */
  getFormatType(): OutputFormat {
    return "json";
  }

  /**
   * Set the indentation level
   */
  setIndent(indent: number): void {
    this.indent = Math.max(0, indent);
  }

  /**
   * Get the current indentation level
   */
  getIndent(): number {
    return this.indent;
  }
}

