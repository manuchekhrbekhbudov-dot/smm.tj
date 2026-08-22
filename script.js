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
