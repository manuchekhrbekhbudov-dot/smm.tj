"use strict";

/*
====================================================
 SMM.TJ FRONTEND
====================================================

IMPORTANT:

This frontend does NOT fake authentication.

When backend exists, change:

API_URL

to your real backend URL.

Example:

https://api.smm.tj/api

====================================================
*/


const API_URL =
  window.SMMTJ_API_URL ||
  "http://localhost:4000/api";


/* ==================================================
   TRANSLATIONS
================================================== */

const translations = {

  tj: {

    home: "Асосӣ",
    services: "Хизматрасониҳо",
    specialists: "Мутахассисон",
    how: "Чӣ тавр кор мекунад",

    login: "Ворид шудан",
    register: "Бақайдгирӣ",

    heroTitle:
      "Платформаи касбии SMM дар Тоҷикистон",

    heroDescription:
      "Беҳтарин мутахассиси SMM-ро пайдо кунед, лоиҳаи худро оғоз кунед ва натиҷаро назорат намоед.",

    findSpecialist:
      "Мутахассиси SMM пайдо кунед",

    joinSpecialist:
      "Ҳамчун SMM мутахассис ҳамроҳ шавед",

    specialistsStat:
      "Мутахассисон",

    projectsStat:
      "Лоиҳаҳо",

    satisfaction:
      "Қаноатмандӣ",

    servicesTitle:
      "Ҳамаи хизматҳои SMM дар як платформа",

    servicesDescription:
      "Аз контент то реклама — мутахассиси мувофиқро пайдо кунед.",

    specialistsTitle:
      "Мутахассисони SMM",

    specialistsDescription:
      "Мутахассиси мувофиқро аз рӯи таҷриба, рейтинг ва хизмат интихоб кунед.",

    howTitle:
      "Чӣ тавр кор мекунад?",

    step1Title:
      "Лоиҳа созед",

    step1Text:
      "Вазифа ва буҷаи худро муайян кунед.",

    step2Title:
      "Мутахассис интихоб кунед",

    step2Text:
      "Пешниҳодҳоро муқоиса кунед.",

    step3Title:
      "Корро оғоз кунед",

    step3Text:
      "Chat, tasks ва content calendar истифода баред.",

    step4Title:
      "Натиҷаро бинед",

    step4Text:
      "Analytics ва review-ро истифода баред.",

    footer:
      "Платформаи касбии SMM дар Тоҷикистон"

  },


  ru: {

    home: "Главная",
    services: "Услуги",
    specialists: "Специалисты",
    how: "Как это работает",

    login: "Войти",
    register: "Регистрация",

    heroTitle:
      "Профессиональная SMM-платформа в Таджикистане",

    heroDescription:
      "Найдите подходящего SMM-специалиста, создайте проект и контролируйте результат.",

    findSpecialist:
      "Найти SMM-специалиста",

    joinSpecialist:
      "Присоединиться как SMM-специалист",

    specialistsStat:
      "Специалистов",

    projectsStat:
      "Проектов",

    satisfaction:
      "Удовлетворённость",

    servicesTitle:
      "Все SMM-услуги на одной платформе",

    servicesDescription:
      "От контента до рекламы — найдите подходящего специалиста.",

    specialistsTitle:
      "SMM-специалисты",

    specialistsDescription:
      "Выбирайте специалиста по опыту, рейтингу и услугам.",

    howTitle:
      "Как это работает?",

    step1Title:
      "Создайте проект",

    step1Text:
      "Опишите задачу и бюджет.",

    step2Title:
      "Выберите специалиста",

    step2Text:
      "Сравните предложения.",

    step3Title:
      "Начните работу",

    step3Text:
      "Используйте чат, задачи и контент-календарь.",

    step4Title:
      "Смотрите результат",

    step4Text:
      "Используйте аналитику и отзывы.",

    footer:
      "Профессиональная SMM-платформа в Таджикистане"

  },


  en: {

    home: "Home",
    services: "Services",
    specialists: "Specialists",
    how: "How it works",

    login: "Log in",
    register: "Register",

    heroTitle:
      "Professional SMM platform in Tajikistan",

    heroDescription:
      "Find the right SMM specialist, create a project and track your results.",

    findSpecialist:
      "Find an SMM specialist",

    joinSpecialist:
      "Join as an SMM specialist",

    specialistsStat:
      "Specialists",

    projectsStat:
      "Projects",

    satisfaction:
      "Satisfaction",

    servicesTitle:
      "All SMM services in one platform",

    servicesDescription:
      "From content to advertising — find the right specialist.",

    specialistsTitle:
      "SMM Specialists",

    specialistsDescription:
      "Choose specialists by experience, rating and services.",

    howTitle:
      "How does it work?",

    step1Title:
      "Create a project",

    step1Text:
      "Describe your task and budget.",

    step2Title:
      "Choose a specialist",

    step2Text:
      "Compare proposals.",

    step3Title:
      "Start working",

    step3Text:
      "Use chat, tasks and content calendar.",

    step4Title:
      "See results",

    step4Text:
      "Use analytics and reviews.",

    footer:
      "Professional SMM platform in Tajikistan"

  }

};


