"use strict";

/* =========================================
   SMM.TJ — SUPABASE
========================================= */

const SUPABASE_URL =
    "https://lcldaingzicxbottlznq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

console.log("SMM.TJ → Supabase connected");


/* =========================================
   STATE
========================================= */

const db = {
    smm: [],
    clients: [],
    reviews: [],
    requests: []
};


/* =========================================
   HELPERS
========================================= */

function $(id) {
    return document.getElementById(id);
}

function escapeHTML(text) {
    return String(text ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function modalOpen(id) {
    const el = $(id);
    if (el) el.classList.add("active");
}

function modalClose(id) {
    const el = $(id);
    if (el) el.classList.remove("active");
}


/* =========================================
   LOAD DATABASE
========================================= */

async function loadData() {

    const [
        smm,
        clients,
        reviews,
        requests
    ] = await Promise.all([

        supabaseClient
            .from("smm_profiles")
            .select("*")
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("clients")
            .select("*")
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("reviews")
            .select("*")
            .eq("status", "approved")
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("requests")
            .select("*")
            .order("created_at", {
                ascending: false
            })
    ]);

    if (smm.error)
        console.error("SMM:", smm.error);

    if (clients.error)
        console.error("CLIENTS:", clients.error);

    if (reviews.error)
        console.error("REVIEWS:", reviews.error);

    if (requests.error)
        console.error("REQUESTS:", requests.error);

    db.smm = smm.data || [];
    db.clients = clients.data || [];
    db.reviews = reviews.data || [];
    db.requests = requests.data || [];

    renderAll();

    console.log("✅ SMM.TJ Supabase loaded");
}


/* =========================================
   MOBILE MENU
========================================= */

$("menuBtn")?.addEventListener(
    "click",
    () => {
        $("nav")?.classList.toggle("mobile");
    }
);


/* =========================================
   AUTH
========================================= */

function openAuth() {

    modalOpen("authModal");

    if ($("roleSelection"))
        $("roleSelection").style.display = "grid";

    $("smmForm")?.classList.remove("active");
    $("clientForm")?.classList.remove("active");
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


/* =========================================
   ROLE BUTTONS
========================================= */

function openSmmForm() {

    modalOpen("authModal");

    if ($("roleSelection"))
        $("roleSelection").style.display = "none";

    $("smmForm")?.classList.add("active");
    $("clientForm")?.classList.remove("active");
}

function openClientForm() {

    modalOpen("authModal");

    if ($("roleSelection"))
        $("roleSelection").style.display = "none";

    $("clientForm")?.classList.add("active");
    $("smmForm")?.classList.remove("active");
}

$("smmBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("smmRole")?.addEventListener(
    "click",
    openSmmForm
);

$("clientBtn")?.addEventListener(
    "click",
    openClientForm
);

$("clientRole")?.addEventListener(
    "click",
    openClientForm
);


/* =========================================
   SMM REGISTRATION
========================================= */

$("smmForm")?.addEventListener(
    "submit",
    async function(e) {

        e.preventDefault();

        const button =
            this.querySelector(
                'button[type="submit"]'
            );

        if (button)
            button.disabled = true;

        const person = {

            name:
                $("smmName").value.trim(),

            phone:
                $("smmPhone").value.trim(),

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

            status: "pending"
        };

        const { error } =
            await supabaseClient
                .from("smm_profiles")
                .insert(person);

        if (button)
            button.disabled = false;

        if (error) {

            console.error(
                "SMM INSERT ERROR:",
                error
            );

            alert(
                "❌ Хато шуд. Маълумот сабт нашуд."
            );

            return;
        }

        alert(
            "✅ Профил қабул шуд. Админ онро месанҷад."
        );

        this.reset();

        modalClose("authModal");

        await loadData();
    }
);


/* =========================================
   CLIENT REGISTRATION
========================================= */

$("clientForm")?.addEventListener(
    "submit",
    async function(e) {

        e.preventDefault();

        const button =
            this.querySelector(
                'button[type="submit"]'
            );

        if (button)
            button.disabled = true;

        const client = {

            name:
                $("clientName").value.trim(),

            phone:
                $("clientPhone").value.trim(),

            business:
                $("clientBusiness").value.trim(),

            category:
                $("clientCategory").value,

            need:
                $("clientNeed").value.trim()
        };

        const {
            data,
            error
        } = await supabaseClient
            .from("clients")
            .insert(client)
            .select()
            .single();

        if (error) {

            console.error(
                "CLIENT INSERT ERROR:",
                error
            );

            if (button)
                button.disabled = false;

            alert(
                "❌ Хато шуд. Дархост сабт нашуд."
            );

            return;
        }

        const request = {

            client_id: data.id,

            client_name:
                client.name,

            phone:
                client.phone,

            message:
                client.need,

            specialist_name:
                null,

            status:
                "new"
        };

        const {
            error: requestError
        } = await supabaseClient
            .from("requests")
            .insert(request);

        if (requestError) {

            console.error(
                "REQUEST ERROR:",
                requestError
            );
        }

        if (button)
            button.disabled = false;

        alert(
            "✅ Дархости шумо қабул шуд."
        );

        this.reset();

        modalClose("authModal");

        await loadData();
    }
);


/* =========================================
   FIND
========================================= */

$("findBtn")?.addEventListener(
    "click",
    () => {

        $("specialists")?.scrollIntoView({
            behavior: "smooth"
        });

    }
);


/* =========================================
   AI
========================================= */

function openAI() {

    modalOpen("aiModal");

    if ($("aiResult"))
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
                <h3>Ҳоло мутахассис нест</h3>
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
            <div class="ai-result-card">
                <strong>
                    ${escapeHTML(person.name)}
                </strong>

                <span>
                    ${escapeHTML(person.service)}
                </span>

                <span>
                    ${escapeHTML(person.experience)}
                </span>
            </div>
        `).join("")}
    `;
}
/* =========================================
   ADD REVIEW
========================================= */

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
    async function(e) {

        e.preventDefault();

        const review = {

            client_name:
                $("reviewName").value.trim(),

            rating:
                Number(
                    $("reviewRating").value
                ),

            text:
                $("reviewText").value.trim(),

            status:
                "approved"
        };

        const { error } =
            await supabaseClient
                .from("reviews")
                .insert(review);

        if (error) {

            console.error(
                "REVIEW INSERT ERROR:",
                error
            );

            alert(
                "❌ Отзыв сабт нашуд."
            );

            return;
        }

        alert(
            "⭐ Отзыв қабул шуд. Баъди тасдиқи админ дар сайт пайдо мешавад."
        );

        this.reset();

        modalClose("reviewModal");

        await loadData();
    }
);


/* =========================================
   ADMIN
========================================= */

let isAdmin = false;

$("adminBtn")?.addEventListener(
    "click",
    () => modalOpen("adminModal")
);

$("adminClose")?.addEventListener(
    "click",
    () => modalClose("adminModal")
);

$("adminLoginBtn")?.addEventListener(
    "click",
    async () => {

        const password =
            $("adminPassword")?.value || "";

        if (!password) {
            alert("Паролро ворид кунед.");
            return;
        }

        /*
         * Пароли Admin-ро бо пароли
         * мавҷудаи лоиҳа муқоиса мекунем.
         */

        if (
            password !==
            "admin123"
        ) {

            alert(
                "❌ Парол нодуруст."
            );

            return;
        }

        isAdmin = true;

        modalClose("adminModal");

        modalOpen("adminDashboard");

        await renderAdmin();
    }
);


/* =========================================
   ADMIN DASHBOARD
========================================= */

async function renderAdmin() {

    if (!isAdmin)
        return;

    await loadAdminData();

    renderAdminStats();
    renderAdminSmm();
    renderAdminClients();
    renderAdminRequests();
    renderAdminReviews();
}


/* =========================================
   ADMIN DATA
========================================= */

async function loadAdminData() {

    const [
        smm,
        clients,
        requests,
        reviews
    ] = await Promise.all([

        supabaseClient
            .from("smm_profiles")
            .select("*")
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("clients")
            .select("*")
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("requests")
            .select("*")
            .order("created_at", {
                ascending: false
            }),

        supabaseClient
            .from("reviews")
            .select("*")
            .order("created_at", {
                ascending: false
            })
    ]);

    db.smm =
        smm.data || [];

    db.clients =
        clients.data || [];

    db.requests =
        requests.data || [];

    db.reviews =
        reviews.data || [];
}


/* =========================================
   ADMIN STATS
========================================= */

function renderAdminStats() {

    const smmCount =
        document.querySelector(
            "#adminSmmCount"
        );

    const clientCount =
        document.querySelector(
            "#adminClientCount"
        );

    const requestCount =
        document.querySelector(
            "#adminRequestCount"
        );

    const reviewCount =
        document.querySelector(
            "#adminReviewCount"
        );

    if (smmCount)
        smmCount.textContent =
            db.smm.length;

    if (clientCount)
        clientCount.textContent =
            db.clients.length;

    if (requestCount)
        requestCount.textContent =
            db.requests.length;

    if (reviewCount)
        reviewCount.textContent =
            db.reviews.length;
}


/* =========================================
   ADMIN SMM
========================================= */

function renderAdminSmm() {

    const box =
        document.querySelector(
            "#adminSmmList"
        );

    if (!box)
        return;

    if (!db.smm.length) {

        box.innerHTML = `
            <div class="empty">
                Ҳоло SMM-щик нест.
            </div>
        `;

        return;
    }

    box.innerHTML =
        db.smm.map(person => `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            person.name
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            person.phone
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            person.service
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            person.category
                        )}
                    </p>

                    <small>
                        Статус:
                        ${escapeHTML(
                            person.status
                        )}
                    </small>

                </div>

                <div class="admin-actions">

                    ${
                        person.status !==
                        "approved"
                        ? `
                            <button
                                class="btn btn-primary"
                                onclick="
                                    approveSmm(
                                        '${person.id}'
                                    )
                                "
                            >
                                Тасдиқ
                            </button>
                        `
                        : ""
                    }

                    <button
                        class="btn btn-danger"
                        onclick="
                            deleteSmm(
                                '${person.id}'
                            )
                        "
                    >
                        Нест кардан
                    </button>

                </div>

            </div>

        `).join("");
}


/* =========================================
   APPROVE SMM
========================================= */

window.approveSmm =
    async function(id) {

        const {
            error
        } = await supabaseClient
            .from("smm_profiles")
            .update({
                status: "approved"
            })
            .eq("id", id);

        if (error) {

            console.error(
                "APPROVE SMM ERROR:",
                error
            );

            alert(
                "❌ Тасдиқ нашуд."
            );

            return;
        }

        alert(
            "✅ SMM-щик тасдиқ шуд."
        );

        await loadData();

        await renderAdmin();
    };


/* =========================================
   DELETE SMM
========================================= */

window.deleteSmm =
    async function(id) {

        const ok =
            confirm(
                "Ин SMM-щикро нест кунем?"
            );

        if (!ok)
            return;

        const {
            error
        } = await supabaseClient
            .from("smm_profiles")
            .delete()
            .eq("id", id);

        if (error) {

            console.error(
                "DELETE SMM ERROR:",
                error
            );

            alert(
                "❌ Нест кардан нашуд."
            );

            return;
        }

        await loadData();

        await renderAdmin();
    };


/* =========================================
   ADMIN CLIENTS
========================================= */

function renderAdminClients() {

    const box =
        document.querySelector(
            "#adminClientsList"
        );

    if (!box)
        return;

    if (!db.clients.length) {

        box.innerHTML = `
            <div class="empty">
                Ҳоло клиент нест.
            </div>
        `;

        return;
    }

    box.innerHTML =
        db.clients.map(client => `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            client.name
                        )}
                    </strong>

                    <p>
                        📞
                        ${escapeHTML(
                            client.phone
                        )}
                    </p>

                    <p>
                        🏢
                        ${escapeHTML(
                            client.business
                        )}
                    </p>

                    <p>
                        📂
                        ${escapeHTML(
                            client.category
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            client.need
                        )}
                    </p>

                </div>

                <button
                    class="btn btn-danger"
                    onclick="
                        deleteClient(
                            '${client.id}'
                        )
                    "
                >
                    Нест кардан
                </button>

            </div>

        `).join("");
}


/* =========================================
   DELETE CLIENT
========================================= */

window.deleteClient =
    async function(id) {

        const ok =
            confirm(
                "Ин клиентро нест кунем?"
            );

        if (!ok)
            return;

        const {
            error
        } = await supabaseClient
            .from("clients")
            .delete()
            .eq("id", id);

        if (error) {

            console.error(
                "DELETE CLIENT ERROR:",
                error
            );

            alert(
                "❌ Клиент нест карда нашуд."
            );

            return;
        }

        alert(
            "🗑 Клиент нест карда шуд."
        );

        await loadData();

        await renderAdmin();
    };


/* =========================================
   ADMIN REQUESTS
========================================= */

function renderAdminRequests() {

    const box =
        document.querySelector(
            "#adminRequestsList"
        );

    if (!box)
        return;

    if (!db.requests.length) {

        box.innerHTML = `
            <div class="empty">
                Ҳоло дархост нест.
            </div>
        `;

        return;
    }

    box.innerHTML =
        db.requests.map(request => `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            request.client_name ||
                            "Client"
                        )}
                    </strong>

                    <p>
                        📞
                        ${escapeHTML(
                            request.phone ||
                            ""
                        )}
                    </p>

                    <p>
                        📝
                        ${escapeHTML(
                            request.message ||
                            ""
                        )}
                    </p>

                    <small>
                        Статус:
                        ${escapeHTML(
                            request.status ||
                            "new"
                        )}
                    </small>

                </div>

                <div class="admin-actions">

                    ${
                        request.status !==
                        "accepted"
                        ? `
                            <button
                                class="btn btn-primary"
                                onclick="
                                    acceptRequest(
                                        '${request.id}'
                                    )
                                "
                            >
                                Қабул кардан
                            </button>
                        `
                        : ""
                    }

                    ${
                        request.status !==
                        "rejected"
                        ? `
                            <button
                                class="btn btn-secondary"
                                onclick="
                                    rejectRequest(
                                        '${request.id}'
                                    )
                                "
                            >
                                Рад кардан
                            </button>
                        `
                        : ""
                    }

                    <button
                        class="btn btn-danger"
                        onclick="
                            deleteRequest(
                                '${request.id}'
                            )
                        "
                    >
                        Нест кардан
                    </button>

                </div>

            </div>

        `).join("");
}


/* =========================================
   ACCEPT REQUEST
========================================= */

window.acceptRequest =
    async function(id) {

        const {
            error
        } = await supabaseClient
            .from("requests")
            .update({
                status: "accepted"
            })
            .eq("id", id);

        if (error) {

            console.error(
                "ACCEPT REQUEST ERROR:",
                error
            );

            alert(
                "❌ Дархост қабул нашуд."
            );

            return;
        }

        alert(
            "✅ Дархост қабул шуд."
        );

        await loadData();

        await renderAdmin();
    };


/* =========================================
   REJECT REQUEST
========================================= */

window.rejectRequest =
    async function(id) {

        const {
            error
        } = await supabaseClient
            .from("requests")
            .update({
                status: "rejected"
            })
            .eq("id", id);

        if (error) {

            console.error(
                "REJECT REQUEST ERROR:",
                error
            );

            alert(
                "❌ Дархост рад нашуд."
            );

            return;
        }

        alert(
            "✕ Дархост рад шуд."
        );

        await loadData();

        await renderAdmin();
    };


/* =========================================
   DELETE REQUEST
========================================= */

window.deleteRequest =
    async function(id) {

        const ok =
            confirm(
                "Ин дархостро нест кунем?"
            );

        if (!ok)
            return;

        const {
            error
        } = await supabaseClient
            .from("requests")
            .delete()
            .eq("id", id);

        if (error) {

            console.error(
                "DELETE REQUEST ERROR:",
                error
            );

            alert(
                "❌ Дархост нест карда нашуд."
            );

            return;
        }

        alert(
            "🗑 Дархост нест карда шуд."
        );

        await loadData();

        await renderAdmin();
    };
/* =========================================
   ADMIN REVIEWS
========================================= */

function renderAdminReviews() {

    const box =
        document.querySelector(
            "#adminReviewsList"
        );

    if (!box)
        return;

    if (!db.reviews.length) {

        box.innerHTML = `
            <div class="empty">
                Ҳоло отзыв нест.
            </div>
        `;

        return;
    }

    box.innerHTML =
        db.reviews.map(review => `

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            review.client_name
                        )}
                    </strong>

                    <div>
                        ${"⭐".repeat(
                            Number(
                                review.rating || 0
                            )
                        )}
                    </div>

                    <p>
                        ${escapeHTML(
                            review.text
                        )}
                    </p>

                    <small>
                        Статус:
                        ${escapeHTML(
                            review.status ||
                            "pending"
                        )}
                    </small>

                </div>

                <div class="admin-actions">

                    ${
                        review.status !==
                        "approved"
                        ? `
                            <button
                                class="btn btn-primary"
                                onclick="
                                    approveReview(
                                        '${review.id}'
                                    )
                                "
                            >
                                Тасдиқ
                            </button>
                        `
                        : ""
                    }

                    <button
                        class="btn btn-danger"
                        onclick="
                            deleteReview(
                                '${review.id}'
                            )
                        "
                    >
                        Нест кардан
                    </button>

                </div>

            </div>

        `).join("");
}


/* =========================================
   APPROVE REVIEW
========================================= */

window.approveReview =
    async function(id) {

        const {
            error
        } = await supabaseClient
            .from("reviews")
            .update({
                status: "approved"
            })
            .eq("id", id);

        if (error) {

            console.error(
                "APPROVE REVIEW ERROR:",
                error
            );

            alert(
                "❌ Отзыв тасдиқ нашуд."
            );

            return;
        }

        alert(
            "⭐ Отзыв тасдиқ шуд."
        );

        await loadData();

        await renderAdmin();
    };


/* =========================================
   DELETE REVIEW
========================================= */

window.deleteReview =
    async function(id) {

        const ok =
            confirm(
                "Ин отзывро нест кунем?"
            );

        if (!ok)
            return;

        const {
            error
        } = await supabaseClient
            .from("reviews")
            .delete()
            .eq("id", id);

        if (error) {

            console.error(
                "DELETE REVIEW ERROR:",
                error
            );

            alert(
                "❌ Отзыв нест нашуд."
            );

            return;
        }

        await loadData();

        await renderAdmin();
    };


/* =========================================
   RENDER ALL
========================================= */

function renderAll() {

    renderSpecialists();

    renderReviews();
}


/* =========================================
   SPECIALISTS
========================================= */

function renderSpecialists() {

    const box =
        document.querySelector(
            "#specialistsGrid"
        );

    if (!box)
        return;

    const specialists =
        db.smm.filter(
            person =>
                person.status ===
                "approved"
        );

    if (!specialists.length) {

        box.innerHTML = `
            <div class="empty">
                <div>👨‍💻</div>

                <h3>
                    Ҳоло SMM-щик нест
                </h3>

                <p>
                    Ҳоло ягон мутахассиси
                    тасдиқшуда вуҷуд надорад.
                </p>
            </div>
        `;

        return;
    }

    box.innerHTML =
        specialists.map(person => `

            <article class="specialist-card">

                <div class="specialist-top">

                    <div class="avatar">
                        ${escapeHTML(
                            person.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "S"
                        )}
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                person.name
                            )}
                        </h3>

                        <span class="verified">
                            ✓ Тасдиқшуда
                        </span>

                    </div>

                </div>

                <div class="specialist-info">

                    <p>
                        📱
                        ${escapeHTML(
                            person.instagram ||
                            ""
                        )}
                    </p>

                    <p>
                        💼
                        ${escapeHTML(
                            person.service ||
                            ""
                        )}
                    </p>

                    <p>
                        ⏳
                        ${escapeHTML(
                            person.experience ||
                            ""
                        )}
                    </p>

                    <p>
                        💰
                        ${escapeHTML(
                            person.price ||
                            ""
                        )}
                    </p>

                </div>

                <button
                    class="btn btn-primary profile-btn"
                    onclick="
                        openSpecialist(
                            '${person.id}'
                        )
                    "
                >
                    Профил →
                </button>

            </article>

        `).join("");
}


/* =========================================
   SPECIALIST PROFILE
========================================= */

window.openSpecialist =
    function(id) {

        const person =
            db.smm.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!person)
            return;

        const box =
            $("profileContent");

        if (!box)
            return;

        box.innerHTML = `

            <div class="profile-avatar">
                ${escapeHTML(
                    person.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                    "S"
                )}
            </div>

            <h2>
                ${escapeHTML(
                    person.name
                )}
            </h2>

            <span class="verified">
                ✓ Тасдиқшуда
            </span>

            <div class="profile-details">

                <p>
                    📱
                    ${escapeHTML(
                        person.phone ||
                        ""
                    )}
                </p>

                <p>
                    📸
                    ${escapeHTML(
                        person.instagram ||
                        ""
                    )}
                </p>

                <p>
                    💼
                    ${escapeHTML(
                        person.service ||
                        ""
                    )}
                </p>

                <p>
                    ⏳
                    ${escapeHTML(
                        person.experience ||
                        ""
                    )}
                </p>

                <p>
                    💰
                    ${escapeHTML(
                        person.price ||
                        ""
                    )}
                </p>

                <p>
                    📂
                    ${escapeHTML(
                        person.category ||
                        ""
                    )}
                </p>

            </div>

        `;

        modalOpen("profileModal");
    };


$("profileClose")?.addEventListener(
    "click",
    () => modalClose("profileModal")
);


/* =========================================
   REVIEWS
========================================= */

function renderReviews() {

    const box =
        document.querySelector(
            "#reviewsGrid"
        );

    if (!box)
        return;

    if (!db.reviews.length) {

        box.innerHTML = `
            <div class="empty">

                <div>💬</div>

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

                <div class="review-top">

                    <div class="review-avatar">
                        ${escapeHTML(
                            review.client_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "C"
                        )}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                review.client_name
                            )}
                        </strong>

                        <div class="stars">
                            ${"★".repeat(
                                Number(
                                    review.rating || 0
                                )
                            )}
                        </div>

                    </div>

                </div>

                <p>
                    ${escapeHTML(
                        review.text
                    )}
                </p>

            </article>

        `).join("");
}


/* =========================================
   CLOSE MODALS ON BACKDROP
========================================= */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            function(e) {

                if (
                    e.target === this
                ) {
                    this.classList.remove(
                        "active"
                    );
                }

            }
        );

    });


