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
/* =========================================================
   🌍 SMM.TJ — FULL 3 LANGUAGE SYSTEM
   TJ / RU / EN
========================================================= */

const SMM_LANG = {

    tg: {

        /* HEADER */
        "Асосӣ": "Асосӣ",
        "SMM-щикҳо": "SMM-щикҳо",
        "AI": "AI",
        "Отзывҳо": "Отзывҳо",
        "Даромадан": "Даромадан",
        "Сабти ном": "Сабти ном",

        /* HERO */
        "✦ Платформаи SMM Тоҷикистон":
            "✦ Платформаи SMM Тоҷикистон",

        "SMM-мутахассиси мувофиқро пайдо кун":
            "SMM-мутахассиси мувофиқро пайдо кун",

        "SMM.TJ бизнесҳоро бо SMM-мутахассисон пайваст мекунад.":
            "SMM.TJ бизнесҳоро бо SMM-мутахассисон пайваст мекунад.",

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

        /* SPECIALISTS */
        "МУТАХАССИСОН":
            "МУТАХАССИСОН",

        "SMM-щикҳои тасдиқшуда":
            "SMM-щикҳои тасдиқшуда",

        "Ҳоло SMM-щик нест":
            "Ҳоло SMM-щик нест",

        "Ҳоло ягон мутахассиси тасдиқшуда вуҷуд надорад.":
            "Ҳоло ягон мутахассиси тасдиқшуда вуҷуд надорад.",

        "✓ Тасдиқшуда":
            "✓ Тасдиқшуда",

        "Профил →":
            "Профил →",

        /* AI */
        "🤖 SMM.TJ AI":
            "🤖 SMM.TJ AI",

        "Мутахассиси мувофиқ пайдо кун":
            "Мутахассиси мувофиқ пайдо кун",

        "AI барои интихоби SMM-мутахассис кӯмак мекунад.":
            "AI барои интихоби SMM-мутахассис кӯмак мекунад.",

        "AI-ро оғоз кардан →":
            "AI-ро оғоз кардан →",

        "Категорияи бизнесро интихоб кунед.":
            "Категорияи бизнесро интихоб кунед.",

        "Мутахассисони мувофиқ:":
            "Мутахассисони мувофиқ:",

        "Ҳоло мутахассис нест":
            "Ҳоло мутахассис нест",

        /* REVIEWS */
        "💬 МУШТАРИЁН":
            "💬 МУШТАРИЁН",

        "Отзывҳои клиентҳо":
            "Отзывҳои клиентҳо",

        "⭐ Отзыв мондан":
            "⭐ Отзыв мондан",

        "Ҳоло отзыв нест":
            "Ҳоло отзыв нест",

        "Ҳанӯз ягон клиент отзыв нагузоштааст.":
            "Ҳанӯз ягон клиент отзыв нагузоштааст.",

        /* FOOTER */
        "Платформаи SMM Тоҷикистон":
            "Платформаи SMM Тоҷикистон",

        "👑 Admin Panel":
            "👑 Admin Panel",

        /* AUTH */
        "Нақши худро интихоб кунед.":
            "Нақши худро интихоб кунед.",

        "Ном ва насаб":
            "Ном ва насаб",

        "Телефон":
            "Телефон",

        "Instagram":
            "Instagram",

        "Хизматрасонӣ":
            "Хизматрасонӣ",

        "Таҷриба":
            "Таҷриба",

        "Нарх":
            "Нарх",

        "Категория":
            "Категория",

        "Фиристодан →":
            "Фиристодан →",

        "Номи бизнес":
            "Номи бизнес",

        "Чӣ хизмат лозим?":
            "Чӣ хизмат лозим?",

        "Дархост фиристодан →":
            "Дархост фиристодан →",

        /* CATEGORIES */
        "Тарабхона":
            "Тарабхона",

        "Либос":
            "Либос",

        "Зебоӣ":
            "Зебоӣ",

        "Дӯкон":
            "Дӯкон",

        "Маориф":
            "Маориф",

        "Хизматрасонӣ":
            "Хизматрасонӣ",

        /* REVIEW */
        "⭐ Отзыв мондан":
            "⭐ Отзыв мондан",

        "Номи шумо":
            "Номи шумо",

        "Отзыви худро нависед...":
            "Отзыви худро нависед...",

        "⭐ Нигоҳ доштан":
            "⭐ Нигоҳ доштан",

        /* ADMIN */
        "👑 Admin Panel":
            "👑 Admin Panel",

        "Барои ворид шудан паролро навис.":
            "Барои ворид шудан паролро навис.",

        "Парол":
            "Парол",

        "Ворид шудан":
            "Ворид шудан",

        "👑 Admin Dashboard":
            "👑 Admin Dashboard",

        "SMM":
            "SMM",

        "Клиент":
            "Клиент",

        "Дархост":
            "Дархост",

        "Отзыв":
            "Отзыв",

        "👨‍💻 SMM-щикҳо":
            "👨‍💻 SMM-щикҳо",

        "🏢 Клиентҳо":
            "🏢 Клиентҳо",

        "📩 Дархостҳо":
            "📩 Дархостҳо",

        "Нест кардан":
            "Нест кардан",

        "Тасдиқ":
            "Тасдиқ",

        "Статус:":
            "Статус:",

        "Ҳоло SMM-щик нест.":
            "Ҳоло SMM-щик нест.",

        "Ҳоло клиент нест.":
            "Ҳоло клиент нест.",

        "Ҳоло дархост нест.":
            "Ҳоло дархост нест.",

        "Ҳоло отзыв нест.":
            "Ҳоло отзыв нест."
    },


    /* =====================================================
       🇷🇺 RUSSIAN
    ===================================================== */

    ru: {

        "Асосӣ": "Главная",
        "SMM-щикҳо": "SMM-специалисты",
        "AI": "AI",
        "Отзывҳо": "Отзывы",
        "Даромадан": "Войти",
        "Сабти ном": "Регистрация",

        "✦ Платформаи SMM Тоҷикистон":
            "✦ SMM-платформа Таджикистана",

        "SMM-мутахассиси мувофиқро пайдо кун":
            "Найди подходящего SMM-специалиста",

        "SMM.TJ бизнесҳоро бо SMM-мутахассисон пайваст мекунад.":
            "SMM.TJ соединяет бизнес с SMM-специалистами.",

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

        "Ҳоло SMM-щик нест":
            "Пока нет SMM-специалистов",

        "Ҳоло ягон мутахассиси тасдиқшуда вуҷуд надорад.":
            "Пока нет ни одного подтверждённого специалиста.",

        "✓ Тасдиқшуда":
            "✓ Подтверждён",

        "Профил →":
            "Профиль →",

        "🤖 SMM.TJ AI":
            "🤖 SMM.TJ AI",

        "Мутахассиси мувофиқ пайдо кун":
            "Найди подходящего специалиста",

        "AI барои интихоби SMM-мутахассис кӯмак мекунад.":
            "AI поможет выбрать подходящего SMM-специалиста.",

        "AI-ро оғоз кардан →":
            "Запустить AI →",

        "Категорияи бизнесро интихоб кунед.":
            "Выберите категорию бизнеса.",

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

        "Ҳанӯз ягон клиент отзыв нагузоштааст.":
            "Пока ни один клиент не оставил отзыв.",

        "Платформаи SMM Тоҷикистон":
            "SMM-платформа Таджикистана",

        "👑 Admin Panel":
            "👑 Админ-панель",

        "Нақши худро интихоб кунед.":
            "Выберите свою роль.",

        "Ном ва насаб":
            "Имя и фамилия",

        "Телефон":
            "Телефон",

        "Instagram":
            "Instagram",

        "Хизматрасонӣ":
            "Услуга",

        "Таҷриба":
            "Опыт",

        "Нарх":
            "Цена",

        "Категория":
            "Категория",

        "Фиристодан →":
            "Отправить →",

        "Номи бизнес":
            "Название бизнеса",

        "Чӣ хизмат лозим?":
            "Какая услуга вам нужна?",

        "Дархост фиристодан →":
            "Отправить заявку →",

        "Тарабхона":
            "Ресторан",

        "Либос":
            "Одежда",

        "Зебоӣ":
            "Красота",

        "Дӯкон":
            "Магазин",

        "Маориф":
            "Образование",

        "Хизматрасонӣ":
            "Услуги",

        "Номи шумо":
            "Ваше имя",

        "Отзыви худро нависед...":
            "Напишите свой отзыв...",

        "⭐ Нигоҳ доштан":
            "⭐ Сохранить",

        "Барои ворид шудан паролро навис.":
            "Введите пароль для входа.",

        "Парол":
            "Пароль",

        "Ворид шудан":
            "Войти",

        "👑 Admin Dashboard":
            "👑 Панель администратора",

        "SMM":
            "SMM",

        "Клиент":
            "Клиенты",

        "Дархост":
            "Заявки",

        "Отзыв":
            "Отзывы",

        "👨‍💻 SMM-щикҳо":
            "👨‍💻 SMM-специалисты",

        "🏢 Клиентҳо":
            "🏢 Клиенты",

        "📩 Дархостҳо":
            "📩 Заявки",

        "Нест кардан":
            "Удалить",

        "Тасдиқ":
            "Подтвердить",

        "Статус:":
            "Статус:",

        "Ҳоло SMM-щик нест.":
            "Пока нет SMM-специалистов.",

        "Ҳоло клиент нест.":
            "Пока нет клиентов.",

        "Ҳоло дархост нест.":
            "Пока нет заявок.",

        "Ҳоло отзыв нест.":
            "Пока нет отзывов."
    },


    /* =====================================================
       🇬🇧 ENGLISH
    ===================================================== */

    en: {

        "Асосӣ": "Home",
        "SMM-щикҳо": "SMM Specialists",
        "AI": "AI",
        "Отзывҳо": "Reviews",
        "Даромадан": "Login",
        "Сабти ном": "Sign Up",

        "✦ Платформаи SMM Тоҷикистон":
            "✦ SMM Platform of Tajikistan",

        "SMM-мутахассиси мувофиқро пайдо кун":
            "Find the right SMM specialist",

        "SMM.TJ бизнесҳоро бо SMM-мутахассисон пайваст мекунад.":
            "SMM.TJ connects businesses with SMM specialists.",

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

        "Ҳоло SMM-щик нест":
            "No SMM specialists yet",

        "Ҳоло ягон мутахассиси тасдиқшуда вуҷуд надорад.":
            "There are no verified specialists yet.",

        "✓ Тасдиқшуда":
            "✓ Verified",

        "Профил →":
            "Profile →",

        "🤖 SMM.TJ AI":
            "🤖 SMM.TJ AI",

        "Мутахассиси мувофиқ пайдо кун":
            "Find the right specialist",

        "AI барои интихоби SMM-мутахассис кӯмак мекунад.":
            "AI helps you choose the right SMM specialist.",

        "AI-ро оғоз кардан →":
            "Start AI →",

        "Категорияи бизнесро интихоб кунед.":
            "Choose your business category.",

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

        "Ҳанӯз ягон клиент отзыв нагузоштааст.":
            "No client has left a review yet.",

        "Платформаи SMM Тоҷикистон":
            "SMM Platform of Tajikistan",

        "👑 Admin Panel":
            "👑 Admin Panel",

        "Нақши худро интихоб кунед.":
            "Choose your role.",

        "Ном ва насаб":
            "Full Name",

        "Телефон":
            "Phone",

        "Instagram":
            "Instagram",

        "Хизматрасонӣ":
            "Service",

        "Таҷриба":
            "Experience",

        "Нарх":
            "Price",

        "Категория":
            "Category",

        "Фиристодан →":
            "Submit →",

        "Номи бизнес":
            "Business Name",

        "Чӣ хизмат лозим?":
            "What service do you need?",

        "Дархост фиристодан →":
            "Send Request →",

        "Тарабхона":
            "Restaurant",

        "Либос":
            "Fashion",

        "Зебоӣ":
            "Beauty",

        "Дӯкон":
            "Shop",

        "Маориф":
            "Education",

        "Хизматрасонӣ":
            "Services",

        "Номи шумо":
            "Your Name",

        "Отзыви худро нависед...":
            "Write your review...",

        "⭐ Нигоҳ доштан":
            "⭐ Save",

        "Барои ворид шудан паролро навис.":
            "Enter the password to continue.",

        "Парол":
            "Password",

        "Ворид шудан":
            "Login",

        "👑 Admin Dashboard":
            "👑 Admin Dashboard",

        "SMM":
            "SMM",

        "Клиент":
            "Clients",

        "Дархост":
            "Requests",

        "Отзыв":
            "Reviews",

        "👨‍💻 SMM-щикҳо":
            "👨‍💻 SMM Specialists",

        "🏢 Клиентҳо":
            "🏢 Clients",

        "📩 Дархостҳо":
            "📩 Requests",

        "Нест кардан":
            "Delete",

        "Тасдиқ":
            "Approve",

        "Статус:":
            "Status:",

        "Ҳоло SMM-щик нест.":
            "No SMM specialists yet.",

        "Ҳоло клиент нест.":
            "No clients yet.",

        "Ҳоло дархост нест.":
            "No requests yet.",

        "Ҳоло отзыв нест.":
            "No reviews yet."
    }
};


