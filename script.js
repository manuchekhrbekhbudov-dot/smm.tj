/* =========================================================
   SMM.TJ — SCRIPT.JS
   Registration + Reviews + Profiles + Requests
   AI + Admin Panel + Mobile Menu
========================================================= */

"use strict";


/* =========================================================
   DATABASE
========================================================= */

const DB_KEY = "SMM_TJ_DATABASE_V1";

const defaultDB = {
    smm: [],
    clients: [],
    reviews: [],
    requests: []
};

let db;

try {
    db = JSON.parse(
        localStorage.getItem(DB_KEY)
    ) || structuredClone(defaultDB);
} catch {
    db = structuredClone(defaultDB);
}

function saveDB(){

    localStorage.setItem(
        DB_KEY,
        JSON.stringify(db)
    );

}


/* =========================================================
   HELPERS
========================================================= */

function $(selector){

    return document.querySelector(selector);

}


function $all(selector){

    return [
        ...document.querySelectorAll(selector)
    ];

}


function createID(){

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2,9)
    );

}


function escapeHTML(value){

    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}


function openModal(id){

    const modal = $(id);

    if(modal){
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

}


function closeModal(id){

    const modal = $(id);

    if(modal){
        modal.classList.remove("active");
    }

    if(
        !document.querySelector(
            ".modal-overlay.active"
        )
    ){
        document.body.style.overflow = "";
    }

}


function closeAllModals(){

    $all(".modal-overlay.active")
        .forEach(modal=>{
            modal.classList.remove("active");
        });

    document.body.style.overflow = "";

}


function toast(message){

    const container =
        $("#toastContainer");

    if(!container) return;

    const item =
        document.createElement("div");

    item.className = "toast";

    item.textContent = message;

    container.appendChild(item);

    setTimeout(()=>{

        item.style.opacity = "0";
        item.style.transform = "translateY(8px)";

        setTimeout(()=>{
            item.remove();
        },250);

    },2800);

}


function categoryName(category){

    const names = {

        restaurant:"Тарабхона",
        fashion:"Либос",
        beauty:"Зебоӣ",
        shop:"Дӯкон",
        education:"Маориф",
        service:"Хизматрасонӣ"

    };

    return names[category] || category;

}


function formatDate(date){

    if(!date) return "";

    return new Date(date)
        .toLocaleDateString(
            "tg-TJ",
            {
                year:"numeric",
                month:"long",
                day:"numeric"
            }
        );

}


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenuBtn =
    $("#mobileMenuBtn");

const mainNav =
    $("#mainNav");

if(mobileMenuBtn){

    mobileMenuBtn.addEventListener(
        "click",
        ()=>{

            mainNav.classList.toggle(
                "mobile"
            );

        }
    );

}


$all("#mainNav a")
.forEach(link=>{

    link.addEventListener(
        "click",
        ()=>{

            mainNav.classList.remove(
                "mobile"
            );

        }
    );

});


/* =========================================================
   AUTH MODAL
========================================================= */

function openAuth(){

    openModal("#authModal");

    $("#authRoleSelection")
        .style.display = "block";

    $("#smmForm")
        .classList.remove("active");

    $("#clientForm")
        .classList.remove("active");

}


$("#loginBtn")?.addEventListener(
    "click",
    openAuth
);


$("#registerBtn")?.addEventListener(
    "click",
    openAuth
);


$("#authClose")?.addEventListener(
    "click",
    ()=>{
        closeModal("#authModal");
    }
);


/* =========================================================
   ROLE SELECTION
========================================================= */

function openSmmForm(){

    $("#authRoleSelection")
        .style.display = "none";

    $("#clientForm")
        .classList.remove("active");

    $("#smmForm")
        .classList.add("active");

}


function openClientForm(){

    $("#authRoleSelection")
        .style.display = "none";

    $("#smmForm")
        .classList.remove("active");

    $("#clientForm")
        .classList.add("active");

}


$("#smmRoleBtn")?.addEventListener(
    "click",
    openSmmForm
);


$("#clientRoleBtn")?.addEventListener(
    "click",
    openClientForm
);


$("#heroSmmBtn")?.addEventListener(
    "click",
    ()=>{
        openAuth();
        openSmmForm();
    }
);


$("#heroClientBtn")?.addEventListener(
    "click",
    ()=>{
        openAuth();
        openClientForm();
    }
);


$("#registerSmmFromEmpty")
?.addEventListener(
    "click",
    ()=>{
        openAuth();
        openSmmForm();
    }
);


$("#backToRolesFromSmm")
?.addEventListener(
    "click",
    ()=>{
        $("#smmForm")
            .classList.remove("active");

        $("#authRoleSelection")
            .style.display = "block";
    }
);


$("#backToRolesFromClient")
?.addEventListener(
    "click",
    ()=>{
        $("#clientForm")
            .classList.remove("active");

        $("#authRoleSelection")
            .style.display = "block";
    }
);


/* =========================================================
   SMM REGISTRATION
========================================================= */

$("#smmForm")
?.addEventListener(
    "submit",
    event=>{

        event.preventDefault();

        const profile = {

            id:createID(),

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

            status:"pending",

            createdAt:
                new Date().toISOString()

        };


        db.smm.push(profile);

        saveDB();

        event.target.reset();

        closeModal("#authModal");

        toast(
            "✅ Маълумот қабул шуд. Админ профилро месанҷад."
        );

        renderAll();

    }
);


/* =========================================================
   CLIENT REGISTRATION
========================================================= */

$("#clientForm")
?.addEventListener(
    "submit",
    event=>{

        event.preventDefault();

        const client = {

            id:createID(),

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

        closeModal("#authModal");

        toast(
            "✅ Бизнес сабт шуд. Админ маълумотро мебинад."
        );

        renderAll();

    }
);


/* =========================================================
   FIND SPECIALIST
========================================================= */

$("#findSpecialistBtn")
?.addEventListener(
    "click",
    ()=>{

        document
            .querySelector("#specialists")
            ?.scrollIntoView({
                behavior:"smooth"
            });

    }
);


/* =========================================================
   CATEGORY FILTER
========================================================= */

$all(".category-card")
.forEach(card=>{

    card.addEventListener(
        "click",
        ()=>{

            const category =
                card.dataset.category;

            showCategory(category);

        }
    );

});


function showCategory(category){

    const approved =
        db.smm.filter(
            profile =>
                profile.status === "approved" &&
                profile.category === category
        );

    renderSpecialists(
        approved,
        category
    );

    document
        .querySelector("#specialists")
        ?.scrollIntoView({
            behavior:"smooth"
        });

}


function renderSpecialists(
    profiles = null,
    category = null
){

    const container =
        $("#specialistsList");

    if(!container) return;


    let specialists =
        profiles ||
        db.smm.filter(
            profile =>
                profile.status === "approved"
        );


    if(!specialists.length){

        const text = category
            ? `
                Барои категорияи
                <strong>
                    ${escapeHTML(
                        categoryName(category)
                    )}
                </strong>
                ҳоло SMM-щик тасдиқшуда нест.
              `
            : `
                Ҳоло ягон SMM-щик
                тасдиқшуда нест.
              `;


        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    👨‍💻
                </div>

                <h3>
                    Ҳоло мутахассис нест
                </h3>

                <p>
                    ${text}
                </p>

                <button
                    class="btn btn--primary"
                    id="emptyRegisterBtn"
                >
                    Ман SMM-щик ҳастам
                </button>

            </div>

        `;


        $("#emptyRegisterBtn")
        ?.addEventListener(
            "click",
            ()=>{
                openAuth();
                openSmmForm();
            }
        );

        return;

    }


    container.innerHTML =
        specialists
        .map(profile => `

            <article class="specialist-card">

                <div class="specialist-card__top">

                    <div class="specialist-avatar">
                        👨‍💻
                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(
                                profile.name
                            )}
                        </h3>

                        <div class="verified">
                            ✓ Тасдиқшуда
                        </div>

                    </div>

                </div>


                <div class="specialist-card__info">

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
                        Таҷриба:
                        ${escapeHTML(
                            profile.experience
                        )}
                    </div>

                </div>


                <div class="specialist-card__bottom">

                    <strong>
                        ${escapeHTML(
                            profile.price
                        )}
                    </strong>

                    <button
                        class="btn btn--primary"
                        data-profile-id="${profile.id}"
                    >
                        Профил →
                    </button>

                </div>

            </article>

        `)
        .join("");


    $all(
        "[data-profile-id]"
    ).forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                openProfile(
                    button.dataset.profileId
                );

            }
        );

    });

}


/* =========================================================
   PROFILE
========================================================= */

function openProfile(profileId){

    const profile =
        db.smm.find(
            item =>
                item.id === profileId
        );

    if(!profile){

        toast(
            "❌ Профил ёфт нашуд."
        );

        return;
    }


    const content =
        $("#profileContent");


    content.innerHTML = `

        <div class="profile">

            <div class="profile__avatar">
                👨‍💻
            </div>

            <h2>
                ${escapeHTML(
                    profile.name
                )}
            </h2>

            <div class="profile__verified">
                ✓ SMM-щик тасдиқшуда
            </div>


            <div class="profile__info">

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
                    Таҷриба:
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

                ${
                    profile.instagram
                    ?
                    `
                    <div>
                        📸
                        ${escapeHTML(
                            profile.instagram
                        )}
                    </div>
                    `
                    :
                    ""
                }

            </div>


            <button
                class="btn btn--primary profile__action"
                id="sendRequestFromProfile"
            >
                📩 Дархости ҳамкорӣ
            </button>

        </div>

    `;


    openModal("#profileModal");


    $("#sendRequestFromProfile")
    ?.addEventListener(
        "click",
        ()=>{
            closeModal("#profileModal");
            openRequest(profile);
        }
    );

}


/* =========================================================
   REQUEST
========================================================= */

function openRequest(profile){

    $("#requestProfileId")
        .value = profile.id;

    $("#requestSpecialistName")
        .textContent =
        `Дархост ба ${profile.name}`;

    openModal("#requestModal");

}


$("#requestClose")
?.addEventListener(
    "click",
    ()=>{
        closeModal("#requestModal");
    }
);


$("#requestForm")
?.addEventListener(
    "submit",
    event=>{

        event.preventDefault();

        const request = {

            id:createID(),

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

            status:"new",

            createdAt:
                new Date().toISOString()

        };


        db.requests.push(request);

        saveDB();

        event.target.reset();

        closeModal("#requestModal");

        toast(
            "✅ Дархост фиристода шуд."
        );

        renderAll();

    }
);


/* =========================================================
   REVIEWS
========================================================= */

function renderReviews(){

    const container =
        $("#reviewsList");

    if(!container) return;


    if(!db.reviews.length){

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
                    Аввалин шуда фикри худро гузоред.
                </p>

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
                    ${formatDate(
                        review.createdAt
                    )}
                </small>

            </article>

        `)
        .join("");

}


$("#addReviewBtn")
?.addEventListener(
    "click",
    ()=>{
        openModal("#reviewModal");
    }
);


$("#reviewClose")
?.addEventListener(
    "click",
    ()=>{
        closeModal("#reviewModal");
    }
);


$("#reviewForm")
?.addEventListener(
    "submit",
    event=>{

        event.preventDefault();

        const review = {

            id:createID(),

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

        closeModal("#reviewModal");

        toast(
            "⭐ Отзыв нигоҳ дошта шуд."
        );

        renderReviews();

        renderAdmin();

    }
);


/* =========================================================
   AI
========================================================= */

$("#openAiBtn")
?.addEventListener(
    "click",
    ()=>{
        openAI();
    }
);


$("#startAiBtn")
?.addEventListener(
    "click",
    ()=>{
        openAI();
    }
);


$("#aiClose")
?.addEventListener(
    "click",
    ()=>{
        closeModal("#aiModal");
    }
);


function openAI(){

    $("#aiResult")
        .innerHTML = "";

    openModal("#aiModal");

}


$all(
    "[data-ai-category]"
)
.forEach(button=>{

    button.addEventListener(
        "click",
        ()=>{

            const category =
                button.dataset.aiCategory;

            findWithAI(category);

        }
    );

});


function findWithAI(category){

    const result =
        $("#aiResult");


    const specialists =
        db.smm.filter(
            profile =>
                profile.status === "approved" &&
                profile.category === category
        );


    if(!specialists.length){

        result.innerHTML = `

            <div class="empty-state">

                <div class="empty-state__icon">
                    🤖
                </div>

                <h3>
                    Мутахассис ёфт нашуд
                </h3>

                <p>
                    Барои
                    <strong>
                        ${escapeHTML(
                            categoryName(category)
                        )}
                    </strong>
                    ҳоло SMM-щик
                    тасдиқшуда нест.
                </p>

            </div>

        `;

        return;
    }


    result.innerHTML = `

        <div class="admin-list">

            <h3>
                Мутахассисони мувофиқ:
            </h3>

            ${specialists
                .map(profile=>`

                    <div class="admin-item">

                        <div class="admin-item__top">

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

                                <p>
                                    💰
                                    ${escapeHTML(
                                        profile.price
                                    )}
                                </p>

                            </div>

                            <span class="status status--approved">
                                ✓
                            </span>

                        </div>

                        <button
                            class="btn btn--primary"
                            data-ai-profile="${profile.id}"
                            style="margin-top:12px"
                        >
                            Профил →
                        </button>

                    </div>

                `)
                .join("")}

        </div>

    `;


    $all(
        "[data-ai-profile]"
    ).forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                closeModal("#aiModal");

                openProfile(
                    button.dataset.aiProfile
                );

            }
        );

    });

}


