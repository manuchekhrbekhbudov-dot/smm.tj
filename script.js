/* =====================================================
   SMM.TJ — SCRIPT
   Логикаи асосии платформа
===================================================== */


/* =====================================================
   VARIABLES
===================================================== */

let authMode = "register";

let selectedRole = "";

let selectedCategory = "all";

let currentUser = null;


/* =====================================================
   LOADER
===================================================== */

window.addEventListener("load", function () {

    const loader = document.getElementById("loader");

    const progress =
        document.getElementById("loaderProgress");

    let value = 0;

    const loading = setInterval(function () {

        value += Math.floor(Math.random() * 12) + 5;

        if (value >= 100) {

            value = 100;

            clearInterval(loading);

            if (progress) {
                progress.style.width = "100%";
            }

            setTimeout(function () {

                if (loader) {
                    loader.classList.add("hide");
                }

            }, 500);

        }

        if (progress) {
            progress.style.width = value + "%";
        }

    }, 100);

});


/* =====================================================
   PAGE INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadPlatform();

    checkSavedUser();

});


async function loadPlatform() {

    /*
        Баъд аз пайваст кардани Supabase
        ин функсия автоматӣ:

        - specialistҳоро мегирад
        - clientҳоро ҳисоб мекунад
        - projectҳоро ҳисоб мекунад
        - reviewҳоро ҳисоб мекунад
    */

    await loadStatistics();

    await loadSpecialists();

}


/* =====================================================
   STATISTICS
===================================================== */

async function loadStatistics() {

    /*
        Ҳоло база ҳанӯз пайваст нест.

        Барои ҳамин рақамҳо 0 мемонанд.

        Баъд аз Supabase инҷо:

        specialists → COUNT
        clients → COUNT
        projects → completed COUNT
        reviews → COUNT
    */


    setNumber("specialistsCount", 0);

    setNumber("clientsCount", 0);

    setNumber("projectsCount", 0);

    setNumber("reviewsCount", 0);

}


function setNumber(id, number) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        Number(number).toLocaleString("tg-TJ");

}


/* =====================================================
   SPECIALISTS
===================================================== */

let allSpecialists = [];


async function loadSpecialists() {

    /*
        Вақте Supabase пайваст мешавад:

        allSpecialists =
            маълумоти specialists table

        Ҳоло array холӣ аст.

        Ягон specialist сохта нашудааст.
    */

    allSpecialists = [];

    renderSpecialists(allSpecialists);

}


