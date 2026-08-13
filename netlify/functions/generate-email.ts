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

type ProductCommunicationType =
  | "feature_explainer"
  | "product_launch"
  | "product_update"
  | "offer_plan"
  | "product_benefit"
  | "cross_sell_adoption";

interface GenerateEmailRequest {
  communicationId: string;

  category: CommunicationCategory;

  title?: string;

  subcategory?: string | null;

  audience?: string | null;

  objective?: string | null;

  /**
   * Optional explicit communication type.
   *
   * For Product & Sales this may be:
   * feature_explainer, product_launch, etc.
   *
   * If omitted, we also try to resolve it
   * from inputData.categorySpecificDetails.
   */
  communicationType?:
    | ProductCommunicationType
    | string
    | null;

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

const VALID_PRODUCT_COMMUNICATION_TYPES:
  ProductCommunicationType[] = [
    "feature_explainer",
    "product_launch",
    "product_update",
    "offer_plan",
    "product_benefit",
    "cross_sell_adoption",
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

/**
 * Safely read a nested object.
 */
function asRecord(
  value: unknown
): Record<
  string,
  unknown
> | null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

/**
 * Resolve Product & Sales communication type.
 *
 * Priority:
 *
 * 1. Explicit request body value
 * 2. inputData.communicationType
 * 3. inputData.categorySpecificDetails.communicationType
 *
 * This supports both the existing input format and
 * the dedicated Product form we are about to add.
 */
function resolveCommunicationType({
  category,
  explicitType,
  inputData,
}: {
  category:
    CommunicationCategory;

  explicitType?:
    string | null;

  inputData:
    Record<
      string,
      unknown
    > | null;
}): string | null {
  if (
    category !==
    "product"
  ) {
    return null;
  }

  if (
    explicitType &&
    typeof explicitType ===
      "string"
  ) {
    return explicitType;
  }

  const directType =
    inputData
      ?.communicationType;

  if (
    typeof directType ===
      "string" &&
    directType.trim()
  ) {
    return directType.trim();
  }

  const categoryDetails =
    asRecord(
      inputData
        ?.categorySpecificDetails
    );

  const nestedType =
    categoryDetails
      ?.communicationType;

  if (
    typeof nestedType ===
      "string" &&
    nestedType.trim()
  ) {
    return nestedType.trim();
  }

  return null;
}

export default async (
  request: Request
) => {
  if (
    request.method !==
    "POST"
  ) {
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
      error:
        communicationError,
    } =
      await supabase
        .from(
          "communications"
        )
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
        .limit(1)
        .maybeSingle();

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
     * Resolve effective input data
     * ------------------------------------------------------
     */

    const effectiveInputData =
      (
        body.inputData &&
        typeof body.inputData ===
          "object" &&
        !Array.isArray(
          body.inputData
        )
      )
        ? body.inputData
        : (
            asRecord(
              communication.input_data
            ) || {}
          );

    /**
     * ------------------------------------------------------
     * Resolve communication type
     * ------------------------------------------------------
     */

    const communicationType =
      resolveCommunicationType(
        {
          category:
            body.category,

          explicitType:
            body.communicationType,

          inputData:
            effectiveInputData,
        }
      );

    /**
     * Product communication type validation.
     *
     * We intentionally allow null for existing Product
     * communications so the current generic Product flow
     * continues working.
     */
    if (
      body.category ===
        "product" &&
      communicationType &&
      !VALID_PRODUCT_COMMUNICATION_TYPES.includes(
        communicationType as ProductCommunicationType
      )
    ) {
      return jsonResponse(
        {
          success: false,

          error:
            `Unsupported Product & Sales communication type: ${communicationType}`,
        },
        400
      );
    }

    /**
     * ------------------------------------------------------
     * Prevent duplicate AI jobs
     * ------------------------------------------------------
     */

    const {
      data: activeRuns,
      error:
        activeRunsError,
    } =
      await supabase
        .from(
          "ai_runs"
        )
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
            ascending:
              false,
          }
        )
        .limit(1);

    if (
      activeRunsError
    ) {
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
      activeRuns.length >
        0
    ) {
      return jsonResponse(
        {
          success: true,

          status:
            activeRuns[0]
              .status,

          communicationId:
            body.communicationId,

          aiRunId:
            activeRuns[0]
              .id,

          communicationType,

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
     *
     * communicationType is now explicitly included.
     *
     * The background worker will use this to choose:
     *
     * product + feature_explainer
     *              ↓
     * PRODUCT_FEATURE_EXPLAINER_RULES
     */

    const workerPayload = {
      communicationId:
        body.communicationId,

      category:
        body.category,

      communicationType,

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
        effectiveInputData,
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
          method:
            "POST",

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
      error:
        statusError,
    } =
      await supabase
        .from(
          "communications"
        )
        .update({
          status:
            "generating",
        })
        .eq(
          "id",
          body.communicationId
        );

    if (
      statusError
    ) {
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

        communicationType,
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

        communicationType,

        message:
          communicationType ===
          "feature_explainer"
            ? "Feature Explainer generation started."
            : "AI generation started.",
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
