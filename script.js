"use strict";

/* =========================================================
   ELEMENTS
========================================================= */

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const specialistsGrid = document.getElementById("specialistsGrid");

const notificationBtn = document.getElementById("notificationBtn");
const notificationPanel = document.getElementById("notificationPanel");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.getElementById("mainNav");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const orderForm = document.getElementById("orderForm");

const chatWidget = document.getElementById("chatWidget");
const floatingChat = document.getElementById("floatingChat");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

const accountTypeInput = document.getElementById("accountType");
const accountTypeButtons = document.querySelectorAll(".account-type");

const sortSelect = document.getElementById("sortSelect");


/* =========================================================
   REAL DATA
========================================================= */

/*
    Ҳоло платформа нав аст.
    Барои ҳамин маълумоти сохта вуҷуд надорад.

    Баъдтар ҳамин массив аз Backend/API гирифта мешавад:

    GET /api/specialists

    Масалан:

    const specialists = await fetch("/api/specialists")
        .then(response => response.json());
*/

let specialists = [];


/* =========================================================
   MODAL
========================================================= */

function openModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) {
        return;
    }

    modal.classList.add("active");

    document.body.classList.add("modal-open");

    modal.setAttribute("aria-hidden", "false");

    const firstInput = modal.querySelector(
        "input:not([type='hidden']), textarea, select, button"
    );

    if (firstInput) {
        setTimeout(() => {
            firstInput.focus();
        }, 100);
    }
}


function closeModal(modalId) {

    const modal = document.getElementById(modalId);

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    modal.setAttribute("aria-hidden", "true");

    const activeModal = document.querySelector(".modal.active");

    if (!activeModal) {
        document.body.classList.remove("modal-open");
    }
}


function switchModal(currentModal, nextModal) {

    closeModal(currentModal);

    setTimeout(() => {
        openModal(nextModal);
    }, 100);
}


/* =========================================================
   CLOSE MODAL BY BACKDROP
========================================================= */

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeModal(modal.id);
        }

    });

});


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener("keydown", event => {

    if (event.key !== "Escape") {
        return;
    }

    const activeModal = document.querySelector(".modal.active");

    if (activeModal) {
        closeModal(activeModal.id);
    }

    closeNotifications();

});


/* =========================================================
   SEARCH
========================================================= */

if (searchForm) {

    searchForm.addEventListener("submit", event => {

        event.preventDefault();

        searchSpecialists();

    });

}


