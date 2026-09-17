/* =========================================================
   SMM.TJ — MAIN JAVASCRIPT
   Real API + UI + Modals + Navigation + Filters
========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {
    API_BASE: "http://localhost:5000/api",

    TOKEN_KEY: "smm_tj_access_token",
    REFRESH_KEY: "smm_tj_refresh_token",
    USER_KEY: "smm_tj_user",

    DEFAULT_IMAGE:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80",

    REQUEST_TIMEOUT: 15000
};


/* =========================================================
   STATE
========================================================= */

const state = {
    user: null,

    accessToken:
        localStorage.getItem(CONFIG.TOKEN_KEY) || null,

    refreshToken:
        localStorage.getItem(CONFIG.REFRESH_KEY) || null,

    currentMarketType: "services",

    currentRealEstateType: "",

    currentConversationId: null,

    conversations: [],

    specialists: [],

    services: [],

    products: [],

    jobs: [],

    projects: [],

    realEstate: [],

    reviews: [],

    notifications: [],

    searchResults: [],

    loading: false
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


function get(id) {
    return document.getElementById(id);
}


function exists(id) {
    return !!document.getElementById(id);
}


/* =========================================================
   STORAGE
========================================================= */

function saveAuth(data) {
    if (!data) return;

    const access =
        data.accessToken ||
        data.access_token ||
        data.token ||
        null;

    const refresh =
        data.refreshToken ||
        data.refresh_token ||
        null;

    const user =
        data.user ||
        data.profile ||
        null;

    if (access) {
        state.accessToken = access;
        localStorage.setItem(
            CONFIG.TOKEN_KEY,
            access
        );
    }

    if (refresh) {
        state.refreshToken = refresh;
        localStorage.setItem(
            CONFIG.REFRESH_KEY,
            refresh
        );
    }

    if (user) {
        state.user = user;

        localStorage.setItem(
            CONFIG.USER_KEY,
            JSON.stringify(user)
        );
    }
}


function loadStoredUser() {
    try {
        const user =
            localStorage.getItem(CONFIG.USER_KEY);

        if (user) {
            state.user = JSON.parse(user);
        }
    } catch {
        state.user = null;
    }
}


function clearAuth() {
    state.user = null;
    state.accessToken = null;
    state.refreshToken = null;

    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.REFRESH_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);

    updateAuthUI();
}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    endpoint,
    options = {},
    retry = true
) {
    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () => controller.abort(),
            CONFIG.REQUEST_TIMEOUT
        );

    const headers = {
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] =
            "application/json";
    }

    if (state.accessToken) {
        headers.Authorization =
            `Bearer ${state.accessToken}`;
    }

    try {
        const response = await fetch(
            `${CONFIG.API_BASE}${endpoint}`,
            {
                ...options,
                headers,
                signal: controller.signal
            }
        );

        if (
            response.status === 401 &&
            retry &&
            state.refreshToken
        ) {
            const refreshed =
                await refreshAccessToken();

            if (refreshed) {
                return apiRequest(
                    endpoint,
                    options,
                    false
                );
            }
        }

        const text =
            await response.text();

        let data = {};

        try {
            data = text
                ? JSON.parse(text)
                : {};
        } catch {
            data = {
                message: text
            };
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                `HTTP ${response.status}`
            );
        }

        return data;
    } finally {
        clearTimeout(timeout);
    }
}


async function refreshAccessToken() {
    if (!state.refreshToken) {
        return false;
    }

    try {
        const response =
            await fetch(
                `${CONFIG.API_BASE}/auth/refresh`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify({
                        refreshToken:
                            state.refreshToken
                    })
                }
            );

        if (!response.ok) {
            clearAuth();
            return false;
        }

        const data =
            await response.json();

        saveAuth(data);

        return true;
    } catch {
        clearAuth();
        return false;
    }
}


/* =========================================================
   API SHORTCUTS
========================================================= */

async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: "GET"
    });
}


async function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: "POST",
        body:
            body instanceof FormData
                ? body
                : JSON.stringify(body)
    });
}


async function apiPatch(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PATCH",
        body:
            body instanceof FormData
                ? body
                : JSON.stringify(body)
    });
}


async function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PUT",
        body:
            body instanceof FormData
                ? body
                : JSON.stringify(body)
    });
}


async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: "DELETE"
    });
}


/* =========================================================
   TOAST
========================================================= */