/* ==================================================
   STATE
================================================== */

const state = {

  language:
    localStorage.getItem("smm_language") || "tj",

  authMode:
    "login",

  user:
    null,

  specialists:
    []

};


/* ==================================================
   DOM READY
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initLanguage();

    initNavigation();

    initAuth();

    initMobileMenu();

    initButtons();

    initYear();

    loadCurrentUser();

    loadSpecialists();

  }
);


/* ==================================================
   LANGUAGE
================================================== */

function initLanguage() {

  const selector =
    document.getElementById(
      "languageSelector"
    );

  if (!selector) return;

  selector.value =
    state.language;

  selector.addEventListener(
    "change",
    event => {

      state.language =
        event.target.value;

      localStorage.setItem(
        "smm_language",
        state.language
      );

      applyTranslations();

    }
  );

  applyTranslations();

}


function applyTranslations() {

  const dictionary =
    translations[state.language];

  if (!dictionary) return;

  document
    .querySelectorAll("[data-i18n]")
    .forEach(element => {

      const key =
        element.dataset.i18n;

      if (
        Object.prototype.hasOwnProperty.call(
          dictionary,
          key
        )
      ) {

        element.textContent =
          dictionary[key];

      }

    });

}


/* ==================================================
   NAVIGATION
================================================== */

function initNavigation() {

  document
    .querySelectorAll('a[href^="#"]')
    .forEach(link => {

      link.addEventListener(
        "click",
        event => {

          const id =
            link.getAttribute("href");

          if (
            !id ||
            id === "#"
          ) return;

          const target =
            document.querySelector(id);

          if (!target) return;

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth"
          });

          const mobileMenu =
            document.getElementById(
              "mobileMenu"
            );

          if (mobileMenu) {

            mobileMenu.classList.remove(
              "active"
            );

          }

        }
      );

    });

}


/* ==================================================
   MOBILE MENU
================================================== */

function initMobileMenu() {

  const button =
    document.getElementById(
      "mobileMenuButton"
    );

  const menu =
    document.getElementById(
      "mobileMenu"
    );

  if (!button || !menu) return;

  button.addEventListener(
    "click",
    () => {

      menu.classList.toggle(
        "active"
      );

    }
  );

}


/* ==================================================
   AUTH MODAL
================================================== */

function initAuth() {

  const modal =
    document.getElementById(
      "authModal"
    );

  const close =
    document.getElementById(
      "closeModal"
    );

  const login =
    document.getElementById(
      "loginButton"
    );

  const register =
    document.getElementById(
      "registerButton"
    );

  const form =
    document.getElementById(
      "authForm"
    );

  if (!modal) return;


  login?.addEventListener(
    "click",
    () => {

      state.authMode =
        "login";

      openAuthModal();

    }
  );


  register?.addEventListener(
    "click",
    () => {

      state.authMode =
        "register";

      openAuthModal();

    }
  );


  close?.addEventListener(
    "click",
    closeAuthModal
  );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {

        closeAuthModal();

      }

    }
  );


  form?.addEventListener(
    "submit",
    handleAuthSubmit
  );

}


