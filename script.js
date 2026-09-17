/* =========================================================
   SMM.TJ — MAIN WEBSITE
   src/script.js
========================================================= */

const API_BASE =
    window.SMM_API_URL ||
    "http://localhost:4000/api";


/* =========================================================
   STATE
========================================================= */

const state = {
    accessToken:
        localStorage.getItem("smm_access_token") || "",

    refreshToken:
        localStorage.getItem("smm_refresh_token") || "",

    user: null,

    currentCategory: "",

    currentSearch: "",

    currentRegion: "",

    currentCity: "",

    marketplaceType: "services",

    page: {
        specialists: 1,
        marketplace: 1,
        jobs: 1,
        projects: 1,
        realEstate: 1
    },

    favorites: new Set(
        JSON.parse(
            localStorage.getItem(
                "smm_favorites"
            ) || "[]"
        )
    )
};


/* =========================================================
   DOM
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    Array.from(
        document.querySelectorAll(selector)
    );

const byId = (id) =>
    document.getElementById(id);


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   API
========================================================= */

async function api(
    endpoint,
    options = {},
    retry = true
) {
    const headers = new Headers(
        options.headers || {}
    );

    if (
        options.body &&
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

    let response;

    try {
        response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        toast(
            "Ба сервер пайваст шудан имконнопазир аст.",
            "error"
        );

        throw error;
    }

    if (
        response.status === 401 &&
        retry &&
        state.refreshToken
    ) {
        const refreshed =
            await refreshToken();

        if (refreshed) {
            return api(
                endpoint,
                options,
                false
            );
        }
    }

    let result;

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    if (
        contentType.includes(
            "application/json"
        )
    ) {
        result =
            await response.json();
    } else {
        result =
            await response.text();
    }

    if (!response.ok) {
        throw new Error(
            result?.message ||
            result ||
            `HTTP ${response.status}`
        );
    }

    return result;
}


/* =========================================================
   AUTH
========================================================= */

async function refreshToken() {
    if (!state.refreshToken) {
        return false;
    }

    try {
        const response =
            await fetch(
                `${API_BASE}/auth/refresh`,
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
            return false;
        }

        const data =
            await response.json();

        const access =
            data.accessToken ||
            data.data?.accessToken;

        const refresh =
            data.refreshToken ||
            data.data?.refreshToken;

        if (!access) {
            return false;
        }

        saveTokens(
            access,
            refresh
        );

        return true;
    } catch {
        return false;
    }
}


function saveTokens(
    accessToken,
    refreshToken
) {
    state.accessToken =
        accessToken;

    localStorage.setItem(
        "smm_access_token",
        accessToken
    );

    if (refreshToken) {
        state.refreshToken =
            refreshToken;

        localStorage.setItem(
            "smm_refresh_token",
            refreshToken
        );
    }
}


function clearAuth() {
    state.accessToken = "";
    state.refreshToken = "";
    state.user = null;

    localStorage.removeItem(
        "smm_access_token"
    );

    localStorage.removeItem(
        "smm_refresh_token"
    );
}


/* =========================================================
   TOAST
========================================================= */

function toast(
    message,
    type = "info"
) {
    let container =
        byId("toast-container") ||
        byId("admin-toast-container");

    if (!container) {
        container =
            document.createElement(
                "div"
            );

        container.id =
            "toast-container";

        document.body.appendChild(
            container
        );
    }

    const item =
        document.createElement("div");

    item.className =
        `toast toast-${type}`;

    item.innerHTML = `
        <span>
            ${
                type === "success"
                    ? "✓"
                    : type === "error"
                    ? "!"
                    : "i"
            }
        </span>

        <p>
            ${escapeHTML(message)}
        </p>

        <button type="button">
            ×
        </button>
    `;

    container.appendChild(item);

    item
        .querySelector("button")
        ?.addEventListener(
            "click",
            () => item.remove()
        );

    setTimeout(
        () => item.remove(),
        5000
    );
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    const modal = byId(id);

    if (!modal) return;

    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );
}


function closeModal(id) {
    const modal = byId(id);

    if (!modal) return;

    modal.hidden = true;

    document.body.classList.remove(
        "modal-open"
    );
}


function closeAllModals() {
    $$(".modal, .modal-overlay")
        .forEach((modal) => {
            modal.hidden = true;
        });

    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   AUTH UI
========================================================= */

async function loadCurrentUser() {
    if (!state.accessToken) {
        updateAuthUI();
        return;
    }

    try {
        const result =
            await api(
                "/auth/me"
            );

        state.user =
            result.data ||
            result.user ||
            result;

        updateAuthUI();
    } catch {
        clearAuth();
        updateAuthUI();
    }
}


function updateAuthUI() {
    const loginButtons =
        $$("[data-auth-login]");

    const profileButtons =
        $$("[data-auth-profile]");

    const logoutButtons =
        $$("[data-auth-logout]");


    loginButtons.forEach(
        (button) => {
            button.hidden =
                !!state.user;
        }
    );


    profileButtons.forEach(
        (button) => {
            button.hidden =
                !state.user;
        }
    );


    logoutButtons.forEach(
        (button) => {
            button.hidden =
                !state.user;
        }
    );


    const name =
        [
            state.user?.firstName,
            state.user?.lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        state.user?.username ||
        "Профил";


    $$("[data-user-name]")
        .forEach(
            el =>
                el.textContent = name
        );
}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    byId("login-form");

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const form =
                new FormData(
                    loginForm
                );

            const identifier =
                form.get("identifier") ||
                form.get("email") ||
                form.get("phone");

            const password =
                form.get("password");


            if (
                !identifier ||
                !password
            ) {
                toast(
                    "Email/телефон ва password-ро пур кунед.",
                    "warning"
                );
                return;
            }


            const button =
                loginForm.querySelector(
                    "button[type='submit']"
                );

            if (button) {
                button.disabled = true;
            }


            try {

                const result =
                    await api(
                        "/auth/login",
                        {
                            method: "POST",
                            body: JSON.stringify({
                                identifier,
                                email:
                                    form.get(
                                        "email"
                                    ),
                                phone:
                                    form.get(
                                        "phone"
                                    ),
                                password
                            })
                        }
                    );


                const data =
                    result.data ||
                    result;


                saveTokens(
                    data.accessToken ||
                    data.token,
                    data.refreshToken
                );


                state.user =
                    data.user || null;


                closeModal(
                    "login-modal"
                );


                updateAuthUI();


                toast(
                    "Хуш омадед!",
                    "success"
                );


                await loadHomeData();

            } catch (error) {

                toast(
                    error.message ||
                    "Воридшавӣ ноком шуд.",
                    "error"
                );

            } finally {

                if (button) {
                    button.disabled = false;
                }
            }
        }
    );
}


