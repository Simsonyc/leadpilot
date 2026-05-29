import type {
  GhlContact,
  GhlCreateContactPayload,
  GhlUpdateContactPayload,
  GhlCreateOpportunityPayload,
  GhlUpdateOpportunityPayload,
  GhlCreateNotePayload,
  GhlOpportunity,
  GhlPipeline,
} from "@/types/ghl";

const GHL_BASE_URL = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

function getApiKey(): string {
  const key = process.env.GHL_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error("GHL_API_KEY manquante.");
  }
  return key.trim();
}

function getLocationId(): string {
  const id = process.env.GHL_LOCATION_ID;
  if (!id || id.trim().length === 0) {
    throw new Error("GHL_LOCATION_ID manquant.");
  }
  return id.trim();
}

async function ghlFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const apiKey = getApiKey();

  const response = await fetch(`${GHL_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Version: GHL_API_VERSION,
      ...options.headers,
    },
  });

  const json: unknown = await response.json();

  if (!response.ok) {
    throw new Error(
      `GHL API error ${response.status} on ${path}: ${JSON.stringify(json)}`,
    );
  }

  return json as T;
}

// ── Contacts ───────────────────────────────────────────────────

export async function ghlCreateContact(
  payload: GhlCreateContactPayload,
): Promise<GhlContact> {
  const result = await ghlFetch<{ contact: GhlContact }>("/contacts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.contact;
}

export async function ghlUpdateContact(
  contactId: string,
  payload: GhlUpdateContactPayload,
): Promise<GhlContact> {
  const result = await ghlFetch<{ contact: GhlContact }>(
    `/contacts/${contactId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return result.contact;
}

export async function ghlGetContact(
  contactId: string,
): Promise<GhlContact | null> {
  try {
    const result = await ghlFetch<{ contact: GhlContact }>(
      `/contacts/${contactId}`,
    );
    return result.contact;
  } catch {
    return null;
  }
}

export async function ghlSearchContactByEmail(
  email: string,
): Promise<GhlContact | null> {
  const locationId = getLocationId();
  try {
    const result = await ghlFetch<{ contacts: GhlContact[] }>(
      `/contacts/?locationId=${locationId}&email=${encodeURIComponent(email)}`,
    );
    return result.contacts?.[0] ?? null;
  } catch {
    return null;
  }
}

// ── Opportunities ──────────────────────────────────────────────

export async function ghlCreateOpportunity(
  payload: GhlCreateOpportunityPayload,
): Promise<GhlOpportunity> {
  const result = await ghlFetch<{ opportunity: GhlOpportunity }>(
    "/opportunities/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return result.opportunity;
}

export async function ghlUpdateOpportunity(
  opportunityId: string,
  payload: GhlUpdateOpportunityPayload,
): Promise<GhlOpportunity> {
  const result = await ghlFetch<{ opportunity: GhlOpportunity }>(
    `/opportunities/${opportunityId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return result.opportunity;
}

// ── Notes ─────────────────────────────────────────────────────

export async function ghlCreateNote(
  contactId: string,
  payload: GhlCreateNotePayload,
): Promise<void> {
  await ghlFetch(`/contacts/${contactId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Pipelines ─────────────────────────────────────────────────

export async function ghlGetPipelines(): Promise<GhlPipeline[]> {
  const locationId = getLocationId();
  const result = await ghlFetch<{ pipelines: GhlPipeline[] }>(
    `/opportunities/pipelines/?locationId=${locationId}`,
  );
  return result.pipelines ?? [];
}

export { getLocationId };
