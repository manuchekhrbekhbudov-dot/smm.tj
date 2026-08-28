"use strict";

/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://lcldaingzicxbottlznq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   ELEMENTS
========================================================= */

const searchForm =
    document.getElementById("searchForm");

const searchInput =
    document.getElementById("searchInput");

const specialistsGrid =
    document.getElementById("specialistsGrid");

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationPanel =
    document.getElementById("notificationPanel");

const mobileMenuBtn =
    document.getElementById("mobileMenuBtn");

const mainNav =
    document.getElementById("mainNav");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const orderForm =
    document.getElementById("orderForm");

const chatWidget =
    document.getElementById("chatWidget");

const floatingChat =
    document.getElementById("floatingChat");

const chatForm =
    document.getElementById("chatForm");

const chatInput =
    document.getElementById("chatInput");

const chatMessages =
    document.getElementById("chatMessages");

const accountTypeInput =
    document.getElementById("accountType");

const accountTypeButtons =
    document.querySelectorAll(".account-type");

const sortSelect =
    document.getElementById("sortSelect");


/* =========================================================
   DATA
========================================================= */

let specialists = [];

let currentUser = null;


/* =========================================================
   MODAL
========================================================= */

function openModal(modalId) {

    const modal =
        document.getElementById(modalId);

    if (!modal) return;

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}

window.openModal =
    openModal;


function closeModal(modalId) {

    const modal =
        document.getElementById(modalId);

    if (!modal) return;

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        !document.querySelector(
            ".modal.active"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}

window.closeModal =
    closeModal;


function switchModal(
    currentModal,
    nextModal
) {

    closeModal(currentModal);

    setTimeout(() => {

        openModal(nextModal);

    }, 150);

}

window.switchModal =
    switchModal;


/* =========================================================
   MODAL BACKDROP
========================================================= */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal(
                        modal.id
                    );

                }

            }
        );

    });


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        const activeModal =
            document.querySelector(
                ".modal.active"
            );

        if (activeModal) {

            closeModal(
                activeModal.id
            );

        }

        closeNotifications();

    }
);


/* =========================================================
   ACCOUNT TYPE
========================================================= */

accountTypeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                accountTypeButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                button.classList.add(
                    "active"
                );

                const type =
                    button.dataset.accountType ||
                    "smm";

                if (accountTypeInput) {

                    accountTypeInput.value =
                        type;

                }

            }
        );

    }
);


/* =========================================================
   AUTH — CURRENT USER
========================================================= */

async function loadCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getUser();

        if (error) {

            currentUser = null;

            return null;

        }

        currentUser =
            data?.user || null;

        return currentUser;

    } catch (error) {

        console.error(
            "GET USER ERROR:",
            error
        );

        currentUser = null;

        return null;

    }

}


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
    (_event, session) => {

        currentUser =
            session?.user || null;

        updateAuthUI();

    }
);


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {

    const headerActions =
        document.querySelector(
            ".header-actions"
        );

    if (!headerActions) return;


    const oldBox =
        document.getElementById(
            "userAuthBox"
        );

    if (oldBox) {
        oldBox.remove();
    }


    if (!currentUser) {
        return;
    }


    const box =
        document.createElement(
            "div"
        );

    box.id =
        "userAuthBox";

    box.style.display =
        "flex";

    box.style.alignItems =
        "center";

    box.style.gap =
        "8px";


    box.innerHTML = `

        <span
            style="
                max-width:160px;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-size:13px;
                font-weight:600;
            "
        >
            ${escapeHTML(
                currentUser.email || "User"
            )}
        </span>

        <button
            type="button"
            class="btn btn-outline"
            id="logoutButton"
        >
            Баромадан
        </button>

    `;


    const mobileButton =
        headerActions.querySelector(
            ".mobile-menu-btn"
        );


    if (mobileButton) {

        headerActions.insertBefore(
            box,
            mobileButton
        );

    } else {

        headerActions.appendChild(
            box
        );

    }


    document
        .getElementById(
            "logoutButton"
        )
        ?.addEventListener(
            "click",
            logoutUser
        );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();

        if (error) {
            throw error;
        }

        currentUser = null;

        updateAuthUI();

        showToast(
            "✅ Шумо аз аккаунт баромадед.",
            "success"
        );

    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        showToast(
            "❌ Баромадан иҷро нашуд.",
            "error"
        );

    }

}