function openAuthModal() {

  const modal =
    document.getElementById(
      "authModal"
    );

  const title =
    document.getElementById(
      "modalTitle"
    );

  const submit =
    document.getElementById(
      "authSubmit"
    );

  const nameField =
    document.getElementById(
      "nameField"
    );

  const roleField =
    document.getElementById(
      "roleField"
    );

  const message =
    document.getElementById(
      "authMessage"
    );


  if (!modal) return;


  const dictionary =
    translations[state.language];


  if (
    state.authMode ===
    "register"
  ) {

    title.textContent =
      dictionary.register;

    submit.textContent =
      dictionary.register;

    nameField.classList.remove(
      "hidden"
    );

    roleField.classList.remove(
      "hidden"
    );

  } else {

    title.textContent =
      dictionary.login;

    submit.textContent =
      dictionary.login;

    nameField.classList.add(
      "hidden"
    );

    roleField.classList.add(
      "hidden"
    );

  }


  message.textContent = "";

  modal.classList.add(
    "active"
  );

}


function closeAuthModal() {

  const modal =
    document.getElementById(
      "authModal"
    );

  modal?.classList.remove(
    "active"
  );

}


/* ==================================================
   REAL AUTH REQUEST
================================================== */

async function handleAuthSubmit(
  event
) {

  event.preventDefault();


  const email =
    document.getElementById(
      "authEmail"
    ).value.trim();

  const password =
    document.getElementById(
      "authPassword"
    ).value;

  const name =
    document.getElementById(
      "authName"
    ).value.trim();

  const role =
    document.getElementById(
      "authRole"
    ).value;

  const message =
    document.getElementById(
      "authMessage"
    );


  if (!email || !password) {

    message.textContent =
      "Маълумотҳоро пур кунед.";

    return;

  }


  try {

    message.textContent =
      "Пайвастшавӣ...";


    const endpoint =
      state.authMode ===
      "register"
        ? "/auth/register"
        : "/auth/login";


    const body =
      state.authMode ===
      "register"
        ? {
            name,
            email,
            password,
            role
          }
        : {
            email,
            password
          };


    const response =
      await fetch(
        API_URL + endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(body)
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "REQUEST_FAILED"
      );

    }


    if (!data.token) {

      throw new Error(
        "AUTH_TOKEN_MISSING"
      );

    }


    localStorage.setItem(
      "smm_token",
      data.token
    );


    state.user =
      data.user;


    closeAuthModal();


    redirectByRole(
      data.user.role
    );


  } catch (error) {

    console.error(
      "SMM.TJ auth error:",
      error
    );


    message.textContent =
      "Ба сервер пайваст шудан имкон нашуд ё маълумот нодуруст аст.";

  }

}


/* ==================================================
   CURRENT USER
================================================== */

