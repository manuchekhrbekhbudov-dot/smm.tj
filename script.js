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


/* =========================================
   STATE
========================================= */

const state = {
    language:
        localStorage.getItem("smm_language") || "tg",

    smm: [],
    clients: [],
    requests: [],
    reviews: [],

    isAdmin: false
};


/* =========================================
   HELPERS
========================================= */

const $ = id =>
    document.getElementById(id);


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function openModal(id) {

    const modal = $(id);

    if (modal)
        modal.classList.add("active");
}


function closeModal(id) {

    const modal = $(id);

    if (modal)
        modal.classList.remove("active");
}


/* =========================================
   LANGUAGE
========================================= */

const translations = {

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

        "МУТАХАССИСОН":
            "МУТАХАССИСОН",

        "SMM-щикҳои тасдиқшуда":
            "SMM-щикҳои тасдиқшуда",

        "Ҳоло SMM-щик нест":
            "Ҳоло SMM-щик нест",

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

        "👑 Admin Panel":
            "👑 Admin Panel",

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

        "👑 Admin Panel":
            "👑 Админ-панель",

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

        "👑 Admin Panel":
            "👑 Admin Panel",

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


/* =========================================
   TRANSLATE PAGE
========================================= */

const originalTexts =
    new WeakMap();


const originalPlaceholders =
    new WeakMap();


function rememberElement(element) {

    if (
        !originalTexts.has(element)
    ) {

        originalTexts.set(
            element,
            element.textContent.trim()
        );

    }

    if (
        element.hasAttribute("placeholder") &&
        !originalPlaceholders.has(element)
    ) {

        originalPlaceholders.set(
            element,
            element.getAttribute("placeholder")
        );

    }
}


function translatePage(language) {

    if (
        !translations[language]
    ) {
        language = "tg";
    }

    state.language =
        language;

    document.documentElement.lang =
        language;


    document
        .querySelectorAll("body *")
        .forEach(element => {

            if (
                element.tagName === "SCRIPT" ||
                element.tagName === "STYLE"
            ) {
                return;
            }

            rememberElement(element);

            const original =
                originalTexts.get(element);

            const translated =
                translations[language][original];

            if (
                translated &&
                element.children.length === 0
            ) {

                element.textContent =
                    translated;
            }


            const placeholder =
                originalPlaceholders.get(
                    element
                );

            if (
                placeholder &&
                translations[language][placeholder]
            ) {

                element.placeholder =
                    translations[language][placeholder];

            }

        });


    updateLanguageButton(
        language
    );


    localStorage.setItem(
        "smm_language",
        language
    );
}


function updateLanguageButton(
    language
) {

    const button =
        $("languageBtn");

    if (!button)
        return;

    const labels = {

        tg: "🇹🇯 TJ",

        ru: "🇷🇺 RU",

        en: "🇬🇧 EN"
    };

    button.textContent =
        labels[language];
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
    ) {
        return;
    }


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
        .forEach(option => {

            option.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    translatePage(
                        option.dataset.lang
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
}


/* =========================================
   MOBILE MENU
========================================= */

function setupMobileMenu() {

    const menuBtn =
        $("menuBtn");

    const nav =
        $("nav");

    if (
        !menuBtn ||
        !nav
    ) {
        return;
    }


    menuBtn.addEventListener(
        "click",
        event => {

            event.stopPropagation();

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
/* =========================================
   LOAD DATA FROM SUPABASE
========================================= */

async function loadData() {

    try {

        const [
            smmResult,
            clientsResult,
            requestsResult,
            reviewsResult
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
                .eq("status", "approved")
                .order("created_at", {
                    ascending: false
                })
        ]);


        if (smmResult.error) {
            console.error(
                "SMM ERROR:",
                smmResult.error
            );
        }

        if (clientsResult.error) {
            console.error(
                "CLIENT ERROR:",
                clientsResult.error
            );
        }

        if (requestsResult.error) {
            console.error(
                "REQUEST ERROR:",
                requestsResult.error
            );
        }

        if (reviewsResult.error) {
            console.error(
                "REVIEW ERROR:",
                reviewsResult.error
            );
        }


        state.smm =
            smmResult.data || [];

        state.clients =
            clientsResult.data || [];

        state.requests =
            requestsResult.data || [];

        state.reviews =
            reviewsResult.data || [];


        renderSpecialists();
        renderReviews();

    } catch (error) {

        console.error(
            "LOAD DATA ERROR:",
            error
        );

    }
}


/* =========================================
   AUTH / ROLE MODAL
========================================= */

function openAuth() {

    openModal("authModal");

    const roles =
        $("roleSelection");

    const smmForm =
        $("smmForm");

    const clientForm =
        $("clientForm");


    if (roles)
        roles.style.display = "block";

    if (smmForm)
        smmForm.classList.remove(
            "active"
        );

    if (clientForm)
        clientForm.classList.remove(
            "active"
        );
}


function openSmmForm() {

    openModal("authModal");

    if ($("roleSelection"))
        $("roleSelection").style.display =
            "none";

    $("smmForm")?.classList.add(
        "active"
    );

    $("clientForm")?.classList.remove(
        "active"
    );
}


function openClientForm() {

    openModal("authModal");

    if ($("roleSelection"))
        $("roleSelection").style.display =
            "none";

    $("clientForm")?.classList.add(
        "active"
    );

    $("smmForm")?.classList.remove(
        "active"
    );
}


$("loginBtn")?.addEventListener(
    "click",
    openAuth
);

$("registerBtn")?.addEventListener(
    "click",
    openAuth
);

$("smmRole")?.addEventListener(
    "click",
    openSmmForm
);

$("clientRole")?.addEventListener(
    "click",
    openClientForm
);

$("smmBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("clientBtn")?.addEventListener(
    "click",
    openClientForm
);

$("authClose")?.addEventListener(
    "click",
    () => closeModal("authModal")
);


/* =========================================
   SMM REGISTRATION
========================================= */

$("smmForm")?.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const button =
            this.querySelector(
                'button[type="submit"]'
            );

        if (button)
            button.disabled = true;


        const profile = {

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
            !profile.name ||
            !profile.phone ||
            !profile.service ||
            !profile.category
        ) {

            alert(
                "Лутфан ҳамаи майдонҳои заруриро пур кунед."
            );

            if (button)
                button.disabled = false;

            return;
        }


        const {
            error
        } = await supabaseClient
            .from("smm_profiles")
            .insert(profile);


        if (error) {

            console.error(
                "SMM INSERT ERROR:",
                error
            );

            alert(
                "❌ Сабти ном иҷро нашуд."
            );

            if (button)
                button.disabled = false;

            return;
        }


        alert(
            "✅ Маълумоти шумо қабул шуд. Баъди тасдиқи админ профил дар сайт пайдо мешавад."
        );


        this.reset();

        closeModal("authModal");

        if (button)
            button.disabled = false;

        await loadData();
    }
);


/* =========================================
   CLIENT REGISTRATION
========================================= */

$("clientForm")?.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const button =
            this.querySelector(
                'button[type="submit"]'
            );

        if (button)
            button.disabled = true;


        const client = {

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
            !client.name ||
            !client.phone ||
            !client.business ||
            !client.category ||
            !client.need
        ) {

            alert(
                "Лутфан ҳамаи майдонҳоро пур кунед."
            );

            if (button)
                button.disabled = false;

            return;
        }


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

            alert(
                "❌ Дархост сабт нашуд."
            );

            if (button)
                button.disabled = false;

            return;
        }


        const request = {

            client_id:
                data?.id || null,

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
                "REQUEST INSERT ERROR:",
                requestError
            );

            alert(
                "⚠️ Клиент сабт шуд, вале дархост пурра сабт нашуд."
            );

        } else {

            alert(
                "✅ Дархости шумо қабул шуд."
            );

        }


        this.reset();

        closeModal("authModal");

        if (button)
            button.disabled = false;

        await loadData();
    }
);


