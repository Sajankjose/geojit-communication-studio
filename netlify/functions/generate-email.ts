import {
  createUserSupabaseClient,
} from "./ai/supabaseServer";

type CommunicationCategory =
  | "research"
  | "education"
  | "product"
  | "service"
  | "regulatory"
  | "onboarding";

interface GenerateEmailRequest {
  communicationId: string;

  category: CommunicationCategory;

  title?: string;

  subcategory?: string | null;

  audience?: string | null;

  objective?: string | null;

  inputData?: Record<
    string,
    unknown
  >;
}

const VALID_CATEGORIES:
  CommunicationCategory[] = [
    "research",
    "education",
    "product",
    "service",
    "regulatory",
    "onboarding",
  ];

function jsonResponse(
  body: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,

      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );
}

export default async (
  request: Request
) => {
  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error:
          "Method not allowed. Use POST.",
      },
      405
    );
  }

  /**
   * ------------------------------------------------------
   * Authentication header
   * ------------------------------------------------------
   */

  const authorizationHeader =
    request.headers.get(
      "Authorization"
    );

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Authentication required.",
      },
      401
    );
  }

  try {
    /**
     * ------------------------------------------------------
     * Supabase client using logged-in user's JWT
     * ------------------------------------------------------
     */

    const supabase =
      createUserSupabaseClient(
        authorizationHeader
      );

    const accessToken =
      authorizationHeader.replace(
        /^Bearer\s+/i,
        ""
      );

    /**
     * Verify user.
     */
    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "Starter authentication failed:",
        userError
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Invalid or expired session. Please sign in again.",
        },
        401
      );
    }

    const user =
      userData.user;

    /**
     * ------------------------------------------------------
     * Read request body
     * ------------------------------------------------------
     */

    const rawBody =
      await request.json();

    const body =
      rawBody as GenerateEmailRequest;

    if (
      !body.communicationId ||
      typeof body.communicationId !==
        "string"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "communicationId is required.",
        },
        400
      );
    }

    if (
      !body.category ||
      !VALID_CATEGORIES.includes(
        body.category
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "A valid communication category is required.",
        },
        400
      );
    }

    /**
     * ------------------------------------------------------
     * Verify communication belongs to user
     * ------------------------------------------------------
     *
     * RLS provides the actual ownership protection.
     */

    const {
      data: communication,
      error: communicationError,
    } =
      await supabase
        .from("communications")
        .select(
          `
          id,
          title,
          category,
          subcategory,
          audience,
          objective,
          status,
          input_data,
          created_by
          `
        )
        .eq(
          "id",
          body.communicationId
        )
        .single();

    if (
      communicationError ||
      !communication
    ) {
      console.error(
        "Starter communication lookup failed:",
        communicationError
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Communication not found or access denied.",
        },
        404
      );
    }

    /**
     * ------------------------------------------------------
     * Prevent duplicate AI jobs
     * ------------------------------------------------------
     */

    const {
      data: activeRuns,
      error: activeRunsError,
    } =
      await supabase
        .from("ai_runs")
        .select(
          "id,status,created_at"
        )
        .eq(
          "communication_id",
          body.communicationId
        )
        .in(
          "status",
          [
            "queued",
            "running",
          ]
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

    if (activeRunsError) {
      console.error(
        "Unable to check active AI runs:",
        activeRunsError
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Unable to check generation status.",
        },
        500
      );
    }

    if (
      activeRuns &&
      activeRuns.length > 0
    ) {
      return jsonResponse(
        {
          success: true,

          status:
            activeRuns[0].status,

          communicationId:
            body.communicationId,

          aiRunId:
            activeRuns[0].id,

          message:
            "Generation is already in progress.",
        },
        202
      );
    }

    /**
     * ------------------------------------------------------
     * Build payload for background worker
     * ------------------------------------------------------
     */

    const workerPayload = {
      communicationId:
        body.communicationId,

      category:
        body.category,

      title:
        body.title ||
        communication.title,

      subcategory:
        body.subcategory ??
        communication.subcategory,

      audience:
        body.audience ??
        communication.audience,

      objective:
        body.objective ??
        communication.objective,

      inputData:
        body.inputData ||
        communication.input_data,
    };

    /**
     * ------------------------------------------------------
     * Trigger background worker
     * ------------------------------------------------------
     *
     * Forward the same Authorization header.
     * The background worker will independently
     * authenticate the employee and create ai_runs.
     */

    const workerUrl =
      new URL(
        "/.netlify/functions/generate-email-background",
        request.url
      );

    const workerResponse =
      await fetch(
        workerUrl.toString(),
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              authorizationHeader,
          },

          body:
            JSON.stringify(
              workerPayload
            ),
        }
      );

    /**
     * A Netlify background function should
     * acknowledge successful invocation with 202.
     */
    if (
      workerResponse.status !==
      202
    ) {
      const responseText =
        await workerResponse.text();

      console.error(
        "Background worker invocation failed:",
        {
          status:
            workerResponse.status,

          response:
            responseText,
        }
      );

      return jsonResponse(
        {
          success: false,
          error:
            "Unable to start AI generation.",
        },
        500
      );
    }

    /**
     * ------------------------------------------------------
     * Mark communication as generating
     * ------------------------------------------------------
     */

    const {
      error: statusError,
    } =
      await supabase
        .from("communications")
        .update({
          status:
            "generating",
        })
        .eq(
          "id",
          body.communicationId
        );

    if (statusError) {
      console.error(
        "Unable to set generating status:",
        statusError
      );
    }

    console.log(
      "Background generation queued:",
      {
        communicationId:
          body.communicationId,

        userId:
          user.id,

        category:
          body.category,
      }
    );

    /**
     * ------------------------------------------------------
     * Return immediately to React
     * ------------------------------------------------------
     */

    return jsonResponse(
      {
        success: true,

        status:
          "queued",

        communicationId:
          body.communicationId,

        message:
          "AI generation started.",
      },
      202
    );

  } catch (error) {
    console.error(
      "Generate starter error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to start AI generation.",
      },
      500
    );
  }
};