/* =========================================================
   REGISTER
========================================================= */

const registerForm =
    byId("register-form");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const form =
                new FormData(
                    registerForm
                );


            const password =
                form.get("password");

            const confirmPassword =
                form.get(
                    "confirmPassword"
                ) ||
                form.get(
                    "passwordConfirm"
                );


            if (
                password !==
                confirmPassword
            ) {

                toast(
                    "Паролҳо мувофиқ нестанд.",
                    "warning"
                );

                return;
            }


            const payload = {

                firstName:
                    form.get(
                        "firstName"
                    ),

                lastName:
                    form.get(
                        "lastName"
                    ),

                username:
                    form.get(
                        "username"
                    ),

                phone:
                    form.get(
                        "phone"
                    ),

                email:
                    form.get(
                        "email"
                    ),

                password,

                confirmPassword,

                region:
                    form.get(
                        "region"
                    ),

                city:
                    form.get(
                        "city"
                    ),

                role:
                    form.get(
                        "role"
                    ) ||
                    "CLIENT"
            };


            try {

                const result =
                    await api(
                        "/auth/register",
                        {
                            method: "POST",
                            body: JSON.stringify(
                                payload
                            )
                        }
                    );


                const data =
                    result.data ||
                    result;


                if (
                    data.accessToken ||
                    data.token
                ) {

                    saveTokens(
                        data.accessToken ||
                        data.token,
                        data.refreshToken
                    );

                    state.user =
                        data.user || null;

                }


                closeModal(
                    "register-modal"
                );


                updateAuthUI();


                toast(
                    "Аккаунт бомуваффақият сохта шуд.",
                    "success"
                );


                await loadHomeData();

            } catch (error) {

                toast(
                    error.message ||
                    "Регистрация ноком шуд.",
                    "error"
                );
            }
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (state.refreshToken) {

            await api(
                "/auth/logout",
                {
                    method: "POST",
                    body: JSON.stringify({
                        refreshToken:
                            state.refreshToken
                    })
                }
            );

        }

    } catch {
        // local logout still happens
    }


    clearAuth();

    updateAuthUI();

    toast(
        "Шумо аз аккаунт баромадед.",
        "success"
    );

    await loadHomeData();
}


/* =========================================================
   SEARCH
========================================================= */

async function performSearch(
    query = null
) {

    const searchInput =
        byId("global-search") ||
        byId("search-input") ||
        $(
            "input[name='search']"
        );


    const value =
        query !== null
            ? query
            : searchInput?.value.trim() ||
              "";


    state.currentSearch =
        value;


    const modal =
        byId("search-modal");


    if (modal) {
        closeModal(
            "search-modal"
        );
    }


    await Promise.allSettled([
        loadSpecialists(),
        loadMarketplace(),
        loadJobs(),
        loadProjects(),
        loadRealEstate()
    ]);
}


/* =========================================================
   SEARCH FORMS
========================================================= */

$$("form[data-search-form]")
    .forEach(
        (form) => {

            form.addEventListener(
                "submit",
                async (event) => {

                    event.preventDefault();

                    const input =
                        form.querySelector(
                            "input"
                        );

                    await performSearch(
                        input?.value || ""
                    );
                }
            );

        }
    );


/* =========================================================
   SPECIALISTS
========================================================= */

async function loadSpecialists() {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        state.page.specialists
    );


    params.set(
        "limit",
        "12"
    );


    if (
        state.currentSearch
    ) {
        params.set(
            "search",
            state.currentSearch
        );
    }


    if (
        state.currentCategory
    ) {
        params.set(
            "category",
            state.currentCategory
        );
    }


    if (
        state.currentRegion
    ) {
        params.set(
            "region",
            state.currentRegion
        );
    }


    if (
        state.currentCity
    ) {
        params.set(
            "city",
            state.currentCity
        );
    }


    try {

        const result =
            await api(
                `/smm?${params}`
            );


        const specialists =
            result.data ||
            result.specialists ||
            [];


        renderSpecialists(
            specialists
        );

    } catch (error) {

        console.error(
            "Specialists:",
            error
        );
    }
}


function renderSpecialists(
    specialists
) {

    const container =
        byId(
            "specialists-grid"
        ) ||
        byId(
            "specialists-list"
        );


    if (!container) return;


    if (!specialists.length) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>Мутахассис ёфт нашуд</h3>
                <p>
                    Филтрҳоро тағйир дода,
                    дубора ҷустуҷӯ кунед.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        specialists
            .map(
                specialist =>
                    specialistCard(
                        specialist
                    )
            )
            .join("");
}


