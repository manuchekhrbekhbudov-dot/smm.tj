"use strict";

/* =========================================
   SMM.TJ — MAIN JAVASCRIPT
========================================= */

const DB_KEY = "SMM_TJ_DATABASE_V1";

let db = JSON.parse(
    localStorage.getItem(DB_KEY) ||
    JSON.stringify({
        smm: [],
        clients: [],
        requests: [],
        reviews: []
    })
);

let currentRequestProfile = null;
let adminLoggedIn = false;


/* =========================================
   HELPERS
========================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);

function saveDB() {
    localStorage.setItem(
        DB_KEY,
        JSON.stringify(db)
    );
}

function createId() {
    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}

function escapeHTML(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function openModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(id) {
    const modal = $(id);

    if (modal) {
        modal.classList.remove("active");
    }
}

function toast(message) {

    const old = $(".toast");

    if (old) {
        old.remove();
    }

    const element =
        document.createElement("div");

    element.className = "toast";

    element.textContent = message;

    $("#toastContainer").appendChild(
        element
    );

    setTimeout(() => {
        element.remove();
    }, 3000);
}


/* =========================================
   MOBILE MENU
========================================= */

const mobileMenuBtn =
    $("#mobileMenuBtn");

const mainNav =
    $("#mainNav");

if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener(
        "click",
        () => {

            mainNav.classList.toggle(
                "mobile"
            );

        }
    );
}


$$(".nav a").forEach(link => {

    link.addEventListener(
        "click",
        () => {

            mainNav.classList.remove(
                "mobile"
            );

        }
    );

});


/* =========================================
   AUTH MODAL
========================================= */

function openAuth() {

    openModal("#authModal");

    $("#authRoleSelection")
        .style.display = "block";

    $("#smmForm")
        .classList.remove("active");

    $("#clientForm")
        .classList.remove("active");
}

function closeAuth() {
    closeModal("#authModal");
}


$("#loginBtn")
    ?.addEventListener(
        "click",
        openAuth
    );

$("#registerBtn")
    ?.addEventListener(
        "click",
        openAuth
    );

$("#ctaRegisterBtn")
    ?.addEventListener(
        "click",
        openAuth
    );

$("#authClose")
    ?.addEventListener(
        "click",
        closeAuth
    );


/* =========================================
   SMM / CLIENT ROLE
========================================= */

function showSmmForm() {

    $("#authRoleSelection")
        .style.display = "none";

    $("#smmForm")
        .classList.add("active");

    $("#clientForm")
        .classList.remove("active");
}

function showClientForm() {

    $("#authRoleSelection")
        .style.display = "none";

    $("#clientForm")
        .classList.add("active");

    $("#smmForm")
        .classList.remove("active");
}


$("#smmRoleBtn")
    ?.addEventListener(
        "click",
        showSmmForm
    );

$("#clientRoleBtn")
    ?.addEventListener(
        "click",
        showClientForm
    );

$("#heroSmmBtn")
    ?.addEventListener(
        "click",
        () => {

            openAuth();
            showSmmForm();

        }
    );

$("#heroClientBtn")
    ?.addEventListener(
        "click",
        () => {

            openAuth();
            showClientForm();

        }
    );

$("#registerSmmFromEmpty")
    ?.addEventListener(
        "click",
        () => {

            openAuth();
            showSmmForm();

        }
    );


$("#backToRolesFromSmm")
    ?.addEventListener(
        "click",
        () => {

            $("#smmForm")
                .classList.remove("active");

            $("#authRoleSelection")
                .style.display = "block";

        }
    );


$("#backToRolesFromClient")
    ?.addEventListener(
        "click",
        () => {

            $("#clientForm")
                .classList.remove("active");

            $("#authRoleSelection")
                .style.display = "block";

        }
    );


/* =========================================
   SMM REGISTRATION
========================================= */

$("#smmForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const profile = {

                id: createId(),

                name:
                    $("#smmName")
                    .value
                    .trim(),

                instagram:
                    $("#smmInstagram")
                    .value
                    .trim(),

                phone:
                    $("#smmPhone")
                    .value
                    .trim(),

                category:
                    $("#smmCategory")
                    .value,

                service:
                    $("#smmService")
                    .value
                    .trim(),

                experience:
                    $("#smmExperience")
                    .value
                    .trim(),

                price:
                    $("#smmPrice")
                    .value
                    .trim(),

                status:
                    "pending",

                createdAt:
                    new Date().toISOString()

            };

            db.smm.push(profile);

            saveDB();

            event.target.reset();

            closeAuth();

            toast(
                "✅ Профил қабул шуд. Админ онро месанҷад."
            );

            renderAll();

        }
    );


