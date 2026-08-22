"use strict";

/* =====================================================
   SMM.TJ — LIVE PLATFORM
   Business → Request → SMM → Accept → Business sees SMM
===================================================== */

const DB_KEY = "smm_tj_live_v1";

const defaultDB = {
    businesses: [],
    smm: [],
    requests: [],
    reviews: []
};

let db = loadDB();

function loadDB() {
    try {
        const saved = localStorage.getItem(DB_KEY);
        return saved ? JSON.parse(saved) : structuredClone(defaultDB);
    } catch {
        return structuredClone(defaultDB);
    }
}

function saveDB() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return [...document.querySelectorAll(selector)];
}

function id() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function categoryName(category) {
    const names = {
        restaurant: "Тарабхона",
        beauty: "Beauty",
        shop: "Дӯкон",
        education: "Маориф",
        fashion: "Fashion",
        service: "Хизматрасонӣ"
    };

    return names[category] || category;
}

function toast(message) {

    const container = $("#toastContainer");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";

        setTimeout(() => toast.remove(), 250);

    }, 2800);
}


/* =====================================================
   MODALS
===================================================== */

function openModal(idName) {

    const modal = $(idName);

    if (!modal) return;

    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}

function closeModal(idName) {

    const modal = $(idName);

    if (!modal) return;

    modal.classList.remove("active");

    if (!$(".modal-overlay.active")) {
        document.body.style.overflow = "";
    }
}

function closeAllModals() {

    $$(".modal-overlay").forEach(modal => {
        modal.classList.remove("active");
    });

    document.body.style.overflow = "";
}


/* =====================================================
   MOBILE MENU
===================================================== */

$("#mobileMenuBtn")?.addEventListener("click", () => {

    $("#mainNav")?.classList.toggle("mobile");

});

$$(".nav a").forEach(link => {

    link.addEventListener("click", () => {
        $("#mainNav")?.classList.remove("mobile");
    });

});


/* =====================================================
   AUTH
===================================================== */

function openAuth() {

    openModal("#authModal");

    $("#roleSelection").style.display = "block";

    $("#businessForm").classList.remove("active");

    $("#requestForm").classList.remove("active");

    $("#smmForm").classList.remove("active");
}

$("#loginBtn")?.addEventListener("click", openAuth);

$("#registerBtn")?.addEventListener("click", openAuth);

$("#authClose")?.addEventListener("click", () => {
    closeModal("#authModal");
});


/* =====================================================
   BUSINESS FLOW
===================================================== */

function openBusinessForm() {

    openModal("#authModal");

    $("#roleSelection").style.display = "none";

    $("#smmForm").classList.remove("active");

    $("#requestForm").classList.remove("active");

    $("#businessForm").classList.add("active");
}

$("#businessStartBtn")?.addEventListener(
    "click",
    openBusinessForm
);

$("#heroBusinessBtn")?.addEventListener(
    "click",
    openBusinessForm
);

$("#businessRoleBtn")?.addEventListener(
    "click",
    openBusinessForm
);

$("#createRequestBtn")?.addEventListener(
    "click",
    openBusinessForm
);


/* =====================================================
   BUSINESS STEP 1
===================================================== */

let currentBusiness = null;

$("#businessNextBtn")?.addEventListener(
    "click",
    () => {

        const name =
            $("#businessName").value.trim();

        const phone =
            $("#businessPhone").value.trim();

        const title =
            $("#businessTitle").value.trim();

        const category =
            $("#businessCategory").value;

        if (!name || !phone || !title || !category) {

            toast(
                "⚠️ Ҳамаи маълумотро пур кунед."
            );

            return;
        }

        currentBusiness = {

            id: id(),

            name,

            phone,

            title,

            category

        };

        $("#businessForm")
            .classList.remove("active");

        $("#requestForm")
            .classList.add("active");

    }
);


/* =====================================================
   BUSINESS REQUEST
===================================================== */

$("#requestBackBtn")?.addEventListener(
    "click",
    () => {

        $("#requestForm")
            .classList.remove("active");

        $("#businessForm")
            .classList.add("active");

    }
);