window.logoutUser =
    logoutUser;


/* =========================================================
   REGISTER
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const submitButton =
                registerForm.querySelector(
                    "button[type='submit']"
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "Создани аккаунт";


            const formData =
                new FormData(
                    registerForm
                );


            const name =
                String(
                    formData.get("name") || ""
                ).trim();


            const email =
                String(
                    formData.get("email") || ""
                ).trim();


            const password =
                String(
                    formData.get("password") || ""
                );


            const accountType =
                String(
                    formData.get(
                        "accountType"
                    ) || "smm"
                );


            if (!name) {

                showToast(
                    "Номро ворид кунед.",
                    "error"
                );

                return;

            }


            if (!email) {

                showToast(
                    "Email-ро ворид кунед.",
                    "error"
                );

                return;

            }


            if (password.length < 8) {

                showToast(
                    "Парол бояд ҳадди ақал 8 аломат бошад.",
                    "error"
                );

                return;

            }


            setButtonLoading(
                submitButton,
                "Сабт шуда истодааст..."
            );


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({

                        email:
                            email,

                        password:
                            password,

                        options: {

                            data: {

                                name:
                                    name,

                                account_type:
                                    accountType

                            }

                        }

                    });


                if (error) {
                    throw error;
                }


                registerForm.reset();

                closeModal(
                    "registerModal"
                );


                if (data?.session) {

                    showToast(
                        "✅ Аккаунт сохта шуд!",
                        "success"
                    );

                } else {

                    showToast(
                        "✅ Аккаунт сохта шуд. Email-ро тасдиқ кунед.",
                        "success"
                    );

                }


                await loadCurrentUser();

                updateAuthUI();


            } catch (error) {

                console.error(
                    "REGISTER ERROR:",
                    error
                );


                showToast(
                    "❌ " +
                    (
                        error?.message ||
                        "Регистрация иҷро нашуд."
                    ),
                    "error"
                );


            } finally {

                setButtonLoading(
                    submitButton,
                    originalText
                );

            }

        }
    );

}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const submitButton =
                loginForm.querySelector(
                    "button[type='submit']"
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "Даромадан";


            const formData =
                new FormData(
                    loginForm
                );


            const email =
                String(
                    formData.get("email") || ""
                ).trim();


            const password =
                String(
                    formData.get("password") || ""
                );


            if (!email || !password) {

                showToast(
                    "Email ва паролро пур кунед.",
                    "error"
                );

                return;

            }


            setButtonLoading(
                submitButton,
                "Даромада истодааст..."
            );


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (error) {
                    throw error;
                }


                currentUser =
                    data?.user || null;


                loginForm.reset();

                closeModal(
                    "loginModal"
                );

                updateAuthUI();


                showToast(
                    "✅ Хуш омадед!",
                    "success"
                );


            } catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                showToast(
                    "❌ " +
                    (
                        error?.message ||
                        "Email ё парол нодуруст аст."
                    ),
                    "error"
                );


            } finally {

                setButtonLoading(
                    submitButton,
                    originalText
                );

            }

        }
    );

}


/* =========================================================
   LOAD SPECIALISTS
========================================================= */

async function loadSpecialists() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("specialists")
                .select("*")
                .order(
                    "rating",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        specialists =
            Array.isArray(data)
                ? data
                : [];


        renderSpecialists(
            specialists
        );


    } catch (error) {

        console.error(
            "SPECIALISTS ERROR:",
            error
        );

        specialists = [];

        renderSpecialists([]);

    }

}


/* =========================================================
   SEARCH
========================================================= */

if (searchForm) {

    searchForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            searchSpecialists();

        }
    );

}


function searchSpecialists() {

    const query =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    if (!query) {

        renderSpecialists(
            specialists
        );

        scrollToSpecialists();

        return;

    }


    const filtered =
        specialists.filter(
            specialist => {

                const name =
                    String(
                        specialist.name || ""
                    ).toLowerCase();


                const city =
                    String(
                        specialist.city || ""
                    ).toLowerCase();


                const category =
                    String(
                        specialist.category || ""
                    ).toLowerCase();


                const service =
                    String(
                        specialist.service || ""
                    ).toLowerCase();


                return (
                    name.includes(query) ||
                    city.includes(query) ||
                    category.includes(query) ||
                    service.includes(query)
                );

            }
        );


    renderSpecialists(
        filtered
    );


    scrollToSpecialists();

}


