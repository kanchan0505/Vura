import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { validateResetPassword } from "@/lib/validation/auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        try {
            var { token, password } = validateResetPassword(body) as {
                token: string;
                password: string;
            };
        } catch (err) {
            if (err instanceof ZodError) {
                return NextResponse.json({ message: "Invalid input", errors: err.errors }, { status: 400 });
            }
            throw err;
        }

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: {
                    gt: new Date(), // Extracted token must still be valid
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid or expired password reset token" },
                { status: 400 }
            );
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        return NextResponse.json(
            { message: "Password reset successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
