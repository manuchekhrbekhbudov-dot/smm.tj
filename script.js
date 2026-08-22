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
                <h3>Ҳоло SMM-МУТАХАССИС нест</h3>
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
  const box = $("#reviewsList");

  if (!box) return;

  if (!db.reviews.length) {
    box.innerHTML = `
      <div class="empty-state">
        <div>⭐</div>
        <h3>Холо отзыв нест</h3>
        <p>Ҳанӯз ягон клиент отзыв нагузоштааст.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = db.reviews.map(review => `
    <div class="review-card">
      <strong>${escapeHTML(review.name)}</strong>

      <div class="stars">
        ${"⭐".repeat(review.rating || 5)}
      </div>

      <p>${escapeHTML(review.text)}</p>
    </div>
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

            status:
                "approved"
        };

        const { error } =
            await supabaseClient
                .from("reviews")
                .insert(review);

        if (error) {

            console.error(
                "REVIEW ERROR:",
                error
            );

            alert(
                "❌ Отзыв сабт нашуд."
            );

            return;
        }

        alert(
            "⭐ Отзыв қабул шуд ва дар сайт пайдо мешавад."
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

        if ($("adminLogin"))
            $("adminLogin").style.display = "block";

        if ($("adminDashboard"))
            $("adminDashboard").style.display = "none";
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

    if ($("smmCount"))
        $("smmCount").textContent =
            db.smm.length;

    if ($("clientCount"))
        $("clientCount").textContent =
            db.clients.length;

    if ($("requestCount"))
        $("requestCount").textContent =
            db.requests.length;

    if ($("reviewCount"))
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
                    🛠 ${escapeHTML(person.service)}
                </p>

                <p>
                    📱 ${escapeHTML(person.phone)}
                </p>

                <p>
                    📸 ${escapeHTML(
                        person.instagram || "—"
                    )}
                </p>

                <p>
                    Статус:
                    <b>
                        ${escapeHTML(person.status)}
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


/* =========================================
   APPROVE SMM
========================================= */

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
    };


/* =========================================
   DELETE SMM
========================================= */

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
    };


/* =========================================
   ADMIN CLIENTS
========================================= */
/* =========================================
   ADMIN CLIENTS
========================================= */

function renderAdminClients() {

    const box = $("adminClientList");

    if (!box)
        return;

    if (!db.clients.length) {

        box.innerHTML = `
            <div class="admin-item">
                <p>Ҳоло клиент нест.</p>
            </div>
        `;

        return;
    }

    box.innerHTML = db.clients.map(client => `

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
                📂 ${escapeHTML(client.category)}
            </p>

            <p>
                💬 ${escapeHTML(client.need)}
            </p>

            <div
                style="
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                    margin-top:12px;
                "
            >

                <button
                    class="btn btn-dark"
                    onclick="deleteClient('${client.id}')"
                >
                    🗑 Нест кардан
                </button>

            </div>

        </div>

    `).join("");
}


/* =========================================
   DELETE CLIENT
========================================= */

window.deleteClient = async function(id) {

    if (
        !confirm(
            "Ин клиентро нест кунем?"
        )
    )
        return;


    const { error } =
        await supabaseClient
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
};


/* =========================================
   ADMIN REQUESTS
========================================= */

