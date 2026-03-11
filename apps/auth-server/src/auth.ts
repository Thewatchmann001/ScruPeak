import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export const auth = betterAuth({
    database: new Database("auth.db"),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4005",
    emailAndPassword: {  
        enabled: true,
        requireEmailVerification: false,
        async sendResetPassword(user, url) {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"ScruPeak Support" <noreply@scrupeak.com>',
                to: user.email,
                subject: "Reset your password",
                html: `<p>Click the link below to reset your password:</p><a href="${url}">${url}</a>`
            });
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user"
            }
        }
    },
    advanced: {
        defaultCookieAttributes: {
            sameSite: "lax", 
            secure: false // Allow cookies on http://localhost
        }
    },
    trustedOrigins: ["http://localhost:3000", "http://localhost:5173", "http://localhost:3004", "http://127.0.0.1:3000"]
});