/* =========================================================
   CTA
========================================================= */

$("#ctaRegisterBtn")
?.addEventListener(
    "click",
    openAuth
);


/* =========================================================
   ADMIN
========================================================= */

const ADMIN_PASSWORD =
    "admin123";


$("#adminBtn")
?.addEventListener(
    "click",
    openAdmin
);


$("#adminClose")
?.addEventListener(
    "click",
    ()=>{
        closeModal("#adminModal");
    }
);


function openAdmin(){

    $("#adminLogin")
        .style.display = "block";

    $("#adminDashboard")
        .classList.remove("active");

    $("#adminPassword")
        .value = "";

    openModal("#adminModal");

}


$("#adminLoginForm")
?.addEventListener(
    "submit",
    event=>{

        event.preventDefault();

        const password =
            $("#adminPassword")
            .value;


        if(password !== ADMIN_PASSWORD){

            toast(
                "❌ Парол нодуруст."
            );

            return;
        }


        $("#adminLogin")
            .style.display = "none";

        $("#adminDashboard")
            .classList.add("active");

        renderAdmin();

    }
);


/* =========================================================
   ADMIN LOGOUT
========================================================= */

$("#adminLogout")
?.addEventListener(
    "click",
    ()=>{

        $("#adminDashboard")
            .classList.remove("active");

        $("#adminLogin")
            .style.display = "block";

        closeModal("#adminModal");

    }
);