function renderAdminRequests() {

    const box =
        $("adminRequestList");

    if (!box)
        return;


    if (!db.requests.length) {

        box.innerHTML = `
            <div class="admin-item">
                <p>Ҳоло дархост нест.</p>
            </div>
        `;

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
                    📱 ${escapeHTML(
                        request.phone
                    )}
                </p>

                <p>
                    💬 ${escapeHTML(
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


                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                        margin-top:12px;
                    "
                >

                    ${
                        request.status === "new"
                        ?
                        `
                            <button
                                class="btn btn-primary"
                                onclick="acceptRequest('${request.id}')"
                            >
                                ✓ Қабул кардан
                            </button>

                            <button
                                class="btn btn-dark"
                                onclick="rejectRequest('${request.id}')"
                            >
                                ✕ Рад кардан
                            </button>
                        `
                        :
                        ""
                    }


                    <button
                        class="btn btn-dark"
                        onclick="deleteRequest('${request.id}')"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

            </div>

        `).join("");
}


/* =========================================
   ACCEPT REQUEST
========================================= */

window.acceptRequest = async function(id) {

    const { error } =
        await supabaseClient
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
};


/* =========================================
   REJECT REQUEST
========================================= */

window.rejectRequest = async function(id) {

    const { error } =
        await supabaseClient
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
};


/* =========================================
   DELETE REQUEST
========================================= */

window.deleteRequest = async function(id) {

    if (
        !confirm(
            "Ин дархостро нест кунем?"
        )
    )
        return;


    const { error } =
        await supabaseClient
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
};


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

        dashboard.appendChild(box);
    }

    loadAllReviewsForAdmin(box);
}


async function loadAllReviewsForAdmin(box) {

    const {
        data,
        error
    } = await supabaseClient
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

        ${data.map(review => `

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
                    ${escapeHTML(review.text)}
                </p>

                <p>
                    Статус:
                    <b>
                        ${escapeHTML(review.status)}
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
                        review.status !== "approved"
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

        `).join("")}
    `;
}


/* =========================================
   APPROVE REVIEW
========================================= */

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
    };


/* =========================================
   DELETE REVIEW
========================================= */

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

                if (e.target === modal) {

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
   RENDER ALL
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
/* =========================================
   🌍 3 LANGUAGES — TJ / RU / EN
========================================= */

(function () {

    const translations = {

        /* =====================
           TAJIK
        ===================== */
        tg: {
            "Асосӣ": "Асосӣ",
            "SMM-щикҳо": "SMM-щикҳо",
            "Категорияҳо": "Категорияҳо",
            "AI": "AI",
            "Баррасиҳо": "Баррасиҳо",
            "Отзывы": "Баррасиҳо",
            "Даромадан": "Даромадан",
            "Сабти ном": "Сабти ном",

            "Платформаи рақами 1 барои SMM":
                "Платформаи рақами 1 барои SMM",

            "SMM-мутахассиси":
                "SMM-мутахассиси",

            "беҳтаринро":
                "беҳтаринро",

            "барои бизнеси худ пайдо кунед":
                "барои бизнеси худ пайдо кунед",

            "Мутахассиси мувофиқро аз рӯи таҷриба, рейтинг, баррасиҳо, нарх ва самти фаъолият пайдо кунед.":
                "Мутахассиси мувофиқро аз рӯи таҷриба, рейтинг, баррасиҳо, нарх ва самти фаъолият пайдо кунед.",

            "SMM-щик пайдо кардан":
                "SMM-щик пайдо кардан",

            "Бо ёрии AI интихоб кардан":
                "Бо ёрии AI интихоб кардан",

            "Ман SMM-щик ҳастам":
                "Ман SMM-щик ҳастам",

            "Ман бизнес дорам":
                "Ман бизнес дорам",

            "Хизматҳои худро пешниҳод кунед ва муштариён пайдо кунед.":
                "Хизматҳои худро пешниҳод кунед ва муштариён пайдо кунед.",

            "Барои бизнеси худ SMM-мутахассис пайдо кунед.":
                "Барои бизнеси худ SMM-мутахассис пайдо кунед.",

            "🔥 Беҳтаринҳо":
                "🔥 Беҳтаринҳо",

            "TOP":
                "TOP",

            "Ҳамаро дидан →":
                "Ҳамаро дидан →",

            "Баррасиҳои":
                "Баррасиҳои",

            "воқеӣ":
                "воқеӣ",

            "Платформа барои пайваст кардани бизнес ва SMM-мутахассисон.":
                "Платформа барои пайваст кардани бизнес ва SMM-мутахассисон.",

            "© 2026 SMM.TJ — Ҳама ҳуқуқҳо ҳифз шудаанд.":
                "© 2026 SMM.TJ — Ҳама ҳуқуқҳо ҳифз шудаанд."
        },


        /* =====================
           RUSSIAN
        ===================== */
        ru: {
            "Асосӣ": "Главная",
            "SMM-щикҳо": "SMM-специалисты",
            "Категорияҳо": "Категории",
            "AI": "AI",
            "Баррасиҳо": "Отзывы",
            "Отзывы": "Отзывы",
            "Даромадан": "Войти",
            "Сабти ном": "Регистрация",

            "Платформаи рақами 1 барои SMM":
                "Платформа №1 для SMM",

            "SMM-мутахассиси":
                "Найдите",

            "беҳтаринро":
                "лучшего SMM-специалиста",

            "барои бизнеси худ пайдо кунед":
                "для своего бизнеса",

            "Мутахассиси мувофиқро аз рӯи таҷриба, рейтинг, баррасиҳо, нарх ва самти фаъолият пайдо кунед.":
                "Найдите подходящего специалиста по опыту, рейтингу, отзывам, цене и направлению работы.",

            "SMM-щик пайдо кардан":
                "🔎 Найти SMM-специалиста",

            "Бо ёрии AI интихоб кардан":
                "🤖 Выбрать с помощью AI",

            "Ман SMM-щик ҳастам":
                "Я SMM-специалист",

            "Ман бизнес дорам":
                "У меня есть бизнес",

            "Хизматҳои худро пешниҳод кунед ва муштариён пайдо кунед.":
                "Предлагайте свои услуги и находите клиентов.",

            "Барои бизнеси худ SMM-мутахассис пайдо кунед.":
                "Найдите SMM-специалиста для своего бизнеса.",

            "🔥 Беҳтаринҳо":
                "🔥 Лучшие",

            "TOP":
                "TOP",

            "Ҳамаро дидан →":
                "Посмотреть всех →",

            "Баррасиҳои":
                "Реальные",

            "воқеӣ":
                "отзывы",

            "Платформа барои пайваст кардани бизнес ва SMM-мутахассисон.":
                "Платформа для связи бизнеса и SMM-специалистов.",

            "© 2026 SMM.TJ — Ҳама ҳуқуқҳо ҳифз шудаанд.":
                "© 2026 SMM.TJ — Все права защищены."
        },


        /* =====================
           ENGLISH
        ===================== */
        en: {
            "Асосӣ": "Home",
            "SMM-щикҳо": "SMM Specialists",
            "Категорияҳо": "Categories",
            "AI": "AI",
            "Баррасиҳо": "Reviews",
            "Отзывы": "Reviews",
            "Даромадан": "Login",
            "Сабти ном": "Sign up",

            "Платформаи рақами 1 барои SMM":
                "The #1 SMM Platform",

            "SMM-мутахассиси":
                "Find the",

            "беҳтаринро":
                "best SMM specialist",

            "барои бизнеси худ пайдо кунед":
                "for your business",

            "Мутахассиси мувофиқро аз рӯи таҷриба, рейтинг, баррасиҳо, нарх ва самти фаъолият пайдо кунед.":
                "Find the right specialist by experience, rating, reviews, price and field of work.",

            "SMM-щик пайдо кардан":
                "🔎 Find an SMM Specialist",

            "Бо ёрии AI интихоб кардан":
                "🤖 Choose with AI",

            "Ман SMM-щик ҳастам":
                "I am an SMM specialist",

            "Ман бизнес дорам":
                "I have a business",

            "Хизматҳои худро пешниҳод кунед ва муштариён пайдо кунед.":
                "Offer your services and find clients.",

            "Барои бизнеси худ SMM-мутахассис пайдо кунед.":
                "Find an SMM specialist for your business.",

            "🔥 Беҳтаринҳо":
                "🔥 Top Specialists",

            "TOP":
                "TOP",

            "Ҳамаро дидан →":
                "View all →",

            "Баррасиҳои":
                "Real",

            "воқеӣ":
                "reviews",

            "Платформа барои пайваст кардани бизнес ва SMM-мутахассисон.":
                "A platform connecting businesses with SMM specialists.",

            "© 2026 SMM.TJ — Ҳама ҳуқуқҳо ҳифз шудаанд.":
                "© 2026 SMM.TJ — All rights reserved."
        }

    };


    /* =========================================
       LANGUAGE BUTTON
    ========================================= */

    function createLanguageButton() {

        const headerButtons =
            document.querySelector(".header-buttons");

        if (!headerButtons)
            return;

        if (document.getElementById("languageSelect"))
            return;

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "language-wrapper";

        wrapper.innerHTML = `
            <select id="languageSelect" class="language-select">
                <option value="tg">🇹🇯 TJ</option>
                <option value="ru">🇷🇺 RU</option>
                <option value="en">🇬🇧 EN</option>
            </select>
        `;

        headerButtons.prepend(wrapper);

        const select =
            document.getElementById("languageSelect");

        select.addEventListener(
            "change",
            function () {

                changeLanguage(this.value);

            }
        );
    }


    /* =========================================
       TRANSLATE PAGE
    ========================================= */

    function translatePage(lang) {

        const dictionary =
            translations[lang];

        if (!dictionary)
            return;


        const walker =
            document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT
            );


        const nodes = [];

        let node;

        while (
            node = walker.nextNode()
        ) {

            const parent =
                node.parentElement;

            if (!parent)
                continue;

            const tag =
                parent.tagName;

            if (
                tag === "SCRIPT" ||
                tag === "STYLE" ||
                tag === "NOSCRIPT"
            )
                continue;

            nodes.push(node);
        }


        nodes.forEach(function (textNode) {

            const original =
                textNode.textContent.trim();

            if (!original)
                return;


            if (
                Object.prototype.hasOwnProperty.call(
                    dictionary,
                    original
                )
            ) {

                const translated =
                    dictionary[original];

                textNode.textContent =
                    textNode.textContent.replace(
                        original,
                        translated
                    );
            }

        });


        document.documentElement.lang =
            lang === "tg"
                ? "tg"
                : lang;


        localStorage.setItem(
            "smm_language",
            lang
        );


        const select =
            document.getElementById(
                "languageSelect"
            );

        if (select)
            select.value = lang;
    }


    /* =========================================
       CHANGE LANGUAGE
    ========================================= */

    window.changeLanguage =
        function (lang) {

            /*
             * Барои он ки ҳангоми
             * TJ → RU → EN → TJ
             * матнҳо гум нашаванд,
             * саҳифаро reload мекунем.
             */

            localStorage.setItem(
                "smm_language",
                lang
            );

            location.reload();
        };


    /* =========================================
       START
    ========================================= */

    function initLanguages() {

        createLanguageButton();

        const savedLanguage =
            localStorage.getItem(
                "smm_language"
            ) || "tg";


        if (
            savedLanguage === "tg"
        ) {

            const select =
                document.getElementById(
                    "languageSelect"
                );

            if (select)
                select.value = "tg";

            return;
        }


        translatePage(
            savedLanguage
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initLanguages
        );

    } else {

        initLanguages();

    }

})();
/* =========================================
   LANGUAGE BUTTON
========================================= */

setTimeout(() => {

    if (document.getElementById("languageBtn")) return;

    const header = document.querySelector(".header");

    if (!header) {
        console.log("❌ Header not found");
        return;
    }

    const btn = document.createElement("button");

    btn.id = "languageBtn";
    btn.type = "button";
    btn.textContent = "🇹🇯 TJ";

    btn.style.cssText = `
        padding: 9px 14px;
        margin-left: 10px;
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 12px;
        background: rgba(255,255,255,.08);
        color: white;
        font-weight: 700;
        cursor: pointer;
        z-index: 9999;
    `;

    btn.onclick = () => {

        const current =
            localStorage.getItem("smm_language") || "tg";

        const next =
            current === "tg"
                ? "ru"
                : current === "ru"
                    ? "en"
                    : "tg";

        localStorage.setItem(
            "smm_language",
            next
        );

        location.reload();
    };

    header.appendChild(btn);

    console.log("✅ Language button added");

}, 2000);
