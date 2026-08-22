"use strict";

/* =====================================================
   SMM.TJ — SCRIPT.JS
===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://lcldaingzicxbottlznq.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   HELPERS
===================================================== */

const $ = id =>
    document.getElementById(id);


function openModal(id) {

    const element = $(id);

    if (element) {
        element.classList.add("active");
    }
}


function closeModal(id) {

    const element = $(id);

    if (element) {
        element.classList.remove("active");
    }
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================================
   DATA
===================================================== */

let smmProfiles = [];
let clients = [];
let requests = [];
let reviews = [];


/* =====================================================
   LANGUAGE
===================================================== */

const translations = {

    tg: {
        home: "Асосӣ",
        specialists: "SMM-щикҳо",
        ai: "AI",
        reviews: "Отзывҳо",
        login: "Даромадан",
        register: "Сабти ном"
    },

    ru: {
        home: "Главная",
        specialists: "SMM-специалисты",
        ai: "AI",
        reviews: "Отзывы",
        login: "Войти",
        register: "Регистрация"
    },

    en: {
        home: "Home",
        specialists: "SMM Specialists",
        ai: "AI",
        reviews: "Reviews",
        login: "Login",
        register: "Sign Up"
    }

};


function setLanguage(language) {

    if (!translations[language]) {
        language = "tg";
    }


    localStorage.setItem(
        "smm_language",
        language
    );


    const t =
        translations[language];


    const nav =
        document.querySelectorAll(".nav a");


    if (nav[0])
        nav[0].textContent = t.home;


    if (nav[1])
        nav[1].textContent = t.specialists;


    if (nav[2])
        nav[2].textContent = t.ai;


    if (nav[3])
        nav[3].textContent = t.reviews;


    const login =
        $("loginBtn");

    const register =
        $("registerBtn");


    if (login)
        login.textContent = t.login;


    if (register)
        register.textContent = t.register;


    const languageBtn =
        $("languageBtn");


    if (languageBtn) {

        const flags = {
            tg: "🇹🇯 TJ",
            ru: "🇷🇺 RU",
            en: "🇬🇧 EN"
        };

        languageBtn.textContent =
            flags[language];
    }

}


function setupLanguage() {

    const button =
        $("languageBtn");

    const menu =
        $("languageMenu");


    if (!button || !menu)
        return;


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            menu.classList.toggle(
                "active"
            );

        }
    );


    menu
        .querySelectorAll(
            "[data-lang]"
        )
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    setLanguage(
                        item.dataset.lang
                    );

                    menu.classList.remove(
                        "active"
                    );

                }
            );

        });


    document.addEventListener(
        "click",
        () => {

            menu.classList.remove(
                "active"
            );

        }
    );


    setLanguage(
        localStorage.getItem(
            "smm_language"
        ) || "tg"
    );
}


/* =====================================================
   MOBILE MENU
===================================================== */

function setupMobileMenu() {

    const button =
        $("menuBtn");

    const nav =
        $("nav");


    if (!button || !nav)
        return;


    button.addEventListener(
        "click",
        () => {

            nav.classList.toggle(
                "mobile"
            );

        }
    );


    nav
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    nav.classList.remove(
                        "mobile"
                    );

                }
            );

        });
}


/* =====================================================
   AUTH MODAL
===================================================== */

function showAuth() {

    openModal("authModal");


    const roles =
        $("roleSelection");

    const smm =
        $("smmForm");

    const client =
        $("clientForm");


    if (roles)
        roles.style.display = "block";


    if (smm)
        smm.classList.remove("active");


    if (client)
        client.classList.remove("active");
}


function showSmmForm() {

    openModal("authModal");


    if ($("roleSelection"))
        $("roleSelection").style.display =
            "none";


    $("smmForm")
        ?.classList.add("active");


    $("clientForm")
        ?.classList.remove("active");
}


function showClientForm() {

    openModal("authModal");


    if ($("roleSelection"))
        $("roleSelection").style.display =
            "none";


    $("clientForm")
        ?.classList.add("active");


    $("smmForm")
        ?.classList.remove("active");
}


