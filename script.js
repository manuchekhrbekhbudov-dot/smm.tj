const SUPABASE_URL = "https://lcldaingzicxbottlznq.supabase.co";
const SUPABASE_KEY = "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("SMM.TJ → Supabase connected");

/* =========================================
   SMM.TJ — SUPABASE
========================================= */

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


/* =========================================
   ROLE BUTTONS
========================================= */

function openSmmForm() {

    modalOpen("authModal");

    $("roleSelection").style.display = "none";

    $("smmForm").classList.add("active");

    $("clientForm").classList.remove("active");
}


function openClientForm() {

    modalOpen("authModal");

    $("roleSelection").style.display = "none";

    $("clientForm").classList.add("active");

    $("smmForm").classList.remove("active");
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

            status: "pending"
        };


        const { error } =
            await supabaseClient
                .from("smm_profiles")
                .insert(person);


        if (button)
            button.disabled = false;


        if (error) {

            console.error(error);

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


        const { data, error } =
            await supabaseClient
                .from("clients")
                .insert(client)
                .select()
                .single();


        if (error) {

            if (button)
                button.disabled = false;

            console.error(error);

            alert(
                "❌ Хато шуд. Дархост сабт нашуд."
            );

            return;
        }


        /*
         * Ҳамзамон request месозем,
         * то Admin онро ҳамчун дархост бинад.
         */

        const request = {

            client_id: data.id,

            client_name: client.name,

            phone: client.phone,

            message: client.need,

            specialist_name: null,

            status: "new"
        };


        const requestResult =
            await supabaseClient
                .from("requests")
                .insert(request);


        if (requestResult.error)
            console.error(
                "REQUEST ERROR:",
                requestResult.error
            );


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
   FIND BUTTON
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


/* AI CATEGORY */

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
                    Барои
                    ${escapeHTML(category)}
                    SMM-щики тасдиқшуда
                    пайдо нашуд.
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
                    border:1px solid
                    rgba(255,255,255,.1);
                    border-radius:15px;
                "
            >

                <strong>
                    ${escapeHTML(person.name)}
                </strong>

                <p>
                    🛠
                    ${escapeHTML(person.service)}
                </p>

                <p>
                    🎯
                    ${escapeHTML(person.experience)}
                </p>

                <p>
                    💰
                    ${escapeHTML(person.price)}
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


/* =========================================
   SPECIALISTS
========================================= */

function renderSpecialists() {

    const box =
        $("specialistsList");

    if (!box)
        return;


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
                    Ҳоло ягон мутахассиси
                    тасдиқшуда вуҷуд надорад.
                </p>

            </div>

        `;

        return;
    }


    box.innerHTML =
        people.map(person => `

            <article
                class="specialist-card"
            >

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
                    🛠
                    ${escapeHTML(person.service)}
                </p>

                <p>
                    🎯
                    ${escapeHTML(person.experience)}
                </p>

                <p>
                    💰
                    ${escapeHTML(person.price)}
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


/* =========================================
   PROFILE
========================================= */

window.openProfile =
    function(id) {

        const person =
            db.smm.find(
                x => x.id === id
            );


        if (!person)
            return;


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
            person.price +
            "\n" +
            "Instagram: " +
            (person.instagram || "—") +
            "\n" +
            "Телефон: " +
            person.phone
        );
    };


/* =========================================
   REVIEWS
========================================= */

function renderReviews() {

    const box =
        $("reviewsList");

    if (!box)
        return;


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

            <article
                class="review-card"
            >

                <div>
                    ${"⭐".repeat(
                        Number(review.rating)
                    )}
                </div>

                <p>
                    «${escapeHTML(
                        review.text
                    )}»
                </p>

                <strong>
                    ${escapeHTML(
                        review.client_name ||
                        review.name ||
                        "Клиент"
                    )}
                </strong>

            </article>

        `).join("");
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

            status: "pending"
        };


        const { error } =
            await supabaseClient
                .from("reviews")
                .insert(review);


        if (error) {

            console.error(error);

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

const ADMIN_PASSWORD =
    "admin123";


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


/* =========================================
   ADMIN DASHBOARD
========================================= */

function renderAdmin() {

    if (!$("adminDashboard"))
        return;


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

    renderAdminReviews();
}


/* =========================================
   ADMIN SMM
========================================= */

function renderAdminSmm() {

    const box =
        $("adminSmmList");

    if (!box)
        return;


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
                    🛠
                    ${escapeHTML(person.service)}
                </p>

                <p>
                    📱
                    ${escapeHTML(person.phone)}
                </p>

                <p>
                    📸
                    ${escapeHTML(
                        person.instagram || "—"
                    )}
                </p>

                <p>
                    Статус:
                    <b>
                        ${escapeHTML(
                            person.status
                        )}
                    </b>
                </p>

                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                        margin-top:10px;
                    "
                >

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


/* APPROVE SMM */

window.approveSmm =
    async function(id) {

        const { error } =
            await supabaseClient
                .from("smm_profiles")
                .update({
                    status: "approved"
                })
                .eq("id", id);


        if (error) {

            console.error(error);

            alert(
                "❌ Тасдиқ нашуд."
            );

            return;
        }


        alert(
            "✅ SMM-щик тасдиқ шуд."
        );


        await loadData();

        renderAdmin();
    };


/* DELETE SMM */

window.deleteSmm =
    async function(id) {

        if (
            !confirm(
                "Ин SMM-щикро нест кунем?"
            )
        )
            return;


        const { error } =
            await supabaseClient
                .from("smm_profiles")
                .delete()
                .eq("id", id);


        if (error) {

            console.error(error);

            alert(
                "❌ Нест карда нашуд."
            );

            return;
        }


        await loadData();

        renderAdmin();
    };


/* =========================================
   ADMIN CLIENTS
========================================= */

function renderAdminClients() {

    const box =
        $("adminClientList");

    if (!box)
        return;


    if (!db.clients.length) {

        box.innerHTML =
            "<p>Ҳоло клиент нест.</p>";

        return;
    }


    box.innerHTML =
        db.clients.map(client => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(
                        client.name
                    )}
                </strong>

                <p>
                    🏢
                    ${escapeHTML(
                        client.business
                    )}
                </p>

                <p>
                    📱
                    ${escapeHTML(
                        client.phone
                    )}
                </p>

                <p>
                    📂
                    ${escapeHTML(
                        client.category
                    )}
                </p>

                <p>
                    💬
                    ${escapeHTML(
                        client.need
                    )}
                </p>

            </div>

        `).join("");
}


