import { boolean, index, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./core";

const id = () => uuid("id").defaultRandom().primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const roles = pgTable("roles", { id:id(), key:varchar("key",{length:60}).notNull(), name:varchar("name",{length:100}).notNull(), description:text("description"), isSystem:boolean("is_system").default(true).notNull(), createdAt:createdAt() },t=>[uniqueIndex("roles_key_uq").on(t.key)]);
export const permissions = pgTable("permissions", { id:id(), key:varchar("key",{length:100}).notNull(), description:text("description"), createdAt:createdAt() },t=>[uniqueIndex("permissions_key_uq").on(t.key)]);
export const userRoles = pgTable("user_roles", { userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(), roleId:uuid("role_id").references(()=>roles.id,{onDelete:"cascade"}).notNull(), assignedBy:uuid("assigned_by").references(()=>users.id), assignedAt:createdAt() },t=>[primaryKey({columns:[t.userId,t.roleId]}),index("user_roles_role_idx").on(t.roleId)]);
export const rolePermissions = pgTable("role_permissions", { roleId:uuid("role_id").references(()=>roles.id,{onDelete:"cascade"}).notNull(), permissionId:uuid("permission_id").references(()=>permissions.id,{onDelete:"cascade"}).notNull() },t=>[primaryKey({columns:[t.roleId,t.permissionId]})]);
export const mfaFactors = pgTable("mfa_factors", { id:id(), userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(), type:varchar("type",{length:30}).notNull(), secretCiphertext:text("secret_ciphertext").notNull(), label:varchar("label",{length:100}), verifiedAt:timestamp("verified_at",{withTimezone:true}), disabledAt:timestamp("disabled_at",{withTimezone:true}), createdAt:createdAt() },t=>[index("mfa_factors_user_idx").on(t.userId)]);
export const recoveryCodes = pgTable("recovery_codes", { id:id(), userId:uuid("user_id").references(()=>users.id,{onDelete:"cascade"}).notNull(), codeHash:text("code_hash").notNull(), usedAt:timestamp("used_at",{withTimezone:true}), createdAt:createdAt() },t=>[uniqueIndex("recovery_codes_hash_uq").on(t.codeHash),index("recovery_codes_user_idx").on(t.userId)]);