/* =========================================================
   SAVE ORIGINAL TEXT
========================================================= */

function normalizeText(text) {
    return text
        .replace(/\s+/g, " ")
        .trim();
}


function collectLanguageElements() {

    document
        .querySelectorAll("body *")
        .forEach(element => {

            if (
                element.tagName === "SCRIPT" ||
                element.tagName === "STYLE"
            ) {
                return;
            }

            if (
                element.children.length === 0
            ) {

                const text =
                    normalizeText(
                        element.textContent
                    );

                if (
                    text &&
                    Object.values(SMM_LANG.tg)
                        .includes(text)
                ) {
                    element.dataset.langOriginal =
                        text;
                }

                if (
                    text &&
                    SMM_LANG.tg[text]
                ) {
                    element.dataset.langOriginal =
                        text;
                }
            }
        });
}


/* =========================================================
   TRANSLATE PLACEHOLDERS
========================================================= */

function translateInputs(lang) {

    const dict = SMM_LANG[lang];

    document
        .querySelectorAll(
            "input[placeholder], textarea[placeholder]"
        )
        .forEach(input => {

            const original =
                input.dataset.langPlaceholder ||
                input.getAttribute("placeholder");

            if (!input.dataset.langPlaceholder) {
                input.dataset.langPlaceholder =
                    original;
            }

            if (dict[original]) {
                input.placeholder =
                    dict[original];
            }
        });
}


