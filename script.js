const SUPABASE_URL = "https://lcldaingzicxbottlznq.supabase.co";
const SUPABASE_KEY = "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";

const API = `${SUPABASE_URL}/rest/v1`;

const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let specialists = [];
let reviews = [];


/* ================================
   DATABASE
================================ */

async function dbGet(table, query = "") {

    const response = await fetch(
        `${API}/${table}${query}`,
        {
            headers: {
                ...headers,
                Accept: "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return await response.json();
}


async function dbInsert(table, data) {

    const response = await fetch(
        `${API}/${table}`,
        {
            method: "POST",
            headers: {
                ...headers,
                Prefer: "return=representation"
            },
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return await response.json();
}


/* ================================
   MODALS
================================ */

const authModal = $("#authModal");
const aiModal = $("#aiModal");
const reviewModal = $("#reviewModal");
const adminModal = $("#adminModal");


function openModal(modal) {

    if (!modal) return;

    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("active");

    document.body.style.overflow = "";
}


function resetAuth() {

    $("#roleSelection")?.classList.remove("hidden");

    $("#smmForm")?.classList.remove("active");

    $("#clientForm")?.classList.remove("active");
}


/* ================================
   MENU
================================ */

$("#menuBtn")?.addEventListener(
    "click",
    () => {

        $("#nav")?.classList.toggle("mobile");

    }
);


$$(".nav a").forEach(link => {

    link.addEventListener(
        "click",
        () => {

            $("#nav")?.classList.remove("mobile");

        }
    );

});


/* ================================
   AUTH
================================ */

$("#loginBtn")?.addEventListener(
    "click",
    () => {

        resetAuth();

        openModal(authModal);

    }
);


$("#registerBtn")?.addEventListener(
    "click",
    () => {

        resetAuth();

        openModal(authModal);

    }
);


$("#ctaBtn")?.addEventListener(
    "click",
    () => {

        resetAuth();

        openModal(authModal);

    }
);


$("#authClose")?.addEventListener(
    "click",
    () => closeModal(authModal)
);


$("#aiClose")?.addEventListener(
    "click",
    () => closeModal(aiModal)
);


$("#reviewClose")?.addEventListener(
    "click",
    () => closeModal(reviewModal)
);


$("#adminClose")?.addEventListener(
    "click",
    () => closeModal(adminModal)
);


$$(".modal").forEach(modal => {

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {

                closeModal(modal);

            }

        }
    );

});


document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            $$(".modal.active").forEach(
                modal => closeModal(modal)
            );

        }

    }
);


/* ================================
   ROLE
================================ */

$("#smmRole")?.addEventListener(
    "click",
    () => {

        $("#roleSelection")
            .classList.add("hidden");

        $("#smmForm")
            .classList.add("active");

    }
);


$("#clientRole")?.addEventListener(
    "click",
    () => {

        $("#roleSelection")
            .classList.add("hidden");

        $("#clientForm")
            .classList.add("active");

    }
);


/* ================================
   FIND SPECIALIST
================================ */

