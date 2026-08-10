import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async (
  request: Request
) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Function is working. Use POST.",
      }),
      {
        status: 405,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured."
      );
    }

    const body =
      await request.json();

    const message =
      typeof body?.message === "string"
        ? body.message
        : "Say that the Geojit Communication Studio AI connection is working.";

    const response =
      await client.responses.create({
        model: "gpt-5-mini",

        input: `
You are a connectivity test for Geojit Communication Studio.

Respond briefly and professionally.

User message:
${message}
        `,
      });

    return new Response(
      JSON.stringify({
        success: true,
        result:
          response.output_text,
      }),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "OpenAI test error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  }
};
