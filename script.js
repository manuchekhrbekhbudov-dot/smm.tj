/* =========================================================
   SMM.TJ — SCRIPT.JS
   Frontend Controller
   ========================================================= */

"use strict";

/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {
    API_BASE_URL: "http://localhost:5000/api",

    ACCESS_TOKEN_KEY: "smm_tj_access_token",
    REFRESH_TOKEN_KEY: "smm_tj_refresh_token",
    USER_KEY: "smm_tj_user",

    ANIMATION_DURATION: 500,

    FALLBACK_IMAGE:
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80"
};


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
    user: null,

    accessToken:
        localStorage.getItem(CONFIG.ACCESS_TOKEN_KEY) || null,

    refreshToken:
        localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY) || null,

    services: [],
    products: [],
    specialists: [],
    jobs: [],
    projects: [],
    realEstate: [],
    reviews: [],
    notifications: [],
    conversations: [],

    activeConversation: null,
    activeMarketplace: "services",
    activeRealEstateType: "sale",

    loading: false
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const getById = id =>
    document.getElementById(id);


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    initLoadingScreen();

    initNavigation();
    initModals();
    initForms();
    initFilters();
    initTabs();
    initSearch();
    initCounters();
    initScrollAnimations();
    initFavoriteButtons();

    restoreUser();

    await loadInitialData();

    updateAuthUI();

    window.SMMTJ = {
        state,
        apiRequest,
        openModal,
        closeModal,
        toast,
        loadInitialData
    };

});


/* =========================================================
   LOADING SCREEN
========================================================= */

function initLoadingScreen() {

    const screen = getById("loadingScreen");

    if (!screen) return;

    setTimeout(() => {

        screen.classList.add("hidden");

        setTimeout(() => {
            screen.remove();
        }, 700);

    }, 1000);
}


/* =========================================================
   API
========================================================= */

async function apiRequest(
    endpoint,
    options = {},
    retry = true
) {

    const config = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    };


    if (state.accessToken) {

        config.headers.Authorization =
            `Bearer ${state.accessToken}`;

    }


    try {

        const response =
            await fetch(
                `${CONFIG.API_BASE_URL}${endpoint}`,
                config
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


        const contentType =
            response.headers.get("content-type") || "";


        const data =
            contentType.includes("application/json")
                ? await response.json()
                : await response.text();


        if (!response.ok) {

            throw new Error(
                data?.message ||
                data?.error ||
                "Хатогӣ ҳангоми иҷрои дархост."
            );

        }


        return data;

    } catch (error) {

        console.error("API Error:", error);

        throw error;

    }

}


/* =========================================================
   REFRESH TOKEN
========================================================= */

async function refreshAccessToken() {

    try {

        const response = await fetch(
            `${CONFIG.API_BASE_URL}/auth/refresh`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refreshToken: state.refreshToken
                })
            }
        );


        if (!response.ok) {

            logout(false);

            return false;

        }


        const data =
            await response.json();


        state.accessToken =
            data.accessToken ||
            data.access_token;


        localStorage.setItem(
            CONFIG.ACCESS_TOKEN_KEY,
            state.accessToken
        );


        return true;

    } catch {

        logout(false);

        return false;

    }

}


/* =========================================================
   AUTH STORAGE
========================================================= */

function restoreUser() {

    try {

        const saved =
            localStorage.getItem(
                CONFIG.USER_KEY
            );

        if (saved) {

            state.user =
                JSON.parse(saved);

        }

    } catch {

        state.user = null;

    }

}


function saveAuth(data) {

    state.accessToken =
        data.accessToken ||
        data.access_token ||
        null;

    state.refreshToken =
        data.refreshToken ||
        data.refresh_token ||
        null;

    state.user =
        data.user ||
        data.profile ||
        null;


    if (state.accessToken) {

        localStorage.setItem(
            CONFIG.ACCESS_TOKEN_KEY,
            state.accessToken
        );

    }


    if (state.refreshToken) {

        localStorage.setItem(
            CONFIG.REFRESH_TOKEN_KEY,
            state.refreshToken
        );

    }


    if (state.user) {

        localStorage.setItem(
            CONFIG.USER_KEY,
            JSON.stringify(state.user)
        );

    }

}


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {

    const loginBtn =
        getById("loginBtn");

    const registerBtn =
        getById("registerBtn");

    const userMenuBtn =
        getById("userMenuBtn");


    if (state.user) {

        if (loginBtn)
            loginBtn.hidden = true;

        if (registerBtn)
            registerBtn.hidden = true;

        if (userMenuBtn) {

            userMenuBtn.hidden = false;

            userMenuBtn.textContent =
                getInitials(state.user);

        }


        updateUserMenu();

    } else {

        if (loginBtn)
            loginBtn.hidden = false;

        if (registerBtn)
            registerBtn.hidden = false;

        if (userMenuBtn)
            userMenuBtn.hidden = true;

    }

}


/* =========================================================
   REGISTER
========================================================= */