function renderSpecialists(list) {

    const container =
        document.getElementById("specialistsList");

    if (!container) return;


    if (!list || list.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✦
                </div>

                <h3>
                    Ҳоло мутахассис нест
                </h3>

                <p>
                    Вақте аввалин
                    SMM-специалист сабтином мешавад,
                    профили ӯ автоматӣ дар ин ҷо пайдо мешавад.
                </p>

                <button
                    class="btn btn-purple"
                    onclick="openAuth('specialist')">

                    Профил сохтан

                </button>

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    list.forEach(function (specialist) {

        const card =
            createSpecialistCard(specialist);

        container.appendChild(card);

    });

}


function createSpecialistCard(specialist) {

    const article =
        document.createElement("article");

    article.className =
        "specialist-card";


    const name =
        specialist.name || "SMM-специалист";


    const category =
        specialist.category || "SMM";


    const rating =
        specialist.rating || 0;


    const reviews =
        specialist.reviews_count || 0;


    const experience =
        specialist.experience || 0;


    const projects =
        specialist.projects_count || 0;


    const verified =
        specialist.verified === true;


    const premium =
        specialist.premium === true;


    const firstLetter =
        name.charAt(0).toUpperCase();


    article.innerHTML = `

        ${
            verified
            ?
            `
            <div class="verified-badge">
                ✓ Тасдиқшуда
            </div>
            `
            :
            ""
        }


        ${
            premium
            ?
            `
            <div class="premium-badge">
                ◆ ПРЕМИУМ
            </div>
            `
            :
            ""
        }


        <div class="specialist-avatar">

            ${firstLetter}

        </div>


        <h3>
            ${escapeHTML(name)}
        </h3>


        <div class="specialist-role">

            ${escapeHTML(category)}

        </div>


        <div class="specialist-rating">

            ★ ${rating}

            <span>
                (${reviews} отзыв)
            </span>

        </div>


        <div class="specialist-info">


            <div>

                <strong>
                    ${experience}
                </strong>

                <small>
                    сол таҷриба
                </small>

            </div>


            <div>

                <strong>
                    ${projects}
                </strong>

                <small>
                    лоиҳа
                </small>

            </div>


        </div>


        <button
            class="btn btn-purple full profile-button"
            onclick="openSpecialistProfile('${specialist.id}')">

            Дидани профил →

        </button>

    `;


    return article;

}


/* =====================================================
   FILTER
===================================================== */

function filterSpecialists(category, button) {

    selectedCategory = category;


    document
        .querySelectorAll(".filter")
        .forEach(function (item) {

            item.classList.remove("active");

        });


    if (button) {
        button.classList.add("active");
    }


    if (category === "all") {

        renderSpecialists(allSpecialists);

        return;

    }


    const filtered =
        allSpecialists.filter(function (specialist) {

            return specialist.category === category;

        });


    renderSpecialists(filtered);

}


/* =====================================================
   AI MATCHING
===================================================== */

async function runAI() {

    const category =
        document.getElementById("aiCategory").value;


    const budget =
        document.getElementById("aiBudget").value;


    const result =
        document.getElementById("aiResult");


    if (!category) {

        showToast(
            "Аввал самти корро интихоб кунед."
        );

        return;

    }


    if (!budget) {

        showToast(
            "Аввал буҷетро интихоб кунед."
        );

        return;

    }


    if (result) {

        result.innerHTML = `

            <div class="ai-loading">

                Мутахассисони мувофиқ
                ҷустуҷӯ шуда истодаанд...

            </div>

        `;

    }


    await delay(700);


    /*
        Баъд аз Supabase:

        AI аз база specialistҳоро
        мувофиқи category ва budget
        интихоб мекунад.
    */


    const matches =
        allSpecialists.filter(function (specialist) {

            return specialist.category === category;

        });


    if (!matches.length) {

        if (result) {

            result.innerHTML = `

                <strong>
                    Мутахассиси мувофиқ ёфт нашуд.
                </strong>

                <br><br>

                Ҳоло дар ин самт мутахассис
                сабтином нашудааст.

            `;

        }

        return;

    }


    if (result) {

        result.innerHTML = `

            <strong>
                ${matches.length}
                мутахассиси мувофиқ ёфт шуд.
            </strong>

            <br><br>

            Барои дидани онҳо ба каталоги
            мутахассисон гузаред.

        `;

    }


    document
        .getElementById("specialists")
        ?.scrollIntoView({
            behavior: "smooth"
        });


}


/* =====================================================
   AUTH
===================================================== */

function openAuth(mode) {

    authMode = mode;


    const modal =
        document.getElementById("authModal");


    const title =
        document.getElementById("authTitle");


    const description =
        document.getElementById("authDescription");


    const roleSelector =
        document.getElementById("roleSelector");


    if (!modal) return;


    modal.classList.add("show");


    if (mode === "login") {

        title.textContent =
            "Даромадан";

        description.textContent =
            "Ба аккаунти худ ворид шавед.";

        roleSelector.style.display =
            "none";

    }


    else {

        title.textContent =
            "Регистрация";

        description.textContent =
            "Нақши худро интихоб кунед.";

        roleSelector.style.display =
            "grid";

    }

}


function closeAuth() {

    const modal =
        document.getElementById("authModal");

    if (modal) {

        modal.classList.remove("show");

    }

}


/* =====================================================
   ROLE
===================================================== */

function selectRole(role) {

    selectedRole = role;


    const client =
        document.getElementById("clientRole");


    const specialist =
        document.getElementById("specialistRole");


    if (client) {

        client.classList.remove("selected");

    }


    if (specialist) {

        specialist.classList.remove("selected");

    }


    if (role === "client" && client) {

        client.classList.add("selected");

    }


    if (
        role === "specialist" &&
        specialist
    ) {

        specialist.classList.add("selected");

    }

}


/* =====================================================
   AUTH SUBMIT
===================================================== */

async function submitAuth() {

    const name =
        getValue("authName");


    const phone =
        getValue("authPhone");


    const email =
        getValue("authEmail");


    const password =
        getValue("authPassword");


    if (authMode === "register") {

        if (!selectedRole) {

            showToast(
                "Аввал нақши худро интихоб кунед."
            );

            return;

        }

    }


    if (!name || !email || !password) {

        showToast(
            "Маълумоти заруриро пур кунед."
        );

        return;

    }


    /*
        Инҷо Supabase Authentication
        пайваст мешавад.

        Барои register:

        supabase.auth.signUp()

        Барои login:

        supabase.auth.signInWithPassword()

    */


    showToast(
        "Пайвастшавӣ ба система омода мешавад..."
    );

}


/* =====================================================
   SWITCH LOGIN / REGISTER
===================================================== */

function switchAuthMode() {

    if (authMode === "register") {

        openAuth("login");

    }

    else {

        openAuth("register");

    }

}


/* =====================================================
   CLIENT REQUEST
===================================================== */

function openClientRequest() {

    const modal =
        document.getElementById("requestModal");


    if (!modal) return;


    modal.classList.add("show");

}


function closeRequest() {

    const modal =
        document.getElementById("requestModal");


    if (modal) {

        modal.classList.remove("show");

    }

}


async function submitRequest() {

    const business =
        getValue("requestBusiness");


    const category =
        getValue("requestCategory");


    const budget =
        getValue("requestBudget");


    const description =
        getValue("requestDescription");


    if (
        !business ||
        !category ||
        !budget ||
        !description
    ) {

        showToast(
            "Ҳамаи майдонҳоро пур кунед."
        );

        return;

    }


    /*
        Баъд аз Supabase:

        requests INSERT

        client_id
        business
        category
        budget
        description
        status = "new"
    */


    closeRequest();


    showToast(
        "Дархости шумо омодаи фиристодан аст."
    );

}


/* =====================================================
   SPECIALIST PROFILE
===================================================== */

function openSpecialistProfile(id) {

    if (!id) {

        showToast(
            "Профил ёфт нашуд."
        );

        return;

    }


    /*
        Баъд аз сохтани profile page:

        window.location.href =
            "profile.html?id=" + id;

    */


    showToast(
        "Профил кушода мешавад..."
    );

}


/* =====================================================
   SAVED USER
===================================================== */

function checkSavedUser() {

    const saved =
        localStorage.getItem("smm_tj_user");


    if (!saved) {

        return;

    }


    try {

        currentUser =
            JSON.parse(saved);

        updateHeader();

    }

    catch (error) {

        localStorage.removeItem(
            "smm_tj_user"
        );

    }

}


function updateHeader() {

    const header =
        document.getElementById(
            "headerActions"
        );


    if (!header || !currentUser) {

        return;

    }


    const name =
        currentUser.name ||
        "Аккаунт";


    header.innerHTML = `

        <button
            class="btn btn-outline"
            onclick="openDashboard()">

            ${escapeHTML(name)}

        </button>


        <button
            class="btn btn-purple"
            onclick="logout()">

            Баромадан

        </button>

    `;

}


/* =====================================================
   DASHBOARD
===================================================== */

function openDashboard() {

    if (!currentUser) {

        openAuth("login");

        return;

    }


    if (currentUser.role === "client") {

        window.location.href =
            "client.html";

        return;

    }


    if (
        currentUser.role ===
        "specialist"
    ) {

        window.location.href =
            "specialist.html";

        return;

    }

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem(
        "smm_tj_user"
    );


    currentUser = null;


    location.reload();

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

    const toast =
        document.getElementById("toast");


    if (!toast) return;


    toast.textContent = message;


    toast.classList.add("show");


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(function () {

            toast.classList.remove(
                "show"
            );

        }, 3000);

}


/* =====================================================
   HELPERS
===================================================== */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) {

        return "";

    }


    return element.value.trim();

}


function delay(ms) {

    return new Promise(function (resolve) {

        setTimeout(resolve, ms);

    });

}


function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* =====================================================
   CLOSE MODALS BY CLICKING OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    function (event) {

        const authModal =
            document.getElementById(
                "authModal"
            );


        const requestModal =
            document.getElementById(
                "requestModal"
            );


        if (
            event.target === authModal
        ) {

            closeAuth();

        }


        if (
            event.target === requestModal
        ) {

            closeRequest();

        }

    }
);


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {

            return;

        }


        closeAuth();

        closeRequest();

    }
);