$("#requestForm")?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        if (!currentBusiness) {

            toast(
                "❌ Аввал маълумоти бизнесро пур кунед."
            );

            return;
        }

        const service =
            $("#requestService")
            .value.trim();

        const budget =
            $("#requestBudget")
            .value.trim();

        const description =
            $("#requestDescription")
            .value.trim();

        if (!service || !budget || !description) {

            toast(
                "⚠️ Ҳамаи маълумоти дархостро пур кунед."
            );

            return;
        }

        const business = {

            ...currentBusiness,

            createdAt:
                new Date().toISOString()

        };

        db.businesses.push(business);


        const request = {

            id: id(),

            businessId:
                business.id,

            businessName:
                business.title,

            businessOwner:
                business.name,

            phone:
                business.phone,

            category:
                business.category,

            service,

            budget,

            description,

            status: "open",

            acceptedBy: null,

            acceptedAt: null,

            createdAt:
                new Date().toISOString()

        };


        db.requests.push(request);

        saveDB();

        event.target.reset();

        currentBusiness = null;

        closeModal("#authModal");

        toast(
            "✅ Дархост фиристода шуд!"
        );

        renderAll();

        document
            .querySelector("#liveRequests")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


/* =====================================================
   SMM REGISTRATION
===================================================== */

function openSmmForm() {

    openModal("#authModal");

    $("#roleSelection").style.display = "none";

    $("#businessForm").classList.remove("active");

    $("#requestForm").classList.remove("active");

    $("#smmForm").classList.add("active");
}

$("#smmStartBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("#heroSmmBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("#smmRoleBtn")?.addEventListener(
    "click",
    openSmmForm
);

$("#emptySmmBtn")?.addEventListener(
    "click",
    openSmmForm
);


$("#smmForm")?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const profile = {

            id: id(),

            name:
                $("#smmName")
                .value.trim(),

            phone:
                $("#smmPhone")
                .value.trim(),

            instagram:
                $("#smmInstagram")
                .value.trim(),

            experience:
                $("#smmExperience")
                .value.trim(),

            category:
                $("#smmCategory")
                .value,

            service:
                $("#smmService")
                .value.trim(),

            price:
                $("#smmPrice")
                .value.trim(),

            status: "pending",

            createdAt:
                new Date().toISOString()

        };


        if (
            !profile.name ||
            !profile.phone ||
            !profile.experience ||
            !profile.category ||
            !profile.service ||
            !profile.price
        ) {

            toast(
                "⚠️ Ҳамаи маълумотро пур кунед."
            );

            return;
        }


        db.smm.push(profile);

        saveDB();

        event.target.reset();

        closeModal("#authModal");

        toast(
            "✅ Профил фиристода шуд. Админ бояд тасдиқ кунад."
        );

        renderAll();

    }
);


/* =====================================================
   LIVE REQUESTS
===================================================== */

function renderRequests() {

    const container =
        $("#publicRequests");

    if (!container) return;


    const requests =
        db.requests.filter(
            request =>
                request.status === "open"
        );


    if (!requests.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    📩
                </div>

                <h3>
                    Ҳоло дархост нест
                </h3>

                <p>
                    Вақте бизнесмен дархост гузорад,
                    он дар ин ҷо пайдо мешавад.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        requests.map(request => `

            <article class="request-card">

                <div class="request-card__top">

                    <div>

                        <h3>
                            ${escapeHTML(
                                request.businessName
                            )}
                        </h3>

                        <div class="request-category">

                            ${escapeHTML(
                                categoryName(
                                    request.category
                                )
                            )}

                        </div>

                    </div>

                    <span>
                        🔴 LIVE
                    </span>

                </div>


                <p>

                    <strong>
                        Хизмат:
                    </strong>

                    ${escapeHTML(
                        request.service
                    )}

                </p>


                <p>

                    ${escapeHTML(
                        request.description
                    )}

                </p>


                <strong class="request-price">

                    💰 ${escapeHTML(
                        request.budget
                    )}

                </strong>


                <div class="request-actions">

                    <button
                        class="btn btn--primary btn--full"
                        data-accept-request="${request.id}"
                    >
                        🤝 Қабул кардани дархост
                    </button>

                </div>

            </article>

        `).join("");


    $$("[data-accept-request]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const request =
                    db.requests.find(
                        item =>
                            item.id ===
                            button.dataset.acceptRequest
                    );

                if (!request) return;

                openSmmAcceptModal(request);

            }
        );

    });

}


