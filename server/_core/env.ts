export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  mongoUrl: process.env.MONGODB_URI ?? "",
  initialMasterAdminEmail: (process.env.INITIAL_MASTER_ADMIN_EMAIL ?? "timileyinogunderekingmex@gmail.com").trim().toLowerCase(),
  initialMasterAdminSetupToken: process.env.INITIAL_MASTER_ADMIN_SETUP_TOKEN ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  isApiOnly: process.env.API_ONLY === "true",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
