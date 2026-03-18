import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

const AUTH_URL = import.meta.env.VITE_AUTH_URL || "https://auth-server-prod-ey3v3gkpaq-uc.a.run.app";
```

And `apps/web/.env.production`:
```
VITE_AUTH_URL=https://auth-server-prod-ey3v3gkpaq-uc.a.run.app

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