/* =====================================================
   SMM ACCEPT
===================================================== */

function openSmmAcceptModal(request) {

    const approved =
        db.smm.filter(
            profile =>
                profile.status === "approved"
        );


    if (!approved.length) {

        toast(
            "⚠️ Аввал SMM-щик бояд аз Admin тасдиқ шавад."
        );

        return;
    }


    const modal =
        document.createElement("div");

    modal.className =
        "modal-overlay active";

    modal.id =
        "temporarySmmModal";


    modal.innerHTML = `

        <div class="modal">

            <button
                class="modal__close"
                id="tempClose"
            >
                ×
            </button>

            <div class="modal__heading">

                <span>
                    🤝 ДАРХОСТ
                </span>

                <h2>
                    Кадом SMM-щик қабул мекунад?
                </h2>

                <p>
                    Профили худро интихоб кунед.
                </p>

            </div>

            <div class="role-options">

                ${approved.map(profile => `

                    <button
                        class="role-option"
                        data-accept-profile="${profile.id}"
                    >

                        <div class="role-option__icon">
                            👨‍💻
                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    profile.name
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    profile.service
                                )}
                            </p>

                        </div>

                        <span>
                            →
                        </span>

                    </button>

                `).join("")}

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    $("#tempClose")
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


    $$("[data-accept-profile]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                acceptRequest(
                    request.id,
                    button.dataset.acceptProfile
                );

                modal.remove();

            }
        );

    });

}


/* =====================================================
   ACCEPT REQUEST
===================================================== */

function acceptRequest(
    requestId,
    profileId
) {

    const request =
        db.requests.find(
            item =>
                item.id === requestId
        );

    const profile =
        db.smm.find(
            item =>
                item.id === profileId
        );


    if (!request || !profile) {

        toast(
            "❌ Хатогӣ шуд."
        );

        return;
    }


    if (
        request.status !== "open"
    ) {

        toast(
            "⚠️ Ин дархост аллакай қабул шудааст."
        );

        return;
    }


    request.status =
        "accepted";

    request.acceptedBy =
        profileId;

    request.acceptedAt =
        new Date().toISOString();


    saveDB();

    renderAll();

    toast(
        `🎉 ${profile.name} дархостро қабул кард!`
    );


    openAcceptedResult(request, profile);

}


/* =====================================================
   ACCEPTED RESULT
===================================================== */

function openAcceptedResult(
    request,
    profile
) {

    const modal =
        document.createElement("div");

    modal.className =
        "modal-overlay active";

    modal.innerHTML = `

        <div class="modal">

            <button
                class="modal__close"
                id="acceptedClose"
            >
                ×
            </button>

            <div class="profile">

                <div class="profile__avatar">
                    🎉
                </div>

                <h2>
                    Дархост қабул шуд!
                </h2>

                <div
                    class="verified"
                    style="margin-top:10px"
                >
                    ✓ SMM-щик пайдо шуд
                </div>


                <div class="admin-item"
                     style="margin-top:22px;text-align:left">

                    <strong>
                        ${escapeHTML(
                            profile.name
                        )}
                    </strong>

                    <p>
                        🛠
                        ${escapeHTML(
                            profile.service
                        )}
                    </p>

                    <p>
                        📞
                        ${escapeHTML(
                            profile.phone
                        )}
                    </p>

                    <p>
                        📸
                        ${escapeHTML(
                            profile.instagram || "—"
                        )}
                    </p>

                </div>


                <button
                    class="btn btn--primary btn--full"
                    id="acceptedDone"
                    style="margin-top:18px"
                >
                    Хуб, фаҳмидам
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    function close() {
        modal.remove();
    }


    $("#acceptedClose")
        .addEventListener(
            "click",
            close
        );

    $("#acceptedDone")
        .addEventListener(
            "click",
            close
        );

}


/* =====================================================
   SPECIALISTS
===================================================== */