/* =========================================
   ESC KEY
========================================= */

document.addEventListener(
    "keydown",
    function(e) {

        if (
            e.key !== "Escape"
        )
            return;

        document
            .querySelectorAll(
                ".modal.active"
            )
            .forEach(modal => {

                modal.classList.remove(
                    "active"
                );

            });

    }
);


/* =========================================
   NAVIGATION
========================================= */

document
    .querySelectorAll(
        '.nav a[href^="#"]'
    )
    .forEach(link => {

        link.addEventListener(
            "click",
            function(e) {

                const target =
                    document.querySelector(
                        this.getAttribute(
                            "href"
                        )
                    );

                if (!target)
                    return;

                e.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                $("nav")
                    ?.classList.remove(
                        "mobile"
                    );
            }
        );

    });


/* =========================================
   INITIAL LOAD
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        try {

            await loadData();

        } catch (error) {

            console.error(
                "INITIAL LOAD ERROR:",
                error
            );

        }

    }
);


/* =========================================================
   🌍 LANGUAGE SYSTEM
   TJ / RU / EN
========================================================= */

const SMM_LANG = {

    tg: {

        "Асосӣ":
            "Асосӣ",

        "SMM-щикҳо":
            "SMM-щикҳо",

        "AI":
            "AI",

        "Отзывҳо":
            "Отзывҳо",

        "Даромадан":
            "Даромадан",

        "Сабти ном":
            "Сабти ном",

        "🔎 Мутахассис пайдо кардан":
            "🔎 Мутахассис пайдо кардан",

        "🤖 Бо AI интихоб кардан":
            "🤖 Бо AI интихоб кардан",

        "Шумо кистед?":
            "Шумо кистед?",

        "Барои оғоз интихоб кунед.":
            "Барои оғоз интихоб кунед.",

        "👨‍💻 Ман SMM-щик ҳастам":
            "👨‍💻 Ман SMM-щик ҳастам",

        "🏢 Ман клиент ҳастам":
            "🏢 Ман клиент ҳастам",

        "МУТАХАССИСОН":
            "МУТАХАССИСОН",

        "SMM-щикҳои тасдиқшуда":
            "SMM-щикҳои тасдиқшуда",

        "✓ Тасдиқшуда":
            "✓ Тасдиқшуда",

        "Профил →":
            "Профил →",

        "Мутахассисони мувофиқ:":
            "Мутахассисони мувофиқ:",

        "Ҳоло мутахассис нест":
            "Ҳоло мутахассис нест",

        "💬 МУШТАРИЁН":
            "💬 МУШТАРИЁН",

        "Отзывҳои клиентҳо":
            "Отзывҳои клиентҳо",

        "⭐ Отзыв мондан":
            "⭐ Отзыв мондан",

        "Ҳоло отзыв нест":
            "Ҳоло отзыв нест",

        "Номи шумо":
            "Номи шумо",

        "Отзыви худро нависед...":
            "Отзыви худро нависед...",

        "⭐ Нигоҳ доштан":
            "⭐ Нигоҳ доштан",

        "Парол":
            "Парол",

        "Ворид шудан":
            "Ворид шудан",

        "Нест кардан":
            "Нест кардан",

        "Тасдиқ":
            "Тасдиқ",

        "Қабул кардан":
            "Қабул кардан",

        "Рад кардан":
            "Рад кардан",

        "Статус:":
            "Статус:"
    },


    ru: {

        "Асосӣ":
            "Главная",

        "SMM-щикҳо":
            "SMM-специалисты",

        "AI":
            "AI",

        "Отзывҳо":
            "Отзывы",

        "Даромадан":
            "Войти",

        "Сабти ном":
            "Регистрация",

        "🔎 Мутахассис пайдо кардан":
            "🔎 Найти специалиста",

        "🤖 Бо AI интихоб кардан":
            "🤖 Выбрать с помощью AI",

        "Шумо кистед?":
            "Кто вы?",

        "Барои оғоз интихоб кунед.":
            "Выберите вариант, чтобы начать.",

        "👨‍💻 Ман SMM-щик ҳастам":
            "👨‍💻 Я SMM-специалист",

        "🏢 Ман клиент ҳастам":
            "🏢 Я клиент",

        "МУТАХАССИСОН":
            "СПЕЦИАЛИСТЫ",

        "SMM-щикҳои тасдиқшуда":
            "Проверенные SMM-специалисты",

        "✓ Тасдиқшуда":
            "✓ Подтверждён",

        "Профил →":
            "Профиль →",

        "Мутахассисони мувофиқ:":
            "Подходящие специалисты:",

        "Ҳоло мутахассис нест":
            "Пока нет специалистов",

        "💬 МУШТАРИЁН":
            "💬 КЛИЕНТЫ",

        "Отзывҳои клиентҳо":
            "Отзывы клиентов",

        "⭐ Отзыв мондан":
            "⭐ Оставить отзыв",

        "Ҳоло отзыв нест":
            "Пока нет отзывов",

        "Номи шумо":
            "Ваше имя",

        "Отзыви худро нависед...":
            "Напишите свой отзыв...",

        "⭐ Нигоҳ доштан":
            "⭐ Сохранить",

        "Парол":
            "Пароль",

        "Ворид шудан":
            "Войти",

        "Нест кардан":
            "Удалить",

        "Тасдиқ":
            "Подтвердить",

        "Қабул кардан":
            "Принять",

        "Рад кардан":
            "Отклонить",

        "Статус:":
            "Статус:"
    },


    en: {

        "Асосӣ":
            "Home",

        "SMM-щикҳо":
            "SMM Specialists",

        "AI":
            "AI",

        "Отзывҳо":
            "Reviews",

        "Даромадан":
            "Login",

        "Сабти ном":
            "Sign Up",

        "🔎 Мутахассис пайдо кардан":
            "🔎 Find a Specialist",

        "🤖 Бо AI интихоб кардан":
            "🤖 Choose with AI",

        "Шумо кистед?":
            "Who are you?",

        "Барои оғоз интихоб кунед.":
            "Choose an option to get started.",

        "👨‍💻 Ман SMM-щик ҳастам":
            "👨‍💻 I am an SMM Specialist",

        "🏢 Ман клиент ҳастам":
            "🏢 I am a Client",

        "МУТАХАССИСОН":
            "SPECIALISTS",

        "SMM-щикҳои тасдиқшуда":
            "Verified SMM Specialists",

        "✓ Тасдиқшуда":
            "✓ Verified",

        "Профил →":
            "Profile →",

        "Мутахассисони мувофиқ:":
            "Matching specialists:",

        "Ҳоло мутахассис нест":
            "No specialists yet",

        "💬 МУШТАРИЁН":
            "💬 CLIENTS",

        "Отзывҳои клиентҳо":
            "Client Reviews",

        "⭐ Отзыв мондан":
            "⭐ Leave a Review",

        "Ҳоло отзыв нест":
            "No reviews yet",

        "Номи шумо":
            "Your Name",

        "Отзыви худро нависед...":
            "Write your review...",

        "⭐ Нигоҳ доштан":
            "⭐ Save",

        "Парол":
            "Password",

        "Ворид шудан":
            "Login",

        "Нест кардан":
            "Delete",

        "Тасдиқ":
            "Approve",

        "Қабул кардан":
            "Accept",

        "Рад кардан":
            "Reject",

        "Статус:":
            "Status:"
    }

};


