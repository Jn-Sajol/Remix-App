import { useState } from "react";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { ActionFunction, json, redirect } from "@remix-run/node";
import { hashSync } from "bcrypt"; // You can use bcrypt to hash passwords
import { prisma } from "db/db.config";
// import { PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  if (!name || !email || !password) {
    return json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    // Check for existing user
    const checkDuplicate = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name }],
      },
    });

    if (checkDuplicate) {
      return json({ error: "User already exists with this email or name" }, { status: 400 });
    }

    // Hash the password and create the user
    const hashedPassword = hashSync(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    
    return redirect("/login"); // Redirect after successful registration
  } catch (error) {
    return json({ error: "Server error. Please try again." }, { status: 500 });
  }
};

export default function Register() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-4">Register</h2>
        <Form method="post" className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full p-2 border rounded"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </Form>
        {actionData?.error && (
          <p className="text-red-500 mt-2 text-center">{actionData.error}</p>
        )}
      </div>
    </div>
  );
}