/* =========================================
   CLIENT REGISTRATION
========================================= */

$("#clientForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const client = {

                id: createId(),

                name:
                    $("#clientName")
                    .value
                    .trim(),

                phone:
                    $("#clientPhone")
                    .value
                    .trim(),

                business:
                    $("#clientBusiness")
                    .value
                    .trim(),

                category:
                    $("#clientCategory")
                    .value,

                need:
                    $("#clientNeed")
                    .value
                    .trim(),

                createdAt:
                    new Date().toISOString()

            };

            db.clients.push(client);

            saveDB();

            event.target.reset();

            closeAuth();

            toast(
                "✅ Дархости шумо қабул шуд."
            );

            renderAll();

        }
    );


/* =========================================
   FIND SPECIALIST
========================================= */

$("#findSpecialistBtn")
    ?.addEventListener(
        "click",
        () => {

            $("#specialists")
                .scrollIntoView({
                    behavior: "smooth"
                });

        }
    );


/* =========================================
   CATEGORIES
========================================= */

$$(".category-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const category =
                    card.dataset.category;

                openCategory(
                    category
                );

            }
        );

    });


function openCategory(category) {

    $("#specialists")
        .scrollIntoView({
            behavior: "smooth"
        });

    setTimeout(() => {

        const specialists =
            db.smm.filter(
                person =>
                    person.status ===
                        "approved" &&
                    person.category ===
                        category
            );

        renderSpecialists(
            specialists
        );

    }, 500);
}


/* =========================================
   SPECIALISTS
========================================= */

function renderSpecialists(
    customList = null
) {

    const list =
        customList ||
        db.smm.filter(
            person =>
                person.status ===
                "approved"
        );

    const container =
        $("#specialistsList");

    if (!container) return;


    if (!list.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    👨‍💻
                </div>

                <h3>
                    Ҳоло SMM-щик нест
                </h3>

                <p>
                    Ҳоло ягон мутахассиси
                    тасдиқшуда вуҷуд надорад.
                </p>

                <button
                    class="btn btn--primary"
                    onclick="openSmmRegistration()"
                >
                    Ман SMM-щик ҳастам
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML =
        list.map(person => `

            <article
                class="specialist-card"
            >

                <div class="specialist-card__avatar">
                    👨‍💻
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

                <p>
                    ${escapeHTML(
                        person.service
                    )}
                </p>

                <p>
                    📂 ${escapeHTML(
                        person.category
                    )}
                </p>

                <p>
                    🎯 Таҷриба:
                    ${escapeHTML(
                        person.experience
                    )}
                </p>

                <div
                    class="specialist-card__bottom"
                >

                    <strong>
                        ${escapeHTML(
                            person.price
                        )}
                    </strong>

                    <button
                        class="btn btn--primary"
                        onclick="viewProfile('${person.id}')"
                    >
                        Профил →
                    </button>

                </div>

            </article>

        `)
        .join("");
}


/* =========================================
   PROFILE
========================================= */

window.viewProfile =
    function(id) {

        const person =
            db.smm.find(
                x => x.id === id
            );

        if (!person) return;


        $("#profileContent").innerHTML = `

            <div class="profile">

                <div class="profile__avatar">
                    👨‍💻
                </div>

                <span class="verified">
                    ✓ SMM-щик тасдиқшуда
                </span>

                <h2>
                    ${escapeHTML(
                        person.name
                    )}
                </h2>

                <p>
                    📂 ${escapeHTML(
                        person.category
                    )}
                </p>

                <p>
                    🛠 ${escapeHTML(
                        person.service
                    )}
                </p>

                <p>
                    🎯 Таҷриба:
                    ${escapeHTML(
                        person.experience
                    )}
                </p>

                <p>
                    💰 ${escapeHTML(
                        person.price
                    )}
                </p>

                ${
                    person.instagram
                    ?
                    `
                    <p>
                        📸 ${escapeHTML(
                            person.instagram
                        )}
                    </p>
                    `
                    :
                    ""
                }

                <button
                    class="btn btn--primary btn--full"
                    onclick="openRequest('${person.id}')"
                >
                    📩 Дархости ҳамкорӣ
                </button>

            </div>

        `;

        openModal("#profileModal");

    };


window.openSmmRegistration =
    function() {

        openAuth();
        showSmmForm();

    };


/* =========================================
   REQUEST
========================================= */

window.openRequest =
    function(id) {

        const person =
            db.smm.find(
                x => x.id === id
            );

        if (!person) return;

        currentRequestProfile =
            id;

        $("#requestProfileId")
            .value = id;

        $("#requestSpecialistName")
            .textContent =
            "Дархост ба " +
            person.name;

        closeModal(
            "#profileModal"
        );

        openModal(
            "#requestModal"
        );

    };


$("#requestClose")
    ?.addEventListener(
        "click",
        () => {

            closeModal(
                "#requestModal"
            );

        }
    );


$("#requestForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const request = {

                id: createId(),

                profileId:
                    $("#requestProfileId")
                    .value,

                name:
                    $("#requestName")
                    .value
                    .trim(),

                phone:
                    $("#requestPhone")
                    .value
                    .trim(),

                message:
                    $("#requestMessage")
                    .value
                    .trim(),

                createdAt:
                    new Date().toISOString()

            };

            db.requests.push(request);

            saveDB();

            event.target.reset();

            closeModal(
                "#requestModal"
            );

            toast(
                "✅ Дархост фиристода шуд."
            );

            renderAll();

        }
    );