function renderSpecialists() {

    const container =
        $("#specialistsList");

    if (!container) return;


    const specialists =
        db.smm.filter(
            profile =>
                profile.status === "approved"
        );


    if (!specialists.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    👨‍💻
                </div>

                <h3>
                    Ҳоло мутахассис нест
                </h3>

                <p>
                    Аввалин SMM-щик шуда
                    профили худро соз.
                </p>

                <button
                    class="btn btn--primary"
                    id="emptySmmBtn2"
                >
                    SMM-щик шудан
                </button>

            </div>

        `;


        $("#emptySmmBtn2")
            ?.addEventListener(
                "click",
                openSmmForm
            );

        return;
    }


    container.innerHTML =
        specialists.map(profile => `

            <article class="specialist-card">

                <div class="specialist-top">

                    <div class="specialist-avatar">
                        👨‍💻
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                profile.name
                            )}
                        </h3>

                        <span class="verified">
                            ✓ Тасдиқшуда
                        </span>

                    </div>

                </div>


                <div class="specialist-info">

                    <div>
                        📂
                        ${escapeHTML(
                            categoryName(
                                profile.category
                            )
                        )}
                    </div>

                    <div>
                        🛠
                        ${escapeHTML(
                            profile.service
                        )}
                    </div>

                    <div>
                        🎯
                        ${escapeHTML(
                            profile.experience
                        )}
                    </div>

                    <div>
                        💰
                        ${escapeHTML(
                            profile.price
                        )}
                    </div>

                </div>


                <div class="specialist-bottom">

                    <button
                        class="btn btn--primary"
                        data-profile="${profile.id}"
                    >
                        Профил →
                    </button>

                </div>

            </article>

        `).join("");


    $$("[data-profile]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                openProfile(
                    button.dataset.profile
                );

            }
        );

    });

}


/* =====================================================
   PROFILE
===================================================== */

function openProfile(profileId) {

    const profile =
        db.smm.find(
            item =>
                item.id === profileId
        );

    if (!profile) return;


    $("#profileContent").innerHTML = `

        <div class="profile">

            <div class="profile__avatar">
                👨‍💻
            </div>

            <h2>
                ${escapeHTML(
                    profile.name
                )}
            </h2>

            <div class="verified">
                ✓ SMM-щик тасдиқшуда
            </div>


            <div class="admin-item"
                 style="margin-top:20px;text-align:left">

                <p>
                    📂
                    ${escapeHTML(
                        categoryName(
                            profile.category
                        )
                    )}
                </p>

                <p>
                    🛠
                    ${escapeHTML(
                        profile.service
                    )}
                </p>

                <p>
                    🎯
                    Таҷриба:
                    ${escapeHTML(
                        profile.experience
                    )}
                </p>

                <p>
                    💰
                    ${escapeHTML(
                        profile.price
                    )}
                </p>

                <p>
                    📞
                    ${escapeHTML(
                        profile.phone
                    )}
                </p>

                <p>
                    📸
                    ${escapeHTML(
                        profile.instagram || "—"
                    )}
                </p>

            </div>

        </div>

    `;


    openModal("#profileModal");

}


$("#profileClose")?.addEventListener(
    "click",
    () => closeModal("#profileModal")
);


/* =====================================================
   REVIEWS
===================================================== */

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
                    Аввалин шуда фикри худро гузоред.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        db.reviews.map(review => `

            <article class="review-card">

                <div class="review-stars">
                    ${"⭐".repeat(
                        Number(review.rating)
                    )}
                </div>

                <p>
                    «${escapeHTML(
                        review.text
                    )}»
                </p>

                <strong>
                    ${escapeHTML(
                        review.name
                    )}
                </strong>

                <small>
                    Клиент
                </small>

            </article>

        `).join("");

}


$("#addReviewBtn")?.addEventListener(
    "click",
    () => openModal("#reviewModal")
);

$("#reviewClose")?.addEventListener(
    "click",
    () => closeModal("#reviewModal")
);


$("#reviewForm")?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const review = {

            id: id(),

            name:
                $("#reviewName")
                .value.trim(),

            rating:
                Number(
                    $("#reviewRating")
                    .value
                ),

            text:
                $("#reviewText")
                .value.trim(),

            createdAt:
                new Date().toISOString()

        };


        if (
            !review.name ||
            !review.text
        ) {

            toast(
                "⚠️ Маълумотро пур кунед."
            );

            return;
        }


        db.reviews.push(review);

        saveDB();

        event.target.reset();

        closeModal("#reviewModal");

        renderReviews();

        renderAdmin();

        toast(
            "⭐ Отзыв сабт шуд."
        );

    }
);


/* =====================================================
   ADMIN
===================================================== */

const ADMIN_PASSWORD = "admin123";


$("#adminBtn")?.addEventListener(
    "click",
    () => {

        $("#adminLogin").style.display =
            "block";

        $("#adminDashboard")
            .classList.remove("active");

        openModal("#adminModal");

    }
);


$("#adminClose")?.addEventListener(
    "click",
    () => closeModal("#adminModal")
);


$("#adminLoginForm")?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const password =
            $("#adminPassword").value;


        if (
            password !==
            ADMIN_PASSWORD
        ) {

            toast(
                "❌ Парол нодуруст."
            );

            return;
        }


        $("#adminLogin").style.display =
            "none";

        $("#adminDashboard")
            .classList.add("active");

        renderAdmin();

    }
);


$("#adminLogout")?.addEventListener(
    "click",
    () => {

        $("#adminDashboard")
            .classList.remove("active");

        $("#adminLogin").style.display =
            "block";

        closeModal("#adminModal");

    }
);


/* =====================================================
   ADMIN RENDER
===================================================== */

function renderAdmin() {

    if (!$("#adminDashboard"))
        return;


    $("#adminSmmCount")
        .textContent =
        db.smm.length;


    $("#adminBusinessCount")
        .textContent =
        db.businesses.length;


    $("#adminRequestCount")
        .textContent =
        db.requests.length;


    $("#adminReviewCount")
        .textContent =
        db.reviews.length;


    renderAdminSmm();

    renderAdminBusinesses();

    renderAdminRequests();

    renderAdminReviews();

}


/* =====================================================
   ADMIN SMM
===================================================== */

function renderAdminSmm() {

    const container =
        $("#adminSmmList");

    if (!container) return;


    if (!db.smm.length) {

        container.innerHTML =
            `<div class="empty-state">
                <p>
                    Ҳоло SMM-щик нест.
                </p>
            </div>`;

        return;
    }


    container.innerHTML =
        db.smm.map(profile => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(
                        profile.name
                    )}
                </strong>

                <p>
                    📞
                    ${escapeHTML(
                        profile.phone
                    )}
                </p>

                <p>
                    🛠
                    ${escapeHTML(
                        profile.service
                    )}
                </p>

                <p>
                    📂
                    ${escapeHTML(
                        categoryName(
                            profile.category
                        )
                    )}
                </p>


                <p>

                    ${
                        profile.status === "approved"
                        ?
                        "🟢 Тасдиқшуда"
                        :
                        profile.status === "rejected"
                        ?
                        "🔴 Радшуда"
                        :
                        "🟡 Интизор"

                    }

                </p>


                <div class="admin-item__actions">

                    ${
                        profile.status !== "approved"
                        ?
                        `
                        <button
                            class="btn btn--primary"
                            data-approve="${profile.id}"
                        >
                            ✓ Тасдиқ
                        </button>
                        `
                        :
                        ""
                    }


                    ${
                        profile.status !== "rejected"
                        ?
                        `
                        <button
                            class="btn btn--dark"
                            data-reject="${profile.id}"
                        >
                            ✕ Рад
                        </button>
                        `
                        :
                        ""
                    }


                    <button
                        class="btn btn--dark"
                        data-delete-smm="${profile.id}"
                    >
                        🗑 Нест
                    </button>

                </div>

            </div>

        `).join("");


    $$("[data-approve]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const profile =
                    db.smm.find(
                        x =>
                            x.id ===
                            button.dataset.approve
                    );

                if (!profile) return;

                profile.status =
                    "approved";

                saveDB();

                renderAll();

                toast(
                    "✅ SMM-щик тасдиқ шуд."
                );

            }
        );

    });


    $$("[data-reject]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const profile =
                    db.smm.find(
                        x =>
                            x.id ===
                            button.dataset.reject
                    );

                if (!profile) return;

                profile.status =
                    "rejected";

                saveDB();

                renderAll();

                toast(
                    "❌ SMM-щик рад шуд."
                );

            }
        );

    });


    $$("[data-delete-smm]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                db.smm =
                    db.smm.filter(
                        x =>
                            x.id !==
                            button.dataset.deleteSmm
                    );

                saveDB();

                renderAll();

                toast(
                    "🗑 SMM-щик нест шуд."
                );

            }
        );

    });

}


