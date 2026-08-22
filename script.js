(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const overlay = $("#authOverlay");
  const roleSelection = $("#roleSelection");
  const smmForm = $("#smmForm");
  const clientForm = $("#clientForm");
  const authSuccess = $("#authSuccess");

  const state = {
    profiles: JSON.parse(localStorage.getItem("smm_profiles") || "[]"),
    currentUser: JSON.parse(localStorage.getItem("smm_current_user") || "null"),
    aiBusiness: localStorage.getItem("smm_ai_business") || ""
  };

  function saveData() {
    localStorage.setItem("smm_profiles", JSON.stringify(state.profiles));

    if (state.currentUser) {
      localStorage.setItem(
        "smm_current_user",
        JSON.stringify(state.currentUser)
      );
    }
  }

  function toast(message) {
    let box = $("#siteToast");

    if (!box) {
      box = document.createElement("div");
      box.id = "siteToast";

      Object.assign(box.style, {
        position: "fixed",
        left: "50%",
        bottom: "30px",
        transform: "translateX(-50%) translateY(20px)",
        zIndex: "20000",
        padding: "14px 22px",
        borderRadius: "14px",
        background: "#17131f",
        color: "#fff",
        border: "1px solid rgba(155,92,255,.4)",
        boxShadow: "0 15px 45px rgba(0,0,0,.5)",
        opacity: "0",
        transition: ".3s ease",
        maxWidth: "90%",
        textAlign: "center"
      });

      document.body.appendChild(box);
    }

    box.textContent = message;
    box.style.opacity = "1";
    box.style.transform = "translateX(-50%) translateY(0)";

    clearTimeout(box.timer);

    box.timer = setTimeout(() => {
      box.style.opacity = "0";
      box.style.transform =
        "translateX(-50%) translateY(20px)";
    }, 2800);
  }

  /* =========================
     AUTH
  ========================= */

  function openAuth(mode = "register") {
    if (!overlay) return;

    overlay.classList.add("active");

    if (roleSelection) {
      roleSelection.style.display = "grid";
    }

    smmForm?.classList.remove("active");
    clientForm?.classList.remove("active");

    if (authSuccess) {
      authSuccess.style.display = "none";
    }

    const title = $("#authTitle");
    const subtitle = $("#authSubtitle");

    if (title) {
      title.textContent =
        mode === "login"
          ? "Даромадан"
          : "Сабти ном";
    }

    if (subtitle) {
      subtitle.textContent =
        mode === "login"
          ? "Нақши худро интихоб кунед"
          : "Барои оғоз яке аз вариантҳоро интихоб кунед";
    }
  }

  function closeAuth() {
    overlay?.classList.remove("active");
  }

  $("#loginBtn")?.addEventListener("click", () => {
    openAuth("login");
  });

  $("#registerBtn")?.addEventListener("click", () => {
    openAuth("register");
  });

  $("#authClose")?.addEventListener("click", closeAuth);

  overlay?.addEventListener("click", event => {
    if (event.target === overlay) {
      closeAuth();
    }
  });

  /* =========================
     ROLE SELECTION
  ========================= */

  $("#smmRole")?.addEventListener("click", () => {
    if (roleSelection) {
      roleSelection.style.display = "none";
    }

    smmForm?.classList.add("active");

    $("#authTitle").textContent =
      "Профили SMM-щик";

    $("#authSubtitle").textContent =
      "Маълумоти худро пур кунед";

    activateStep(smmForm, 0);
  });

  $("#clientRole")?.addEventListener("click", () => {
    if (roleSelection) {
      roleSelection.style.display = "none";
    }

    clientForm?.classList.add("active");

    $("#authTitle").textContent =
      "Профили бизнес";

    $("#authSubtitle").textContent =
      "Бизнес ва ҳадафатонро муайян кунед";

    activateStep(clientForm, 0);
  });

  /* =========================
     MULTI STEP FORMS
  ========================= */

  function activateStep(form, index) {
    if (!form) return;

    const steps = $$(".form-step, .client-step", form);

    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });

    const progress = $(".form-progress", form);

    if (progress) {
      $$(".form-progress span", progress).forEach(
        (item, i) => {
          item.classList.toggle(
            "active",
            i <= index
          );
        }
      );
    }

    form.dataset.step = index;
  }

  function validateStep(form) {
    if (!form) return false;

    const step = $(
      ".form-step.active, .client-step.active",
      form
    );

    if (!step) return true;

    const fields = $$(
      "input, select, textarea",
      step
    );

    for (const field of fields) {
      if (
        field.required &&
        !field.value.trim()
      ) {
        field.reportValidity?.();
        field.focus();
        return false;
      }
    }

    return true;
  }

  $$(".next-step").forEach(button => {
    button.addEventListener("click", () => {
      const form = button.closest("form");

      if (!validateStep(form)) return;

      const current =
        Number(form.dataset.step || 0);

      activateStep(form, current + 1);
    });
  });

  $$(".client-next").forEach(button => {
    button.addEventListener("click", () => {
      const form = button.closest("form");

      if (!validateStep(form)) return;

      const current =
        Number(form.dataset.step || 0);

      activateStep(form, current + 1);
    });
  });

  /* =========================
     SMM CHOICES
  ========================= */

  $$("[data-choice]").forEach(button => {
    button.addEventListener("click", () => {
      const grid = button.closest(".choice-grid");

      $$("[data-choice]", grid).forEach(item => {
        item.classList.remove("selected");
      });

      button.classList.add("selected");

      const input = $("#smmDirection");

      if (input) {
        input.value =
          button.dataset.choice;
      }
    });
  });

  /* =========================
     BUSINESS CHOICES
  ========================= */

  $$("[data-client-choice]").forEach(button => {
    button.addEventListener("click", () => {
      const grid = button.closest(".choice-grid");

      $$("[data-client-choice]", grid)
        .forEach(item => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");

      const input = $("#clientGoal");

      if (input) {
        input.value =
          button.dataset.clientChoice;
      }
    });
  });

  /* =========================
     COLLECT FORM
  ========================= */

  function collectForm(form, type) {
    const data = {
      type,
      createdAt: new Date().toISOString()
    };

    $$(
      "input, select, textarea",
      form
    ).forEach(field => {
      if (
        field.id &&
        field.type !== "file"
      ) {
        data[field.id] =
          field.value.trim();
      }
    });

    return data;
  }

  /* =========================
     SMM REGISTER
  ========================= */

  smmForm?.addEventListener("submit", event => {
    event.preventDefault();

    if (!validateStep(smmForm)) return;

    const data =
      collectForm(smmForm, "smm");

    state.profiles.push(data);
    state.currentUser = data;

    saveData();

    showSuccess(
      "Профили SMM-щики шумо сохта шуд!"
    );
  });

  /* =========================
     BUSINESS REGISTER
  ========================= */

  clientForm?.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      if (!validateStep(clientForm))
        return;

      const data =
        collectForm(clientForm, "client");

      state.currentUser = data;

      saveData();

      showSuccess(
        "Аккаунти бизнеси шумо сохта шуд!"
      );
    }
  );

  function showSuccess(message) {
    smmForm?.classList.remove("active");
    clientForm?.classList.remove("active");

    if (roleSelection) {
      roleSelection.style.display = "none";
    }

    if (authSuccess) {
      authSuccess.style.display = "block";
    }

    const text = $("#successText");

    if (text) {
      text.textContent = message;
    }
  }

  $("#successBtn")?.addEventListener(
    "click",
    () => {
      closeAuth();

      $("#specialists")?.scrollIntoView({
        behavior: "smooth"
      });
    }
  );

  /* =========================
     AI
  ========================= */

  function startAI() {
    const modal =
      document.createElement("div");

    modal.className =
      "live-ai-modal";

    modal.innerHTML = `
      <div class="live-ai-box">

        <button class="live-ai-close">
          ×
        </button>

        <div class="ai-big-icon">
          🤖
        </div>

        <span class="small-title">
          SMM.TJ AI
        </span>

        <h2>
          Барои кадом бизнес
          SMM-щик лозим аст?
        </h2>

        <div class="live-ai-options">

          <button data-ai="Тарабхона">
            🍽️ Тарабхона
          </button>

          <button data-ai="Либос">
            👗 Либос
          </button>

          <button data-ai="Зебоӣ">
            💄 Зебоӣ
          </button>

          <button data-ai="Дӯкон">
            🛍️ Дӯкон
          </button>

          <button data-ai="Маориф">
            🎓 Маориф
          </button>

          <button data-ai="Хизматрасонӣ">
            🏢 Хизматрасонӣ
          </button>

        </div>

        <div class="live-ai-result"></div>

      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add("show");
    });

    $(".live-ai-close", modal)
      .addEventListener("click", () => {
        modal.remove();
      });

    modal.addEventListener(
      "click",
      event => {
        if (event.target === modal) {
          modal.remove();
        }
      }
    );

    $$("[data-ai]", modal).forEach(
      button => {
        button.addEventListener(
          "click",
          () => {

            const business =
              button.dataset.ai;

            state.aiBusiness =
              business;

            localStorage.setItem(
              "smm_ai_business",
              business
            );

            $(".live-ai-result", modal)
              .innerHTML = `
                <strong>
                  Бизнес: ${business}
                </strong>

                <p>
                  Барои шумо
                  SMM + Reels + Target
                  мутахассис беҳтарин аст.
                </p>

                <button
                  class="live-primary"
                  id="aiFindNow"
                >
                  🔎 Мутахассисҳоро дидан
                </button>
              `;

            $("#aiFindNow", modal)
              .addEventListener(
                "click",
                () => {

                  modal.remove();

                  $("#specialists")
                    ?.scrollIntoView({
                      behavior: "smooth"
                    });

                  toast(
                    "Мутахассисони мувофиқ нишон дода шуданд."
                  );
                }
              );
          }
        );
      }
    );
  }

  $("#aiBtn")?.addEventListener(
    "click",
    startAI
  );

  $("#startAi")?.addEventListener(
    "click",
    startAI
  );

  $("#aiMainBtn")?.addEventListener(
    "click",
    startAI
  );

  /* =========================
     FIND SMM
  ========================= */

  $("#findBtn")?.addEventListener(
    "click",
    () => {

      $("#specialists")
        ?.scrollIntoView({
          behavior: "smooth"
        });

      toast(
        "SMM-щикҳо нишон дода шуданд."
      );
    }
  );

  /* =========================
     AI QUICK BUTTONS
  ========================= */

  $$(".ai-options button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          startAI();

          toast(
            "AI оғоз шуд."
          );
        }
      );

    });

  /* =========================
     CATEGORIES
  ========================= */

  $$(".category")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const name =
            $("strong", button)
              ?.textContent ||
            "SMM";

          $("#specialists")
            ?.scrollIntoView({
              behavior: "smooth"
            });

          toast(
            `Категорияи «${name}» интихоб шуд.`
          );
        }
      );

    });

  /* =========================
     VIEW ALL
  ========================= */

  $$(".view-all")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $("#specialists")
            ?.scrollIntoView({
              behavior: "smooth"
            });

          toast(
            "Ҳамаи SMM-щикҳо кушода шуданд."
          );
        }
      );

    });

  /* =========================
     SPECIALIST PROFILE
  ========================= */

  $$(".specialist-card .card-footer button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const card =
            button.closest(
              ".specialist-card"
            );

          const name =
            $("h3", card)
              ?.textContent ||
            "SMM-щик";

          const service =
            $("p", card)
              ?.textContent ||
            "SMM";

          const price =
            $(".card-footer strong", card)
              ?.textContent ||
            "";

          openProfile(
            name,
            service,
            price
          );
        }
      );

    });

  function openProfile(
    name,
    service,
    price
  ) {

    const modal =
      document.createElement("div");

    modal.className =
      "live-profile-modal";

    modal.innerHTML = `
      <div class="live-profile-box">

        <button
          class="live-profile-close"
        >
          ×
        </button>

        <div class="avatar">
          👨🏻‍💻
        </div>

        <h2>
          ${name}
        </h2>

        <div class="verified">
          ✓ Тасдиқшуда
        </div>

        <div class="rating">
          ⭐ 4.9
          <span>
            баррасӣ
          </span>
        </div>

        <p>
          ${service}
        </p>

        <h3>
          ${price}
        </h3>

        <button
          class="live-primary"
          id="contactSpecialist"
        >
          📩 Дархост фиристодан
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add("show");
    });

    $(".live-profile-close", modal)
      .addEventListener(
        "click",
        () => modal.remove()
      );

    $("#contactSpecialist", modal)
      .addEventListener(
        "click",
        () => {

          modal.remove();

          openRequest(name);
        }
      );

    modal.addEventListener(
      "click",
      event => {
        if (event.target === modal) {
          modal.remove();
        }
      }
    );
  }

  /* =========================
     REQUEST
  ========================= */

  function openRequest(name) {

    const modal =
      document.createElement("div");

    modal.className =
      "live-profile-modal";

    modal.innerHTML = `
      <div class="live-profile-box">

        <button
          class="live-profile-close"
        >
          ×
        </button>

        <h2>
          Дархост ба ${name}
        </h2>

        <p>
          Маълумоти дархостатонро нависед.
        </p>

        <textarea
          id="requestText"
          rows="5"
          placeholder="Масалан: Instagram-и моро пеш баред..."
        ></textarea>

        <button
          class="live-primary"
          id="sendRequest"
        >
          📩 Фиристодан
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add("show");
    });

    $(".live-profile-close", modal)
      .addEventListener(
        "click",
        () => modal.remove()
      );

    $("#sendRequest", modal)
      .addEventListener(
        "click",
        () => {

          const text =
            $("#requestText", modal)
              ?.value
              .trim();

          if (!text) {

            toast(
              "Аввал матни дархостро нависед."
            );

            return;
          }

          localStorage.setItem(
            "last_smm_request",
            JSON.stringify({
              specialist: name,
              message: text,
              date:
                new Date().toISOString()
            })
          );

          modal.remove();

          toast(
            "✅ Дархост қабул шуд!"
          );
        }
      );
  }

  /* =========================
     MOBILE MENU
  ========================= */

  $("#menuBtn")
    ?.addEventListener(
      "click",
      () => {

        $(".nav")
          ?.classList.toggle(
            "mobile-active"
          );
      }
    );

  $$(".nav a")
    .forEach(link => {

      link.addEventListener(
        "click",
        () => {

          $(".nav")
            ?.classList.remove(
              "mobile-active"
            );
        }
      );

    });

  /* =========================
     SMOOTH LINKS
  ========================= */

  $$("a[href^='#']")
    .forEach(link => {

      link.addEventListener(
        "click",
        event => {

          const id =
            link.getAttribute("href");

          if (
            id &&
            id !== "#" &&
            $(id)
          ) {

            event.preventDefault();

            $(id).scrollIntoView({
              behavior: "smooth"
            });
          }
        }
      );

    });

  /* =========================
     BUTTON RIPPLE
  ========================= */

  $$("button")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          const ripple =
            document.createElement("span");

          ripple.className =
            "ripple";

          const rect =
            button.getBoundingClientRect();

          ripple.style.left =
            `${event.clientX - rect.left}px`;

          ripple.style.top =
            `${event.clientY - rect.top}px`;

          button.appendChild(ripple);

          setTimeout(
            () => ripple.remove(),
            650
          );
        }
      );

    });

  /* =========================
     STATISTICS
  ========================= */

  $$("[data-number]")
    .forEach(element => {

      const target =
        Number(
          element.dataset.number
        );

      let started = false;

      const observer =
        new IntersectionObserver(
          entries => {

            if (
              !entries[0].isIntersecting ||
              started
            ) {
              return;
            }

            started = true;

            let number = 0;

            const step =
              Math.max(
                1,
                Math.ceil(target / 50)
              );

            const timer =
              setInterval(() => {

                number += step;

                if (
                  number >= target
                ) {

                  number = target;

                  clearInterval(timer);
                }

                element.textContent =
                  number.toLocaleString(
                    "ru-RU"
                  ) + "+";

              }, 25);

            observer.disconnect();
          }
        );

      observer.observe(element);
    });

  /* =========================
     EXTRA DESIGN FOR MODALS
  ========================= */

  const style =
    document.createElement("style");

  style.textContent = `

    .live-ai-modal,
    .live-profile-modal {

      position: fixed;
      inset: 0;

      z-index: 15000;

      background:
        rgba(0,0,0,.78);

      backdrop-filter:
        blur(14px);

      display: flex;

      align-items: center;
      justify-content: center;

      padding: 20px;

      opacity: 0;

      transition: .25s;
    }

    .live-ai-modal.show,
    .live-profile-modal.show {
      opacity: 1;
    }

    .live-ai-box,
    .live-profile-box {

      position: relative;

      width:
        min(620px, 100%);

      max-height: 90vh;

      overflow-y: auto;

      padding: 34px;

      border:
        1px solid
        rgba(155,92,255,.3);

      border-radius: 28px;

      background:
        #0d0d12;

      box-shadow:
        0 30px 100px
        rgba(0,0,0,.7);
    }

    .live-ai-close,
    .live-profile-close {

      position: absolute;

      right: 16px;
      top: 16px;

      width: 38px;
      height: 38px;

      border-radius: 50%;

      border:
        1px solid
        rgba(255,255,255,.1);

      background:
        #17131f;

      color: white;

      font-size: 24px;

      cursor: pointer;
    }

    .live-ai-options {

      display: grid;

      grid-template-columns:
        repeat(2, 1fr);

      gap: 10px;

      margin-top: 20px;
    }

    .live-ai-options button {

      padding: 15px;

      border:
        1px solid
        rgba(255,255,255,.08);

      border-radius: 13px;

      background:
        #15131b;

      color: white;

      cursor: pointer;

      transition: .25s;
    }

    .live-ai-options button:hover {

      border-color:
        #9b5cff;

      background:
        #211735;

      transform:
        translateY(-2px);
    }

    .live-ai-result {

      margin-top: 22px;

      padding: 20px;

      border-radius: 18px;

      background:
        rgba(155,92,255,.08);

      line-height: 1.7;
    }

    .live-primary {

      margin-top: 16px;

      border: none;

      border-radius: 13px;

      padding: 14px 20px;

      background:
        linear-gradient(
          135deg,
          #7638ff,
          #a45cff
        );

      color: white;

      font-weight: 700;

      cursor: pointer;
    }

    .live-profile-box textarea {

      width: 100%;

      margin-top: 15px;

      padding: 14px;

      border-radius: 13px;

      background:
        #111117;

      color: white;

      border:
        1px solid
        rgba(255,255,255,.1);

      resize: vertical;
    }

    .choice-grid button.selected {

      border-color:
        #9b5cff !important;

      background:
        rgba(155,92,255,.15)
        !important;

      color: white;
    }

    @media(max-width:600px) {

      .live-ai-options {

        grid-template-columns:
          1fr;
      }

      .live-ai-box,
      .live-profile-box {

        padding:
          26px 20px;
      }
    }

  `;

  document.head.appendChild(style);

  console.log(
    "SMM.TJ platform initialized."
  );

})();