function searchSpecialists() {

    const query = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    if (!query) {

        renderSpecialists([]);

        scrollToSpecialists();

        return;
    }


    const filtered = specialists.filter(specialist => {

        const name =
            String(specialist.name || "").toLowerCase();

        const city =
            String(specialist.city || "").toLowerCase();

        const category =
            String(specialist.category || "").toLowerCase();

        const services =
            Array.isArray(specialist.services)
                ? specialist.services.join(" ").toLowerCase()
                : "";

        return (
            name.includes(query) ||
            city.includes(query) ||
            category.includes(query) ||
            services.includes(query)
        );

    });


    renderSpecialists(filtered);

    scrollToSpecialists();

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function filterCategory(category) {

    if (!category) {
        return;
    }


    const filtered = specialists.filter(specialist => {

        return String(specialist.category || "")
            .toLowerCase() === category.toLowerCase();

    });


    if (searchInput) {
        searchInput.value = category;
    }


    renderSpecialists(filtered);

    scrollToSpecialists();

}


/* =========================================================
   SORT
========================================================= */

if (sortSelect) {

    sortSelect.addEventListener("change", () => {

        sortSpecialists();

    });

}


function sortSpecialists() {

    const type = sortSelect
        ? sortSelect.value
        : "rating";


    const sorted = [...specialists];


    if (type === "rating") {

        sorted.sort((a, b) => {

            return Number(b.rating || 0) -
                Number(a.rating || 0);

        });

    }


    if (type === "reviews") {

        sorted.sort((a, b) => {

            return Number(b.reviews || 0) -
                Number(a.reviews || 0);

        });

    }


    if (type === "experience") {

        sorted.sort((a, b) => {

            return Number(b.experience || 0) -
                Number(a.experience || 0);

        });

    }


    renderSpecialists(sorted);

}


/* =========================================================
   RENDER SPECIALISTS
========================================================= */

function renderSpecialists(data) {

    if (!specialistsGrid) {
        return;
    }


    /*
        Дар версияи ҳозира data аз backend намеояд.
        Аз ин рӯ ҳеҷ profile-и сохта нишон дода намешавад.
    */

    if (!Array.isArray(data) || data.length === 0) {

        specialistsGrid.innerHTML = `
            <div class="empty-state">

                <div class="empty-state-icon">
                    👤
                </div>

                <h3>
                    Ҳоло мутахассисон нестанд
                </h3>

                <p>
                    SMM.TJ нав оғоз шудааст.
                    Шумо метавонед аввалин мутахассис бошед.
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


    specialistsGrid.innerHTML = data.map(specialist => {

        return createSpecialistCard(specialist);

    }).join("");

}


/* =========================================================
   SPECIALIST CARD
========================================================= */

function createSpecialistCard(specialist) {

    const name = escapeHTML(
        specialist.name || "Мутахассис"
    );

    const city = escapeHTML(
        specialist.city || "—"
    );

    const category = escapeHTML(
        specialist.category || "SMM"
    );

    const experience = Number(
        specialist.experience || 0
    );

    const rating = Number(
        specialist.rating || 0
    );

    const reviews = Number(
        specialist.reviews || 0
    );

    const price = escapeHTML(
        specialist.price || "—"
    );

    const initial = escapeHTML(
        String(specialist.name || "М").charAt(0).toUpperCase()
    );


    const verified = specialist.verified
        ? `
            <span class="verified">
                ✓ Verified
            </span>
        `
        : "";


    const services = Array.isArray(specialist.services)
        ? specialist.services
        : [];


    const serviceHTML = services
        .slice(0, 4)
        .map(service => {

            return `
                <span class="service-tag">
                    ${escapeHTML(service)}
                </span>
            `;

        })
        .join("");


    return `
        <article class="specialist-card">

            <div class="specialist-top">

                <div class="specialist-avatar">
                    ${initial}
                </div>

                <div class="specialist-info">

                    <h3>
                        ${name}
                        ${verified}
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
                    ${rating > 0 ? rating.toFixed(1) : "—"}
                </strong>

                <span>
                    (${reviews} отзыв)
                </span>

            </div>


            <div class="service-tags">

                <span class="service-tag">
                    ${category}
                </span>

                ${serviceHTML}

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

function createStars(rating) {

    const numericRating = Number(rating);

    if (!numericRating || numericRating <= 0) {
        return "☆☆☆☆☆";
    }


    const rounded = Math.round(numericRating);

    return "★".repeat(
        Math.min(5, Math.max(0, rounded))
    ) + "☆".repeat(
        Math.max(0, 5 - rounded)
    );

}


/* =========================================================
   SPECIALIST PROFILE
========================================================= */

function openSpecialistProfile(id) {

    if (!id) {
        return;
    }


    const specialist = specialists.find(
        item => String(item.id) === String(id)
    );


    if (!specialist) {
        return;
    }


    /*
        Баъдтар ин ҷо:

        window.location.href =
            `/specialist/${specialist.id}`;

        мешавад.

        Ҳоло profile-и алоҳида ҳанӯз сохта нашудааст.
    */

    console.log(
        "Specialist profile:",
        specialist
    );

}


/* =========================================================
   REGISTER ACCOUNT TYPE
========================================================= */

accountTypeButtons.forEach(button => {

    button.addEventListener("click", () => {

        accountTypeButtons.forEach(item => {

            item.classList.remove("active");

        });


        button.classList.add("active");


        const selectedType =
            button.dataset.accountType || "smm";


        if (accountTypeInput) {

            accountTypeInput.value =
                selectedType;

        }

    });

});


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();


        const submitButton =
            loginForm.querySelector(
                "button[type='submit']"
            );


        const originalText =
            submitButton
                ? submitButton.textContent
                : "";


        setButtonLoading(
            submitButton,
            "Даромада истодааст..."
        );


        /*
            Дар production:

            const response = await fetch(
                "/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(...)
                }
            );
        */


        await wait(600);


        setButtonLoading(
            submitButton,
            originalText
        );


        closeModal("loginModal");


        showToast(
            "Backend ҳоло пайваст нашудааст.",
            "info"
        );

    });

}


/* =========================================================
   REGISTER
========================================================= */

if (registerForm) {

    registerForm.addEventListener("submit", async event => {

        event.preventDefault();


        const submitButton =
            registerForm.querySelector(
                "button[type='submit']"
            );


        const originalText =
            submitButton
                ? submitButton.textContent
                : "";


        const formData =
            new FormData(registerForm);


        const accountType =
            formData.get("accountType");


        if (
            accountType !== "smm" &&
            accountType !== "business"
        ) {

            showToast(
                "Навъи аккаунтро интихоб кунед.",
                "error"
            );

            return;
        }


        setButtonLoading(
            submitButton,
            "Сохта истодааст..."
        );


        /*
            Production API:

            POST /api/auth/register
        */


        await wait(700);


        setButtonLoading(
            submitButton,
            originalText
        );


        closeModal("registerModal");


        showToast(
            "Регистрация баъд аз пайваст шудани backend фаъол мешавад.",
            "info"
        );

    });

}


/* =========================================================
   ORDER
========================================================= */