function specialistCard(
    specialist
) {

    const id =
        specialist.id;


    const name =
        [
            specialist.firstName,
            specialist.lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        specialist.name ||
        specialist.username ||
        "SMM Specialist";


    const favorite =
        state.favorites.has(id);


    return `
        <article
            class="specialist-card"
            data-id="${escapeHTML(id)}"
        >

            <div class="specialist-cover">

                ${
                    specialist.cover
                        ? `
                            <img
                                src="${escapeHTML(
                                    specialist.cover
                                )}"
                                alt=""
                            >
                        `
                        : ""
                }

                <button
                    type="button"
                    class="favorite-button ${
                        favorite
                            ? "active"
                            : ""
                    }"
                    data-favorite="${escapeHTML(id)}"
                >
                    ${favorite ? "♥" : "♡"}
                </button>

            </div>


            <div class="specialist-content">

                <div class="specialist-avatar">

                    ${
                        specialist.avatar
                            ? `
                                <img
                                    src="${escapeHTML(
                                        specialist.avatar
                                    )}"
                                    alt=""
                                >
                            `
                            : escapeHTML(
                                getInitials(
                                    name
                                )
                            )
                    }

                </div>


                <h3>
                    ${escapeHTML(name)}
                </h3>


                <p class="specialist-bio">
                    ${escapeHTML(
                        specialist.bio || ""
                    )}
                </p>


                <div class="specialist-meta">

                    <span>
                        ★ ${
                            specialist.rating ??
                            "—"
                        }
                    </span>

                    <span>
                        ${escapeHTML(
                            specialist.region ||
                            specialist.city ||
                            ""
                        )}
                    </span>

                </div>


                <div class="specialist-skills">

                    ${
                        (
                            specialist.skills ||
                            []
                        )
                            .slice(0, 3)
                            .map(
                                skill =>
                                    `<span>
                                        ${escapeHTML(
                                            typeof skill ===
                                            "string"
                                                ? skill
                                                : skill.name
                                        )}
                                    </span>`
                            )
                            .join("")
                    }

                </div>


                <button
                    type="button"
                    class="btn btn-primary full-width"
                    data-specialist-id="${escapeHTML(
                        id
                    )}"
                >
                    Профилро дидан
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   MARKETPLACE
========================================================= */

async function loadMarketplace() {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        state.page.marketplace
    );


    params.set(
        "limit",
        "12"
    );


    if (
        state.currentSearch
    ) {
        params.set(
            "search",
            state.currentSearch
        );
    }


    if (
        state.currentCategory
    ) {
        params.set(
            "category",
            state.currentCategory
        );
    }


    if (
        state.currentRegion
    ) {
        params.set(
            "region",
            state.currentRegion
        );
    }


    try {

        const endpoint =
            state.marketplaceType ===
            "products"
                ? "/products"
                : "/services";


        const result =
            await api(
                `${endpoint}?${params}`
            );


        const items =
            result.data ||
            result.services ||
            result.products ||
            [];


        renderMarketplace(
            items
        );

    } catch (error) {

        console.error(
            "Marketplace:",
            error
        );
    }
}


function renderMarketplace(
    items
) {

    const container =
        byId(
            "marketplace-grid"
        ) ||
        byId(
            "services-grid"
        );


    if (!container) return;


    if (!items.length) {

        container.innerHTML = `
            <div class="empty-state">
                Маълумот ёфт нашуд.
            </div>
        `;

        return;
    }


    container.innerHTML =
        items
            .map(
                item =>
                    marketplaceCard(
                        item
                    )
            )
            .join("");
}


function marketplaceCard(
    item
) {

    const id =
        item.id;


    const title =
        item.title ||
        item.name ||
        "Хизмат";


    return `
        <article
            class="marketplace-card"
            data-id="${escapeHTML(id)}"
        >

            <div class="marketplace-image">

                ${
                    item.image
                        ? `
                            <img
                                src="${escapeHTML(
                                    item.image
                                )}"
                                alt="${escapeHTML(
                                    title
                                )}"
                            >
                        `
                        : `
                            <div class="image-placeholder">
                                SMM.TJ
                            </div>
                        `
                }

            </div>


            <div class="marketplace-content">

                <span class="marketplace-category">
                    ${escapeHTML(
                        item.category?.name ||
                        item.category ||
                        ""
                    )}
                </span>


                <h3>
                    ${escapeHTML(title)}
                </h3>


                <div class="marketplace-author">

                    ${escapeHTML(
                        item.owner?.username ||
                        item.user?.username ||
                        item.seller?.businessName ||
                        ""
                    )}

                </div>


                <div class="marketplace-bottom">

                    <strong>
                        ${formatPrice(
                            item.price
                        )}
                    </strong>


                    <span>
                        ★ ${
                            item.rating ??
                            "—"
                        }
                    </span>

                </div>


                <button
                    type="button"
                    class="btn btn-secondary full-width"
                    data-marketplace-id="${escapeHTML(
                        id
                    )}"
                >
                    Дидан
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   JOBS
========================================================= */

async function loadJobs() {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        state.page.jobs
    );


    params.set(
        "limit",
        "10"
    );


    if (
        state.currentSearch
    ) {
        params.set(
            "search",
            state.currentSearch
        );
    }


    if (
        state.currentRegion
    ) {
        params.set(
            "region",
            state.currentRegion
        );
    }


    try {

        const result =
            await api(
                `/jobs?${params}`
            );


        const jobs =
            result.data ||
            result.jobs ||
            [];


        renderJobs(jobs);

    } catch (error) {

        console.error(
            "Jobs:",
            error
        );
    }
}