/* =========================================================
   FILTER CATEGORY
========================================================= */

function filterCategory(
    category
) {

    if (!category) return;


    const value =
        String(category)
            .trim()
            .toLowerCase();


    const filtered =
        specialists.filter(
            specialist => {

                return (
                    String(
                        specialist.category ||
                        specialist.service ||
                        ""
                    )
                    .toLowerCase() ===
                    value
                );

            }
        );


    if (searchInput) {

        searchInput.value =
            category;

    }


    renderSpecialists(
        filtered
    );


    scrollToSpecialists();

}

window.filterCategory =
    filterCategory;


/* =========================================================
   SORT
========================================================= */

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        sortSpecialists
    );

}


function sortSpecialists() {

    const type =
        sortSelect
            ? sortSelect.value
            : "rating";


    const sorted =
        [...specialists];


    if (type === "rating") {

        sorted.sort(
            (a, b) =>
                Number(
                    b.rating || 0
                ) -
                Number(
                    a.rating || 0
                )
        );

    }


    if (type === "reviews") {

        sorted.sort(
            (a, b) =>
                Number(
                    b.reviews || 0
                ) -
                Number(
                    a.reviews || 0
                )
        );

    }


    if (type === "experience") {

        sorted.sort(
            (a, b) =>
                Number(
                    b.experience || 0
                ) -
                Number(
                    a.experience || 0
                )
        );

    }


    renderSpecialists(
        sorted
    );

}


/* =========================================================
   RENDER SPECIALISTS
========================================================= */

function renderSpecialists(
    data
) {

    if (!specialistsGrid) {
        return;
    }


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        specialistsGrid.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    👤
                </div>

                <h3>
                    Ҳоло мутахассисон нестанд
                </h3>

                <p>
                    Мутахассисони аввалини
                    SMM.TJ метавонанд профили худро созанд.
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="openModal('registerModal')"
                >
                    Профили худро созед
                </button>

            </div>

        `;

        return;

    }


    specialistsGrid.innerHTML =
        data
            .map(
                createSpecialistCard
            )
            .join("");

}


/* =========================================================
   SPECIALIST CARD
========================================================= */

function createSpecialistCard(
    specialist
) {

    const name =
        escapeHTML(
            specialist.name ||
            "Мутахассис"
        );


    const city =
        escapeHTML(
            specialist.city ||
            "Тоҷикистон"
        );


    const category =
        escapeHTML(
            specialist.category ||
            specialist.service ||
            "SMM"
        );


    const experience =
        Number(
            specialist.experience || 0
        );


    const rating =
        Number(
            specialist.rating || 0
        );


    const reviews =
        Number(
            specialist.reviews || 0
        );


    const price =
        escapeHTML(
            specialist.price ||
            "Нарх мувофиқа мешавад"
        );


    const initial =
        escapeHTML(
            String(
                specialist.name ||
                "М"
            )
            .charAt(0)
            .toUpperCase()
        );


    return `

        <article class="specialist-card">

            <div class="specialist-top">

                <div class="specialist-avatar">
                    ${initial}
                </div>

                <div class="specialist-info">

                    <h3>
                        ${name}
                    </h3>

                    <div class="specialist-location">
                        📍 ${city}
                    </div>

                </div>

            </div>


            <div class="rating-row">

                <span class="stars">
                    ${createStars(rating)}
                </span>

                <strong>
                    ${
                        rating > 0
                            ? rating.toFixed(1)
                            : "—"
                    }
                </strong>

                <span>
                    (${reviews} отзыв)
                </span>

            </div>


            <div class="service-tags">

                <span class="service-tag">
                    ${category}
                </span>

            </div>


            <p class="specialist-experience">

                Таҷриба:

                <strong>
                    ${experience} сол
                </strong>

            </p>


            <div class="specialist-bottom">

                <div class="price">

                    ${price}

                    <small>
                        / моҳ
                    </small>

                </div>

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="openSpecialistProfile('${escapeAttribute(
                        specialist.id || ""
                    )}')"
                >
                    Профил
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   STARS
========================================================= */