/* =========================================================
   TRANSLATE PAGE
========================================================= */

function applySmmLanguage(lang) {

    if (!SMM_LANG[lang]) {
        lang = "tg";
    }

    const dict = SMM_LANG[lang];

    document.documentElement.lang =
        lang;

    collectLanguageElements();

    document
        .querySelectorAll(
            "[data-lang-original]"
        )
        .forEach(element => {

            const original =
                element.dataset.langOriginal;

            if (dict[original]) {
                element.textContent =
                    dict[original];
            }
        });

    translateInputs(lang);

    localStorage.setItem(
        "smm_language",
        lang
    );

    updateLanguageButtons(lang);
}


/* =========================================================
   LANGUAGE BUTTONS
========================================================= */

function updateLanguageButtons(lang) {

    const names = {
        tg: "🇹🇯 TJ",
        ru: "🇷🇺 RU",
        en: "🇬🇧 EN"
    };

    const main =
        document.getElementById(
            "languageBtn"
        );

    if (main) {
        main.textContent =
            names[lang];
    }

    document
        .querySelectorAll("[data-lang]")
        .forEach(button => {

            if (
                button.dataset.lang === lang
            ) {
                button.classList.add(
                    "active"
                );
            } else {
                button.classList.remove(
                    "active"
                );
            }
        });
}