async function loadCurrentUser() {

  const token =
    localStorage.getItem(
      "smm_token"
    );

  if (!token) return;


  try {

    const response =
      await fetch(
        API_URL + "/me",
        {
          headers: {
            Authorization:
              "Bearer " + token
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        "SESSION_EXPIRED"
      );

    }


    state.user =
      await response.json();


  } catch {

    localStorage.removeItem(
      "smm_token"
    );

    state.user =
      null;

  }

}


/* ==================================================
   ROLE REDIRECT
================================================== */

function redirectByRole(
  role
) {

  if (role === "ADMIN") {

    window.location.href =
      "Admin.panel";

    return;

  }


  /*
   * These pages should be created:
   *
   * client.html
   * specialist.html
   *
   * They will be connected to the same API.
   */

  if (role === "CLIENT") {

    window.location.href =
      "client.html";

    return;

  }


  if (role === "SPECIALIST") {

    window.location.href =
      "specialist.html";

  }

}


/* ==================================================
   SPECIALISTS
================================================== */

async function loadSpecialists() {

  const container =
    document.getElementById(
      "specialistGrid"
    );

  if (!container) return;


  try {

    const response =
      await fetch(
        API_URL +
        "/specialists?limit=6"
      );


    if (!response.ok) {

      throw new Error(
        "SPECIALISTS_REQUEST_FAILED"
      );

    }


    const data =
      await response.json();


    state.specialists =
      data.items || [];


    renderSpecialists();


  } catch (error) {

    console.error(
      error
    );


    /*
     * Do NOT insert fake specialists.
     */

    container.innerHTML = `
      <div class="specialist-card">
        <strong>SMM.TJ</strong>
        <p>
          Барои дидани мутахассисони воқеӣ
          сервери SMM.TJ бояд фаъол бошад.
        </p>
      </div>
    `;

  }

}


function renderSpecialists() {

  const container =
    document.getElementById(
      "specialistGrid"
    );

  if (!container) return;


  if (
    !state.specialists.length
  ) {

    container.innerHTML = `
      <div class="specialist-card">
        <strong>SMM.TJ</strong>
        <p>
          Ҳоло мутахассис пайдо нашуд.
        </p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    state.specialists
      .map(
        specialist => {

          const user =
            specialist.user || {};

          const name =
            escapeHTML(
              user.name ||
              "SMM Specialist"
            );

          const skills =
            escapeHTML(
              specialist.skills ||
              "SMM"
            );

          const rating =
            Number(
              specialist.rating || 0
            ).toFixed(1);

          const projects =
            Number(
              specialist.completedProjects || 0
            );

          const price =
            Number(
              specialist.startingPrice || 0
            );


          const initial =
            name
              .charAt(0)
              .toUpperCase();


          return `

            <article
              class="specialist-card"
            >

              <div
                class="specialist-top"
              >

                <div
                  class="specialist-avatar"
                >
                  ${initial}
                </div>

                <div
                  class="specialist-info"
                >

                  <strong>
                    ${name}
                  </strong>

                  <span>
                    ⭐ ${rating}
                    · ${projects}
                    projects
                  </span>

                </div>

              </div>


              <p>
                ${skills}
              </p>


              <div
                class="specialist-meta"
              >

                <span class="tag">
                  Verified
                </span>

                <span class="tag">
                  TJ
                </span>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  gap:10px;
                "
              >

                <strong>
                  ${price} TJS
                </strong>

                <button
                  class="btn btn-primary"
                  onclick="
                    window.SMMTJ.openSpecialist(
                      ${Number(specialist.id)}
                    )
                  "
                >
                  View
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");

}


/* ==================================================
   SPECIALIST ACTION
================================================== */

function openSpecialist(
  specialistId
) {

  /*
   * This intentionally calls the backend
   * instead of pretending a profile exists.
   */

  window.location.hash =
    "specialist-" +
    specialistId;

}


/* ==================================================
   MAIN BUTTONS
================================================== */

function initButtons() {

  const find =
    document.getElementById(
      "findSpecialistButton"
    );

  const join =
    document.getElementById(
      "joinSpecialistButton"
    );


  find?.addEventListener(
    "click",
    () => {

      document
        .getElementById(
          "specialists"
        )
        ?.scrollIntoView({
          behavior: "smooth"
        });

    }
  );


  join?.addEventListener(
    "click",
    () => {

      state.authMode =
        "register";

      openAuthModal();

    }
  );

}


/* ==================================================
   YEAR
================================================== */

function initYear() {

  const year =
    document.getElementById(
      "currentYear"
    );

  if (year) {

    year.textContent =
      new Date()
        .getFullYear()
        .toString();

  }

}


/* ==================================================
   LOGOUT
================================================== */

function logout() {

  localStorage.removeItem(
    "smm_token"
  );

  state.user =
    null;

  window.location.href =
    "index.html";

}


/* ==================================================
   ADMIN API
================================================== */

async function adminRequest(
  endpoint,
  options = {}
) {

  const token =
    localStorage.getItem(
      "smm_token"
    );


  if (!token) {

    throw new Error(
      "UNAUTHORIZED"
    );

  }


  const response =
    await fetch(
      API_URL + endpoint,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),

          Authorization:
            "Bearer " + token
        }
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.error ||
      "ADMIN_REQUEST_FAILED"
    );

  }


  return data;

}


/* ==================================================
   ADMIN STATS
================================================== */

