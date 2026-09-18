/* =========================================================
   SMM.TJ — script.js
   Clean rebuild from zero
   Existing HTML IDs are NOT changed.
   No fake/demo data.
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const CONFIG = Object.freeze({
    API_BASE: "http://localhost:5000/api",
    TOKEN_KEY: "smm_tj_access_token",
    REFRESH_KEY: "smm_tj_refresh_token",
    USER_KEY: "smm_tj_user"
});


/* =========================================================
   STATE
========================================================= */

const state = {
    profiles: [],
    currentProfile: null,
    accessToken: localStorage.getItem(CONFIG.TOKEN_KEY) || "",
    refreshToken: localStorage.getItem(CONFIG.REFRESH_KEY) || "",
    user: readJSON(CONFIG.USER_KEY, null),
    currentSection: "home"
};


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function readJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value ?? "";
    }
}

function setElementText(root, selector, value) {
    const element = root.querySelector(selector);

    if (element) {
        element.textContent = value ?? "";
    }
}

function setButtonLoading(
    button,
    loading,
    loadingText = "Интизор шавед..."
) {
    if (!button) return;

    if (loading) {
        if (!button.dataset.originalHTML) {
            button.dataset.originalHTML = button.innerHTML;
        }

        button.disabled = true;
        button.textContent = loadingText;
    } else {
        button.disabled = false;

        button.innerHTML =
            button.dataset.originalHTML ||
            button.innerHTML;
    }
}


/* =========================================================
   TOAST
========================================================= */

function toast(message, type = "info") {
    const container = $("toastContainer");

    if (!container) {
        console.log(`[${type}] ${message}`);
        return;
    }

    const item = document.createElement("div");

    item.className = `toast toast-${type}`;
    item.textContent = message;

    container.appendChild(item);

    setTimeout(() => {
        item.remove();
    }, 4000);
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");
}

function closeModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    if (!$(".modal.open")) {
        document.body.classList.remove("modal-open");
    }
}

function closeAllModals() {
    $all(".modal.open").forEach(modal => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
    });

    document.body.classList.remove("modal-open");
}

function setupModals() {

    $all("[data-close-modal]").forEach(button => {

        button.addEventListener("click", () => {

            closeModal(
                button.dataset.closeModal
            );

        });

    });


    $all(".modal").forEach(modal => {

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                closeModal(modal.id);
            }

        });

    });


    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            closeAllModals();
        }

    });

}


/* =========================================================
   API
========================================================= */

async function apiRequest(path, options = {}) {

    const headers = new Headers(
        options.headers || {}
    );


    if (
        options.body !== undefined &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }


    if (state.accessToken) {

        headers.set(
            "Authorization",
            `Bearer ${state.accessToken}`
        );

    }


    const response = await fetch(
        `${CONFIG.API_BASE}${path}`,
        {
            ...options,
            headers
        }
    );


    let data = null;

    const contentType =
        response.headers.get("content-type") || "";


    if (
        contentType.includes("application/json")
    ) {

        data = await response.json();

    } else {

        const text =
            await response.text();

        data = text
            ? { message: text }
            : null;

    }


    if (!response.ok) {

        const message =
            data?.message ||
            data?.error ||
            `HTTP ${response.status}`;

        throw new Error(message);

    }


    return data;
}


async function apiGet(path) {

    return apiRequest(path, {
        method: "GET"
    });

}


async function apiPost(path, body) {

    return apiRequest(path, {
        method: "POST",
        body: JSON.stringify(body)
    });

}


async function apiPatch(path, body) {

    return apiRequest(path, {
        method: "PATCH",
        body: JSON.stringify(body)
    });

}


async function apiDelete(path) {

    return apiRequest(path, {
        method: "DELETE"
    });

}


/* =========================================================
   AUTH STORAGE
========================================================= */

function saveAuth(data) {

    if (!data) return;


    if (data.accessToken) {

        state.accessToken =
            data.accessToken;

        localStorage.setItem(
            CONFIG.TOKEN_KEY,
            data.accessToken
        );

    }


    if (data.refreshToken) {

        state.refreshToken =
            data.refreshToken;

        localStorage.setItem(
            CONFIG.REFRESH_KEY,
            data.refreshToken
        );

    }


    if (data.user) {

        state.user =
            data.user;

        saveJSON(
            CONFIG.USER_KEY,
            data.user
        );

    }


    updateAuthUI();

}


