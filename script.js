/* =========================================================
   SMM.TJ — script.js
   Real Marketplace Frontend Logic
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
   ========================================================= */

const CONFIG = {
    API_BASE_URL:
        window.SMM_API_URL ||
        "http://localhost:5000/api",

    TOKEN_KEY: "smm_access_token",
    REFRESH_TOKEN_KEY: "smm_refresh_token",
    USER_KEY: "smm_user",

    REQUEST_TIMEOUT: 15000
};

/* =========================================================
   GLOBAL STATE
   ========================================================= */

const state = {
    user: getStoredUser(),

    specialists: [],
    services: [],
    products: [],
    jobs: [],
    projects: [],
    realEstate: [],
    reviews: [],
    notifications: [],
    conversations: [],

    filters: {
        specialist: {},
        marketplace: {},
        jobs: {},
        projects: {},
        realEstate: {}
    },

    currentConversation: null,
    currentMarketplaceTab: "services",
    currentRealEstateTab: "sale"
};

/* =========================================================
   DOM HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

function byId(id) {
    return document.getElementById(id);
}

function safeText(value) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function escapeHTML(value) {
    return safeText(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   STORAGE
   ========================================================= */

function getStoredUser() {
    try {
        const user = localStorage.getItem(CONFIG.USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function saveAuth(data) {
    if (data?.accessToken) {
        localStorage.setItem(
            CONFIG.TOKEN_KEY,
            data.accessToken
        );
    }

    if (data?.refreshToken) {
        localStorage.setItem(
            CONFIG.REFRESH_TOKEN_KEY,
            data.refreshToken
        );
    }

    if (data?.user) {
        localStorage.setItem(
            CONFIG.USER_KEY,
            JSON.stringify(data.user)
        );

        state.user = data.user;
    }
}

function clearAuth() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);

    state.user = null;
}

function getAccessToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

/* =========================================================
   API
   ========================================================= */

async function apiRequest(
    endpoint,
    options = {},
    retry = true
) {
    const controller = new AbortController();

    const timeout = setTimeout(
        () => controller.abort(),
        CONFIG.REQUEST_TIMEOUT
    );

    const token = getAccessToken();

    const headers = {
        Accept: "application/json",
        ...(options.body instanceof FormData
            ? {}
            : {
                  "Content-Type": "application/json"
              }),
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
                signal: controller.signal
            }
        );

        if (
            response.status === 401 &&
            retry &&
            localStorage.getItem(
                CONFIG.REFRESH_TOKEN_KEY
            )
        ) {
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return apiRequest(
                    endpoint,
                    options,
                    false
                );
            }

            clearAuth();
        }

        const contentType =
            response.headers.get("content-type") || "";

        let data = null;

        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message =
                data?.message ||
                data?.error ||
                "Амалиёт иҷро нашуд.";

            throw new Error(
                Array.isArray(message)
                    ? message.join(", ")
                    : message
            );
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}