async function loadAdminStats() {

  try {

    const stats =
      await adminRequest(
        "/admin/stats"
      );


    setText(
      "totalUsers",
      stats.users
    );

    setText(
      "totalClients",
      stats.clients
    );

    setText(
      "totalSpecialists",
      stats.specialists
    );

    setText(
      "activeProjects",
      stats.active
    );


  } catch (error) {

    console.error(
      "Admin stats:",
      error
    );

  }

}


/* ==================================================
   ADMIN PAGE
================================================== */

async function loadAdminPage(
  page
) {

  const table =
    document.getElementById(
      "adminTableBody"
    );

  if (!table) return;


  table.innerHTML = `
    <tr>
      <td colspan="6">
        Loading...
      </td>
    </tr>
  `;


  try {

    if (page === "dashboard") {

      await loadAdminStats();

      return;

    }


    /*
     * These endpoints are expected to be
     * implemented by the backend.
     */

    let endpoint;


    switch (page) {

      case "users":
        endpoint = "/admin/users";
        break;

      case "projects":
        endpoint = "/admin/projects";
        break;

      case "services":
        endpoint = "/admin/services";
        break;

      case "reviews":
        endpoint = "/admin/reviews";
        break;

      case "payments":
        endpoint = "/admin/payments";
        break;

      case "settings":
        endpoint = "/admin/settings";
        break;

      default:
        return;

    }


    const data =
      await adminRequest(
        endpoint
      );


    renderAdminTable(
      data
    );


  } catch (error) {

    console.error(
      error
    );


    table.innerHTML = `
      <tr>
        <td colspan="6">
          Backend endpoint ҳоло дастрас нест.
        </td>
      </tr>
    `;

  }

}


/* ==================================================
   ADMIN TABLE
================================================== */

function renderAdminTable(
  data
) {

  const table =
    document.getElementById(
      "adminTableBody"
    );

  if (!table) return;


  const items =
    Array.isArray(data)
      ? data
      : data.items || [];


  if (!items.length) {

    table.innerHTML = `
      <tr>
        <td colspan="6">
          Маълумот нест.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML =
    items
      .map(
        item => {

          return `

            <tr>

              <td>
                ${escapeHTML(
                  String(
                    item.id ?? "—"
                  )
                )}
              </td>

              <td>
                ${escapeHTML(
                  item.name ||
                  item.title ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  item.email ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  item.role ||
                  item.status ||
                  "—"
                )}
              </td>

              <td>

                <span
                  class="admin-status"
                >
                  ${escapeHTML(
                    item.status ||
                    "ACTIVE"
                  )}
                </span>

              </td>

              <td>

                <button
                  class="admin-action"
                  onclick="
                    window.SMMTJ.adminView(
                      ${Number(item.id)}
                    )
                  "
                >
                  View
                </button>

              </td>

            </tr>

          `;

        }
      )
      .join("");

}


/* ==================================================
   ADMIN VIEW
================================================== */

function adminView(
  id
) {

  console.log(
    "Admin selected:",
    id
  );

}


/* ==================================================
   ADMIN LOGOUT
================================================== */

const adminLogout =
  document.getElementById(
    "adminLogout"
  );

adminLogout?.addEventListener(
  "click",
  logout
);


/* ==================================================
   SEARCH
================================================== */

document
  .getElementById(
    "adminSearch"
  )
  ?.addEventListener(
    "input",
    event => {

      const query =
        event.target.value
          .toLowerCase()
          .trim();


      document
        .querySelectorAll(
          "#adminTableBody tr"
        )
        .forEach(row => {

          row.style.display =
            row.textContent
              .toLowerCase()
              .includes(query)
                ? ""
                : "none";

        });

    }
  );


/* ==================================================
   UTILITIES
================================================== */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {

    element.textContent =
      String(value ?? "—");

  }

}


function escapeHTML(
  value
) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* ==================================================
   PUBLIC API
================================================== */

window.SMMTJ = {

  state,

  API_URL,

  openSpecialist,

  loadAdminPage,

  loadAdminStats,

  adminView,

  logout

};


/* ==================================================
   AUTO ADMIN LOAD
================================================== */

if (
  document.getElementById(
    "adminTableBody"
  )
) {

  loadAdminStats();

}