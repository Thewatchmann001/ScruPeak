import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:4005", // The URL of your auth server
});

export const { 
    signIn, 
    signUp, 
    useSession, 
    signOut, 
    forgetPassword, 
    resetPassword 
} = authClient;
