const SUPABASE_URL = "URL-И-SUPABASE-И-ТУ";
const SUPABASE_KEY = "PUBLISHABLE-KEY-И-ТУ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("SMM.TJ → Supabase connected");
"use strict";

/* =========================
   DATABASE
========================= */

const DB_KEY = "smm_tj_database";

let db = JSON.parse(
    localStorage.getItem(DB_KEY) ||
    '{"smm":[],"clients":[],"reviews":[],"requests":[]}'
);

function save() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function $(id) {
    return document.getElementById(id);
}

function makeId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function escapeHTML(text) {
    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function modalOpen(id) {
    $(id).classList.add("active");
}

function modalClose(id) {
    $(id).classList.remove("active");
}


/* =========================
   MOBILE MENU
========================= */

$("menuBtn")?.addEventListener("click", () => {

    $("nav")?.classList.toggle("mobile");

});


/* =========================
   AUTH
========================= */

function openAuth() {

    modalOpen("authModal");

    $("roleSelection").style.display = "grid";

    $("smmForm").classList.remove("active");

    $("clientForm").classList.remove("active");

}

$("loginBtn")?.addEventListener(
    "click",
    openAuth
);

$("registerBtn")?.addEventListener(
    "click",
    openAuth
);

$("authClose")?.addEventListener(
    "click",
    () => modalClose("authModal")
);


/* =========================
   ROLES
========================= */

$("smmBtn")?.addEventListener(
    "click",
    () => {

        openAuth();

        $("roleSelection").style.display = "none";

        $("smmForm").classList.add("active");

    }
);


$("clientBtn")?.addEventListener(
    "click",
    () => {

        openAuth();

        $("roleSelection").style.display = "none";

        $("clientForm").classList.add("active");

    }
);


$("smmRole")?.addEventListener(
    "click",
    () => {

        $("roleSelection").style.display = "none";

        $("smmForm").classList.add("active");

    }
);


$("clientRole")?.addEventListener(
    "click",
    () => {

        $("roleSelection").style.display = "none";

        $("clientForm").classList.add("active");

    }
);


/* =========================
   SMM REGISTRATION
========================= */

$("smmForm")?.addEventListener(
    "submit",
    function(e) {

        e.preventDefault();

        const person = {

            id: makeId(),

            name: $("smmName").value.trim(),

            phone: $("smmPhone").value.trim(),

            instagram:
                $("smmInstagram").value.trim(),

            service:
                $("smmService").value.trim(),

            experience:
                $("smmExperience").value.trim(),

            price:
                $("smmPrice").value.trim(),

            category:
                $("smmCategory").value,

            status: "pending",

            date:
                new Date().toISOString()

        };

        db.smm.push(person);

        save();

        this.reset();

        modalClose("authModal");

        alert(
            "Профил қабул шуд. Админ онро месанҷад."
        );

        renderAll();

    }
);


/* =========================
   CLIENT REGISTRATION
========================= */

$("clientForm")?.addEventListener(
    "submit",
    function(e) {

        e.preventDefault();

        const client = {

            id: makeId(),

            name:
                $("clientName").value.trim(),

            phone:
                $("clientPhone").value.trim(),

            business:
                $("clientBusiness").value.trim(),

            category:
                $("clientCategory").value,

            need:
                $("clientNeed").value.trim(),

            date:
                new Date().toISOString()

        };

        db.clients.push(client);

        save();

        this.reset();

        modalClose("authModal");

        alert(
            "Дархости шумо қабул шуд."
        );

        renderAdmin();

    }
);


/* =========================
   FIND BUTTON
========================= */

$("findBtn")?.addEventListener(
    "click",
    () => {

        $("specialists").scrollIntoView({
            behavior: "smooth"
        });

    }
);


/* =========================
   AI
========================= */

function openAI() {

    modalOpen("aiModal");

    $("aiResult").innerHTML = "";

}

$("aiBtn")?.addEventListener(
    "click",
    openAI
);

$("startAiBtn")?.addEventListener(
    "click",
    openAI
);

$("aiClose")?.addEventListener(
    "click",
    () => modalClose("aiModal")
);


document
    .querySelectorAll("[data-ai]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                findByAI(
                    button.dataset.ai
                );

            }
        );

    });