$("loginBtn")
    ?.addEventListener(
        "click",
        showAuth
    );


$("registerBtn")
    ?.addEventListener(
        "click",
        showAuth
    );


$("smmRole")
    ?.addEventListener(
        "click",
        showSmmForm
    );


$("clientRole")
    ?.addEventListener(
        "click",
        showClientForm
    );


$("smmBtn")
    ?.addEventListener(
        "click",
        showSmmForm
    );


$("clientBtn")
    ?.addEventListener(
        "click",
        showClientForm
    );


$("authClose")
    ?.addEventListener(
        "click",
        () => closeModal("authModal")
    );


/* =====================================================
   LOAD SMM
===================================================== */

async function loadSmm() {

    const result =
        await supabaseClient
            .from("smm_profiles")
            .select("*")
            .eq("status", "approved")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (result.error) {

        console.error(
            "SMM ERROR:",
            result.error
        );

        return;
    }


    smmProfiles =
        result.data || [];


    renderSmm();
}


/* =====================================================
   RENDER SMM
===================================================== */

function renderSmm() {

    const box =
        $("specialistsList");


    if (!box)
        return;


    if (!smmProfiles.length) {

        box.innerHTML = `

            <div class="empty-state">

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
        smmProfiles
            .map(person => `

                <article
                    class="specialist-card"
                >

                    <div
                        class="specialist-top"
                    >

                        <div class="avatar">

                            ${escapeHTML(
                                (
                                    person.name ||
                                    "S"
                                )
                                .charAt(0)
                                .toUpperCase()
                            )}

                        </div>


                        <div>

                            <h3>
                                ${escapeHTML(
                                    person.name
                                )}
                            </h3>

                            <span
                                class="verified"
                            >
                                ✓ Тасдиқшуда
                            </span>

                        </div>

                    </div>


                    <div
                        class="specialist-info"
                    >

                        ${
                            person.service
                            ? `
                                <p>
                                    💼
                                    ${escapeHTML(
                                        person.service
                                    )}
                                </p>
                              `
                            : ""
                        }


                        ${
                            person.experience
                            ? `
                                <p>
                                    ⏳
                                    ${escapeHTML(
                                        person.experience
                                    )}
                                </p>
                              `
                            : ""
                        }


                        ${
                            person.price
                            ? `
                                <p>
                                    💰
                                    ${escapeHTML(
                                        person.price
                                    )}
                                </p>
                              `
                            : ""
                        }

                    </div>


                    <button
                        class="btn btn-primary profile-btn"
                        type="button"
                        data-profile-id="${escapeHTML(
                            person.id
                        )}"
                    >
                        Профил →
                    </button>

                </article>

            `)
            .join("");


    box
        .querySelectorAll(
            "[data-profile-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openProfile(
                        button.dataset.profileId
                    );

                }
            );

        });
}


/* =====================================================
   PROFILE
===================================================== */

function openProfile(id) {

    const person =
        smmProfiles.find(
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
                (
                    person.name ||
                    "S"
                )
                .charAt(0)
                .toUpperCase()
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


        <div
            class="profile-details"
        >

            <p>
                💼
                ${escapeHTML(
                    person.service ||
                    "SMM"
                )}
            </p>

            <p>
                ⏳
                ${escapeHTML(
                    person.experience ||
                    "—"
                )}
            </p>

            <p>
                💰
                ${escapeHTML(
                    person.price ||
                    "—"
                )}
            </p>

            <p>
                📸
                ${escapeHTML(
                    person.instagram ||
                    "—"
                )}
            </p>

        </div>

    `;


    openModal("profileModal");
}


$("profileClose")
    ?.addEventListener(
        "click",
        () => closeModal("profileModal")
    );


/* =====================================================
   SMM FORM
===================================================== */

