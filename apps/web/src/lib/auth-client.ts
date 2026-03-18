import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "http://localhost:4005";

export const authClient = createAuthClient({
    baseURL: AUTH_URL,
    plugins: [
        jwtClient()
    ]
});

export const { 
    signIn, 
    signUp, 
    useSession, 
    signOut, 
    forgetPassword, 
    resetPassword 
} = authClient;
