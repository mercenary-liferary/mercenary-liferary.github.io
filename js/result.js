import { bindLanguageSelect, formatDateTime, getLanguage, t, translatePage } from "./i18n.js";
import { EARTHLY_BRANCHES, getBranch, getCountryName, getStem } from "./saju/constants.js";
import { createReadings } from "./saju/interpreters.js";
import { deleteResult, getResultById, isMockMode, StorageError } from "./storage.js";
import { digitsOnly, isValidSlug } from "./validation.js";

const languageSelect = document.getElementById("languageSelect");
const resultRoot = document.getElementById("resultRoot");
const notFoundState = document.getElementById("notFoundState");
const resultIntro = document.getElementById("resultIntro");
const deleteModal = document.getElementById("deleteModal");
const deletePassword = document.getElementById("deletePassword");
const deleteError = document.getElementById("deleteError");

let currentRecord = null;
let currentSlug = "";

bindLanguageSelect(languageSelect, () => {
  if (currentRecord) renderResult(currentRecord);
});

init();

async function init() {
  currentSlug = digitsOnly(new URLSearchParams(window.location.search).get("id"));
  if (!isValidSlug(currentSlug)) {
    showNotFound();
    return;
  }

  try {
    const record = await getResultById(currentSlug);
    if (!record) {
      showNotFound();
      return;
    }
    currentRecord = record;
    renderResult(record);
  } catch (error) {
    resultIntro.textContent = error.message || t("common.error");
    showNotFound();
  }
}

