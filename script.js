document.addEventListener("DOMContentLoaded", () => {

    const authOverlay = document.getElementById("authOverlay");
    const authClose = document.getElementById("authClose");

    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");

    const roleSelection = document.getElementById("roleSelection");

    const smmRole = document.getElementById("smmRole");
    const clientRole = document.getElementById("clientRole");

    const smmForm = document.getElementById("smmForm");
    const clientForm = document.getElementById("clientForm");

    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");

    const authSuccess = document.getElementById("authSuccess");
    const successText = document.getElementById("successText");

    const successBtn = document.getElementById("successBtn");


    // ================================
    // OPEN REGISTRATION
    // ================================

    registerBtn?.addEventListener("click", () => {

        openAuth();

    });


    // ================================
    // OPEN LOGIN
    // ================================

    loginBtn?.addEventListener("click", () => {

        openAuth();

    });


    function openAuth() {

        authOverlay.classList.add("active");

        roleSelection.style.display = "grid";

        smmForm.classList.remove("active");
        clientForm.classList.remove("active");

        authSuccess.classList.remove("active");

        authTitle.textContent = "Сабти ном";

        authSubtitle.textContent =
            "Барои оғоз яке аз вариантҳоро интихоб кунед";

        document.body.style.overflow = "hidden";

    }


    // ================================
    // CLOSE
    // ================================

    authClose?.addEventListener("click", closeAuth);

    authOverlay?.addEventListener("click", (event) => {

        if (event.target === authOverlay) {
            closeAuth();
        }

    });


    function closeAuth() {

        authOverlay.classList.remove("active");

        document.body.style.overflow = "";

    }


    // ================================
    // SMM ROLE
    // ================================

    smmRole?.addEventListener("click", () => {

        roleSelection.style.display = "none";

        smmForm.classList.add("active");

        authTitle.textContent =
            "Сабти номи SMM-щик";

        authSubtitle.textContent =
            "Профили худро созед ва муштариён пайдо кунед.";

    });


    // ================================
    // CLIENT ROLE
    // ================================

    clientRole?.addEventListener("click", () => {

        roleSelection.style.display = "none";

        clientForm.classList.add("active");

        authTitle.textContent =
            "Сабти номи бизнес";

        authSubtitle.textContent =
            "Бизнеси худро шинос кунед, то мутахассиси мувофиқ пайдо шавад.";

    });


    // ================================
    // SMM STEPS
    // ================================

    const smmSteps =
        document.querySelectorAll(".form-step");

    const smmProgress =
        smmForm.querySelectorAll(".form-progress span");

    let smmCurrentStep = 0;


    function showSmmStep(index) {

        smmSteps.forEach((step, i) => {

            step.classList.toggle(
                "active",
                i === index
            );

        });


        smmProgress.forEach((bar, i) => {

            bar.classList.toggle(
                "active",
                i <= index
            );

        });

    }


    document.querySelectorAll(".next-step").forEach(button => {

        button.addEventListener("click", () => {

            const current =
                smmSteps[smmCurrentStep];

            const inputs =
                current.querySelectorAll(
                    "input[required], textarea[required]"
                );

            let valid = true;

            inputs.forEach(input => {

                if (!input.value.trim()) {

                    input.focus();

                    input.style.borderColor =
                        "#ff4f7b";

                    valid = false;

                } else {

                    input.style.borderColor = "";

                }

            });


            if (!valid) return;


            if (smmCurrentStep < smmSteps.length - 1) {

                smmCurrentStep++;

                showSmmStep(smmCurrentStep);

            }

        });

    });


    // ================================
    // SMM CHOICE
    // ================================

    document.querySelectorAll(
        "#smmForm .choice-grid button"
    ).forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(
                "#smmForm .choice-grid button"
            ).forEach(btn => {
                btn.classList.remove("selected");
            });

            button.classList.add("selected");

            document.getElementById(
                "smmDirection"
            ).value = button.dataset.choice;

        });

    });


    // ================================
    // CLIENT STEPS
    // ================================

    const clientSteps =
        document.querySelectorAll(".client-step");

    const clientProgress =
        clientForm.querySelectorAll(".form-progress span");

    let clientCurrentStep = 0;


    function showClientStep(index) {

        clientSteps.forEach((step, i) => {

            step.classList.toggle(
                "active",
                i === index
            );

        });


        clientProgress.forEach((bar, i) => {

            bar.classList.toggle(
                "active",
                i <= index
            );

        });

    }


    document.querySelectorAll(".client-next").forEach(button => {

        button.addEventListener("click", () => {

            const current =
                clientSteps[clientCurrentStep];

            const inputs =
                current.querySelectorAll(
                    "input[required], select[required]"
                );

            let valid = true;

            inputs.forEach(input => {

                if (!input.value.trim()) {

                    input.focus();

                    input.style.borderColor =
                        "#ff4f7b";

                    valid = false;

                } else {

                    input.style.borderColor = "";

                }

            });


            if (!valid) return;


            if (clientCurrentStep < clientSteps.length - 1) {

                clientCurrentStep++;

                showClientStep(clientCurrentStep);

            }

        });

    });


    // ================================
    // CLIENT CHOICE
    // ================================

    document.querySelectorAll(
        "#clientForm .choice-grid button"
    ).forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(
                "#clientForm .choice-grid button"
            ).forEach(btn => {
                btn.classList.remove("selected");
            });

            button.classList.add("selected");

            document.getElementById(
                "clientGoal"
            ).value = button.dataset.clientChoice;

        });

    });


    // ================================
    // SMM SUBMIT
    // ================================

    smmForm?.addEventListener("submit", (event) => {

        event.preventDefault();

        authTitle.textContent = "";

        authSubtitle.textContent = "";

        smmForm.classList.remove("active");

        authSuccess.classList.add("active");

        successText.textContent =
            "Профили SMM-щики шумо бомуваффақият сохта шуд. Акнун метавонед портфолио ва хизматрасониҳои худро илова кунед.";

    });


    // ================================
    // CLIENT SUBMIT
    // ================================

    clientForm?.addEventListener("submit", (event) => {

        event.preventDefault();

        authTitle.textContent = "";

        authSubtitle.textContent = "";

        clientForm.classList.remove("active");

        authSuccess.classList.add("active");

        successText.textContent =
            "Маълумоти бизнеси шумо сабт шуд. Акнун мо метавонем SMM-мутахассиси мувофиқро барои шумо пайдо кунем.";

    });


    // ================================
    // SUCCESS BUTTON
    // ================================

    successBtn?.addEventListener("click", () => {

        closeAuth();

    });

});