function createStars(
    rating
) {

    const value =
        Number(rating);


    if (
        !value ||
        value <= 0
    ) {

        return "☆☆☆☆☆";

    }


    const rounded =
        Math.round(value);


    return (
        "★".repeat(
            Math.min(
                5,
                Math.max(
                    0,
                    rounded
                )
            )
        ) +
        "☆".repeat(
            Math.max(
                0,
                5 - rounded
            )
        )
    );

}


/* =========================================================
   SPECIALIST PROFILE
========================================================= */

function openSpecialistProfile(
    id
) {

    const specialist =
        specialists.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!specialist) {

        showToast(
            "Мутахассис пайдо нашуд.",
            "error"
        );

        return;

    }


    const old =
        document.getElementById(
            "specialistProfileModal"
        );


    if (old) {
        old.remove();
    }


    const name =
        escapeHTML(
            specialist.name ||
            "Мутахассис"
        );


    const city =
        escapeHTML(
            specialist.city ||
            "Тоҷикистон"
        );


    const category =
        escapeHTML(
            specialist.category ||
            specialist.service ||
            "SMM"
        );


    const rating =
        Number(
            specialist.rating || 0
        );


    const experience =
        Number(
            specialist.experience || 0
        );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "specialistProfileModal";

    modal.className =
        "modal active";


    modal.innerHTML = `

        <div class="modal-box">

            <button
                type="button"
                class="modal-close"
                id="specialistClose"
            >
                ×
            </button>

            <div class="specialist-avatar">
                ${escapeHTML(
                    name.charAt(0)
                )}
            </div>

            <h2>
                ${name}
            </h2>

            <p>
                📍 ${city}
            </p>

            <p>
                💼 ${category}
            </p>

            <p>
                ⭐ ${
                    rating > 0
                        ? rating.toFixed(1)
                        : "—"
                }
            </p>

            <p>
                📈 Таҷриба:
                ${experience} сол
            </p>

            <button
                type="button"
                class="btn btn-primary full-width"
                id="specialistOrder"
            >
                Заказ додан
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    document
        .getElementById(
            "specialistClose"
        )
        ?.addEventListener(
            "click",
            () => modal.remove()
        );


    document
        .getElementById(
            "specialistOrder"
        )
        ?.addEventListener(
            "click",
            () => {

                modal.remove();

                openModal(
                    "orderModal"
                );

            }
        );

}


window.openSpecialistProfile =
    openSpecialistProfile;


/* =========================================================
   ORDER — SUPABASE
========================================================= */

if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!currentUser) {

                closeModal(
                    "orderModal"
                );

                openModal(
                    "loginModal"
                );

                showToast(
                    "Аввал ба аккаунт дароед.",
                    "info"
                );

                return;

            }


            const submitButton =
                orderForm.querySelector(
                    "button[type='submit']"
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "Заказро сохтан";


            const formData =
                new FormData(
                    orderForm
                );


            const payload = {

                client_id:
                    currentUser.id,

                business_category:
                    formData.get(
                        "businessCategory"
                    ),

                service:
                    formData.get(
                        "service"
                    ),

                budget:
                    formData.get(
                        "budget"
                    ) || null,

                deadline:
                    formData.get(
                        "deadline"
                    ) || null,

                instagram:
                    formData.get(
                        "instagram"
                    ) || null,

                website:
                    formData.get(
                        "website"
                    ) || null,

                description:
                    formData.get(
                        "description"
                    )

            };


            setButtonLoading(
                submitButton,
                "Сабт шуда истодааст..."
            );


            try {

                const {
                    error
                } =
                    await supabaseClient
                        .from("orders")
                        .insert(
                            payload
                        );


                if (error) {
                    throw error;
                }


                orderForm.reset();

                closeModal(
                    "orderModal"
                );


                showToast(
                    "✅ Заказ бомуваффақият сабт шуд!",
                    "success"
                );


            } catch (error) {

                console.error(
                    "ORDER ERROR:",
                    error
                );


                showToast(
                    "❌ Заказ сабт нашуд: " +
                    (
                        error?.message ||
                        "хатои database"
                    ),
                    "error"
                );


            } finally {

                setButtonLoading(
                    submitButton,
                    originalText
                );

            }

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleNotifications();

        }
    );

}


function toggleNotifications() {

    if (!notificationPanel) {
        return;
    }


    notificationPanel.classList.toggle(
        "active"
    );


    const isOpen =
        notificationPanel.classList.contains(
            "active"
        );


    notificationPanel.setAttribute(
        "aria-hidden",
        String(!isOpen)
    );

}

window.toggleNotifications =
    toggleNotifications;


function closeNotifications() {

    if (!notificationPanel) {
        return;
    }


    notificationPanel.classList.remove(
        "active"
    );


    notificationPanel.setAttribute(
        "aria-hidden",
        "true"
    );

}

window.closeNotifications =
    closeNotifications;


/* =========================================================
   CHAT
========================================================= */

function toggleChat() {

    if (!chatWidget) {
        return;
    }


    const isOpen =
        chatWidget.classList.toggle(
            "active"
        );


    chatWidget.setAttribute(
        "aria-hidden",
        String(!isOpen)
    );


    if (floatingChat) {

        floatingChat.style.display =
            isOpen
                ? "none"
                : "grid";

    }


    if (
        isOpen &&
        chatInput
    ) {

        setTimeout(
            () => chatInput.focus(),
            100
        );

    }

}

window.toggleChat =
    toggleChat;


if (chatForm) {

    chatForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            sendMessage();

        }
    );

}


function sendMessage() {

    if (
        !chatInput ||
        !chatMessages
    ) {
        return;
    }


    const text =
        chatInput.value.trim();


    if (!text) {
        return;
    }


    const empty =
        chatMessages.querySelector(
            ".chat-empty"
        );


    if (empty) {
        empty.remove();
    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "message sent";


    message.textContent =
        text;


    const time =
        document.createElement(
            "small"
        );


    time.textContent =
        "ҳозир";


    message.appendChild(
        time
    );


    chatMessages.appendChild(
        message
    );


    chatInput.value =
        "";


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================================================
   MOBILE MENU
========================================================= */

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener(
        "click",
        () => {

            if (!mainNav) {
                return;
            }


            const isOpen =
                mainNav.classList.toggle(
                    "mobile-open"
                );


            mobileMenuBtn.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

}


if (mainNav) {

    mainNav
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    mainNav.classList.remove(
                        "mobile-open"
                    );

                    if (mobileMenuBtn) {

                        mobileMenuBtn.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }

                }
            );

        });

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "info"
) {

    let container =
        document.getElementById(
            "toastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "toastContainer";


        container.style.position =
            "fixed";

        container.style.right =
            "20px";

        container.style.bottom =
            "20px";

        container.style.zIndex =
            "99999";

        container.style.display =
            "flex";

        container.style.flexDirection =
            "column";

        container.style.gap =
            "10px";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.textContent =
        message;


    toast.style.padding =
        "14px 18px";

    toast.style.borderRadius =
        "14px";

    toast.style.background =
        "#4f46e5";

    toast.style.color =
        "#fff";

    toast.style.fontSize =
        "14px";

    toast.style.fontWeight =
        "600";

    toast.style.maxWidth =
        "360px";

    toast.style.boxShadow =
        "0 15px 40px rgba(0,0,0,.2)";


    if (type === "success") {

        toast.style.background =
            "#16a34a";

    }


    if (type === "error") {

        toast.style.background =
            "#dc2626";

    }


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        4000
    );

}

window.showToast =
    showToast;


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    text
) {

    if (!button) {
        return;
    }


    button.textContent =
        text;


    button.disabled =
        text.includes(
            "истодааст"
        );


    button.style.opacity =
        button.disabled
            ? "0.7"
            : "1";

}


/* =========================================================
   SCROLL
========================================================= */

function scrollToSpecialists() {

    const section =
        document.getElementById(
            "specialists"
        );


    if (!section) {
        return;
    }


    section.scrollIntoView({
        behavior:
            "smooth",

        block:
            "start"
    });

}


/* =========================================================
   HELPERS
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "SMM.TJ started"
        );


        await loadCurrentUser();


        updateAuthUI();


        await loadSpecialists();


        if (notificationPanel) {

            notificationPanel.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        if (chatWidget) {

            chatWidget.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }
);