function renderJobs(
    jobs
) {

    const container =
        byId("jobs-grid") ||
        byId("jobs-list");


    if (!container) return;


    if (!jobs.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҷойи корӣ ёфт нашуд.
            </div>
        `;

        return;
    }


    container.innerHTML =
        jobs
            .map(
                job => `
                    <article
                        class="job-card"
                        data-id="${escapeHTML(
                            job.id
                        )}"
                    >

                        <div class="job-card-top">

                            <span>
                                ${escapeHTML(
                                    job.company?.name ||
                                    job.company ||
                                    "Company"
                                )}
                            </span>

                            <small>
                                ${escapeHTML(
                                    job.employmentType ||
                                    ""
                                )}
                            </small>

                        </div>


                        <h3>
                            ${escapeHTML(
                                job.title ||
                                ""
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                job.description ||
                                ""
                            )}
                        </p>


                        <div class="job-meta">

                            <span>
                                ${formatPrice(
                                    job.salary
                                )}
                            </span>

                            <span>
                                ${escapeHTML(
                                    job.city ||
                                    job.region ||
                                    ""
                                )}
                            </span>

                        </div>


                        <button
                            type="button"
                            class="btn btn-primary"
                            data-job-id="${escapeHTML(
                                job.id
                            )}"
                        >
                            Дидани вакансия
                        </button>

                    </article>
                `
            )
            .join("");
}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        state.page.projects
    );


    params.set(
        "limit",
        "10"
    );


    if (
        state.currentSearch
    ) {
        params.set(
            "search",
            state.currentSearch
        );
    }


    try {

        const result =
            await api(
                `/projects?${params}`
            );


        const projects =
            result.data ||
            result.projects ||
            [];


        renderProjects(
            projects
        );

    } catch (error) {

        console.error(
            "Projects:",
            error
        );
    }
}


function renderProjects(
    projects
) {

    const container =
        byId("projects-grid") ||
        byId("projects-list");


    if (!container) return;


    container.innerHTML =
        projects
            .map(
                project => `

                    <article
                        class="project-card"
                        data-id="${escapeHTML(
                            project.id
                        )}"
                    >

                        <span class="project-status">
                            ${escapeHTML(
                                project.status ||
                                "OPEN"
                            )}
                        </span>


                        <h3>
                            ${escapeHTML(
                                project.title ||
                                ""
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                project.description ||
                                ""
                            )}
                        </p>


                        <div class="project-meta">

                            <strong>
                                ${formatPrice(
                                    project.budget
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    project.category?.name ||
                                    project.category ||
                                    ""
                                )}
                            </span>

                        </div>


                        <button
                            type="button"
                            class="btn btn-secondary"
                            data-project-id="${escapeHTML(
                                project.id
                            )}"
                        >
                            Дидан
                        </button>

                    </article>
                `
            )
            .join("");
}


/* =========================================================
   REAL ESTATE
========================================================= */

async function loadRealEstate() {

    const params =
        new URLSearchParams();


    params.set(
        "page",
        state.page.realEstate
    );


    params.set(
        "limit",
        "12"
    );


    if (
        state.currentSearch
    ) {
        params.set(
            "search",
            state.currentSearch
        );
    }


    if (
        state.currentRegion
    ) {
        params.set(
            "region",
            state.currentRegion
        );
    }


    if (
        state.currentCity
    ) {
        params.set(
            "city",
            state.currentCity
        );
    }


    try {

        const result =
            await api(
                `/real-estate?${params}`
            );


        const listings =
            result.data ||
            result.listings ||
            [];


        renderRealEstate(
            listings
        );

    } catch (error) {

        console.error(
            "Real estate:",
            error
        );
    }
}


function renderRealEstate(
    listings
) {

    const container =
        byId(
            "real-estate-grid"
        ) ||
        byId(
            "real-estate-list"
        );


    if (!container) return;


    container.innerHTML =
        listings
            .map(
                item => `

                    <article
                        class="real-estate-card"
                        data-id="${escapeHTML(
                            item.id
                        )}"
                    >

                        <div class="real-estate-image">

                            ${
                                item.images?.[0]
                                    ? `
                                        <img
                                            src="${escapeHTML(
                                                item.images[0]
                                            )}"
                                            alt=""
                                        >
                                    `
                                    : ""
                            }

                        </div>


                        <div class="real-estate-content">

                            <span>
                                ${escapeHTML(
                                    item.type ||
                                    ""
                                )}
                            </span>


                            <h3>
                                ${escapeHTML(
                                    item.title ||
                                    ""
                                )}
                            </h3>


                            <p>
                                ${escapeHTML(
                                    item.address ||
                                    item.city ||
                                    ""
                                )}
                            </p>


                            <div class="real-estate-meta">

                                <strong>
                                    ${formatPrice(
                                        item.price
                                    )}
                                </strong>

                                <span>
                                    ${
                                        item.rooms
                                            ? `${escapeHTML(
                                                item.rooms
                                            )} ҳуҷра`
                                            : ""
                                    }
                                </span>

                                <span>
                                    ${
                                        item.area
                                            ? `${escapeHTML(
                                                item.area
                                            )} м²`
                                            : ""
                                    }
                                </span>

                            </div>


                            <button
                                type="button"
                                class="btn btn-secondary full-width"
                                data-real-estate-id="${escapeHTML(
                                    item.id
                                )}"
                            >
                                Дидан
                            </button>

                        </div>

                    </article>
                `
            )
            .join("");
}


/* =========================================================
   CATEGORY FILTER
========================================================= */

$$("[data-category]")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    state.currentCategory =
                        button.dataset.category ||
                        "";


                    $$(
                        "[data-category]"
                    ).forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    state.page
                        .specialists = 1;

                    state.page
                        .marketplace = 1;


                    await Promise.allSettled([
                        loadSpecialists(),
                        loadMarketplace()
                    ]);
                }
            );

        }
    );


/* =========================================================
   MARKETPLACE TABS
========================================================= */

$$("[data-marketplace-type]")
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    state.marketplaceType =
                        button.dataset
                            .marketplaceType ||
                        "services";


                    $$(
                        "[data-marketplace-type]"
                    ).forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    await loadMarketplace();
                }
            );

        }
    );


/* =========================================================
   FAVORITES
========================================================= */

async function toggleFavorite(
    id
) {

    if (!state.user) {

        openModal(
            "login-modal"
        );

        toast(
            "Барои нигоҳ доштан аввал ворид шавед.",
            "warning"
        );

        return;
    }


    const isFavorite =
        state.favorites.has(id);


    try {

        if (isFavorite) {

            await api(
                `/favorites/${encodeURIComponent(
                    id
                )}`,
                {
                    method: "DELETE"
                }
            );

            state.favorites.delete(
                id
            );

        } else {

            await api(
                "/favorites",
                {
                    method: "POST",
                    body: JSON.stringify({
                        targetId: id
                    })
                }
            );

            state.favorites.add(
                id
            );
        }


        localStorage.setItem(
            "smm_favorites",
            JSON.stringify(
                Array.from(
                    state.favorites
                )
            )
        );


        toast(
            isFavorite
                ? "Аз захирашудаҳо хориҷ шуд."
                : "Ба захирашудаҳо илова шуд.",
            "success"
        );


        await loadSpecialists();

    } catch (error) {

        toast(
            error.message ||
            "Амалиёт иҷро нашуд.",
            "error"
        );
    }
}


/* =========================================================
   SPECIALIST PROFILE
========================================================= */

async function openSpecialist(
    id
) {

    try {

        const result =
            await api(
                `/smm/${encodeURIComponent(
                    id
                )}`
            );


        const specialist =
            result.data ||
            result.specialist ||
            result;


        renderSpecialistModal(
            specialist
        );


        openModal(
            "specialist-modal"
        );

    } catch (error) {

        toast(
            error.message ||
            "Профил кушода нашуд.",
            "error"
        );
    }
}


function renderSpecialistModal(
    specialist
) {

    const container =
        byId(
            "specialist-modal-content"
        );


    if (!container) return;


    const name =
        [
            specialist.firstName,
            specialist.lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        specialist.name ||
        specialist.username ||
        "SMM Specialist";


    container.innerHTML = `

        <div class="profile-modal">

            <div class="profile-modal-avatar">

                ${
                    specialist.avatar
                        ? `
                            <img
                                src="${escapeHTML(
                                    specialist.avatar
                                )}"
                                alt=""
                            >
                        `
                        : escapeHTML(
                            getInitials(
                                name
                            )
                        )
                }

            </div>


            <h2>
                ${escapeHTML(name)}
            </h2>


            <p>
                ${escapeHTML(
                    specialist.bio || ""
                )}
            </p>


            <div class="profile-stats">

                <span>
                    ★ ${
                        specialist.rating ??
                        "—"
                    }
                </span>

                <span>
                    ${
                        specialist.experience ??
                        0
                    } сол таҷриба
                </span>

                <span>
                    ${escapeHTML(
                        specialist.city ||
                        specialist.region ||
                        ""
                    )}
                </span>

            </div>


            <div class="profile-services">

                ${
                    (
                        specialist.services ||
                        []
                    )
                        .map(
                            service => `

                                <div class="service-row">

                                    <strong>
                                        ${escapeHTML(
                                            service.title ||
                                            service.name ||
                                            ""
                                        )}
                                    </strong>

                                    <span>
                                        ${formatPrice(
                                            service.price
                                        )}
                                    </span>

                                </div>
                            `
                        )
                        .join("")
                }

            </div>


            <button
                type="button"
                class="btn btn-primary full-width"
                data-request-specialist="${escapeHTML(
                    specialist.id
                )}"
            >
                Мутахассисро дархост кардан
            </button>

        </div>
    `;
}


/* =========================================================
   REQUEST SPECIALIST
========================================================= */

async function requestSpecialist(
    specialistId
) {

    if (!state.user) {

        openModal(
            "login-modal"
        );

        return;
    }


    const message =
        prompt(
            "Дархости худро нависед:"
        );


    if (!message) return;


    try {

        await api(
            "/projects",
            {
                method: "POST",

                body: JSON.stringify({
                    specialistId,
                    message
                })
            }
        );


        toast(
            "Дархост фиристода шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message ||
            "Дархост фиристода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   PROJECT CREATE
========================================================= */

const projectForm =
    byId(
        "create-project-form"
    );

if (projectForm) {

    projectForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!state.user) {

                openModal(
                    "login-modal"
                );

                return;
            }


            const form =
                new FormData(
                    projectForm
                );


            const payload = {

                title:
                    form.get(
                        "title"
                    ),

                description:
                    form.get(
                        "description"
                    ),

                category:
                    form.get(
                        "category"
                    ),

                budget:
                    Number(
                        form.get(
                            "budget"
                        ) || 0
                    ),

                deadline:
                    form.get(
                        "deadline"
                    ),

                region:
                    form.get(
                        "region"
                    ),

                city:
                    form.get(
                        "city"
                    ),

                skills:
                    String(
                        form.get(
                            "skills"
                        ) || ""
                    )
                        .split(",")
                        .map(
                            value =>
                                value.trim()
                        )
                        .filter(Boolean)
            };


            try {

                await api(
                    "/projects",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            payload
                        )
                    }
                );


                projectForm.reset();


                closeModal(
                    "create-project-modal"
                );


                toast(
                    "Лоиҳа сохта шуд.",
                    "success"
                );


                await loadProjects();

            } catch (error) {

                toast(
                    error.message ||
                    "Лоиҳа сохта нашуд.",
                    "error"
                );
            }
        }
    );
}


/* =========================================================
   JOB DETAILS
========================================================= */

async function openJob(
    id
) {

    try {

        const result =
            await api(
                `/jobs/${encodeURIComponent(
                    id
                )}`
            );


        const job =
            result.data ||
            result.job ||
            result;


        const container =
            byId(
                "job-modal-content"
            );


        if (!container) return;


        container.innerHTML = `

            <div class="job-details">

                <h2>
                    ${escapeHTML(
                        job.title || ""
                    )}
                </h2>

                <p>
                    ${escapeHTML(
                        job.description || ""
                    )}
                </p>

                <div class="job-detail-meta">

                    <span>
                        ${formatPrice(
                            job.salary
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            job.employmentType ||
                            ""
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            job.experience ||
                            ""
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            job.city ||
                            job.region ||
                            ""
                        )}
                    </span>

                </div>


                <button
                    type="button"
                    class="btn btn-primary"
                    data-apply-job="${escapeHTML(
                        job.id
                    )}"
                >
                    Ариза додан
                </button>

            </div>
        `;


        openModal(
            "job-modal"
        );

    } catch (error) {

        toast(
            error.message ||
            "Вакансия кушода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   APPLY JOB
========================================================= */

async function applyJob(
    jobId
) {

    if (!state.user) {

        openModal(
            "login-modal"
        );

        return;
    }


    const message =
        prompt(
            "Паёми шумо барои корфармо:"
        );


    try {

        await api(
            "/applications",
            {
                method: "POST",
                body: JSON.stringify({
                    jobId,
                    message
                })
            }
        );


        toast(
            "Ариза фиристода шуд.",
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
   PRODUCT / SERVICE DETAILS
========================================================= */

async function openMarketplaceItem(
    id
) {

    const endpoint =
        state.marketplaceType ===
        "products"
            ? `/products/${encodeURIComponent(
                id
            )}`
            : `/services/${encodeURIComponent(
                id
            )}`;


    try {

        const result =
            await api(endpoint);


        const item =
            result.data ||
            result.service ||
            result.product ||
            result;


        const container =
            byId(
                "marketplace-modal-content"
            );


        if (!container) return;


        container.innerHTML = `

            <div class="marketplace-details">

                <h2>
                    ${escapeHTML(
                        item.title ||
                        item.name ||
                        ""
                    )}
                </h2>


                <p>
                    ${escapeHTML(
                        item.description ||
                        ""
                    )}
                </p>


                <strong class="detail-price">
                    ${formatPrice(
                        item.price
                    )}
                </strong>


                <div class="detail-owner">

                    ${escapeHTML(
                        item.owner?.username ||
                        item.user?.username ||
                        item.seller?.businessName ||
                        ""
                    )}

                </div>


                <button
                    type="button"
                    class="btn btn-primary full-width"
                    data-contact-owner="${escapeHTML(
                        item.ownerId ||
                        item.userId ||
                        item.sellerId ||
                        ""
                    )}"
                >
                    Тамос гирифтан
                </button>

            </div>
        `;


        openModal(
            "marketplace-modal"
        );

    } catch (error) {

        toast(
            error.message ||
            "Маълумот кушода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   PROJECT DETAILS
========================================================= */

async function openProject(
    id
) {

    try {

        const result =
            await api(
                `/projects/${encodeURIComponent(
                    id
                )}`
            );


        const project =
            result.data ||
            result.project ||
            result;


        const container =
            byId(
                "project-modal-content"
            );


        if (!container) return;


        container.innerHTML = `

            <div class="project-details">

                <span>
                    ${escapeHTML(
                        project.status ||
                        "OPEN"
                    )}
                </span>

                <h2>
                    ${escapeHTML(
                        project.title ||
                        ""
                    )}
                </h2>

                <p>
                    ${escapeHTML(
                        project.description ||
                        ""
                    )}
                </p>

                <strong>
                    ${formatPrice(
                        project.budget
                    )}
                </strong>


                <button
                    type="button"
                    class="btn btn-primary full-width"
                    data-propose-project="${escapeHTML(
                        project.id
                    )}"
                >
                    Пешниҳод фиристодан
                </button>

            </div>
        `;


        openModal(
            "project-modal"
        );

    } catch (error) {

        toast(
            error.message ||
            "Лоиҳа кушода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   PROPOSAL
========================================================= */

async function proposeProject(
    projectId
) {

    if (!state.user) {

        openModal(
            "login-modal"
        );

        return;
    }


    const price =
        prompt(
            "Нархи пешниҳоди шумо:"
        );


    if (!price) return;


    const message =
        prompt(
            "Паёми пешниҳоди шумо:"
        ) || "";


    try {

        await api(
            "/proposals",
            {
                method: "POST",

                body: JSON.stringify({
                    projectId,
                    price: Number(price),
                    message
                })
            }
        );


        toast(
            "Пешниҳод фиристода шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message ||
            "Пешниҳод фиристода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   REAL ESTATE DETAILS
========================================================= */

async function openRealEstate(
    id
) {

    try {

        const result =
            await api(
                `/real-estate/${encodeURIComponent(
                    id
                )}`
            );


        const item =
            result.data ||
            result.listing ||
            result;


        const container =
            byId(
                "real-estate-modal-content"
            );


        if (!container) return;


        container.innerHTML = `

            <div class="real-estate-details">

                ${
                    item.images?.length
                        ? `
                            <div class="property-gallery">

                                ${item.images
                                    .map(
                                        image =>
                                            `
                                                <img
                                                    src="${escapeHTML(
                                                        image
                                                    )}"
                                                    alt=""
                                                >
                                            `
                                    )
                                    .join("")}

                            </div>
                        `
                        : ""
                }


                <h2>
                    ${escapeHTML(
                        item.title ||
                        ""
                    )}
                </h2>


                <p>
                    ${escapeHTML(
                        item.description ||
                        ""
                    )}
                </p>


                <strong>
                    ${formatPrice(
                        item.price
                    )}
                </strong>


                <div>
                    ${escapeHTML(
                        item.address ||
                        item.city ||
                        ""
                    )}
                </div>


                <button
                    type="button"
                    class="btn btn-primary full-width"
                    data-contact-owner="${escapeHTML(
                        item.ownerId ||
                        item.userId ||
                        ""
                    )}"
                >
                    Тамос гирифтан
                </button>

            </div>
        `;


        openModal(
            "real-estate-modal"
        );

    } catch (error) {

        toast(
            error.message ||
            "Амвол кушода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   CONTACT USER
========================================================= */

async function contactUser(
    userId
) {

    if (!state.user) {

        openModal(
            "login-modal"
        );

        return;
    }


    if (!userId) {

        toast(
            "Истифодабаранда муайян нашуд.",
            "error"
        );

        return;
    }


    try {

        const result =
            await api(
                "/messages/conversations",
                {
                    method: "POST",

                    body: JSON.stringify({
                        userId
                    })
                }
            );


        const conversation =
            result.data ||
            result.conversation ||
            result;


        if (
            conversation?.id
        ) {

            window.location.href =
                `/messages.html?id=${encodeURIComponent(
                    conversation.id
                )}`;

        }

    } catch (error) {

        toast(
            error.message ||
            "Чат кушода нашуд.",
            "error"
        );
    }
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    if (!state.user) return;


    try {

        const result =
            await api(
                "/notifications"
            );


        const notifications =
            result.data ||
            result.notifications ||
            [];


        const container =
            byId(
                "notification-list"
            );


        if (!container) return;


        container.innerHTML =
            notifications.length
                ? notifications
                    .map(
                        notification => `
                            <div
                                class="notification-item ${
                                    notification.read
                                        ? ""
                                        : "unread"
                                }"
                                data-notification-id="${escapeHTML(
                                    notification.id
                                )}"
                            >

                                <strong>
                                    ${escapeHTML(
                                        notification.title ||
                                        ""
                                    )}
                                </strong>

                                <p>
                                    ${escapeHTML(
                                        notification.message ||
                                        ""
                                    )}
                                </p>

                                <small>
                                    ${formatDate(
                                        notification.createdAt
                                    )}
                                </small>

                            </div>
                        `
                    )
                    .join("")
                : `
                    <div class="empty-state">
                        Огоҳинома нест.
                    </div>
                `;


        updateNotificationCount(
            notifications.filter(
                item =>
                    !item.read
            ).length
        );

    } catch (error) {

        console.error(
            "Notifications:",
            error
        );
    }
}


function updateNotificationCount(
    count
) {

    $$(
        "[data-notification-count]"
    ).forEach(
        badge => {

            badge.textContent =
                count > 99
                    ? "99+"
                    : String(count);

            badge.hidden =
                count <= 0;

        }
    );
}


/* =========================================================
   REGIONS / CITIES
========================================================= */

async function loadRegions() {

    try {

        const result =
            await api(
                "/regions"
            );


        const regions =
            result.data ||
            result.regions ||
            [];


        $$(
            "select[name='region'], [data-region-select]"
        )
            .forEach(
                select => {

                    const current =
                        select.value;


                    select.innerHTML = `
                        <option value="">
                            Ҳамаи минтақаҳо
                        </option>
                    `;


                    regions.forEach(
                        region => {

                            const option =
                                document.createElement(
                                    "option"
                                );

                            option.value =
                                region.id ||
                                region.name;


                            option.textContent =
                                region.nameTg ||
                                region.name;


                            select.appendChild(
                                option
                            );
                        }
                    );


                    select.value =
                        current;

                }
            );

    } catch {
        // Regions endpoint may be unavailable
    }
}


/* =========================================================
   REGION FILTER
========================================================= */

$$(
    "select[name='region'], [data-region-select]"
)
    .forEach(
        select => {

            select.addEventListener(
                "change",
                async () => {

                    state.currentRegion =
                        select.value;


                    state.page
                        .specialists = 1;

                    state.page
                        .marketplace = 1;

                    state.page
                        .jobs = 1;

                    state.page
                        .realEstate = 1;


                    await Promise.allSettled([
                        loadSpecialists(),
                        loadMarketplace(),
                        loadJobs(),
                        loadRealEstate()
                    ]);
                }
            );

        }
    );


/* =========================================================
   NAVIGATION
========================================================= */

function goTo(
    page
) {

    const routes = {
        home: "/",
        specialists:
            "/specialists.html",
        marketplace:
            "/marketplace.html",
        jobs:
            "/jobs.html",
        projects:
            "/projects.html",
        "real-estate":
            "/real-estate.html",
        profile:
            "/profile.html",
        messages:
            "/messages.html"
    };


    if (
        routes[page]
    ) {
        window.location.href =
            routes[page];
    }
}


$$("[data-route]")
    .forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    goTo(
                        link.dataset.route
                    );

                }
            );

        }
    );


/* =========================================================
   MOBILE MENU
========================================================= */

const menuButton =
    byId("mobile-menu-button") ||
    byId("menu-button");


if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            const menu =
                byId(
                    "mobile-menu"
                ) ||
                byId(
                    "mobile-nav"
                );


            menu?.classList.toggle(
                "open"
            );

        }
    );
}


/* =========================================================
   MODAL CLOSE EVENTS
========================================================= */

$$(
    "[data-close-modal]"
)
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset
                            .closeModal
                    );

                }
            );

        }
    );


$$(
    ".modal-overlay"
)
    .forEach(
        overlay => {

            overlay.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {
                        overlay.hidden =
                            true;
                    }

                }
            );

        }
    );


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {
            closeAllModals();
        }

    }
);


/* =========================================================
   GLOBAL CLICK HANDLER
========================================================= */

document.addEventListener(
    "click",
    async event => {

        const target =
            event.target;


        /* Login */

        const login =
            target.closest(
                "[data-open-login]"
            );

        if (login) {

            openModal(
                "login-modal"
            );

            return;
        }


        /* Register */

        const register =
            target.closest(
                "[data-open-register]"
            );

        if (register) {

            openModal(
                "register-modal"
            );

            return;
        }


        /* Create project */

        const createProject =
            target.closest(
                "[data-create-project]"
            );

        if (createProject) {

            if (!state.user) {

                openModal(
                    "login-modal"
                );

                return;
            }

            openModal(
                "create-project-modal"
            );

            return;
        }


        /* Logout */

        const logoutButton =
            target.closest(
                "[data-auth-logout]"
            );

        if (logoutButton) {

            await logout();

            return;
        }


        /* Favorite */

        const favorite =
            target.closest(
                "[data-favorite]"
            );

        if (favorite) {

            event.stopPropagation();

            await toggleFavorite(
                favorite.dataset
                    .favorite
            );

            return;
        }


        /* Specialist */

        const specialist =
            target.closest(
                "[data-specialist-id]"
            );

        if (
            specialist &&
            !target.closest(
                "[data-favorite]"
            )
        ) {

            await openSpecialist(
                specialist.dataset
                    .specialistId
            );

            return;
        }


        /* Marketplace */

        const marketplace =
            target.closest(
                "[data-marketplace-id]"
            );

        if (marketplace) {

            await openMarketplaceItem(
                marketplace.dataset
                    .marketplaceId
            );

            return;
        }


        /* Job */

        const job =
            target.closest(
                "[data-job-id]"
            );

        if (job) {

            await openJob(
                job.dataset.jobId
            );

            return;
        }


        /* Apply job */

        const apply =
            target.closest(
                "[data-apply-job]"
            );

        if (apply) {

            await applyJob(
                apply.dataset
                    .applyJob
            );

            return;
        }


        /* Project */

        const project =
            target.closest(
                "[data-project-id]"
            );

        if (project) {

            await openProject(
                project.dataset
                    .projectId
            );

            return;
        }


        /* Proposal */

        const proposal =
            target.closest(
                "[data-propose-project]"
            );

        if (proposal) {

            await proposeProject(
                proposal.dataset
                    .proposeProject
            );

            return;
        }


        /* Real estate */

        const property =
            target.closest(
                "[data-real-estate-id]"
            );

        if (property) {

            await openRealEstate(
                property.dataset
                    .realEstateId
            );

            return;
        }


        /* Contact */

        const contact =
            target.closest(
                "[data-contact-owner]"
            );

        if (contact) {

            await contactUser(
                contact.dataset
                    .contactOwner
            );

            return;
        }


        /* Request specialist */

        const request =
            target.closest(
                "[data-request-specialist]"
            );

        if (request) {

            await requestSpecialist(
                request.dataset
                    .requestSpecialist
            );

            return;
        }


        /* Notifications */

        const notificationButton =
            target.closest(
                "[data-open-notifications]"
            );

        if (
            notificationButton
        ) {

            if (!state.user) {

                openModal(
                    "login-modal"
                );

                return;
            }

            openModal(
                "notification-modal"
            );

            await loadNotifications();

            return;
        }

    }
);


/* =========================================================
   HERO SEARCH
========================================================= */

const heroSearch =
    byId(
        "hero-search"
    ) ||
    byId(
        "main-search"
    );


if (heroSearch) {

    heroSearch.addEventListener(
        "keydown",
        async event => {

            if (
                event.key !==
                "Enter"
            ) {
                return;
            }


            await performSearch(
                heroSearch.value
            );
        }
    );
}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "Нарх муайян нашудааст";
    }


    const number =
        Number(
            String(value)
                .replace(
                    /[^\d.-]/g,
                    ""
                )
        );


    if (
        Number.isNaN(number)
    ) {
        return escapeHTML(
            value
        );
    }


    return (
        new Intl.NumberFormat(
            "tg-TJ"
        ).format(number)
        + " с."
    );
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }


    return new Intl.DateTimeFormat(
        "tg-TJ",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(date);
}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    return String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .toUpperCase();
}


/* =========================================================
   HOME DATA
========================================================= */

async function loadHomeData() {

    await Promise.allSettled([

        loadSpecialists(),

        loadMarketplace(),

        loadJobs(),

        loadProjects(),

        loadRealEstate()

    ]);


    if (state.user) {
        await loadNotifications();
    }
}


/* =========================================================
   LOADING SCREEN
========================================================= */

function hideLoader() {

    const loader =
        byId(
            "loading-screen"
        ) ||
        byId(
            "loader"
        );


    if (!loader) return;


    loader.classList.add(
        "loaded"
    );


    setTimeout(
        () => {
            loader.hidden = true;
        },
        400
    );
}


/* =========================================================
   ACTIVE NAV
========================================================= */

function setActiveNav() {

    const path =
        window.location.pathname;


    $$(
        "nav a, .navbar a, [data-route]"
    )
        .forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    href &&
                    href !== "/" &&
                    path.includes(
                        href.replace(
                            ".html",
                            ""
                        )
                    )
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );
}


/* =========================================================
   INIT
========================================================= */

async function init() {

    try {

        setActiveNav();

        await loadCurrentUser();

        await loadRegions();

        await loadHomeData();

    } catch (error) {

        console.error(
            "SMM.TJ init:",
            error
        );

    } finally {

        hideLoader();

    }
}


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

    api,

    toast,

    openModal,

    closeModal,

    logout,

    performSearch,

    loadSpecialists,

    loadMarketplace,

    loadJobs,

    loadProjects,

    loadRealEstate,

    loadNotifications
};
