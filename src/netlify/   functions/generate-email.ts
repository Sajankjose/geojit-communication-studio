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
        error: "Method not allowed",
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
    const body =
      await request.json();

    const {
      communicationId,
      title,
      category,
      inputData,
    } = body;

    if (!communicationId) {
      return new Response(
        JSON.stringify({
          error:
            "Communication ID is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    const response =
      await client.responses.create({
        model: "gpt-5-mini",

        input: `
You are testing an internal communication-generation service.

Communication title:
${title || "Untitled"}

Category:
${category || "Unknown"}

Source information:
${JSON.stringify(
  inputData || {},
  null,
  2
)}

Return a short confirmation that you understood the communication.
Do not generate the final email yet.
        `,
      });

    return new Response(
      JSON.stringify({
        success: true,
        communicationId,
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
      "AI generation error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown AI error",
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
