// Taint sensitive data to prevent accidental exposure to client
export function taintUserData(user: Record<string, unknown>) {
  if (typeof user === "object" && user !== null) {
    // Remove sensitive fields before sending to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }
  return user;
}

// Taint database connection strings and sensitive config
export function taintConfig() {
  // Remove sensitive environment variables from client exposure
  const safeConfig = {
    NODE_ENV: process.env.NODE_ENV,
    // Add other safe config values as needed
  };
  return safeConfig;
}