function toast(
    message,
    type = "info"
) {
    const container =
        get("toastContainer");

    if (!container) return;

    const item =
        document.createElement("div");

    item.className =
        `toast toast-${type}`;

    const icon =
        type === "success"
            ? "✓"
            : type === "error"
                ? "!"
                : "i";

    item.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-text"></span>
        <button type="button" class="toast-close">×</button>
    `;

    $(".toast-text", item).textContent =
        message;

    $(".toast-close", item)
        .addEventListener(
            "click",
            () => item.remove()
        );

    container.appendChild(item);

    requestAnimationFrame(() => {
        item.classList.add("show");
    });

    setTimeout(() => {
        item.classList.remove("show");

        setTimeout(
            () => item.remove(),
            300
        );
    }, 4500);
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    const modal = get(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );
}


function closeModal(id) {
    const modal = get(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        !$(".modal.open")
    ) {
        document.body.classList.remove(
            "modal-open"
        );
    }
}


function closeAllModals() {
    $$(".modal.open").forEach(
        modal => {
            modal.classList.remove("open");
            modal.setAttribute(
                "aria-hidden",
                "true"
            );
        }
    );

    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   MODAL CLOSE EVENTS
========================================================= */

document.addEventListener(
    "click",
    event => {
        const close =
            event.target.closest(
                "[data-close-modal]"
            );

        if (close) {
            closeModal(
                close.dataset.closeModal
            );
        }

        if (
            event.target.classList.contains(
                "modal"
            )
        ) {
            closeModal(
                event.target.id
            );
        }
    }
);


document.addEventListener(
    "keydown",
    event => {
        if (event.key === "Escape") {
            closeAllModals();
        }
    }
);


/* =========================================================
   NAVIGATION
========================================================= */

function scrollToSection(id) {
    const section = get(id);

    if (!section) return;

    closeMobileMenu();

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    setActiveNav(id);
}


function setActiveNav(sectionId) {
    $$("[data-section]").forEach(
        button => {
            button.classList.toggle(
                "active",
                button.dataset.section ===
                    sectionId
            );
        }
    );
}


$$("[data-section]").forEach(
    button => {
        button.addEventListener(
            "click",
            () => {
                scrollToSection(
                    button.dataset.section
                );
            }
        );
    }
);


/* =========================================================
   LOGO
========================================================= */

[
    "logoBtn",
    "footerLogoBtn"
].forEach(id => {
    const button = get(id);

    if (button) {
        button.addEventListener(
            "click",
            () => scrollToSection("home")
        );
    }
});


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {
    const menu =
        get("mobileNav");

    const button =
        get("mobileMenuBtn");

    if (!menu || !button) return;

    const opened =
        menu.classList.toggle("open");

    button.setAttribute(
        "aria-expanded",
        String(opened)
    );
}


function closeMobileMenu() {
    const menu =
        get("mobileNav");

    const button =
        get("mobileMenuBtn");

    if (!menu) return;

    menu.classList.remove("open");

    if (button) {
        button.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


if (exists("mobileMenuBtn")) {
    get("mobileMenuBtn")
        .addEventListener(
            "click",
            toggleMobileMenu
        );
}


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {
    const logged =
        !!state.user;

    if (exists("loginBtn")) {
        get("loginBtn").hidden =
            logged;
    }

    if (exists("registerBtn")) {
        get("registerBtn").hidden =
            logged;
    }

    if (exists("profileBtn")) {
        get("profileBtn").hidden =
            !logged;
    }

    if (exists("profileName")) {
        get("profileName").textContent =
            state.user
                ? (
                    state.user.firstName ||
                    state.user.username ||
                    state.user.name ||
                    "Профил"
                )
                : "Профил";
    }

    if (exists("profileDot")) {
        get("profileDot").textContent =
            logged ? "●" : "○";
    }
}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {
    event.preventDefault();

    const identifier =
        get("loginIdentifier")?.value.trim();

    const password =
        get("loginPassword")?.value;

    if (!identifier || !password) {
        toast(
            "Ҳамаи майдонҳоро пур кунед.",
            "error"
        );

        return;
    }

    const button =
        get("loginSubmitBtn");

    setButtonLoading(
        button,
        true,
        "Ворид шуда истодааст..."
    );

    try {
        const data =
            await apiPost(
                "/auth/login",
                {
                    identifier,
                    email: identifier,
                    phone: identifier,
                    password
                }
            );

        saveAuth(data);

        if (data.user) {
            state.user = data.user;
        }

        updateAuthUI();

        closeModal("loginModal");

        get("loginForm")?.reset();

        toast(
            "Ба ҳисоби шумо бомуваффақият ворид шудед.",
            "success"
        );

        await loadAllData();

    } catch (error) {
        showFormError(
            "loginError",
            error.message ||
            "Ворид шудан имконнопазир аст."
        );
    } finally {
        setButtonLoading(
            button,
            false,
            "Ворид шудан"
        );
    }
}


/* =========================================================
   REGISTER
========================================================= */

async function handleRegister(event) {
    event.preventDefault();

    const firstName =
        get("registerFirstName")?.value.trim();

    const lastName =
        get("registerLastName")?.value.trim();

    const username =
        get("registerUsername")?.value.trim();

    const phone =
        get("registerPhone")?.value.trim();

    const email =
        get("registerEmail")?.value.trim();

    const password =
        get("registerPassword")?.value;

    const confirmPassword =
        get("registerConfirmPassword")?.value;

    const region =
        get("registerRegion")?.value;

    const city =
        get("registerCity")?.value.trim();

    const role =
        get("registerRole")?.value;


    if (
        !firstName ||
        !lastName ||
        !username ||
        !phone ||
        !password ||
        !confirmPassword ||
        !region ||
        !city ||
        !role
    ) {
        showFormError(
            "registerError",
            "Лутфан ҳамаи майдонҳои заруриро пур кунед."
        );

        return;
    }


    if (password !== confirmPassword) {
        showFormError(
            "registerError",
            "Паролҳо мувофиқат намекунанд."
        );

        return;
    }


    if (password.length < 8) {
        showFormError(
            "registerError",
            "Парол бояд ҳадди ақал 8 символ дошта бошад."
        );

        return;
    }


    const button =
        get("registerSubmitBtn");

    setButtonLoading(
        button,
        true,
        "Ҳисоб сохта шуда истодааст..."
    );


    try {
        const data =
            await apiPost(
                "/auth/register",
                {
                    firstName,
                    lastName,
                    username,
                    phone,
                    email: email || undefined,
                    password,
                    confirmPassword,
                    region,
                    city,
                    role
                }
            );


        saveAuth(data);

        if (data.user) {
            state.user = data.user;
        }


        updateAuthUI();

        closeModal("registerModal");

        get("registerForm")?.reset();

        toast(
            "Ҳисоби шумо бомуваффақият сохта шуд.",
            "success"
        );


        await loadAllData();

    } catch (error) {
        showFormError(
            "registerError",
            error.message ||
            "Бақайдгирӣ иҷро нашуд."
        );
    } finally {
        setButtonLoading(
            button,
            false,
            "Ҳисоб сохтан"
        );
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {
    try {
        if (state.refreshToken) {
            await apiPost(
                "/auth/logout",
                {
                    refreshToken:
                        state.refreshToken
                }
            );
        }
    } catch {
        // logout locally anyway
    }

    clearAuth();

    closeAllModals();

    toast(
        "Шумо аз ҳисоби худ баромадед.",
        "success"
    );
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function handleForgotPassword(event) {
    event.preventDefault();

    const identifier =
        get("forgotIdentifier")?.value.trim();

    if (!identifier) {
        showFormError(
            "forgotError",
            "Телефон ё email-ро ворид кунед."
        );

        return;
    }

    const button =
        get("forgotSubmitBtn");

    setButtonLoading(
        button,
        true,
        "Ирсол шуда истодааст..."
    );

    try {
        await apiPost(
            "/auth/forgot-password",
            {
                identifier,
                email: identifier,
                phone: identifier
            }
        );

        closeModal(
            "forgotPasswordModal"
        );

        get("forgotPasswordForm")?.reset();

        toast(
            "Агар ҳисоб вуҷуд дошта бошад, маълумоти барқароркунӣ фиристода шуд.",
            "success"
        );

    } catch (error) {
        showFormError(
            "forgotError",
            error.message ||
            "Хатогӣ ҳангоми барқароркунӣ."
        );
    } finally {
        setButtonLoading(
            button,
            false,
            "Ирсол кардан"
        );
    }
}


/* =========================================================
   FORM ERRORS
========================================================= */

function showFormError(id, message) {
    const element = get(id);

    if (!element) {
        toast(message, "error");
        return;
    }

    element.textContent = message;
    element.hidden = false;
}


function hideFormError(id) {
    const element = get(id);

    if (!element) return;

    element.hidden = true;
    element.textContent = "";
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {
    if (!button) return;

    if (loading) {
        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML = `
            <span class="btn-spinner"></span>
            ${text}
        `;
    } else {
        button.disabled = false;

        button.innerHTML =
            button.dataset.originalText ||
            text;
    }
}


/* =========================================================
   LOGIN / REGISTER BUTTONS
========================================================= */

get("loginBtn")?.addEventListener(
    "click",
    () => {
        hideFormError("loginError");
        openModal("loginModal");
    }
);


get("registerBtn")?.addEventListener(
    "click",
    () => {
        hideFormError("registerError");
        openModal("registerModal");
    }
);


get("openRegisterFromLogin")
    ?.addEventListener(
        "click",
        () => {
            closeModal("loginModal");
            openModal("registerModal");
        }
    );


get("openLoginFromRegister")
    ?.addEventListener(
        "click",
        () => {
            closeModal("registerModal");
            openModal("loginModal");
        }
    );


get("forgotPasswordBtn")
    ?.addEventListener(
        "click",
        () => {
            closeModal("loginModal");
            openModal(
                "forgotPasswordModal"
            );
        }
    );


get("loginForm")
    ?.addEventListener(
        "submit",
        handleLogin
    );


get("registerForm")
    ?.addEventListener(
        "submit",
        handleRegister
    );


get("forgotPasswordForm")
    ?.addEventListener(
        "submit",
        handleForgotPassword
    );


get("logoutBtn")
    ?.addEventListener(
        "click",
        logout
    );


/* =========================================================
   PROFILE MENU
========================================================= */

function toggleProfileMenu() {
    const menu =
        get("profileMenu");

    if (!menu) return;

    menu.classList.toggle("open");
}


get("profileBtn")
    ?.addEventListener(
        "click",
        event => {
            event.stopPropagation();
            toggleProfileMenu();
        }
    );


document.addEventListener(
    "click",
    event => {
        const menu =
            get("profileMenu");

        const profile =
            get("profileBtn");

        if (!menu) return;

        if (
            !menu.contains(event.target) &&
            !profile?.contains(event.target)
        ) {
            menu.classList.remove("open");
        }
    }
);


/* =========================================================
   PROFILE
========================================================= */

async function openProfile() {
    if (!state.user) {
        openModal("loginModal");
        return;
    }

    const content =
        get("profileContent");

    if (!content) return;

    openModal("profileModal");

    content.innerHTML = `
        <div class="loading-block">
            <div class="loader-ring small"></div>
            <p>Профил бор шуда истодааст...</p>
        </div>
    `;

    try {
        let data;

        try {
            data =
                await apiGet(
                    `/users/${state.user.id}`
                );
        } catch {
            data = state.user;
        }

        renderProfile(
            data.user ||
            data.profile ||
            data
        );

    } catch (error) {
        content.innerHTML = `
            <div class="empty-state">
                ${escapeHTML(
                    error.message ||
                    "Профил кушода нашуд."
                )}
            </div>
        `;
    }
}


function renderProfile(user) {
    const content =
        get("profileContent");

    if (!content) return;

    const name =
        user.firstName ||
        user.name ||
        user.username ||
        "Корбар";

    const lastName =
        user.lastName || "";

    const avatar =
        user.avatar ||
        user.profile?.avatar ||
        CONFIG.DEFAULT_IMAGE;

    const role =
        user.role ||
        "USER";

    content.innerHTML = `
        <div class="profile-detail">

            <div class="profile-cover"></div>

            <div class="profile-main">

                <img
                    class="profile-avatar"
                    src="${safeUrl(avatar)}"
                    alt="${escapeHTML(name)}"
                >

                <div class="profile-info">

                    <span class="tag">
                        ${escapeHTML(role)}
                    </span>

                    <h2>
                        ${escapeHTML(
                            name + " " + lastName
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            user.bio ||
                            "Профили SMM.TJ"
                        )}
                    </p>

                </div>

            </div>

            <div class="profile-stats">

                <div>
                    <strong>
                        ${user.rating || "—"}
                    </strong>
                    <span>Рейтинг</span>
                </div>

                <div>
                    <strong>
                        ${user.experience || "—"}
                    </strong>
                    <span>Таҷриба</span>
                </div>

                <div>
                    <strong>
                        ${user.city || "—"}
                    </strong>
                    <span>Шаҳр</span>
                </div>

            </div>

            <div class="profile-actions">

                <button
                    id="profileEditBtn"
                    class="btn btn-primary"
                    type="button"
                >
                    ✏️ Таҳрири профил
                </button>

                <button
                    id="profileChatBtn"
                    class="btn btn-ghost"
                    type="button"
                >
                    💬 Паём
                </button>

            </div>

        </div>
    `;


    get("profileEditBtn")
        ?.addEventListener(
            "click",
            () => {
                toast(
                    "Функсияи таҳрири профилро баъди пайваст кардани endpoint /profiles фаъол мекунем.",
                    "info"
                );
            }
        );
}


/* =========================================================
   PROFILE MENU ACTIONS
========================================================= */

get("profileMenuBtn")
    ?.addEventListener(
        "click",
        openProfile
    );


get("profileMessagesBtn")
    ?.addEventListener(
        "click",
        () => {
            openChat();
        }
    );


get("profileNotificationsBtn")
    ?.addEventListener(
        "click",
        () => {
            openNotifications();
        }
    );


get("profileProjectsBtn")
    ?.addEventListener(
        "click",
        () => {
            scrollToSection("projects");
        }
    );


get("profileSettingsBtn")
    ?.addEventListener(
        "click",
        () => {
            toast(
                "Танзимоти профил дар dashboard дастрас мешавад.",
                "info"
            );
        }
    );


get("bottomProfileBtn")
    ?.addEventListener(
        "click",
        () => {
            if (state.user) {
                openProfile();
            } else {
                openModal("loginModal");
            }
        }
    );


get("footerProfileBtn")
    ?.addEventListener(
        "click",
        () => {
            if (state.user) {
                openProfile();
            } else {
                openModal("loginModal");
            }
        }
    );


/* =========================================================
   HERO SEARCH
========================================================= */

get("heroSearchForm")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            const query =
                get("heroSearchInput")
                    ?.value
                    .trim();

            const category =
                get("heroCategory")
                    ?.value;

            if (query) {
                get("specialistSearch").value =
                    query;
            }

            if (category) {
                get("specialistCategory").value =
                    category;

                get("marketCategory").value =
                    category;
            }

            scrollToSection(
                "specialists"
            );

            loadSpecialists();
        }
    );


/* =========================================================
   GLOBAL SEARCH
========================================================= */

get("globalSearchBtn")
    ?.addEventListener(
        "click",
        () => {
            openModal("searchModal");

            setTimeout(
                () =>
                    get(
                        "globalSearchInput"
                    )?.focus(),
                100
            );
        }
    );


get("globalSearchForm")
    ?.addEventListener(
        "submit",
        handleGlobalSearch
    );


async function handleGlobalSearch(event) {
    event.preventDefault();

    const query =
        get("globalSearchInput")
            ?.value
            .trim();

    if (!query) {
        toast(
            "Матни ҷустуҷӯро ворид кунед.",
            "error"
        );

        return;
    }

    const results =
        get("globalSearchResults");

    if (!results) return;

    results.innerHTML = `
        <div class="loading-block">
            <div class="loader-ring small"></div>
            <p>Ҷустуҷӯ...</p>
        </div>
    `;

    try {
        const data =
            await apiGet(
                `/search?q=${encodeURIComponent(query)}`
            );

        const items =
            data.results ||
            data.data ||
            [];

        state.searchResults = items;

        renderSearchResults(items);

    } catch {
        results.innerHTML = `
            <div class="search-fallback">

                <button
                    type="button"
                    class="search-result"
                    data-search-section="specialists"
                >
                    <span>👨‍💻</span>
                    <strong>
                        Мутахассисон
                    </strong>
                </button>

                <button
                    type="button"
                    class="search-result"
                    data-search-section="marketplace"
                >
                    <span>🛍️</span>
                    <strong>
                        Marketplace
                    </strong>
                </button>

                <button
                    type="button"
                    class="search-result"
                    data-search-section="jobs"
                >
                    <span>💼</span>
                    <strong>
                        Ҷойҳои корӣ
                    </strong>
                </button>

                <button
                    type="button"
                    class="search-result"
                    data-search-section="projects"
                >
                    <span>📋</span>
                    <strong>
                        Лоиҳаҳо
                    </strong>
                </button>

            </div>
        `;

        $$(
            "[data-search-section]",
            results
        ).forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    closeModal(
                        "searchModal"
                    );

                    scrollToSection(
                        button.dataset
                            .searchSection
                    );
                }
            );
        });
    }
}


function renderSearchResults(items) {
    const container =
        get("globalSearchResults");

    if (!container) return;

    if (!items.length) {
        container.innerHTML = `
            <div class="empty-state">
                Ягон натиҷа ёфт нашуд.
            </div>
        `;

        return;
    }

    container.innerHTML =
        items
            .slice(0, 20)
            .map(item => `
                <button
                    type="button"
                    class="search-result"
                    data-result-id="${escapeHTML(
                        String(item.id || "")
                    )}"
                >

                    <span>
                        ${item.image
                            ? `<img src="${safeUrl(item.image)}" alt="">`
                            : "🔎"
                        }
                    </span>

                    <div>
                        <strong>
                            ${escapeHTML(
                                item.title ||
                                item.name ||
                                "Натиҷа"
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.type ||
                                item.category ||
                                ""
                            )}
                        </small>
                    </div>

                </button>
            `)
            .join("");


    $$(".search-result", container)
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const id =
                        button.dataset.resultId;

                    const item =
                        state.searchResults
                            .find(
                                x =>
                                    String(x.id) ===
                                    String(id)
                            );

                    if (item) {
                        openDetail(
                            item,
                            item.type
                        );
                    }
                }
            );
        });
}


/* =========================================================
   SPECIALISTS
========================================================= */

async function loadSpecialists() {
    const grid =
        get("specialistsGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        6
    );

    const params =
        new URLSearchParams();

    const search =
        get("specialistSearch")
            ?.value.trim();

    const category =
        get("specialistCategory")
            ?.value;

    const region =
        get("specialistRegion")
            ?.value;

    const sort =
        get("specialistSort")
            ?.value;

    if (search)
        params.set("search", search);

    if (category)
        params.set("category", category);

    if (region)
        params.set("region", region);

    if (sort)
        params.set("sort", sort);


    try {
        const data =
            await apiGet(
                `/smm?${params.toString()}`
            );

        const items =
            normalizeList(data);

        state.specialists = items;

        renderSpecialists(items);

        updateStat(
            "statSpecialists",
            data.total ||
            data.count ||
            items.length
        );

    } catch (error) {
        renderError(
            grid,
            "Мутахассисонро аз сервер гирифтан имконнопазир аст."
        );
    }
}


function renderSpecialists(items) {
    const grid =
        get("specialistsGrid");

    if (!grid) return;

    if (!items.length) {
        renderEmpty(
            grid,
            "Ҳоло мутахассис ёфт нашуд."
        );

        return;
    }

    grid.innerHTML = "";

    const template =
        get("specialistCardTemplate");

    items.forEach(item => {
        const node =
            template
                .content
                .cloneNode(true);

        const article =
            $("article", node);

        const avatar =
            $(".specialist-avatar", node);

        const name =
            $(".specialist-name", node);

        const bio =
            $(".specialist-bio", node);

        const role =
            $(".specialist-role", node);

        const rating =
            $(".specialist-rating", node);

        const location =
            $(".specialist-location", node);

        const experience =
            $(".specialist-experience", node);

        const profileBtn =
            $(".specialist-profile-btn", node);

        const contactBtn =
            $(".specialist-contact-btn", node);


        const fullName =
            [
                item.firstName,
                item.lastName
            ]
                .filter(Boolean)
                .join(" ") ||
            item.name ||
            item.username ||
            "Мутахассис";


        avatar.src =
            safeUrl(
                item.avatar ||
                item.photo ||
                item.profilePhoto ||
                CONFIG.DEFAULT_IMAGE
            );

        avatar.alt =
            fullName;


        name.textContent =
            fullName;


        bio.textContent =
            item.bio ||
            item.description ||
            "SMM Specialist";


        role.textContent =
            item.category ||
            item.specialization ||
            "SMM";


        rating.textContent =
            `★ ${formatNumber(
                item.rating ||
                item.averageRating ||
                0
            )}`;


        location.textContent =
            `📍 ${
                item.city ||
                item.region ||
                "Тоҷикистон"
            }`;


        experience.textContent =
            `⌛ ${
                item.experience ||
                "Таҷриба нишон дода нашудааст"
            }`;


        profileBtn.addEventListener(
            "click",
            () => openSpecialist(
                item
            )
        );


        contactBtn.addEventListener(
            "click",
            () => contactSpecialist(
                item
            )
        );


        article.dataset.id =
            item.id || "";


        grid.appendChild(node);
    });
}


/* =========================================================
   SPECIALIST FILTER
========================================================= */

get("specialistFilterForm")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault();
            loadSpecialists();
        }
    );


get("allSpecialistsBtn")
    ?.addEventListener(
        "click",
        () => {
            get("specialistSearch").value = "";
            get("specialistCategory").value = "";
            get("specialistRegion").value = "";

            scrollToSection(
                "specialists"
            );

            loadSpecialists();
        }
    );


get("findSpecialistBtn")
    ?.addEventListener(
        "click",
        () => {
            scrollToSection(
                "specialists"
            );
        }
    );


/* =========================================================
   MARKETPLACE
========================================================= */

async function loadMarketplace() {
    if (
        state.currentMarketType ===
        "products"
    ) {
        await loadProducts();
    } else {
        await loadServices();
    }
}


async function loadServices() {
    const grid =
        get("servicesGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        6
    );

    const params =
        buildMarketParams();


    try {
        const data =
            await apiGet(
                `/services?${params.toString()}`
            );

        const items =
            normalizeList(data);

        state.services = items;

        renderMarketplace(
            items,
            "services"
        );

        updateStat(
            "statServices",
            data.total ||
            data.count ||
            items.length
        );

    } catch {
        renderError(
            grid,
            "Хизматрасониҳоро гирифтан имконнопазир аст."
        );
    }
}


async function loadProducts() {
    const grid =
        get("productsGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        6
    );

    const params =
        buildMarketParams();


    try {
        const data =
            await apiGet(
                `/products?${params.toString()}`
            );

        const items =
            normalizeList(data);

        state.products = items;

        renderMarketplace(
            items,
            "products"
        );

    } catch {
        renderError(
            grid,
            "Маҳсулотро гирифтан имконнопазир аст."
        );
    }
}


function buildMarketParams() {
    const params =
        new URLSearchParams();

    const search =
        get("marketSearch")
            ?.value.trim();

    const category =
        get("marketCategory")
            ?.value;

    const region =
        get("marketRegion")
            ?.value;

    const sort =
        get("marketSort")
            ?.value;


    if (search)
        params.set("search", search);

    if (category)
        params.set("category", category);

    if (region)
        params.set("region", region);

    if (sort)
        params.set("sort", sort);


    return params;
}


function renderMarketplace(
    items,
    type
) {
    const grid =
        get(
            type === "products"
                ? "productsGrid"
                : "servicesGrid"
        );

    if (!grid) return;

    if (!items.length) {
        renderEmpty(
            grid,
            type === "products"
                ? "Ҳоло маҳсулот нест."
                : "Ҳоло хизматрасонӣ нест."
        );

        return;
    }


    grid.innerHTML = "";

    const template =
        get("marketCardTemplate");


    items.forEach(item => {
        const node =
            template
                .content
                .cloneNode(true);

        const image =
            $(".market-image", node);

        const title =
            $(".market-title", node);

        const description =
            $(".market-description", node);

        const category =
            $(".market-category", node);

        const rating =
            $(".market-rating", node);

        const region =
            $(".market-region", node);

        const price =
            $(".market-price", node);

        const view =
            $(".market-view-btn", node);

        const favorite =
            $(".favorite-btn", node);


        image.src =
            safeUrl(
                item.image ||
                item.cover ||
                item.thumbnail ||
                (
                    Array.isArray(
                        item.images
                    )
                        ? item.images[0]
                        : null
                ) ||
                CONFIG.DEFAULT_IMAGE
            );


        title.textContent =
            item.title ||
            item.name ||
            "Хизматрасонӣ";


        description.textContent =
            item.description ||
            "Тавсиф нест.";


        category.textContent =
            item.category ||
            type === "products"
                ? "Маҳсулот"
                : "Хизмат";


        rating.textContent =
            `★ ${formatNumber(
                item.rating ||
                item.averageRating ||
                0
            )}`;


        region.textContent =
            `📍 ${
                item.city ||
                item.region ||
                "Тоҷикистон"
            }`;


        price.textContent =
            formatPrice(
                item.price
            );


        view.addEventListener(
            "click",
            () =>
                openDetail(
                    item,
                    type === "products"
                        ? "product"
                        : "service"
                )
        );


        favorite.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                toggleFavorite(
                    item.id,
                    type === "products"
                        ? "PRODUCT"
                        : "SERVICE",
                    favorite
                );
            }
        );


        grid.appendChild(node);
    });
}


/* =========================================================
   MARKET TABS
========================================================= */

$$(
    "[data-market-type]"
).forEach(button => {
    button.addEventListener(
        "click",
        () => {
            state.currentMarketType =
                button.dataset.marketType;

            $$(
                "[data-market-type]"
            ).forEach(
                b =>
                    b.classList.toggle(
                        "active",
                        b === button
                    )
            );


            if (
                state.currentMarketType ===
                "products"
            ) {
                get("servicesGrid").hidden =
                    true;

                get("productsGrid").hidden =
                    false;

                loadProducts();

            } else {
                get("servicesGrid").hidden =
                    false;

                get("productsGrid").hidden =
                    true;

                loadServices();
            }
        }
    );
});


get("marketFilterForm")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault();
            loadMarketplace();
        }
    );


get("addServiceBtn")
    ?.addEventListener(
        "click",
        openServiceModal
    );


/* =========================================================
   JOBS
========================================================= */

async function loadJobs() {
    const grid =
        get("jobsGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        6
    );


    const params =
        new URLSearchParams();

    const search =
        get("jobSearch")
            ?.value.trim();

    const type =
        get("jobEmploymentType")
            ?.value;

    const region =
        get("jobRegion")
            ?.value;

    const sort =
        get("jobSort")
            ?.value;


    if (search)
        params.set("search", search);

    if (type)
        params.set("employmentType", type);

    if (region)
        params.set("region", region);

    if (sort)
        params.set("sort", sort);


    try {
        const data =
            await apiGet(
                `/jobs?${params.toString()}`
            );

        const items =
            normalizeList(data);

        state.jobs = items;

        renderJobs(items);

        updateStat(
            "statJobs",
            data.total ||
            data.count ||
            items.length
        );

    } catch {
        renderError(
            grid,
            "Вакансияҳоро гирифтан имконнопазир аст."
        );
    }
}


function renderJobs(items) {
    const grid =
        get("jobsGrid");

    if (!grid) return;

    if (!items.length) {
        renderEmpty(
            grid,
            "Ҳоло вакансия нест."
        );

        return;
    }


    grid.innerHTML = "";

    const template =
        get("jobCardTemplate");


    items.forEach(item => {
        const node =
            template
                .content
                .cloneNode(true);


        $(".job-type", node)
            .textContent =
            translateJobType(
                item.employmentType ||
                item.type
            );


        $(".job-salary", node)
            .textContent =
            item.salary ||
            "Музд мувофиқа мешавад";


        $(".job-title", node)
            .textContent =
            item.title ||
            "Вакансия";


        $(".job-company", node)
            .textContent =
            item.company ||
            "Ширкат";


        $(".job-description", node)
            .textContent =
            item.description ||
            "";


        $(".job-region", node)
            .textContent =
            `📍 ${
                item.city ||
                item.region ||
                "Тоҷикистон"
            }`;


        $(".job-experience", node)
            .textContent =
            `⌛ ${
                item.experience ||
                "Таҷриба нишон дода нашудааст"
            }`;


        $(".job-view-btn", node)
            .addEventListener(
                "click",
                () =>
                    openDetail(
                        item,
                        "job"
                    )
            );


        $(".job-apply-btn", node)
            .addEventListener(
                "click",
                () =>
                    applyToJob(
                        item
                    )
            );


        grid.appendChild(node);
    });
}


get("jobFilterForm")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault();
            loadJobs();
        }
    );


get("addJobBtn")
    ?.addEventListener(
        "click",
        () => {
            if (!state.user) {
                openModal("loginModal");
                return;
            }

            openModal("jobModal");
        }
    );


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {
    const grid =
        get("projectsGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        6
    );


    const params =
        new URLSearchParams();

    const search =
        get("projectSearch")
            ?.value.trim();

    const category =
        get("projectCategory")
            ?.value;

    const status =
        get("projectStatus")
            ?.value;

    const sort =
        get("projectSort")
            ?.value;


    if (search)
        params.set("search", search);

    if (category)
        params.set("category", category);

    if (status)
        params.set("status", status);

    if (sort)
        params.set("sort", sort);


    try {
        const data =
            await apiGet(
                `/projects?${params.toString()}`
            );

        const items =
            normalizeList(data);

        state.projects = items;

        renderProjects(items);

        updateStat(
            "statProjects",
            data.total ||
            data.count ||
            items.length
        );

    } catch {
        renderError(
            grid,
            "Лоиҳаҳоро гирифтан имконнопазир аст."
        );
    }
}


function renderProjects(items) {
    const grid =
        get("projectsGrid");

    if (!grid) return;

    if (!items.length) {
        renderEmpty(
            grid,
            "Ҳоло лоиҳа нест."
        );

        return;
    }


    grid.innerHTML = "";

    const template =
        get("projectCardTemplate");


    items.forEach(item => {
        const node =
            template
                .content
                .cloneNode(true);


        $(".project-status", node)
            .textContent =
            translateProjectStatus(
                item.status
            );


        $(".project-budget", node)
            .textContent =
            formatPrice(
                item.budget
            );


        $(".project-title", node)
            .textContent =
            item.title ||
            "Лоиҳа";


        $(".project-description", node)
            .textContent =
            item.description ||
            "";


        $(".project-category", node)
            .textContent =
            item.category ||
            "—";


        $(".project-region", node)
            .textContent =
            `📍 ${
                item.city ||
                item.region ||
                "Тоҷикистон"
            }`;


        $(".project-deadline", node)
            .textContent =
            item.deadline
                ? `📅 ${formatDate(
                    item.deadline
                )}`
                : "Deadline нест";


        $(".project-view-btn", node)
            .addEventListener(
                "click",
                () =>
                    openDetail(
                        item,
                        "project"
                    )
            );


        $(".project-proposal-btn", node)
            .addEventListener(
                "click",
                () =>
                    sendProposal(
                        item
                    )
            );


        grid.appendChild(node);
    });
}


get("projectFilterForm")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault();
            loadProjects();
        }
    );


[
    "createProjectBtn",
    "newProjectBtn",
    "ctaProjectBtn",
    "footerAddProjectBtn"
].forEach(id => {
    get(id)?.addEventListener(
        "click",
        openProjectModal
    );
});


function openProjectModal() {
    if (!state.user) {
        openModal("loginModal");

        toast(
            "Барои сохтани лоиҳа аввал ворид шавед.",
            "info"
        );

        return;
    }

    openModal("projectModal");
}


/* =========================================================
   REAL ESTATE
========================================================= */

async function loadRealEstate() {
    const grid =
        get("realEstateGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        6
    );


    const params =
        new URLSearchParams();

    const search =
        get("realEstateSearch")
            ?.value.trim();

    const type =
        get("realEstateType")
            ?.value;

    const region =
        get("realEstateRegion")
            ?.value;

    const rooms =
        get("realEstateRooms")
            ?.value;


    if (search)
        params.set("search", search);

    if (type)
        params.set("type", type);

    if (region)
        params.set("region", region);

    if (rooms)
        params.set("rooms", rooms);

    if (state.currentRealEstateType) {
        params.set(
            "dealType",
            state.currentRealEstateType
        );
    }


    try {
        const data =
            await apiGet(
                `/real-estate?${params.toString()}`
            );

        const items =
            normalizeList(data);

        state.realEstate = items;

        renderRealEstate(items);

    } catch {
        renderError(
            grid,
            "Эълонҳои манзилро гирифтан имконнопазир аст."
        );
    }
}


function renderRealEstate(items) {
    const grid =
        get("realEstateGrid");

    if (!grid) return;

    if (!items.length) {
        renderEmpty(
            grid,
            "Ҳоло эълони манзил нест."
        );

        return;
    }


    grid.innerHTML = "";

    const template =
        get("realEstateCardTemplate");


    items.forEach(item => {
        const node =
            template
                .content
                .cloneNode(true);


        const image =
            $(".realestate-image", node);


        image.src =
            safeUrl(
                item.image ||
                (
                    Array.isArray(
                        item.images
                    )
                        ? item.images[0]
                        : null
                ) ||
                CONFIG.DEFAULT_IMAGE
            );


        $(".realestate-deal", node)
            .textContent =
            item.dealType === "SALE"
                ? "Фурӯш"
                : "Иҷора";


        $(".realestate-price", node)
            .textContent =
            formatPrice(
                item.price
            );


        $(".realestate-title", node)
            .textContent =
            item.title ||
            "Манзил";


        $(".realestate-description", node)
            .textContent =
            item.description ||
            "";


        $(".realestate-type", node)
            .textContent =
            translateRealEstateType(
                item.type
            );


        $(".realestate-rooms", node)
            .textContent =
            item.rooms
                ? `🚪 ${item.rooms} ҳуҷра`
                : "";


        $(".realestate-area", node)
            .textContent =
            item.area
                ? `📐 ${item.area} м²`
                : "";


        $(".realestate-region", node)
            .textContent =
            `📍 ${
                item.city ||
                item.region ||
                "Тоҷикистон"
            }`;


        $(".realestate-view-btn", node)
            .addEventListener(
                "click",
                () =>
                    openDetail(
                        item,
                        "realestate"
                    )
            );


        grid.appendChild(node);
    });
}


/* =========================================================
   REAL ESTATE TABS
========================================================= */

$$(
    "[data-realestate-type]"
).forEach(button => {
    button.addEventListener(
        "click",
        () => {

            state.currentRealEstateType =
                button.dataset
                    .realestateType;

            $$(
                "[data-realestate-type]"
            ).forEach(
                b =>
                    b.classList.toggle(
                        "active",
                        b === button
                    )
            );

            loadRealEstate();
        }
    );
});


get("realEstateFilterForm")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault();
            loadRealEstate();
        }
    );


get("addRealEstateBtn")
    ?.addEventListener(
        "click",
        () => {

            if (!state.user) {
                openModal("loginModal");

                toast(
                    "Барои эълон гузоштан аввал ворид шавед.",
                    "info"
                );

                return;
            }

            openModal(
                "realEstateModal"
            );
        }
    );


/* =========================================================
   REGIONS
========================================================= */

$$(".region-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const region =
                    card.dataset.region;

                if (
                    get(
                        "specialistRegion"
                    )
                ) {
                    get(
                        "specialistRegion"
                    ).value =
                        region;
                }

                if (
                    get(
                        "marketRegion"
                    )
                ) {
                    get(
                        "marketRegion"
                    ).value =
                        region;
                }

                if (
                    get(
                        "jobRegion"
                    )
                ) {
                    get(
                        "jobRegion"
                    ).value =
                        region;
                }

                if (
                    get(
                        "realEstateRegion"
                    )
                ) {
                    get(
                        "realEstateRegion"
                    ).value =
                        region;
                }

                scrollToSection(
                    "specialists"
                );

                loadSpecialists();

                toast(
                    `Минтақа: ${card.querySelector("b")?.textContent || region}`,
                    "success"
                );
            }
        );

    });


/* =========================================================
   REVIEWS
========================================================= */

async function loadReviews() {
    const grid =
        get("reviewsGrid");

    if (!grid) return;

    showSkeleton(
        grid,
        3
    );


    try {
        const data =
            await apiGet(
                "/reviews?limit=6"
            );

        const items =
            normalizeList(data);

        state.reviews = items;

        renderReviews(items);

    } catch {
        renderEmpty(
            grid,
            "Отзывҳо ҳоло дастрас нестанд."
        );
    }
}


function renderReviews(items) {
    const grid =
        get("reviewsGrid");

    if (!grid) return;

    if (!items.length) {
        renderEmpty(
            grid,
            "Ҳоло отзыв нест."
        );

        return;
    }


    grid.innerHTML = "";

    const template =
        get("reviewCardTemplate");


    items.slice(0, 6)
        .forEach(item => {

            const node =
                template
                    .content
                    .cloneNode(true);


            const rating =
                Math.max(
                    0,
                    Math.min(
                        5,
                        Number(
                            item.rating || 0
                        )
                    )
                );


            $(".review-stars", node)
                .textContent =
                "★".repeat(rating) +
                "☆".repeat(5 - rating);


            $(".review-text", node)
                .textContent =
                item.comment ||
                item.text ||
                "Отзыв";


            $(".review-name", node)
                .textContent =
                item.user?.firstName ||
                item.user?.name ||
                item.author?.name ||
                "Корбар";


            $(".review-date", node)
                .textContent =
                item.createdAt
                    ? formatDate(
                        item.createdAt
                    )
                    : "";


            const avatar =
                $(".review-avatar", node);


            avatar.src =
                safeUrl(
                    item.user?.avatar ||
                    item.author?.avatar ||
                    CONFIG.DEFAULT_IMAGE
                );


            grid.appendChild(node);
        });
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {
    if (!state.user) return;

    try {
        const data =
            await apiGet(
                "/notifications"
            );

        const items =
            normalizeList(data);

        state.notifications = items;

        renderNotifications(
            items
        );

        updateNotificationCount(
            data.unreadCount ??
            items.filter(
                n => !n.read
            ).length
        );

    } catch {
        // silently ignore
    }
}


function renderNotifications(items) {
    const list =
        get("notificationsList");

    if (!list) return;

    if (!items.length) {
        renderEmpty(
            list,
            "Огоҳинома нест.",
            true
        );

        return;
    }


    list.innerHTML =
        items
            .slice(0, 30)
            .map(item => `
                <div
                    class="notification-item ${
                        item.read
                            ? ""
                            : "unread"
                    }"
                    data-notification-id="${escapeHTML(
                        String(item.id || "")
                    )}"
                >

                    <div class="notification-icon">
                        ${notificationIcon(
                            item.type
                        )}
                    </div>

                    <div class="notification-body">

                        <strong>
                            ${escapeHTML(
                                item.title ||
                                "Огоҳинома"
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                item.message ||
                                item.body ||
                                ""
                            )}
                        </p>

                        <small>
                            ${item.createdAt
                                ? formatDateTime(
                                    item.createdAt
                                )
                                : ""
                            }
                        </small>

                    </div>

                </div>
            `)
            .join("");
}


function updateNotificationCount(count) {
    const badge =
        get("notificationCount");

    if (!badge) return;

    badge.textContent =
        count > 99
            ? "99+"
            : String(count);

    badge.hidden =
        !count;
}


async function openNotifications() {
    if (!state.user) {
        openModal("loginModal");
        return;
    }

    openModal(
        "notificationsModal"
    );

    await loadNotifications();
}


get("notificationsBtn")
    ?.addEventListener(
        "click",
        openNotifications
    );


/* =========================================================
   CHAT
========================================================= */

async function openChat() {
    if (!state.user) {
        openModal("loginModal");

        toast(
            "Барои истифодаи chat ворид шавед.",
            "info"
        );

        return;
    }

    openModal("chatModal");

    await loadConversations();
}


async function loadConversations() {
    const list =
        get("conversationList");

    if (!list) return;

    list.innerHTML = `
        <div class="loading-block small">
            <div class="loader-ring small"></div>
            <p>Бор шуда истодааст...</p>
        </div>
    `;


    try {
        const data =
            await apiGet(
                "/messages/conversations"
            );

        const items =
            normalizeList(data);

        state.conversations = items;

        renderConversations(
            items
        );

    } catch {
        renderEmpty(
            list,
            "Conversation нест.",
            true
        );
    }
}


function renderConversations(items) {
    const list =
        get("conversationList");

    if (!list) return;

    if (!items.length) {
        renderEmpty(
            list,
            "Conversation нест.",
            true
        );

        return;
    }


    list.innerHTML =
        items.map(item => {

            const other =
                item.otherUser ||
                item.user ||
                item.participant ||
                {};

            const name =
                [
                    other.firstName,
                    other.lastName
                ]
                    .filter(Boolean)
                    .join(" ") ||
                other.name ||
                other.username ||
                "Корбар";


            return `
                <button
                    type="button"
                    class="conversation-item ${
                        String(
                            state.currentConversationId
                        ) ===
                        String(item.id)
                            ? "active"
                            : ""
                    }"
                    data-conversation-id="${escapeHTML(
                        String(item.id)
                    )}"
                >

                    <img
                        src="${safeUrl(
                            other.avatar ||
                            CONFIG.DEFAULT_IMAGE
                        )}"
                        alt=""
                    >

                    <div>

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.lastMessage ||
                                "Паём нест."
                            )}
                        </small>

                    </div>

                </button>
            `;
        })
        .join("");


    $$(".conversation-item", list)
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    state.currentConversationId =
                        button.dataset
                            .conversationId;

                    loadMessages(
                        state.currentConversationId
                    );

                    $$(".conversation-item")
                        .forEach(
                            b =>
                                b.classList.toggle(
                                    "active",
                                    b === button
                                )
                        );
                }
            );

        });
}


async function loadMessages(
    conversationId
) {
    const messages =
        get("chatMessages");

    const header =
        get("chatHeader");

    if (!messages) return;

    messages.innerHTML = `
        <div class="loading-block small">
            <div class="loader-ring small"></div>
            <p>Паёмҳо бор шуда истодаанд...</p>
        </div>
    `;


    try {
        const data =
            await apiGet(
                `/messages/conversations/${encodeURIComponent(
                    conversationId
                )}/messages`
            );

        const items =
            normalizeList(data);

        renderMessages(items);


        const conversation =
            state.conversations.find(
                item =>
                    String(item.id) ===
                    String(conversationId)
            );


        if (header && conversation) {

            const other =
                conversation.otherUser ||
                conversation.user ||
                {};

            header.textContent =
                [
                    other.firstName,
                    other.lastName
                ]
                    .filter(Boolean)
                    .join(" ") ||
                other.name ||
                "Chat";
        }

    } catch {
        renderError(
            messages,
            "Паёмҳоро гирифтан имконнопазир аст."
        );
    }
}


function renderMessages(items) {
    const container =
        get("chatMessages");

    if (!container) return;

    if (!items.length) {
        renderEmpty(
            container,
            "Ҳоло паём нест. Аввалин паёмро нависед.",
            true
        );

        return;
    }


    container.innerHTML =
        items
            .map(message => {

                const mine =
                    String(
                        message.senderId ||
                        message.sender?.id
                    ) ===
                    String(
                        state.user?.id
                    );


                return `
                    <div
                        class="message ${
                            mine
                                ? "message-me"
                                : "message-other"
                        }"
                    >

                        <div class="message-bubble">

                            ${
                                message.fileUrl ||
                                message.attachment
                                    ? `
                                    <a
                                        href="${safeUrl(
                                            message.fileUrl ||
                                            message.attachment
                                        )}"
                                        target="_blank"
                                        rel="noopener"
                                    >
                                        📎 Файл
                                    </a>
                                    `
                                    : ""
                            }

                            <span>
                                ${escapeHTML(
                                    message.text ||
                                    message.content ||
                                    ""
                                )}
                            </span>

                        </div>

                        <small>
                            ${
                                message.createdAt
                                    ? formatTime(
                                        message.createdAt
                                    )
                                    : ""
                            }
                        </small>

                    </div>
                `;
            })
            .join("");


    container.scrollTop =
        container.scrollHeight;
}


async function sendChatMessage(event) {
    event.preventDefault();

    if (!state.user) {
        openModal("loginModal");
        return;
    }

    if (!state.currentConversationId) {
        toast(
            "Аввал conversation интихоб кунед.",
            "error"
        );

        return;
    }


    const input =
        get("chatInput");

    const file =
        get("chatFile")
            ?.files?.[0];

    const text =
        input?.value.trim();


    if (!text && !file) {
        return;
    }


    try {

        let body;


        if (file) {
            body =
                new FormData();

            body.append(
                "text",
                text
            );

            body.append(
                "file",
                file
            );

            body.append(
                "conversationId",
                state.currentConversationId
            );

        } else {
            body = {
                conversationId:
                    state.currentConversationId,
                text
            };
        }


        await apiPost(
            "/messages",
            body
        );


        if (input) {
            input.value = "";
        }

        if (get("chatFile")) {
            get("chatFile").value = "";
        }


        await loadMessages(
            state.currentConversationId
        );

    } catch (error) {
        toast(
            error.message ||
            "Паём фиристода нашуд.",
            "error"
        );
    }
}


get("chatBtn")
    ?.addEventListener(
        "click",
        openChat
    );


get("chatForm")
    ?.addEventListener(
        "submit",
        sendChatMessage
    );


get("chatAttachBtn")
    ?.addEventListener(
        "click",
        () =>
            get("chatFile")?.click()
    );


/* =========================================================
   CONTACT SPECIALIST
========================================================= */

async function contactSpecialist(
    specialist
) {
    if (!state.user) {
        openModal("loginModal");

        toast(
            "Барои тамос аввал ворид шавед.",
            "info"
        );

        return;
    }


    try {
        const data =
            await apiPost(
                "/messages/conversations",
                {
                    participantId:
                        specialist.userId ||
                        specialist.id
                }
            );


        state.currentConversationId =
            data.id ||
            data.conversation?.id;


        await openChat();

    } catch (error) {
        toast(
            error.message ||
            "Chat кушода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   SPECIALIST DETAIL
========================================================= */

function openSpecialist(item) {
    openDetail(
        item,
        "specialist"
    );
}


/* =========================================================
   DETAIL
========================================================= */

function openDetail(
    item,
    type = "service"
) {
    const content =
        get("detailContent");

    if (!content) return;

    const title =
        item.title ||
        item.name ||
        "Тафсилот";


    const description =
        item.description ||
        item.bio ||
        "Тавсиф дастрас нест.";


    let extra = "";


    if (type === "specialist") {

        extra = `
            <div class="detail-grid">

                <div>
                    <span>Рейтинг</span>
                    <strong>
                        ★ ${formatNumber(
                            item.rating ||
                            item.averageRating ||
                            0
                        )}
                    </strong>
                </div>

                <div>
                    <span>Таҷриба</span>
                    <strong>
                        ${escapeHTML(
                            item.experience ||
                            "—"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Ҷойгиршавӣ</span>
                    <strong>
                        ${escapeHTML(
                            item.city ||
                            item.region ||
                            "Тоҷикистон"
                        )}
                    </strong>
                </div>

            </div>

            <div class="detail-actions">

                <button
                    id="detailContactBtn"
                    class="btn btn-primary"
                    type="button"
                >
                    💬 Тамос гирифтан
                </button>

            </div>
        `;

    } else if (
        type === "service" ||
        type === "product"
    ) {

        extra = `
            <div class="detail-price">
                ${formatPrice(
                    item.price
                )}
            </div>

            <div class="detail-meta">
                <span>
                    ${escapeHTML(
                        item.category ||
                        ""
                    )}
                </span>

                <span>
                    📍 ${escapeHTML(
                        item.city ||
                        item.region ||
                        "Тоҷикистон"
                    )}
                </span>

                <span>
                    ★ ${formatNumber(
                        item.rating ||
                        item.averageRating ||
                        0
                    )}
                </span>
            </div>

            <div class="detail-actions">

                <button
                    id="detailOrderBtn"
                    class="btn btn-primary"
                    type="button"
                >
                    Дархост кардан
                </button>

                <button
                    id="detailFavoriteBtn"
                    class="btn btn-ghost"
                    type="button"
                >
                    ♡ Дӯстдошта
                </button>

            </div>
        `;

    } else if (type === "job") {

        extra = `
            <div class="detail-meta">

                <span>
                    💼 ${escapeHTML(
                        item.company ||
                        ""
                    )}
                </span>

                <span>
                    💰 ${escapeHTML(
                        item.salary ||
                        "Мувофиқа мешавад"
                    )}
                </span>

                <span>
                    📍 ${escapeHTML(
                        item.city ||
                        item.region ||
                        ""
                    )}
                </span>

            </div>

            <div class="detail-actions">

                <button
                    id="detailApplyBtn"
                    class="btn btn-primary"
                    type="button"
                >
                    Ариза додан
                </button>

            </div>
        `;

    } else if (type === "project") {

        extra = `
            <div class="detail-meta">

                <span>
                    ${escapeHTML(
                        item.category ||
                        ""
                    )}
                </span>

                <span>
                    💰 ${formatPrice(
                        item.budget
                    )}
                </span>

                <span>
                    ${translateProjectStatus(
                        item.status
                    )}
                </span>

            </div>

            <div class="detail-actions">

                <button
                    id="detailProposalBtn"
                    class="btn btn-primary"
                    type="button"
                >
                    Proposal фиристодан
                </button>

            </div>
        `;

    } else if (type === "realestate") {

        extra = `
            <div class="detail-meta">

                <span>
                    ${translateRealEstateType(
                        item.type
                    )}
                </span>

                <span>
                    ${item.rooms
                        ? `${item.rooms} ҳуҷра`
                        : ""
                    }
                </span>

                <span>
                    ${item.area
                        ? `${item.area} м²`
                        : ""
                    }
                </span>

                <span>
                    📍 ${escapeHTML(
                        item.city ||
                        item.region ||
                        ""
                    )}
                </span>

            </div>

            <div class="detail-price">
                ${formatPrice(
                    item.price
                )}
            </div>
        `;
    }


    content.innerHTML = `
        <div class="detail-page">

            <div class="detail-image-wrap">

                <img
                    src="${safeUrl(
                        item.image ||
                        item.cover ||
                        (
                            Array.isArray(
                                item.images
                            )
                                ? item.images[0]
                                : null
                        ) ||
                        CONFIG.DEFAULT_IMAGE
                    )}"
                    alt="${escapeHTML(title)}"
                >

            </div>

            <div class="detail-body">

                <span class="tag">
                    ${escapeHTML(
                        type.toUpperCase()
                    )}
                </span>

                <h2>
                    ${escapeHTML(title)}
                </h2>

                <p>
                    ${escapeHTML(
                        description
                    )}
                </p>

                ${extra}

            </div>

        </div>
    `;


    if (type === "specialist") {

        get("detailContactBtn")
            ?.addEventListener(
                "click",
                () =>
                    contactSpecialist(
                        item
                    )
            );

    }


    if (
        type === "service" ||
        type === "product"
    ) {

        get("detailOrderBtn")
            ?.addEventListener(
                "click",
                () =>
                    createOrder(
                        item,
                        type
                    )
            );


        get("detailFavoriteBtn")
            ?.addEventListener(
                "click",
                event =>
                    toggleFavorite(
                        item.id,
                        type === "product"
                            ? "PRODUCT"
                            : "SERVICE",
                        event.currentTarget
                    )
            );
    }


    if (type === "job") {

        get("detailApplyBtn")
            ?.addEventListener(
                "click",
                () =>
                    applyToJob(
                        item
                    )
            );
    }


    if (type === "project") {

        get("detailProposalBtn")
            ?.addEventListener(
                "click",
                () =>
                    sendProposal(
                        item
                    )
            );
    }


    openModal("detailModal");
}


/* =========================================================
   FAVORITES
========================================================= */

async function toggleFavorite(
    targetId,
    targetType,
    button
) {
    if (!state.user) {
        openModal("loginModal");
        return;
    }


    try {

        const data =
            await apiPost(
                "/favorites/toggle",
                {
                    targetId,
                    targetType
                }
            );


        const active =
            data.favorite ||
            data.isFavorite;


        if (button) {
            button.textContent =
                active
                    ? "♥"
                    : "♡";

            button.classList.toggle(
                "active",
                !!active
            );
        }


        toast(
            active
                ? "Ба дӯстдошта илова шуд."
                : "Аз дӯстдошта хориҷ шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message ||
            "Амалиёт иҷро нашуд.",
            "error"
        );
    }
}


/* =========================================================
   JOB APPLICATION
========================================================= */

async function applyToJob(job) {
    if (!state.user) {
        openModal("loginModal");

        toast(
            "Барои ариза додан ворид шавед.",
            "info"
        );

        return;
    }


    const message =
        window.prompt(
            "Паёми кӯтоҳ барои корфармо:"
        );


    if (message === null) {
        return;
    }


    try {

        await apiPost(
            "/applications",
            {
                jobId: job.id,
                message
            }
        );


        toast(
            "Аризаи шумо фиристода шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message ||
            "Ариза фиристода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   PROJECT PROPOSAL
========================================================= */

async function sendProposal(project) {
    if (!state.user) {
        openModal("loginModal");

        toast(
            "Барои proposal фиристодан ворид шавед.",
            "info"
        );

        return;
    }


    const price =
        window.prompt(
            "Нархи пешниҳоди шумо:"
        );


    if (price === null) {
        return;
    }


    const message =
        window.prompt(
            "Паёми proposal:"
        );


    if (message === null) {
        return;
    }


    const deliveryTime =
        window.prompt(
            "Мӯҳлати иҷро, масалан: 7 рӯз"
        );


    try {

        await apiPost(
            "/proposals",
            {
                projectId: project.id,
                price: Number(price),
                message,
                deliveryTime
            }
        );


        toast(
            "Proposal бомуваффақият фиристода шуд.",
            "success"
        );


    } catch (error) {

        toast(
            error.message ||
            "Proposal фиристода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   ORDER
========================================================= */

async function createOrder(
    item,
    type
) {
    if (!state.user) {
        openModal("loginModal");
        return;
    }


    const confirmed =
        window.confirm(
            `Оё мехоҳед "${item.title || item.name}"-ро дархост кунед?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiPost(
            "/orders",
            {
                itemId: item.id,
                itemType:
                    type === "product"
                        ? "PRODUCT"
                        : "SERVICE"
            }
        );


        toast(
            "Дархости шумо фиристода шуд.",
            "success"
        );


        closeModal(
            "detailModal"
        );

    } catch (error) {

        toast(
            error.message ||
            "Дархост иҷро нашуд.",
            "error"
        );
    }
}