$("#findBtn")?.addEventListener(
    "click",
    () => {

        $("#specialists")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


$("#allSpecialistsBtn")?.addEventListener(
    "click",
    () => {

        $("#specialists")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


/* ================================
   SMM → DATABASE
================================ */

$("#smmForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const button = event.submitter;

        if (button) {

            button.disabled = true;

            button.textContent =
                "Сабт шуда истодааст...";

        }


        const data = {

            name:
                $("#smmName")
                    .value
                    .trim(),

            phone:
                $("#smmPhone")
                    .value
                    .trim(),

            instagram:
                $("#smmInstagram")
                    .value
                    .trim(),

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

            category:
                $("#smmCategory")
                    .value

        };


        try {

            await dbInsert(
                "specialists",
                data
            );


            event.target.reset();

            resetAuth();

            closeModal(authModal);

            await loadSpecialists();


            alert(
                "✓ Профили шумо ба Database сабт шуд!"
            );


        } catch (error) {

            console.error(error);

            alert(
                "✕ Хато шуд. Database ё RLS-ро санҷ."
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "Профил сохтан →";

            }

        }

    }
);


/* ================================
   CLIENT → DATABASE
================================ */

$("#clientForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const button = event.submitter;

        if (button) {

            button.disabled = true;

            button.textContent =
                "Фиристода истодааст...";

        }


        const data = {

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
                    .trim()

        };


        try {

            await dbInsert(
                "clients",
                data
            );


            event.target.reset();

            resetAuth();

            closeModal(authModal);


            alert(
                "✓ Дархости шумо ба Database фиристода шуд!"
            );


        } catch (error) {

            console.error(error);

            alert(
                "✕ Хато ҳангоми фиристодани дархост."
            );


        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "Дархост фиристодан →";

            }

        }

    }
);


/* ================================
   LOAD SPECIALISTS
================================ */

async function loadSpecialists() {

    try {

        specialists =
            await dbGet(
                "specialists",
                "?select=*&order=created_at.desc"
            );


        renderSpecialists();


    } catch (error) {

        console.error(error);

        const list =
            $("#specialistsList");


        if (list) {

            list.innerHTML = `

                <div class="empty-state">

                    <div
                        style="
                            font-size:36px;
                            color:#c66aff;
                        "
                    >
                        !
                    </div>

                    <h3
                        style="
                            color:#fff;
                            margin:10px 0;
                        "
                    >
                        Database пайваст нашуд
                    </h3>

                    <p>
                        URL, Key ё RLS-ро санҷ.
                    </p>

                </div>

            `;

        }

    }

}


/* ================================
   HELPERS
================================ */

function getInitials(name) {

    return (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ================================
   RENDER SPECIALISTS
================================ */

function renderSpecialists() {

    const list =
        $("#specialistsList");


    if (!list) return;


    if (!specialists.length) {

        list.innerHTML = `

            <div class="empty-state">

                <div
                    style="
                        font-size:36px;
                        color:#c66aff;
                    "
                >
                    ✦
                </div>

                <h3
                    style="
                        color:#fff;
                        margin:10px 0;
                    "
                >
                    Ҳоло мутахассис нест
                </h3>

                <p>
                    Аввалин SMM-мутахассис
                    профили худро сохта метавонад.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML =
        specialists
            .map(
                item => `

                <article
                    class="specialist-card"
                >

                    <div
                        class="specialist-top"
                    >

                        <div
                            class="specialist-avatar"
                        >
                            ${getInitials(
                                item.name
                            )}
                        </div>

                        <div>

                            <h3>
                                ${escapeHTML(
                                    item.name
                                )}
                            </h3>

                            <small>
                                ✓ VERIFIED SPECIALIST
                            </small>

                        </div>

                    </div>


                    <div
                        class="specialist-info"
                    >

                        <p>
                            ◈
                            ${escapeHTML(
                                item.service
                            )}
                        </p>

                        <p>
                            ◎
                            ${escapeHTML(
                                item.category
                            )}
                        </p>

                        <p>
                            ⌁ Таҷриба:
                            ${escapeHTML(
                                item.experience
                            )}
                        </p>

                        <p>
                            ₽
                            ${escapeHTML(
                                item.price
                            )}
                        </p>

                    </div>


                    <button
                        class="btn btn-primary"
                        style="width:100%"
                        data-profile="${item.id}"
                    >
                        Профилро дидан →
                    </button>

                </article>

            `
            )
            .join("");


    $$("[data-profile]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const item =
                        specialists.find(
                            specialist =>
                                specialist.id ==
                                button.dataset.profile
                        );


                    if (item) {

                        showProfile(item);

                    }

                }
            );

        });

}


/* ================================
   PROFILE
================================ */

function showProfile(item) {

    const modal =
        document.createElement("div");


    modal.className =
        "modal active";


    modal.innerHTML = `

        <div class="modal-box">

            <button
                class="modal-close"
                data-close
            >
                ×
            </button>

            <span class="section-label">
                VERIFIED PROFILE
            </span>

            <h2>
                ${escapeHTML(
                    item.name
                )}
            </h2>

            <div
                class="specialist-info"
            >

                <p>
                    Хизмат:
                    ${escapeHTML(
                        item.service
                    )}
                </p>

                <p>
                    Категория:
                    ${escapeHTML(
                        item.category
                    )}
                </p>

                <p>
                    Таҷриба:
                    ${escapeHTML(
                        item.experience
                    )}
                </p>

                <p>
                    Нарх:
                    ${escapeHTML(
                        item.price
                    )}
                </p>

                <p>
                    Instagram:
                    ${escapeHTML(
                        item.instagram ||
                        "Нест"
                    )}
                </p>

            </div>


            <button
                class="btn btn-primary"
                style="width:100%"
                data-contact
            >
                📩 Тамос гирифтан
            </button>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelector(
            "[data-close]"
        )
        .onclick = () => {

            modal.remove();

        };


    modal.onclick = event => {

        if (
            event.target === modal
        ) {

            modal.remove();

        }

    };


    modal
        .querySelector(
            "[data-contact]"
        )
        .onclick = () => {

            if (!item.instagram) {

                alert(
                    "Instagram-и мутахассис нишон дода нашудааст."
                );

                return;

            }


            const username =
                item.instagram
                    .replace(
                        /^@/,
                        ""
                    )
                    .trim();


            window.open(
                `https://instagram.com/${encodeURIComponent(
                    username
                )}`,
                "_blank"
            );

        };

}


/* ================================
   CATALOG + AI
================================ */

$$(".catalog-card")
    .forEach(card => {

        card.addEventListener(
            "click",
            () => {

                openModal(aiModal);

                showAI(
                    card.dataset.category
                );

            }
        );

    });


$("#aiBtn")?.addEventListener(
    "click",
    () => openModal(aiModal)
);


$("#startAiBtn")?.addEventListener(
    "click",
    () => openModal(aiModal)
);


$$(".ai-categories button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                showAI(
                    button.dataset.ai
                );

            }
        );

    });


