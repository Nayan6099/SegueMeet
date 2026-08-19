import { OrganisationRole } from '@prisma/client';

/**
 * Core Governance Modules
 */
export const CAN_MANAGE_PEOPLE = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_MEETINGS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_AGENDA = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_MINUTES = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_ACTIONS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_DOCUMENTS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_BOARD_PACK = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_VIEW_ANALYTICS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY, OrganisationRole.BOARD_MEMBER];

/**
 * Governance & Decision Modules
 */
export const CAN_MANAGE_COMMITTEES = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_DECISIONS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_RESOLUTIONS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_VOTE = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY, OrganisationRole.BOARD_MEMBER];
export const CAN_MANAGE_WORK_PLAN = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_MANAGE_INTERESTS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];

/**
 * Administration & Security
 */
export const CAN_EDIT_BOARD_PROFILE = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_INVITE_MEMBERS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_REMOVE_MEMBERS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR, OrganisationRole.SECRETARY];
export const CAN_CHANGE_MEMBER_ROLES = [OrganisationRole.BOARD_ADMIN];
export const CAN_DELETE_BOARD = [OrganisationRole.BOARD_ADMIN];
export const CAN_VIEW_AUDIT_LOGS = [OrganisationRole.BOARD_ADMIN];
export const CAN_MANAGE_INTEGRATIONS = [OrganisationRole.BOARD_ADMIN, OrganisationRole.CHAIR];

/**
 * General Read Access
 * (Currently everyone in the org has basic read access, but we can restrict voting/managing)
 */
export const ALL_MEMBERS = [
  OrganisationRole.BOARD_ADMIN,
  OrganisationRole.CHAIR,
  OrganisationRole.SECRETARY,
  OrganisationRole.BOARD_MEMBER,
  OrganisationRole.EXECUTIVE,
  OrganisationRole.GUEST,
];
