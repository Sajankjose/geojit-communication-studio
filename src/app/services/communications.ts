import {
  supabase,
} from "../../lib/supabase";


export interface CommunicationRecord {
  id: string;
  title: string;
  category: string | null;
  subcategory: string | null;
  objective: string | null;
  audience: string | null;
  status: string;

  created_by: string;

  input_data: Record<
    string,
    unknown
  >;

  classification_data: Record<
    string,
    unknown
  >;

  selected_variant_id:
    string | null;

  created_at: string;
  updated_at: string;
}


type CommunicationCacheEntry = {
  record:
    CommunicationRecord;

  cachedAt:
    number;
};


type GetCommunicationOptions = {
  forceRefresh?:
    boolean;
};


const COMMUNICATION_CACHE_TTL_MS =
  15_000;


const communicationCache =
  new Map<
    string,
    CommunicationCacheEntry
  >();


const communicationRequests =
  new Map<
    string,
    Promise<CommunicationRecord>
  >();


function cacheCommunication(
  record:
    CommunicationRecord
) {
  communicationCache.set(
    record.id,
    {
      record,
      cachedAt:
        Date.now(),
    }
  );
}


function getCachedCommunication(
  communicationId:
    string
) {
  const cached =
    communicationCache.get(
      communicationId
    );

  if (
    !cached
  ) {
    return null;
  }

  if (
    Date.now() -
      cached.cachedAt >
    COMMUNICATION_CACHE_TTL_MS
  ) {
    communicationCache.delete(
      communicationId
    );

    return null;
  }

  return cached.record;
}


export function clearCommunicationCache(
  communicationId?:
    string
) {
  if (
    communicationId
  ) {
    communicationCache.delete(
      communicationId
    );

    communicationRequests.delete(
      communicationId
    );

    return;
  }

  communicationCache.clear();

  communicationRequests.clear();
}


/**
 * Create a draft only after the user supplies
 * a valid Communication Name.
 *
 * Communication Name is required at service level,
 * so a generic blank draft cannot be created by the
 * normal application flow.
 */
export async function createCommunication(
  userId:
    string,
  communicationName:
    string
):
  Promise<CommunicationRecord> {
  const normalizedName =
    communicationName
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    normalizedName.length <
    3
  ) {
    throw new Error(
      "Communication Name must contain at least 3 characters."
    );
  }

  if (
    normalizedName.length >
    100
  ) {
    throw new Error(
      "Communication Name cannot exceed 100 characters."
    );
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "communications"
      )
      .insert({
        created_by:
          userId,

        title:
          normalizedName,

        status:
          "draft",
      })
      .select(
        "*"
      );

  if (
    error
  ) {
    console.error(
      "Create communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (
    !data ||
    data.length ===
      0
  ) {
    throw new Error(
      "Communication could not be created."
    );
  }

  if (
    data.length >
    1
  ) {
    console.error(
      "Unexpected multiple communication rows created:",
      data
    );

    throw new Error(
      "Unexpected duplicate communication records were returned."
    );
  }

  const record =
    data[
      0
    ] as
      CommunicationRecord;

  cacheCommunication(
    record
  );

  return record;
}


/**
 * List stays server-fresh, while each returned row
 * warms the short per-record cache used during navigation.
 */
export async function getMyCommunications():
  Promise<
    CommunicationRecord[]
  > {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "communications"
      )
      .select(
        "*"
      )
      .order(
        "updated_at",
        {
          ascending:
            false,
        }
      );

  if (
    error
  ) {
    console.error(
      "Load communications error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  const records =
    (
      data ??
      []
    ) as
      CommunicationRecord[];

  records.forEach(
    cacheCommunication
  );

  return records;
}


/**
 * Update server record and immediately refresh
 * the cached copy for the next route.
 */
export async function updateCommunication(
  communicationId:
    string,
  updates:
    Partial<CommunicationRecord>
):
  Promise<CommunicationRecord> {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "communications"
      )
      .update(
        updates
      )
      .eq(
        "id",
        communicationId
      )
      .select(
        "*"
      );

  if (
    error
  ) {
    console.error(
      "Supabase update communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (
    !data ||
    data.length ===
      0
  ) {
    clearCommunicationCache(
      communicationId
    );

    throw new Error(
      "Communication could not be updated. You may not have permission to edit this communication, or it may no longer be editable in its current workflow stage."
    );
  }

  if (
    data.length >
    1
  ) {
    clearCommunicationCache(
      communicationId
    );

    throw new Error(
      "Unexpected duplicate communication records were returned."
    );
  }

  const record =
    data[
      0
    ] as
      CommunicationRecord;

  cacheCommunication(
    record
  );

  return record;
}


/**
 * Get one communication by ID.
 *
 * Short cache removes duplicate audit RPCs during
 * immediate page-to-page transitions.
 *
 * `forceRefresh: true` is used by screens that need
 * current server state, such as generation polling
 * and Approval Status.
 */
export async function getCommunicationById(
  communicationId:
    string,
  options:
    GetCommunicationOptions =
      {}
):
  Promise<CommunicationRecord> {
  if (
    !options.forceRefresh
  ) {
    const cached =
      getCachedCommunication(
        communicationId
      );

    if (
      cached
    ) {
      return cached;
    }
  }

  const existingRequest =
    communicationRequests.get(
      communicationId
    );

  if (
    existingRequest
  ) {
    return existingRequest;
  }

  const request =
    (async () => {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "get_communication_for_audit",
          {
            p_communication_id:
              communicationId,
          }
        );

      if (
        error
      ) {
        console.error(
          "Load communication for audit error:",
          error
        );

        throw new Error(
          error.message
        );
      }

      const rows =
        (
          data ||
          []
        ) as
          CommunicationRecord[];

      if (
        rows.length ===
        0
      ) {
        clearCommunicationCache(
          communicationId
        );

        throw new Error(
          "Communication not found or you do not have permission to view it."
        );
      }

      if (
        rows.length >
        1
      ) {
        clearCommunicationCache(
          communicationId
        );

        throw new Error(
          "Unexpected duplicate communication records were returned."
        );
      }

      const record =
        rows[
          0
        ];

      cacheCommunication(
        record
      );

      return record;
    })();

  communicationRequests.set(
    communicationId,
    request
  );

  try {
    return await request;
  } finally {
    if (
      communicationRequests.get(
        communicationId
      ) ===
      request
    ) {
      communicationRequests.delete(
        communicationId
      );
    }
  }
}


/**
 * Delete a draft communication.
 */
export async function deleteDraftCommunication(
  communicationId:
    string
):
  Promise<void> {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "delete_draft_communication",
      {
        p_communication_id:
          communicationId,
      }
    );

  if (
    error
  ) {
    console.error(
      "Delete draft communication error:",
      error
    );

    throw new Error(
      error.message
    );
  }

  if (
    data !==
    true
  ) {
    throw new Error(
      "The draft could not be deleted."
    );
  }

  clearCommunicationCache(
    communicationId
  );
}