$("smmForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const data = {

                name:
                    $("smmName")
                        ?.value
                        .trim(),

                phone:
                    $("smmPhone")
                        ?.value
                        .trim(),

                instagram:
                    $("smmInstagram")
                        ?.value
                        .trim(),

                service:
                    $("smmService")
                        ?.value
                        .trim(),

                experience:
                    $("smmExperience")
                        ?.value
                        .trim(),

                price:
                    $("smmPrice")
                        ?.value
                        .trim(),

                category:
                    $("smmCategory")
                        ?.value,

                status:
                    "pending"
            };


            if (
                !data.name ||
                !data.phone ||
                !data.service ||
                !data.category
            ) {

                alert(
                    "Лутфан ҳамаи майдонҳои заруриро пур кунед."
                );

                return;
            }


            const result =
                await supabaseClient
                    .from("smm_profiles")
                    .insert(data);


            if (result.error) {

                console.error(
                    result.error
                );

                alert(
                    "❌ Хато ҳангоми сабти ном."
                );

                return;
            }


            alert(
                "✅ Маълумоти шумо қабул шуд."
            );


            event.target.reset();

            closeModal(
                "authModal"
            );

        }
    );


/* =====================================================
   CLIENT FORM
===================================================== */

$("clientForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const data = {

                name:
                    $("clientName")
                        ?.value
                        .trim(),

                phone:
                    $("clientPhone")
                        ?.value
                        .trim(),

                business:
                    $("clientBusiness")
                        ?.value
                        .trim(),

                category:
                    $("clientCategory")
                        ?.value,

                need:
                    $("clientNeed")
                        ?.value
                        .trim()
            };


            if (
                !data.name ||
                !data.phone ||
                !data.business ||
                !data.category ||
                !data.need
            ) {

                alert(
                    "Лутфан ҳамаи майдонҳоро пур кунед."
                );

                return;
            }


            const clientResult =
                await supabaseClient
                    .from("clients")
                    .insert(data)
                    .select()
                    .single();


            if (clientResult.error) {

                console.error(
                    clientResult.error
                );

                alert(
                    "❌ Клиент сабт нашуд."
                );

                return;
            }


            const request = {

                client_id:
                    clientResult.data?.id ||
                    null,

                client_name:
                    data.name,

                phone:
                    data.phone,

                message:
                    data.need,

                status:
                    "new"
            };


            const requestResult =
                await supabaseClient
                    .from("requests")
                    .insert(request);


            if (requestResult.error) {

                console.error(
                    requestResult.error
                );

                alert(
                    "⚠️ Клиент сабт шуд, вале дархост хато дод."
                );

            } else {

                alert(
                    "✅ Дархости шумо қабул шуд."
                );

            }


            event.target.reset();

            closeModal(
                "authModal"
            );

        }
    );


/* =====================================================
   FIND BUTTON
===================================================== */

$("findBtn")
    ?.addEventListener(
        "click",
        () => {

            $("specialists")
                ?.scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


/* =====================================================
   AI
===================================================== */

function openAI() {

    openModal("aiModal");

}


$("aiBtn")
    ?.addEventListener(
        "click",
        openAI
    );


$("startAiBtn")
    ?.addEventListener(
        "click",
        openAI
    );


$("aiClose")
    ?.addEventListener(
        "click",
        () => closeModal("aiModal")
    );


document
    .querySelectorAll(
        "[data-ai]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset.ai;


                const results =
                    smmProfiles.filter(
                        person =>
                            person.category ===
                            category
                    );


                const box =
                    $("aiResult");


                if (!box)
                    return;


                if (!results.length) {

                    box.innerHTML = `

                        <div
                            class="empty-state"
                        >

                            <div>🤖</div>

                            <h3>
                                Мутахассис ёфт нашуд
                            </h3>

                            <p>
                                Барои ин категория
                                ҳоло SMM-щик нест.
                            </p>

                        </div>

                    `;

                    return;
                }


                box.innerHTML = `

                    <h3>
                        Мутахассисони мувофиқ:
                    </h3>

                    ${results
                        .map(person => `

                            <div
                                class="ai-result-card"
                            >

                                <strong>
                                    ${escapeHTML(
                                        person.name
                                    )}
                                </strong>

                                <span>
                                    💼
                                    ${escapeHTML(
                                        person.service ||
                                        ""
                                    )}
                                </span>

                                <button
                                    class="
                                        btn
                                        btn-primary
                                    "
                                    type="button"
                                    data-ai-profile="${escapeHTML(
                                        person.id
                                    )}"
                                >
                                    Профил →
                                </button>

                            </div>

                        `)
                        .join("")}

                `;


                box
                    .querySelectorAll(
                        "[data-ai-profile]"
                    )
                    .forEach(item => {

                        item.addEventListener(
                            "click",
                            () => {

                                closeModal(
                                    "aiModal"
                                );

                                openProfile(
                                    item.dataset.aiProfile
                                );

                            }
                        );

                    });

            }
        );

    });