async function handleRegister(event) {

    event.preventDefault();

    const form = event.currentTarget;

    const firstName =
        getById("registerFirstName")?.value.trim();

    const lastName =
        getById("registerLastName")?.value.trim();

    const username =
        getById("registerUsername")?.value.trim();

    const phone =
        getById("registerPhone")?.value.trim();

    const email =
        getById("registerEmail")?.value.trim();

    const role =
        getById("registerRole")?.value;

    const region =
        getById("registerRegion")?.value;

    const city =
        getById("registerCity")?.value.trim();

    const password =
        getById("registerPassword")?.value;

    const confirmPassword =
        getById("registerConfirmPassword")?.value;


    if (password !== confirmPassword) {

        toast(
            "Паролҳо мувофиқ нестанд.",
            "error"
        );

        return;

    }


    if (password.length < 6) {

        toast(
            "Парол бояд ҳадди ақал 6 аломат дошта бошад.",
            "error"
        );

        return;

    }


    const submit =
        $("button[type='submit']", form);


    setButtonLoading(submit, true);


    try {

        const data =
            await apiRequest(
                "/auth/register",
                {
                    method: "POST",

                    body: JSON.stringify({
                        firstName,
                        lastName,
                        username,
                        phone,
                        email,
                        password,
                        confirmPassword,
                        role,
                        region,
                        city
                    })
                }
            );


        saveAuth(data);

        closeModal("registerModal");

        updateAuthUI();

        toast(
            "Аккаунти шумо бомуваффақият сохта шуд.",
            "success"
        );


        await loadInitialData();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    } finally {

        setButtonLoading(submit, false);

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    const identifier =
        getById("loginIdentifier")?.value.trim();

    const password =
        getById("loginPassword")?.value;


    const submit =
        $("button[type='submit']", event.currentTarget);


    setButtonLoading(submit, true);


    try {

        const data =
            await apiRequest(
                "/auth/login",
                {
                    method: "POST",

                    body: JSON.stringify({
                        identifier,
                        password
                    })
                }
            );


        saveAuth(data);

        closeModal("loginModal");

        updateAuthUI();

        toast(
            "Хуш омадед ба SMM.TJ!",
            "success"
        );


        await loadInitialData();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    } finally {

        setButtonLoading(submit, false);

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout(showToast = true) {

    try {

        if (state.accessToken) {

            await apiRequest(
                "/auth/logout",
                {
                    method: "POST"
                }
            );

        }

    } catch {

        // local logout continues
    }


    state.user = null;
    state.accessToken = null;
    state.refreshToken = null;


    localStorage.removeItem(
        CONFIG.ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
        CONFIG.REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
        CONFIG.USER_KEY
    );


    updateAuthUI();


    if (showToast) {

        toast(
            "Шумо аз аккаунт баромадед.",
            "success"
        );

    }

}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function handleForgotPassword(event) {

    event.preventDefault();

    const identifier =
        getById("forgotIdentifier")?.value.trim();


    try {

        await apiRequest(
            "/auth/forgot-password",
            {
                method: "POST",

                body: JSON.stringify({
                    identifier
                })
            }
        );


        closeModal("forgotModal");

        toast(
            "Агар аккаунт мавҷуд бошад, маълумоти барқарорсозӣ фиристода шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   INITIAL DATA
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

}


/* =========================================================
   SPECIALISTS
========================================================= */

async function loadSpecialists() {

    const grid =
        getById("specialistsGrid");

    if (!grid) return;


    showSkeleton(grid, 6);


    try {

        const data =
            await apiRequest(
                "/smm"
            );


        state.specialists =
            normalizeArray(data);


        renderSpecialists();

    } catch {

        renderEmpty(
            grid,
            "Мутахассисон ҳоло дастрас нестанд."
        );

    }

}


function renderSpecialists(
    list = state.specialists
) {

    const grid =
        getById("specialistsGrid");

    if (!grid) return;


    grid.innerHTML = "";


    if (!list.length) {

        showEmpty("specialistsEmpty");

        return;

    }


    hideEmpty("specialistsEmpty");


    list.forEach(item => {

        const card =
            createSpecialistCard(item);

        grid.appendChild(card);

        requestAnimationFrame(() => {

            card.classList.add("reveal");

        });

    });

}


function createSpecialistCard(item) {

    const template =
        getById(
            "specialistCardTemplate"
        );

    const card =
        template.content
            .firstElementChild
            .cloneNode(true);


    const name =
        fullName(item) ||
        item.username ||
        "Мутахассис";


    const avatar =
        item.avatar ||
        item.photo ||
        item.image ||
        CONFIG.FALLBACK_IMAGE;


    $(".specialist-name", card).textContent =
        name;

    $(".specialist-role", card).textContent =
        item.title ||
        item.specialization ||
        "SMM Specialist";

    $(".specialist-bio", card).textContent =
        item.bio ||
        item.description ||
        "Мутахассиси касбӣ дар SMM.TJ";


    const image =
        $(".specialist-avatar img", card);

    image.src = avatar;
    image.alt = name;


    const rating =
        Number(
            item.rating ||
            item.averageRating ||
            5
        );


    $(".rating-value", card).textContent =
        rating.toFixed(1);


    $(".review-count", card).textContent =
        `(${item.reviewCount || 0})`;


    $(".specialist-location", card).textContent =
        `◉ ${item.city || "Тоҷикистон"}`;


    $(".specialist-experience", card).textContent =
        item.experience
            ? `${item.experience} сол таҷриба`
            : "Мутахассиси касбӣ";


    const tags =
        $(".specialist-tags", card);


    const skills =
        normalizeArray(
            item.skills ||
            item.specialties
        );


    skills.slice(0, 4).forEach(skill => {

        const tag =
            document.createElement("span");

        tag.textContent =
            typeof skill === "string"
                ? skill
                : skill.name;

        tags.appendChild(tag);

    });


    $(".specialist-view", card)
        .addEventListener("click", () => {

            openProfile(item);

        });


    $(".favorite-btn", card)
        .addEventListener("click", () => {

            toggleFavorite(
                item.id,
                "smm"
            );

        });


    return card;

}


/* =========================================================
   SERVICES
========================================================= */

async function loadServices() {

    const grid =
        getById("servicesGrid");

    if (!grid) return;


    showSkeleton(grid, 8);


    try {

        const data =
            await apiRequest(
                "/services"
            );


        state.services =
            normalizeArray(data);


        renderServices();

    } catch {

        renderEmpty(
            grid,
            "Хизматрасониҳо ҳоло дастрас нестанд."
        );

    }

}


function renderServices(
    list = state.services
) {

    const grid =
        getById("servicesGrid");

    if (!grid) return;


    grid.innerHTML = "";


    list.slice(0, 12).forEach(item => {

        const card =
            createServiceCard(item);

        grid.appendChild(card);

    });

}


function createServiceCard(item) {

    const template =
        getById(
            "serviceCardTemplate"
        );


    const card =
        template.content
            .firstElementChild
            .cloneNode(true);


    const image =
        $(".card-image img", card);


    image.src =
        item.image ||
        item.cover ||
        item.thumbnail ||
        CONFIG.FALLBACK_IMAGE;


    $(".service-title", card).textContent =
        item.title ||
        item.name ||
        "Хизматрасонӣ";


    $(".service-description", card).textContent =
        item.description ||
        "Хизматрасонии касбӣ";


    $(".seller-name", card).textContent =
        fullName(item.user || item.owner) ||
        item.username ||
        "SMM Specialist";


    $(".service-price", card).textContent =
        formatPrice(
            item.price
        );


    $(".card-category", card).textContent =
        categoryName(
            item.category
        );


    $(".card-rating strong", card).textContent =
        Number(item.rating || 5).toFixed(1);


    $(".card-rating span", card).textContent =
        `(${item.reviewCount || 0})`;


    $(".favorite-btn", card)
        .addEventListener("click", () => {

            toggleFavorite(
                item.id,
                "service"
            );

        });


    const viewButton =
        $(".card-footer .btn", card);


    viewButton?.addEventListener(
        "click",
        () => openService(item)
    );


    return card;

}


/* =========================================================
   PRODUCTS
========================================================= */

async function loadProducts() {

    const grid =
        getById("productsGrid");

    if (!grid) return;


    try {

        const data =
            await apiRequest(
                "/products"
            );


        state.products =
            normalizeArray(data);


        renderProducts();

    } catch {

        renderEmpty(
            grid,
            "Маҳсулотҳо ҳоло дастрас нестанд."
        );

    }

}


function renderProducts(
    list = state.products
) {

    const grid =
        getById("productsGrid");

    if (!grid) return;


    grid.innerHTML = "";


    list.slice(0, 12).forEach(item => {

        const card =
            createProductCard(item);

        grid.appendChild(card);

    });

}


function createProductCard(item) {

    const template =
        getById(
            "productCardTemplate"
        );


    const card =
        template.content
            .firstElementChild
            .cloneNode(true);


    $("img", card).src =
        item.image ||
        item.thumbnail ||
        CONFIG.FALLBACK_IMAGE;


    $(".product-title", card).textContent =
        item.title ||
        item.name ||
        "Маҳсулот";


    $(".product-description", card).textContent =
        item.description ||
        "Маҳсулоти нав";


    $(".product-price", card).textContent =
        formatPrice(item.price);


    $(".product-category", card).textContent =
        categoryName(item.category);


    $(".favorite-btn", card)
        .addEventListener("click", () => {

            toggleFavorite(
                item.id,
                "product"
            );

        });


    $(".card-footer .btn", card)
        .addEventListener("click", () => {

            openProduct(item);

        });


    return card;

}


/* =========================================================
   JOBS
========================================================= */

async function loadJobs() {

    const grid =
        getById("jobsGrid");

    if (!grid) return;


    showSkeleton(grid, 5);


    try {

        const data =
            await apiRequest(
                "/jobs"
            );


        state.jobs =
            normalizeArray(data);


        renderJobs();

    } catch {

        renderEmpty(
            grid,
            "Ҷойҳои корӣ дастрас нестанд."
        );

    }

}


function renderJobs(
    list = state.jobs
) {

    const grid =
        getById("jobsGrid");

    if (!grid) return;


    grid.innerHTML = "";


    list.slice(0, 10).forEach(item => {

        const card =
            createJobCard(item);

        grid.appendChild(card);

    });

}


function createJobCard(item) {

    const template =
        getById(
            "jobCardTemplate"
        );


    const card =
        template.content
            .firstElementChild
            .cloneNode(true);


    $(".job-company", card).textContent =
        item.company ||
        item.employer?.name ||
        "Компания";


    $(".job-title", card).textContent =
        item.title ||
        "Ҷойи корӣ";


    $(".job-description", card).textContent =
        item.description ||
        "";


    $(".job-type", card).textContent =
        item.employmentType ||
        item.type ||
        "Full-time";


    $(".job-location", card).textContent =
        item.city ||
        item.region ||
        "Тоҷикистон";


    $(".job-salary", card).textContent =
        item.salary
            ? formatPrice(item.salary)
            : "Созишӣ";


    $(".job-deadline", card).textContent =
        formatDate(item.deadline);


    const skills =
        $(".job-skills", card);


    normalizeArray(item.skills)
        .slice(0, 4)
        .forEach(skill => {

            const span =
                document.createElement("span");

            span.textContent =
                typeof skill === "string"
                    ? skill
                    : skill.name;

            skills.appendChild(span);

        });


    $(".job-bottom .btn", card)
        .addEventListener("click", () => {

            applyToJob(item.id);

        });


    return card;

}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {

    const grid =
        getById("projectsGrid");

    if (!grid) return;


    showSkeleton(grid, 6);


    try {

        const data =
            await apiRequest(
                "/projects"
            );


        state.projects =
            normalizeArray(data);


        renderProjects();

    } catch {

        renderEmpty(
            grid,
            "Лоиҳаҳо ҳоло дастрас нестанд."
        );

    }

}


function renderProjects(
    list = state.projects
) {

    const grid =
        getById("projectsGrid");

    if (!grid) return;


    grid.innerHTML = "";


    list.slice(0, 12).forEach(item => {

        const card =
            createProjectCard(item);

        grid.appendChild(card);

    });

}


function createProjectCard(item) {

    const template =
        getById(
            "projectCardTemplate"
        );


    const card =
        template.content
            .firstElementChild
            .cloneNode(true);


    $(".project-category", card).textContent =
        categoryName(item.category);


    $(".project-status", card).textContent =
        statusName(item.status);


    $(".project-title", card).textContent =
        item.title ||
        "Лоиҳа";


    $(".project-description", card).textContent =
        item.description ||
        "";


    $(".project-budget", card).textContent =
        formatPrice(item.budget);


    $(".project-deadline", card).textContent =
        formatDate(item.deadline);


    $(".project-owner-name", card).textContent =
        fullName(
            item.client ||
            item.owner ||
            item.user
        ) ||
        "Client";


    $(".project-location", card).textContent =
        item.city ||
        item.region ||
        "Тоҷикистон";


    $(".project-view", card)
        .addEventListener("click", () => {

            openProject(item);

        });


    return card;

}


/* =========================================================
   REAL ESTATE
========================================================= */

async function loadRealEstate() {

    const grid =
        getById("realEstateGrid");

    if (!grid) return;


    showSkeleton(grid, 6);


    try {

        const data =
            await apiRequest(
                "/real-estate"
            );


        state.realEstate =
            normalizeArray(data);


        renderRealEstate();

    } catch {

        renderEmpty(
            grid,
            "Эълонҳои амвол дастрас нестанд."
        );

    }

}


function renderRealEstate(
    list = state.realEstate
) {

    const grid =
        getById("realEstateGrid");

    if (!grid) return;


    grid.innerHTML = "";


    const filtered =
        list.filter(item => {

            const type =
                item.type ||
                item.operationType ||
                "sale";

            return type ===
                state.activeRealEstateType;

        });


    filtered.slice(0, 12).forEach(item => {

        grid.appendChild(
            createRealEstateCard(item)
        );

    });

}


function createRealEstateCard(item) {

    const template =
        getById(
            "realEstateCardTemplate"
        );


    const card =
        template.content
            .firstElementChild
            .cloneNode(true);


    $("img", card).src =
        item.image ||
        item.images?.[0] ||
        CONFIG.FALLBACK_IMAGE;


    $(".real-type", card).textContent =
        item.type === "rent"
            ? "Иҷора"
            : "Фурӯш";


    $(".real-property-type", card).textContent =
        propertyName(
            item.propertyType ||
            item.category
        );


    $(".real-title", card).textContent =
        item.title ||
        "Амвол";


    $(".real-description", card).textContent =
        item.description ||
        "";


    $(".real-rooms", card).textContent =
        item.rooms || 0;


    $(".real-area", card).textContent =
        item.area || 0;


    $(".real-price", card).textContent =
        formatPrice(item.price);


    $(".real-location span", card).textContent =
        item.city ||
        item.region ||
        "Тоҷикистон";


    $(".favorite-btn", card)
        .addEventListener("click", () => {

            toggleFavorite(
                item.id,
                "real-estate"
            );

        });


    $(".real-bottom .btn", card)
        .addEventListener("click", () => {

            openRealEstate(item);

        });


    return card;

}


/* =========================================================
   REVIEWS
========================================================= */

async function loadReviews() {

    const grid =
        getById("reviewsGrid");

    if (!grid) return;


    try {

        const data =
            await apiRequest(
                "/reviews"
            );


        state.reviews =
            normalizeArray(data);


        renderReviews();

    } catch {

        grid.innerHTML = "";

    }

}


function renderReviews() {

    const grid =
        getById("reviewsGrid");

    if (!grid) return;


    grid.innerHTML = "";


    state.reviews
        .slice(0, 6)
        .forEach(review => {

            const template =
                getById(
                    "reviewCardTemplate"
                );


            const card =
                template.content
                    .firstElementChild
                    .cloneNode(true);


            $(".review-text", card).textContent =
                review.comment ||
                review.text ||
                "Хизматрасонии олӣ.";


            $(".review-name", card).textContent =
                fullName(
                    review.user ||
                    review.author
                ) ||
                "Корбар";


            $(".review-role", card).textContent =
                review.role ||
                "Корбар";


            const rating =
                Math.max(
                    1,
                    Math.min(
                        5,
                        Number(review.rating || 5)
                    )
                );


            $(".review-stars", card).textContent =
                "★".repeat(rating) +
                "☆".repeat(5 - rating);


            grid.appendChild(card);

        });

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    if (!state.accessToken) return;


    try {

        const data =
            await apiRequest(
                "/notifications"
            );


        state.notifications =
            normalizeArray(data);


        renderNotifications();

        updateNotificationBadge();

    } catch {

        // user may not have notifications
    }

}


function renderNotifications() {

    const list =
        getById("notificationsList");

    if (!list) return;


    if (!state.notifications.length) {

        list.innerHTML = `
            <div class="empty-state">
                <div>♢</div>
                <h3>Огоҳинома нест</h3>
                <p>Ҳоло огоҳиномаи нав надоред.</p>
            </div>
        `;

        return;

    }


    list.innerHTML = "";


    state.notifications.forEach(notification => {

        const item =
            document.createElement("div");

        item.className =
            "notification-item";


        if (!notification.read) {

            item.classList.add("unread");

        }


        item.innerHTML = `
            <div class="notification-icon">
                ${notificationIcon(notification.type)}
            </div>

            <div class="notification-content">

                <strong>
                    ${escapeHTML(
                        notification.title ||
                        "Огоҳинома"
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
        `;


        item.addEventListener(
            "click",
            () => markNotificationRead(
                notification.id
            )
        );


        list.appendChild(item);

    });

}


function updateNotificationBadge() {

    const badge =
        getById("notificationBadge");

    if (!badge) return;


    const unread =
        state.notifications
            .filter(n => !n.read)
            .length;


    badge.textContent =
        unread > 99
            ? "99+"
            : unread;


    badge.hidden =
        unread === 0;

}


async function markNotificationRead(id) {

    try {

        await apiRequest(
            `/notifications/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    read: true
                })
            }
        );


        const notification =
            state.notifications.find(
                n => n.id === id
            );


        if (notification)
            notification.read = true;


        renderNotifications();
        updateNotificationBadge();

    } catch {

        // ignore
    }

}


/* =========================================================
   CHAT
========================================================= */

async function loadConversations() {

    if (!state.accessToken) {

        toast(
            "Аввал ба аккаунт ворид шавед.",
            "warning"
        );

        return;

    }


    try {

        const data =
            await apiRequest(
                "/messages/conversations"
            );


        state.conversations =
            normalizeArray(data);


        renderConversations();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


function renderConversations() {

    const list =
        getById("conversationList");

    if (!list) return;


    list.innerHTML = "";


    state.conversations.forEach(conversation => {

        const user =
            conversation.user ||
            conversation.otherUser ||
            conversation.participant;


        const item =
            document.createElement("button");


        item.className =
            "conversation-item";


        item.innerHTML = `

            <div class="avatar">
                ${escapeHTML(
                    getInitials(user)
                )}
            </div>

            <div>

                <strong>
                    ${escapeHTML(
                        fullName(user) ||
                        "User"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        conversation.lastMessage ||
                        "Паём нест"
                    )}
                </span>

            </div>

        `;


        item.addEventListener(
            "click",
            () => openConversation(conversation)
        );


        list.appendChild(item);

    });

}


async function openConversation(conversation) {

    state.activeConversation =
        conversation;


    const user =
        conversation.user ||
        conversation.otherUser ||
        conversation.participant;


    const name =
        fullName(user) ||
        "User";


    const nameElement =
        getById("chatUserName");

    if (nameElement)
        nameElement.textContent = name;


    const avatar =
        getById("chatUserAvatar");

    if (avatar)
        avatar.textContent =
            getInitials(user);


    try {

        const data =
            await apiRequest(
                `/messages/conversations/${conversation.id}`
            );


        renderMessages(
            normalizeArray(data)
        );

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


function renderMessages(messages) {

    const box =
        getById("chatMessages");

    if (!box) return;


    box.innerHTML = "";


    messages.forEach(message => {

        const mine =
            message.senderId === state.user?.id ||
            message.sender?.id === state.user?.id;


        const bubble =
            document.createElement("div");


        bubble.className =
            `message-bubble ${
                mine ? "mine" : "theirs"
            }`;


        bubble.innerHTML = `

            <div class="message-text">
                ${escapeHTML(
                    message.content ||
                    message.text ||
                    ""
                )}
            </div>

            <small>
                ${formatTime(
                    message.createdAt
                )}
            </small>

        `;


        box.appendChild(bubble);

    });


    box.scrollTop =
        box.scrollHeight;

}


async function handleSendMessage(event) {

    event.preventDefault();


    if (!state.activeConversation) {

        toast(
            "Аввал conversation интихоб кунед.",
            "warning"
        );

        return;

    }


    const input =
        getById("chatInput");


    const content =
        input?.value.trim();


    if (!content) return;


    try {

        const message =
            await apiRequest(
                "/messages",
                {
                    method: "POST",

                    body: JSON.stringify({
                        conversationId:
                            state.activeConversation.id,

                        content
                    })
                }
            );


        input.value = "";


        const box =
            getById("chatMessages");


        const bubble =
            document.createElement("div");


        bubble.className =
            "message-bubble mine";


        bubble.innerHTML = `
            <div class="message-text">
                ${escapeHTML(
                    message.content || content
                )}
            </div>

            <small>
                ${formatTime(
                    message.createdAt ||
                    new Date()
                )}
            </small>
        `;


        box.appendChild(bubble);

        box.scrollTop =
            box.scrollHeight;

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   CREATE PROJECT
========================================================= */

async function handleCreateProject(event) {

    event.preventDefault();


    if (!requireAuth()) return;


    const payload = {

        title:
            getById("projectTitle").value.trim(),

        description:
            getById("projectDescription").value.trim(),

        category:
            getById("projectFormCategory").value,

        budget:
            Number(
                getById("projectBudgetInput").value
            ),

        deadline:
            getById("projectDeadline").value || null,

        city:
            getById("projectCity").value.trim(),

        skills:
            getById("projectSkills").value
                .split(",")
                .map(x => x.trim())
                .filter(Boolean)

    };


    try {

        await apiRequest(
            "/projects",
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );


        closeModal("projectModal");

        toast(
            "Лоиҳа бомуваффақият нашр шуд.",
            "success"
        );


        event.currentTarget.reset();

        await loadProjects();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   CREATE SERVICE
========================================================= */

async function handleCreateService(event) {

    event.preventDefault();


    if (!requireAuth()) return;


    const payload = {

        title:
            getById("serviceTitle").value.trim(),

        description:
            getById("serviceDescription").value.trim(),

        category:
            getById("serviceCategory").value,

        price:
            Number(
                getById("servicePrice").value
            ),

        region:
            getById("serviceRegion").value

    };


    try {

        await apiRequest(
            "/services",
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );


        closeModal("serviceModal");

        toast(
            "Хизматрасонӣ нашр шуд.",
            "success"
        );


        event.currentTarget.reset();

        await loadServices();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   CREATE PRODUCT
========================================================= */

async function handleCreateProduct(event) {

    event.preventDefault();


    if (!requireAuth()) return;


    const payload = {

        title:
            getById("productTitle").value.trim(),

        description:
            getById("productDescription").value.trim(),

        price:
            Number(
                getById("productPrice").value
            ),

        category:
            getById("productCategory").value

    };


    try {

        await apiRequest(
            "/products",
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );


        closeModal("productModal");

        toast(
            "Маҳсулот нашр шуд.",
            "success"
        );


        event.currentTarget.reset();

        await loadProducts();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   CREATE REAL ESTATE
========================================================= */

async function handleCreateRealEstate(event) {

    event.preventDefault();


    if (!requireAuth()) return;


    const payload = {

        title:
            getById("realEstateTitle").value.trim(),

        type:
            getById("realEstateType").value,

        description:
            getById("realEstateDescription").value.trim(),

        propertyType:
            getById("realEstatePropertyType").value,

        price:
            Number(
                getById("realEstatePrice").value
            ),

        area:
            Number(
                getById("realEstateArea").value
            ) || null,

        rooms:
            Number(
                getById("realEstateRooms").value
            ) || null,

        region:
            getById("realEstateFormRegion").value,

        city:
            getById("realEstateCity").value.trim(),

        address:
            getById("realEstateAddress").value.trim(),

        phone:
            getById("realEstatePhone").value.trim()

    };


    try {

        await apiRequest(
            "/real-estate",
            {
                method: "POST",
                body: JSON.stringify(payload)
            }
        );


        closeModal("realEstateModal");

        toast(
            "Эълони амвол нашр шуд.",
            "success"
        );


        event.currentTarget.reset();

        await loadRealEstate();

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   JOB APPLICATION
========================================================= */

async function applyToJob(jobId) {

    if (!requireAuth()) return;


    const message =
        prompt(
            "Паёми шумо барои корфармо:"
        );


    if (message === null) return;


    try {

        await apiRequest(
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
            "Аризаи шумо фиристода шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   FAVORITES
========================================================= */

async function toggleFavorite(
    itemId,
    type
) {

    if (!requireAuth()) return;


    try {

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


        toast(
            "Ба дӯстдоштаҳо илова шуд.",
            "success"
        );

    } catch (error) {

        toast(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   SEARCH
========================================================= */

function initSearch() {

    const heroSearch =
        getById("heroSearchBtn");


    heroSearch?.addEventListener(
        "click",
        () => {

            const query =
                getById(
                    "heroSearchInput"
                )?.value.trim();


            if (!query) {

                toast(
                    "Матни ҷустуҷӯро ворид кунед.",
                    "warning"
                );

                return;

            }


            openModal("searchModal");

            const input =
                getById(
                    "globalSearchInput"
                );


            if (input) {

                input.value = query;

                performSearch(query);

            }

        }
    );


    getById("globalSearchInput")
        ?.addEventListener(
            "input",
            debounce(event => {

                performSearch(
                    event.target.value
                );

            }, 350)
        );


    $$("[data-search]").forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const query =
                    button.dataset.search;


                getById(
                    "heroSearchInput"
                ).value = query;


                performSearch(query);

                openModal("searchModal");

            }
        );

    });

}


async function performSearch(query) {

    const results =
        getById("searchResults");


    if (!results) return;


    query =
        query.trim();


    if (!query) {

        results.innerHTML = `
            <div class="empty-state">
                <div>⌕</div>
                <h3>Ҷустуҷӯ кунед</h3>
                <p>
                    Номи хизмат, кор ё мутахассисро ворид кунед.
                </p>
            </div>
        `;

        return;

    }


    results.innerHTML = `
        <div class="search-loading">
            Ҷустуҷӯ...
        </div>
    `;


    try {

        const data =
            await apiRequest(
                `/search?q=${encodeURIComponent(query)}`
            );


        renderSearchResults(
            normalizeArray(data)
        );

    } catch {

        /*
         * Local fallback search.
         * API дастрас набошад ҳам UI намешиканад.
         */

        const all = [

            ...state.specialists.map(
                x => ({
                    ...x,
                    _type: "specialist"
                })
            ),

            ...state.services.map(
                x => ({
                    ...x,
                    _type: "service"
                })
            ),

            ...state.jobs.map(
                x => ({
                    ...x,
                    _type: "job"
                })
            ),

            ...state.projects.map(
                x => ({
                    ...x,
                    _type: "project"
                })
            )

        ];


        const lower =
            query.toLowerCase();


        const filtered =
            all.filter(item => {

                const text =
                    JSON.stringify(item)
                        .toLowerCase();

                return text.includes(lower);

            });


        renderSearchResults(filtered);

    }

}


function renderSearchResults(results) {

    const container =
        getById("searchResults");


    if (!container) return;


    if (!results.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div>🔎</div>
                <h3>Натиҷа ёфт нашуд</h3>
                <p>
                    Ҷустуҷӯи дигарро санҷед.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML = "";


    results.slice(0, 15)
        .forEach(item => {

            const result =
                document.createElement("button");


            result.className =
                "search-result";


            const title =
                item.title ||
                fullName(item) ||
                item.name ||
                "Натиҷа";


            const type =
                item._type ||
                "result";


            result.innerHTML = `

                <div class="search-result-icon">
                    ${searchTypeIcon(type)}
                </div>

                <div>

                    <strong>
                        ${escapeHTML(title)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            categoryName(
                                item.category
                            )
                        )}
                    </span>

                </div>

                <b>→</b>

            `;


            result.addEventListener(
                "click",
                () => {

                    closeModal("searchModal");

                    openSearchItem(item);

                }
            );


            container.appendChild(result);

        });

}


/* =========================================================
   FILTERS
========================================================= */

function initFilters() {

    getById("specialistSearch")
        ?.addEventListener(
            "input",
            debounce(filterSpecialists, 250)
        );


    getById("specialistCategory")
        ?.addEventListener(
            "change",
            filterSpecialists
        );


    getById("specialistRegion")
        ?.addEventListener(
            "change",
            filterSpecialists
        );


    getById("specialistSort")
        ?.addEventListener(
            "change",
            filterSpecialists
        );


    getById("marketSearch")
        ?.addEventListener(
            "input",
            debounce(filterMarketplace, 250)
        );


    getById("marketCategory")
        ?.addEventListener(
            "change",
            filterMarketplace
        );


    getById("marketRegion")
        ?.addEventListener(
            "change",
            filterMarketplace
        );


    getById("jobSearch")
        ?.addEventListener(
            "input",
            debounce(filterJobs, 250)
        );


    getById("jobRegion")
        ?.addEventListener(
            "change",
            filterJobs
        );


    getById("jobType")
        ?.addEventListener(
            "change",
            filterJobs
        );


    getById("projectSearch")
        ?.addEventListener(
            "input",
            debounce(filterProjects, 250)
        );


    getById("projectCategory")
        ?.addEventListener(
            "change",
            filterProjects
        );


    getById("realEstateSearch")
        ?.addEventListener(
            "input",
            debounce(filterRealEstate, 250)
        );


    getById("realEstateCategory")
        ?.addEventListener(
            "change",
            filterRealEstate
        );


    getById("realEstateRegion")
        ?.addEventListener(
            "change",
            filterRealEstate
        );

}


function filterSpecialists() {

    const query =
        getById("specialistSearch")
            ?.value
            .toLowerCase()
            .trim() || "";


    const category =
        getById("specialistCategory")
            ?.value || "";


    const region =
        getById("specialistRegion")
            ?.value || "";


    let result =
        [...state.specialists];


    result =
        result.filter(item => {

            const text =
                JSON.stringify(item)
                    .toLowerCase();


            const queryMatch =
                !query ||
                text.includes(query);


            const categoryMatch =
                !category ||
                String(
                    item.category ||
                    item.specialization ||
                    ""
                ).toLowerCase()
                    .includes(category);


            const regionMatch =
                !region ||
                String(
                    item.region || ""
                ).toLowerCase()
                    .includes(region);


            return (
                queryMatch &&
                categoryMatch &&
                regionMatch
            );

        });


    renderSpecialists(result);

}


function filterMarketplace() {

    const query =
        getById("marketSearch")
            ?.value
            .toLowerCase()
            .trim() || "";


    const category =
        getById("marketCategory")
            ?.value || "";


    const region =
        getById("marketRegion")
            ?.value || "";


    const source =
        state.activeMarketplace === "services"
            ? state.services
            : state.products;


    const result =
        source.filter(item => {

            const text =
                JSON.stringify(item)
                    .toLowerCase();


            return (
                (!query ||
                    text.includes(query)) &&

                (!category ||
                    String(
                        item.category || ""
                    ).toLowerCase()
                        .includes(category)) &&

                (!region ||
                    String(
                        item.region || ""
                    ).toLowerCase()
                        .includes(region))
            );

        });


    if (
        state.activeMarketplace ===
        "services"
    ) {

        renderServices(result);

    } else {

        renderProducts(result);

    }

}


function filterJobs() {

    const query =
        getById("jobSearch")
            ?.value
            .toLowerCase()
            .trim() || "";


    const region =
        getById("jobRegion")
            ?.value || "";


    const type =
        getById("jobType")
            ?.value || "";


    const result =
        state.jobs.filter(item => {

            const text =
                JSON.stringify(item)
                    .toLowerCase();


            return (
                (!query ||
                    text.includes(query)) &&

                (!region ||
                    String(
                        item.region || ""
                    ).toLowerCase()
                        .includes(region)) &&

                (!type ||
                    String(
                        item.type ||
                        item.employmentType ||
                        ""
                    ).toLowerCase()
                        .includes(type))
            );

        });


    renderJobs(result);

}


function filterProjects() {

    const query =
        getById("projectSearch")
            ?.value
            .toLowerCase()
            .trim() || "";


    const category =
        getById("projectCategory")
            ?.value || "";


    const result =
        state.projects.filter(item => {

            const text =
                JSON.stringify(item)
                    .toLowerCase();


            return (
                (!query ||
                    text.includes(query)) &&

                (!category ||
                    String(
                        item.category || ""
                    ).toLowerCase()
                        .includes(category))
            );

        });


    renderProjects(result);

}


function filterRealEstate() {

    const query =
        getById("realEstateSearch")
            ?.value
            .toLowerCase()
            .trim() || "";


    const category =
        getById("realEstateCategory")
            ?.value || "";


    const region =
        getById("realEstateRegion")
            ?.value || "";


    let result =
        state.realEstate.filter(item => {

            const text =
                JSON.stringify(item)
                    .toLowerCase();


            return (
                (!query ||
                    text.includes(query)) &&

                (!category ||
                    String(
                        item.propertyType ||
                        item.category ||
                        ""
                    ).toLowerCase()
                        .includes(category)) &&

                (!region ||
                    String(
                        item.region || ""
                    ).toLowerCase()
                        .includes(region))
            );

        });


    renderRealEstate(result);

}


/* =========================================================
   TABS
========================================================= */

function initTabs() {

    $$(".market-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    $$(".market-tab")
                        .forEach(x =>
                            x.classList.remove(
                                "active"
                            )
                        );


                    tab.classList.add("active");


                    state.activeMarketplace =
                        tab.dataset.market;


                    const services =
                        getById(
                            "servicesGrid"
                        );

                    const products =
                        getById(
                            "productsGrid"
                        );


                    if (
                        state.activeMarketplace ===
                        "services"
                    ) {

                        services.hidden = false;
                        products.hidden = true;

                        filterMarketplace();

                    } else {

                        services.hidden = true;
                        products.hidden = false;

                        filterMarketplace();

                    }

                }
            );

        });


    $$(".real-tab")
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    $$(".real-tab")
                        .forEach(x =>
                            x.classList.remove(
                                "active"
                            )
                        );


                    tab.classList.add("active");


                    state.activeRealEstateType =
                        tab.dataset.type;


                    renderRealEstate();

                }
            );

        });


    $$(".category-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const category =
                        card.dataset.category;


                    const market =
                        getById(
                            "marketCategory"
                        );


                    if (market) {

                        market.value =
                            category;

                    }


                    document
                        .getElementById(
                            "marketplace"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });


                    filterMarketplace();

                }
            );

        });


    $$(".region-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const region =
                        card.dataset.region;


                    const select =
                        getById(
                            "specialistRegion"
                        );


                    if (select) {

                        select.value =
                            region;

                    }


                    document
                        .getElementById(
                            "specialists"
                        )
                        ?.scrollIntoView({
                            behavior: "smooth"
                        });


                    filterSpecialists();

                }
            );

        });

}


/* =========================================================
   NAVIGATION
========================================================= */

function initNavigation() {

    const mobileBtn =
        getById("mobileMenuBtn");

    const mobileMenu =
        getById("mobileMenu");


    mobileBtn?.addEventListener(
        "click",
        () => {

            mobileBtn.classList.toggle("active");

            mobileMenu?.classList.toggle(
                "open"
            );

        }
    );


    $$(".mobile-menu a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    mobileBtn?.classList.remove(
                        "active"
                    );

                    mobileMenu?.classList.remove(
                        "open"
                    );

                }
            );

        });


    $$(".nav-link").forEach(link => {

        link.addEventListener(
            "click",
            () => {

                $$(".nav-link")
                    .forEach(x =>
                        x.classList.remove(
                            "active"
                        )
                    );


                link.classList.add("active");

            }
        );

    });


    getById("heroExploreBtn")
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById("marketplace")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );


    getById("ctaExploreBtn")
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById("marketplace")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );


    getById("heroRegisterBtn")
        ?.addEventListener(
            "click",
            () => openModal("registerModal")
        );


    getById("ctaRegisterBtn")
        ?.addEventListener(
            "click",
            () => openModal("registerModal")
        );


    getById("loginBtn")
        ?.addEventListener(
            "click",
            () => openModal("loginModal")
        );


    getById("registerBtn")
        ?.addEventListener(
            "click",
            () => openModal("registerModal")
        );


    getById("mobileLoginBtn")
        ?.addEventListener(
            "click",
            () => openModal("loginModal")
        );


    getById("mobileRegisterBtn")
        ?.addEventListener(
            "click",
            () => openModal("registerModal")
        );


    getById("globalSearchBtn")
        ?.addEventListener(
            "click",
            () => openModal("searchModal")
        );


    getById("notificationBtn")
        ?.addEventListener(
            "click",
            async () => {

                if (!requireAuth())
                    return;

                openSideModal(
                    "notificationsModal"
                );

                await loadNotifications();

            }
        );


    getById("messageBtn")
        ?.addEventListener(
            "click",
            async () => {

                if (!requireAuth())
                    return;

                openChat();

            }
        );


    getById("mobileProfileBtn")
        ?.addEventListener(
            "click",
            () => {

                if (state.user) {

                    openProfile(
                        state.user
                    );

                } else {

                    openModal(
                        "loginModal"
                    );

                }

            }
        );

}


/* =========================================================
   MODALS
========================================================= */

function initModals() {

    $("[data-close='searchModal']");

    $$("[data-close]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset.close
                    );

                }
            );

        });


    $$(".modal-overlay")
        .forEach(overlay => {

            overlay.addEventListener(
                "click",
                () => {

                    const modal =
                        overlay.closest(
                            ".modal"
                        );


                    if (modal)
                        closeModal(
                            modal.id
                        );

                }
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                $$(".modal.open")
                    .forEach(modal =>
                        closeModal(modal.id)
                    );

            }

        }
    );


    getById("switchToRegister")
        ?.addEventListener(
            "click",
            () => {

                closeModal("loginModal");

                openModal(
                    "registerModal"
                );

            }
        );


    getById("switchToLogin")
        ?.addEventListener(
            "click",
            () => {

                closeModal("registerModal");

                openModal(
                    "loginModal"
                );

            }
        );


    getById("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            () => {

                closeModal("loginModal");

                openModal(
                    "forgotModal"
                );

            }
        );


    getById("createProjectBtn")
        ?.addEventListener(
            "click",
            () => {

                if (requireAuth())
                    openModal("projectModal");

            }
        );


    getById("addServiceBtn")
        ?.addEventListener(
            "click",
            () => {

                if (requireAuth())
                    openModal("serviceModal");

            }
        );


    getById("addRealEstateBtn")
        ?.addEventListener(
            "click",
            () => {

                if (requireAuth())
                    openModal(
                        "realEstateModal"
                    );

            }
        );


    getById("userMenuBtn")
        ?.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                $("#userMenu")
                    ?.classList.toggle(
                        "open"
                    );

            }
        );


    document.addEventListener(
        "click",
        event => {

            const menu =
                getById("userMenu");

            const button =
                getById("userMenuBtn");


            if (
                menu &&
                !menu.contains(event.target) &&
                !button?.contains(event.target)
            ) {

                menu.classList.remove(
                    "open"
                );

            }

        }
    );

}


function openModal(id) {

    const modal =
        getById(id);

    if (!modal) return;


    modal.classList.add("open");

    document.body.classList.add(
        "modal-open"
    );


    setTimeout(() => {

        const input =
            modal.querySelector(
                "input:not([type='checkbox'])"
            );

        input?.focus();

    }, 250);

}


function closeModal(id) {

    const modal =
        getById(id);

    if (!modal) return;


    modal.classList.remove("open");


    if (!$(".modal.open")) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


function openSideModal(id) {

    const modal =
        getById(id);

    if (!modal) return;


    modal.classList.add("open");

}


function openChat() {

    const modal =
        getById("chatModal");

    if (!modal) return;


    modal.classList.add("open");

    loadConversations();

}


/* =========================================================
   FORMS
========================================================= */

function initForms() {

    getById("loginForm")
        ?.addEventListener(
            "submit",
            handleLogin
        );


    getById("registerForm")
        ?.addEventListener(
            "submit",
            handleRegister
        );


    getById("forgotForm")
        ?.addEventListener(
            "submit",
            handleForgotPassword
        );


    getById("projectForm")
        ?.addEventListener(
            "submit",
            handleCreateProject
        );


    getById("serviceForm")
        ?.addEventListener(
            "submit",
            handleCreateService
        );


    getById("productForm")
        ?.addEventListener(
            "submit",
            handleCreateProduct
        );


    getById("realEstateForm")
        ?.addEventListener(
            "submit",
            handleCreateRealEstate
        );


    getById("chatForm")
        ?.addEventListener(
            "submit",
            handleSendMessage
        );


    getById("logoutBtn")
        ?.addEventListener(
            "click",
            () => logout()
        );


    getById("menuProfileBtn")
        ?.addEventListener(
            "click",
            () => {

                $("#userMenu")
                    ?.classList.remove(
                        "open"
                    );

                openProfile(state.user);

            }
        );


    getById("menuMessagesBtn")
        ?.addEventListener(
            "click",
            () => {

                $("#userMenu")
                    ?.classList.remove(
                        "open"
                    );

                openChat();

            }
        );


    getById("menuNotificationsBtn")
        ?.addEventListener(
            () => {

                $("#userMenu")
                    ?.classList.remove(
                        "open"
                    );

                openSideModal(
                    "notificationsModal"
                );

            }
        );

}


/* =========================================================
   PROFILE
========================================================= */

function openProfile(user) {

    const content =
        getById("profileContent");

    if (!content) return;


    const name =
        fullName(user) ||
        user?.username ||
        "User";


    const avatar =
        user?.avatar ||
        user?.photo ||
        "";


    content.innerHTML = `

        <div class="profile-cover"></div>

        <div class="profile-main">

            <div class="profile-avatar">

                ${
                    avatar
                    ? `<img src="${escapeHTML(avatar)}" alt="">`
                    : escapeHTML(
                        getInitials(user)
                    )
                }

            </div>


            <div class="profile-info">

                <div class="verified-badge">
                    ✓
                </div>

                <h2>
                    ${escapeHTML(name)}
                </h2>

                <span>
                    ${
                        escapeHTML(
                            user?.role ||
                            user?.title ||
                            "User"
                        )
                    }
                </span>

                <p>
                    ${
                        escapeHTML(
                            user?.bio ||
                            "Профили корбар дар SMM.TJ"
                        )
                    }
                </p>

            </div>


            <div class="profile-actions">

                <button
                    class="btn btn-primary"
                    id="profileMessageBtn"
                >
                    💬 Паём
                </button>

            </div>

        </div>


        <div class="profile-details">

            <div>
                <small>Минтақа</small>
                <strong>
                    ${escapeHTML(
                        user?.city ||
                        user?.region ||
                        "Тоҷикистон"
                    )}
                </strong>
            </div>

            <div>
                <small>Рейтинг</small>
                <strong>
                    ★ ${Number(
                        user?.rating || 5
                    ).toFixed(1)}
                </strong>
            </div>

            <div>
                <small>Таҷриба</small>
                <strong>
                    ${user?.experience || 0} сол
                </strong>
            </div>

        </div>

    `;


    openModal("profileModal");


    getById("profileMessageBtn")
        ?.addEventListener(
            "click",
            () => {

                closeModal(
                    "profileModal"
                );

                openChat();

            }
        );

}


/* =========================================================
   DETAILS
========================================================= */

function openService(service) {

    openDetailModal(
        "Хизматрасонӣ",
        service.title || service.name,
        service.description,
        service.price
    );

}


function openProduct(product) {

    openDetailModal(
        "Маҳсулот",
        product.title || product.name,
        product.description,
        product.price
    );

}


function openProject(project) {

    openDetailModal(
        "Лоиҳа",
        project.title,
        project.description,
        project.budget
    );

}


function openRealEstate(item) {

    openDetailModal(
        item.type === "rent"
            ? "Иҷора"
            : "Фурӯш",
        item.title,
        item.description,
        item.price
    );

}


function openDetailModal(
    label,
    title,
    description,
    price
) {

    const content =
        getById("profileContent");

    if (!content) return;


    content.innerHTML = `

        <div class="detail-view">

            <span class="modal-label">
                ${escapeHTML(label)}
            </span>

            <h2>
                ${escapeHTML(title || "")}
            </h2>

            <p>
                ${escapeHTML(
                    description || ""
                )}
            </p>

            <div class="detail-price">
                ${formatPrice(price)}
            </div>

            <button
                class="btn btn-primary btn-full"
                onclick="closeModal('profileModal')"
            >
                Бастан
            </button>

        </div>

    `;


    openModal("profileModal");

}


function openSearchItem(item) {

    if (item._type === "specialist") {

        openProfile(item);

    } else if (item._type === "service") {

        openService(item);

    } else if (item._type === "job") {

        openDetailModal(
            "Кор",
            item.title,
            item.description,
            item.salary
        );

    } else if (item._type === "project") {

        openProject(item);

    } else {

        openDetailModal(
            "Натиҷа",
            item.title || item.name,
            item.description,
            item.price
        );

    }

}


/* =========================================================
   USER MENU
========================================================= */

function updateUserMenu() {

    if (!state.user) return;


    const name =
        fullName(state.user) ||
        state.user.username ||
        "User";


    const menuName =
        getById("menuUserName");

    const menuEmail =
        getById("menuUserEmail");

    const avatar =
        getById("menuAvatar");


    if (menuName)
        menuName.textContent = name;


    if (menuEmail)
        menuEmail.textContent =
            state.user.email ||
            state.user.phone ||
            "";


    if (avatar)
        avatar.textContent =
            getInitials(state.user);

}


/* =========================================================
   COUNTERS
========================================================= */

function initCounters() {

    const counters =
        $$("[data-counter]");


    if (!counters.length) return;


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        !entry.isIntersecting
                    )
                        return;


                    const element =
                        entry.target;


                    animateCounter(
                        element,
                        Number(
                            element.dataset.counter
                        )
                    );


                    observer.unobserve(element);

                });

            },
            {
                threshold: 0.5
            }
        );


    counters.forEach(
        counter =>
            observer.observe(counter)
    );

}


function animateCounter(
    element,
    target
) {

    const duration = 1400;

    const start =
        performance.now();


    function update(now) {

        const progress =
            Math.min(
                (now - start) / duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 - progress,
                3
            );


        element.textContent =
            Math.floor(
                target * eased
            ).toLocaleString("en-US") +
            "+";


        if (progress < 1) {

            requestAnimationFrame(update);

        }

    }


    requestAnimationFrame(update);

}


/* =========================================================
   SCROLL ANIMATIONS
========================================================= */

function initScrollAnimations() {

    const elements =
        $$(
            ".section-heading, " +
            ".category-card, " +
            ".specialist-card, " +
            ".marketplace-card, " +
            ".job-card, " +
            ".project-card, " +
            ".real-estate-card, " +
            ".review-card, " +
            ".step-card, " +
            ".region-card"
        );


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

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

                });

            },
            {
                threshold: 0.08
            }
        );


    elements.forEach(
        element =>
            observer.observe(element)
    );

}


/* =========================================================
   FAVORITE BUTTONS
========================================================= */

function initFavoriteButtons() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".favorite-btn"
                );


            if (!button) return;


            event.stopPropagation();

            button.classList.toggle(
                "active"
            );


            if (
                button.classList.contains(
                    "active"
                )
            ) {

                button.textContent = "♥";

            } else {

                button.textContent = "♡";

            }

        }
    );

}


/* =========================================================
   TOAST
========================================================= */

function toast(
    message,
    type = "success"
) {

    const container =
        getById("toastContainer");

    if (!container) return;


    const item =
        document.createElement("div");


    item.className =
        `toast toast-${type}`;


    item.innerHTML = `

        <div class="toast-icon">
            ${toastIcon(type)}
        </div>

        <div class="toast-content">
            <strong>
                ${toastTitle(type)}
            </strong>

            <span>
                ${escapeHTML(message)}
            </span>
        </div>

        <button class="toast-close">
            ×
        </button>

    `;


    container.appendChild(item);


    requestAnimationFrame(() => {

        item.classList.add("show");

    });


    item.querySelector(
        ".toast-close"
    )?.addEventListener(
        "click",
        () => removeToast(item)
    );


    setTimeout(
        () => removeToast(item),
        4500
    );

}


function removeToast(item) {

    item.classList.remove("show");

    setTimeout(
        () => item.remove(),
        400
    );

}


/* =========================================================
   SKELETON
========================================================= */

function showSkeleton(
    container,
    count = 6
) {

    container.innerHTML = "";


    for (let i = 0; i < count; i++) {

        const skeleton =
            document.createElement("div");


        skeleton.className =
            "skeleton-card";


        skeleton.innerHTML = `

            <div class="skeleton-image"></div>

            <div class="skeleton-line large"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>

        `;


        container.appendChild(skeleton);

    }

}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmpty(
    container,
    message
) {

    if (!container) return;


    container.innerHTML = `

        <div class="empty-state">

            <div>◌</div>

            <h3>
                Ҳоло маълумот нест
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}


function showEmpty(id) {

    const element =
        getById(id);

    if (element)
        element.hidden = false;

}


function hideEmpty(id) {

    const element =
        getById(id);

    if (element)
        element.hidden = true;

}


/* =========================================================
   UTILITIES
========================================================= */

function normalizeArray(data) {

    if (Array.isArray(data))
        return data;


    if (Array.isArray(data?.data))
        return data.data;


    if (Array.isArray(data?.items))
        return data.items;


    if (Array.isArray(data?.results))
        return data.results;


    return [];

}


function fullName(user) {

    if (!user) return "";


    return [
        user.firstName,
        user.lastName
    ]
        .filter(Boolean)
        .join(" ");

}


function getInitials(user) {

    if (!user)
        return "U";


    const name =
        fullName(user) ||
        user.username ||
        user.name ||
        "User";


    return name
        .split(/\s+/)
        .slice(0, 2)
        .map(word =>
            word.charAt(0)
        )
        .join("")
        .toUpperCase();

}


function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Созишӣ";

    }


    const number =
        Number(value);


    if (Number.isNaN(number))
        return `${value} TJS`;


    return (
        number.toLocaleString("en-US") +
        " TJS"
    );

}


function formatDate(value) {

    if (!value)
        return "—";


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime()))
        return "—";


    return date.toLocaleDateString(
        "tg-TJ",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


function formatTime(value) {

    if (!value)
        return "";


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime()))
        return "";


    return date.toLocaleTimeString(
        "tg-TJ",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function categoryName(category) {

    const categories = {

        smm: "SMM",
        design: "Design",
        marketing: "Marketing",
        programming: "Programming",
        video: "Video Editing",
        photography: "Photography",
        copywriting: "Copywriting",
        business: "Business",
        education: "Education",
        services: "Services",
        products: "Products"

    };


    if (
        typeof category === "object"
    ) {

        return (
            category.name ||
            category.title ||
            "Категория"
        );

    }


    return (
        categories[
            String(category)
                .toLowerCase()
        ] ||
        category ||
        "Категория"
    );

}


function propertyName(type) {

    const names = {

        apartment: "Квартира",
        house: "Хона",
        room: "Ҳуҷра",
        office: "Офис",
        commercial: "Тиҷоратӣ",
        land: "Замин"

    };


    return (
        names[type] ||
        type ||
        "Амвол"
    );

}


function statusName(status) {

    const statuses = {

        OPEN: "Кушода",
        IN_PROGRESS: "Дар кор",
        COMPLETED: "Анҷом ёфт",
        CANCELLED: "Бекоршуда"

    };


    return (
        statuses[status] ||
        status ||
        "OPEN"
    );

}


function debounce(
    callback,
    delay = 300
) {

    let timeout;


    return (...args) => {

        clearTimeout(timeout);


        timeout =
            setTimeout(
                () =>
                    callback(...args),
                delay
            );

    };

}


function setButtonLoading(
    button,
    loading
) {

    if (!button) return;


    if (loading) {

        button.dataset.originalText =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML =
            `<span class="button-loader"></span>`;

    } else {

        button.disabled = false;

        button.innerHTML =
            button.dataset.originalText ||
            "Ирсол кардан";

    }

}


function requireAuth() {

    if (state.user)
        return true;


    toast(
        "Барои ин амал аввал ворид шавед.",
        "warning"
    );


    openModal("loginModal");

    return false;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   ICON HELPERS
========================================================= */

function toastIcon(type) {

    return {

        success: "✓",
        error: "!",
        warning: "⚠",
        info: "i"

    }[type] || "i";

}


function toastTitle(type) {

    return {

        success: "Муваффақият",
        error: "Хатогӣ",
        warning: "Огоҳӣ",
        info: "Маълумот"

    }[type] || "Маълумот";

}


function notificationIcon(type) {

    return {

        proposal: "◆",
        message: "◇",
        review: "★",
        project: "◈",
        application: "▣",
        admin: "⚙"

    }[type] || "♢";

}


function searchTypeIcon(type) {

    return {

        specialist: "👤",
        service: "◆",
        job: "💼",
        project: "◈",
        product: "📦",
        realEstate: "🏠"

    }[type] || "⌕";

}


/* =========================================================
   BUTTON / CARD INTERACTION
========================================================= */

document.addEventListener(
    "mousemove",
    event => {

        const cards =
            document.elementsFromPoint(
                event.clientX,
                event.clientY
            );


        const card =
            cards.find(element =>
                element.classList?.contains(
                    "marketplace-card"
                ) ||
                element.classList?.contains(
                    "specialist-card"
                )
            );


        if (!card) return;


        const rect =
            card.getBoundingClientRect();


        const x =
            event.clientX - rect.left;


        const y =
            event.clientY - rect.top;


        const rotateX =
            ((y / rect.height) - 0.5) *
            -5;


        const rotateY =
            ((x / rect.width) - 0.5) *
            5;


        card.style.setProperty(
            "--rx",
            `${rotateX}deg`
        );


        card.style.setProperty(
            "--ry",
            `${rotateY}deg`
        );

    }
);


/* =========================================================
   HEADER SCROLL
========================================================= */

window.addEventListener(
    "scroll",
    () => {

        const header =
            getById("header");


        if (!header) return;


        if (window.scrollY > 30) {

            header.classList.add(
                "scrolled"
            );

        } else {

            header.classList.remove(
                "scrolled"
            );

        }

    },
    {
        passive: true
    }
);


/* =========================================================
   ACTIVE SECTION
========================================================= */

const sections =
    $$(
        "main section[id]"
    );


if (sections.length) {

    const sectionObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (
                        !entry.isIntersecting
                    )
                        return;


                    const id =
                        entry.target.id;


                    $$(".nav-link")
                        .forEach(link => {

                            link.classList.toggle(
                                "active",
                                link.getAttribute(
                                    "href"
                                ) === `#${id}`
                            );

                        });


                    $$(".bottom-nav-item")
                        .forEach(link => {

                            link.classList.toggle(
                                "active",
                                link.getAttribute(
                                    "href"
                                ) === `#${id}`
                            );

                        });

                });

            },
            {
                threshold: 0.35
            }
        );


    sections.forEach(section =>
        sectionObserver.observe(section)
    );

}


/* =========================================================
   GLOBAL ERROR PROTECTION
========================================================= */

window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled Promise:",
            event.reason
        );

    }
);


/* =========================================================
   END
========================================================= */
