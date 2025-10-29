import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateRandomPassword } from "@/lib/utils";

import { hash } from "bcryptjs";

import InviteUserEmail from "@/emails/InviteUser";
import resendHelper from "@/lib/resend";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, language } = body;

    if (!name || !email || !language) {
      return NextResponse.json(
        { error: "Name, Email, and Language is required!" },
        {
          status: 200,
        }
      );
    }

    const password = generateRandomPassword();

    //Check if user already exists in local database
    const checkexisting = await prismadb.users.findFirst({
      where: {
        email: email,
      },
    });

    //If user already exists, return error else create user
    if (checkexisting) {
      return NextResponse.json(
        { error: "User already exist, reset password instead!" },
        {
          status: 200,
        }
      );
    } else {
      try {
        const user = await prismadb.users.create({
          data: {
            name,
            username: "",
            avatar: "",
            account_name: "",
            is_account_admin: false,
            is_admin: false,
            email,
            userStatus: "ACTIVE",
            userLanguage: language,
            password: await hash(password, 12),
          },
        });

        if (!user) {
          return new NextResponse("User not created", { status: 500 });
        }

        // Return user data with password for admin to share manually
        return NextResponse.json({
          user: user,
          password: password,
          message: `User created successfully! Share these login details with ${name}:`,
          loginDetails: {
            email: email,
            password: password,
            loginUrl: process.env.NEXT_PUBLIC_APP_URL
          }
        }, { status: 200 });
      } catch (err) {
        console.log(err);
        return new NextResponse("User creation failed", { status: 500 });
      }
    }
  } catch (error) {
    console.log("[USERACTIVATE_POST]", error);
    return new NextResponse("Initial error", { status: 500 });
  }
}