function showAI(category) {

    const result =
        $("#aiResult");


    if (!result) return;


    const found =
        specialists.filter(
            item =>
                item.category ===
                category
        );


    if (!found.length) {

        result.innerHTML = `

            <div
                class="empty-state"
                style="
                    margin-top:15px;
                    padding:28px 15px;
                "
            >

                <div
                    style="
                        font-size:28px;
                        color:#c66aff;
                    "
                >
                    ✦
                </div>

                <strong
                    style="
                        color:#fff;
                        display:block;
                        margin:8px 0;
                    "
                >
                    Мутахассис ёфт нашуд
                </strong>

                <p>
                    Барои
                    ${escapeHTML(category)}
                    ҳоло профил нест.
                </p>

            </div>

        `;

        return;

    }


    result.innerHTML = `

        <p
            style="
                color:#938899;
                font-size:11px;
                margin:12px 0;
            "
        >

            Мутахассисон барои

            <strong style="color:#fff">

                ${escapeHTML(category)}

            </strong>

        </p>


        ${found
            .slice(0, 5)
            .map(
                item => `

                <div
                    class="ai-result-card"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                item.name
                            )}
                        </strong>

                        <small>
                            ${escapeHTML(
                                item.price
                            )}
                        </small>

                    </div>


                    <button
                        class="btn btn-primary"
                        data-ai-profile="${item.id}"
                    >
                        Дидан
                    </button>

                </div>

            `
            )
            .join("")}

    `;


    $$("[data-ai-profile]")
        .forEach(button => {

            button.onclick = () => {

                const item =
                    specialists.find(
                        specialist =>
                            specialist.id ==
                            button.dataset.aiProfile
                    );


                closeModal(aiModal);


                if (item) {

                    showProfile(item);

                }

            };

        });

}


/* ================================
   REVIEWS → DATABASE
================================ */

$("#reviewBtn")?.addEventListener(
    "click",
    () => openModal(reviewModal)
);