/* =========================================================
   LANGUAGE MENU
========================================================= */

function setupLanguageMenu() {

    const languageBtn =
        document.getElementById(
            "languageBtn"
        );

    const languageMenu =
        document.getElementById(
            "languageMenu"
        );

    if (languageBtn && languageMenu) {

        languageBtn.addEventListener(
            "click",
            function(e) {

                e.stopPropagation();

                languageMenu.classList.toggle(
                    "active"
                );
            }
        );
    }

    document
        .querySelectorAll("[data-lang]")
        .forEach(button => {

            button.addEventListener(
                "click",
                function(e) {

                    e.stopPropagation();

                    const lang =
                        this.dataset.lang;

                    applySmmLanguage(lang);

                    if (languageMenu) {
                        languageMenu.classList.remove(
                            "active"
                        );
                    }
                }
            );
        });

    document.addEventListener(
        "click",
        function() {

            if (languageMenu) {
                languageMenu.classList.remove(
                    "active"
                );
            }

        }
    );
}


/* =========================================================
   ALERT TRANSLATIONS
========================================================= */

const SMM_ALERTS = {

    tg: {
        "❌ Хато шуд. Маълумот сабт нашуд.":
            "❌ Хато шуд. Маълумот сабт нашуд.",

        "✅ Профил қабул шуд. Админ онро месанҷад.":
            "✅ Профил қабул шуд. Админ онро месанҷад.",

        "❌ Хато шуд. Дархост сабт нашуд.":
            "❌ Хато шуд. Дархост сабт нашуд.",

        "✅ Дархости шумо қабул шуд.":
            "✅ Дархости шумо қабул шуд.",

        "❌ Отзыв сабт нашуд.":
            "❌ Отзыв сабт нашуд.",

        "⭐ Отзыв қабул шуд. Баъди тасдиқи админ дар сайт пайдо мешавад.":
            "⭐ Отзыв қабул шуд. Баъди тасдиқи админ дар сайт пайдо мешавад.",

        "❌ Парол нодуруст.":
            "❌ Парол нодуруст.",

        "❌ Тасдиқ нашуд.":
            "❌ Тасдиқ нашуд.",

        "✅ SMM-щик тасдиқ шуд.":
            "✅ SMM-щик тасдиқ шуд."
    },

    ru: {
        "❌ Хато шуд. Маълумот сабт нашуд.":
            "❌ Произошла ошибка. Данные не сохранены.",

        "✅ Профил қабул шуд. Админ онро месанҷад.":
            "✅ Профиль принят. Администратор его проверит.",

        "❌ Хато шуд. Дархост сабт нашуд.":
            "❌ Произошла ошибка. Заявка не сохранена.",

        "✅ Дархости шумо қабул шуд.":
            "✅ Ваша заявка принята.",

        "❌ Отзыв сабт нашуд.":
            "❌ Отзыв не сохранён.",

        "⭐ Отзыв қабул шуд. Баъди тасдиқи админ дар сайт пайдо мешавад.":
            "⭐ Отзыв принят. Он появится на сайте после одобрения администратора.",

        "❌ Парол нодуруст.":
            "❌ Неверный пароль.",

        "❌ Тасдиқ нашуд.":
            "❌ Не удалось подтвердить.",

        "✅ SMM-щик тасдиқ шуд.":
            "✅ SMM-специалист подтверждён."
    },

    en: {
        "❌ Хато шуд. Маълумот сабт нашуд.":
            "❌ An error occurred. The data was not saved.",

        "✅ Профил қабул шуд. Админ онро месанҷад.":
            "✅ Profile submitted. The administrator will review it.",

        "❌ Хато шуд. Дархост сабт нашуд.":
            "❌ An error occurred. The request was not saved.",

        "✅ Дархости шумо қабул шуд.":
            "✅ Your request has been submitted.",

        "❌ Отзыв сабт нашуд.":
            "❌ Review was not saved.",

        "⭐ Отзыв қабул шуд. Баъди тасдиқи админ дар сайт пайдо мешавад.":
            "⭐ Review submitted. It will appear after admin approval.",

        "❌ Парол нодуруст.":
            "❌ Incorrect password.",

        "❌ Тасдиқ нашуд.":
            "❌ Approval failed.",

        "✅ SMM-щик тасдиқ шуд.":
            "✅ SMM specialist approved."
    }
};


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        setupLanguageMenu();

        const saved =
            localStorage.getItem(
                "smm_language"
            ) || "tg";

        applySmmLanguage(saved);
    }
);