/* =========================================
   REVIEWS
========================================= */

function renderReviews() {

    const container =
        $("#reviewsList");

    if (!container) return;


    if (!db.reviews.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    ⭐
                </div>

                <h3>
                    Ҳоло отзыв нест
                </h3>

                <p>
                    Ҳанӯз ягон муштарӣ
                    отзыв нагузоштааст.
                </p>

                <button
                    class="btn btn--primary"
                    onclick="openReviewModal()"
                >
                    ⭐ Аввалин отзывро гузоред
                </button>

            </div>

        `;

        return;
    }


    container.innerHTML =
        db.reviews
            .map(review => `

                <article class="review-card">

                    <div class="review-stars">
                        ${"⭐".repeat(
                            review.rating
                        )}
                    </div>

                    <p>
                        “${escapeHTML(
                            review.text
                        )}”
                    </p>

                    <strong>
                        ${escapeHTML(
                            review.name
                        )}
                    </strong>

                    <small>
                        Муштарӣ
                    </small>

                </article>

            `)
            .join("");

}


function openReviewModal() {

    openModal(
        "#reviewModal"
    );

}

window.openReviewModal =
    openReviewModal;


$("#addReviewBtn")
    ?.addEventListener(
        "click",
        openReviewModal
    );


$("#reviewClose")
    ?.addEventListener(
        "click",
        () => {

            closeModal(
                "#reviewModal"
            );

        }
    );


$("#reviewForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const review = {

                id: createId(),

                name:
                    $("#reviewName")
                    .value
                    .trim(),

                rating:
                    Number(
                        $("#reviewRating")
                        .value
                    ),

                text:
                    $("#reviewText")
                    .value
                    .trim(),

                createdAt:
                    new Date().toISOString()

            };

            db.reviews.push(review);

            saveDB();

            event.target.reset();

            closeModal(
                "#reviewModal"
            );

            toast(
                "⭐ Отзыв нигоҳ дошта шуд."
            );

            renderReviews();

            renderAdmin();

        }
    );


/* =========================================
   AI
========================================= */

function openAI() {

    $("#aiResult").innerHTML = "";

    openModal(
        "#aiModal"
    );

}

$("#openAiBtn")
    ?.addEventListener(
        "click",
        openAI
    );

$("#startAiBtn")
    ?.addEventListener(
        "click",
        openAI
    );

$("#aiClose")
    ?.addEventListener(
        "click",
        () => {

            closeModal(
                "#aiModal"
            );

        }
    );


$$("[data-ai-category]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset
                        .aiCategory;

                const specialists =
                    db.smm.filter(
                        person =>
                            person.status ===
                                "approved" &&
                            person.category ===
                                category
                    );

                showAIResults(
                    category,
                    specialists
                );

            }
        );

    });


function showAIResults(
    category,
    specialists
) {

    const result =
        $("#aiResult");

    if (!specialists.length) {

        result.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    🤖
                </div>

                <h3>
                    Мутахассис ёфт нашуд
                </h3>

                <p>
                    Барои ин категория
                    ҳоло SMM-щик тасдиқ нашудааст.
                </p>

            </div>

        `;

        return;
    }


    result.innerHTML = `

        <div class="ai-results">

            <h3>
                Мутахассисони мувофиқ:
            </h3>

            ${specialists
                .map(person => `

                    <div
                        class="ai-result-card"
                    >

                        <strong>
                            ${escapeHTML(
                                person.name
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                person.service
                            )}
                        </p>

                        <button
                            class="btn btn--primary"
                            onclick="viewProfile('${person.id}')"
                        >
                            Профил →
                        </button>

                    </div>

                `)
                .join("")}

        </div>

    `;

}