/* =====================================================
   ADMIN BUSINESSES
===================================================== */

function renderAdminBusinesses() {

    const container =
        $("#adminBusinessList");

    if (!container) return;


    if (!db.businesses.length) {

        container.innerHTML =
            `<div class="empty-state">
                <p>
                    Ҳоло бизнес нест.
                </p>
            </div>`;

        return;
    }


    container.innerHTML =
        db.businesses.map(business => `

            <div class="admin-item">

                <strong>
                    ${escapeHTML(
                        business.title
                    )}
                </strong>

                <p>
                    👤
                    ${escapeHTML(
                        business.name
                    )}
                </p>

                <p>
                    📞
                    ${escapeHTML(
                        business.phone
                    )}
                </p>

                <p>
                    📂
                    ${escapeHTML(
                        categoryName(
                            business.category
                        )
                    )}
                </p>

            </div>

        `).join("");

}


/* =====================================================
   ADMIN REQUESTS
===================================================== */

function renderAdminRequests() {

    const container =
        $("#adminRequestList");

    if (!container) return;


    if (!db.requests.length) {

        container.innerHTML =
            `<div class="empty-state">
                <p>
                    Ҳоло дархост нест.
                </p>
            </div>`;

        return;
    }


    container.innerHTML =
        db.requests.map(request => {

            const accepted =
                request.acceptedBy
                ?
                db.smm.find(
                    x =>
                        x.id ===
                        request.acceptedBy
                )
                :
                null;


            return `

                <div class="admin-item">

                    <strong>
                        ${escapeHTML(
                            request.businessName
                        )}
                    </strong>

                    <p>
                        🛠
                        ${escapeHTML(
                            request.service
                        )}
                    </p>

                    <p>
                        💰
                        ${escapeHTML(
                            request.budget
                        )}
                    </p>

                    <p>
                        ${escapeHTML(
                            request.description
                        )}
                    </p>


                    <p>

                        ${
                            accepted
                            ?
                            `
                            🟢 Қабул кард:
                            ${escapeHTML(
                                accepted.name
                            )}
                            `
                            :
                            request.status === "open"
                            ?
                            "🟡 Кушода"
                            :
                            "🔴 SMM нест"

                        }

                    </p>

                </div>

            `;

        }).join("");

}