/* =========================================================
   CREATE PROJECT
========================================================= */

async function handleCreateProject(
    event
) {
    event.preventDefault();


    if (!state.user) {
        closeModal("projectModal");
        openModal("loginModal");
        return;
    }


    const title =
        get("projectTitle")
            ?.value.trim();

    const description =
        get("projectDescription")
            ?.value.trim();

    const category =
        get("projectFormCategory")
            ?.value;

    const budget =
        get("projectBudget")
            ?.value;

    const deadline =
        get("projectDeadline")
            ?.value;

    const region =
        get("projectRegion")
            ?.value;

    const city =
        get("projectCity")
            ?.value.trim();

    const skills =
        get("projectSkills")
            ?.value.trim();

    const files =
        get("projectFiles")
            ?.files;


    if (!title || !description || !category) {

        toast(
            "Ном, тавсиф ва категория ҳатмист.",
            "error"
        );

        return;
    }


    const button =
        get("projectSubmitBtn");


    setButtonLoading(
        button,
        true,
        "Нашр шуда истодааст..."
    );


    try {

        let body;


        if (files?.length) {

            body =
                new FormData();

            body.append(
                "title",
                title
            );

            body.append(
                "description",
                description
            );

            body.append(
                "category",
                category
            );

            body.append(
                "budget",
                budget || ""
            );

            body.append(
                "deadline",
                deadline || ""
            );

            body.append(
                "region",
                region || ""
            );

            body.append(
                "city",
                city || ""
            );

            body.append(
                "skills",
                skills || ""
            );


            [...files].forEach(
                file =>
                    body.append(
                        "files",
                        file
                    )
            );

        } else {

            body = {
                title,
                description,
                category,
                budget:
                    budget
                        ? Number(budget)
                        : null,
                deadline:
                    deadline || null,
                region:
                    region || null,
                city:
                    city || null,
                skills:
                    skills
                        ? skills
                            .split(",")
                            .map(
                                x =>
                                    x.trim()
                            )
                            .filter(Boolean)
                        : []
            };
        }


        await apiPost(
            "/projects",
            body
        );


        closeModal(
            "projectModal"
        );


        get("projectForm")
            ?.reset();


        toast(
            "Лоиҳа бомуваффақият нашр шуд.",
            "success"
        );


        await loadProjects();

    } catch (error) {

        toast(
            error.message ||
            "Лоиҳа нашр нашуд.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Лоиҳаро нашр кардан"
        );
    }
}