/* =========================================
   ADMIN PANEL
========================================= */

$("#adminBtn")
    ?.addEventListener(
        "click",
        () => {

            openModal(
                "#adminModal"
            );

            if (adminLoggedIn) {

                $("#adminLogin")
                    .style.display =
                    "none";

                $("#adminDashboard")
                    .style.display =
                    "block";

                renderAdmin();

            }

        }
    );


$("#adminClose")
    ?.addEventListener(
        "click",
        () => {

            closeModal(
                "#adminModal"
            );

        }
    );


/*
    DEMO PASSWORD

    admin123

    Баъд аз пайваст кардани
    backend инро ба login-и
    воқеӣ иваз мекунем.
*/

$("#adminLoginForm")
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const password =
                $("#adminPassword")
                .value;

            if (
                password !==
                "admin123"
            ) {

                toast(
                    "❌ Парол нодуруст аст."
                );

                return;
            }

            adminLoggedIn = true;

            $("#adminLogin")
                .style.display =
                "none";

            $("#adminDashboard")
                .style.display =
                "block";

            $("#adminPassword")
                .value = "";

            renderAdmin();

            toast(
                "👑 Ба Admin Panel ворид шудед."
            );

        }
    );


$("#adminLogout")
    ?.addEventListener(
        "click",
        () => {

            adminLoggedIn = false;

            $("#adminDashboard")
                .style.display =
                "none";

            $("#adminLogin")
                .style.display =
                "block";

            toast(
                "Шумо аз Admin Panel баромадед."
            );

        }
    );


/* =========================================
   ADMIN RENDER
========================================= */

function renderAdmin() {

    $("#adminSmmCount")
        .textContent =
        db.smm.length;

    $("#adminClientCount")
        .textContent =
        db.clients.length;

    $("#adminRequestCount")
        .textContent =
        db.requests.length;

    $("#adminReviewCount")
        .textContent =
        db.reviews.length;


    const pending =
        db.smm.filter(
            x =>
                x.status ===
                "pending"
        ).length;

    $("#pendingSmmCount")
        .textContent =
        pending;


    renderAdminSmm();

    renderAdminClients();

    renderAdminRequests();

    renderAdminReviews();

}


/* =========================================
   ADMIN SMM
========================================= */

function renderAdminSmm() {

    const container =
        $("#adminSmmList");

    if (!db.smm.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло ягон SMM-щик нест.
            </div>
        `;

        return;
    }


    container.innerHTML =
        db.smm
            .map(person => `

                <div class="admin-item">

                    <strong>
                        ${escapeHTML(
                            person.name
                        )}
                    </strong>

                    <p>
                        📞 ${escapeHTML(
                            person.phone
                        )}
                    </p>

                    <p>
                        📂 ${escapeHTML(
                            person.category
                        )}
                    </p>

                    <p>
                        🛠 ${escapeHTML(
                            person.service
                        )}
                    </p>

                    <p>
                        Статус:
                        <strong>
                            ${getStatusText(
                                person.status
                            )}
                        </strong>
                    </p>


                    <div
                        class="admin-item__buttons"
                    >

                        ${
                            person.status !==
                            "approved"
                            ?
                            `
                            <button
                                class="btn btn--primary"
                                onclick="approveSmm('${person.id}')"
                            >
                                ✓ Тасдиқ
                            </button>
                            `
                            :
                            ""
                        }


                        ${
                            person.status !==
                            "rejected"
                            ?
                            `
                            <button
                                class="btn btn--dark"
                                onclick="rejectSmm('${person.id}')"
                            >
                                ✕ Рад
                            </button>
                            `
                            :
                            ""
                        }


                        <button
                            class="btn btn--dark"
                            onclick="deleteSmm('${person.id}')"
                        >
                            🗑 Нест кардан
                        </button>

                    </div>

                </div>

            `)
            .join("");

}


function getStatusText(status) {

    if (status === "approved")
        return "✓ Тасдиқшуда";

    if (status === "rejected")
        return "✕ Радшуда";

    return "⏳ Дар интизорӣ";
}


window.approveSmm =
    function(id) {

        const person =
            db.smm.find(
                x => x.id === id
            );

        if (!person) return;

        person.status =
            "approved";

        saveDB();

        renderAll();

        toast(
            "✅ SMM-щик тасдиқ шуд."
        );

    };


window.rejectSmm =
    function(id) {

        const person =
            db.smm.find(
                x => x.id === id
            );

        if (!person) return;

        person.status =
            "rejected";

        saveDB();

        renderAll();

        toast(
            "❌ SMM-щик рад шуд."
        );

    };


window.deleteSmm =
    function(id) {

        const confirmDelete =
            confirm(
                "Ин SMM-щик нест карда шавад?"
            );

        if (!confirmDelete)
            return;

        db.smm =
            db.smm.filter(
                x => x.id !== id
            );

        saveDB();

        renderAll();

        toast(
            "🗑 SMM-щик нест шуд."
        );

    };


/* =========================================
   ADMIN CLIENTS
========================================= */

function renderAdminClients() {

    const container =
        $("#adminClientList");

    if (!db.clients.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло ягон муштарӣ нест.
            </div>
        `;

        return;
    }


    container.innerHTML =
        db.clients
            .map(client => `

                <div class="admin-item">

                    <strong>
                        ${escapeHTML(
                            client.name
                        )}
                    </strong>

                    <p>
                        🏢 ${escapeHTML(
                            client.business
                        )}
                    </p>

                    <p>
                        📞 ${escapeHTML(
                            client.phone
                        )}
                    </p>

                    <p>
                        📂 ${escapeHTML(
                            client.category
                        )}
                    </p>

                    <p>
                        💬 ${escapeHTML(
                            client.need
                        )}
                    </p>

                </div>

            `)
            .join("");

}


