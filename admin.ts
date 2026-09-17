/* =========================================================
   SMM.TJ — ADMIN PANEL
   admin.ts
========================================================= */

const API_BASE =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";


/* =========================================================
   TYPES
========================================================= */

type AdminPage =
    | "dashboard"
    | "analytics"
    | "users"
    | "specialists"
    | "sellers"
    | "services"
    | "products"
    | "categories"
    | "projects"
    | "jobs"
    | "applications"
    | "real-estate"
    | "reviews"
    | "reports"
    | "notifications"
    | "messages"
    | "files"
    | "settings";


interface ApiResponse<T = any> {
    success?: boolean;
    message?: string;
    data?: T;
    [key: string]: any;
}


interface User {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: string;
    region?: string;
    city?: string;
    avatar?: string;
    verified?: boolean;
    createdAt?: string;
}


interface DashboardStats {
    users?: number;
    specialists?: number;
    sellers?: number;
    services?: number;
    projects?: number;
    jobs?: number;
    reports?: number;

    pendingSpecialists?: number;
    pendingSellers?: number;
    pendingServices?: number;
    pendingJobs?: number;
}


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
    currentPage: "dashboard" as AdminPage,

    users: [] as User[],

    selectedUserId: null as string | null,

    currentUser: null as User | null,

    accessToken:
        localStorage.getItem("smm_admin_access_token") || "",

    refreshToken:
        localStorage.getItem("smm_admin_refresh_token") || "",

    loading: false,

    usersPage: 1,

    usersLimit: 20,

    usersTotal: 0,

    confirmAction: null as null | (() => Promise<void>),

    activeChatId: null as string | null
};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector: string): HTMLElement | null {
    return document.querySelector(selector);
}


function $all(selector: string): HTMLElement[] {
    return Array.from(document.querySelectorAll(selector));
}


function byId<T extends HTMLElement = HTMLElement>(
    id: string
): T | null {
    return document.getElementById(id) as T | null;
}


function show(element: HTMLElement | null) {
    if (!element) return;

    element.hidden = false;
    element.style.display = "";
}


function hide(element: HTMLElement | null) {
    if (!element) return;

    element.hidden = true;
}


function setText(
    selector: string,
    value: string | number
) {
    const element = $(selector);

    if (element) {
        element.textContent = String(value);
    }
}


function escapeHTML(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   STORAGE
========================================================= */

function saveTokens(
    accessToken: string,
    refreshToken?: string
) {
    state.accessToken = accessToken;

    localStorage.setItem(
        "smm_admin_access_token",
        accessToken
    );

    if (refreshToken) {
        state.refreshToken = refreshToken;

        localStorage.setItem(
            "smm_admin_refresh_token",
            refreshToken
        );
    }
}


function clearTokens() {
    state.accessToken = "";
    state.refreshToken = "";

    localStorage.removeItem(
        "smm_admin_access_token"
    );

    localStorage.removeItem(
        "smm_admin_refresh_token"
    );
}


/* =========================================================
   API CLIENT
========================================================= */

async function api<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retry = true
): Promise<T> {

    const headers = new Headers(
        options.headers || {}
    );

    headers.set(
        "Content-Type",
        "application/json"
    );

    if (state.accessToken) {
        headers.set(
            "Authorization",
            `Bearer ${state.accessToken}`
        );
    }


    let response: Response;

    try {

        response = await fetch(
            `${API_BASE}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    } catch (error) {

        showToast(
            "Ба сервер пайваст шудан имконнопазир аст.",
            "error"
        );

        throw error;
    }


    /* ---------------------------------------------
       ACCESS TOKEN EXPIRED
    --------------------------------------------- */

    if (
        response.status === 401 &&
        retry &&
        state.refreshToken
    ) {

        const refreshed =
            await refreshAccessToken();

        if (refreshed) {
            return api<T>(
                endpoint,
                options,
                false
            );
        }

        logout();
    }


    const contentType =
        response.headers.get("content-type") || "";


    let result: any = null;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        result = await response.json();

    } else {

        result = await response.text();

    }


    if (!response.ok) {

        const message =
            typeof result === "object"
                ? result?.message
                : result;

        throw new Error(
            message ||
            `Request failed: ${response.status}`
        );
    }


    return result as T;
}


/* =========================================================
   REFRESH TOKEN
========================================================= */

async function refreshAccessToken(): Promise<boolean> {

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


        const result =
            await response.json();


        const accessToken =
            result?.accessToken ||
            result?.data?.accessToken;


        const refreshToken =
            result?.refreshToken ||
            result?.data?.refreshToken;


        if (!accessToken) {
            return false;
        }


        saveTokens(
            accessToken,
            refreshToken
        );


        return true;

    } catch {

        return false;
    }
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
) {

    const container =
        byId("admin-toast-container");


    if (!container) {
        console.log(message);
        return;
    }


    const toast =
        document.createElement("div");


    toast.className =
        `admin-toast admin-toast-${type}`;


    toast.innerHTML = `
        <div class="toast-icon">
            ${
                type === "success"
                    ? "✓"
                    : type === "error"
                    ? "!"
                    : type === "warning"
                    ? "⚠"
                    : "i"
            }
        </div>

        <div class="toast-message">
            ${escapeHTML(message)}
        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Пӯшидан"
        >
            ×
        </button>
    `;


    container.appendChild(toast);


    const close =
        toast.querySelector(
            ".toast-close"
        );


    close?.addEventListener(
        "click",
        () => toast.remove()
    );


    setTimeout(
        () => toast.remove(),
        5000
    );
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id: string) {

    const modal = byId(id);

    if (!modal) return;

    modal.hidden = false;

    document.body.classList.add(
        "modal-open"
    );
}


function closeModal(id: string) {

    const modal = byId(id);

    if (!modal) return;

    modal.hidden = true;

    document.body.classList.remove(
        "modal-open"
    );
}


function closeAllModals() {

    $all(
        ".admin-modal-overlay, .modal-overlay"
    ).forEach(modal => {
        modal.hidden = true;
    });

    document.body.classList.remove(
        "modal-open"
    );
}


/* =========================================================
   CONFIRMATION
========================================================= */

function confirmAction(
    title: string,
    message: string,
    action: () => Promise<void>
) {

    state.confirmAction = action;


    setText(
        "#confirm-title",
        title
    );


    setText(
        "#confirm-message",
        message
    );


    openModal("confirm-modal");
}


async function executeConfirm() {

    const action =
        state.confirmAction;

    if (!action) return;


    try {

        const button =
            byId<HTMLButtonElement>(
                "confirm-action"
            );

        if (button) {
            button.disabled = true;
        }


        await action();


        closeModal(
            "confirm-modal"
        );

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );

    } finally {

        state.confirmAction = null;

        const button =
            byId<HTMLButtonElement>(
                "confirm-action"
            );

        if (button) {
            button.disabled = false;
        }
    }
}


/* =========================================================
   ERROR
========================================================= */

function getErrorMessage(
    error: unknown
): string {

    if (
        error instanceof Error &&
        error.message
    ) {
        return error.message;
    }

    return "Хатогии номаълум рух дод.";
}


/* =========================================================
   ADMIN AUTH
========================================================= */

async function checkAdminAuth(): Promise<boolean> {

    if (!state.accessToken) {
        redirectToLogin();
        return false;
    }


    try {

        const result =
            await api<ApiResponse<User>>(
                "/auth/me"
            );


        const user =
            result?.data ||
            result?.user ||
            result;


        if (!user) {
            redirectToLogin();
            return false;
        }


        if (
            user.role !== "ADMIN" &&
            user.role !== "SUPER_ADMIN"
        ) {

            showToast(
                "Шумо ҳуқуқи ворид шудан ба Admin Panel-ро надоред.",
                "error"
            );

            clearTokens();

            setTimeout(
                redirectToLogin,
                800
            );

            return false;
        }


        state.currentUser = user;


        updateAdminIdentity(user);


        return true;

    } catch {

        redirectToLogin();

        return false;
    }
}


/* =========================================================
   REDIRECT
========================================================= */

function redirectToLogin() {

    const current =
        encodeURIComponent(
            window.location.pathname
        );


    window.location.href =
        `/login.html?redirect=${current}`;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    try {

        if (state.refreshToken) {

            await fetch(
                `${API_BASE}/auth/logout`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${state.accessToken}`
                    },

                    body: JSON.stringify({
                        refreshToken:
                            state.refreshToken
                    })
                }
            );
        }

    } catch {
        // logout locally even if server fails
    }


    clearTokens();

    state.currentUser = null;

    window.location.href =
        "/login.html";
}


