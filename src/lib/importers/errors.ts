/**
 * errors.ts — typed error class for the fill-aggregation pipeline.
 *
 * Thrown by groupFills() whenever a guard condition is violated so that callers
 * can surface structured information about what went wrong without having to
 * parse an error message string.
 */

/**
 * Structured error thrown by the fill-aggregation pipeline.
 *
 * @property broker       - Name of the broker being imported (pass-through from
 *                          the caller; groupFills itself is broker-agnostic).
 * @property groupKey     - The grouping key value that triggered the error, or
 *                          "__nokeyFill" for the synthetic key assigned to fills
 *                          that had a falsy original key.
 * @property affectedRows - Zero-based CSV row indices that belong to the
 *                          offending group.
 * @property message      - Human-readable description of the guard that fired.
 */
export class ImportError extends Error {
  readonly broker: string;
  readonly groupKey: string;
  readonly affectedRows: number[];

  constructor(params: {
    broker: string;
    groupKey: string;
    affectedRows: number[];
    message: string;
  }) {
    super(params.message);
    this.name = 'ImportError';
    this.broker = params.broker;
    this.groupKey = params.groupKey;
    this.affectedRows = params.affectedRows;

    // Restore prototype chain when transpiling to ES5
    Object.setPrototypeOf(this, ImportError.prototype);
  }
}
