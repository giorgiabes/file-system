/**
 * File: TenantId.ts
 *
 * Purpose: Represents unique tenant identifier (UUID)
 *
 * How it will be used:
 * TenantId.generate() - Creates new tenant (during registrations)
 * TenantId.create() - Loads existing tenant (from database/JWT)
 */

import crypto from "crypto";

class TenantId {
  private value: string;

  private constructor(id: string) {
    this.value = id;
  }

  // Creates a new random UUID
  static generate(): TenantId {
    const uuid = crypto.randomUUID();
    return new TenantId(uuid);
  }

  // Creates and validates existing UUID string
  static create(id: string): TenantId {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)
    ) {
      throw new Error("Invalid UUID");
    }
    return new TenantId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}

export default TenantId;
