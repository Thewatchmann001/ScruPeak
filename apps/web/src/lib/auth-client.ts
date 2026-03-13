import { createAuthClient } from "better-auth/react";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4005";

export const authClient = createAuthClient({
    baseURL: AUTH_URL,
});

export const { 
    signIn, 
    signUp, 
    useSession, 
    signOut, 
    forgetPassword, 
    resetPassword 
} = authClient;