get("projectForm")
    ?.addEventListener(
        "submit",
        handleCreateProject
    );


/* =========================================================
   ADD SERVICE
========================================================= */

function openServiceModal() {

    if (!state.user) {
        openModal("loginModal");

        toast(
            "Барои илова кардани хизматрасонӣ ворид шавед.",
            "info"
        );

        return;
    }

    openModal(
        "serviceModal"
    );
}


async function handleCreateService(
    event
) {
    event.preventDefault();


    if (!state.user) {
        closeModal("serviceModal");
        openModal("loginModal");
        return;
    }


    const title =
        get("serviceTitle")
            ?.value.trim();

    const description =
        get("serviceDescription")
            ?.value.trim();

    const category =
        get("serviceCategory")
            ?.value;

    const price =
        get("servicePrice")
            ?.value;

    const region =
        get("serviceRegion")
            ?.value;

    const image =
        get("serviceImage")
            ?.files?.[0];


    if (
        !title ||
        !description ||
        !category ||
        !price
    ) {

        toast(
            "Маълумоти заруриро пур кунед.",
            "error"
        );

        return;
    }


    const button =
        get("serviceSubmitBtn");


    setButtonLoading(
        button,
        true,
        "Нашр шуда истодааст..."
    );


    try {

        let body;


        if (image) {

            body =
                new FormData();

            body.append(
                "title",
                title
            );

            body.append(
                "description",
                description
            );

            body.append(
                "category",
                category
            );

            body.append(
                "price",
                price
            );

            body.append(
                "region",
                region || ""
            );

            body.append(
                "image",
                image
            );

        } else {

            body = {
                title,
                description,
                category,
                price: Number(price),
                region:
                    region || null
            };
        }


        await apiPost(
            "/services",
            body
        );


        closeModal(
            "serviceModal"
        );


        get("serviceForm")
            ?.reset();


        toast(
            "Хизматрасонӣ нашр шуд.",
            "success"
        );


        state.currentMarketType =
            "services";


        if (get("servicesTab")) {
            get("servicesTab")
                .click();
        }


    } catch (error) {

        toast(
            error.message ||
            "Хизматрасонӣ нашр нашуд.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Хизматрасониро нашр кардан"
        );
    }
}