/* =========================================
   ADMIN REQUESTS
========================================= */

function renderAdminRequests() {

    const box =
        $("adminRequestList");

    if (!box)
        return;


    if (!db.requests.length) {

        box.innerHTML =
            "<p>Ҳоло дархост нест.</p>";

        return;
    }


    box.innerHTML =
        db.requests.map(request => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(
                        request.client_name ||
                        request.name ||
                        "Клиент"
                    )}
                </strong>

                <p>
                    📱
                    ${escapeHTML(
                        request.phone
                    )}
                </p>

                <p>
                    💬
                    ${escapeHTML(
                        request.message
                    )}
                </p>

                <p>
                    Статус:
                    <b>
                        ${escapeHTML(
                            request.status
                        )}
                    </b>
                </p>

            </div>

        `).join("");
}


/* =========================================
   ADMIN REVIEWS
========================================= */

function renderAdminReviews() {

    const dashboard =
        $("adminDashboard");

    if (!dashboard)
        return;


    let box =
        $("adminReviewList");


    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "adminReviewList";

        box.className =
            "admin-list";


        const headings =
            dashboard.querySelectorAll("h3");

        const lastHeading =
            headings[headings.length - 1];


        if (lastHeading)
            lastHeading.after(box);
        else
            dashboard.appendChild(box);
    }


    loadAllReviewsForAdmin(box);
}


async function loadAllReviewsForAdmin(box) {

    const { data, error } =
        await supabaseClient
            .from("reviews")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(error);

        box.innerHTML =
            "<p>Хатои гирифтани отзывҳо.</p>";

        return;
    }


    if (!data.length) {

        box.innerHTML =
            "<p>Ҳоло отзыв нест.</p>";

        return;
    }


    box.innerHTML = `

        <h3 style="margin-top:25px">
            ⭐ Отзывҳо
        </h3>

        ${
            data.map(review => `

                <div class="admin-item">

                    <strong>
                        ${escapeHTML(
                            review.client_name ||
                            review.name ||
                            "Клиент"
                        )}
                    </strong>

                    <p>
                        ${"⭐".repeat(
                            Number(review.rating)
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            review.text
                        )}
                    </p>

                    <p>
                        Статус:
                        <b>
                            ${escapeHTML(
                                review.status
                            )}
                        </b>
                    </p>

                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                        "
                    >

                        ${
                            review.status !==
                            "approved"
                            ?
                            `
                            <button
                                class="btn btn-primary"
                                onclick="approveReview('${review.id}')"
                            >
                                ✓ Тасдиқ
                            </button>
                            `
                            :
                            ""
                        }

                        <button
                            class="btn btn-dark"
                            onclick="deleteReview('${review.id}')"
                        >
                            🗑 Нест кардан
                        </button>

                    </div>

                </div>

            `).join("")
        }
    `;
}


/* APPROVE REVIEW */

window.approveReview =
    async function(id) {

        const { error } =
            await supabaseClient
                .from("reviews")
                .update({
                    status: "approved"
                })
                .eq("id", id);


        if (error) {

            console.error(error);

            alert(
                "❌ Отзыв тасдиқ нашуд."
            );

            return;
        }


        alert(
            "⭐ Отзыв тасдиқ шуд."
        );


        await loadData();

        renderAdmin();
    };


/* DELETE REVIEW */

window.deleteReview =
    async function(id) {

        if (
            !confirm(
                "Ин отзывро нест кунем?"
            )
        )
            return;


        const { error } =
            await supabaseClient
                .from("reviews")
                .delete()
                .eq("id", id);


        if (error) {

            console.error(error);

            alert(
                "❌ Отзыв нест нашуд."
            );

            return;
        }


        await loadData();

        renderAdmin();
    };


/* =========================================
   MODAL BACKGROUND
========================================= */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            function(e) {

                if (
                    e.target === modal
                ) {

                    modal.classList.remove(
                        "active"
                    );
                }

            }
        );

    });


/* =========================================
   ESC
========================================= */

document.addEventListener(
    "keydown",
    e => {

        if (e.key !== "Escape")
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
   RENDER
========================================= */

function renderAll() {

    renderSpecialists();

    renderReviews();

    renderAdmin();
}


/* =========================================
   START
========================================= */

console.log(
    "🚀 SMM.TJ starting..."
);

loadData();