/* =========================================
   FIND SPECIALISTS BUTTON
========================================= */

$("findBtn")?.addEventListener(
    "click",
    () => {

        const section =
            $("specialists");

        if (section) {

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }
);


/* =========================================
   RENDER SPECIALISTS
========================================= */

function renderSpecialists() {

    const box =
        $("specialistsList");

    if (!box)
        return;


    const specialists =
        state.smm.filter(
            person =>
                person.status ===
                "approved"
        );


    if (!specialists.length) {

        box.innerHTML = `

            <div class="empty-state">

                <div>
                    👨‍💻
                </div>

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
        specialists
            .map(person => `

                <article
                    class="specialist-card"
                >

                    <div
                        class="specialist-top"
                    >

                        <div class="avatar">

                            ${escapeHTML(
                                person.name
                                    ?.charAt(0)
                                    ?.toUpperCase()
                                || "S"
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
                            person.instagram
                                ? `
                                    <p>
                                        📸
                                        ${escapeHTML(
                                            person.instagram
                                        )}
                                    </p>
                                  `
                                : ""
                        }


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
                        onclick="
                            openSpecialist('${person.id}')
                        "
                    >
                        Профил →
                    </button>

                </article>

            `)
            .join("");
}


/* =========================================
   SPECIALIST PROFILE
========================================= */

function openSpecialist(id) {

    const person =
        state.smm.find(
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
                    ?.toUpperCase()
                || "S"
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

            ${
                person.phone
                    ? `
                        <p>
                            📞
                            ${escapeHTML(
                                person.phone
                            )}
                        </p>
                      `
                    : ""
            }


            ${
                person.instagram
                    ? `
                        <p>
                            📸
                            ${escapeHTML(
                                person.instagram
                            )}
                        </p>
                      `
                    : ""
            }


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


            ${
                person.category
                    ? `
                        <p>
                            📂
                            ${escapeHTML(
                                person.category
                            )}
                        </p>
                      `
                    : ""
            }

        </div>

    `;


    openModal("profileModal");
}


window.openSpecialist =
    openSpecialist;


$("profileClose")?.addEventListener(
    "click",
    () => closeModal("profileModal")
);


/* =========================================
   REVIEWS
========================================= */

function renderReviews() {

    const box =
        $("reviewsList");

    if (!box)
        return;


    if (!state.reviews.length) {

        box.innerHTML = `

            <div class="empty-state">

                <div>
                    💬
                </div>

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
        state.reviews
            .map(review => {

                const rating =
                    Math.max(
                        0,
                        Math.min(
                            5,
                            Number(
                                review.rating || 0
                            )
                        )
                    );


                return `

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
                                    review.client_name
                                        ?.charAt(0)
                                        ?.toUpperCase()
                                    || "C"
                                )}

                            </div>


                            <div>

                                <strong>
                                    ${escapeHTML(
                                        review.client_name
                                    )}
                                </strong>


                                <div
                                    class="stars"
                                >
                                    ${
                                        "★".repeat(
                                            rating
                                        )
                                    }
                                    ${
                                        "☆".repeat(
                                            5 - rating
                                        )
                                    }
                                </div>

                            </div>

                        </div>


                        <p>
                            ${escapeHTML(
                                review.text
                            )}
                        </p>

                    </article>

                `;

            })
            .join("");
}


/* =========================================
   REVIEW MODAL
========================================= */

$("reviewBtn")?.addEventListener(
    "click",
    () => openModal("reviewModal")
);

$("reviewClose")?.addEventListener(
    "click",
    () => closeModal("reviewModal")
);


$("reviewForm")?.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const button =
            this.querySelector(
                'button[type="submit"]'
            );

        if (button)
            button.disabled = true;


        const review = {

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
            !review.client_name ||
            !review.text
        ) {

            alert(
                "Лутфан ном ва отзывро пур кунед."
            );

            if (button)
                button.disabled = false;

            return;
        }


        const {
            error
        } = await supabaseClient
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

            if (button)
                button.disabled = false;

            return;
        }


        alert(
            "⭐ Отзыв қабул шуд."
        );


        this.reset();

        closeModal("reviewModal");

        if (button)
            button.disabled = false;

        await loadData();
    }
);
/* =========================================
   AI SYSTEM
========================================= */

$("aiBtn")?.addEventListener(
    "click",
    () => openModal("aiModal")
);

$("startAiBtn")?.addEventListener(
    "click",
    () => openModal("aiModal")
);

$("aiClose")?.addEventListener(
    "click",
    () => closeModal("aiModal")
);


/* =========================================
   AI CATEGORY
========================================= */

document
    .querySelectorAll("[data-ai]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset.ai;

                findWithAI(category);

            }
        );

    });


function findWithAI(category) {

    const result =
        $("aiResult");

    if (!result)
        return;


    const specialists =
        state.smm.filter(
            person =>
                person.status === "approved" &&
                person.category === category
        );


    if (!specialists.length) {

        result.innerHTML = `

            <div class="empty-state">

                <div>
                    🤖
                </div>

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


    result.innerHTML = `

        <h3>
            Мутахассисони мувофиқ:
        </h3>

        ${
            specialists
                .map(person => `

                    <div
                        class="ai-result-card"
                    >

                        <strong>
                            ${escapeHTML(
                                person.name
                            )}
                        </strong>

                        ${
                            person.service
                                ? `
                                    <span>
                                        💼
                                        ${escapeHTML(
                                            person.service
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            person.experience
                                ? `
                                    <span>
                                        ⏳
                                        ${escapeHTML(
                                            person.experience
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        ${
                            person.price
                                ? `
                                    <span>
                                        💰
                                        ${escapeHTML(
                                            person.price
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        <button
                            class="btn btn-primary"
                            type="button"
                            onclick="
                                openSpecialist(
                                    '${person.id}'
                                )
                            "
                        >
                            Профил →
                        </button>

                    </div>

                `)
                .join("")
        }

    `;
}


/* =========================================
   ADMIN LOGIN
========================================= */

$("adminBtn")?.addEventListener(
    "click",
    () => openModal("adminModal")
);

$("adminClose")?.addEventListener(
    "click",
    () => closeModal("adminModal")
);


/*
   Ин пароли муваққатӣ аст.
   Баъдтар метавонем authentication-и
   ҳақиқии Supabase созем.
*/

const ADMIN_PASSWORD =
    "admin123";


$("adminLoginBtn")?.addEventListener(
    "click",
    async () => {

        const password =
            $("adminPassword")
                ?.value || "";


        if (
            password !==
            ADMIN_PASSWORD
        ) {

            alert(
                "❌ Парол нодуруст."
            );

            return;
        }


        state.isAdmin = true;


        $("adminPassword").value =
            "";


        closeModal("adminModal");


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


        await loadAdminData();

        renderAdmin();
    }
);


/* =========================================
   ADMIN DATA
========================================= */

async function loadAdminData() {

    try {

        const [
            smmResult,
            clientsResult,
            requestsResult,
            reviewsResult
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


        state.smm =
            smmResult.data || [];

        state.clients =
            clientsResult.data || [];

        state.requests =
            requestsResult.data || [];

        state.reviews =
            reviewsResult.data || [];


    } catch (error) {

        console.error(
            "ADMIN LOAD ERROR:",
            error
        );

    }
}


/* =========================================
   ADMIN RENDER
========================================= */

function renderAdmin() {

    renderAdminStats();

    renderAdminSmm();

    renderAdminClients();

    renderAdminRequests();

    renderAdminReviews();
}


/* =========================================
   ADMIN STATS
========================================= */

function renderAdminStats() {

    $("adminSmmCount")
        && (
            $("adminSmmCount").textContent =
                state.smm.length
        );


    $("adminClientCount")
        && (
            $("adminClientCount").textContent =
                state.clients.length
        );


    $("adminRequestCount")
        && (
            $("adminRequestCount").textContent =
                state.requests.length
        );


    $("adminReviewCount")
        && (
            $("adminReviewCount").textContent =
                state.reviews.length
        );
}


/* =========================================
   ADMIN — SMM
========================================= */

function renderAdminSmm() {

    const box =
        $("adminSmmList");

    if (!box)
        return;


    if (!state.smm.length) {

        box.innerHTML = `
            <div class="empty-state">
                SMM-щик нест.
            </div>
        `;

        return;
    }


    box.innerHTML =
        state.smm
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
                                person.phone || ""
                            )}
                        </p>

                        <p>
                            💼
                            ${escapeHTML(
                                person.service || ""
                            )}
                        </p>

                        <p>
                            📂
                            ${escapeHTML(
                                person.category || ""
                            )}
                        </p>

                        <small>
                            Статус:
                            ${escapeHTML(
                                person.status || ""
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
                            class="
                                btn
                                btn-danger
                            "
                            type="button"
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

            `)
            .join("");
}


/* =========================================
   APPROVE SMM
========================================= */

async function approveSmm(id) {

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

    await loadAdminData();

    renderAdmin();
}


window.approveSmm =
    approveSmm;


/* =========================================
   DELETE SMM
========================================= */

async function deleteSmm(id) {

    const confirmDelete =
        confirm(
            "Ин SMM-щикро нест кунем?"
        );


    if (!confirmDelete)
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


    alert(
        "🗑 SMM-щик нест карда шуд."
    );


    await loadData();

    await loadAdminData();

    renderAdmin();
}


window.deleteSmm =
    deleteSmm;


/* =========================================
   ADMIN — CLIENTS
========================================= */

function renderAdminClients() {

    const box =
        $("adminClientsList");

    if (!box)
        return;


    if (!state.clients.length) {

        box.innerHTML = `
            <div class="empty-state">
                Клиент нест.
            </div>
        `;

        return;
    }


    box.innerHTML =
        state.clients
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
                                client.phone || ""
                            )}
                        </p>

                        <p>
                            🏢
                            ${escapeHTML(
                                client.business || ""
                            )}
                        </p>

                        <p>
                            📂
                            ${escapeHTML(
                                client.category || ""
                            )}
                        </p>

                        <p>
                            📝
                            ${escapeHTML(
                                client.need || ""
                            )}
                        </p>

                    </div>


                    <button
                        class="
                            btn
                            btn-danger
                        "
                        type="button"
                        onclick="
                            deleteClient(
                                '${client.id}'
                            )
                        "
                    >
                        Нест кардан
                    </button>

                </div>

            `)
            .join("");
}


/* =========================================
   DELETE CLIENT
========================================= */

async function deleteClient(id) {

    const confirmDelete =
        confirm(
            "Ин клиентро нест кунем?"
        );


    if (!confirmDelete)
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

    await loadAdminData();

    renderAdmin();
}


window.deleteClient =
    deleteClient;


/* =========================================
   ADMIN — REQUESTS
========================================= */

function renderAdminRequests() {

    const box =
        $("adminRequestsList");

    if (!box)
        return;


    if (!state.requests.length) {

        box.innerHTML = `
            <div class="empty-state">
                Дархост нест.
            </div>
        `;

        return;
    }


    box.innerHTML =
        state.requests
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
                                request.phone || ""
                            )}
                        </p>

                        <p>
                            📝
                            ${escapeHTML(
                                request.message || ""
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


                    <div
                        class="admin-actions"
                    >

                        ${
                            request.status !==
                            "accepted"
                                ? `
                                    <button
                                        class="
                                            btn
                                            btn-primary
                                        "
                                        type="button"
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
                                        class="
                                            btn
                                            btn-secondary
                                        "
                                        type="button"
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
                            class="
                                btn
                                btn-danger
                            "
                            type="button"
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

            `)
            .join("");
}


/* =========================================
   ACCEPT REQUEST
========================================= */

async function acceptRequest(id) {

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

    await loadAdminData();

    renderAdmin();
}


window.acceptRequest =
    acceptRequest;


/* =========================================
   REJECT REQUEST
========================================= */

async function rejectRequest(id) {

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

    await loadAdminData();

    renderAdmin();
}


window.rejectRequest =
    rejectRequest;


/* =========================================
   DELETE REQUEST
========================================= */

async function deleteRequest(id) {

    const confirmDelete =
        confirm(
            "Ин дархостро нест кунем?"
        );


    if (!confirmDelete)
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

    await loadAdminData();

    renderAdmin();
}


window.deleteRequest =
    deleteRequest;


/* =========================================
   ADMIN — REVIEWS
========================================= */

function renderAdminReviews() {

    const box =
        $("adminReviewsList");

    if (!box)
        return;


    if (!state.reviews.length) {

        box.innerHTML = `
            <div class="empty-state">
                Отзыв нест.
            </div>
        `;

        return;
    }


    box.innerHTML =
        state.reviews
            .map(review => {

                const rating =
                    Math.max(
                        0,
                        Math.min(
                            5,
                            Number(
                                review.rating || 0
                            )
                        )
                    );


                return `

                    <div
                        class="admin-item"
                    >

                        <div>

                            <strong>
                                ${escapeHTML(
                                    review.client_name
                                )}
                            </strong>

                            <p
                                class="stars"
                            >
                                ${
                                    "★".repeat(
                                        rating
                                    )
                                }
                                ${
                                    "☆".repeat(
                                        5 - rating
                                    )
                                }
                            </p>

                            <p>
                                ${escapeHTML(
                                    review.text
                                )}
                            </p>

                            <small>
                                Статус:
                                ${escapeHTML(
                                    review.status ||
                                    "approved"
                                )}
                            </small>

                        </div>


                        <button
                            class="
                                btn
                                btn-danger
                            "
                            type="button"
                            onclick="
                                deleteReview(
                                    '${review.id}'
                                )
                            "
                        >
                            Нест кардан
                        </button>

                    </div>

                `;

            })
            .join("");
}


/* =========================================
   DELETE REVIEW
========================================= */

async function deleteReview(id) {

    const confirmDelete =
        confirm(
            "Ин отзывро нест кунем?"
        );


    if (!confirmDelete)
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
            "❌ Отзыв нест карда нашуд."
        );

        return;
    }


    alert(
        "🗑 Отзыв нест карда шуд."
    );


    await loadData();

    await loadAdminData();

    renderAdmin();
}


window.deleteReview =
    deleteReview;


/* =========================================
   CLOSE MODALS
========================================= */

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
            event.key !== "Escape"
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
   LANGUAGE — DYNAMIC CONTENT
========================================= */

const languageObserver =
    new MutationObserver(
        () => {

            /*
             * Мазмуни динамикии Admin,
             * AI ва карточкаҳо вайрон
             * намешавад.
             *
             * Танҳо матнҳои статикӣ
             * ҳангоми иваз кардани забон
             * тарҷума мешаванд.
             */

        }
    );


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "SMM.TJ started"
        );


        setupLanguage();

        setupMobileMenu();


        await loadData();


        translatePage(
            state.language
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
