// Roles are granted per project (see the UserProject join). Admin is the one
// global role and lives as the `isAdmin` flag on User. These helpers collapse a
// user's project memberships (+ admin flag + the projects they manage) into the
// single "effective role" name the dashboard surfaces still reason about.

export enum UserRole {
  Admin = "admin",
  User = "user",
}

// The role names that can be granted to a user within a project.
export const PROJECT_ROLES = [
  "manager",
  "reviewer",
  "sap-consultant",
  "software-engineer",
] as const;

export enum ProjectRole {
  Manager = "manager",
  Reviewer = "reviewer",
  SapConsultant = "sap-consultant",
  SoftwareEngineer = "software-engineer",
}

// Inputs needed to derive a user's effective role, gathered from the new model.
export type RoleDerivation = {
  isAdmin: boolean;
  // True when the user manages at least one project (Project.managerId).
  managesProject: boolean;
  // The role names from the user's project memberships (UserProject).
  membershipRoleNames: readonly string[];
};

// Collapses the inputs to one role name, most-privileged first:
// admin > manager > reviewer > sap-consultant > software-engineer > user.
// "user" (a plain customer) is the fallback when nothing privileged applies.
export function effectiveRoleName(
  input: RoleDerivation,
): ProjectRole | UserRole {
  if (input.isAdmin) return UserRole.Admin;
  if (input.managesProject || input.membershipRoleNames.includes("manager")) {
    return ProjectRole.Manager;
  }
  if (input.membershipRoleNames.includes("reviewer"))
    return ProjectRole.Reviewer;
  if (input.membershipRoleNames.includes("sap-consultant")) {
    return ProjectRole.SapConsultant;
  }
  if (input.membershipRoleNames.includes("software-engineer")) {
    return ProjectRole.SoftwareEngineer;
  }
  return UserRole.User;
}