get("serviceForm")
    ?.addEventListener(
        "submit",
        handleCreateService
    );


/* =========================================================
   PRODUCT
========================================================= */

async function handleCreateProduct(
    event
) {
    event.preventDefault();


    if (!state.user) {
        closeModal("productModal");
        openModal("loginModal");
        return;
    }


    const title =
        get("productTitle")
            ?.value.trim();

    const description =
        get("productDescription")
            ?.value.trim();

    const price =
        get("productPrice")
            ?.value;

    const category =
        get("productCategory")
            ?.value;

    const images =
        get("productImages")
            ?.files;


    if (
        !title ||
        !description ||
        !price ||
        !category
    ) {

        toast(
            "Маълумоти заруриро пур кунед.",
            "error"
        );

        return;
    }


    const button =
        get("productSubmitBtn");


    setButtonLoading(
        button,
        true,
        "Нашр шуда истодааст..."
    );


    try {

        let body;


        if (images?.length) {

            body =
                new FormData();

            body.append(
                "title",
                title
            );

            body.append(
                "description",
                description
            );

            body.append(
                "price",
                price
            );

            body.append(
                "category",
                category
            );


            [...images].forEach(
                file =>
                    body.append(
                        "images",
                        file
                    )
            );

        } else {

            body = {
                title,
                description,
                price: Number(price),
                category
            };
        }


        await apiPost(
            "/products",
            body
        );


        closeModal(
            "productModal"
        );


        get("productForm")
            ?.reset();


        toast(
            "Маҳсулот нашр шуд.",
            "success"
        );


        if (get("productsTab")) {
            get("productsTab")
                .click();
        }

    } catch (error) {

        toast(
            error.message ||
            "Маҳсулот нашр нашуд.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Маҳсулотро нашр кардан"
        );
    }
}


