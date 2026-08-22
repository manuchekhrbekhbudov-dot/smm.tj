"use strict";

/* =====================================================
   SMM.TJ — SCRIPT.JS
===================================================== */

const DB_KEY = "SMM_TJ_DATA";

let db = JSON.parse(
    localStorage.getItem(DB_KEY) ||
    JSON.stringify({
        smm: [],
        clients: [],
        reviews: [],
        requests: []
    })
);

function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function $(id) {
    return document.getElementById(id);
}

function id() {
    return Date.now().toString(36) +
        Math.random().toString(36).substring(2);
}

function toast(text) {

    const old = document.querySelector(".smm-toast");
    if (old) old.remove();

    const box = document.createElement("div");

    box.className = "smm-toast";

    box.textContent = text;

    box.style.cssText = `
        position:fixed;
        left:50%;
        bottom:25px;
        transform:translateX(-50%);
        z-index:999999;
        padding:15px 22px;
        border-radius:14px;
        background:#18121f;
        color:#fff;
        border:1px solid #9b5cff;
        box-shadow:0 15px 50px rgba(0,0,0,.5);
        font-size:14px;
        text-align:center;
    `;

    document.body.appendChild(box);

    setTimeout(() => box.remove(), 3000);
}


/* =====================================================
   MOBILE MENU
===================================================== */

const menuBtn = $("menuBtn");

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        const nav = document.querySelector(".nav");

        if (!nav) return;

        nav.classList.toggle("mobile");

    });

}


/* =====================================================
   AUTH
===================================================== */

const authOverlay =
    $("authOverlay");

const authClose =
    $("authClose");

const roleSelection =
    $("roleSelection");

const smmForm =
    $("smmForm");

const clientForm =
    $("clientForm");


function openAuth() {

    if (!authOverlay) return;

    authOverlay.classList.add("active");

    if (roleSelection)
        roleSelection.style.display = "grid";

    if (smmForm)
        smmForm.classList.remove("active");

    if (clientForm)
        clientForm.classList.remove("active");

}


function closeAuth() {

    if (!authOverlay) return;

    authOverlay.classList.remove("active");

}


$("loginBtn")?.addEventListener(
    "click",
    openAuth
);

$("registerBtn")?.addEventListener(
    "click",
    openAuth
);

authClose?.addEventListener(
    "click",
    closeAuth
);


/* =====================================================
   ROLE SELECTION
===================================================== */

$("smmRole")?.addEventListener(
    "click",
    () => {

        roleSelection.style.display = "none";

        smmForm.classList.add("active");

        clientForm.classList.remove("active");

    }
);


$("clientRole")?.addEventListener(
    "click",
    () => {

        roleSelection.style.display = "none";

        clientForm.classList.add("active");

        smmForm.classList.remove("active");

    }
);


/* =====================================================
   SMM REGISTRATION
===================================================== */

smmForm?.addEventListener(
    "submit",
    function(e) {

        e.preventDefault();

        const name =
            $("smmName")?.value.trim();

        const instagram =
            $("smmInstagram")?.value.trim();

        const phone =
            $("smmPhone")?.value.trim();

        const category =
            $("smmCategory")?.value;

        const service =
            $("smmService")?.value.trim();

        const experience =
            $("smmExperience")?.value.trim();

        const price =
            $("smmPrice")?.value.trim();


        if (
            !name ||
            !phone ||
            !category ||
            !service ||
            !experience ||
            !price
        ) {

            toast(
                "⚠️ Ҳамаи майдонҳоро пур кунед."
            );

            return;

        }


        db.smm.push({

            id: id(),

            name,

            instagram,

            phone,

            category,

            service,

            experience,

            price,

            status: "pending",

            createdAt:
                new Date().toISOString()

        });


        save();

        this.reset();

        closeAuth();

        toast(
            "✅ Профил фиристода шуд. Интизори тасдиқи Admin бошед."
        );

        renderSpecialists();

        renderAdmin();

    }
);


/* =====================================================
   CLIENT REGISTRATION
===================================================== */

clientForm?.addEventListener(
    "submit",
    function(e) {

        e.preventDefault();

        const name =
            $("clientName")?.value.trim();

        const phone =
            $("clientPhone")?.value.trim();

        const business =
            $("clientBusiness")?.value.trim();

        const category =
            $("clientCategory")?.value;

        const need =
            $("clientNeed")?.value.trim();


        if (
            !name ||
            !phone ||
            !business ||
            !category ||
            !need
        ) {

            toast(
                "⚠️ Ҳамаи майдонҳоро пур кунед."
            );

            return;

        }


        db.clients.push({

            id: id(),

            name,

            phone,

            business,

            category,

            need,

            createdAt:
                new Date().toISOString()

        });


        save();

        this.reset();

        closeAuth();

        toast(
            "✅ Маълумоти бизнес қабул шуд."
        );

        renderAdmin();

    }
);


