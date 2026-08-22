"use strict";

/* =====================================================
   SMM.TJ — MAIN JAVASCRIPT
===================================================== */

const DB_KEY = "smm_tj_database_v1";

let database = JSON.parse(
    localStorage.getItem(DB_KEY) ||
    JSON.stringify({
        smm: [],
        clients: [],
        requests: [],
        reviews: []
    })
);


/* =====================================================
   HELPERS
===================================================== */

function saveDatabase() {
    localStorage.setItem(
        DB_KEY,
        JSON.stringify(database)
    );
}

function createId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2)
    );
}

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return [...document.querySelectorAll(selector)];
}

function openModal(selector) {
    const modal = $(selector);

    if (modal) {
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }
}

function closeModal(selector) {
    const modal = $(selector);

    if (modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function escapeHTML(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showToast(message) {

    const old = document.querySelector(".smm-toast");

    if (old) old.remove();

    const toast = document.createElement("div");

    toast.className = "smm-toast";

    toast.textContent = message;

    toast.style.cssText = `
        position:fixed;
        left:50%;
        bottom:25px;
        transform:translateX(-50%);
        z-index:99999;
        max-width:90%;
        padding:15px 22px;
        border-radius:14px;
        background:#18121f;
        color:#fff;
        border:1px solid #934cff;
        box-shadow:0 20px 70px rgba(0,0,0,.55);
        text-align:center;
        font-size:14px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}


/* =====================================================
   MOBILE MENU
===================================================== */

const mobileMenuBtn = $("#mobileMenuBtn");
const mainNav = $("#mainNav");

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener("click", () => {

        mainNav.classList.toggle("mobile");

    });

}

$all("#mainNav a").forEach(link => {

    link.addEventListener("click", () => {

        mainNav.classList.remove("mobile");

    });

});


/* =====================================================
   AUTH MODAL
===================================================== */

function openAuth() {

    openModal("#authModal");

    $("#authRoleSelection").style.display = "block";

    $("#smmForm").classList.remove("active");

    $("#clientForm").classList.remove("active");

}

$("#loginBtn")?.addEventListener("click", openAuth);

$("#registerBtn")?.addEventListener("click", openAuth);

$("#authClose")?.addEventListener(
    "click",
    () => closeModal("#authModal")
);


/* =====================================================
   HERO ROLE BUTTONS
===================================================== */

function openSmmForm() {

    openModal("#authModal");

    $("#authRoleSelection").style.display = "none";

    $("#clientForm").classList.remove("active");

    $("#smmForm").classList.add("active");

}

function openClientForm() {

    openModal("#authModal");

    $("#authRoleSelection").style.display = "none";

    $("#smmForm").classList.remove("active");

    $("#clientForm").classList.add("active");

}

$("#heroSmmBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("#heroClientBtn")?.addEventListener(
    "click",
    openClientForm
);

$("#smmRoleBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("#clientRoleBtn")?.addEventListener(
    "click",
    openClientForm
);

$("#backToRolesFromSmm")?.addEventListener(
    "click",
    () => {

        $("#smmForm").classList.remove("active");

        $("#authRoleSelection").style.display = "block";

    }
);

$("#backToRolesFromClient")?.addEventListener(
    "click",
    () => {

        $("#clientForm").classList.remove("active");

        $("#authRoleSelection").style.display = "block";

    }
);


/* =====================================================
   SMM REGISTRATION
===================================================== */

$("#smmForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const profile = {

            id: createId(),

            name:
                $("#smmName").value.trim(),

            instagram:
                $("#smmInstagram").value.trim(),

            phone:
                $("#smmPhone").value.trim(),

            category:
                $("#smmCategory").value,

            service:
                $("#smmService").value.trim(),

            experience:
                $("#smmExperience").value.trim(),

            price:
                $("#smmPrice").value.trim(),

            status:
                "pending",

            createdAt:
                new Date().toISOString()

        };

        database.smm.push(profile);

        saveDatabase();

        this.reset();

        closeModal("#authModal");

        showToast(
            "✅ Профил қабул шуд. Админ онро месанҷад."
        );

        renderAll();

    }
);


/* =====================================================
   CLIENT REGISTRATION
===================================================== */

$("#clientForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const client = {

            id: createId(),

            name:
                $("#clientName").value.trim(),

            phone:
                $("#clientPhone").value.trim(),

            business:
                $("#clientBusiness").value.trim(),

            category:
                $("#clientCategory").value,

            need:
                $("#clientNeed").value.trim(),

            createdAt:
                new Date().toISOString()

        };

        database.clients.push(client);

        saveDatabase();

        this.reset();

        closeModal("#authModal");

        showToast(
            "✅ Дархости шумо қабул шуд."
        );

        renderAll();

    }
);


/* =====================================================
   FIND SPECIALIST
===================================================== */

$("#findSpecialistBtn")?.addEventListener(
    "click",
    () => {

        document
            .querySelector("#specialists")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


/* =====================================================
   REGISTER FROM EMPTY
===================================================== */

$("#registerSmmFromEmpty")?.addEventListener(
    "click",
    openSmmForm
);


/* =====================================================
   CTA REGISTER
===================================================== */

$("#ctaRegisterBtn")?.addEventListener(
    "click",
    openAuth
);


/* =====================================================
   CATEGORY BUTTONS
===================================================== */

$all("[data-category]").forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const category =
                button.dataset.category;

            renderSpecialists(category);

            document
                .querySelector("#specialists")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        }
    );

});


/* =====================================================
   SPECIALISTS
===================================================== */

function renderSpecialists(category = "") {

    const container =
        $("#specialistsList");

    if (!container) return;

    let specialists =
        database.smm.filter(
            profile =>
                profile.status === "approved"
        );

    if (category) {

        specialists =
            specialists.filter(
                profile =>
                    profile.category === category
            );

    }

    if (!specialists.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    👨‍💻
                </div>

                <h3>
                    Ҳоло SMM-щик нест
                </h3>

                <p>
                    ${
                        category
                        ? "Барои ин категория ҳоло мутахассиси тасдиқшуда нест."
                        : "Ҳоло ягон мутахассиси тасдиқшуда вуҷуд надорад."
                    }
                </p>

                <button
                    class="btn btn--primary"
                    onclick="openSmmForm()"
                >
                    Ман SMM-щик ҳастам
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML =
        specialists.map(
            profile => `

            <article class="specialist-card">

                <div class="avatar">
                    👨‍💻
                </div>

                <h3>
                    ${escapeHTML(profile.name)}
                </h3>

                <div class="verified">
                    ✓ Тасдиқшуда
                </div>

                <p>
                    📂
                    ${escapeHTML(profile.category)}
                </p>

                <p>
                    🛠
                    ${escapeHTML(profile.service)}
                </p>

                <p>
                    🎯
                    ${escapeHTML(profile.experience)}
                </p>

                <p>
                    💰
                    ${escapeHTML(profile.price)}
                </p>

                <div class="card-actions">

                    <button
                        class="btn btn--dark"
                        onclick="openProfile('${profile.id}')"
                    >
                        Профил
                    </button>

                    <button
                        class="btn btn--primary"
                        onclick="openRequest('${profile.id}')"
                    >
                        Дархост
                    </button>

                </div>

            </article>

            `
        ).join("");

}


/* =====================================================
   PROFILE
===================================================== */

window.openProfile = function(id) {

    const profile =
        database.smm.find(
            item => item.id === id
        );

    if (!profile) return;

    $("#profileContent").innerHTML = `

        <div class="profile-view">

            <div class="avatar">
                👨‍💻
            </div>

            <h2>
                ${escapeHTML(profile.name)}
            </h2>

            <div class="verified">
                ✓ SMM-щик тасдиқшуда
            </div>

            <p>
                📂 Категория:
                ${escapeHTML(profile.category)}
            </p>

            <p>
                🛠 Хизмат:
                ${escapeHTML(profile.service)}
            </p>

            <p>
                🎯 Таҷриба:
                ${escapeHTML(profile.experience)}
            </p>

            <p>
                💰 Нарх:
                ${escapeHTML(profile.price)}
            </p>

            ${
                profile.instagram
                ?
                `
                <p>
                    📸 Instagram:
                    ${escapeHTML(profile.instagram)}
                </p>
                `
                :
                ""
            }

            <button
                class="btn btn--primary btn--full"
                style="margin-top:20px"
                onclick="openRequest('${profile.id}')"
            >
                📩 Ба ин SMM-щик дархост фиристодан
            </button>

        </div>

    `;

    openModal("#profileModal");

};


/* =====================================================
   CLOSE PROFILE
===================================================== */

$("#profileClose")?.addEventListener(
    "click",
    () => closeModal("#profileModal")
);


/* =====================================================
   REQUEST
===================================================== */

window.openRequest = function(id) {

    const profile =
        database.smm.find(
            item => item.id === id
        );

    if (!profile) return;

    $("#requestProfileId").value =
        profile.id;

    $("#requestSpecialistName").textContent =
        "Дархост ба " + profile.name;

    closeModal("#profileModal");

    openModal("#requestModal");

};

$("#requestClose")?.addEventListener(
    "click",
    () => closeModal("#requestModal")
);


$("#requestForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const request = {

            id: createId(),

            profileId:
                $("#requestProfileId").value,

            name:
                $("#requestName").value.trim(),

            phone:
                $("#requestPhone").value.trim(),

            message:
                $("#requestMessage").value.trim(),

            createdAt:
                new Date().toISOString()

        };

        database.requests.push(request);

        saveDatabase();

        this.reset();

        closeModal("#requestModal");

        showToast(
            "✅ Дархост фиристода шуд."
        );

        renderAll();

    }
);


/* =====================================================
   REVIEWS
===================================================== */

function renderReviews() {

    const container =
        $("#reviewsList");

    if (!container) return;

    if (!database.reviews.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    ⭐
                </div>

                <h3>
                    Ҳоло отзыв нест
                </h3>

                <p>
                    Ҳанӯз ягон муштарӣ
                    отзыв нагузоштааст.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        database.reviews
        .filter(
            review =>
                review.status !== "rejected"
        )
        .map(
            review => `

            <article class="review-card">

                <div class="stars">
                    ${
                        "⭐".repeat(
                            Number(review.rating)
                        )
                    }
                </div>

                <p>
                    “${escapeHTML(review.text)}”
                </p>

                <strong>
                    ${escapeHTML(review.name)}
                </strong>

                <small>
                    Муштарӣ
                </small>

            </article>

            `
        ).join("");

}


$("#addReviewBtn")?.addEventListener(
    "click",
    () => openModal("#reviewModal")
);

$("#reviewClose")?.addEventListener(
    "click",
    () => closeModal("#reviewModal")
);


$("#reviewForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const review = {

            id: createId(),

            name:
                $("#reviewName").value.trim(),

            rating:
                Number($("#reviewRating").value),

            text:
                $("#reviewText").value.trim(),

            status:
                "approved",

            createdAt:
                new Date().toISOString()

        };

        database.reviews.push(review);

        saveDatabase();

        this.reset();

        closeModal("#reviewModal");

        showToast(
            "⭐ Отзыв нигоҳ дошта шуд."
        );

        renderReviews();

        renderAdmin();

    }
);


/* =====================================================
   AI
===================================================== */

function openAI() {

    $("#aiResult").innerHTML = "";

    openModal("#aiModal");

}

$("#openAiBtn")?.addEventListener(
    "click",
    openAI
);

$("#startAiBtn")?.addEventListener(
    "click",
    openAI
);

$("#aiClose")?.addEventListener(
    "click",
    () => closeModal("#aiModal")
);


$all("[data-ai-category]").forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset.aiCategory;

                runAI(category);

            }
        );

    }
);


function runAI(category) {

    const result =
        $("#aiResult");

    const specialists =
        database.smm.filter(
            profile =>
                profile.status === "approved" &&
                profile.category === category
        );


    if (!specialists.length) {

        result.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    🤖
                </div>

                <h3>
                    Мутахассис ёфт нашуд
                </h3>

                <p>
                    Барои ин категория ҳоло
                    SMM-щики тасдиқшуда нестанд.
                </p>

            </div>

        `;

        return;
    }


    result.innerHTML = `

        <h3 style="margin:20px 0 12px">
            Мутахассисони мувофиқ:
        </h3>

        ${specialists.map(
            profile => `

            <div
                class="ai-result-card"
                style="
                    padding:18px;
                    margin-top:10px;
                    border:1px solid rgba(255,255,255,.1);
                    border-radius:15px;
                "
            >

                <strong>
                    ${escapeHTML(profile.name)}
                </strong>

                <p>
                    ${escapeHTML(profile.service)}
                </p>

                <button
                    class="btn btn--primary"
                    style="margin-top:10px"
                    onclick="openProfile('${profile.id}')"
                >
                    Профил →
                </button>

            </div>

            `
        ).join("")}

    `;

}


/* =====================================================
   ADMIN
===================================================== */

/*
   DEMO PASSWORD:
   admin123
*/

const ADMIN_PASSWORD =
    "admin123";


$("#adminBtn")?.addEventListener(
    "click",
    () => {

        $("#adminLogin").style.display =
            "block";

        $("#adminDashboard").style.display =
            "none";

        $("#adminPassword").value = "";

        openModal("#adminModal");

    }
);


$("#adminClose")?.addEventListener(
    "click",
    () => closeModal("#adminModal")
);


$("#adminLoginForm")?.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();

        const password =
            $("#adminPassword").value;

        if (
            password !== ADMIN_PASSWORD
        ) {

            showToast(
                "❌ Пароли нодуруст."
            );

            return;

        }


        $("#adminLogin").style.display =
            "none";

        $("#adminDashboard").style.display =
            "block";

        renderAdmin();

    }
);


