// Central error mapping: maps common backend error strings to codes and friendly messages.
// Keep patterns small and later you can add translations or error codes.

const MAP = [
  {
    // Cognito common responses
    pattern: /user is not confirmed/i,
    code: 'USER_NOT_CONFIRMED',
    message: 'Your email is not verified yet.',
    action: 'resend',
  },
  {
    pattern: /user already exists/i,
    code: 'USER_ALREADY_EXISTS',
    message: "An account using this email already exists. Try signing in or resend verification if you haven't confirmed.",
    action: 'signin_or_resend',
  },
  {
    pattern: /(current password|old password).*incorrect|not authorized/i,
    code: 'INVALID_OLD_PASSWORD',
    message: 'Current password is incorrect. Please check and try again.',
  },
  {
    pattern: /unable to change password at this time|unable to change password/i,
    code: 'CHANGE_FAILED',
    message: 'Unable to change your password right now. Please try again later.',
  },
  {
    pattern: /username\/client id combination not found/i,
    code: 'USERNAME_CLIENT_NOT_FOUND',
    message: "We couldn't find an account using this email.",
  },
  {
    pattern: /user does not exist/i,
    code: 'USER_NOT_FOUND',
    message: "We couldn't find an account using this email.",
  },
  {
    pattern: /invalid phone number/i,
    code: 'INVALID_PHONE',
    message: 'Invalid phone number format.',
  },
  {
    pattern: /expired/i,
    code: 'EXPIRED',
    message: 'The action expired. Please retry or request a new code.',
  },
  {
    pattern: /invalid verification code/i,
    code: 'INVALID_CODE',
    message: 'Verification code is incorrect. Please check the code and try again.',
  },
  {
    // Cognito / backend generic reset failure messages
    pattern: /(failed to reset password|verify your confirmation code)/i,
    code: 'RESET_FAILED',
    message:
      'Unable to reset your password. Please check the confirmation code and make sure the new password meets the complexity requirements.',
  },
  {
    pattern: /already confirmed/i,
    code: 'ALREADY_CONFIRMED',
    message: 'Email is already verified — proceed to sign in.',
    action: 'signin',
  },
];

export function mapError(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  for (const entry of MAP) {
    if (entry.pattern.test(s)) return { code: entry.code, message: entry.message, action: entry.action || null, raw: s };
  }
  // No known mapping — return null
  return null;
}

export default mapError;