/* =====================================================
   REVIEWS
===================================================== */

async function loadReviews() {

    const result =
        await supabaseClient
            .from("reviews")
            .select("*")
            .eq(
                "status",
                "approved"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (result.error) {

        console.error(
            "REVIEWS ERROR:",
            result.error
        );

        return;
    }


    reviews =
        result.data || [];


    renderReviews();
}


function renderReviews() {

    const box =
        $("reviewsList");


    if (!box)
        return;


    if (!reviews.length) {

        box.innerHTML = `

            <div class="empty-state">

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
        reviews
            .map(review => `

                <article
                    class="review-card"
                >

                    <div
                        class="review-top"
                    >

                        <div
                            class="review-avatar"
                        >
                            ${escapeHTML(
                                (
                                    review.client_name ||
                                    "C"
                                )
                                .charAt(0)
                                .toUpperCase()
                            )}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    review.client_name ||
                                    "Client"
                                )}
                            </strong>

                            <div
                                class="stars"
                            >
                                ${
                                    "★".repeat(
                                        Number(
                                            review.rating ||
                                            5
                                        )
                                    )
                                }
                            </div>

                        </div>

                    </div>


                    <p>
                        ${escapeHTML(
                            review.text ||
                            ""
                        )}
                    </p>

                </article>

            `)
            .join("");
}


/* =====================================================
   REVIEW FORM
===================================================== */

$("reviewBtn")
    ?.addEventListener(
        "click",
        () => openModal("reviewModal")
    );


$("reviewClose")
    ?.addEventListener(
        "click",
        () => closeModal("reviewModal")
    );


$("reviewForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const data = {

                client_name:
                    $("reviewName")
                        ?.value
                        .trim(),

                rating:
                    Number(
                        $("reviewRating")
                            ?.value || 5
                    ),

                text:
                    $("reviewText")
                        ?.value
                        .trim(),

                status:
                    "approved"
            };


            if (
                !data.client_name ||
                !data.text
            ) {

                alert(
                    "Лутфан отзывро пур кунед."
                );

                return;
            }


            const result =
                await supabaseClient
                    .from("reviews")
                    .insert(data);


            if (result.error) {

                console.error(
                    result.error
                );

                alert(
                    "❌ Отзыв сабт нашуд."
                );

                return;
            }


            alert(
                "⭐ Отзыв қабул шуд."
            );


            event.target.reset();

            closeModal(
                "reviewModal"
            );


            await loadReviews();

        }
    );


/* =====================================================
   ADMIN
===================================================== */

const ADMIN_PASSWORD =
    "admin123";


$("adminBtn")
    ?.addEventListener(
        "click",
        () => openModal("adminModal")
    );


$("adminClose")
    ?.addEventListener(
        "click",
        () => closeModal("adminModal")
    );


$("adminLoginBtn")
    ?.addEventListener(
        "click",
        async () => {

            const password =
                $("adminPassword")
                    ?.value;


            if (
                password !==
                ADMIN_PASSWORD
            ) {

                alert(
                    "❌ Парол нодуруст."
                );

                return;
            }


            closeModal(
                "adminModal"
            );


            const dashboard =
                $("adminDashboard");


            if (dashboard) {

                dashboard.classList.remove(
                    "hidden"
                );


                dashboard.scrollIntoView({
                    behavior: "smooth"
                });

            }


            await loadAdmin();

        }
    );


/* =====================================================
   ADMIN LOAD
===================================================== */

async function loadAdmin() {

    const [
        smmResult,
        clientResult,
        requestResult,
        reviewResult
    ] = await Promise.all([

        supabaseClient
            .from("smm_profiles")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            ),

        supabaseClient
            .from("clients")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            ),

        supabaseClient
            .from("requests")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            ),

        supabaseClient
            .from("reviews")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            )

    ]);


    smmProfiles =
        smmResult.data || [];


    clients =
        clientResult.data || [];


    requests =
        requestResult.data || [];


    reviews =
        reviewResult.data || [];


    renderAdmin();
}


/* =====================================================
   ADMIN RENDER
===================================================== */

function renderAdmin() {

    const smmCount =
        $("adminSmmCount");

    const clientCount =
        $("adminClientCount");

    const requestCount =
        $("adminRequestCount");

    const reviewCount =
        $("adminReviewCount");


    if (smmCount)
        smmCount.textContent =
            smmProfiles.length;


    if (clientCount)
        clientCount.textContent =
            clients.length;


    if (requestCount)
        requestCount.textContent =
            requests.length;


    if (reviewCount)
        reviewCount.textContent =
            reviews.length;


    renderAdminSmm();

    renderAdminClients();

    renderAdminRequests();

    renderAdminReviews();
}


/* =====================================================
   ADMIN SMM
===================================================== */

function renderAdminSmm() {

    const box =
        $("adminSmmList");


    if (!box)
        return;


    if (!smmProfiles.length) {

        box.innerHTML =
            "<p>Ҳоло SMM-щик нест.</p>";

        return;
    }


    box.innerHTML =
        smmProfiles
            .map(person => `

                <div
                    class="admin-item"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                person.name
                            )}
                        </strong>

                        <p>
                            📞
                            ${escapeHTML(
                                person.phone ||
                                ""
                            )}
                        </p>

                        <small>
                            ${escapeHTML(
                                person.status ||
                                ""
                            )}
                        </small>

                    </div>


                    <div
                        class="admin-actions"
                    >

                        ${
                            person.status !==
                            "approved"
                            ? `
                                <button
                                    class="
                                        btn
                                        btn-primary
                                    "
                                    type="button"
                                    data-approve="${escapeHTML(
                                        person.id
                                    )}"
                                >
                                    Тасдиқ
                                </button>
                              `
                            : ""
                        }


                        <button
                            class="
                                btn
                                btn-danger
                            "
                            type="button"
                            data-delete-smm="${escapeHTML(
                                person.id
                            )}"
                        >
                            Нест кардан
                        </button>

                    </div>

                </div>

            `)
            .join("");


    box
        .querySelectorAll(
            "[data-approve]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    approveSmm(
                        button.dataset.approve
                    )
            );

        });


    box
        .querySelectorAll(
            "[data-delete-smm]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    deleteSmm(
                        button.dataset.deleteSmm
                    )
            );

        });
}


async function approveSmm(id) {

    const result =
        await supabaseClient
            .from("smm_profiles")
            .update({
                status: "approved"
            })
            .eq("id", id);


    if (result.error) {

        alert(
            "❌ Тасдиқ нашуд."
        );

        return;
    }


    await loadSmm();

    await loadAdmin();
}


async function deleteSmm(id) {

    if (
        !confirm(
            "Ин SMM-щикро нест кунем?"
        )
    )
        return;


    const result =
        await supabaseClient
            .from("smm_profiles")
            .delete()
            .eq("id", id);


    if (result.error) {

        alert(
            "❌ Нест кардан нашуд."
        );

        return;
    }


    await loadSmm();

    await loadAdmin();
}


/* =====================================================
   ADMIN CLIENTS
===================================================== */

function renderAdminClients() {

    const box =
        $("adminClientsList");


    if (!box)
        return;


    if (!clients.length) {

        box.innerHTML =
            "<p>Клиент нест.</p>";

        return;
    }


    box.innerHTML =
        clients
            .map(client => `

                <div
                    class="admin-item"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                client.name
                            )}
                        </strong>

                        <p>
                            📞
                            ${escapeHTML(
                                client.phone ||
                                ""
                            )}
                        </p>

                        <p>
                            🏢
                            ${escapeHTML(
                                client.business ||
                                ""
                            )}
                        </p>

                    </div>


                    <button
                        class="
                            btn
                            btn-danger
                        "
                        type="button"
                        data-delete-client="${escapeHTML(
                            client.id
                        )}"
                    >
                        Нест кардан
                    </button>

                </div>

            `)
            .join("");


    box
        .querySelectorAll(
            "[data-delete-client]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "Ин клиентро нест кунем?"
                        )
                    )
                        return;


                    const result =
                        await supabaseClient
                            .from("clients")
                            .delete()
                            .eq(
                                "id",
                                button.dataset.deleteClient
                            );


                    if (result.error) {

                        alert(
                            "❌ Нест кардан нашуд."
                        );

                        return;
                    }


                    await loadAdmin();

                }
            );

        });
}


/* =====================================================
   ADMIN REQUESTS
===================================================== */

function renderAdminRequests() {

    const box =
        $("adminRequestsList");


    if (!box)
        return;


    if (!requests.length) {

        box.innerHTML =
            "<p>Дархост нест.</p>";

        return;
    }


    box.innerHTML =
        requests
            .map(request => `

                <div
                    class="admin-item"
                >

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
                            ${escapeHTML(
                                request.status ||
                                "new"
                            )}
                        </small>

                    </div>


                    <div
                        class="admin-actions"
                    >

                        <button
                            class="
                                btn
                                btn-primary
                            "
                            type="button"
                            data-accept="${escapeHTML(
                                request.id
                            )}"
                        >
                            Қабул
                        </button>


                        <button
                            class="
                                btn
                                btn-danger
                            "
                            type="button"
                            data-delete-request="${escapeHTML(
                                request.id
                            )}"
                        >
                            Нест кардан
                        </button>

                    </div>

                </div>

            `)
            .join("");


    box
        .querySelectorAll(
            "[data-accept]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    await supabaseClient
                        .from("requests")
                        .update({
                            status: "accepted"
                        })
                        .eq(
                            "id",
                            button.dataset.accept
                        );


                    await loadAdmin();

                }
            );

        });


    box
        .querySelectorAll(
            "[data-delete-request]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "Ин дархостро нест кунем?"
                        )
                    )
                        return;


                    await supabaseClient
                        .from("requests")
                        .delete()
                        .eq(
                            "id",
                            button.dataset.deleteRequest
                        );


                    await loadAdmin();

                }
            );

        });
}


/* =====================================================
   ADMIN REVIEWS
===================================================== */

function renderAdminReviews() {

    const box =
        $("adminReviewsList");


    if (!box)
        return;


    if (!reviews.length) {

        box.innerHTML =
            "<p>Отзыв нест.</p>";

        return;
    }


    box.innerHTML =
        reviews
            .map(review => `

                <div
                    class="admin-item"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                review.client_name ||
                                ""
                            )}
                        </strong>

                        <p>
                            ${"★".repeat(
                                Number(
                                    review.rating ||
                                    5
                                )
                            )}
                        </p>

                        <p>
                            ${escapeHTML(
                                review.text ||
                                ""
                            )}
                        </p>

                    </div>


                    <button
                        class="
                            btn
                            btn-danger
                        "
                        type="button"
                        data-delete-review="${escapeHTML(
                            review.id
                        )}"
                    >
                        Нест кардан
                    </button>

                </div>

            `)
            .join("");


    box
        .querySelectorAll(
            "[data-delete-review]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    if (
                        !confirm(
                            "Ин отзывро нест кунем?"
                        )
                    )
                        return;


                    await supabaseClient
                        .from("reviews")
                        .delete()
                        .eq(
                            "id",
                            button.dataset.deleteReview
                        );


                    await loadAdmin();

                }
            );

        });
}


/* =====================================================
   CLOSE MODALS
===================================================== */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                }

            }
        );

    });


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

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

    }
);


/* =====================================================
   START
===================================================== */

async function startApp() {

    console.log(
        "SMM.TJ — JavaScript started"
    );


    setupLanguage();

    setupMobileMenu();


    await loadSmm();

    await loadReviews();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startApp
    );

} else {

    startApp();

}
