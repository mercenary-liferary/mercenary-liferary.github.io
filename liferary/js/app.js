import { bindLanguageSelect, getLanguage, t, translatePage } from "./i18n.js";
import { COUNTRY_TIMEZONES, EARTHLY_BRANCHES, getCountry } from "./saju/constants.js";
import { calculateSaju } from "./saju/calculate.js";
import { clearErrors, digitsOnly, isValidSlug, parseInteger, showErrors, validateBirthInput } from "./validation.js";
import { generateUniqueSlug, getResultById, isMockMode, saveResult } from "./storage.js";

const errorIds = [
  "nameError",
  "genderError",
  "birthDateError",
  "calendarError",
  "birthTimeBranchError",
  "birthCountryError",
  "passwordError",
  "privacyConsentError",
  "searchError"
];

const form = document.getElementById("birthForm");
const languageSelect = document.getElementById("languageSelect");
const birthCountry = document.getElementById("birthCountry");
const birthTimeBranch = document.getElementById("birthTimeBranch");
const submitButton = document.getElementById("submitButton");
const storageModeNote = document.getElementById("storageModeNote");
const searchModal = document.getElementById("searchModal");
const privacyModal = document.getElementById("privacyModal");

bindLanguageSelect(languageSelect, () => {
  populateTimeBranches();
  populateCountries();
  updateStorageModeNote();
});

populateTimeBranches();
populateCountries();
installNumericFilters();
installCalendarToggle();
installModals();
updateStorageModeNote();

form.addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors(errorIds);

  const input = collectFormData();
  const validation = validateBirthInput(input, t);
  if (!validation.valid) {
    showErrors(validation.errors);
    return;
  }

  setLoading(true);
  try {
    const slug = await generateUniqueSlug();
    const resultJson = calculateSaju(input);
    const country = getCountry(input.birthCountry);
    await saveResult({
      ...input,
      slug,
      timezone: country.timezone,
      resultJson
    });

    const url = new URL("result.html", window.location.href);
    url.searchParams.set("id", slug);
    url.searchParams.set("lang", getLanguage());
    window.location.href = url.href;
  } catch (error) {
    showToast(error.message || t("common.error"));
  } finally {
    setLoading(false);
  }
}

function collectFormData() {
  const formData = new FormData(form);
  return {
    name: String(formData.get("name") || "").trim(),
    gender: String(formData.get("gender") || ""),
    birthYear: parseInteger(formData.get("birthYear")),
    birthMonth: parseInteger(formData.get("birthMonth")),
    birthDay: parseInteger(formData.get("birthDay")),
    birthCalendar: String(formData.get("birthCalendar") || "solar"),
    isLunarLeapMonth: Boolean(formData.get("isLunarLeapMonth")),
    birthTimeBranch: String(formData.get("birthTimeBranch") || ""),
    birthCountry: String(formData.get("birthCountry") || ""),
    password: String(formData.get("password") || ""),
    privacyConsent: Boolean(formData.get("privacyConsent")),
    ageConsent: Boolean(formData.get("ageConsent"))
  };
}

function populateTimeBranches() {
  const selected = birthTimeBranch.value || "zi";
  birthTimeBranch.innerHTML = EARTHLY_BRANCHES.map((branch) => {
    return `<option value="${branch.key}">${t(`branch.${branch.animalKey}`)}</option>`;
  }).join("");
  birthTimeBranch.value = selected;
}

function populateCountries() {
  const selected = birthCountry.value || detectDefaultCountry();
  const lang = getLanguage();
  const countries = [...COUNTRY_TIMEZONES].sort((a, b) => {
    return (a.names[lang] || a.names.en).localeCompare(b.names[lang] || b.names.en, lang);
  });
  birthCountry.innerHTML = countries.map((country) => {
    const label = `${country.names[lang] || country.names.en} · ${country.timezone}`;
    return `<option value="${country.code}">${label}</option>`;
  }).join("");
  birthCountry.value = countries.some((country) => country.code === selected) ? selected : countries[0]?.code;
}

function detectDefaultCountry() {
  const language = navigator.language || "";
  const countryPart = language.split("-")[1]?.toUpperCase();
  if (countryPart && COUNTRY_TIMEZONES.some((country) => country.code === countryPart)) {
    return countryPart;
  }
  if (language.toLowerCase().startsWith("ko")) return "KR";
  if (language.toLowerCase().startsWith("ja")) return "JP";
  if (language.toLowerCase().startsWith("zh")) return "CN";
  return "US";
}

function installNumericFilters() {
  ["birthYear", "birthMonth", "birthDay", "searchSlug"].forEach((id) => {
    const input = document.getElementById(id);
    input?.addEventListener("input", () => {
      input.value = digitsOnly(input.value);
    });
  });
}

function installCalendarToggle() {
  const lunarLeapRow = document.getElementById("lunarLeapRow");
  form.querySelectorAll("input[name='birthCalendar']").forEach((radio) => {
    radio.addEventListener("change", () => {
      const lunarSelected = form.querySelector("input[name='birthCalendar']:checked")?.value === "lunar";
      lunarLeapRow.hidden = !lunarSelected;
    });
  });
}

function installModals() {
  document.getElementById("openSearchButton").addEventListener("click", () => openDialog(searchModal));
  document.getElementById("openPrivacyButton").addEventListener("click", () => openDialog(privacyModal));
  document.getElementById("searchSubmitButton").addEventListener("click", handleSearch);
  document.getElementById("searchSlug").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  });
  searchModal.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    document.getElementById("searchSlug").value = "";
    document.getElementById("searchError").textContent = "";
  });
  privacyModal.addEventListener("close", () => document.body.classList.remove("modal-open"));
}

async function handleSearch() {
  const input = document.getElementById("searchSlug");
  const error = document.getElementById("searchError");
  const slug = digitsOnly(input.value);
  input.value = slug;
  error.textContent = "";

  if (!isValidSlug(slug)) {
    error.textContent = t("search.invalid");
    return;
  }

  const button = document.getElementById("searchSubmitButton");
  button.disabled = true;
  button.textContent = t("common.loading");
  try {
    const result = await getResultById(slug);
    if (!result) {
      error.textContent = t("search.noResult");
      return;
    }
    const url = new URL("result.html", window.location.href);
    url.searchParams.set("id", slug);
    url.searchParams.set("lang", getLanguage());
    window.location.href = url.href;
  } catch (errorValue) {
    error.textContent = errorValue.message || t("common.error");
  } finally {
    button.disabled = false;
    button.textContent = t("search.action");
  }
}

function setLoading(loading) {
  submitButton.disabled = loading;
  submitButton.setAttribute("aria-busy", String(loading));
  submitButton.querySelector("span").textContent = loading ? t("common.loading") : t("form.submit");
}

function updateStorageModeNote() {
  storageModeNote.textContent = isMockMode() ? t("common.mockMode") : t("common.supabaseMode");
}

function openDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add("modal-open");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

translatePage();