/* =========================================================
   ADMIN RENDER
========================================================= */

function renderAdmin(){

    if(!$("#adminDashboard")) return;


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
            x=>x.status === "pending"
        ).length;


    $("#pendingSmmCount")
        .textContent =
        pending;


    renderAdminSmm();

    renderAdminClients();

    renderAdminRequests();

    renderAdminReviews();

}


function renderAdminSmm(){

    const container =
        $("#adminSmmList");

    if(!container) return;


    if(!db.smm.length){

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    Ҳоло ягон SMM-щик
                    регистрация накардааст.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        db.smm
        .map(profile=>`

            <div class="admin-item">

                <div class="admin-item__top">

                    <div>

                        <strong>
                            ${escapeHTML(
                                profile.name
                            )}
                        </strong>

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
                            📞
                            ${escapeHTML(
                                profile.phone
                            )}
                        </p>

                    </div>


                    <span class="
                        status
                        ${
                            profile.status === "approved"
                            ?
                            "status--approved"
                            :
                            profile.status === "rejected"
                            ?
                            "status--rejected"
                            :
                            "status--pending"
                        }
                    ">

                        ${
                            profile.status === "approved"
                            ?
                            "Тасдиқшуда"
                            :
                            profile.status === "rejected"
                            ?
                            "Радшуда"
                            :
                            "Интизор"
                        }

                    </span>

                </div>


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
                        🗑 Нест кардан
                    </button>

                </div>

            </div>

        `)
        .join("");


    $all("[data-approve]")
    .forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                updateSmmStatus(
                    button.dataset.approve,
                    "approved"
                );

            }
        );

    });


    $all("[data-reject]")
    .forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                updateSmmStatus(
                    button.dataset.reject,
                    "rejected"
                );

            }
        );

    });


    $all("[data-delete-smm]")
    .forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                deleteSmm(
                    button.dataset.deleteSmm
                );

            }
        );

    });

}


