import { createServerFn } from "@tanstack/react-start";

export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      apiKey: process.env.FIREBASE_API_KEY ?? "",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? "",
      projectId: process.env.FIREBASE_PROJECT_ID ?? "",
      appId: process.env.FIREBASE_APP_ID ?? "",
    };
  }
);