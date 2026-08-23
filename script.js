/* =====================================================
   SMM.TJ — SCRIPT.JS
   CLEAN VERSION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       ELEMENTS
    ================================================= */

    const nav = document.getElementById("nav");
    const menuBtn = document.getElementById("menuBtn");

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    const findBtn = document.getElementById("findBtn");
    const aiBtn = document.getElementById("aiBtn");

    const smmBtn = document.getElementById("smmBtn");
    const clientBtn = document.getElementById("clientBtn");

    const startAiBtn = document.getElementById("startAiBtn");

    const reviewBtn = document.getElementById("reviewBtn");
    const adminBtn = document.getElementById("adminBtn");

    /* =================================================
       MODALS
    ================================================= */

    const authModal = document.getElementById("authModal");
    const reviewModal = document.getElementById("reviewModal");
    const aiModal = document.getElementById("aiModal");
    const adminModal = document.getElementById("adminModal");

    const authClose = document.getElementById("authClose");
    const reviewClose = document.getElementById("reviewClose");
    const aiClose = document.getElementById("aiClose");
    const adminClose = document.getElementById("adminClose");

    /* =================================================
       FORMS
    ================================================= */

    const roleSelection =
        document.getElementById("roleSelection");

    const smmForm =
        document.getElementById("smmForm");

    const clientForm =
        document.getElementById("clientForm");

    const smmRole =
        document.getElementById("smmRole");

    const clientRole =
        document.getElementById("clientRole");

    const reviewForm =
        document.getElementById("reviewForm");

    /* =================================================
       STORAGE
    ================================================= */

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


    /* =================================================
       MENU
    ================================================= */

    if (menuBtn && nav) {

        menuBtn.addEventListener("click", () => {

            nav.classList.toggle("mobile");

        });

    }


    document.querySelectorAll(".nav a").forEach(link => {

        link.addEventListener("click", () => {

            if (nav) {
                nav.classList.remove("mobile");
            }

        });

    });


    /* =================================================
       MODAL FUNCTIONS
    ================================================= */

    function openModal(modal) {

        if (!modal) return;

        modal.classList.add("active");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow = "hidden";
    }


    function closeModal(modal) {

        if (!modal) return;

        modal.classList.remove("active");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow = "";
    }


    /* =================================================
       CLOSE BUTTONS
    ================================================= */

    if (authClose) {
        authClose.addEventListener(
            "click",
            () => closeModal(authModal)
        );
    }

    if (reviewClose) {
        reviewClose.addEventListener(
            "click",
            () => closeModal(reviewModal)
        );
    }

    if (aiClose) {
        aiClose.addEventListener(
            "click",
            () => closeModal(aiModal)
        );
    }

    if (adminClose) {
        adminClose.addEventListener(
            "click",
            () => closeModal(adminModal)
        );
    }


    /* =================================================
       CLICK OUTSIDE MODAL
    ================================================= */

    document.querySelectorAll(".modal").forEach(modal => {

        modal.classList.remove("active");

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


    /* =================================================
       ESC
    ================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }

            document
                .querySelectorAll(".modal.active")
                .forEach(modal => {

                    closeModal(modal);

                });

        }
    );


    /* =================================================
       AUTH
    ================================================= */

    function openAuth() {

        if (!authModal) return;

        roleSelection.style.display = "block";

        smmForm.classList.remove("active");

        clientForm.classList.remove("active");

        openModal(authModal);
    }


    if (loginBtn) {
        loginBtn.addEventListener(
            "click",
            openAuth
        );
    }


    if (registerBtn) {
        registerBtn.addEventListener(
            "click",
            openAuth
        );
    }


    if (smmBtn) {

        smmBtn.addEventListener(
            "click",
            openAuth
        );

    }


    if (clientBtn) {

        clientBtn.addEventListener(
            "click",
            openAuth
        );

    }


    /* =================================================
       SMM ROLE
    ================================================= */

    if (smmRole) {

        smmRole.addEventListener(
            "click",
            () => {

                roleSelection.style.display = "none";

                smmForm.classList.add("active");

                clientForm.classList.remove("active");

            }
        );

    }


    /* =================================================
       CLIENT ROLE
    ================================================= */

    if (clientRole) {

        clientRole.addEventListener(
            "click",
            () => {

                roleSelection.style.display = "none";

                clientForm.classList.add("active");

                smmForm.classList.remove("active");

            }
        );

    }


    /* =================================================
       SMM FORM
    ================================================= */

    if (smmForm) {

        smmForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const specialist = {

                    id: Date.now(),

                    name:
                        document.getElementById(
                            "smmName"
                        ).value.trim(),

                    phone:
                        document.getElementById(
                            "smmPhone"
                        ).value.trim(),

                    instagram:
                        document.getElementById(
                            "smmInstagram"
                        ).value.trim(),

                    service:
                        document.getElementById(
                            "smmService"
                        ).value.trim(),

                    experience:
                        document.getElementById(
                            "smmExperience"
                        ).value.trim(),

                    price:
                        document.getElementById(
                            "smmPrice"
                        ).value.trim(),

                    category:
                        document.getElementById(
                            "smmCategory"
                        ).value.trim()

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


                alert(
                    "✅ Маълумот қабул шуд!"
                );


                smmForm.reset();

                closeModal(authModal);

                renderSpecialists();

            }
        );

    }


    /* =================================================
       CLIENT FORM
    ================================================= */

    if (clientForm) {

        clientForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const client = {

                    id: Date.now(),

                    name:
                        document.getElementById(
                            "clientName"
                        ).value.trim(),

                    phone:
                        document.getElementById(
                            "clientPhone"
                        ).value.trim(),

                    business:
                        document.getElementById(
                            "clientBusiness"
                        ).value.trim(),

                    category:
                        document.getElementById(
                            "clientCategory"
                        ).value.trim(),

                    need:
                        document.getElementById(
                            "clientNeed"
                        ).value.trim()

                };


                clients.push(client);


                localStorage.setItem(
                    "smm_clients",
                    JSON.stringify(
                        clients
                    )
                );


                alert(
                    "✅ Дархости шумо қабул шуд!"
                );


                clientForm.reset();

                closeModal(authModal);

            }
        );

    }


    /* =================================================
       RENDER SPECIALISTS
    ================================================= */

    function renderSpecialists() {

        const list =
            document.getElementById(
                "specialistsList"
            );

        if (!list) return;


        if (specialists.length === 0) {

            list.innerHTML = `

                <div class="empty-state">

                    <div>👨‍💻</div>

                    <h3>
                        Ҳоло SMM-СПЕЦИАЛИСТ нест
                    </h3>

                    <p>
                        Ҳоло ягон мутахассиси
                        тасдиқшуда вуҷуд надорад.
                    </p>

                </div>

            `;

            return;
        }


        list.innerHTML =
            specialists.map(
                specialist => `

                <article
                    class="specialist-card"
                >

                    <div
                        class="specialist-top"
                    >

                        <div
                            class="avatar"
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

                        <p>
                            💼
                            ${escapeHTML(
                                specialist.service
                            )}
                        </p>

                        <p>
                            🎯
                            ${escapeHTML(
                                specialist.category
                            )}
                        </p>

                        <p>
                            ⏱️
                            ${escapeHTML(
                                specialist.experience
                            )}
                        </p>

                        <p>
                            💰
                            ${escapeHTML(
                                specialist.price
                            )}
                        </p>

                    </div>


                    <button
                        class="btn btn-primary profile-btn"
                        data-profile="${specialist.id}"
                    >
                        Профилро дидан →
                    </button>

                </article>

            `
            ).join("");


        document
            .querySelectorAll(
                "[data-profile]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.profile
                            );

                        const specialist =
                            specialists.find(
                                item =>
                                    item.id === id
                            );

                        if (!specialist) {
                            return;
                        }

                        showProfile(
                            specialist
                        );

                    }
                );

            });

    }


    /* =================================================
       PROFILE
    ================================================= */

    function showProfile(specialist) {

        const modal =
            document.createElement(
                "div"
            );

        modal.className = "modal active";

        modal.innerHTML = `

            <div class="modal-box">

                <button
                    class="modal-close"
                    type="button"
                    data-close
                >
                    ×
                </button>

                <div
                    style="
                        text-align:center;
                    "
                >

                    <div
                        class="profile-avatar"
                        style="
                            margin:0 auto 15px;
                        "
                    >
                        ${getInitials(
                            specialist.name
                        )}
                    </div>

                    <span
                        class="eyebrow"
                    >
                        ✓ VERIFIED SMM
                    </span>

                    <h2
                        style="
                            margin-top:15px;
                        "
                    >
                        ${escapeHTML(
                            specialist.name
                        )}
                    </h2>

                </div>


                <div
                    class="specialist-info"
                    style="
                        margin-top:25px;
                    "
                >

                    <p>
                        💼 Хизмат:
                        ${escapeHTML(
                            specialist.service
                        )}
                    </p>

                    <p>
                        🎯 Категория:
                        ${escapeHTML(
                            specialist.category
                        )}
                    </p>

                    <p>
                        ⏱️ Таҷриба:
                        ${escapeHTML(
                            specialist.experience
                        )}
                    </p>

                    <p>
                        💰 Нарх:
                        ${escapeHTML(
                            specialist.price
                        )}
                    </p>

                    <p>
                        📱 Instagram:
                        ${escapeHTML(
                            specialist.instagram ||
                            "Нест"
                        )}
                    </p>

                </div>


                <button
                    class="btn btn-primary"
                    style="
                        width:100%;
                        margin-top:15px;
                    "
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
            .querySelector("[data-close]")
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
            .querySelector("[data-contact]")
            .addEventListener(
                "click",
                () => {

                    alert(
                        "📩 Барои тамос Instagram ё рақами мутахассисро истифода баред."
                    );

                }
            );

    }


    /* =================================================
       FIND BUTTON
    ================================================= */

    if (findBtn) {

        findBtn.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "specialists"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    /* =================================================
       AI
    ================================================= */

    function openAI() {

        openModal(aiModal);

    }


    if (aiBtn) {

        aiBtn.addEventListener(
            "click",
            openAI
        );

    }


    if (startAiBtn) {

        startAiBtn.addEventListener(
            "click",
            openAI
        );

    }


    document
        .querySelectorAll(
            ".ai-categories button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        button.dataset.ai;

                    showAIResult(
                        category
                    );

                }
            );

        });


    function showAIResult(category) {

        const result =
            document.getElementById(
                "aiResult"
            );

        if (!result) return;


        const matches =
            specialists.filter(
                specialist =>
                    specialist.category
                    === category
            );


        if (matches.length === 0) {

            result.innerHTML = `

                <div
                    class="empty-state"
                    style="
                        margin-top:15px;
                    "
                >

                    <div>🤖</div>

                    <h3>
                        Мутахассис ёфт нашуд
                    </h3>

                    <p>
                        Барои «${escapeHTML(
                            category
                        )}»
                        ҳоло SMM-щик нест.
                    </p>

                </div>

            `;

            return;
        }


        result.innerHTML = `

            <div
                class="ai-result"
            >

                <h3>
                    🤖 Натиҷаи AI
                </h3>

                ${matches
                    .slice(0, 3)
                    .map(
                        specialist => `

                        <div
                            class="ai-result-card"
                        >

                            <strong>
                                ${escapeHTML(
                                    specialist.name
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    specialist.price
                                )}
                            </span>

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

            </div>

        `;


        result
            .querySelectorAll(
                "[data-ai-profile]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const specialist =
                            specialists.find(
                                item =>
                                    item.id ===
                                    Number(
                                        button.dataset
                                            .aiProfile
                                    )
                            );

                        if (specialist) {

                            closeModal(aiModal);

                            showProfile(
                                specialist
                            );

                        }

                    }
                );

            });

    }


    /* =================================================
       REVIEWS
    ================================================= */

    if (reviewBtn) {

        reviewBtn.addEventListener(
            "click",
            () => {

                openModal(
                    reviewModal
                );

            }
        );

    }


    if (reviewForm) {

        reviewForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                const review = {

                    id: Date.now(),

                    name:
                        document.getElementById(
                            "reviewName"
                        ).value.trim(),

                    rating:
                        Number(
                            document.getElementById(
                                "reviewRating"
                            ).value
                        ),

                    text:
                        document.getElementById(
                            "reviewText"
                        ).value.trim()

                };


                reviews.push(review);


                localStorage.setItem(
                    "smm_reviews",
                    JSON.stringify(
                        reviews
                    )
                );


                reviewForm.reset();

                closeModal(
                    reviewModal
                );

                renderReviews();

                alert(
                    "⭐ Отзыв илова шуд!"
                );

            }
        );

    }


    /* =================================================
       RENDER REVIEWS
    ================================================= */

    function renderReviews() {

        const list =
            document.getElementById(
                "reviewsList"
            );

        if (!list) return;


        if (reviews.length === 0) {

            list.innerHTML = `

                <div
                    class="empty-state"
                >

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
                                    class="stars"
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


    /* =================================================
       ADMIN
    ================================================= */

    const adminLogin =
        document.getElementById(
            "adminLogin"
        );

    const adminDashboard =
        document.getElementById(
            "adminDashboard"
        );

    const adminLoginBtn =
        document.getElementById(
            "adminLoginBtn"
        );

    if (adminBtn) {

        adminBtn.addEventListener(
            "click",
            () => {

                openModal(
                    adminModal
                );

                adminLogin.style.display =
                    "block";

                adminDashboard.style.display =
                    "none";

            }
        );

    }


    if (adminLoginBtn) {

        adminLoginBtn.addEventListener(
            "click",
            () => {

                const password =
                    document.getElementById(
                        "adminPassword"
                    ).value;


                if (
                    password !== "1234"
                ) {

                    alert(
                        "❌ Парол нодуруст аст."
                    );

                    return;
                }


                adminLogin.style.display =
                    "none";

                adminDashboard.style.display =
                    "block";

                renderAdmin();

            }
        );

    }


    /* =================================================
       ADMIN DASHBOARD
    ================================================= */

    function renderAdmin() {

        const smmCount =
            document.getElementById(
                "smmCount"
            );

        const clientCount =
            document.getElementById(
                "clientCount"
            );

        const requestCount =
            document.getElementById(
                "requestCount"
            );

        const reviewCount =
            document.getElementById(
                "reviewCount"
            );


        if (smmCount) {
            smmCount.textContent =
                specialists.length;
        }

        if (clientCount) {
            clientCount.textContent =
                clients.length;
        }

        if (requestCount) {
            requestCount.textContent =
                clients.length;
        }

        if (reviewCount) {
            reviewCount.textContent =
                reviews.length;
        }


        renderAdminSMM();

        renderAdminClients();

    }


    function renderAdminSMM() {

        const list =
            document.getElementById(
                "adminSmmList"
            );

        if (!list) return;


        if (specialists.length === 0) {

            list.innerHTML =
                "<p>Ҳоло маълумот нест.</p>";

            return;
        }


        list.innerHTML =
            specialists.map(
                specialist => `

                <div
                    class="admin-item"
                >

                    <div>

                        <strong>
                            ${escapeHTML(
                                specialist.name
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                specialist.category
                            )}
                        </p>

                    </div>


                    <div
                        class="admin-actions"
                    >

                        <button
                            class="btn btn-danger"
                            data-delete-smm="${specialist.id}"
                        >
                            Нест кардан
                        </button>

                    </div>

                </div>

            `
            ).join("");


        list
            .querySelectorAll(
                "[data-delete-smm]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset
                                    .deleteSmm
                            );


                        specialists =
                            specialists.filter(
                                item =>
                                    item.id !== id
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
            document.getElementById(
                "adminClientList"
            );

        if (!list) return;


        if (clients.length === 0) {

            list.innerHTML =
                "<p>Ҳоло маълумот нест.</p>";

            return;
        }


        list.innerHTML =
            clients.map(
                client => `

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
                            ${escapeHTML(
                                client.business
                            )}
                        </p>

                    </div>

                    <small>
                        ${escapeHTML(
                            client.category
                        )}
                    </small>

                </div>

            `
            ).join("");

    }


    /* =================================================
       HELPERS
    ================================================= */

    function getInitials(name) {

        if (!name) return "?";


        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map(
                word =>
                    word[0]
                        .toUpperCase()
            )
            .join("");

    }


    function escapeHTML(value) {

        return String(value ?? "")
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


    /* =================================================
       START
    ================================================= */

    renderSpecialists();

    renderReviews();


    console.log(
        "🚀 SMM.TJ — script loaded successfully"
    );

});