/* =========================================================
   ADMIN IDENTITY
========================================================= */

function updateAdminIdentity(
    user: User
) {

    const fullName =
        [
            user.firstName,
            user.lastName
        ]
            .filter(Boolean)
            .join(" ") ||
        user.username ||
        "Administrator";


    setText(
        "#sidebar-admin-name",
        fullName
    );


    setText(
        "#top-admin-name",
        fullName
    );


    setText(
        "#dashboard-admin-name",
        fullName
    );


    const initials =
        getInitials(fullName);


    setText(
        "#sidebar-admin-avatar",
        initials
    );


    setText(
        "#top-admin-avatar",
        initials
    );
}


function getInitials(
    name: string
): string {

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
}


/* =========================================================
   NAVIGATION
========================================================= */

function navigateToPage(
    page: AdminPage
) {

    state.currentPage = page;


    $all(".sidebar-link")
        .forEach(link => {

            link.classList.toggle(
                "active",
                link.dataset.adminPage === page
            );

        });


    $all(".admin-page")
        .forEach(section => {

            const isCurrent =
                section.dataset.page === page;

            section.classList.toggle(
                "active",
                isCurrent
            );

            section.hidden =
                !isCurrent;

        });


    updatePageHeader(page);


    if (window.innerWidth <= 900) {

        byId(
            "admin-sidebar"
        )?.classList.remove("open");

    }


    loadPageData(page);


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   PAGE HEADER
========================================================= */

const pageMeta:
    Record<
        AdminPage,
        {
            title: string;
            description: string;
        }
    > = {

    dashboard: {
        title: "Dashboard",
        description:
            "Назорати умумии платформаи SMM.TJ"
    },

    analytics: {
        title: "Аналитика",
        description:
            "Омори фаъолияти платформа"
    },

    users: {
        title: "Истифодабарандагон",
        description:
            "Идоракунии аккаунтҳои платформа"
    },

    specialists: {
        title: "SMM Мутахассисон",
        description:
            "Санҷиш ва идоракунии мутахассисон"
    },

    sellers: {
        title: "Фурӯшандагон",
        description:
            "Идоракунии профилҳои бизнес"
    },

    services: {
        title: "Хизматрасониҳо",
        description:
            "Модератсия ва идоракунии хизматҳо"
    },

    products: {
        title: "Маҳсулот",
        description:
            "Идоракунии маҳсулоти Marketplace"
    },

    categories: {
        title: "Категорияҳо",
        description:
            "Идоракунии категорияҳои платформа"
    },

    projects: {
        title: "Лоиҳаҳо",
        description:
            "Идоракунии лоиҳаҳои мизоҷон"
    },

    jobs: {
        title: "Ҷойҳои корӣ",
        description:
            "Идоракунии вакансияҳо"
    },

    applications: {
        title: "Аризаҳо",
        description:
            "Идоракунии аризаҳои корӣ"
    },

    "real-estate": {
        title: "Амвол",
        description:
            "Идоракунии амволи ғайриманқул"
    },

    reviews: {
        title: "Назарҳо",
        description:
            "Модератсия ва идоракунии назарҳо"
    },

    reports: {
        title: "Шикоятҳо",
        description:
            "Санҷиш ва ҳалли шикоятҳо"
    },

    notifications: {
        title: "Огоҳиномаҳо",
        description:
            "Огоҳиномаҳои истифодабарандагон"
    },

    messages: {
        title: "Паёмҳо",
        description:
            "Муоширати Admin бо истифодабарандагон"
    },

    files: {
        title: "Файлҳо",
        description:
            "Идоракунии файлҳои платформа"
    },

    settings: {
        title: "Танзимот",
        description:
            "Танзимоти системаи SMM.TJ"
    }
};


function updatePageHeader(
    page: AdminPage
) {

    const meta =
        pageMeta[page];

    if (!meta) return;


    setText(
        "#admin-page-title",
        meta.title
    );


    setText(
        "#admin-page-description",
        meta.description
    );
}


/* =========================================================
   LOAD PAGE DATA
========================================================= */

async function loadPageData(
    page: AdminPage
) {

    switch (page) {

        case "dashboard":
            await loadDashboard();
            break;

        case "analytics":
            await loadAnalytics();
            break;

        case "users":
            await loadUsers();
            break;

        case "specialists":
            await loadSpecialists();
            break;

        case "sellers":
            await loadSellers();
            break;

        case "services":
            await loadServices();
            break;

        case "products":
            await loadProducts();
            break;

        case "categories":
            await loadCategories();
            break;

        case "projects":
            await loadProjects();
            break;

        case "jobs":
            await loadJobs();
            break;

        case "applications":
            await loadApplications();
            break;

        case "real-estate":
            await loadRealEstate();
            break;

        case "reviews":
            await loadReviews();
            break;

        case "reports":
            await loadReports();
            break;

        case "notifications":
            await loadNotifications();
            break;

        case "messages":
            await loadConversations();
            break;

        case "files":
            await loadFiles();
            break;

        case "settings":
            await loadSettings();
            break;
    }
}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        const result =
            await api<ApiResponse<DashboardStats>>(
                "/admin/dashboard"
            );


        const stats =
            result?.data ||
            result?.stats ||
            result ||
            {};


        updateDashboardStats(stats);


        await loadLatestUsers();


        await loadActivity();


        await loadModerationCounts();


    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


function updateDashboardStats(
    stats: DashboardStats
) {

    setText(
        "#total-users",
        stats.users ?? 0
    );

    setText(
        "#total-specialists",
        stats.specialists ?? 0
    );

    setText(
        "#total-projects",
        stats.projects ?? 0
    );

    setText(
        "#total-services",
        stats.services ?? 0
    );

    setText(
        "#total-jobs",
        stats.jobs ?? 0
    );

    setText(
        "#total-reports",
        stats.reports ?? 0
    );


    setText(
        "#nav-users-count",
        stats.users ?? 0
    );

    setText(
        "#nav-specialists-count",
        stats.specialists ?? 0
    );

    setText(
        "#nav-sellers-count",
        stats.sellers ?? 0
    );

    setText(
        "#nav-reports-count",
        stats.reports ?? 0
    );
}


async function loadLatestUsers() {

    try {

        const result =
            await api<ApiResponse<User[]>>(
                "/admin/users?limit=5&sort=newest"
            );


        const users =
            result?.data ||
            result?.users ||
            [];


        renderLatestUsers(users);

    } catch {
        // Dashboard should still load
    }
}


function renderLatestUsers(
    users: User[]
) {

    const container =
        byId("latest-users-list");


    if (!container) return;


    if (!users.length) {

        container.innerHTML = `
            <div class="admin-empty">
                Истифодабаранда нест.
            </div>
        `;

        return;
    }


    container.innerHTML =
        users.map(user => {

            const name =
                [
                    user.firstName,
                    user.lastName
                ]
                    .filter(Boolean)
                    .join(" ") ||
                user.username ||
                "User";


            return `
                <div class="mini-user">

                    <div class="mini-user-avatar">
                        ${escapeHTML(
                            getInitials(name)
                        )}
                    </div>

                    <div class="mini-user-info">

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                user.email ||
                                user.phone ||
                                user.username ||
                                ""
                            )}
                        </span>

                    </div>

                    <span class="mini-user-role">
                        ${escapeHTML(
                            user.role || ""
                        )}
                    </span>

                </div>
            `;

        }).join("");
}


async function loadActivity() {

    try {

        const result =
            await api<any>(
                "/admin/activity?limit=10"
            );


        const activities =
            result?.data ||
            result?.activities ||
            [];


        const container =
            byId("activity-list");


        if (!container) return;


        if (!activities.length) {

            container.innerHTML = `
                <div class="admin-empty">
                    Фаъолият вуҷуд надорад.
                </div>
            `;

            return;
        }


        container.innerHTML =
            activities.map(
                (item: any) => `
                    <div class="activity-item">

                        <span class="activity-icon">
                            ${escapeHTML(
                                item.icon || "•"
                            )}
                        </span>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    item.title ||
                                    item.action ||
                                    ""
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    item.createdAt ||
                                    ""
                                )}
                            </small>

                        </div>

                    </div>
                `
            ).join("");

    } catch {
        // optional dashboard block
    }
}


async function loadModerationCounts() {

    try {

        const result =
            await api<any>(
                "/admin/moderation/counts"
            );


        const data =
            result?.data ||
            result ||
            {};


        setText(
            "#pending-specialists",
            data.specialists ?? 0
        );

        setText(
            "#pending-sellers",
            data.sellers ?? 0
        );

        setText(
            "#pending-services",
            data.services ?? 0
        );

        setText(
            "#pending-jobs",
            data.jobs ?? 0
        );

        setText(
            "#pending-reports",
            data.reports ?? 0
        );

    } catch {
        // optional
    }
}


/* =========================================================
   USERS
========================================================= */

async function loadUsers() {

    const search =
        (
            byId<HTMLInputElement>(
                "users-search"
            )?.value || ""
        ).trim();


    const role =
        byId<HTMLSelectElement>(
            "users-role-filter"
        )?.value || "";


    const status =
        byId<HTMLSelectElement>(
            "users-status-filter"
        )?.value || "";


    const region =
        byId<HTMLSelectElement>(
            "users-region-filter"
        )?.value || "";


    const params =
        new URLSearchParams();


    params.set(
        "page",
        String(state.usersPage)
    );


    params.set(
        "limit",
        String(state.usersLimit)
    );


    if (search) {
        params.set(
            "search",
            search
        );
    }


    if (role) {
        params.set(
            "role",
            role
        );
    }


    if (status) {
        params.set(
            "status",
            status
        );
    }


    if (region) {
        params.set(
            "region",
            region
        );
    }


    try {

        const result =
            await api<any>(
                `/admin/users?${params.toString()}`
            );


        const users =
            result?.data ||
            result?.users ||
            [];


        state.users =
            Array.isArray(users)
                ? users
                : [];


        state.usersTotal =
            result?.total ??
            result?.pagination?.total ??
            state.users.length;


        renderUsers(
            state.users
        );


        renderPagination(
            "users-pagination",
            state.usersPage,
            state.usersLimit,
            state.usersTotal,
            page => {

                state.usersPage = page;

                loadUsers();

            }
        );


    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


/* =========================================================
   USERS TABLE
========================================================= */

function renderUsers(
    users: User[]
) {

    const tbody =
        byId("users-table-body");


    const empty =
        byId("users-empty");


    if (!tbody) return;


    if (!users.length) {

        tbody.innerHTML = "";

        show(empty);

        return;
    }


    hide(empty);


    tbody.innerHTML =
        users.map(user => {

            const fullName =
                [
                    user.firstName,
                    user.lastName
                ]
                    .filter(Boolean)
                    .join(" ") ||
                user.username ||
                "User";


            const created =
                formatDate(
                    user.createdAt
                );


            const role =
                user.role || "—";


            const status =
                user.status || "ACTIVE";


            return `
                <tr data-user-id="${escapeHTML(
                    user.id
                )}">

                    <td>

                        <input
                            type="checkbox"
                            class="user-select"
                            value="${escapeHTML(
                                user.id
                            )}"
                        >

                    </td>


                    <td>

                        <div class="table-user">

                            <div class="table-avatar">

                                ${escapeHTML(
                                    getInitials(fullName)
                                )}

                            </div>

                            <div>

                                <strong class="table-user-name">

                                    ${escapeHTML(
                                        fullName
                                    )}

                                </strong>

                                <span class="table-username">

                                    ${escapeHTML(
                                        user.username
                                            ? `@${user.username}`
                                            : ""
                                    )}

                                </span>

                            </div>

                        </div>

                    </td>


                    <td>

                        <div class="table-contact">

                            <span>
                                ${escapeHTML(
                                    user.email || "—"
                                )}
                            </span>

                            <small>
                                ${escapeHTML(
                                    user.phone || ""
                                )}
                            </small>

                        </div>

                    </td>


                    <td>

                        <span class="user-role-badge role-${escapeHTML(
                            role.toLowerCase()
                        )}">

                            ${escapeHTML(role)}

                        </span>

                    </td>


                    <td>

                        ${escapeHTML(
                            user.city
                                ? `${user.region || ""}, ${user.city}`
                                : user.region || "—"
                        )}

                    </td>


                    <td>

                        <span class="status-badge status-${escapeHTML(
                            status.toLowerCase()
                        )}">

                            ${escapeHTML(status)}

                        </span>

                    </td>


                    <td>
                        ${escapeHTML(created)}
                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="table-action view-user"
                                data-id="${escapeHTML(user.id)}"
                                title="Дидан"
                            >
                                ◉
                            </button>


                            <button
                                type="button"
                                class="table-action verify-user"
                                data-id="${escapeHTML(user.id)}"
                                title="Verify"
                            >
                                ✓
                            </button>


                            <button
                                type="button"
                                class="table-action danger block-user"
                                data-id="${escapeHTML(user.id)}"
                                title="Block"
                            >
                                !
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   USER DETAILS
========================================================= */

async function openUserDetails(
    userId: string
) {

    try {

        const result =
            await api<any>(
                `/admin/users/${encodeURIComponent(
                    userId
                )}`
            );


        const user =
            result?.data ||
            result?.user ||
            result;


        state.selectedUserId =
            user.id;


        setText(
            "#modal-user-name",
            [
                user.firstName,
                user.lastName
            ]
                .filter(Boolean)
                .join(" ") ||
            user.username ||
            "User"
        );


        const container =
            byId(
                "user-details-content"
            );


        if (!container) return;


        container.innerHTML = `
            <div class="user-details-grid">

                <div class="detail-item">

                    <span>Ном</span>

                    <strong>
                        ${escapeHTML(
                            user.firstName || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Насаб</span>

                    <strong>
                        ${escapeHTML(
                            user.lastName || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Username</span>

                    <strong>
                        ${escapeHTML(
                            user.username
                                ? `@${user.username}`
                                : "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Email</span>

                    <strong>
                        ${escapeHTML(
                            user.email || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Телефон</span>

                    <strong>
                        ${escapeHTML(
                            user.phone || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Нақш</span>

                    <strong>
                        ${escapeHTML(
                            user.role || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Минтақа</span>

                    <strong>
                        ${escapeHTML(
                            user.region || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Шаҳр</span>

                    <strong>
                        ${escapeHTML(
                            user.city || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Статус</span>

                    <strong>
                        ${escapeHTML(
                            user.status || "—"
                        )}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>Verified</span>

                    <strong>
                        ${user.verified
                            ? "✓ Ҳа"
                            : "Не"}
                    </strong>

                </div>

            </div>
        `;


        const blockButton =
            byId<HTMLButtonElement>(
                "modal-user-block"
            );


        if (blockButton) {

            blockButton.textContent =
                user.status === "BLOCKED"
                    ? "Unblock"
                    : "Block";

        }


        openModal(
            "user-details-modal"
        );

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


/* =========================================================
   VERIFY USER
========================================================= */

async function verifyUser(
    userId: string
) {

    await api(
        `/admin/users/${encodeURIComponent(
            userId
        )}/verify`,
        {
            method: "PATCH"
        }
    );


    showToast(
        "Аккаунт тасдиқ карда шуд.",
        "success"
    );


    await loadUsers();
    await loadDashboard();
}


/* =========================================================
   BLOCK / UNBLOCK USER
========================================================= */

async function toggleUserBlock(
    userId: string
) {

    const user =
        state.users.find(
            item => item.id === userId
        );


    let currentStatus =
        user?.status;


    if (!currentStatus) {

        try {

            const result =
                await api<any>(
                    `/admin/users/${encodeURIComponent(
                        userId
                    )}`
                );

            const remoteUser =
                result?.data ||
                result?.user ||
                result;

            currentStatus =
                remoteUser?.status;

        } catch {
            currentStatus = "ACTIVE";
        }
    }


    const blocked =
        currentStatus === "BLOCKED";


    const endpoint =
        blocked
            ? `/admin/users/${encodeURIComponent(
                  userId
              )}/unblock`
            : `/admin/users/${encodeURIComponent(
                  userId
              )}/block`;


    await api(
        endpoint,
        {
            method: "PATCH"
        }
    );


    showToast(
        blocked
            ? "Аккаунт фаъол карда шуд."
            : "Аккаунт блок карда шуд.",
        "success"
    );


    await loadUsers();
    await loadDashboard();
}


/* =========================================================
   DELETE USER
========================================================= */

async function deleteUser(
    userId: string
) {

    confirmAction(
        "Нест кардани аккаунт",
        "Ин амал маълумоти аккаунтро нест мекунад. Давом медиҳед?",
        async () => {

            await api(
                `/admin/users/${encodeURIComponent(
                    userId
                )}`,
                {
                    method: "DELETE"
                }
            );


            showToast(
                "Аккаунт нест карда шуд.",
                "success"
            );


            await loadUsers();
            await loadDashboard();
        }
    );
}


/* =========================================================
   PAGINATION
========================================================= */

function renderPagination(
    containerId: string,
    currentPage: number,
    limit: number,
    total: number,
    onPage: (page: number) => void
) {

    const container =
        byId(containerId);


    if (!container) return;


    const totalPages =
        Math.max(
            1,
            Math.ceil(total / limit)
        );


    if (totalPages <= 1) {

        container.innerHTML = "";

        return;
    }


    const buttons: string[] = [];


    buttons.push(`
        <button
            type="button"
            class="pagination-button"
            data-page="${currentPage - 1}"
            ${currentPage <= 1 ? "disabled" : ""}
        >
            ←
        </button>
    `);


    const start =
        Math.max(
            1,
            currentPage - 2
        );


    const end =
        Math.min(
            totalPages,
            currentPage + 2
        );


    for (
        let page = start;
        page <= end;
        page++
    ) {

        buttons.push(`
            <button
                type="button"
                class="pagination-button ${
                    page === currentPage
                        ? "active"
                        : ""
                }"
                data-page="${page}"
            >
                ${page}
            </button>
        `);
    }


    buttons.push(`
        <button
            type="button"
            class="pagination-button"
            data-page="${currentPage + 1}"
            ${currentPage >= totalPages ? "disabled" : ""}
        >
            →
        </button>
    `);


    container.innerHTML =
        buttons.join("");


    $all(
        `#${containerId} .pagination-button`
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    Number(
                        button.dataset.page
                    );


                if (
                    page >= 1 &&
                    page <= totalPages
                ) {
                    onPage(page);
                }

            }
        );

    });
}


/* =========================================================
   PLACEHOLDER API LOADERS
   These call real endpoints.
========================================================= */

async function loadAnalytics() {

    try {

        const result =
            await api(
                "/admin/analytics"
            );

        renderAnalytics(result);

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


function renderAnalytics(
    result: any
) {

    const data =
        result?.data ||
        result ||
        {};


    setText(
        "#analytics-registrations",
        data.registrations ?? 0
    );

    setText(
        "#analytics-projects",
        data.projects ?? 0
    );

    setText(
        "#analytics-services",
        data.services ?? 0
    );

    setText(
        "#analytics-messages",
        data.messages ?? 0
    );
}


async function loadSpecialists() {

    try {

        const result =
            await api(
                "/admin/specialists"
            );

        renderSpecialists(
            result?.data ||
            result?.specialists ||
            []
        );

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


function renderSpecialists(
    specialists: any[]
) {

    const container =
        byId(
            "admin-specialists-list"
        );


    if (!container) return;


    if (!specialists.length) {

        container.innerHTML = `
            <div class="admin-empty">
                Мутахассис ёфт нашуд.
            </div>
        `;

        return;
    }


    container.innerHTML =
        specialists.map(
            specialist => `

                <article
                    class="admin-specialist-card"
                    data-id="${escapeHTML(
                        specialist.id
                    )}"
                >

                    <div class="specialist-admin-header">

                        <div class="specialist-admin-avatar">
                            ${escapeHTML(
                                getInitials(
                                    specialist.name ||
                                    specialist.username ||
                                    "S"
                                )
                            )}
                        </div>

                        <span class="verification-status">
                            ${
                                specialist.verified
                                    ? "Verified"
                                    : "Pending"
                            }
                        </span>

                    </div>


                    <h3>
                        ${escapeHTML(
                            specialist.name ||
                            specialist.username ||
                            "SMM Specialist"
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            specialist.bio || ""
                        )}
                    </p>


                    <div class="specialist-admin-meta">

                        <span>
                            ${escapeHTML(
                                specialist.region ||
                                specialist.city ||
                                "—"
                            )}
                        </span>

                        <span>
                            ★ ${
                                specialist.rating ??
                                "—"
                            }
                        </span>

                    </div>


                    <div class="specialist-admin-actions">

                        <button
                            type="button"
                            class="btn btn-small btn-secondary view-specialist"
                            data-id="${escapeHTML(
                                specialist.id
                            )}"
                        >
                            Дидан
                        </button>


                        <button
                            type="button"
                            class="btn btn-small btn-primary verify-specialist"
                            data-id="${escapeHTML(
                                specialist.id
                            )}"
                        >
                            Verify
                        </button>


                        <button
                            type="button"
                            class="btn btn-small btn-danger reject-specialist"
                            data-id="${escapeHTML(
                                specialist.id
                            )}"
                        >
                            Рад
                        </button>

                    </div>

                </article>
            `
        ).join("");
}


async function loadSellers() {

    try {

        const result =
            await api(
                "/admin/sellers"
            );

        const container =
            byId(
                "admin-sellers-list"
            );


        if (!container) return;


        const sellers =
            result?.data ||
            result?.sellers ||
            [];


        if (!sellers.length) {

            container.innerHTML = `
                <div class="admin-empty">
                    Фурӯшанда ёфт нашуд.
                </div>
            `;

            return;
        }


        container.innerHTML =
            sellers.map(
                (seller: any) => `

                    <article
                        class="admin-seller-card"
                        data-id="${escapeHTML(
                            seller.id
                        )}"
                    >

                        <div class="seller-logo">
                            ${escapeHTML(
                                getInitials(
                                    seller.businessName ||
                                    seller.name ||
                                    "S"
                                )
                            )}
                        </div>

                        <h3>
                            ${escapeHTML(
                                seller.businessName ||
                                seller.name ||
                                "Seller"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                seller.description ||
                                ""
                            )}
                        </p>

                        <span>
                            ${escapeHTML(
                                seller.region ||
                                seller.city ||
                                "—"
                            )}
                        </span>

                        <div class="card-actions">

                            <button
                                class="btn btn-small btn-secondary"
                                data-action="view-seller"
                                data-id="${escapeHTML(
                                    seller.id
                                )}"
                            >
                                Дидан
                            </button>

                            <button
                                class="btn btn-small btn-primary"
                                data-action="verify-seller"
                                data-id="${escapeHTML(
                                    seller.id
                                )}"
                            >
                                Verify
                            </button>

                        </div>

                    </article>
                `
            ).join("");

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


async function loadServices() {

    const result =
        await api(
            "/admin/services"
        );

    renderGenericTable(
        "services-table-body",
        result?.data ||
        result?.services ||
        [],
        "service"
    );
}


async function loadProducts() {

    const result =
        await api(
            "/admin/products"
        );

    const container =
        byId(
            "admin-products-list"
        );


    if (!container) return;


    const products =
        result?.data ||
        result?.products ||
        [];


    container.innerHTML =
        products.map(
            (product: any) => `

                <article
                    class="admin-product-card"
                    data-id="${escapeHTML(
                        product.id
                    )}"
                >

                    <div class="product-admin-image">

                        ${
                            product.image
                                ? `<img
                                    src="${escapeHTML(
                                        product.image
                                    )}"
                                    alt=""
                                >`
                                : ""
                        }

                    </div>

                    <h3>
                        ${escapeHTML(
                            product.title ||
                            product.name ||
                            ""
                        )}
                    </h3>

                    <strong>
                        ${escapeHTML(
                            product.price ??
                            "—"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            product.status ||
                            "—"
                        )}
                    </span>

                </article>
            `
        ).join("");
}


async function loadCategories() {

    const result =
        await api(
            "/admin/categories"
        );


    const container =
        byId(
            "categories-admin-list"
        );


    if (!container) return;


    const categories =
        result?.data ||
        result?.categories ||
        [];


    container.innerHTML =
        categories.map(
            (category: any) => `

                <article
                    class="category-admin-card"
                    data-id="${escapeHTML(
                        category.id
                    )}"
                >

                    <h3>
                        ${escapeHTML(
                            category.nameTg ||
                            category.name ||
                            ""
                        )}
                    </h3>

                    <span>
                        ${escapeHTML(
                            category.slug ||
                            ""
                        )}
                    </span>

                    <div class="card-actions">

                        <button
                            type="button"
                            class="btn btn-small btn-secondary"
                            data-action="edit-category"
                            data-id="${escapeHTML(
                                category.id
                            )}"
                        >
                            Таҳрир
                        </button>

                        <button
                            type="button"
                            class="btn btn-small btn-danger"
                            data-action="delete-category"
                            data-id="${escapeHTML(
                                category.id
                            )}"
                        >
                            Нест кардан
                        </button>

                    </div>

                </article>
            `
        ).join("");
}


async function loadProjects() {

    const result =
        await api(
            "/admin/projects"
        );

    renderGenericTable(
        "projects-admin-table",
        result?.data ||
        result?.projects ||
        [],
        "project"
    );
}


async function loadJobs() {

    const result =
        await api(
            "/admin/jobs"
        );

    renderGenericTable(
        "jobs-admin-table",
        result?.data ||
        result?.jobs ||
        [],
        "job"
    );
}


async function loadApplications() {

    const result =
        await api(
            "/admin/applications"
        );


    const container =
        byId(
            "admin-applications-list"
        );


    if (!container) return;


    const applications =
        result?.data ||
        result?.applications ||
        [];


    container.innerHTML =
        applications.map(
            (item: any) => `

                <article
                    class="application-admin-card"
                >

                    <h3>
                        ${escapeHTML(
                            item.job?.title ||
                            item.project?.title ||
                            "Application"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            item.user?.username ||
                            item.user?.email ||
                            ""
                        )}
                    </p>

                    <span>
                        ${escapeHTML(
                            item.status ||
                            "PENDING"
                        )}
                    </span>

                </article>
            `
        ).join("");
}


async function loadRealEstate() {

    const result =
        await api(
            "/admin/real-estate"
        );


    const container =
        byId(
            "admin-real-estate-list"
        );


    if (!container) return;


    const listings =
        result?.data ||
        result?.listings ||
        [];


    container.innerHTML =
        listings.map(
            (item: any) => `

                <article
                    class="admin-real-estate-card"
                >

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

                    <strong>
                        ${escapeHTML(
                            item.price ??
                            "—"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.status ||
                            ""
                        )}
                    </span>

                </article>
            `
        ).join("");
}


async function loadReviews() {

    const result =
        await api(
            "/admin/reviews"
        );


    const container =
        byId(
            "admin-reviews-list"
        );


    if (!container) return;


    const reviews =
        result?.data ||
        result?.reviews ||
        [];


    container.innerHTML =
        reviews.map(
            (review: any) => `

                <article
                    class="admin-review-card"
                >

                    <div>
                        ★ ${escapeHTML(
                            review.rating ??
                            0
                        )}
                    </div>

                    <p>
                        ${escapeHTML(
                            review.comment ||
                            ""
                        )}
                    </p>

                    <small>
                        ${escapeHTML(
                            review.author?.username ||
                            review.user?.username ||
                            ""
                        )}
                    </small>

                </article>
            `
        ).join("");
}


async function loadReports() {

    const result =
        await api(
            "/admin/reports"
        );


    const container =
        byId(
            "admin-reports-list"
        );


    if (!container) return;


    const reports =
        result?.data ||
        result?.reports ||
        [];


    container.innerHTML =
        reports.map(
            (report: any) => `

                <article
                    class="report-card"
                    data-id="${escapeHTML(
                        report.id
                    )}"
                >

                    <div class="report-header">

                        <span>
                            ${escapeHTML(
                                report.type ||
                                "REPORT"
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                report.status ||
                                "OPEN"
                            )}
                        </span>

                    </div>

                    <h3>
                        ${escapeHTML(
                            report.title ||
                            "Шикоят"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            report.description ||
                            ""
                        )}
                    </p>

                    <div class="report-actions">

                        <button
                            type="button"
                            class="btn btn-small btn-primary"
                            data-action="resolve-report"
                            data-id="${escapeHTML(
                                report.id
                            )}"
                        >
                            Ҳал шуд
                        </button>

                        <button
                            type="button"
                            class="btn btn-small btn-danger"
                            data-action="reject-report"
                            data-id="${escapeHTML(
                                report.id
                            )}"
                        >
                            Рад
                        </button>

                    </div>

                </article>
            `
        ).join("");
}


async function loadNotifications() {

    const result =
        await api(
            "/admin/notifications"
        );


    const container =
        byId(
            "admin-notifications-list"
        );


    if (!container) return;


    const notifications =
        result?.data ||
        result?.notifications ||
        [];


    container.innerHTML =
        notifications.map(
            (notification: any) => `

                <article
                    class="admin-notification-item"
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
                        ${escapeHTML(
                            notification.createdAt ||
                            ""
                        )}
                    </small>

                </article>
            `
        ).join("");
}


async function loadConversations() {

    try {

        const result =
            await api(
                "/admin/conversations"
            );


        const container =
            byId(
                "admin-conversations"
            );


        if (!container) return;


        const conversations =
            result?.data ||
            result?.conversations ||
            [];


        container.innerHTML =
            conversations.map(
                (conversation: any) => `

                    <button
                        type="button"
                        class="admin-conversation"
                        data-conversation-id="${escapeHTML(
                            conversation.id
                        )}"
                    >

                        <strong>
                            ${escapeHTML(
                                conversation.name ||
                                conversation.user?.username ||
                                "User"
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                conversation.lastMessage ||
                                ""
                            )}
                        </small>

                    </button>
                `
            ).join("");

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


async function loadFiles() {

    const result =
        await api(
            "/admin/files"
        );


    const container =
        byId(
            "admin-files-list"
        );


    if (!container) return;


    const files =
        result?.data ||
        result?.files ||
        [];


    container.innerHTML =
        files.map(
            (file: any) => `

                <article
                    class="admin-file-card"
                >

                    <strong>
                        ${escapeHTML(
                            file.originalName ||
                            file.name ||
                            ""
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            file.mimeType ||
                            ""
                        )}
                    </span>

                    <small>
                        ${escapeHTML(
                            file.size ||
                            ""
                        )}
                    </small>

                    <button
                        type="button"
                        class="btn btn-small btn-danger"
                        data-action="delete-file"
                        data-id="${escapeHTML(
                            file.id
                        )}"
                    >
                        Нест кардан
                    </button>

                </article>
            `
        ).join("");
}


async function loadSettings() {

    try {

        const result =
            await api(
                "/admin/settings"
            );


        const settings =
            result?.data ||
            result?.settings ||
            result ||
            {};


        const siteName =
            byId<HTMLInputElement>(
                "setting-site-name"
            );

        const slogan =
            byId<HTMLInputElement>(
                "setting-slogan"
            );

        const email =
            byId<HTMLInputElement>(
                "setting-email"
            );

        const phone =
            byId<HTMLInputElement>(
                "setting-phone"
            );


        if (siteName) {
            siteName.value =
                settings.siteName ||
                "SMM.TJ";
        }


        if (slogan) {
            slogan.value =
                settings.slogan ||
                "Платформаи касбии SMM дар Тоҷикистон";
        }


        if (email) {
            email.value =
                settings.email ||
                "";
        }


        if (phone) {
            phone.value =
                settings.phone ||
                "";
        }

    } catch (error) {

        showToast(
            getErrorMessage(error),
            "error"
        );
    }
}


/* =========================================================
   GENERIC TABLE
========================================================= */

function renderGenericTable(
    id: string,
    items: any[],
    type: string
) {

    const tbody =
        byId(id);


    if (!tbody) return;


    if (!items.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    Маълумот нест.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        items.map(
            item => `

                <tr>

                    <td>
                        ${escapeHTML(
                            item.title ||
                            item.name ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.user?.username ||
                            item.owner?.username ||
                            item.company?.name ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.category?.name ||
                            item.category ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.price ??
                            item.budget ??
                            item.salary ??
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.status ||
                            "—"
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-small btn-secondary"
                            data-action="view-${type}"
                            data-id="${escapeHTML(
                                item.id
                            )}"
                        >
                            Дидан
                        </button>

                    </td>

                </tr>
            `
        ).join("");
}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    date?: string
): string {

    if (!date) {
        return "—";
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return date;
    }


    return new Intl.DateTimeFormat(
        "tg-TJ",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(parsed);
}


/* =========================================================
   EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    async event => {

        const target =
            event.target as HTMLElement;


        /* ---------------------------------------------
           SIDEBAR NAV
        --------------------------------------------- */

        const sidebarLink =
            target.closest<HTMLElement>(
                "[data-admin-page]"
            );


        if (sidebarLink) {

            const page =
                sidebarLink.dataset
                    .adminPage as AdminPage;


            if (page) {
                navigateToPage(page);
            }

            return;
        }


        /* ---------------------------------------------
           GO PAGE
        --------------------------------------------- */

        const goPage =
            target.closest<HTMLElement>(
                "[data-go-page]"
            );


        if (goPage) {

            const page =
                goPage.dataset
                    .goPage as AdminPage;


            if (page) {
                navigateToPage(page);
            }

            return;
        }


        /* ---------------------------------------------
           VIEW USER
        --------------------------------------------- */

        const viewUser =
            target.closest<HTMLElement>(
                ".view-user"
            );


        if (viewUser?.dataset.id) {

            await openUserDetails(
                viewUser.dataset.id
            );

            return;
        }


        /* ---------------------------------------------
           VERIFY USER
        --------------------------------------------- */

        const verify =
            target.closest<HTMLElement>(
                ".verify-user"
            );


        if (verify?.dataset.id) {

            confirmAction(
                "Тасдиқи аккаунт",
                "Ин аккаунтро Verify мекунед?",
                async () => {

                    await verifyUser(
                        verify.dataset.id!
                    );

                }
            );

            return;
        }


        /* ---------------------------------------------
           BLOCK USER
        --------------------------------------------- */

        const block =
            target.closest<HTMLElement>(
                ".block-user"
            );


        if (block?.dataset.id) {

            confirmAction(
                "Тағйири статус",
                "Статуси ин аккаунтро тағйир медиҳед?",
                async () => {

                    await toggleUserBlock(
                        block.dataset.id!
                    );

                }
            );

            return;
        }


        /* ---------------------------------------------
           MODAL CLOSE
        --------------------------------------------- */

        const modalClose =
            target.closest<HTMLElement>(
                "[data-admin-modal-close]"
            );


        if (modalClose) {

            const modalId =
                modalClose.dataset
                    .adminModalClose;


            if (modalId) {
                closeModal(modalId);
            }

            return;
        }


        const normalModalClose =
            target.closest<HTMLElement>(
                "[data-close-modal]"
            );


        if (normalModalClose) {

            const modalId =
                normalModalClose.dataset
                    .closeModal;


            if (modalId) {
                closeModal(modalId);
            }

            return;
        }


        /* ---------------------------------------------
           CONFIRM
        --------------------------------------------- */

        if (
            target.closest(
                "#confirm-action"
            )
        ) {

            await executeConfirm();

            return;
        }


        if (
            target.closest(
                "#confirm-cancel"
            )
        ) {

            state.confirmAction = null;

            closeModal(
                "confirm-modal"
            );

            return;
        }


        /* ---------------------------------------------
           CATEGORY
        --------------------------------------------- */

        if (
            target.closest(
                "#create-category-button"
            )
        ) {

            resetCategoryForm();

            openModal(
                "category-modal"
            );

            return;
        }


        /* ---------------------------------------------
           NOTIFICATION
        --------------------------------------------- */

        if (
            target.closest(
                "#send-notification-button"
            )
        ) {

            openModal(
                "send-notification-modal"
            );

            return;
        }


        /* ---------------------------------------------
           SIDEBAR TOGGLE
        --------------------------------------------- */

        if (
            target.closest(
                "#sidebar-toggle"
            )
        ) {

            byId(
                "admin-sidebar"
            )?.classList.toggle(
                "open"
            );

            return;
        }


        if (
            target.closest(
                "#sidebar-close"
            )
        ) {

            byId(
                "admin-sidebar"
            )?.classList.remove(
                "open"
            );

            return;
        }


        /* ---------------------------------------------
           ACCOUNT DROPDOWN
        --------------------------------------------- */

        if (
            target.closest(
                "#admin-account-button"
            )
        ) {

            const dropdown =
                byId(
                    "admin-account-dropdown"
                );


            if (dropdown) {

                dropdown.hidden =
                    !dropdown.hidden;

            }

            return;
        }


        /* ---------------------------------------------
           NOTIFICATION DROPDOWN
        --------------------------------------------- */

        if (
            target.closest(
                "#admin-notifications-button"
            )
        ) {

            const dropdown =
                byId(
                    "admin-notification-dropdown"
                );


            if (dropdown) {

                dropdown.hidden =
                    !dropdown.hidden;

            }

            return;
        }


        /* ---------------------------------------------
           LOGOUT
        --------------------------------------------- */

        if (
            target.closest(
                "#admin-logout"
            ) ||
            target.closest(
                "#dropdown-logout"
            )
        ) {

            await logout();

            return;
        }


        /* ---------------------------------------------
           REFRESH
        --------------------------------------------- */

        if (
            target.closest(
                "#admin-refresh"
            )
        ) {

            await loadPageData(
                state.currentPage
            );

            showToast(
                "Маълумот нав карда шуд.",
                "success"
            );

            return;
        }


        /* ---------------------------------------------
           VERIFY SPECIALIST
        --------------------------------------------- */

        const verifySpecialist =
            target.closest<HTMLElement>(
                ".verify-specialist"
            );


        if (
            verifySpecialist?.dataset.id
        ) {

            confirmAction(
                "Verify Specialist",
                "Ин SMM-мутахассисро тасдиқ мекунед?",
                async () => {

                    await api(
                        `/admin/specialists/${encodeURIComponent(
                            verifySpecialist.dataset.id!
                        )}/verify`,
                        {
                            method: "PATCH"
                        }
                    );


                    showToast(
                        "SMM-мутахассис тасдиқ шуд.",
                        "success"
                    );


                    await loadSpecialists();

                }
            );

            return;
        }


        /* ---------------------------------------------
           REJECT SPECIALIST
        --------------------------------------------- */

        const rejectSpecialist =
            target.closest<HTMLElement>(
                ".reject-specialist"
            );


        if (
            rejectSpecialist?.dataset.id
        ) {

            confirmAction(
                "Рад кардани Specialist",
                "Ин профилро рад мекунед?",
                async () => {

                    await api(
                        `/admin/specialists/${encodeURIComponent(
                            rejectSpecialist.dataset.id!
                        )}/reject`,
                        {
                            method: "PATCH"
                        }
                    );


                    showToast(
                        "Профил рад карда шуд.",
                        "success"
                    );


                    await loadSpecialists();

                }
            );

            return;
        }


        /* ---------------------------------------------
           RESOLVE REPORT
        --------------------------------------------- */

        const resolveReport =
            target.closest<HTMLElement>(
                '[data-action="resolve-report"]'
            );


        if (
            resolveReport?.dataset.id
        ) {

            await api(
                `/admin/reports/${encodeURIComponent(
                    resolveReport.dataset.id!
                )}/resolve`,
                {
                    method: "PATCH"
                }
            );


            showToast(
                "Шикоят ҳал шуд.",
                "success"
            );


            await loadReports();

            return;
        }


        /* ---------------------------------------------
           REJECT REPORT
        --------------------------------------------- */

        const rejectReport =
            target.closest<HTMLElement>(
                '[data-action="reject-report"]'
            );


        if (
            rejectReport?.dataset.id
        ) {

            await api(
                `/admin/reports/${encodeURIComponent(
                    rejectReport.dataset.id!
                )}/reject`,
                {
                    method: "PATCH"
                }
            );


            showToast(
                "Шикоят рад карда шуд.",
                "success"
            );


            await loadReports();

            return;
        }


        /* ---------------------------------------------
           DELETE FILE
        --------------------------------------------- */

        const deleteFile =
            target.closest<HTMLElement>(
                '[data-action="delete-file"]'
            );


        if (
            deleteFile?.dataset.id
        ) {

            confirmAction(
                "Нест кардани файл",
                "Файлро нест мекунед?",
                async () => {

                    await api(
                        `/admin/files/${encodeURIComponent(
                            deleteFile.dataset.id!
                        )}`,
                        {
                            method: "DELETE"
                        }
                    );


                    showToast(
                        "Файл нест карда шуд.",
                        "success"
                    );


                    await loadFiles();

                }
            );

            return;
        }

    }
);


/* =========================================================
   SEARCH / FILTERS
========================================================= */

let usersSearchTimer:
    ReturnType<typeof setTimeout>;


byId<HTMLInputElement>(
    "users-search"
)?.addEventListener(
    "input",
    () => {

        clearTimeout(
            usersSearchTimer
        );


        usersSearchTimer =
            setTimeout(
                () => {

                    state.usersPage = 1;

                    loadUsers();

                },
                350
            );
    }
);


[
    "users-role-filter",
    "users-status-filter",
    "users-region-filter"
].forEach(id => {

    byId<HTMLSelectElement>(
        id
    )?.addEventListener(
        "change",
        () => {

            state.usersPage = 1;

            loadUsers();

        }
    );

});


/* =========================================================
   SELECT ALL USERS
========================================================= */

byId<HTMLInputElement>(
    "select-all-users"
)?.addEventListener(
    "change",
    event => {

        const checkbox =
            event.currentTarget as HTMLInputElement;


        $all(
            ".user-select"
        ).forEach(
            element => {

                (
                    element as HTMLInputElement
                ).checked =
                    checkbox.checked;

            }
        );
    }
);


/* =========================================================
   LOGIN / REGISTER FORMS
========================================================= */

byId(
    "login-button"
)?.addEventListener(
    "click",
    () => {

        openModal(
            "login-modal"
        );

    }
);


byId(
    "cta-register"
)?.addEventListener(
    "click",
    () => {

        openModal(
            "register-modal"
        );

    }
);


byId(
    "footer-register"
)?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openModal(
            "register-modal"
        );

    }
);


byId(
    "footer-login"
)?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openModal(
            "login-modal"
        );

    }
);


/* =========================================================
   SEARCH
========================================================= */

byId(
    "admin-global-search"
)?.addEventListener(
    "keydown",
    event => {

        if (
            (event as KeyboardEvent)
                .key !== "Enter"
        ) {
            return;
        }


        const input =
            event.currentTarget as HTMLInputElement;


        const query =
            input.value.trim();


        if (!query) return;


        const usersSearch =
            byId<HTMLInputElement>(
                "users-search"
            );


        if (usersSearch) {
            usersSearch.value = query;
        }


        navigateToPage(
            "users"
        );
    }
);


/* =========================================================
   CATEGORY FORM
========================================================= */

function resetCategoryForm() {

    const form =
        byId<HTMLFormElement>(
            "category-form"
        );


    form?.reset();


    const id =
        byId<HTMLInputElement>(
            "category-id"
        );


    if (id) {
        id.value = "";
    }
}


byId(
    "category-form"
)?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const id =
            byId<HTMLInputElement>(
                "category-id"
            )?.value;


        const nameTg =
            byId<HTMLInputElement>(
                "category-name-tg"
            )?.value.trim();


        const nameRu =
            byId<HTMLInputElement>(
                "category-name-ru"
            )?.value.trim();


        const nameEn =
            byId<HTMLInputElement>(
                "category-name-en"
            )?.value.trim();


        const slug =
            byId<HTMLInputElement>(
                "category-slug"
            )?.value.trim();


        if (!nameTg || !slug) {

            showToast(
                "Номи тоҷикӣ ва slug ҳатмист.",
                "warning"
            );

            return;
        }


        try {

            const payload = {
                nameTg,
                nameRu,
                nameEn,
                slug
            };


            if (id) {

                await api(
                    `/admin/categories/${encodeURIComponent(
                        id
                    )}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            payload
                        )
                    }
                );

            } else {

                await api(
                    "/admin/categories",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            payload
                        )
                    }
                );
            }


            showToast(
                "Категория сабт шуд.",
                "success"
            );


            closeModal(
                "category-modal"
            );


            await loadCategories();

        } catch (error) {

            showToast(
                getErrorMessage(error),
                "error"
            );
        }
    }
);


/* =========================================================
   NOTIFICATION FORM
========================================================= */

byId(
    "notification-target"
)?.addEventListener(
    "change",
    event => {

        const value =
            (
                event.currentTarget
                as HTMLSelectElement
            ).value;


        const group =
            byId(
                "notification-user-group"
            );


        if (group) {

            group.hidden =
                value !== "USER";

        }
    }
);


byId(
    "admin-notification-form"
)?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const target =
            byId<HTMLSelectElement>(
                "notification-target"
            )?.value;


        const title =
            byId<HTMLInputElement>(
                "notification-title"
            )?.value.trim();


        const message =
            byId<HTMLTextAreaElement>(
                "notification-message"
            )?.value.trim();


        const user =
            byId<HTMLInputElement>(
                "notification-user"
            )?.value.trim();


        if (!title || !message) {

            showToast(
                "Сарлавҳа ва матн ҳатмист.",
                "warning"
            );

            return;
        }


        try {

            await api(
                "/admin/notifications",
                {
                    method: "POST",

                    body: JSON.stringify({
                        target,
                        user,
                        title,
                        message
                    })
                }
            );


            showToast(
                "Огоҳинома фиристода шуд.",
                "success"
            );


            closeModal(
                "send-notification-modal"
            );


            (
                byId(
                    "admin-notification-form"
                ) as HTMLFormElement
            )?.reset();


            await loadNotifications();

        } catch (error) {

            showToast(
                getErrorMessage(error),
                "error"
            );
        }
    }
);


/* =========================================================
   SETTINGS FORMS
========================================================= */

[
    "settings-general",
    "settings-security",
    "settings-uploads",
    "settings-notifications"
].forEach(id => {

    byId<HTMLFormElement>(
        id
    )?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            try {

                let payload: Record<
                    string,
                    any
                > = {};


                if (
                    id ===
                    "settings-general"
                ) {

                    payload = {
                        siteName:
                            byId<HTMLInputElement>(
                                "setting-site-name"
                            )?.value,

                        slogan:
                            byId<HTMLInputElement>(
                                "setting-slogan"
                            )?.value,

                        email:
                            byId<HTMLInputElement>(
                                "setting-email"
                            )?.value,

                        phone:
                            byId<HTMLInputElement>(
                                "setting-phone"
                            )?.value
                    };

                }


                if (
                    id ===
                    "settings-security"
                ) {

                    payload = {
                        registration:
                            byId<HTMLInputElement>(
                                "setting-registration"
                            )?.checked,

                        emailVerification:
                            byId<HTMLInputElement>(
                                "setting-email-verification"
                            )?.checked,

                        smmVerification:
                            byId<HTMLInputElement>(
                                "setting-smm-verification"
                            )?.checked
                    };

                }


                if (
                    id ===
                    "settings-uploads"
                ) {

                    payload = {
                        maxImageSize:
                            Number(
                                byId<HTMLInputElement>(
                                    "max-image-size"
                                )?.value
                            ),

                        maxVideoSize:
                            Number(
                                byId<HTMLInputElement>(
                                    "max-video-size"
                                )?.value
                            )
                    };

                }


                if (
                    id ===
                    "settings-notifications"
                ) {

                    payload = {
                        newUser:
                            byId<HTMLInputElement>(
                                "notify-new-user"
                            )?.checked,

                        report:
                            byId<HTMLInputElement>(
                                "notify-report"
                            )?.checked,

                        verification:
                            byId<HTMLInputElement>(
                                "notify-verification"
                            )?.checked
                    };

                }


                await api(
                    "/admin/settings",
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            payload
                        )
                    }
                );


                showToast(
                    "Танзимот сабт шуд.",
                    "success"
                );

            } catch (error) {

                showToast(
                    getErrorMessage(error),
                    "error"
                );
            }
        }
    );

});


/* =========================================================
   SETTINGS TABS
========================================================= */

$all(
    ".settings-tab"
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const target =
                button.dataset
                    .settings;


            $all(
                ".settings-tab"
            ).forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            $all(
                ".settings-panel"
            ).forEach(
                panel =>
                    panel.classList.remove(
                        "active"
                    )
            );


            button.classList.add(
                "active"
            );


            if (target) {

                byId(
                    `settings-${target}`
                )?.classList.add(
                    "active"
                );

            }
        }
    );

});


/* =========================================================
   DATE / YEAR
========================================================= */

function setCurrentDate() {

    const date =
        new Intl.DateTimeFormat(
            "tg-TJ",
            {
                dateStyle: "full"
            }
        ).format(
            new Date()
        );


    setText(
        "#dashboard-current-date",
        date
    );


    setText(
        "#current-year",
        new Date().getFullYear()
    );
}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeAllModals();

            byId(
                "admin-account-dropdown"
            )?.setAttribute(
                "hidden",
                ""
            );

            byId(
                "admin-notification-dropdown"
            )?.setAttribute(
                "hidden",
                ""
            );
        }
    }
);


/* =========================================================
   OUTSIDE CLICK
========================================================= */

document.addEventListener(
    "click",
    event => {

        const target =
            event.target as Node;


        const account =
            byId(
                "admin-account-dropdown"
            );


        const accountButton =
            byId(
                "admin-account-button"
            );


        if (
            account &&
            !account.contains(target) &&
            !accountButton?.contains(target)
        ) {

            account.hidden = true;

        }


        const notification =
            byId(
                "admin-notification-dropdown"
            );


        const notificationButton =
            byId(
                "admin-notifications-button"
            );


        if (
            notification &&
            !notification.contains(target) &&
            !notificationButton?.contains(target)
        ) {

            notification.hidden = true;

        }

    }
);


/* =========================================================
   INITIALIZATION
========================================================= */

async function initAdmin() {

    setCurrentDate();


    const loader =
        byId("admin-loader");


    try {

        const authenticated =
            await checkAdminAuth();


        if (!authenticated) {
            return;
        }


        await loadDashboard();


        navigateToPage(
            "dashboard"
        );


    } catch (error) {

        console.error(
            "Admin initialization error:",
            error
        );


        showToast(
            getErrorMessage(error),
            "error"
        );

    } finally {

        if (loader) {

            setTimeout(
                () => {
                    loader.classList.add(
                        "loaded"
                    );

                    loader.hidden = true;
                },
                250
            );
        }
    }
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initAdmin
);


/* =========================================================
   GLOBAL DEBUG / ACCESS
========================================================= */

(window as any).SMM_ADMIN = {
    state,

    api,

    navigateToPage,

    loadDashboard,

    loadUsers,

    loadSpecialists,

    loadSellers,

    loadServices,

    loadProducts,

    loadCategories,

    loadProjects,

    loadJobs,

    loadApplications,

    loadRealEstate,

    loadReviews,

    loadReports,

    loadNotifications,

    loadFiles,

    loadSettings,

    logout
};