function updateSmmStatus(
    id,
    status
){

    const profile =
        db.smm.find(
            x=>x.id === id
        );

    if(!profile) return;

    profile.status = status;

    saveDB();

    renderAll();

    toast(
        status === "approved"
        ?
        "✅ SMM-щик тасдиқ шуд."
        :
        "❌ SMM-щик рад шуд."
    );

}


function deleteSmm(id){

    if(
        !confirm(
            "Ин профилро нест мекунед?"
        )
    ){
        return;
    }


    db.smm =
        db.smm.filter(
            x=>x.id !== id
        );


    saveDB();

    renderAll();

    toast(
        "🗑 Профил нест шуд."
    );

}


/* =========================================================
   ADMIN CLIENTS
========================================================= */

function renderAdminClients(){

    const container =
        $("#adminClientList");

    if(!container) return;


    if(!db.clients.length){

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    Ҳоло ягон муштарӣ
                    регистрация накардааст.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        db.clients
        .map(client=>`

            <div class="admin-item">

                <div class="admin-item__top">

                    <div>

                        <strong>
                            ${escapeHTML(
                                client.business
                            )}
                        </strong>

                        <p>
                            👤
                            ${escapeHTML(
                                client.name
                            )}
                        </p>

                        <p>
                            📞
                            ${escapeHTML(
                                client.phone
                            )}
                        </p>

                        <p>
                            📂
                            ${escapeHTML(
                                categoryName(
                                    client.category
                                )
                            )}
                        </p>

                        <p>
                            💬
                            ${escapeHTML(
                                client.need
                            )}
                        </p>

                    </div>

                </div>


                <div class="admin-item__actions">

                    <button
                        class="btn btn--dark"
                        data-delete-client="${client.id}"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

            </div>

        `)
        .join("");


    $all("[data-delete-client]")
    .forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                const id =
                    button.dataset.deleteClient;


                if(
                    !confirm(
                        "Ин муштариро нест мекунед?"
                    )
                ){
                    return;
                }


                db.clients =
                    db.clients.filter(
                        x=>x.id !== id
                    );


                saveDB();

                renderAll();

                toast(
                    "🗑 Муштарӣ нест шуд."
                );

            }
        );

    });

}