/* =========================================================
   REFRESH TOKEN
   ========================================================= */

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem(
        CONFIG.REFRESH_TOKEN_KEY
    );

    if (!refreshToken) return false;

    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/auth/refresh`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    refreshToken
                })
            }
        );

        if (!response.ok) return false;

        const data = await response.json();

        if (data.accessToken) {
            localStorage.setItem(
                CONFIG.TOKEN_KEY,
                data.accessToken
            );
        }

        if (data.refreshToken) {
            localStorage.setItem(
                CONFIG.REFRESH_TOKEN_KEY,
                data.refreshToken
            );
        }

        return true;
    } catch {
        return false;
    }
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "info",
    title = null
) {
    const container =
        byId("toastContainer") ||
        $(".toast-container");

    if (!container) return;

    const titles = {
        success: "Муваффақият",
        error: "Хато",
        warning: "Огоҳӣ",
        info: "Маълумот"
    };

    const icons = {
        success: "fa-solid fa-circle-check",
        error: "fa-solid fa-circle-exclamation",
        warning: "fa-solid fa-triangle-exclamation",
        info: "fa-solid fa-circle-info"
    };

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>

        <div>
            <strong>
                ${escapeHTML(title || titles[type] || titles.info)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform =
            "translateX(20px)";

        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* =========================================================
   MODAL SYSTEM
   ========================================================= */

function openModal(id) {
    const modal = byId(id);

    if (!modal) return;

    modal.classList.add("active");
    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = byId(id);

    if (!modal) return;

    modal.classList.remove("active");

    if (!$(".modal.active")) {
        document.body.classList.remove(
            "modal-open"
        );
    }
}

function closeAllModals() {
    $$(".modal.active").forEach(modal =>
        modal.classList.remove("active")
    );

    document.body.classList.remove(
        "modal-open"
    );
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {
    $(".mobile-menu")?.classList.add("active");
}

function closeMobileMenu() {
    $(".mobile-menu")?.classList.remove("active");
}

/* =========================================================
   AUTH UI
   ========================================================= */

function updateAuthUI() {
    const loggedIn = Boolean(state.user);

    const loginButtons = $$(
        '[data-action="login"]'
    );

    loginButtons.forEach(button => {
        button.style.display = loggedIn
            ? "none"
            : "";
    });

    const profileButtons = $$(
        '[data-action="profile"]'
    );

    profileButtons.forEach(button => {
        button.style.display = loggedIn
            ? ""
            : "none";
    });

    const userNameElements = $$(
        "[data-user-name]"
    );

    userNameElements.forEach(el => {
        el.textContent =
            state.user?.firstName ||
            state.user?.username ||
            "Истифодабаранда";
    });

    const userEmailElements = $$(
        "[data-user-email]"
    );

    userEmailElements.forEach(el => {
        el.textContent =
            state.user?.email ||
            state.user?.phone ||
            "";
    });
}

/* =========================================================
   LOGIN
   ========================================================= */

async function login(identifier, password) {
    if (!identifier || !password) {
        showToast(
            "Email ё рақам ва паролро пур кунед.",
            "error"
        );

        return;
    }

    try {
        setButtonLoading(
            "#loginForm button[type='submit']",
            true
        );

        const data = await apiRequest(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify({
                    identifier,
                    email: identifier,
                    phone: identifier,
                    password
                })
            },
            false
        );

        saveAuth(data);

        closeModal("loginModal");

        updateAuthUI();

        showToast(
            "Шумо бомуваффақият ворид шудед.",
            "success"
        );

        await loadInitialData();
    } catch (error) {
        showToast(
            error.message ||
                "Воридшавӣ иҷро нашуд.",
            "error"
        );
    } finally {
        setButtonLoading(
            "#loginForm button[type='submit']",
            false
        );
    }
}

/* =========================================================
   REGISTER
   ========================================================= */

async function register(formData) {
    try {
        setButtonLoading(
            "#registerForm button[type='submit']",
            true
        );

        const data = await apiRequest(
            "/auth/register",
            {
                method: "POST",
                body: JSON.stringify(
                    Object.fromEntries(formData)
                )
            },
            false
        );

        saveAuth(data);

        closeModal("registerModal");

        updateAuthUI();

        showToast(
            "Ҳисоб бомуваффақият сохта шуд.",
            "success"
        );

        await loadInitialData();
    } catch (error) {
        showToast(
            error.message ||
                "Регистрация иҷро нашуд.",
            "error"
        );
    } finally {
        setButtonLoading(
            "#registerForm button[type='submit']",
            false
        );
    }
}

/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {
    try {
        const refreshToken =
            localStorage.getItem(
                CONFIG.REFRESH_TOKEN_KEY
            );

        if (refreshToken) {
            await apiRequest(
                "/auth/logout",
                {
                    method: "POST",
                    body: JSON.stringify({
                        refreshToken
                    })
                },
                false
            );
        }
    } catch {
        // local logout still continues
    }

    clearAuth();

    updateAuthUI();

    closeAllModals();

    showToast(
        "Шумо аз аккаунт баромадед.",
        "success"
    );
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function forgotPassword(identifier) {
    if (!identifier) {
        showToast(
            "Email ё рақамро ворид кунед.",
            "error"
        );

        return;
    }

    try {
        await apiRequest(
            "/auth/forgot-password",
            {
                method: "POST",
                body: JSON.stringify({
                    identifier,
                    email: identifier,
                    phone: identifier
                })
            },
            false
        );

        showToast(
            "Агар аккаунт вуҷуд дошта бошад, маълумоти барқарорсозӣ фиристода мешавад.",
            "success"
        );

        closeModal("forgotPasswordModal");
    } catch (error) {
        showToast(
            error.message ||
                "Амалиёт иҷро нашуд.",
            "error"
        );
    }
}

/* =========================================================
   LOAD INITIAL DATA
   ========================================================= */

async function loadInitialData() {
    await Promise.allSettled([
        loadSpecialists(),
        loadServices(),
        loadProducts(),
        loadJobs(),
        loadProjects(),
        loadRealEstate(),
        loadReviews(),
        loadNotifications()
    ]);

    renderAll();
}

/* =========================================================
   SPECIALISTS
   ========================================================= */

async function loadSpecialists() {
    try {
        const data = await apiRequest(
            "/smm"
        );

        state.specialists =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Specialists:",
            error
        );
    }
}

function renderSpecialists() {
    const container =
        byId("specialistsGrid") ||
        $("#specialistsGrid");

    if (!container) return;

    let items = [...state.specialists];

    const search =
        state.filters.specialist.search
            ?.toLowerCase() || "";

    const region =
        state.filters.specialist.region || "";

    const city =
        state.filters.specialist.city || "";

    const rating =
        Number(
            state.filters.specialist.rating || 0
        );

    if (search) {
        items = items.filter(item => {
            const text = [
                item.name,
                item.firstName,
                item.lastName,
                item.username,
                item.bio,
                item.skills?.join?.(" "),
                item.services?.join?.(" ")
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }

    if (region) {
        items = items.filter(
            item =>
                item.region === region ||
                item.region?.name === region
        );
    }

    if (city) {
        items = items.filter(
            item =>
                item.city === city ||
                item.city?.name === city
        );
    }

    if (rating) {
        items = items.filter(
            item =>
                Number(
                    item.rating ||
                        item.averageRating ||
                        0
                ) >= rating
        );
    }

    if (!items.length) {
        container.innerHTML =
            emptyState(
                "Мутахассис ёфт нашуд",
                "Филтрҳо ё ҷустуҷӯро тағйир диҳед."
            );

        return;
    }

    container.innerHTML = items
        .map(specialistCard)
        .join("");
}

function specialistCard(item) {
    const id =
        item.id ||
        item.userId ||
        "";

    const name =
        item.name ||
        [item.firstName, item.lastName]
            .filter(Boolean)
            .join(" ") ||
        item.username ||
        "SMM Specialist";

    const avatar =
        item.avatar ||
        item.photo ||
        item.image ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

    const rating =
        item.rating ||
        item.averageRating ||
        0;

    const skills =
        Array.isArray(item.skills)
            ? item.skills.slice(0, 5)
            : [];

    return `
        <article class="card specialist-card"
            data-id="${escapeHTML(id)}">

            <div class="specialist-header">

                <img
                    class="specialist-avatar"
                    src="${escapeHTML(avatar)}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                >

                <div class="specialist-info">

                    <div class="specialist-name">
                        ${escapeHTML(name)}

                        ${
                            item.verified
                                ? `<i class="fa-solid fa-circle-check verified"></i>`
                                : ""
                        }
                    </div>

                    <div class="specialist-role">
                        ${escapeHTML(
                            item.title ||
                            item.role ||
                            "SMM Specialist"
                        )}
                    </div>

                    ${
                        item.verified
                            ? `
                            <div class="verified-badge">
                                <i class="fa-solid fa-check"></i>
                                Verified
                            </div>
                            `
                            : ""
                    }

                </div>
            </div>

            <div class="card-meta">
                <span class="meta-item">
                    <i class="fa-solid fa-star"></i>
                    ${Number(rating).toFixed(1)}
                </span>

                <span class="meta-item">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHTML(
                        item.city?.name ||
                        item.city ||
                        "Тоҷикистон"
                    )}
                </span>

                <span class="meta-item">
                    <i class="fa-solid fa-briefcase"></i>
                    ${escapeHTML(
                        item.experience ||
                        "Таҷриба"
                    )}
                </span>
            </div>

            ${
                skills.length
                    ? `
                    <div class="skills">
                        ${skills
                            .map(
                                skill =>
                                    `<span class="skill">
                                        ${escapeHTML(skill)}
                                    </span>`
                            )
                            .join("")}
                    </div>
                    `
                    : ""
            }

            <div class="card-footer">

                <strong class="price">
                    ${formatPrice(
                        item.price ||
                        item.startingPrice ||
                        0
                    )}
                </strong>

                <div class="card-actions">

                    <button
                        class="favorite-btn"
                        data-favorite="${escapeHTML(id)}"
                        title="Ба дӯстдошта"
                    >
                        <i class="fa-regular fa-heart"></i>
                    </button>

                    <button
                        class="btn btn-primary btn-small"
                        data-specialist="${escapeHTML(id)}"
                    >
                        Дидан
                    </button>

                </div>

            </div>
        </article>
    `;
}

/* =========================================================
   SERVICES
   ========================================================= */

async function loadServices() {
    try {
        const data = await apiRequest(
            "/services"
        );

        state.services =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Services:",
            error
        );
    }
}

function renderServices() {
    const container =
        byId("servicesGrid");

    if (!container) return;

    const items = filterMarketplace(
        state.services
    );

    container.innerHTML = items.length
        ? items.map(serviceCard).join("")
        : emptyState(
              "Хизмат ёфт нашуд",
              "Ҳоло хизматрасонӣ мавҷуд нест."
          );
}

function serviceCard(item) {
    const id = item.id || "";

    return `
        <article class="card">

            ${
                item.image
                    ? `
                    <img
                        class="card-image"
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(item.title || "Service")}"
                        loading="lazy"
                    >
                    `
                    : `
                    <div class="card-image"></div>
                    `
            }

            <div class="card-body">

                <div class="card-top">
                    <h3 class="card-title">
                        ${escapeHTML(
                            item.title ||
                            item.name ||
                            "Хизмат"
                        )}
                    </h3>

                    <span class="rating">
                        <i class="fa-solid fa-star"></i>
                        ${Number(
                            item.rating || 0
                        ).toFixed(1)}
                    </span>
                </div>

                <p class="card-description">
                    ${escapeHTML(
                        item.description ||
                        ""
                    )}
                </p>

                <div class="card-meta">

                    <span class="meta-item">
                        <i class="fa-solid fa-user"></i>
                        ${escapeHTML(
                            item.seller?.name ||
                            item.specialist?.name ||
                            item.user?.name ||
                            "Мутахассис"
                        )}
                    </span>

                    <span class="meta-item">
                        <i class="fa-solid fa-location-dot"></i>
                        ${escapeHTML(
                            item.city?.name ||
                            item.city ||
                            "Тоҷикистон"
                        )}
                    </span>

                </div>

                <div class="card-footer">

                    <strong class="price">
                        ${formatPrice(
                            item.price || 0
                        )}
                    </strong>

                    <button
                        class="btn btn-primary btn-small"
                        data-service="${escapeHTML(id)}"
                    >
                        Фармоиш
                    </button>

                </div>

            </div>
        </article>
    `;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {
    try {
        const data = await apiRequest(
            "/products"
        );

        state.products =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Products:",
            error
        );
    }
}

function renderProducts() {
    const container =
        byId("productsGrid");

    if (!container) return;

    const items = filterMarketplace(
        state.products
    );

    container.innerHTML = items.length
        ? items.map(productCard).join("")
        : emptyState(
              "Маҳсулот ёфт нашуд",
              "Ҳоло маҳсулот мавҷуд нест."
          );
}

function productCard(item) {
    const id = item.id || "";

    return `
        <article class="card">

            ${
                item.image
                    ? `
                    <img
                        class="card-image"
                        src="${escapeHTML(item.image)}"
                        alt="${escapeHTML(
                            item.title ||
                            item.name ||
                            "Product"
                        )}"
                        loading="lazy"
                    >
                    `
                    : `<div class="card-image"></div>`
            }

            <div class="card-body">

                <h3 class="card-title">
                    ${escapeHTML(
                        item.title ||
                        item.name ||
                        "Маҳсулот"
                    )}
                </h3>

                <p class="card-description">
                    ${escapeHTML(
                        item.description ||
                        ""
                    )}
                </p>

                <div class="card-meta">

                    <span class="meta-item">
                        <i class="fa-solid fa-store"></i>
                        ${escapeHTML(
                            item.seller?.businessName ||
                            item.seller?.name ||
                            "Фурӯшанда"
                        )}
                    </span>

                    <span class="meta-item">
                        <i class="fa-solid fa-location-dot"></i>
                        ${escapeHTML(
                            item.city?.name ||
                            item.city ||
                            "Тоҷикистон"
                        )}
                    </span>

                </div>

                <div class="card-footer">

                    <strong class="price">
                        ${formatPrice(
                            item.price || 0
                        )}
                    </strong>

                    <button
                        class="btn btn-primary btn-small"
                        data-product="${escapeHTML(id)}"
                    >
                        Харидан
                    </button>

                </div>

            </div>
        </article>
    `;
}

/* =========================================================
   MARKETPLACE FILTER
   ========================================================= */

function filterMarketplace(items) {
    let result = [...items];

    const filters =
        state.filters.marketplace;

    const search =
        filters.search?.toLowerCase() || "";

    if (search) {
        result = result.filter(item => {
            const text = [
                item.title,
                item.name,
                item.description,
                item.category?.name,
                item.region,
                item.city
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }

    if (filters.category) {
        result = result.filter(
            item =>
                item.category ===
                    filters.category ||
                item.category?.name ===
                    filters.category
        );
    }

    if (filters.region) {
        result = result.filter(
            item =>
                item.region ===
                    filters.region ||
                item.region?.name ===
                    filters.region
        );
    }

    if (filters.city) {
        result = result.filter(
            item =>
                item.city === filters.city ||
                item.city?.name ===
                    filters.city
        );
    }

    if (filters.maxPrice) {
        result = result.filter(
            item =>
                Number(item.price || 0) <=
                Number(filters.maxPrice)
        );
    }

    return result;
}

/* =========================================================
   JOBS
   ========================================================= */

async function loadJobs() {
    try {
        const data = await apiRequest(
            "/jobs"
        );

        state.jobs =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Jobs:",
            error
        );
    }
}

function renderJobs() {
    const container =
        byId("jobsGrid");

    if (!container) return;

    let items = [...state.jobs];

    const filters = state.filters.jobs;

    if (filters.search) {
        const search =
            filters.search.toLowerCase();

        items = items.filter(item =>
            [
                item.title,
                item.company,
                item.description,
                item.skills?.join?.(" ")
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }

    if (filters.region) {
        items = items.filter(
            item =>
                item.region ===
                    filters.region ||
                item.region?.name ===
                    filters.region
        );
    }

    if (filters.city) {
        items = items.filter(
            item =>
                item.city === filters.city ||
                item.city?.name ===
                    filters.city
        );
    }

    container.innerHTML = items.length
        ? items.map(jobCard).join("")
        : emptyState(
              "Вакансия ёфт нашуд",
              "Ҳоло мувофиқи филтрҳо кор ёфт нашуд."
          );
}

function jobCard(item) {
    const id = item.id || "";

    const skills = Array.isArray(
        item.skills
    )
        ? item.skills.slice(0, 5)
        : [];

    return `
        <article class="card job-card">

            <div class="job-header">

                <div class="job-company">

                    <div class="company-logo">
                        <i class="fa-solid fa-building"></i>
                    </div>

                    <div>
                        <h3 class="job-title">
                            ${escapeHTML(
                                item.title ||
                                "Вакансия"
                            )}
                        </h3>

                        <div class="job-company-name">
                            ${escapeHTML(
                                item.company ||
                                item.companyName ||
                                "Компания"
                            )}
                        </div>
                    </div>

                </div>

                <span class="job-type">
                    ${escapeHTML(
                        item.employmentType ||
                        item.type ||
                        "Full-time"
                    )}
                </span>

            </div>

            <p class="job-description">
                ${escapeHTML(
                    item.description ||
                    ""
                )}
            </p>

            ${
                skills.length
                    ? `
                    <div class="job-skills">
                        ${skills
                            .map(
                                skill =>
                                    `<span class="job-skill">
                                        ${escapeHTML(skill)}
                                    </span>`
                            )
                            .join("")}
                    </div>
                    `
                    : ""
            }

            <div class="card-meta">

                <span class="meta-item">
                    <i class="fa-solid fa-location-dot"></i>
                    ${escapeHTML(
                        item.city?.name ||
                        item.city ||
                        "Тоҷикистон"
                    )}
                </span>

                <span class="meta-item">
                    <i class="fa-solid fa-user-tie"></i>
                    ${escapeHTML(
                        item.experience ||
                        "Таҷриба лозим"
                    )}
                </span>

            </div>

            <div class="job-footer">

                <strong class="salary">
                    ${formatPrice(
                        item.salaryMin ||
                        item.salary ||
                        0
                    )}
                </strong>

                <button
                    class="btn btn-primary btn-small"
                    data-job="${escapeHTML(id)}"
                >
                    Ариза додан
                </button>

            </div>

        </article>
    `;
}

/* =========================================================
   PROJECTS
   ========================================================= */

async function loadProjects() {
    try {
        const data = await apiRequest(
            "/projects"
        );

        state.projects =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Projects:",
            error
        );
    }
}

function renderProjects() {
    const container =
        byId("projectsGrid");

    if (!container) return;

    let items = [...state.projects];

    const filters =
        state.filters.projects;

    if (filters.search) {
        const search =
            filters.search.toLowerCase();

        items = items.filter(item =>
            [
                item.title,
                item.description,
                item.category?.name
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }

    if (filters.status) {
        items = items.filter(
            item =>
                item.status ===
                filters.status
        );
    }

    container.innerHTML = items.length
        ? items.map(projectCard).join("")
        : emptyState(
              "Лоиҳа ёфт нашуд",
              "Ҳоло лоиҳаи мувофиқ вуҷуд надорад."
          );
}

function projectCard(item) {
    const id = item.id || "";

    const statusClass =
        String(item.status || "OPEN")
            .toLowerCase();

    return `
        <article class="card project-card">

            <div class="job-header">

                <div>
                    <h3 class="card-title">
                        ${escapeHTML(
                            item.title ||
                            "Лоиҳа"
                        )}
                    </h3>

                    <div class="card-meta">

                        <span class="meta-item">
                            <i class="fa-solid fa-layer-group"></i>
                            ${escapeHTML(
                                item.category?.name ||
                                item.category ||
                                "Категория"
                            )}
                        </span>

                        <span class="meta-item">
                            <i class="fa-solid fa-location-dot"></i>
                            ${escapeHTML(
                                item.city?.name ||
                                item.city ||
                                "Тоҷикистон"
                            )}
                        </span>

                    </div>
                </div>

                <span class="project-status ${escapeHTML(
                    statusClass
                )}">
                    ${escapeHTML(
                        projectStatusText(
                            item.status
                        )
                    )}
                </span>

            </div>

            <p class="card-description">
                ${escapeHTML(
                    item.description ||
                    ""
                )}
            </p>

            <div class="project-footer">

                <strong class="project-budget">
                    ${formatPrice(
                        item.budget ||
                        item.price ||
                        0
                    )}
                </strong>

                <button
                    class="btn btn-primary btn-small"
                    data-project="${escapeHTML(id)}"
                >
                    Дидан
                </button>

            </div>

        </article>
    `;
}

function projectStatusText(status) {
    const map = {
        OPEN: "Кушода",
        IN_PROGRESS: "Дар иҷро",
        COMPLETED: "Анҷом ёфт",
        CANCELLED: "Бекор шуд"
    };

    return (
        map[status] ||
        status ||
        "Кушода"
    );
}

/* =========================================================
   REAL ESTATE
   ========================================================= */

async function loadRealEstate() {
    try {
        const data = await apiRequest(
            "/real-estate"
        );

        state.realEstate =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Real estate:",
            error
        );
    }
}

function renderRealEstate() {
    const container =
        byId("realEstateGrid");

    if (!container) return;

    let items = [
        ...state.realEstate
    ];

    const filters =
        state.filters.realEstate;

    items = items.filter(item => {
        const type =
            item.type ||
            item.dealType ||
            "sale";

        if (
            state.currentRealEstateTab &&
            type.toLowerCase() !==
                state.currentRealEstateTab
        ) {
            return false;
        }

        return true;
    });

    if (filters.search) {
        const search =
            filters.search.toLowerCase();

        items = items.filter(item =>
            [
                item.title,
                item.description,
                item.address,
                item.city
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(search)
        );
    }

    if (filters.city) {
        items = items.filter(
            item =>
                item.city === filters.city ||
                item.city?.name ===
                    filters.city
        );
    }

    if (filters.maxPrice) {
        items = items.filter(
            item =>
                Number(item.price || 0) <=
                Number(filters.maxPrice)
        );
    }

    container.innerHTML = items.length
        ? items
              .map(realEstateCard)
              .join("")
        : emptyState(
              "Эълон ёфт нашуд",
              "Ҳоло чунин эълон вуҷуд надорад."
          );
}

function realEstateCard(item) {
    const id = item.id || "";

    const image =
        item.image ||
        item.images?.[0] ||
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80";

    return `
        <article
            class="card real-estate-card"
            data-id="${escapeHTML(id)}"
        >

            <div style="position:relative">

                <img
                    class="card-image"
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                        item.title ||
                        "Real Estate"
                    )}"
                    loading="lazy"
                >

                <span class="property-type">
                    ${escapeHTML(
                        item.propertyType ||
                        item.type ||
                        "Амвол"
                    )}
                </span>

            </div>

            <div class="card-body">

                <div class="card-top">

                    <h3 class="card-title">
                        ${escapeHTML(
                            item.title ||
                            "Амволи ғайриманқул"
                        )}
                    </h3>

                    <strong class="property-price">
                        ${formatPrice(
                            item.price || 0
                        )}
                    </strong>

                </div>

                <p class="card-description">
                    ${escapeHTML(
                        item.description ||
                        ""
                    )}
                </p>

                <div class="property-details">

                    <div class="property-detail">
                        <strong>
                            ${escapeHTML(
                                item.rooms || "-"
                            )}
                        </strong>
                        <span>Ҳуҷра</span>
                    </div>

                    <div class="property-detail">
                        <strong>
                            ${escapeHTML(
                                item.area || "-"
                            )}
                        </strong>
                        <span>м²</span>
                    </div>

                    <div class="property-detail">
                        <strong>
                            ${escapeHTML(
                                item.floor || "-"
                            )}
                        </strong>
                        <span>Ошёна</span>
                    </div>

                </div>

                <div class="card-footer">

                    <span class="meta-item">
                        <i class="fa-solid fa-location-dot"></i>
                        ${escapeHTML(
                            item.city?.name ||
                            item.city ||
                            item.address ||
                            "Тоҷикистон"
                        )}
                    </span>

                    <button
                        class="btn btn-primary btn-small"
                        data-realestate="${escapeHTML(id)}"
                    >
                        Дидан
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   REVIEWS
   ========================================================= */