let currentLanguage =
    localStorage.getItem(
        "smm_language"
    ) || "tg";


const originalText =
    new WeakMap();


const originalPlaceholder =
    new WeakMap();


function rememberLanguageElement(
    element
) {

    if (
        !originalText.has(
            element
        )
    ) {

        originalText.set(
            element,
            element.textContent.trim()
        );

    }

    if (
        element.hasAttribute(
            "placeholder"
        ) &&
        !originalPlaceholder.has(
            element
        )
    ) {

        originalPlaceholder.set(
            element,
            element.getAttribute(
                "placeholder"
            )
        );

    }

}


function translatePage(
    lang
) {

    if (
        !SMM_LANG[lang]
    )
        lang = "tg";

    currentLanguage = lang;

    document.documentElement.lang =
        lang;

    document
        .querySelectorAll(
            "body *"
        )
        .forEach(element => {

            if (
                element.tagName ===
                "SCRIPT" ||
                element.tagName ===
                "STYLE"
            )
                return;

            rememberLanguageElement(
                element
            );

            const original =
                originalText.get(
                    element
                );

            if (
                original &&
                SMM_LANG[lang][original]
            ) {

                element.textContent =
                    SMM_LANG[lang][original];

            }

            const placeholder =
                originalPlaceholder.get(
                    element
                );

            if (
                placeholder &&
                SMM_LANG[lang][placeholder]
            ) {

                element.setAttribute(
                    "placeholder",
                    SMM_LANG[lang][placeholder]
                );

            }

        });


    updateLanguageButton(
        lang
    );

    localStorage.setItem(
        "smm_language",
        lang
    );
}


