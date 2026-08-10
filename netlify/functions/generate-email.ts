export default async (request: Request) => {
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

  return new Response(
    JSON.stringify({
      success: true,
      message:
        "generate-email function is working",
    }),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );
};
