import { api } from "./client.js";

const buildIdentityUrl = (path) => {
  const base = import.meta.env.VITE_IDENTITY_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (!base) {
    console.error("Missing VITE_IDENTITY_API_BASE_URL or VITE_API_BASE_URL");
    throw new Error("Identity API base URL not configured");
  }
  return `${base}${path}`;
};

/**
 * Send an admin invite to a user
 * @param {string} email - Email address to invite
 * @param {string} role - Role (STUDENT, TEACHER, ADMIN)
 * @returns {Promise} Invite response
 */
export const adminInvite = async (email, role) => {
  return api.post(buildIdentityUrl("/admin/invite"), { email, role });
};

/**
 * Redeem an invite token
 * @param {string} token - Invite JWT token
 * @param {string} name - User's full name
 * @param {string} phoneNumber - User's phone number
 * @param {string} password - User's password
 * @returns {Promise} User creation response
 */
export const redeemInvite = async (token, name, phoneNumber, password) => {
  return api.post(buildIdentityUrl("/auth/redeem"), {
    token,
    name,
    phoneNumber,
    password,
  });
};