/* =====================================================
   ADMIN LOGOUT
===================================================== */

$("#adminLogout")?.addEventListener(
    "click",
    () => {

        $("#adminDashboard").style.display =
            "none";

        $("#adminLogin").style.display =
            "block";

        closeModal("#adminModal");

    }
);


/* =====================================================
   ADMIN RENDER
===================================================== */

function renderAdmin() {

    $("#adminSmmCount").textContent =
        database.smm.length;

    $("#adminClientCount").textContent =
        database.clients.length;

    $("#adminRequestCount").textContent =
        database.requests.length;

    $("#adminReviewCount").textContent =
        database.reviews.length;


    const pending =
        database.smm.filter(
            x => x.status === "pending"
        ).length;

    $("#pendingSmmCount").textContent =
        pending;


    renderAdminSmm();

    renderAdminClients();

    renderAdminRequests();

    renderAdminReviews();

}


/* =====================================================
   ADMIN SMM
===================================================== */

function renderAdminSmm() {

    const container =
        $("#adminSmmList");

    if (!database.smm.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло SMM-щик сабт нашудааст.
            </div>
        `;

        return;

    }


    container.innerHTML =
        database.smm.map(
            profile => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(profile.name)}
                </strong>

                <p>
                    📂 ${escapeHTML(profile.category)}
                </p>

                <p>
                    🛠 ${escapeHTML(profile.service)}
                </p>

                <p>
                    📱 ${escapeHTML(profile.phone)}
                </p>

                <p>
                    Статус:

                    ${
                        profile.status === "approved"
                        ?
                        `<span class="statusApproved">
                            Тасдиқшуда
                        </span>`
                        :
                        profile.status === "rejected"
                        ?
                        `<span class="statusRejected">
                            Радшуда
                        </span>`
                        :
                        `<span class="statusPending">
                            Дар интизорӣ
                        </span>`
                    }

                </p>


                <div class="admin-actions">

                    ${
                        profile.status !== "approved"
                        ?
                        `
                        <button
                            class="btn btn--primary"
                            onclick="approveSmm('${profile.id}')"
                        >
                            ✓ Тасдиқ
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        profile.status !== "rejected"
                        ?
                        `
                        <button
                            class="btn btn--dark"
                            onclick="rejectSmm('${profile.id}')"
                        >
                            ✕ Рад
                        </button>
                        `
                        :
                        ""
                    }


                    <button
                        class="btn btn--dark"
                        onclick="deleteSmm('${profile.id}')"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

            </div>

            `
        ).join("");

}


/* =====================================================
   APPROVE SMM
===================================================== */

window.approveSmm = function(id) {

    const profile =
        database.smm.find(
            x => x.id === id
        );

    if (!profile) return;

    profile.status = "approved";

    saveDatabase();

    renderAll();

    renderAdmin();

    showToast(
        "✅ SMM-щик тасдиқ шуд."
    );

};


/* =====================================================
   REJECT SMM
===================================================== */

window.rejectSmm = function(id) {

    const profile =
        database.smm.find(
            x => x.id === id
        );

    if (!profile) return;

    profile.status = "rejected";

    saveDatabase();

    renderAll();

    renderAdmin();

    showToast(
        "❌ SMM-щик рад шуд."
    );

};


/* =====================================================
   DELETE SMM
===================================================== */

window.deleteSmm = function(id) {

    database.smm =
        database.smm.filter(
            x => x.id !== id
        );

    saveDatabase();

    renderAll();

    renderAdmin();

    showToast(
        "🗑 Профил нест карда шуд."
    );

};


/* =====================================================
   ADMIN CLIENTS
===================================================== */

function renderAdminClients() {

    const container =
        $("#adminClientList");

    if (!database.clients.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло муштарӣ сабт нашудааст.
            </div>
        `;

        return;

    }


    container.innerHTML =
        database.clients.map(
            client => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(client.name)}
                </strong>

                <p>
                    🏢 ${escapeHTML(client.business)}
                </p>

                <p>
                    📂 ${escapeHTML(client.category)}
                </p>

                <p>
                    📱 ${escapeHTML(client.phone)}
                </p>

                <p>
                    💬 ${escapeHTML(client.need)}
                </p>

                <button
                    class="btn btn--dark"
                    onclick="deleteClient('${client.id}')"
                >
                    🗑 Нест кардан
                </button>

            </div>

            `
        ).join("");

}


window.deleteClient = function(id) {

    database.clients =
        database.clients.filter(
            x => x.id !== id
        );

    saveDatabase();

    renderAll();

    renderAdmin();

    showToast(
        "🗑 Муштарӣ нест карда шуд."
    );

};


/* =====================================================
   ADMIN REQUESTS
===================================================== */

function renderAdminRequests() {

    const container =
        $("#adminRequestList");

    if (!database.requests.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло дархост нест.
            </div>
        `;

        return;

    }


    container.innerHTML =
        database.requests.map(
            request => {

                const profile =
                    database.smm.find(
                        x =>
                            x.id === request.profileId
                    );

                return `

                <div class="admin-item">

                    <strong>
                        ${escapeHTML(request.name)}
                    </strong>

                    <p>
                        📱 ${escapeHTML(request.phone)}
                    </p>

                    <p>
                        👨‍💻 SMM:
                        ${
                            profile
                            ?
                            escapeHTML(profile.name)
                            :
                            "Нест шудааст"
                        }
                    </p>

                    <p>
                        💬 ${escapeHTML(request.message)}
                    </p>

                    <button
                        class="btn btn--dark"
                        onclick="deleteRequest('${request.id}')"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

                `;

            }
        ).join("");

}