function findByAI(category) {

    const people =
        db.smm.filter(
            person =>
                person.status === "approved" &&
                person.category === category
        );


    if (!people.length) {

        $("aiResult").innerHTML = `

            <div class="empty">

                <div>🤖</div>

                <h3>
                    Ҳоло мутахассис нест
                </h3>

                <p>
                    Барои ${escapeHTML(category)}
                    SMM-щики тасдиқшуда пайдо нашуд.
                </p>

            </div>

        `;

        return;

    }


    $("aiResult").innerHTML = `

        <h3 style="margin-top:25px">
            Мутахассисони мувофиқ:
        </h3>

        ${people.map(person => `

            <div
                style="
                    margin-top:12px;
                    padding:18px;
                    border:1px solid rgba(255,255,255,.1);
                    border-radius:15px;
                "
            >

                <strong>
                    ${escapeHTML(person.name)}
                </strong>

                <p>
                    ${escapeHTML(person.service)}
                </p>

                <button
                    class="btn btn-primary"
                    style="margin-top:10px"
                    onclick="openProfile('${person.id}')"
                >
                    Профил →
                </button>

            </div>

        `).join("")}

    `;

}


/* =========================
   SPECIALISTS
========================= */

function renderSpecialists() {

    const box =
        $("specialistsList");

    if (!box) return;

    const people =
        db.smm.filter(
            person =>
                person.status === "approved"
        );


    if (!people.length) {

        box.innerHTML = `

            <div class="empty">

                <div>👨‍💻</div>

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


    box.innerHTML =
        people.map(person => `

            <article class="specialist-card">

                <div class="avatar">
                    👨‍💻
                </div>

                <h3>
                    ${escapeHTML(person.name)}
                </h3>

                <p>
                    ✓ Тасдиқшуда
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

                <button
                    class="btn btn-primary"
                    onclick="openProfile('${person.id}')"
                >
                    Профил →
                </button>

            </article>

        `).join("");

}


/* =========================
   PROFILE
========================= */

window.openProfile = function(id) {

    const person =
        db.smm.find(
            x => x.id === id
        );

    if (!person) return;


    $("aiResult").innerHTML = `
        <h3>
            ${escapeHTML(person.name)}
        </h3>
    `;


    modalClose("aiModal");

    alert(
        "SMM-щик: " +
        person.name +
        "\n\n" +
        "Хизмат: " +
        person.service +
        "\n" +
        "Таҷриба: " +
        person.experience +
        "\n" +
        "Нарх: " +
        person.price
    );

};


/* =========================
   REVIEWS
========================= */

function renderReviews() {

    const box =
        $("reviewsList");

    if (!box) return;


    if (!db.reviews.length) {

        box.innerHTML = `

            <div class="empty">

                <div>⭐</div>

                <h3>
                    Ҳоло отзыв нест
                </h3>

                <p>
                    Ҳанӯз ягон клиент
                    отзыв нагузоштааст.
                </p>

            </div>

        `;

        return;

    }


    box.innerHTML =
        db.reviews.map(review => `

            <article class="review-card">

                <div>
                    ${"⭐".repeat(review.rating)}
                </div>

                <p>
                    «${escapeHTML(review.text)}»
                </p>

                <strong>
                    ${escapeHTML(review.name)}
                </strong>

            </article>

        `).join("");

}


/* =========================
   ADD REVIEW
========================= */

$("reviewBtn")?.addEventListener(
    "click",
    () => modalOpen("reviewModal")
);

$("reviewClose")?.addEventListener(
    "click",
    () => modalClose("reviewModal")
);


$("reviewForm")?.addEventListener(
    "submit",
    function(e) {

        e.preventDefault();

        const review = {

            id: makeId(),

            name:
                $("reviewName").value.trim(),

            rating:
                Number($("reviewRating").value),

            text:
                $("reviewText").value.trim(),

            date:
                new Date().toISOString()

        };

        db.reviews.push(review);

        save();

        this.reset();

        modalClose("reviewModal");

        renderReviews();

        renderAdmin();

        alert(
            "⭐ Отзыв нигоҳ дошта шуд."
        );

    }
);


/* =========================
   ADMIN
========================= */

const ADMIN_PASSWORD = "admin123";


$("adminBtn")?.addEventListener(
    "click",
    () => {

        modalOpen("adminModal");

        $("adminLogin").style.display =
            "block";

        $("adminDashboard").style.display =
            "none";

    }
);


$("adminClose")?.addEventListener(
    "click",
    () => modalClose("adminModal")
);


$("adminLoginBtn")?.addEventListener(
    "click",
    () => {

        const password =
            $("adminPassword").value;

        if (password !== ADMIN_PASSWORD) {

            alert(
                "❌ Парол нодуруст."
            );

            return;

        }

        $("adminLogin").style.display =
            "none";

        $("adminDashboard").style.display =
            "block";

        renderAdmin();

    }
);


/* =========================
   ADMIN DATA
========================= */

function renderAdmin() {

    if (!$("adminDashboard")) return;


    $("smmCount").textContent =
        db.smm.length;

    $("clientCount").textContent =
        db.clients.length;

    $("requestCount").textContent =
        db.requests.length;

    $("reviewCount").textContent =
        db.reviews.length;


    renderAdminSmm();

    renderAdminClients();

    renderAdminRequests();

}


function renderAdminSmm() {

    const box =
        $("adminSmmList");

    if (!box) return;


    if (!db.smm.length) {

        box.innerHTML =
            "<p>Ҳоло SMM-щик нест.</p>";

        return;

    }


    box.innerHTML =
        db.smm.map(person => `

            <div class="admin-item">

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
                    flex-wrap:wrap;
                    margin-top:10px;
                ">

                    ${
                        person.status !== "approved"
                        ?
                        `
                        <button
                            class="btn btn-primary"
                            onclick="approveSmm('${person.id}')"
                        >
                            ✓ Тасдиқ
                        </button>
                        `
                        :
                        ""
                    }


                    <button
                        class="btn btn-dark"
                        onclick="deleteSmm('${person.id}')"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

            </div>

        `).join("");

}


window.approveSmm = function(id) {

    const person =
        db.smm.find(
            x => x.id === id
        );

    if (!person) return;

    person.status = "approved";

    save();

    renderAll();

    renderAdmin();

    alert(
        "✅ SMM-щик тасдиқ шуд."
    );

};


window.deleteSmm = function(id) {

    db.smm =
        db.smm.filter(
            x => x.id !== id
        );

    save();

    renderAll();

    renderAdmin();

};


function renderAdminClients() {

    const box =
        $("adminClientList");

    if (!box) return;


    if (!db.clients.length) {

        box.innerHTML =
            "<p>Ҳоло клиент нест.</p>";

        return;

    }


    box.innerHTML =
        db.clients.map(client => `

            <div class="admin-item">

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

        `).join("");

}


function renderAdminRequests() {

    const box =
        $("adminRequestList");

    if (!box) return;


    if (!db.requests.length) {

        box.innerHTML =
            "<p>Ҳоло дархост нест.</p>";

        return;

    }


    box.innerHTML =
        db.requests.map(request => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(request.name)}
                </strong>

                <p>
                    📱 ${escapeHTML(request.phone)}
                </p>

                <p>
                    💬 ${escapeHTML(request.message)}
                </p>

            </div>

        `).join("");

}


/* =========================
   CLOSE ON BACKGROUND
========================= */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            function(e) {

                if (e.target === modal) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    });


/* =========================
   ESC
========================= */

document.addEventListener(
    "keydown",
    e => {

        if (e.key !== "Escape") return;

        document
            .querySelectorAll(".modal.active")
            .forEach(modal => {

                modal.classList.remove(
                    "active"
                );

            });

    }
);


/* =========================
   RENDER
========================= */

function renderAll() {

    renderSpecialists();

    renderReviews();

    renderAdmin();

}


/* =========================
   START
========================= */

renderAll();

console.log(
    "SMM.TJ — script.js loaded successfully"
);
