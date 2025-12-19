import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.POLLINATION_AI,
  baseURL: "https://gen.pollinations.ai/v1",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const response = await openai.chat.completions.create({
      model: "openai",
      messages,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.log("[CHAT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
