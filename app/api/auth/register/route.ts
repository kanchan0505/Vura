import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { validateRegister } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        try {
            var { email, password, name } = validateRegister(body) as {
                email: string;
                password: string;
                name?: string;
            };
        } catch (err) {
            if (err instanceof ZodError) {
                return NextResponse.json({ message: "Invalid input", errors: err.errors }, { status: 400 });
            }
            throw err;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to database
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        // Don't return the hashed password
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(
            { user: userWithoutPassword, message: "User created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
    }
}
