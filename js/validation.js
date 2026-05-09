import { isValidCivilDate } from "./saju/pillars.js";

const YEAR_MIN = 1900;
const YEAR_MAX = 2050;

export function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function parseInteger(value) {
  const normalized = digitsOnly(value);
  return normalized ? Number.parseInt(normalized, 10) : NaN;
}

export function isValidSlug(value) {
  return /^\d{8,10}$/.test(String(value || "").trim());
}

export function validateBirthInput(data, t) {
  const errors = {};

  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 12) {
    errors.name = t("validation.name");
  }

  if (!["male", "female"].includes(data.gender)) {
    errors.gender = t("validation.required");
  }

  if (!Number.isInteger(data.birthYear) || data.birthYear < YEAR_MIN || data.birthYear > YEAR_MAX) {
    errors.birthDate = t("validation.yearRange");
  } else if (!Number.isInteger(data.birthMonth) || data.birthMonth < 1 || data.birthMonth > 12) {
    errors.birthDate = t("validation.month");
  } else if (!Number.isInteger(data.birthDay) || data.birthDay < 1 || data.birthDay > 31) {
    errors.birthDate = t("validation.day");
  } else if (!isValidCivilDate(data.birthYear, data.birthMonth, data.birthDay)) {
    errors.birthDate = t("validation.date");
  }

  if (data.birthCalendar === "lunar") {
    errors.calendar = t("validation.lunarUnsupported");
  }

  if (!data.birthTimeBranch) {
    errors.birthTimeBranch = t("validation.required");
  }

  if (!data.birthCountry) {
    errors.birthCountry = t("validation.required");
  }

  if (!data.password || data.password.length < 4 || data.password.length > 32) {
    errors.password = t("validation.password");
  }

  if (!data.privacyConsent || !data.ageConsent) {
    errors.privacyConsent = t("validation.privacy");
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function clearErrors(ids) {
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = "";
  });
}

export function showErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const node = document.getElementById(`${field}Error`);
    if (node) node.textContent = message;
  });
}