async function loadReviews() {
    try {
        const data = await apiRequest(
            "/reviews"
        );

        state.reviews =
            normalizeList(data);
    } catch (error) {
        console.error(
            "Reviews:",
            error
        );
    }
}

function renderReviews() {
    const container =
        byId("reviewsGrid");

    if (!container) return;

    container.innerHTML = state.reviews
        .slice(0, 6)
        .map(reviewCard)
        .join("");
}

function reviewCard(item) {
    const rating = Math.min(
        5,
        Math.max(
            0,
            Number(item.rating || 0)
        )
    );

    const stars = Array.from(
        { length: 5 },
        (_, index) =>
            index < rating
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-regular fa-star"></i>'
    ).join("");

    const user =
        item.user ||
        item.author ||
        {};

    return `
        <article class="review-card">

            <div class="review-stars">
                ${stars}
            </div>

            <p class="review-text">
                “${escapeHTML(
                    item.comment ||
                    item.text ||
                    ""
                )}”
            </p>

            <div class="review-author">

                <img
                    class="review-avatar"
                    src="${escapeHTML(
                        user.avatar ||
                        item.avatar ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                    )}"
                    alt=""
                    loading="lazy"
                >

                <div>
                    <strong>
                        ${escapeHTML(
                            user.name ||
                            user.firstName ||
                            item.name ||
                            "Истифодабаранда"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.role ||
                            "Мизоҷи SMM.TJ"
                        )}
                    </span>
                </div>

            </div>

        </article>
    `;
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

async function loadNotifications() {
    if (!state.user) return;

    try {
        const data =
            await apiRequest(
                "/notifications"
            );

        state.notifications =
            normalizeList(data);

        renderNotifications();

        updateNotificationCount();
    } catch (error) {
        console.error(
            "Notifications:",
            error
        );
    }
}

function renderNotifications() {
    const container =
        byId("notificationsList");

    if (!container) return;

    if (!state.notifications.length) {
        container.innerHTML =
            emptyState(
                "Огоҳӣ нест",
                "Ҳоло огоҳии нав надоред."
            );

        return;
    }

    container.innerHTML =
        state.notifications
            .map(notification => {
                return `
                    <div class="notification-item ${
                        notification.read
                            ? ""
                            : "unread"
                    }">

                        <div class="notification-icon">
                            <i class="fa-solid fa-bell"></i>
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(
                                    notification.title ||
                                    "Огоҳӣ"
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    notification.message ||
                                    ""
                                )}
                            </p>

                            <div class="notification-time">
                                ${formatDate(
                                    notification.createdAt
                                )}
                            </div>
                        </div>

                    </div>
                `;
            })
            .join("");
}

function updateNotificationCount() {
    const count =
        state.notifications.filter(
            notification =>
                !notification.read
        ).length;

    $$(".notification-count").forEach(
        element => {
            element.textContent =
                count > 99 ? "99+" : count;

            element.style.display = count
                ? "grid"
                : "none";
        }
    );
}

/* =========================================================
   CREATE PROJECT
   ========================================================= */

async function createProject(form) {
    if (!state.user) {
        showToast(
            "Аввал ба аккаунт ворид шавед.",
            "warning"
        );

        closeModal("createProjectModal");
        openModal("loginModal");

        return;
    }

    const data = Object.fromEntries(
        new FormData(form)
    );

    try {
        setButtonLoading(
            "#createProjectForm button[type='submit']",
            true
        );

        const project =
            await apiRequest(
                "/projects",
                {
                    method: "POST",
                    body: JSON.stringify(data)
                }
            );

        state.projects.unshift(project);

        form.reset();

        closeModal(
            "createProjectModal"
        );

        renderProjects();

        showToast(
            "Лоиҳа бомуваффақият сохта шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Лоиҳа сохта нашуд.",
            "error"
        );
    } finally {
        setButtonLoading(
            "#createProjectForm button[type='submit']",
            false
        );
    }
}

/* =========================================================
   ADD SERVICE
   ========================================================= */

async function createService(form) {
    if (!requireAuth()) return;

    const data = Object.fromEntries(
        new FormData(form)
    );

    try {
        const service =
            await apiRequest(
                "/services",
                {
                    method: "POST",
                    body: JSON.stringify(data)
                }
            );

        state.services.unshift(service);

        form.reset();

        closeModal("addServiceModal");

        renderServices();

        showToast(
            "Хизмат сохта шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Хизмат сохта нашуд.",
            "error"
        );
    }
}

/* =========================================================
   ADD PRODUCT
   ========================================================= */

async function createProduct(form) {
    if (!requireAuth()) return;

    const data = Object.fromEntries(
        new FormData(form)
    );

    try {
        const product =
            await apiRequest(
                "/products",
                {
                    method: "POST",
                    body: JSON.stringify(data)
                }
            );

        state.products.unshift(product);

        form.reset();

        closeModal("addProductModal");

        renderProducts();

        showToast(
            "Маҳсулот сохта шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Маҳсулот сохта нашуд.",
            "error"
        );
    }
}

/* =========================================================
   ADD REAL ESTATE
   ========================================================= */

async function createRealEstate(form) {
    if (!requireAuth()) return;

    const data = Object.fromEntries(
        new FormData(form)
    );

    try {
        const listing =
            await apiRequest(
                "/real-estate",
                {
                    method: "POST",
                    body: JSON.stringify(data)
                }
            );

        state.realEstate.unshift(
            listing
        );

        form.reset();

        closeModal(
            "addRealEstateModal"
        );

        renderRealEstate();

        showToast(
            "Эълони амвол сохта шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Эълон сохта нашуд.",
            "error"
        );
    }
}

/* =========================================================
   FAVORITES
   ========================================================= */

async function toggleFavorite(
    type,
    itemId,
    button
) {
    if (!requireAuth()) return;

    try {
        const active =
            button.classList.contains(
                "active"
            );

        if (active) {
            await apiRequest(
                `/favorites/${encodeURIComponent(
                    itemId
                )}`,
                {
                    method: "DELETE"
                }
            );

            button.classList.remove(
                "active"
            );

            button.innerHTML =
                '<i class="fa-regular fa-heart"></i>';

            showToast(
                "Аз дӯстдоштаҳо хориҷ шуд.",
                "success"
            );
        } else {
            await apiRequest(
                "/favorites",
                {
                    method: "POST",
                    body: JSON.stringify({
                        itemId,
                        type
                    })
                }
            );

            button.classList.add(
                "active"
            );

            button.innerHTML =
                '<i class="fa-solid fa-heart"></i>';

            showToast(
                "Ба дӯстдоштаҳо илова шуд.",
                "success"
            );
        }
    } catch (error) {
        showToast(
            error.message ||
                "Амалиёт иҷро нашуд.",
            "error"
        );
    }
}

/* =========================================================
   APPLY TO JOB
   ========================================================= */

async function applyToJob(jobId) {
    if (!requireAuth()) return;

    try {
        await apiRequest(
            "/applications",
            {
                method: "POST",
                body: JSON.stringify({
                    jobId
                })
            }
        );

        showToast(
            "Аризаи шумо фиристода шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Ариза фиристода нашуд.",
            "error"
        );
    }
}

/* =========================================================
   PROPOSAL
   ========================================================= */

async function sendProposal(
    projectId,
    message,
    price,
    deliveryTime
) {
    if (!requireAuth()) return;

    try {
        await apiRequest(
            "/proposals",
            {
                method: "POST",
                body: JSON.stringify({
                    projectId,
                    message,
                    price,
                    deliveryTime
                })
            }
        );

        showToast(
            "Пешниҳоди шумо фиристода шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Пешниҳод фиристода нашуд.",
            "error"
        );
    }
}

/* =========================================================
   CHAT
   ========================================================= */

async function loadConversations() {
    if (!state.user) return;

    try {
        const data =
            await apiRequest(
                "/messages/conversations"
            );

        state.conversations =
            normalizeList(data);

        renderConversations();
    } catch (error) {
        console.error(
            "Conversations:",
            error
        );
    }
}

function renderConversations() {
    const container =
        byId("conversationList");

    if (!container) return;

    if (!state.conversations.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-comments"></i>
                <h3>Чатҳо нестанд</h3>
                <p>
                    Барои оғози чат ба корбар муроҷиат кунед.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        state.conversations
            .map(conversation => {
                const user =
                    conversation.user ||
                    conversation.otherUser ||
                    {};

                return `
                    <div
                        class="conversation"
                        data-conversation="${
                            escapeHTML(
                                conversation.id
                            )
                        }"
                    >

                        <img
                            class="conversation-avatar"
                            src="${escapeHTML(
                                user.avatar ||
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                            )}"
                            alt=""
                        >

                        <div class="conversation-info">

                            <div class="conversation-top">

                                <strong>
                                    ${escapeHTML(
                                        user.name ||
                                        user.username ||
                                        "Истифодабаранда"
                                    )}
                                </strong>

                                <span>
                                    ${formatDate(
                                        conversation.updatedAt
                                    )}
                                </span>

                            </div>

                            <p>
                                ${escapeHTML(
                                    conversation.lastMessage ||
                                    ""
                                )}
                            </p>

                        </div>

                    </div>
                `;
            })
            .join("");
}

async function openConversation(
    conversationId
) {
    try {
        const data =
            await apiRequest(
                `/messages/conversations/${encodeURIComponent(
                    conversationId
                )}`
            );

        state.currentConversation =
            data;

        renderChatMessages(
            normalizeList(
                data.messages
            )
        );

        const name =
            data.otherUser?.name ||
            data.user?.name ||
            "Чат";

        const title =
            byId("chatUserName");

        if (title) {
            title.textContent = name;
        }
    } catch (error) {
        showToast(
            error.message ||
                "Чат кушода нашуд.",
            "error"
        );
    }
}

function renderChatMessages(messages) {
    const container =
        byId("chatMessages");

    if (!container) return;

    container.innerHTML = messages
        .map(message => {
            const sent =
                message.senderId ===
                state.user?.id;

            return `
                <div class="message ${
                    sent ? "sent" : ""
                }">

                    ${escapeHTML(
                        message.content ||
                        message.text ||
                        ""
                    )}

                    <span class="message-time">
                        ${formatDate(
                            message.createdAt
                        )}
                    </span>

                </div>
            `;
        })
        .join("");

    container.scrollTop =
        container.scrollHeight;
}

async function sendMessage(content) {
    if (!requireAuth()) return;

    if (!state.currentConversation) {
        showToast(
            "Аввал чат интихоб кунед.",
            "warning"
        );

        return;
    }

    if (!content.trim()) return;

    try {
        const message =
            await apiRequest(
                "/messages",
                {
                    method: "POST",
                    body: JSON.stringify({
                        conversationId:
                            state.currentConversation
                                .id,
                        content
                    })
                }
            );

        const current =
            state.currentConversation
                .messages || [];

        current.push(message);

        renderChatMessages(
            current
        );
    } catch (error) {
        showToast(
            error.message ||
                "Паём фиристода нашуд.",
            "error"
        );
    }
}

/* =========================================================
   SEARCH
   ========================================================= */

function performGlobalSearch(query) {
    const clean =
        query.trim().toLowerCase();

    if (!clean) return;

    const sections = [
        "#specialists",
        "#marketplace",
        "#jobs",
        "#projects",
        "#real-estate"
    ];

    const searchable =
        [
            ...state.specialists,
            ...state.services,
            ...state.products,
            ...state.jobs,
            ...state.projects,
            ...state.realEstate
        ];

    const found = searchable.filter(
        item =>
            [
                item.title,
                item.name,
                item.description,
                item.bio
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(clean)
    );

    renderSearchResults(found);

    if (found.length) {
        document
            .querySelector("#searchResults")
            ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    }
}

function renderSearchResults(items) {
    const container =
        byId("searchResults");

    if (!container) return;

    container.innerHTML = items
        .slice(0, 20)
        .map(item => {
            return `
                <div class="search-result">

                    <div class="notification-icon">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>

                    <div>
                        <strong>
                            ${escapeHTML(
                                item.title ||
                                item.name ||
                                "Натиҷа"
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                item.description ||
                                item.bio ||
                                ""
                            )}
                        </p>
                    </div>

                </div>
            `;
        })
        .join("");

    if (!items.length) {
        container.innerHTML =
            emptyState(
                "Натиҷа нест",
                "Ягон маълумоти мувофиқ ёфт нашуд."
            );
    }
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupEvents() {
    document.addEventListener(
        "click",
        handleGlobalClick
    );

    document.addEventListener(
        "submit",
        handleSubmit
    );

    document.addEventListener(
        "input",
        handleInput
    );

    document.addEventListener(
        "change",
        handleChange
    );

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeAllModals();
                closeMobileMenu();
            }
        }
    );
}

/* =========================================================
   GLOBAL CLICK
   ========================================================= */

function handleGlobalClick(event) {
    const target =
        event.target.closest(
            "[data-action], [data-specialist], [data-service], [data-product], [data-job], [data-project], [data-realestate], [data-favorite], [data-conversation], [data-modal-close]"
        );

    if (!target) return;

    const action =
        target.dataset.action;

    if (action === "login") {
        openModal("loginModal");
        return;
    }

    if (action === "register") {
        openModal("registerModal");
        return;
    }

    if (action === "forgot-password") {
        closeModal("loginModal");
        openModal(
            "forgotPasswordModal"
        );
        return;
    }

    if (action === "logout") {
        logout();
        return;
    }

    if (action === "profile") {
        openModal("profileModal");
        return;
    }

    if (action === "notifications") {
        openModal(
            "notificationsModal"
        );
        return;
    }

    if (action === "chat") {
        openModal("chatModal");
        loadConversations();
        return;
    }

    if (action === "mobile-menu") {
        openMobileMenu();
        return;
    }

    if (action === "close-mobile-menu") {
        closeMobileMenu();
        return;
    }

    if (action === "close-modal") {
        closeModal(
            target.dataset.modal ||
                target.closest(".modal")?.id
        );
        return;
    }

    if (action === "search") {
        openModal("searchModal");
        setTimeout(
            () =>
                $("#globalSearch")?.focus(),
            100
        );
        return;
    }

    if (action === "create-project") {
        if (!requireAuth()) return;

        openModal(
            "createProjectModal"
        );

        return;
    }

    if (action === "add-service") {
        if (!requireAuth()) return;

        openModal("addServiceModal");

        return;
    }

    if (action === "add-product") {
        if (!requireAuth()) return;

        openModal("addProductModal");

        return;
    }

    if (action === "add-realestate") {
        if (!requireAuth()) return;

        openModal(
            "addRealEstateModal"
        );

        return;
    }

    if (action === "switch-login") {
        closeModal("registerModal");
        openModal("loginModal");
        return;
    }

    if (action === "switch-register") {
        closeModal("loginModal");
        openModal("registerModal");
        return;
    }

    if (action === "switch-forgot") {
        closeModal("loginModal");
        openModal(
            "forgotPasswordModal"
        );
        return;
    }

    if (target.dataset.specialist) {
        openSpecialist(
            target.dataset.specialist
        );
        return;
    }

    if (target.dataset.service) {
        orderService(
            target.dataset.service
        );
        return;
    }

    if (target.dataset.product) {
        orderProduct(
            target.dataset.product
        );
        return;
    }

    if (target.dataset.job) {
        applyToJob(
            target.dataset.job
        );
        return;
    }

    if (target.dataset.project) {
        openProject(
            target.dataset.project
        );
        return;
    }

    if (target.dataset.realestate) {
        openRealEstate(
            target.dataset.realestate
        );
        return;
    }

    if (target.dataset.favorite) {
        toggleFavorite(
            "specialist",
            target.dataset.favorite,
            target
        );
        return;
    }

    if (target.dataset.conversation) {
        openConversation(
            target.dataset.conversation
        );
    }
}

/* =========================================================
   SUBMIT HANDLER
   ========================================================= */

function handleSubmit(event) {
    const form = event.target;

    if (!form.matches("form")) return;

    event.preventDefault();

    const id = form.id;

    if (id === "loginForm") {
        const data = new FormData(form);

        login(
            data.get("identifier") ||
                data.get("email") ||
                data.get("phone"),
            data.get("password")
        );

        return;
    }

    if (id === "registerForm") {
        const data = new FormData(form);

        const password =
            data.get("password");

        const confirmPassword =
            data.get("confirmPassword") ||
            data.get("passwordConfirm");

        if (
            confirmPassword &&
            password !== confirmPassword
        ) {
            showToast(
                "Паролҳо мувофиқат намекунанд.",
                "error"
            );

            return;
        }

        register(data);

        return;
    }

    if (id === "forgotPasswordForm") {
        const data = new FormData(form);

        forgotPassword(
            data.get("identifier") ||
                data.get("email") ||
                data.get("phone")
        );

        return;
    }

    if (id === "createProjectForm") {
        createProject(form);
        return;
    }

    if (id === "addServiceForm") {
        createService(form);
        return;
    }

    if (id === "addProductForm") {
        createProduct(form);
        return;
    }

    if (id === "addRealEstateForm") {
        createRealEstate(form);
        return;
    }

    if (id === "chatInputForm") {
        const data =
            new FormData(form);

        sendMessage(
            data.get("message") || ""
        );

        form.reset();
    }
}

/* =========================================================
   INPUT HANDLER
   ========================================================= */

function handleInput(event) {
    const input = event.target;

    if (
        input.matches(
            "#globalSearch, [data-global-search]"
        )
    ) {
        performGlobalSearch(
            input.value
        );

        return;
    }

    if (
        input.matches(
            "[data-specialist-search]"
        )
    ) {
        state.filters.specialist.search =
            input.value;

        renderSpecialists();

        return;
    }

    if (
        input.matches(
            "[data-marketplace-search]"
        )
    ) {
        state.filters.marketplace.search =
            input.value;

        renderServices();
        renderProducts();

        return;
    }

    if (
        input.matches("[data-job-search]")
    ) {
        state.filters.jobs.search =
            input.value;

        renderJobs();

        return;
    }

    if (
        input.matches(
            "[data-project-search]"
        )
    ) {
        state.filters.projects.search =
            input.value;

        renderProjects();

        return;
    }

    if (
        input.matches(
            "[data-realestate-search]"
        )
    ) {
        state.filters.realEstate.search =
            input.value;

        renderRealEstate();
    }
}

/* =========================================================
   CHANGE HANDLER
   ========================================================= */

function handleChange(event) {
    const element =
        event.target;

    if (
        element.matches(
            "[data-specialist-region]"
        )
    ) {
        state.filters.specialist.region =
            element.value;

        renderSpecialists();
    }

    if (
        element.matches(
            "[data-specialist-city]"
        )
    ) {
        state.filters.specialist.city =
            element.value;

        renderSpecialists();
    }

    if (
        element.matches(
            "[data-specialist-rating]"
        )
    ) {
        state.filters.specialist.rating =
            element.value;

        renderSpecialists();
    }

    if (
        element.matches(
            "[data-marketplace-category]"
        )
    ) {
        state.filters.marketplace.category =
            element.value;

        renderServices();
        renderProducts();
    }

    if (
        element.matches(
            "[data-marketplace-region]"
        )
    ) {
        state.filters.marketplace.region =
            element.value;

        renderServices();
        renderProducts();
    }

    if (
        element.matches(
            "[data-marketplace-city]"
        )
    ) {
        state.filters.marketplace.city =
            element.value;

        renderServices();
        renderProducts();
    }

    if (
        element.matches(
            "[data-marketplace-max-price]"
        )
    ) {
        state.filters.marketplace.maxPrice =
            element.value;

        renderServices();
        renderProducts();
    }

    if (
        element.matches("[data-job-region]")
    ) {
        state.filters.jobs.region =
            element.value;

        renderJobs();
    }

    if (
        element.matches("[data-job-city]")
    ) {
        state.filters.jobs.city =
            element.value;

        renderJobs();
    }

    if (
        element.matches(
            "[data-project-status]"
        )
    ) {
        state.filters.projects.status =
            element.value;

        renderProjects();
    }

    if (
        element.matches(
            "[data-realestate-city]"
        )
    ) {
        state.filters.realEstate.city =
            element.value;

        renderRealEstate();
    }

    if (
        element.matches(
            "[data-realestate-max-price]"
        )
    ) {
        state.filters.realEstate.maxPrice =
            element.value;

        renderRealEstate();
    }
}

/* =========================================================
   MARKETPLACE TABS
   ========================================================= */

function switchMarketplaceTab(tab) {
    state.currentMarketplaceTab =
        tab;

    $$(".marketplace-tab").forEach(
        button => {
            button.classList.toggle(
                "active",
                button.dataset.tab === tab
            );
        }
    );

    const servicesGrid =
        byId("servicesGrid");

    const productsGrid =
        byId("productsGrid");

    if (servicesGrid) {
        servicesGrid.style.display =
            tab === "services"
                ? "grid"
                : "none";
    }

    if (productsGrid) {
        productsGrid.style.display =
            tab === "products"
                ? "grid"
                : "none";
    }
}

/* =========================================================
   REAL ESTATE TABS
   ========================================================= */

function switchRealEstateTab(tab) {
    state.currentRealEstateTab =
        tab;

    $$(".real-estate-tab").forEach(
        button => {
            button.classList.toggle(
                "active",
                button.dataset.tab === tab
            );
        }
    );

    renderRealEstate();
}

/* =========================================================
   SPECIALIST DETAILS
   ========================================================= */

async function openSpecialist(id) {
    try {
        const specialist =
            await apiRequest(
                `/smm/${encodeURIComponent(
                    id
                )}`
            );

        renderProfileData(
            specialist
        );

        openModal("profileModal");
    } catch {
        const specialist =
            state.specialists.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (specialist) {
            renderProfileData(
                specialist
            );

            openModal(
                "profileModal"
            );
        } else {
            showToast(
                "Профили мутахассис ёфт нашуд.",
                "error"
            );
        }
    }
}

function renderProfileData(profile) {
    $$("[data-profile-name]").forEach(
        element => {
            element.textContent =
                profile.name ||
                [
                    profile.firstName,
                    profile.lastName
                ]
                    .filter(Boolean)
                    .join(" ") ||
                profile.username ||
                "Мутахассис";
        }
    );

    $$("[data-profile-bio]").forEach(
        element => {
            element.textContent =
                profile.bio || "";
        }
    );

    $$("[data-profile-avatar]").forEach(
        element => {
            element.src =
                profile.avatar ||
                profile.photo ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";
        }
    );
}

/* =========================================================
   PROJECT DETAILS
   ========================================================= */

async function openProject(id) {
    try {
        const project =
            await apiRequest(
                `/projects/${encodeURIComponent(
                    id
                )}`
            );

        showToast(
            project.description ||
                project.title ||
                "Лоиҳа",
            "info",
            project.title ||
                "Лоиҳа"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Лоиҳа ёфт нашуд.",
            "error"
        );
    }
}

/* =========================================================
   REAL ESTATE DETAILS
   ========================================================= */

async function openRealEstate(id) {
    try {
        const listing =
            await apiRequest(
                `/real-estate/${encodeURIComponent(
                    id
                )}`
            );

        showToast(
            listing.description ||
                "Маълумоти эълон.",
            "info",
            listing.title ||
                "Амвол"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Эълон ёфт нашуд.",
            "error"
        );
    }
}

/* =========================================================
   SERVICE ORDER
   ========================================================= */

async function orderService(id) {
    if (!requireAuth()) return;

    try {
        /*
         * Агар backend-и фармоиш омода бошад,
         * ин endpoint истифода мешавад.
         */

        await apiRequest(
            "/orders",
            {
                method: "POST",
                body: JSON.stringify({
                    serviceId: id
                })
            }
        );

        showToast(
            "Фармоиш қабул шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Фармоиш иҷро нашуд.",
            "error"
        );
    }
}

/* =========================================================
   PRODUCT ORDER
   ========================================================= */

async function orderProduct(id) {
    if (!requireAuth()) return;

    try {
        await apiRequest(
            "/orders",
            {
                method: "POST",
                body: JSON.stringify({
                    productId: id
                })
            }
        );

        showToast(
            "Фармоиш қабул шуд.",
            "success"
        );
    } catch (error) {
        showToast(
            error.message ||
                "Фармоиш иҷро нашуд.",
            "error"
        );
    }
}

/* =========================================================
   AUTH REQUIREMENT
   ========================================================= */

function requireAuth() {
    if (state.user) return true;

    showToast(
        "Барои иҷрои ин амал ба аккаунт ворид шавед.",
        "warning"
    );

    openModal("loginModal");

    return false;
}

/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function normalizeList(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data?.items)) {
        return data.items;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

function formatPrice(value) {
    const number =
        Number(value) || 0;

    if (!number) {
        return "Бо мувофиқа";
    }

    return (
        new Intl.NumberFormat(
            "tg-TJ"
        ).format(number) +
        " сомонӣ"
    );
}

function formatDate(date) {
    if (!date) return "";

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return "";
    }

    return parsed.toLocaleDateString(
        "tg-TJ",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}

function emptyState(
    title,
    description
) {
    return `
        <div class="empty-state">

            <i class="fa-regular fa-folder-open"></i>

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

        </div>
    `;
}

function setButtonLoading(
    selector,
    loading
) {
    const button = $(selector);

    if (!button) return;

    if (loading) {
        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Интизор шавед...
        `;
    } else {
        button.disabled = false;

        if (
            button.dataset.originalText
        ) {
            button.innerHTML =
                button.dataset.originalText;
        }
    }
}

/* =========================================================
   RENDER ALL
   ========================================================= */

function renderAll() {
    renderSpecialists();
    renderServices();
    renderProducts();
    renderJobs();
    renderProjects();
    renderRealEstate();
    renderReviews();
    renderNotifications();

    updateNotificationCount();

    updateAuthUI();

    switchMarketplaceTab(
        state.currentMarketplaceTab
    );

    switchRealEstateTab(
        state.currentRealEstateTab
    );
}

/* =========================================================
   LOADING SCREEN
   ========================================================= */

function hideLoadingScreen() {
    const screen =
        byId("loadingScreen") ||
        $(".loading-screen");

    if (!screen) return;

    setTimeout(() => {
        screen.classList.add(
            "hidden"
        );
    }, 500);
}

/* =========================================================
   ACTIVE NAV
   ========================================================= */

function setupNavigation() {
    const links =
        $$(".nav-link");

    links.forEach(link => {
        link.addEventListener(
            "click",
            () => {
                links.forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );

                link.classList.add(
                    "active"
                );

                closeMobileMenu();
            }
        );
    });
}

/* =========================================================
   CLOSE MODAL BY BACKDROP
   ========================================================= */

function setupModalBackdrop() {
    $$(".modal").forEach(modal => {
        modal.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    modal
                ) {
                    closeModal(
                        modal.id
                    );
                }
            }
        );
    });
}

/* =========================================================
   INIT
   ========================================================= */

async function init() {
    console.log(
        "%cSMM.TJ",
        "color:#8b5cf6;font-size:28px;font-weight:900"
    );

    console.log(
        "SMM.TJ Marketplace initialized."
    );

    setupEvents();

    setupNavigation();

    setupModalBackdrop();

    updateAuthUI();

    hideLoadingScreen();

    await loadInitialData();

    if (state.user) {
        await Promise.allSettled([
            loadNotifications(),
            loadConversations()
        ]);
    }

    renderAll();
}

/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        init
    );
} else {
    init();
}

/* =========================================================
   GLOBAL API
   ========================================================= */

window.SMMTJ = {
    state,

    login,
    register,
    logout,

    createProject,
    createService,
    createProduct,
    createRealEstate,

    sendProposal,
    sendMessage,

    loadInitialData,
    loadSpecialists,
    loadServices,
    loadProducts,
    loadJobs,
    loadProjects,
    loadRealEstate,

    showToast,
    openModal,
    closeModal,

    switchMarketplaceTab,
    switchRealEstateTab
};