function renderResult(record) {
  const result = typeof record.result_json === "string" ? JSON.parse(record.result_json) : record.result_json;
  const readings = createReadings(result, getLanguage());
  const country = getCountryName(record.birth_country, getLanguage());
  const branch = EARTHLY_BRANCHES.find((item) => item.key === record.birth_time_branch);

  document.title = `${t("result.title")} ${record.slug} | Liferary`;
  resultIntro.textContent = `${record.name} · ${record.slug}`;
  notFoundState.hidden = true;
  resultRoot.hidden = false;

  resultRoot.innerHTML = `
    <section class="result-section" aria-labelledby="summaryTitle">
      <h2 id="summaryTitle">${t("result.summary")}</h2>
      <div class="meta-grid">
        ${metaItem(t("result.id"), record.slug, t("result.rememberId"))}
        ${metaItem(t("result.created"), formatDateTime(record.created_at))}
        ${metaItem(t("result.name"), record.name)}
      </div>
      <div class="summary-grid" style="margin-top: 12px;">
        ${metaItem(t("result.birth"), `${record.birth_year}-${pad(record.birth_month)}-${pad(record.birth_day)} · ${branch?.han || ""}${branch?.ko || ""}`)}
        ${metaItem(t("result.calendar"), t(`calendar.${record.birth_calendar}`))}
        ${metaItem(t("result.country"), `${country} · ${record.timezone}`)}
      </div>
      ${isMockMode() ? `<ul class="tag-list" style="margin-top: 14px;"><li>${t("result.mockBadge")}</li></ul>` : ""}
    </section>

    <section class="result-section" aria-labelledby="pillarsTitle">
      <h2 id="pillarsTitle">${t("result.pillars")}</h2>
      ${renderPillarTable(result)}
    </section>

    <section class="result-section" aria-labelledby="elementsTitle">
      <h2 id="elementsTitle">${t("result.elements")}</h2>
      ${renderMeters(result.fiveElements, "element")}
    </section>

    <section class="result-section" aria-labelledby="yinYangTitle">
      <h2 id="yinYangTitle">${t("result.yinYang")}</h2>
      ${renderMeters(result.yinYang, "yinYang")}
    </section>

    <section class="result-section" aria-labelledby="readingTitle">
      <h2 id="readingTitle">${t("result.reading")}</h2>
      <div class="reading-grid">
        ${readings.map((reading) => `
          <article class="reading-item">
            <h3>${t(`reading.${reading.key}`)}</h3>
            <p>${escapeHtml(reading.text)}</p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="result-section" aria-labelledby="luckTitle">
      <h2 id="luckTitle">${t("result.luckPillars")}</h2>
      <p class="field-note">${escapeHtml(t(`direction.${result.luckPillars.direction}`))} · ${escapeHtml(result.luckPillars.startAge.years)}y ${escapeHtml(result.luckPillars.startAge.months)}m · ${escapeHtml(result.luckPillars.note)}</p>
      ${renderLuckTable(result.luckPillars)}
    </section>

    <section class="result-section" aria-labelledby="limitationsTitle">
      <h2 id="limitationsTitle">${t("result.limitations")}</h2>
      <ul class="tag-list">
        ${result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
      </ul>
      <div class="notice-stack">
        <p>${t("disclaimer.service")}</p>
        <p>${t("disclaimer.calculation")}</p>
      </div>
      <div class="bottom-actions">
        <button class="danger-button" id="openDeleteButton" type="button">${t("result.delete")}</button>
      </div>
    </section>
  `;

  document.getElementById("openDeleteButton").addEventListener("click", () => openDialog(deleteModal));
  translatePage();
}

function renderPillarTable(result) {
  const keys = ["year", "month", "day", "hour"];
  return `
    <table class="pillar-table">
      <thead>
        <tr>
          <th>${t("table.pillar")}</th>
          <th>${t("table.stem")}</th>
          <th>${t("table.branch")}</th>
          <th>${t("table.tenGod")}</th>
          <th>${t("table.hidden")}</th>
        </tr>
      </thead>
      <tbody>
        ${keys.map((key) => {
          const pillar = result.pillars[key];
          return `
            <tr>
              <td>${escapeHtml(t(`pillar.${key}`))}</td>
              <td>${renderGanjiPart(pillar.stem)}</td>
              <td>${renderGanjiPart(pillar.branch)}</td>
              <td>${escapeHtml(t(`tenGod.${result.tenGods[key]}`))}</td>
              <td>${result.hiddenStems[key].map((stem) => escapeHtml(`${stem.han}${stem.ko}`)).join(" · ")}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function renderLuckTable(luckPillars) {
  return `
    <table class="luck-table" style="margin-top: 14px;">
      <thead>
        <tr>
          <th>${t("table.range")}</th>
          <th>${t("table.pillar")}</th>
        </tr>
      </thead>
      <tbody>
        ${luckPillars.pillars.map((pillar) => `
          <tr>
            <td>${escapeHtml(pillar.startAge)}-${escapeHtml(pillar.endAge)}</td>
            <td><span class="ganji"><span class="han">${escapeHtml(pillar.han)}</span><span class="ko">${escapeHtml(pillar.ko)}</span></span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderGanjiPart(part) {
  return `
    <span class="ganji">
      <span class="han">${escapeHtml(part.han)}</span>
      <span class="ko">${escapeHtml(part.ko)}</span>
    </span>
    <div class="field-note">${t(`element.${part.element}`)} · ${t(`yinYang.${part.yinYang}`)}</div>
  `;
}

function renderMeters(counts, prefix) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  return `
    <div class="meter-list">
      ${Object.entries(counts).map(([key, value]) => `
        <div class="meter-row">
          <strong>${escapeHtml(t(`${prefix}.${key}`))}</strong>
          <span class="meter-track"><span class="meter-fill" style="width: ${(value / total) * 100}%"></span></span>
          <span>${value}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function metaItem(label, value, note = "") {
  return `
    <div class="meta-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </div>
  `;
}

document.getElementById("shareButton").addEventListener("click", async () => {
  const shareUrl = window.location.href;
  const title = document.title;
  if (navigator.share) {
    try {
      await navigator.share({ title, url: shareUrl });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  await copyText(shareUrl);
  showToast(t("share.copied"));
});

document.getElementById("confirmDeleteButton").addEventListener("click", async () => {
  deleteError.textContent = "";
  const button = document.getElementById("confirmDeleteButton");
  button.disabled = true;
  button.textContent = t("common.loading");
  try {
    await deleteResult(currentSlug, deletePassword.value);
    showToast(t("delete.success"));
    window.setTimeout(() => {
      window.location.href = `index.html?lang=${getLanguage()}`;
    }, 800);
  } catch (error) {
    deleteError.textContent = error instanceof StorageError && error.code === "INVALID_PASSWORD" ? t("delete.invalid") : t("common.error");
  } finally {
    button.disabled = false;
    button.textContent = t("delete.action");
  }
});

deletePassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("confirmDeleteButton").click();
  }
});

deleteModal.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  deletePassword.value = "";
  deleteError.textContent = "";
});

function showNotFound() {
  resultRoot.hidden = true;
  notFoundState.hidden = false;
  resultIntro.textContent = t("result.notFoundBody");
}

function openDialog(dialog) {
  if (!dialog.open) {
    dialog.showModal();
    document.body.classList.add("modal-open");
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
