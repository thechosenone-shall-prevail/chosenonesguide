// Operational Transformation Engine for Conflict-Free Editing

import type { Range, TextChange } from "@/lib/rooms/types";

export type Operation = {
  type: "insert" | "delete" | "retain";
  position: number;
  text?: string;
  length?: number;
};

export class OTEngine {
  /**
   * Transform two concurrent operations
   */
  transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // If both are inserts at the same position
    if (op1.type === "insert" && op2.type === "insert") {
      if (op1.position < op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.text?.length || 0) },
        ];
      }
      if (op1.position > op2.position) {
        return [
          { ...op1, position: op1.position + (op2.text?.length || 0) },
          op2,
        ];
      }
      // Same position - use tie-breaker (e.g., user ID)
      return [
        op1,
        { ...op2, position: op2.position + (op1.text?.length || 0) },
      ];
    }

    // If both are deletes
    if (op1.type === "delete" && op2.type === "delete") {
      if (op1.position < op2.position) {
        return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
      }
      if (op1.position > op2.position) {
        return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
      }
      // Overlapping deletes - merge them
      const maxLength = Math.max(op1.length || 0, op2.length || 0);
      return [
        { ...op1, length: maxLength },
        { ...op2, length: 0 },
      ];
    }

    // Insert vs Delete
    if (op1.type === "insert" && op2.type === "delete") {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.text?.length || 0) },
        ];
      }
      return [{ ...op1, position: op1.position - (op2.length || 0) }, op2];
    }

    if (op1.type === "delete" && op2.type === "insert") {
      if (op2.position <= op1.position) {
        return [
          { ...op1, position: op1.position + (op2.text?.length || 0) },
          op2,
        ];
      }
      return [op1, { ...op2, position: op2.position - (op1.length || 0) }];
    }

    // Default: no transformation needed
    return [op1, op2];
  }

  /**
   * Apply an operation to text
   */
  apply(text: string, operation: Operation): string {
    switch (operation.type) {
      case "insert":
        return (
          text.slice(0, operation.position) +
          (operation.text || "") +
          text.slice(operation.position)
        );

      case "delete":
        return (
          text.slice(0, operation.position) +
          text.slice(operation.position + (operation.length || 0))
        );

      case "retain":
        return text;

      default:
        return text;
    }
  }

  /**
   * Convert TextChange to Operation
   */
  textChangeToOperation(change: TextChange): Operation {
    const { range, text, rangeLength } = change;

    if (text && rangeLength === 0) {
      // Insert
      return {
        type: "insert",
        position: this.rangeToPosition(range),
        text,
      };
    }
    if (!text && rangeLength > 0) {
      // Delete
      return {
        type: "delete",
        position: this.rangeToPosition(range),
        length: rangeLength,
      };
    }
    // Replace (delete + insert)
    return {
      type: "insert",
      position: this.rangeToPosition(range),
      text,
    };
  }

  /**
   * Convert Range to position (simplified)
   */
  private rangeToPosition(range: Range): number {
    // This is a simplified version
    // In a real implementation, you'd need to account for line breaks
    return range.startLine * 1000 + range.startColumn;
  }

  /**
   * Compose multiple operations
   */
  compose(ops: Operation[]): Operation[] {
    if (ops.length === 0) {
      return [];
    }
    if (ops.length === 1) {
      return ops;
    }

    const result: Operation[] = [];
    let current = ops[0];

    for (let i = 1; i < ops.length; i++) {
      const next = ops[i];

      // Try to merge consecutive operations
      if (this.canMerge(current, next)) {
        current = this.merge(current, next);
      } else {
        result.push(current);
        current = next;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * Check if two operations can be merged
   */
  private canMerge(op1: Operation, op2: Operation): boolean {
    if (op1.type !== op2.type) {
      return false;
    }

    if (op1.type === "insert" && op2.type === "insert") {
      return op1.position + (op1.text?.length || 0) === op2.position;
    }

    if (op1.type === "delete" && op2.type === "delete") {
      return op1.position === op2.position;
    }

    return false;
  }

  /**
   * Merge two operations
   */
  private merge(op1: Operation, op2: Operation): Operation {
    if (op1.type === "insert" && op2.type === "insert") {
      return {
        type: "insert",
        position: op1.position,
        text: (op1.text || "") + (op2.text || ""),
      };
    }

    if (op1.type === "delete" && op2.type === "delete") {
      return {
        type: "delete",
        position: op1.position,
        length: (op1.length || 0) + (op2.length || 0),
      };
    }

    return op1;
  }

  /**
   * Invert an operation (for undo)
   */
  invert(operation: Operation, originalText: string): Operation {
    switch (operation.type) {
      case "insert":
        return {
          type: "delete",
          position: operation.position,
          length: operation.text?.length || 0,
        };

      case "delete":
        return {
          type: "insert",
          position: operation.position,
          text: originalText.slice(
            operation.position,
            operation.position + (operation.length || 0)
          ),
        };

      default:
        return operation;
    }
  }
}

// Singleton instance
let otEngineInstance: OTEngine | null = null;

export function getOTEngine(): OTEngine {
  if (!otEngineInstance) {
    otEngineInstance = new OTEngine();
  }
  return otEngineInstance;
}