get("productForm")
    ?.addEventListener(
        "submit",
        handleCreateProduct
    );


/* =========================================================
   REAL ESTATE CREATE
========================================================= */

async function handleCreateRealEstate(
    event
) {
    event.preventDefault();


    if (!state.user) {
        closeModal(
            "realEstateModal"
        );

        openModal("loginModal");

        return;
    }


    const title =
        get("realEstateTitle")
            ?.value.trim();

    const description =
        get("realEstateDescription")
            ?.value.trim();

    const dealType =
        get("realEstateDealType")
            ?.value;

    const type =
        get("realEstateFormType")
            ?.value;

    const price =
        get("realEstatePrice")
            ?.value;

    const rooms =
        get("realEstateFormRooms")
            ?.value;

    const area =
        get("realEstateArea")
            ?.value;

    const floor =
        get("realEstateFloor")
            ?.value;

    const address =
        get("realEstateAddress")
            ?.value.trim();

    const region =
        get("realEstateFormRegion")
            ?.value;

    const city =
        get("realEstateCity")
            ?.value.trim();

    const phone =
        get("realEstatePhone")
            ?.value.trim();

    const images =
        get("realEstateImages")
            ?.files;


    if (
        !title ||
        !description ||
        !dealType ||
        !type ||
        !price ||
        !region
    ) {

        toast(
            "Майдонҳои заруриро пур кунед.",
            "error"
        );

        return;
    }


    const button =
        get(
            "realEstateSubmitBtn"
        );


    setButtonLoading(
        button,
        true,
        "Нашр шуда истодааст..."
    );


    try {

        let body;


        if (images?.length) {

            body =
                new FormData();

            body.append(
                "title",
                title
            );

            body.append(
                "description",
                description
            );

            body.append(
                "dealType",
                dealType
            );

            body.append(
                "type",
                type
            );

            body.append(
                "price",
                price
            );

            body.append(
                "rooms",
                rooms || ""
            );

            body.append(
                "area",
                area || ""
            );

            body.append(
                "floor",
                floor || ""
            );

            body.append(
                "address",
                address || ""
            );

            body.append(
                "region",
                region
            );

            body.append(
                "city",
                city || ""
            );

            body.append(
                "phone",
                phone || ""
            );


            [...images].forEach(
                file =>
                    body.append(
                        "images",
                        file
                    )
            );

        } else {

            body = {
                title,
                description,
                dealType,
                type,
                price: Number(price),
                rooms:
                    rooms
                        ? Number(rooms)
                        : null,
                area:
                    area
                        ? Number(area)
                        : null,
                floor:
                    floor
                        ? Number(floor)
                        : null,
                address:
                    address || null,
                region,
                city:
                    city || null,
                phone:
                    phone || null
            };
        }


        await apiPost(
            "/real-estate",
            body
        );


        closeModal(
            "realEstateModal"
        );


        get("realEstateForm")
            ?.reset();


        toast(
            "Эълони манзил нашр шуд.",
            "success"
        );


        await loadRealEstate();

    } catch (error) {

        toast(
            error.message ||
            "Эълон нашр нашуд.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Эълонро нашр кардан"
        );
    }
}