/* =========================================
   ADMIN REQUESTS
========================================= */

function renderAdminRequests() {

    const container =
        $("#adminRequestList");

    if (!db.requests.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло ягон дархост нест.
            </div>
        `;

        return;
    }


    container.innerHTML =
        db.requests
            .map(request => {

                const person =
                    db.smm.find(
                        x =>
                            x.id ===
                            request.profileId
                    );

                return `

                    <div class="admin-item">

                        <strong>
                            ${escapeHTML(
                                request.name
                            )}
                        </strong>

                        <p>
                            SMM:
                            ${
                                person
                                ?
                                escapeHTML(
                                    person.name
                                )
                                :
                                "Номаълум"
                            }
                        </p>

                        <p>
                            📞 ${escapeHTML(
                                request.phone
                            )}
                        </p>

                        <p>
                            💬 ${escapeHTML(
                                request.message
                            )}
                        </p>

                    </div>

                `;

            })
            .join("");

}


/* =========================================
   ADMIN REVIEWS
========================================= */

function renderAdminReviews() {

    const container =
        $("#adminReviewList");

    if (!db.reviews.length) {

        container.innerHTML = `
            <div class="empty-state">
                Ҳоло ягон отзыв нест.
            </div>
        `;

        return;
    }


    container.innerHTML =
        db.reviews
            .map(review => `

                <div class="admin-item">

                    <strong>
                        ${escapeHTML(
                            review.name
                        )}
                    </strong>

                    <p>
                        ${"⭐".repeat(
                            review.rating
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            review.text
                        )}
                    </p>

                    <button
                        class="btn btn--dark"
                        onclick="deleteReview('${review.id}')"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

            `)
            .join("");

}


window.deleteReview =
    function(id) {

        const ok =
            confirm(
                "Ин отзыв нест карда шавад?"
            );

        if (!ok) return;

        db.reviews =
            db.reviews.filter(
                x => x.id !== id
            );

        saveDB();

        renderAll();

        toast(
            "🗑 Отзыв нест шуд."
        );

    };


/* =========================================
   CLOSE MODALS WHEN CLICK OUTSIDE
========================================= */

$$(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    overlay
                ) {

                    overlay.classList
                        .remove("active");

                }

            }
        );

    });


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            $$(".modal-overlay")
                .forEach(modal => {

                    modal.classList
                        .remove("active");

                });

        }

    }
);


/* =========================================
   RENDER ALL
========================================= */

function renderAll() {

    renderSpecialists();

    renderReviews();

    if (adminLoggedIn) {
        renderAdmin();
    }

}


/* =========================================
   START
========================================= */

saveDB();

renderAll();

console.log(
    "SMM.TJ loaded successfully."
);