function clearAuth() {

    state.accessToken = "";
    state.refreshToken = "";
    state.user = null;
    state.currentProfile = null;


    localStorage.removeItem(
        CONFIG.TOKEN_KEY
    );

    localStorage.removeItem(
        CONFIG.REFRESH_KEY
    );

    localStorage.removeItem(
        CONFIG.USER_KEY
    );


    updateAuthUI();

}


function updateAuthUI() {

    const loggedIn =
        Boolean(
            state.user ||
            state.accessToken
        );


    if ($("loginBtn")) {
        $("loginBtn").hidden =
            loggedIn;
    }


    if ($("registerBtn")) {
        $("registerBtn").hidden =
            loggedIn;
    }


    if ($("profileBtn")) {
        $("profileBtn").hidden =
            !loggedIn;
    }


    if (loggedIn) {

        const name =
            state.user?.name ||
            state.user?.fullName ||
            state.user?.username ||
            state.user?.email ||
            "Профил";


        setText(
            "profileName",
            name
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {

    const section =
        $(sectionId);

    if (!section) return;


    state.currentSection =
        sectionId;


    $all("[data-section]").forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionId
            );

        }
    );


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });


    $("mobileNav")
        ?.classList.remove("open");


    $("mobileMenuBtn")
        ?.setAttribute(
            "aria-expanded",
            "false"
        );

}


function setupNavigation() {

    $all("[data-section]").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    if (!section) return;

                    showSection(section);

                }
            );

        }
    );


    $("logoBtn")?.addEventListener(
        "click",
        () => {

            showSection("home");

        }
    );


    $("findSpecialistBtn")
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "specialists"
                );

            }
        );


    $("mobileMenuBtn")
        ?.addEventListener(
            "click",
            () => {

                const nav =
                    $("mobileNav");

                if (!nav) return;


                nav.classList.toggle(
                    "open"
                );


                $("mobileMenuBtn")
                    .setAttribute(
                        "aria-expanded",
                        String(
                            nav.classList.contains(
                                "open"
                            )
                        )
                    );

            }
        );

}


/* =========================================================
   PROFILES — REAL DATABASE
========================================================= */

async function loadProfiles() {

    const grid =
        $("specialistsGrid");


    if (grid) {

        grid.innerHTML = `
            <div class="empty-state">
                Мутахассисон бор шуда истодаанд...
            </div>
        `;

    }


    try {

        const result =
            await apiGet(
                "/profiles"
            );


        state.profiles =
            Array.isArray(result?.data)
                ? result.data
                : [];


        renderProfiles(
            state.profiles
        );


        updateStats();


    } catch (error) {

        console.error(
            "loadProfiles:",
            error
        );


        if (grid) {

            grid.innerHTML = `
                <div class="empty-state">
                    Мутахассисон бор карда нашуданд.
                </div>
            `;

        }


        toast(
            "Хатогӣ ҳангоми гирифтани мутахассисон.",
            "error"
        );

    }

}


/* =========================================================
   RENDER PROFILES
========================================================= */