get("realEstateForm")
    ?.addEventListener(
        "submit",
        handleCreateRealEstate
    );


/* =========================================================
   CTA REGISTER
========================================================= */

get("ctaRegisterBtn")
    ?.addEventListener(
        "click",
        () => openModal(
            "registerModal"
        )
    );


get("footerRegisterBtn")
    ?.addEventListener(
        "click",
        () => openModal(
            "registerModal"
        )
    );


get("footerLoginBtn")
    ?.addEventListener(
        "click",
        () => openModal(
            "loginModal"
        )
    );


get("footerAddServiceBtn")
    ?.addEventListener(
        "click",
        openServiceModal
    );


get("footerAddJobBtn")
    ?.addEventListener(
        "click",
        () => get("addJobBtn")?.click()
    );


get("footerAddRealEstateBtn")
    ?.addEventListener(
        "click",
        () => get(
            "addRealEstateBtn"
        )?.click()
    );


/* =========================================================
   MOBILE BOTTOM NAV
========================================================= */

[
    [
        "bottomHomeBtn",
        "home"
    ],
    [
        "bottomSpecialistsBtn",
        "specialists"
    ],
    [
        "bottomMarketplaceBtn",
        "marketplace"
    ],
    [
        "bottomJobsBtn",
        "jobs"
    ]
].forEach(
    ([id, section]) => {

        get(id)?.addEventListener(
            "click",
            () =>
                scrollToSection(
                    section
                )
        );

    }
);