window.deleteRequest = function(id) {

    database.requests =
        database.requests.filter(
            x => x.id !== id
        );

    saveDatabase();

    renderAdmin();

    showToast(
        "🗑 Дархост нест карда шуд."
    );

};


/* =====================================================
   ADMIN REVIEWS
===================================================== */

function renderAdminReviews() {

    const container =
        $("#adminReviewList");

    if (!database.reviews.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло отзыв нест.
            </div>
        `;

        return;

    }


    container.innerHTML =
        database.reviews.map(
            review => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(review.name)}
                </strong>

                <p>
                    ${"⭐".repeat(
                        Number(review.rating)
                    )}
                </p>

                <p>
                    ${escapeHTML(review.text)}
                </p>

                <button
                    class="btn btn--dark"
                    onclick="deleteReview('${review.id}')"
                >
                    🗑 Нест кардан
                </button>

            </div>

            `
        ).join("");

}


window.deleteReview = function(id) {

    database.reviews =
        database.reviews.filter(
            x => x.id !== id
        );

    saveDatabase();

    renderReviews();

    renderAdmin();

    showToast(
        "🗑 Отзыв нест карда шуд."
    );

};


/* =====================================================
   CLOSE MODAL BY BACKGROUND
===================================================== */

$all(".modal-overlay").forEach(
    overlay => {

        overlay.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === overlay
                ) {

                    overlay.classList.remove(
                        "active"
                    );

                    document.body.style.overflow =
                        "";

                }

            }
        );

    }
);


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") return;

        $all(".modal-overlay.active")
            .forEach(modal => {

                modal.classList.remove(
                    "active"
                );

            });

        document.body.style.overflow = "";

    }
);


/* =====================================================
   RENDER ALL
===================================================== */

function renderAll() {

    renderSpecialists();

    renderReviews();

    if (
        $("#adminDashboard") &&
        $("#adminDashboard").style.display !== "none"
    ) {

        renderAdmin();

    }

}


/* =====================================================
   START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderAll();

        console.log(
            "SMM.TJ loaded successfully."
        );

    }
);
