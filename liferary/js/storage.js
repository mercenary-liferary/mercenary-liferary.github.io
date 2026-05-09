const MOCK_PREFIX = "liferary:mock:result:";
const SUPABASE_CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const HASH_ITERATIONS = 150_000;

let supabaseClientPromise;

export class StorageError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

export function isSupabaseConfigured() {
  const config = getConfig();
  return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
}

export function isMockMode() {
  return !isSupabaseConfigured();
}

export async function generateUniqueSlug() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const slug = generateRandomNumericSlug();
    const existing = await getResultById(slug);
    if (!existing) return slug;
  }
  throw new StorageError("Could not generate a unique result ID.", "SLUG_COLLISION");
}

export async function saveResult(payload) {
  const passwordHash = await hashPassword(payload.password);
  const record = {
    slug: payload.slug,
    name: payload.name,
    gender: payload.gender,
    birth_calendar: payload.birthCalendar,
    is_lunar_leap_month: Boolean(payload.isLunarLeapMonth),
    birth_year: payload.birthYear,
    birth_month: payload.birthMonth,
    birth_day: payload.birthDay,
    birth_time_branch: payload.birthTimeBranch,
    birth_country: payload.birthCountry,
    timezone: payload.timezone,
    result_json: payload.resultJson,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
    deleted_at: null
  };

  if (isMockMode()) {
    localStorage.setItem(MOCK_PREFIX + payload.slug, JSON.stringify(record));
    return sanitizeRecord(record);
  }

  const client = await getSupabaseClient();
  const { created_at, deleted_at, ...insertRecord } = record;
  void created_at;
  void deleted_at;

  const { data, error } = await client
    .from("saju_results")
    .insert(insertRecord)
    .select(publicColumns())
    .single();

  if (error) {
    throw new StorageError(error.message, error.code || "SAVE_FAILED");
  }

  return sanitizeRecord(data);
}

export async function getResultById(slug) {
  const normalizedSlug = String(slug || "").trim();
  if (!/^\d{8,10}$/.test(normalizedSlug)) return null;

  if (isMockMode()) {
    const raw = localStorage.getItem(MOCK_PREFIX + normalizedSlug);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (record.deleted_at) return null;
    return sanitizeRecord(record);
  }

  const client = await getSupabaseClient();
  const { data, error } = await client
    .from("saju_results")
    .select(publicColumns())
    .eq("slug", normalizedSlug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new StorageError(error.message, error.code || "FETCH_FAILED");
  }

  return data ? sanitizeRecord(data) : null;
}

export async function deleteResult(slug, password) {
  if (isMockMode()) {
    const raw = localStorage.getItem(MOCK_PREFIX + slug);
    if (!raw) throw new StorageError("Result not found.", "NOT_FOUND");
    const record = JSON.parse(raw);
    const valid = await verifyPassword(password, record.password_hash);
    if (!valid) throw new StorageError("Invalid password.", "INVALID_PASSWORD");
    record.deleted_at = new Date().toISOString();
    localStorage.setItem(MOCK_PREFIX + slug, JSON.stringify(record));
    return true;
  }

  const config = getConfig();
  const endpoint = config.DELETE_FUNCTION_URL || `${config.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/delete-result`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ slug, password })
  });

  if (response.status === 401 || response.status === 403) {
    throw new StorageError("Invalid password.", "INVALID_PASSWORD");
  }
  if (!response.ok) {
    throw new StorageError("Delete failed.", "DELETE_FAILED");
  }
  return true;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePbkdf2(password, salt, HASH_ITERATIONS);
  return `pbkdf2-sha256$${HASH_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, iterationText, saltText, hashText] = String(storedHash || "").split("$");
  if (algorithm !== "pbkdf2-sha256") return false;
  const salt = base64ToBytes(saltText);
  const expected = base64ToBytes(hashText);
  const actual = await derivePbkdf2(password, salt, Number.parseInt(iterationText, 10));
  return constantTimeEqual(actual, expected);
}

async function derivePbkdf2(password, salt, iterations) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    material,
    256
  );
  return new Uint8Array(bits);
}

function generateRandomNumericSlug() {
  const length = 8 + secureRandomInt(3);
  let slug = String(1 + secureRandomInt(9));
  while (slug.length < length) {
    slug += String(secureRandomInt(10));
  }
  return slug;
}

function secureRandomInt(maxExclusive) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % maxExclusive;
}

async function getSupabaseClient() {
  if (!supabaseClientPromise) {
    supabaseClientPromise = import(SUPABASE_CDN).then(({ createClient }) => {
      const config = getConfig();
      return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    });
  }
  return supabaseClientPromise;
}

function getConfig() {
  return window.LIFERARY_CONFIG || {};
}

function publicColumns() {
  return [
    "slug",
    "name",
    "gender",
    "birth_calendar",
    "is_lunar_leap_month",
    "birth_year",
    "birth_month",
    "birth_day",
    "birth_time_branch",
    "birth_country",
    "timezone",
    "result_json",
    "created_at",
    "deleted_at"
  ].join(",");
}

function sanitizeRecord(record) {
  const { password_hash, ...safeRecord } = record;
  return safeRecord;
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}
