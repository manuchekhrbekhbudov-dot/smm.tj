document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       STORAGE
    ========================================= */

    let specialists =
        JSON.parse(
            localStorage.getItem("smm_specialists") || "[]"
        );

    let clients =
        JSON.parse(
            localStorage.getItem("smm_clients") || "[]"
        );

    let reviews =
        JSON.parse(
            localStorage.getItem("smm_reviews") || "[]"
        );


    /* =========================================
       SHORTCUTS
    ========================================= */

    const $ = (selector) =>
        document.querySelector(selector);

    const $$ = (selector) =>
        document.querySelectorAll(selector);


    /* =========================================
       MODALS
    ========================================= */

    const authModal =
        $("#authModal");

    const aiModal =
        $("#aiModal");

    const reviewModal =
        $("#reviewModal");

    const adminModal =
        $("#adminModal");


    function openModal(modal) {

        if (!modal) return;

        modal.classList.add("active");

        document.body.style.overflow =
            "hidden";
    }


    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove("active");

        document.body.style.overflow =
            "";
    }


    /* =========================================
       HEADER MENU
    ========================================= */

    const menuBtn =
        $("#menuBtn");

    const nav =
        $("#nav");


    if (menuBtn) {

        menuBtn.addEventListener(
            "click",
            () => {

                nav.classList.toggle(
                    "mobile"
                );

            }
        );

    }


    $$(".nav a").forEach(link => {

        link.addEventListener(
            "click",
            () => {

                nav.classList.remove(
                    "mobile"
                );

            }
        );

    });


    /* =========================================
       HEADER BUTTONS
    ========================================= */

    $("#loginBtn")?.addEventListener(
        "click",
        () => {

            resetAuth();

            openModal(
                authModal
            );

        }
    );


    $("#registerBtn")?.addEventListener(
        "click",
        () => {

            resetAuth();

            openModal(
                authModal
            );

        }
    );


    $("#smmBtn")?.addEventListener(
        "click",
        () => {

            resetAuth();

            openModal(
                authModal
            );

        }
    );


    $("#clientBtn")?.addEventListener(
        "click",
        () => {

            resetAuth();

            openModal(
                authModal
            );

        }
    );


    $("#ctaBtn")?.addEventListener(
        "click",
        () => {

            resetAuth();

            openModal(
                authModal
            );

        }
    );


    /* =========================================
       CLOSE BUTTONS
    ========================================= */

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


    /* =========================================
       CLICK OUTSIDE
    ========================================= */

    $$(".modal").forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal(modal);

                }

            }
        );

    });


    /* =========================================
       ESC
    ========================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                $$(".modal.active")
                    .forEach(modal => {

                        closeModal(
                            modal
                        );

                    });

            }

        }
    );


    /* =========================================
       AUTH RESET
    ========================================= */

    function resetAuth() {

        const role =
            $("#roleSelection");

        const smmForm =
            $("#smmForm");

        const clientForm =
            $("#clientForm");


        role?.classList.remove(
            "hidden"
        );

        smmForm?.classList.remove(
            "active"
        );

        clientForm?.classList.remove(
            "active"
        );

    }


    /* =========================================
       SMM ROLE
    ========================================= */

    $("#smmRole")?.addEventListener(
        "click",
        () => {

            $("#roleSelection")
                .classList.add(
                    "hidden"
                );

            $("#smmForm")
                .classList.add(
                    "active"
                );

        }
    );


    /* =========================================
       CLIENT ROLE
    ========================================= */

    $("#clientRole")?.addEventListener(
        "click",
        () => {

            $("#roleSelection")
                .classList.add(
                    "hidden"
                );

            $("#clientForm")
                .classList.add(
                    "active"
                );

        }
    );


    /* =========================================
       HERO FIND
    ========================================= */

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


    /* =========================================
       SMM FORM
    ========================================= */

    $("#smmForm")?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const specialist = {

                id:
                    Date.now(),

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


            specialists.push(
                specialist
            );


            localStorage.setItem(
                "smm_specialists",
                JSON.stringify(
                    specialists
                )
            );


            event.target.reset();


            resetAuth();

            closeModal(
                authModal
            );


            renderSpecialists();


            alert(
                "✓ Профили шумо қабул шуд!"
            );

        }
    );


    /* =========================================
       CLIENT FORM
    ========================================= */

    $("#clientForm")?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const client = {

                id:
                    Date.now(),

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


            clients.push(
                client
            );


            localStorage.setItem(
                "smm_clients",
                JSON.stringify(
                    clients
                )
            );


            event.target.reset();


            resetAuth();

            closeModal(
                authModal
            );


            alert(
                "✓ Дархости шумо қабул шуд!"
            );

        }
    );


    /* =========================================
       SPECIALISTS
    ========================================= */

    function renderSpecialists() {

        const list =
            $("#specialistsList");


        if (!list) return;


        if (
            specialists.length === 0
        ) {

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
                    specialist => `

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
                                    specialist.name
                                )}
                            </div>

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        specialist.name
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
                                    specialist.service
                                )}
                            </p>

                            <p>
                                ◎
                                ${escapeHTML(
                                    specialist.category
                                )}
                            </p>

                            <p>
                                ⌁ Таҷриба:
                                ${escapeHTML(
                                    specialist.experience
                                )}
                            </p>

                            <p>
                                ₽
                                ${escapeHTML(
                                    specialist.price
                                )}
                            </p>

                        </div>


                        <button
                            class="btn btn-primary"
                            style="width:100%"
                            data-profile="${specialist.id}"
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

                        const specialist =
                            specialists.find(
                                item =>
                                    item.id ==
                                    button.dataset.profile
                            );


                        if (
                            specialist
                        ) {

                            showProfile(
                                specialist
                            );

                        }

                    }
                );

            });

    }


    /* =========================================
       PROFILE
    ========================================= */

    function showProfile(
        specialist
    ) {

        const modal =
            document.createElement(
                "div"
            );


        modal.className =
            "modal active";


        modal.innerHTML = `

            <div
                class="modal-box"
            >

                <button
                    class="modal-close"
                    data-close
                >
                    ×
                </button>

                <span
                    class="section-label"
                >
                    VERIFIED PROFILE
                </span>

                <h2>
                    ${escapeHTML(
                        specialist.name
                    )}
                </h2>


                <div
                    class="specialist-info"
                >

                    <p>
                        Хизмат:
                        ${escapeHTML(
                            specialist.service
                        )}
                    </p>

                    <p>
                        Категория:
                        ${escapeHTML(
                            specialist.category
                        )}
                    </p>

                    <p>
                        Таҷриба:
                        ${escapeHTML(
                            specialist.experience
                        )}
                    </p>

                    <p>
                        Нарх:
                        ${escapeHTML(
                            specialist.price
                        )}
                    </p>

                    <p>
                        Instagram:
                        ${escapeHTML(
                            specialist.instagram ||
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
            .addEventListener(
                "click",
                () => modal.remove()
            );


        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    modal.remove();

                }

            }
        );


        modal
            .querySelector(
                "[data-contact]"
            )
            .addEventListener(
                "click",
                () => {

                    if (
                        specialist.instagram
                    ) {

                        const username =
                            specialist.instagram
                                .replace(
                                    /^@/,
                                    ""
                                )
                                .trim();


                        window.open(
                            `https://instagram.com/${encodeURIComponent(username)}`,
                            "_blank"
                        );

                    } else {

                        alert(
                            "Instagram-и мутахассис нишон дода нашудааст."
                        );

                    }

                }
            );

    }


    /* =========================================
       CATALOG
    ========================================= */

    $$(".catalog-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const category =
                        card.dataset.category;


                    openModal(
                        aiModal
                    );


                    showAI(
                        category
                    );

                }
            );

        });


    /* =========================================
       AI
    ========================================= */

    $("#aiBtn")?.addEventListener(
        "click",
        () => {

            openModal(
                aiModal
            );

        }
    );


    $("#startAiBtn")?.addEventListener(
        "click",
        () => {

            openModal(
                aiModal
            );

        }
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


    function showAI(
        category
    ) {

        const result =
            $("#aiResult");


        if (!result) return;


        const found =
            specialists.filter(
                specialist =>
                    specialist.category
                    === category
            );


        if (
            found.length === 0
        ) {

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
                <strong
                    style="color:#fff"
                >
                    ${escapeHTML(category)}
                </strong>
            </p>

            ${found
                .slice(0, 5)
                .map(
                    specialist => `

                    <div
                        class="ai-result-card"
                    >

                        <div>

                            <strong>
                                ${escapeHTML(
                                    specialist.name
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    specialist.price
                                )}
                            </small>

                        </div>

                        <button
                            class="btn btn-primary"
                            data-ai-profile="${specialist.id}"
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

                button.addEventListener(
                    "click",
                    () => {

                        const specialist =
                            specialists.find(
                                item =>
                                    item.id ==
                                    button.dataset.aiProfile
                            );


                        closeModal(
                            aiModal
                        );


                        if (
                            specialist
                        ) {

                            showProfile(
                                specialist
                            );

                        }

                    }
                );

            });

    }


    /* =========================================
       REVIEWS
    ========================================= */

    $("#reviewBtn")?.addEventListener(
        "click",
        () => {

            openModal(
                reviewModal
            );

        }
    );


    $("#reviewForm")?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const review = {

                id:
                    Date.now(),

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


            reviews.push(
                review
            );


            localStorage.setItem(
                "smm_reviews",
                JSON.stringify(
                    reviews
                )
            );


            event.target.reset();


            closeModal(
                reviewModal
            );


            renderReviews();


            alert(
                "★ Отзыв илова шуд!"
            );

        }
    );


    function renderReviews() {

        const list =
            $("#reviewsList");


        if (!list) return;


        if (
            reviews.length === 0
        ) {

            list.innerHTML = `

                <div
                    class="empty-state"
                >

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
                .slice()
                .reverse()
                .map(
                    review => `

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
                                    review.name
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        review.name
                                    )}
                                </strong>

                                <div
                                    class="review-stars"
                                >
                                    ${"★".repeat(
                                        review.rating
                                    )}

                                    ${"☆".repeat(
                                        5 -
                                        review.rating
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

                `
                )
                .join("");

    }


    /* =========================================
       ADMIN
    ========================================= */

    $("#adminBtn")?.addEventListener(
        "click",
        () => {

            $("#adminLogin")
                ?.classList.remove(
                    "hidden"
                );

            $("#adminDashboard")
                ?.classList.add(
                    "hidden"
                );

            openModal(
                adminModal
            );

        }
    );


    $("#adminLoginBtn")
        ?.addEventListener(
            "click",
            () => {

                const password =
                    $("#adminPassword")
                        .value;


                /*
                    TEST PASSWORD:
                    1234
                */

                if (
                    password !== "1234"
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


                renderAdmin();

            }
        );


    function renderAdmin() {

        const smmCount =
            $("#smmCount");

        const clientCount =
            $("#clientCount");

        const reviewCount =
            $("#reviewCount");


        if (smmCount) {

            smmCount.textContent =
                specialists.length;

        }


        if (clientCount) {

            clientCount.textContent =
                clients.length;

        }


        if (reviewCount) {

            reviewCount.textContent =
                reviews.length;

        }


        renderAdminSpecialists();

        renderAdminClients();

    }


    function renderAdminSpecialists() {

        const list =
            $("#adminSmmList");


        if (!list) return;


        if (
            specialists.length === 0
        ) {

            list.innerHTML =
                `
                <p
                    style="
                        color:#817787;
                        font-size:10px;
                    "
                >
                    Ҳоло маълумот нест.
                </p>
                `;

            return;

        }


        list.innerHTML =
            specialists
                .map(
                    specialist => `

                    <div
                        class="admin-item"
                    >

                        <span>
                            ${escapeHTML(
                                specialist.name
                            )}
                        </span>

                        <button
                            class="delete-btn"
                            data-delete-smm="${specialist.id}"
                        >
                            Нест кардан
                        </button>

                    </div>

                `
                )
                .join("");


        $$("[data-delete-smm]")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        specialists =
                            specialists.filter(
                                specialist =>
                                    specialist.id !=
                                    button.dataset.deleteSmm
                            );


                        localStorage.setItem(
                            "smm_specialists",
                            JSON.stringify(
                                specialists
                            )
                        );


                        renderAdmin();

                        renderSpecialists();

                    }
                );

            });

    }


    function renderAdminClients() {

        const list =
            $("#adminClientList");


        if (!list) return;


        if (
            clients.length === 0
        ) {

            list.innerHTML =
                `
                <p
                    style="
                        color:#817787;
                        font-size:10px;
                    "
                >
                    Ҳоло маълумот нест.
                </p>
                `;

            return;

        }


        list.innerHTML =
            clients
                .map(
                    client => `

                    <div
                        class="admin-item"
                    >

                        <span>

                            ${escapeHTML(
                                client.name
                            )}

                            —
                            ${escapeHTML(
                                client.business
                            )}

                        </span>

                    </div>

                `
                )
                .join("");

    }


    /* =========================================
       HELPERS
    ========================================= */

    function getInitials(
        name
    ) {

        if (!name) return "?";


        return name
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


    function escapeHTML(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =========================================
       START
    ========================================= */

    renderSpecialists();

    renderReviews();


    console.log(
        "✓ SMM.TJ PREMIUM — READY"
    );

});