if (orderForm) {

    orderForm.addEventListener("submit", async event => {

        event.preventDefault();


        const submitButton =
            orderForm.querySelector(
                "button[type='submit']"
            );


        const originalText =
            submitButton
                ? submitButton.textContent
                : "";


        setButtonLoading(
            submitButton,
            "Ирсол шуда истодааст..."
        );


        /*
            Production:

            POST /api/orders

            Бо:
            - businessCategory
            - service
            - budget
            - deadline
            - instagram
            - website
            - description
        */


        await wait(700);


        setButtonLoading(
            submitButton,
            originalText
        );


        closeModal("orderModal");


        showToast(
            "Заказ баъд аз пайваст шудани backend сохта мешавад.",
            "info"
        );

    });

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

if (notificationBtn) {

    notificationBtn.addEventListener("click", event => {

        event.stopPropagation();

        toggleNotifications();

    });

}


function toggleNotifications() {

    if (!notificationPanel) {
        return;
    }


    notificationPanel.classList.toggle("active");


    const isOpen =
        notificationPanel.classList.contains("active");


    notificationPanel.setAttribute(
        "aria-hidden",
        String(!isOpen)
    );

}


function closeNotifications() {

    if (!notificationPanel) {
        return;
    }


    notificationPanel.classList.remove("active");

    notificationPanel.setAttribute(
        "aria-hidden",
        "true"
    );

}


document.addEventListener("click", event => {

    if (!notificationPanel) {
        return;
    }


    if (
        !notificationPanel.contains(event.target) &&
        !notificationBtn?.contains(event.target)
    ) {

        closeNotifications();

    }

});


/* =========================================================
   CHAT
========================================================= */

function toggleChat() {

    if (!chatWidget) {
        return;
    }


    chatWidget.classList.toggle("active");


    const isOpen =
        chatWidget.classList.contains("active");


    chatWidget.setAttribute(
        "aria-hidden",
        String(!isOpen)
    );


    if (floatingChat) {

        floatingChat.style.display =
            isOpen ? "none" : "grid";

    }


    if (isOpen && chatInput) {

        setTimeout(() => {
            chatInput.focus();
        }, 100);

    }

}


/* =========================================================
   CHAT SEND
========================================================= */

if (chatForm) {

    chatForm.addEventListener("submit", event => {

        event.preventDefault();

        sendMessage();

    });

}


function sendMessage() {

    if (!chatInput || !chatMessages) {
        return;
    }


    const text =
        chatInput.value.trim();


    if (!text) {
        return;
    }


    const emptyMessage =
        chatMessages.querySelector(
            ".chat-empty"
        );


    if (emptyMessage) {
        emptyMessage.remove();
    }


    const message =
        document.createElement("div");


    message.className =
        "message sent";


    const textNode =
        document.createTextNode(text);


    const time =
        document.createElement("small");


    time.textContent =
        "ҳозир";


    message.appendChild(textNode);

    message.appendChild(time);


    chatMessages.appendChild(message);


    chatInput.value = "";


    chatMessages.scrollTop =
        chatMessages.scrollHeight;


    /*
        Production:

        POST /api/messages

        WebSocket / Socket.IO
        барои real-time chat.
    */

}


/* =========================================================
   MOBILE MENU
========================================================= */

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener("click", () => {

        const isOpen =
            mainNav?.classList.toggle("mobile-open");


        mobileMenuBtn.setAttribute(
            "aria-expanded",
            String(Boolean(isOpen))
        );

    });

}


if (mainNav) {

    mainNav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            mainNav.classList.remove(
                "mobile-open"
            );


            if (mobileMenuBtn) {

                mobileMenuBtn.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });

    });

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "info") {

    let container =
        document.getElementById("toastContainer");


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";


        container.style.position =
            "fixed";

        container.style.right =
            "20px";

        container.style.bottom =
            "20px";

        container.style.zIndex =
            "5000";

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
        document.createElement("div");


    toast.textContent =
        message;


    toast.style.padding =
        "13px 16px";

    toast.style.borderRadius =
        "12px";

    toast.style.background =
        "#111827";

    toast.style.color =
        "#ffffff";

    toast.style.fontSize =
        "13px";

    toast.style.fontWeight =
        "600";

    toast.style.maxWidth =
        "340px";

    toast.style.boxShadow =
        "0 15px 40px rgba(0,0,0,.15)";


    if (type === "error") {

        toast.style.background =
            "#dc2626";

    }


    if (type === "success") {

        toast.style.background =
            "#16a34a";

    }


    container.appendChild(toast);


    setTimeout(() => {

        toast.remove();

    }, 3500);

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(button, text) {

    if (!button) {
        return;
    }


    button.textContent =
        text;


    button.disabled =
        text.includes("...");


    button.style.opacity =
        button.disabled ? "0.7" : "1";

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
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   HELPERS
========================================================= */

function wait(milliseconds) {

    return new Promise(resolve => {

        setTimeout(
            resolve,
            milliseconds
        );

    });

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /*
        Дар launch-и аввал:
        маълумоти сохта нишон намедиҳем.
    */

    renderSpecialists([]);


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


    document.querySelectorAll(".account-type")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const type =
                        button.dataset.accountType;

                    if (accountTypeInput && type) {

                        accountTypeInput.value =
                            type;

                    }

                }
            );

        });

});