function updateLanguageButton(
    lang
) {

    const button =
        $("languageBtn");

    if (!button)
        return;

    const labels = {

        tg:
            "🇹🇯 TJ",

        ru:
            "🇷🇺 RU",

        en:
            "🇬🇧 EN"
    };

    button.textContent =
        labels[lang];
}


/* =========================================
   LANGUAGE MENU
========================================= */

function setupLanguage() {

    const button =
        $("languageBtn");

    const menu =
        $("languageMenu");

    if (
        !button ||
        !menu
    )
        return;


    button.addEventListener(
        "click",
        function(e) {

            e.stopPropagation();

            menu.classList.toggle(
                "active"
            );

        }
    );


    menu
        .querySelectorAll(
            "[data-lang]"
        )
        .forEach(option => {

            option.addEventListener(
                "click",
                function(e) {

                    e.stopPropagation();

                    translatePage(
                        this.dataset.lang
                    );

                    menu.classList.remove(
                        "active"
                    );

                }
            );

        });


    document.addEventListener(
        "click",
        function() {

            menu.classList.remove(
                "active"
            );

        }
    );
}


/* =========================================
   DYNAMIC CONTENT
========================================= */

const languageObserver =
    new MutationObserver(
        mutations => {

            mutations.forEach(
                mutation => {

                    mutation
                        .addedNodes
                        .forEach(node => {

                            if (
                                node.nodeType !==
                                1
                            )
                                return;

                            node
                                .querySelectorAll?.(
                                    "*"
                                )
                                .forEach(
                                    element => {

                                        rememberLanguageElement(
                                            element
                                        );

                                    }
                                );

                        });

                }
            );

            translatePage(
                currentLanguage
            );
        }
    );


/* =========================================
   START LANGUAGE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupLanguage();

        translatePage(
            currentLanguage
        );

        languageObserver.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }
);