/* =====================================================
   ADMIN REVIEWS
===================================================== */

function renderAdminReviews() {

    const container =
        $("#adminReviewList");

    if (!container) return;


    if (!db.reviews.length) {

        container.innerHTML =
            `<div class="empty-state">
                <p>
                    Ҳоло отзыв нест.
                </p>
            </div>`;

        return;
    }


    container.innerHTML =
        db.reviews.map(review => `

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


                <div class="admin-item__actions">

                    <button
                        class="btn btn--dark"
                        data-delete-review="${review.id}"
                    >
                        🗑 Нест
                    </button>

                </div>

            </div>

        `).join("");


    $$("[data-delete-review]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                db.reviews =
                    db.reviews.filter(
                        x =>
                            x.id !==
                            button.dataset.deleteReview
                    );

                saveDB();

                renderAll();

                toast(
                    "🗑 Отзыв нест шуд."
                );

            }
        );

    });

}


/* =====================================================
   CTA
===================================================== */

$("#ctaBtn")?.addEventListener(
    "click",
    openBusinessForm
);


/* =====================================================
   CLOSE MODALS
===================================================== */

$$(".modal-overlay")
.forEach(modal => {

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal(
                    "#" + modal.id
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

            closeAllModals();

        }

    }
);


/* =====================================================
   RENDER
===================================================== */

function renderAll() {

    renderRequests();

    renderSpecialists();

    renderReviews();

    renderAdmin();

}


/* =====================================================
   START
===================================================== */

renderAll();

console.log(
    "🚀 SMM.TJ platform started successfully"
);