/* =========================================================
   ADMIN REQUESTS
========================================================= */

function renderAdminRequests(){

    const container =
        $("#adminRequestList");

    if(!container) return;


    if(!db.requests.length){

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    Ҳоло ягон дархост нест.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        db.requests
        .map(request=>{

            const profile =
                db.smm.find(
                    x =>
                        x.id === request.profileId
                );


            return `

                <div class="admin-item">

                    <div>

                        <strong>
                            ${escapeHTML(
                                request.name
                            )}
                        </strong>

                        <p>
                            📞
                            ${escapeHTML(
                                request.phone
                            )}
                        </p>

                        <p>
                            👨‍💻 SMM:
                            ${
                                profile
                                ?
                                escapeHTML(
                                    profile.name
                                )
                                :
                                "Профил нест шудааст"
                            }
                        </p>

                        <p>
                            💬
                            ${escapeHTML(
                                request.message
                            )}
                        </p>

                        <p>
                            📅
                            ${formatDate(
                                request.createdAt
                            )}
                        </p>

                    </div>


                    <div class="admin-item__actions">

                        <button
                            class="btn btn--dark"
                            data-delete-request="${request.id}"
                        >
                            🗑 Нест кардан
                        </button>

                    </div>

                </div>

            `;

        })
        .join("");


    $all("[data-delete-request]")
    .forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                const id =
                    button.dataset.deleteRequest;


                db.requests =
                    db.requests.filter(
                        x=>x.id !== id
                    );


                saveDB();

                renderAll();

                toast(
                    "🗑 Дархост нест шуд."
                );

            }
        );

    });

}


/* =========================================================
   ADMIN REVIEWS
========================================================= */

function renderAdminReviews(){

    const container =
        $("#adminReviewList");

    if(!container) return;


    if(!db.reviews.length){

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    Ҳоло отзыв нест.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        db.reviews
        .map(review=>`

            <div class="admin-item">

                <div>

                    <strong>
                        ${escapeHTML(
                            review.name
                        )}
                    </strong>

                    <p>
                        ${
                            "⭐".repeat(
                                Number(
                                    review.rating
                                )
                            )
                        }
                    </p>

                    <p>
                        ${escapeHTML(
                            review.text
                        )}
                    </p>

                    <p>
                        📅
                        ${formatDate(
                            review.createdAt
                        )}
                    </p>

                </div>


                <div class="admin-item__actions">

                    <button
                        class="btn btn--dark"
                        data-delete-review="${review.id}"
                    >
                        🗑 Нест кардан
                    </button>

                </div>

            </div>

        `)
        .join("");


    $all("[data-delete-review]")
    .forEach(button=>{

        button.addEventListener(
            "click",
            ()=>{

                const id =
                    button.dataset.deleteReview;


                db.reviews =
                    db.reviews.filter(
                        x=>x.id !== id
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


/* =========================================================
   MODAL CLOSE BY BACKGROUND
========================================================= */

$all(".modal-overlay")
.forEach(overlay=>{

    overlay.addEventListener(
        "click",
        event=>{

            if(
                event.target === overlay
            ){

                closeModal(
                    "#" + overlay.id
                );

            }

        }
    );

});


/* =========================================================
   ESC CLOSE
========================================================= */

document.addEventListener(
    "keydown",
    event=>{

        if(event.key === "Escape"){

            closeAllModals();

        }

    }
);


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll(){

    renderSpecialists();

    renderReviews();

    renderAdmin();

}


/* =========================================================
   START
========================================================= */

renderAll();
