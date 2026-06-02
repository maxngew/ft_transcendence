export const authCredentialPolicy = {
  activeSessionsPerUser: 1,
  accountLinking: {
    enabled: true,
    requireLocalEmailVerified: true,
  },
  emailAndPassword: {
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignIn: true,
    sendOnSignUp: true,
  },
} as const;