/* =====================================================
   FIND BUTTON
===================================================== */

$("findBtn")?.addEventListener(
    "click",
    () => {

        document
            .getElementById("specialists")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


/* =====================================================
   AI BUTTON
===================================================== */

$("aiBtn")?.addEventListener(
    "click",
    () => {

        document
            .getElementById("ai")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


$("startAi")?.addEventListener(
    "click",
    () => {

        toast(
            "🤖 Категорияи бизнесро интихоб кунед."
        );

    }
);


/* =====================================================
   SPECIALISTS
===================================================== */

function renderSpecialists() {

    const section =
        document.querySelector(
            "#specialists .specialists-grid"
        );

    if (!section) return;


    const approved =
        db.smm.filter(
            x => x.status === "approved"
        );


    if (!approved.length) {

        section.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    👨‍💻
                </div>

                <h3>
                    Ҳоло SMM-щик нест
                </h3>

                <p>
                    Ҳоло ягон SMM-щики
                    тасдиқшуда вуҷуд надорад.
                </p>

            </div>

        `;

        return;

    }


    section.innerHTML =
        approved.map(
            person => `

            <article class="specialist-card">

                <div class="avatar">
                    👨‍💻
                </div>

                <h3>
                    ${escapeHTML(person.name)}
                </h3>

                <span class="verified">
                    ✓ Тасдиқшуда
                </span>

                <p>
                    ${escapeHTML(person.service)}
                </p>

                <p>
                    📂 ${escapeHTML(person.category)}
                </p>

                <p>
                    🎯 ${escapeHTML(person.experience)}
                </p>

                <strong>
                    💰 ${escapeHTML(person.price)}
                </strong>

                <div style="
                    display:flex;
                    gap:10px;
                    margin-top:18px;
                    flex-wrap:wrap;
                ">

                    <button
                        class="primary-btn"
                        onclick="openProfile('${person.id}')"
                    >
                        Профил
                    </button>

                    <button
                        class="ai-btn"
                        onclick="openRequest('${person.id}')"
                    >
                        📩 Дархост
                    </button>

                </div>

            </article>

        `
        ).join("");

}


/* =====================================================
   PROFILE
===================================================== */

window.openProfile = function(personId) {

    const person =
        db.smm.find(
            x => x.id === personId
        );

    if (!person) return;


    const profileHTML = `

        <div style="
            text-align:center;
            padding:15px;
        ">

            <div class="avatar"
                 style="
                    margin:0 auto 15px;
                 ">
                👨‍💻
            </div>

            <h2>
                ${escapeHTML(person.name)}
            </h2>

            <p style="
                color:#9b5cff;
                margin:8px 0;
            ">
                ✓ SMM-щик тасдиқшуда
            </p>

            <p>
                📂 ${escapeHTML(person.category)}
            </p>

            <p>
                🛠 ${escapeHTML(person.service)}
            </p>

            <p>
                🎯 ${escapeHTML(person.experience)}
            </p>

            <p>
                💰 ${escapeHTML(person.price)}
            </p>

            ${
                person.instagram
                ?
                `<p>
                    📸 ${escapeHTML(person.instagram)}
                </p>`
                :
                ""
            }

            <button
                class="primary-btn"
                style="
                    width:100%;
                    margin-top:20px;
                "
                onclick="openRequest('${person.id}')"
            >
                📩 Дархост фиристодан
            </button>

        </div>

    `;


    showSimpleModal(
        profileHTML
    );

};


/* =====================================================
   REQUEST
===================================================== */

window.openRequest = function(personId) {

    const person =
        db.smm.find(
            x => x.id === personId
        );

    if (!person) return;


    const name =
        prompt(
            "Номи шумо:"
        );

    if (!name) return;


    const phone =
        prompt(
            "Рақами телефон:"
        );

    if (!phone) return;


    const message =
        prompt(
            "Чӣ хизмат лозим?"
        );

    if (!message) return;


    db.requests.push({

        id: id(),

        personId,

        specialist:
            person.name,

        name,

        phone,

        message,

        createdAt:
            new Date().toISOString()

    });


    save();

    toast(
        "✅ Дархост фиристода шуд."
    );

    renderAdmin();

};


/* =====================================================
   REVIEWS
===================================================== */

function renderReviews() {

    const grid =
        document.querySelector(
            ".reviews-grid"
        );

    if (!grid) return;


    if (!db.reviews.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
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


    grid.innerHTML =
        db.reviews.map(
            review => `

            <article class="review-card">

                <div class="review-stars">
                    ${
                        "⭐".repeat(
                            Number(review.rating)
                        )
                    }
                </div>

                <p>
                    «${escapeHTML(review.text)}»
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


/* =====================================================
   ADD REVIEW
===================================================== */

function addReview() {

    const name =
        prompt(
            "Номи шумо:"
        );

    if (!name) return;


    const text =
        prompt(
            "Отзыви худро нависед:"
        );

    if (!text) return;


    const ratingInput =
        prompt(
            "Баҳо аз 1 то 5:"
        );

    const rating =
        Math.min(
            5,
            Math.max(
                1,
                Number(ratingInput) || 5
            )
        );


    db.reviews.push({

        id: id(),

        name,

        text,

        rating,

        createdAt:
            new Date().toISOString()

    });


    save();

    renderReviews();

    renderAdmin();

    toast(
        "⭐ Отзыв нигоҳ дошта шуд."
    );

}


document
    .querySelector(".view-all")
    ?.addEventListener(
        "click",
        () => {

            document
                .getElementById("reviews")
                ?.scrollIntoView({
                    behavior:"smooth"
                });

        }
    );


/* =====================================================
   REVIEW BUTTON
===================================================== */

const reviewButtons =
    document.querySelectorAll(
        "#reviews button"
    );

reviewButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            addReview
        );

    }
);


/* =====================================================
   ADMIN PANEL
===================================================== */

const ADMIN_PASSWORD =
    "admin123";


function openAdmin() {

    const password =
        prompt(
            "🔐 Пароли Admin-ро ворид кунед:"
        );


    if (
        password !==
        ADMIN_PASSWORD
    ) {

        toast(
            "❌ Пароли нодуруст."
        );

        return;

    }


    renderAdmin();


    const adminHTML = `

        <div>

            <h2>
                👑 Admin Panel
            </h2>

            <p style="
                color:#888;
                margin:8px 0 25px;
            ">
                Идоракунии SMM.TJ
            </p>


            <div style="
                display:grid;
                grid-template-columns:
                repeat(4,1fr);
                gap:10px;
                margin-bottom:25px;
            ">

                <div class="admin-stat">
                    <strong>
                        ${db.smm.length}
                    </strong>
                    <small>SMM</small>
                </div>

                <div class="admin-stat">
                    <strong>
                        ${db.clients.length}
                    </strong>
                    <small>Муштарӣ</small>
                </div>

                <div class="admin-stat">
                    <strong>
                        ${db.requests.length}
                    </strong>
                    <small>Дархост</small>
                </div>

                <div class="admin-stat">
                    <strong>
                        ${db.reviews.length}
                    </strong>
                    <small>Отзыв</small>
                </div>

            </div>


            <h3>
                👨‍💻 SMM-щикҳо
            </h3>

            <div
                id="adminSmmList"
                style="
                    display:grid;
                    gap:10px;
                    margin-top:12px;
                "
            >

                ${adminSmmHTML()}

            </div>


            <h3 style="margin-top:30px">
                🏢 Муштариён
            </h3>

            <div
                style="
                    display:grid;
                    gap:10px;
                    margin-top:12px;
                "
            >

                ${adminClientsHTML()}

            </div>


            <h3 style="margin-top:30px">
                📩 Дархостҳо
            </h3>

            <div
                style="
                    display:grid;
                    gap:10px;
                    margin-top:12px;
                "
            >

                ${adminRequestsHTML()}

            </div>


            <h3 style="margin-top:30px">
                ⭐ Отзывҳо
            </h3>

            <div
                style="
                    display:grid;
                    gap:10px;
                    margin-top:12px;
                "
            >

                ${adminReviewsHTML()}

            </div>

        </div>

    `;


    showSimpleModal(
        adminHTML
    );

}


$("adminBtn")?.addEventListener(
    "click",
    openAdmin
);


/* =====================================================
   ADMIN HTML
===================================================== */

function adminSmmHTML() {

    if (!db.smm.length) {

        return `
            <div class="empty-state">
                SMM-щик нест.
            </div>
        `;

    }


    return db.smm.map(
        person => `

        <div
            style="
                padding:16px;
                border:1px solid
                rgba(255,255,255,.08);
                border-radius:15px;
                background:rgba(255,255,255,.03);
            "
        >

            <strong>
                ${escapeHTML(person.name)}
            </strong>

            <p>
                ${escapeHTML(person.service)}
            </p>

            <p>
                📱 ${escapeHTML(person.phone)}
            </p>

            <p>
                Статус:
                <b>
                    ${person.status}
                </b>
            </p>


            <div style="
                display:flex;
                gap:8px;
                margin-top:12px;
                flex-wrap:wrap;
            ">

                ${
                    person.status !== "approved"
                    ?
                    `
                    <button
                        class="primary-btn"
                        onclick="approveSmm('${person.id}')"
                    >
                        ✓ Тасдиқ
                    </button>
                    `
                    :
                    ""
                }


                <button
                    class="ai-btn"
                    onclick="deleteSmm('${person.id}')"
                >
                    🗑 Нест кардан
                </button>

            </div>

        </div>

    `
    ).join("");

}


function adminClientsHTML() {

    if (!db.clients.length) {

        return `
            <div class="empty-state">
                Муштарӣ нест.
            </div>
        `;

    }


    return db.clients.map(
        client => `

        <div
            style="
                padding:16px;
                border:1px solid
                rgba(255,255,255,.08);
                border-radius:15px;
            "
        >

            <strong>
                ${escapeHTML(client.name)}
            </strong>

            <p>
                🏢 ${escapeHTML(client.business)}
            </p>

            <p>
                📱 ${escapeHTML(client.phone)}
            </p>

            <p>
                💬 ${escapeHTML(client.need)}
            </p>

        </div>

    `
    ).join("");

}


function adminRequestsHTML() {

    if (!db.requests.length) {

        return `
            <div class="empty-state">
                Дархост нест.
            </div>
        `;

    }


    return db.requests.map(
        request => `

        <div
            style="
                padding:16px;
                border:1px solid
                rgba(255,255,255,.08);
                border-radius:15px;
            "
        >

            <strong>
                ${escapeHTML(request.name)}
            </strong>

            <p>
                👨‍💻 ${escapeHTML(request.specialist)}
            </p>

            <p>
                📱 ${escapeHTML(request.phone)}
            </p>

            <p>
                💬 ${escapeHTML(request.message)}
            </p>

        </div>

    `
    ).join("");

}


function adminReviewsHTML() {

    if (!db.reviews.length) {

        return `
            <div class="empty-state">
                Отзыв нест.
            </div>
        `;

    }


    return db.reviews.map(
        review => `

        <div
            style="
                padding:16px;
                border:1px solid
                rgba(255,255,255,.08);
                border-radius:15px;
            "
        >

            <strong>
                ${escapeHTML(review.name)}
            </strong>

            <p>
                ${
                    "⭐".repeat(
                        Number(review.rating)
                    )
                }
            </p>

            <p>
                ${escapeHTML(review.text)}
            </p>

        </div>

    `
    ).join("");

}


/* =====================================================
   ADMIN ACTIONS
===================================================== */

window.approveSmm = function(personId) {

    const person =
        db.smm.find(
            x => x.id === personId
        );

    if (!person) return;

    person.status = "approved";

    save();

    renderSpecialists();

    openAdmin();

    toast(
        "✅ SMM-щик тасдиқ шуд."
    );

};


window.deleteSmm = function(personId) {

    db.smm =
        db.smm.filter(
            x => x.id !== personId
        );

    save();

    renderSpecialists();

    openAdmin();

    toast(
        "🗑 Профил нест карда шуд."
    );

};


/* =====================================================
   SIMPLE MODAL
===================================================== */

function showSimpleModal(content) {

    let modal =
        document.getElementById(
            "dynamicModal"
        );


    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "dynamicModal";

        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:rgba(0,0,0,.8);
            backdrop-filter:blur(10px);
        `;

        document.body.appendChild(modal);

    }


    modal.innerHTML = `

        <div style="
            width:min(700px,100%);
            max-height:90vh;
            overflow:auto;
            position:relative;
            padding:30px;
            border-radius:25px;
            background:#100c17;
            border:1px solid rgba(155,92,255,.3);
            color:#fff;
        ">

            <button
                onclick="closeDynamicModal()"
                style="
                    position:absolute;
                    right:15px;
                    top:15px;
                    width:38px;
                    height:38px;
                    border-radius:50%;
                    border:1px solid rgba(255,255,255,.1);
                    background:#18121f;
                    color:white;
                    font-size:22px;
                    cursor:pointer;
                "
            >
                ×
            </button>

            ${content}

        </div>

    `;

}


window.closeDynamicModal =
    function() {

        const modal =
            document.getElementById(
                "dynamicModal"
            );

        if (modal)
            modal.remove();

    };


/* =====================================================
   ESC
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeAuth();

            document
                .querySelectorAll(
                    ".auth-overlay.active"
                )
                .forEach(
                    x =>
                        x.classList.remove("active")
                );

            closeDynamicModal();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderSpecialists();

        renderReviews();

        console.log(
            "SMM.TJ Script loaded successfully."
        );

    }
);