$("#reviewForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const button =
            event.submitter;


        if (button) {

            button.disabled = true;

            button.textContent =
                "Фиристода истодааст...";

        }


        const data = {

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
                    .trim()

        };


        try {

            await dbInsert(
                "reviews",
                data
            );


            event.target.reset();

            closeModal(
                reviewModal
            );


            await loadReviews();


            alert(
                "★ Отзыв ба Database илова шуд!"
            );


        } catch (error) {

            console.error(error);

            alert(
                "✕ Хато ҳангоми илова кардани отзыв."
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    "Фиристодан →";

            }

        }

    }
);


async function loadReviews() {

    try {

        reviews =
            await dbGet(
                "reviews",
                "?select=*&order=created_at.desc"
            );


        renderReviews();


    } catch (error) {

        console.error(error);

    }

}


function renderReviews() {

    const list =
        $("#reviewsList");


    if (!list) return;


    if (!reviews.length) {

        list.innerHTML = `

            <div class="empty-state">

                <div
                    style="
                        font-size:35px;
                        color:#c66aff;
                    "
                >
                    ★
                </div>

                <h3
                    style="
                        color:#fff;
                        margin:10px 0;
                    "
                >
                    Ҳоло отзыв нест
                </h3>

                <p>
                    Аввалин отзывро гузоред.
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML =
        reviews
            .map(
                item => `

                <article
                    class="review-card"
                >

                    <div
                        class="review-top"
                    >

                        <div
                            class="review-avatar"
                        >
                            ${getInitials(
                                item.name
                            )}
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    item.name
                                )}
                            </strong>

                            <div
                                class="review-stars"
                            >
                                ${"★".repeat(
                                    item.rating
                                )}

                                ${"☆".repeat(
                                    5 -
                                    item.rating
                                )}
                            </div>

                        </div>

                    </div>


                    <p>
                        ${escapeHTML(
                            item.text
                        )}
                    </p>

                </article>

            `
            )
            .join("");

}


/* ================================
   ADMIN
================================ */

$("#adminBtn")?.addEventListener(
    "click",
    () => {

        openModal(adminModal);

        $("#adminLogin")
            ?.classList.remove(
                "hidden"
            );

        $("#adminDashboard")
            ?.classList.add(
                "hidden"
            );

    }
);


$("#adminLoginBtn")
    ?.addEventListener(
        "click",
        async () => {

            if (
                $("#adminPassword")
                    .value !== "1234"
            ) {

                alert(
                    "✕ Парол нодуруст аст."
                );

                return;

            }


            $("#adminLogin")
                .classList.add(
                    "hidden"
                );

            $("#adminDashboard")
                .classList.remove(
                    "hidden"
                );


            await renderAdmin();

        }
    );


async function renderAdmin() {

    try {

        const data =
            await dbGet(
                "specialists",
                "?select=*&order=created_at.desc"
            );


        const reviewData =
            await dbGet(
                "reviews",
                "?select=*&order=created_at.desc"
            );


        $("#smmCount")
            .textContent =
            data.length;


        $("#reviewCount")
            .textContent =
            reviewData.length;


        $("#clientCount")
            .textContent =
            "—";


        $("#adminSmmList")
            .innerHTML =
            data
                .map(
                    item => `

                    <div
                        class="admin-item"
                    >

                        <span>
                            ${escapeHTML(
                                item.name
                            )}
                        </span>

                    </div>

                `
                )
                .join("");


        $("#adminClientList")
            .innerHTML = `

            <p
                style="
                    color:#817787;
                    font-size:10px;
                "
            >
                Client data барои Admin
                баъд аз authentication
                кушода мешавад.
            </p>

        `;


    } catch (error) {

        console.error(error);

        alert(
            "✕ Admin database access error."
        );

    }

}


/* ================================
   START
================================ */

async function startApp() {

    console.log(
        "SMM.TJ — Supabase starting..."
    );


    await Promise.all([
        loadSpecialists(),
        loadReviews()
    ]);


    console.log(
        "✓ SMM.TJ — SUPABASE CONNECTED"
    );

}


startApp();