function renderProfiles(profiles) {

    const grid =
        $("specialistsGrid");

    if (!grid) return;


    grid.innerHTML = "";


    if (!profiles.length) {

        grid.innerHTML = `
            <div class="empty-state">
                Ҳоло ягон мутахассис сабт нашудааст.
            </div>
        `;

        return;

    }


    const template =
        $("specialistCardTemplate");


    profiles.forEach(
        profile => {

            let card;


            if (template?.content) {

                card =
                    template.content.cloneNode(
                        true
                    );

            } else {

                card =
                    document.createElement(
                        "div"
                    );


                card.innerHTML = `
                    <article class="card specialist-card">

                        <div class="card-content">

                            <h3 class="specialist-name"></h3>

                            <p class="specialist-bio"></p>

                            <div class="card-meta">

                                <span class="meta specialist-location"></span>

                                <span class="meta specialist-experience"></span>

                            </div>

                            <div class="card-actions">

                                <button
                                    class="btn btn-primary specialist-profile-btn"
                                    type="button"
                                >
                                    Профил
                                </button>

                                <button
                                    class="btn btn-ghost specialist-contact-btn"
                                    type="button"
                                >
                                    Тамос
                                </button>

                            </div>

                        </div>

                    </article>
                `;

            }


            const root =
                card.querySelector(
                    ".specialist-card"
                ) ||
                card.firstElementChild;


            if (!root) return;


            root.dataset.id =
                profile.id;


            const name =
                profile.name ||
                "Бе ном";


            const service =
                profile.service ||
                "Хизматрасонӣ";


            const category =
                profile.category ||
                "SMM";


            const experience =
                profile.experience ||
                "—";


            const avatar =
                root.querySelector(
                    ".specialist-avatar"
                );


            if (avatar) {

                avatar.src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111111&color=ffffff`;

                avatar.alt =
                    name;

            }


            setElementText(
                root,
                ".specialist-role",
                category
            );


            setElementText(
                root,
                ".specialist-name",
                name
            );


            setElementText(
                root,
                ".specialist-bio",
                service
            );


            setElementText(
                root,
                ".specialist-location",
                "Тоҷикистон"
            );


            setElementText(
                root,
                ".specialist-experience",
                `Таҷриба: ${experience}`
            );


            setElementText(
                root,
                ".specialist-rating",
                "Рейтинг: —"
            );


            root
                .querySelector(
                    ".specialist-profile-btn"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        openProfileDetail(
                            profile
                        );

                    }
                );


            root
                .querySelector(
                    ".specialist-contact-btn"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        contactProfile(
                            profile
                        );

                    }
                );


            grid.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   PROFILE DETAIL
========================================================= */

function openProfileDetail(
    profile
) {

    state.currentProfile =
        profile;


    const content =
        $("detailContent");


    if (!content) return;


    content.innerHTML = `

        <div class="detail-content">

            <div class="eyebrow">
                SPECIALIST
            </div>

            <h2>
                ${escapeHTML(
                    profile.name ||
                    "Бе ном"
                )}
            </h2>

            <p>
                ${escapeHTML(
                    profile.service ||
                    "Хизматрасонӣ нишон дода нашудааст."
                )}
            </p>

            <div class="card-meta">

                <span class="meta">
                    ${escapeHTML(
                        profile.category ||
                        "—"
                    )}
                </span>

                <span class="meta">
                    Таҷриба:
                    ${escapeHTML(
                        profile.experience ||
                        "—"
                    )}
                </span>

                <span class="meta">
                    Нарх:
                    ${escapeHTML(
                        profile.price ||
                        "—"
                    )}
                </span>

            </div>


            <div class="card-meta">

                <span class="meta">
                    Телефон:
                    ${escapeHTML(
                        profile.phone ||
                        "—"
                    )}
                </span>

                <span class="meta">
                    Instagram:
                    ${escapeHTML(
                        profile.instagram ||
                        "—"
                    )}
                </span>

            </div>


            <div class="card-actions">

                <button
                    type="button"
                    class="btn btn-primary"
                    id="detailContactBtn"
                >
                    Тамос
                </button>

            </div>

        </div>

    `;


    $("detailContactBtn")
        ?.addEventListener(
            "click",
            () => {

                contactProfile(
                    profile
                );

            }
        );


    openModal(
        "detailModal"
    );

}


/* =========================================================
   CONTACT
========================================================= */

function contactProfile(
    profile
) {

    if (profile.phone) {

        window.location.href =
            `tel:${profile.phone}`;

        return;

    }


    toast(
        "Барои ин мутахассис рақами телефон нишон дода нашудааст.",
        "info"
    );

}


/* =========================================================
   CREATE PROFILE
========================================================= */

async function handleProfileCreate(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const data = {

        name:
            form.querySelector(
                "[name='name']"
            )?.value.trim(),

        instagram:
            form.querySelector(
                "[name='instagram']"
            )?.value.trim() ||
            null,

        phone:
            form.querySelector(
                "[name='phone']"
            )?.value.trim(),

        category:
            form.querySelector(
                "[name='category']"
            )?.value.trim(),

        service:
            form.querySelector(
                "[name='service']"
            )?.value.trim(),

        experience:
            form.querySelector(
                "[name='experience']"
            )?.value.trim() ||
            null,

        price:
            form.querySelector(
                "[name='price']"
            )?.value.trim() ||
            null

    };


    if (
        !data.name ||
        !data.phone ||
        !data.category ||
        !data.service
    ) {

        toast(
            "Ном, телефон, категория ва хизматрасонӣ ҳатмӣ мебошанд.",
            "error"
        );

        return;

    }


    const submit =
        form.querySelector(
            "button[type='submit']"
        );


    setButtonLoading(
        submit,
        true,
        "Сабт шуда истодааст..."
    );


    try {

        const result =
            await apiPost(
                "/profiles",
                data
            );


        if (result?.data) {

            state.profiles.unshift(
                result.data
            );

        }


        form.reset();


        renderProfiles(
            state.profiles
        );


        updateStats();


        toast(
            "Профил ба базаи маълумот сабт шуд.",
            "success"
        );


        closeModal(
            "specialistModal"
        );


    } catch (error) {

        console.error(
            "handleProfileCreate:",
            error
        );


        toast(
            error.message ||
            "Профилро сабт кардан нашуд.",
            "error"
        );


    } finally {

        setButtonLoading(
            submit,
            false,
            "Сабт кардан"
        );

    }

}


/* =========================================================
   AUTH UI
========================================================= */

function setupAuthUI() {

    $("loginBtn")
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "loginModal"
                );

            }
        );


    $("registerBtn")
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "registerModal"
                );

            }
        );


    $("openRegisterFromLogin")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    "loginModal"
                );

                openModal(
                    "registerModal"
                );

            }
        );


    $("openLoginFromRegister")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    "registerModal"
                );

                openModal(
                    "loginModal"
                );

            }
        );


    $("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    "loginModal"
                );

                openModal(
                    "forgotPasswordModal"
                );

            }
        );


    $("logoutBtn")
        ?.addEventListener(
            "click",
            () => {

                clearAuth();

                closeAllModals();

                toast(
                    "Шумо аз ҳисоб баромадед.",
                    "success"
                );

            }
        );


    $("profileBtn")
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "profileModal"
                );

                renderCurrentUser();

            }
        );


    $("profileMenuBtn")
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "profileModal"
                );

                renderCurrentUser();

            }
        );

}


/* =========================================================
   CURRENT USER
========================================================= */

function renderCurrentUser() {

    const content =
        $("profileContent");


    if (!content) return;


    if (!state.user) {

        content.innerHTML = `
            <div class="empty-state">
                Ба ҳисоб ворид шавед.
            </div>
        `;

        return;

    }


    const name =
        state.user.name ||
        state.user.fullName ||
        state.user.username ||
        "Истифодабаранда";


    content.innerHTML = `

        <div class="detail-content">

            <div class="eyebrow">
                MY PROFILE
            </div>

            <h2>
                ${escapeHTML(name)}
            </h2>

            <p>
                ${escapeHTML(
                    state.user.email ||
                    state.user.phone ||
                    "Маълумоти тамос нест."
                )}
            </p>

        </div>

    `;

}


/* =========================================================
   SEARCH
========================================================= */

function searchProfiles(
    query,
    category = ""
) {

    const text =
        query
            .trim()
            .toLowerCase();


    const result =
        state.profiles.filter(
            profile => {

                const matchesText =
                    !text ||
                    [
                        profile.name,
                        profile.service,
                        profile.category,
                        profile.experience,
                        profile.price
                    ]
                        .filter(Boolean)
                        .some(
                            value =>
                                String(value)
                                    .toLowerCase()
                                    .includes(text)
                        );


                const matchesCategory =
                    !category ||
                    String(
                        profile.category ||
                        ""
                    ).toUpperCase() ===
                    String(
                        category
                    ).toUpperCase();


                return (
                    matchesText &&
                    matchesCategory
                );

            }
        );


    renderProfiles(
        result
    );


    return result;

}


/* =========================================================
   SEARCH UI
========================================================= */

function setupSearch() {

    $("heroSearchForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const query =
                    $("heroSearchInput")
                        ?.value ||
                    "";


                const category =
                    $("heroCategory")
                        ?.value ||
                    "";


                showSection(
                    "specialists"
                );


                searchProfiles(
                    query,
                    category
                );

            }
        );


    $("globalSearchBtn")
        ?.addEventListener(
            "click",
            () => {

                openModal(
                    "searchModal"
                );


                $("globalSearchInput")
                    ?.focus();

            }
        );


    $("searchForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const query =
                    $("globalSearchInput")
                        ?.value ||
                    "";


                const category =
                    $("globalSearchCategory")
                        ?.value ||
                    "";


                closeModal(
                    "searchModal"
                );


                showSection(
                    "specialists"
                );


                searchProfiles(
                    query,
                    category
                );

            }
        );

}


/* =========================================================
   SPECIALIST FILTER
========================================================= */

function setupProfileFilters() {

    $("specialistFilterForm")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const query =
                    $("specialistSearch")
                        ?.value ||
                    "";


                const category =
                    $("specialistCategory")
                        ?.value ||
                    "";


                let result =
                    state.profiles.filter(
                        profile => {

                            const matchesText =
                                !query ||
                                [
                                    profile.name,
                                    profile.service,
                                    profile.category,
                                    profile.experience
                                ]
                                    .filter(Boolean)
                                    .some(
                                        value =>
                                            String(value)
                                                .toLowerCase()
                                                .includes(
                                                    query.toLowerCase()
                                                )
                                    );


                            const matchesCategory =
                                !category ||
                                String(
                                    profile.category ||
                                    ""
                                ).toUpperCase() ===
                                category.toUpperCase();


                            return (
                                matchesText &&
                                matchesCategory
                            );

                        }
                    );


                result.sort(
                    (a, b) =>
                        new Date(
                            b.created_at ||
                            0
                        ) -
                        new Date(
                            a.created_at ||
                            0
                        )
                );


                renderProfiles(
                    result
                );

            }
        );

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

    setText(
        "statSpecialists",
        state.profiles.length
    );

}


/* =========================================================
   PROFILE CREATE BUTTON
========================================================= */

function setupProfileCreateButton() {

    const buttons = [
        $("newSpecialistBtn"),
        $("becomeSpecialistBtn"),
        $("createSpecialistBtn")
    ].filter(Boolean);


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openModal(
                        "specialistModal"
                    );

                }
            );

        }
    );


    const form =
        $("specialistForm");


    if (form) {

        form.addEventListener(
            "submit",
            handleProfileCreate
        );

    }

}


/* =========================================================
   UNSUPPORTED ACTIONS
   No fake operations.
========================================================= */

function setupSafePlaceholders() {

    const buttons = [

        [
            "createProjectBtn",
            "Лоиҳа"
        ],

        [
            "newProjectBtn",
            "Лоиҳа"
        ],

        [
            "newJobBtn",
            "Ҷойи кор"
        ],

        [
            "postJobBtn",
            "Ҷойи кор"
        ],

        [
            "newServiceBtn",
            "Хизматрасонӣ"
        ]

    ];


    buttons.forEach(
        ([id, name]) => {

            const button =
                $(id);


            if (!button) return;


            button.addEventListener(
                "click",
                () => {

                    toast(
                        `${name} ҳоло дар backend пайваст карда нашудааст.`,
                        "info"
                    );

                }
            );

        }
    );

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    const loader =
        $("appLoader");


    if (!loader) return;


    loader.classList.add(
        "hidden"
    );


    setTimeout(
        () => {

            loader.remove();

        },
        500
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function init() {

    setupModals();

    setupNavigation();

    setupAuthUI();

    setupSearch();

    setupProfileFilters();

    setupProfileCreateButton();

    setupSafePlaceholders();

    updateAuthUI();


    await loadProfiles();


    hideLoader();


    console.log(
        "SMM.TJ script.js loaded."
    );

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
        init,
        {
            once: true
        }
    );

} else {

    init();

}


/* =========================================================
   DEBUG
========================================================= */

window.SMMTJ = {

    state,

    apiGet,

    apiPost,

    apiPatch,

    apiDelete,

    loadProfiles,

    searchProfiles,

    openModal,

    closeModal,

    clearAuth

};