/* =========================================================
   INTERSECTION OBSERVER
========================================================= */

function setupScrollObserver() {
    const sections =
        $$("main section[id]");

    if (!sections.length) return;


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            setActiveNav(
                                entry.target.id
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.25
            }
        );


    sections.forEach(
        section =>
            observer.observe(
                section
            )
    );
}


/* =========================================================
   REVEAL ANIMATIONS
========================================================= */

function setupRevealAnimations() {
    const elements =
        $$(
            ".section, .card, .category-card, .step, .region-card"
        );

    if (!elements.length) return;


    if (
        !("IntersectionObserver" in window)
    ) {
        elements.forEach(
            element =>
                element.classList.add(
                    "visible"
                )
        );

        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.08
            }
        );


    elements.forEach(
        element =>
            observer.observe(
                element
            )
    );
}


/* =========================================================
   LOADING SCREEN
========================================================= */

function hideLoader() {
    const loader =
        get("appLoader");

    if (!loader) return;

    loader.classList.add(
        "loaded"
    );

    setTimeout(
        () => loader.remove(),
        700
    );
}


/* =========================================================
   LOAD ALL
========================================================= */

async function loadAllData() {
    if (state.loading) return;

    state.loading = true;


    try {

        await Promise.allSettled([
            loadSpecialists(),
            loadServices(),
            loadJobs(),
            loadProjects(),
            loadRealEstate(),
            loadReviews()
        ]);


        if (state.user) {
            await loadNotifications();
        }


    } finally {

        state.loading = false;
    }
}


/* =========================================================
   STATS
========================================================= */

async function loadStats() {
    try {

        const data =
            await apiGet(
                "/stats"
            );


        updateStat(
            "statSpecialists",
            data.specialists ||
            data.smm ||
            0
        );


        updateStat(
            "statServices",
            data.services ||
            0
        );


        updateStat(
            "statProjects",
            data.projects ||
            0
        );


        updateStat(
            "statJobs",
            data.jobs ||
            0
        );

    } catch {
        // Stats can remain 0 until API exists.
    }
}


function updateStat(
    id,
    value
) {
    const element =
        get(id);

    if (!element) return;

    element.textContent =
        formatNumber(
            Number(value) || 0
        );
}


/* =========================================================
   UTILITY — NORMALIZE LIST
========================================================= */

function normalizeList(data) {

    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.data
        )
    ) {
        return data.data;
    }

    if (
        Array.isArray(
            data?.items
        )
    ) {
        return data.items;
    }

    if (
        Array.isArray(
            data?.results
        )
    ) {
        return data.results;
    }

    return [];
}


/* =========================================================
   SKELETON
========================================================= */

function showSkeleton(
    container,
    count = 6
) {
    if (!container) return;

    container.innerHTML =
        Array.from(
            {
                length: count
            },
            () => `
                <div class="skeleton-card">

                    <div class="skeleton-image"></div>

                    <div class="skeleton-line long"></div>

                    <div class="skeleton-line"></div>

                    <div class="skeleton-line short"></div>

                </div>
            `
        ).join("");
}


/* =========================================================
   EMPTY
========================================================= */

function renderEmpty(
    container,
    message,
    small = false
) {
    if (!container) return;

    container.innerHTML = `
        <div
            class="empty-state ${
                small
                    ? "small"
                    : ""
            }"
        >

            <div class="empty-icon">
                ◌
            </div>

            <strong>
                ${escapeHTML(
                    message
                )}
            </strong>

        </div>
    `;
}


/* =========================================================
   ERROR
========================================================= */

function renderError(
    container,
    message
) {
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state error-state">

            <div class="empty-icon">
                !
            </div>

            <strong>
                ${escapeHTML(
                    message
                )}
            </strong>

            <button
                type="button"
                class="btn btn-ghost retry-btn"
            >
                Аз нав кӯшиш кардан
            </button>

        </div>
    `;


    $(".retry-btn", container)
        ?.addEventListener(
            "click",
            () => location.reload()
        );
}


/* =========================================================
   NUMBER
========================================================= */

function formatNumber(value) {
    const number =
        Number(value) || 0;

    return number.toLocaleString(
        "tg-TJ"
    );
}


/* =========================================================
   PRICE
========================================================= */

function formatPrice(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Нарх мувофиқа мешавад";
    }

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {
        return String(value);
    }

    return (
        number.toLocaleString(
            "tg-TJ"
        ) +
        " сомонӣ"
    );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {
    if (!value) return "—";

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleDateString(
        "tg-TJ",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatTime(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleTimeString(
        "tg-TJ",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function formatDateTime(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "tg-TJ",
        {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   TRANSLATIONS
========================================================= */

function translateJobType(type) {
    const map = {
        FULL_TIME: "Full-time",
        PART_TIME: "Part-time",
        REMOTE: "Remote",
        FREELANCE: "Freelance"
    };

    return (
        map[type] ||
        type ||
        "Кор"
    );
}


function translateProjectStatus(status) {
    const map = {
        OPEN: "Кушода",
        IN_PROGRESS: "Дар кор",
        COMPLETED: "Анҷомшуда",
        CANCELLED: "Бекоршуда"
    };

    return (
        map[status] ||
        status ||
        "Кушода"
    );
}


function translateRealEstateType(type) {
    const map = {
        APARTMENT: "Квартира",
        HOUSE: "Хона",
        ROOM: "Ҳуҷра",
        OFFICE: "Офис",
        COMMERCIAL: "Коммерсия",
        LAND: "Замин"
    };

    return (
        map[type] ||
        type ||
        "Манзил"
    );
}


function notificationIcon(type) {
    const map = {
        PROPOSAL: "📋",
        PROPOSAL_ACCEPTED: "✅",
        PROPOSAL_REJECTED: "❌",
        MESSAGE: "💬",
        REVIEW: "⭐",
        PROJECT: "📁",
        APPLICATION: "📝",
        ADMIN: "🛡️"
    };

    return (
        map[type] ||
        "🔔"
    );
}


/* =========================================================
   URL SECURITY
========================================================= */

function safeUrl(url) {

    if (!url) {
        return CONFIG.DEFAULT_IMAGE;
    }

    try {

        const parsed =
            new URL(
                url,
                window.location.origin
            );


        if (
            parsed.protocol ===
                "http:" ||
            parsed.protocol ===
                "https:" ||
            parsed.protocol ===
                "blob:"
        ) {
            return parsed.href;
        }


    } catch {
        return CONFIG.DEFAULT_IMAGE;
    }


    return CONFIG.DEFAULT_IMAGE;
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {
    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   CURRENT YEAR
========================================================= */

if (exists("currentYear")) {
    get("currentYear")
        .textContent =
        new Date()
            .getFullYear();
}


/* =========================================================
   CATEGORY BUTTONS
========================================================= */

$$(".category-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const category =
                    card.dataset.category;

                if (
                    get(
                        "specialistCategory"
                    )
                ) {
                    get(
                        "specialistCategory"
                    ).value =
                        category;
                }


                if (
                    get(
                        "marketCategory"
                    )
                ) {
                    get(
                        "marketCategory"
                    ).value =
                        category;
                }


                scrollToSection(
                    "specialists"
                );


                loadSpecialists();

            }
        );

    });


/* =========================================================
   KEYBOARD SEARCH
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() ===
                "k"
        ) {

            event.preventDefault();

            openModal(
                "searchModal"
            );

            setTimeout(
                () =>
                    get(
                        "globalSearchInput"
                    )?.focus(),
                100
            );
        }

    }
);


/* =========================================================
   HEADER SCROLL
========================================================= */

window.addEventListener(
    "scroll",
    () => {

        const header =
            get("siteHeader");

        if (!header) return;

        header.classList.toggle(
            "scrolled",
            window.scrollY > 20
        );

    },
    {
        passive: true
    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

async function init() {

    loadStoredUser();

    updateAuthUI();

    setupScrollObserver();

    setupRevealAnimations();


    try {

        await Promise.allSettled([
            loadAllData(),
            loadStats()
        ]);

    } finally {

        hideLoader();

    }
}


/* =========================================================
   GLOBAL APP
========================================================= */

window.SMMTJ = {

    state,

    openModal,

    closeModal,

    closeAllModals,

    toast,

    apiRequest,

    apiGet,

    apiPost,

    apiPatch,

    apiPut,

    apiDelete,

    scrollToSection,

    loadSpecialists,

    loadServices,

    loadProducts,

    loadJobs,

    loadProjects,

    loadRealEstate,

    loadReviews,

    loadNotifications,

    loadConversations,

    openChat,

    openProfile,

    logout
};


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once: true
        }
    );

} else {

    init();

}
