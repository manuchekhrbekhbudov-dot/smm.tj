(() => {
  "use strict";

  /* =========================
     SUPABASE
  ========================= */

  const SUPABASE_URL =
    "https://lcldaingzicxbottlznq.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";

  const supabase =
    window.supabase?.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );


  /* =========================
     HELPERS
  ========================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    [...document.querySelectorAll(selector)];


  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function initials(name) {
    return String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();
  }


  /* =========================
     ICONS
  ========================= */

  const icons = {

    menu: `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2">
        <path d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    `,

    close: `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2">
        <path d="M6 6l12 12M18 6L6 18"/>
      </svg>
    `,

    arrow: `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2">
        <path d="M5 12h14"/>
        <path d="m13 6 6 6-6 6"/>
      </svg>
    `,

    star: `
      <svg viewBox="0 0 24 24"
        fill="currentColor">
        <path d="m12 2.8 2.8 5.7 6.3.9-4.55 4.45
        1.08 6.28L12 17.15l-5.63 2.98
        1.08-6.28L2.9 9.4l6.3-.9L12 2.8Z"/>
      </svg>
    `,

    check: `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5">
        <path d="m5 12 4 4L19 6"/>
      </svg>
    `,

    sparkles: `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8">
        <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/>
      </svg>
    `

  };


  /* =========================
     ICON RENDER
  ========================= */

  function renderIcons() {

    $$("[data-icon]").forEach(element => {

      const name =
        element.dataset.icon;

      if (icons[name]) {

        element.innerHTML =
          icons[name];

      }

    });

  }


  /* =========================
     MOBILE MENU
  ========================= */

  function initMenu() {

    const menu =
      $(".menu-toggle");

    const drawer =
      $(".mobile-drawer");

    const close =
      $(".mobile-drawer-close");


    if (!menu || !drawer)
      return;


    menu.addEventListener(
      "click",
      () => {

        drawer.classList.add("open");

        document.body.classList.add(
          "drawer-open"
        );

      }
    );


    close?.addEventListener(
      "click",
      closeMenu
    );


    drawer.addEventListener(
      "click",
      event => {

        if (
          event.target === drawer
        ) {

          closeMenu();

        }

      }
    );


    $$(".mobile-drawer-panel a")
      .forEach(link => {

        link.addEventListener(
          "click",
          closeMenu
        );

      });


    function closeMenu() {

      drawer.classList.remove(
        "open"
      );

      document.body.classList.remove(
        "drawer-open"
      );

    }

  }


  /* =========================
     DATABASE GET
  ========================= */

  async function getData(
    table,
    limit = 20
  ) {

    if (!supabase) {

      throw new Error(
        "Supabase library not found."
      );

    }


    const {
      data,
      error
    } = await supabase
      .from(table)
      .select("*")
      .limit(limit);


    if (error)
      throw error;


    return data || [];

  }


  /* =========================
     CATEGORIES
  ========================= */

  const defaultCategories = [

    {
      name: "Instagram",
      description:
        "Идоракунӣ ва рушди Instagram",
      icon: "◎"
    },

    {
      name: "Reels",
      description:
        "Видеоҳои кӯтоҳ ва контент",
      icon: "▶"
    },

    {
      name: "Target",
      description:
        "Реклама ва ҷалби аудитория",
      icon: "⌁"
    },

    {
      name: "Content",
      description:
        "Контент-план ва стратегия",
      icon: "◈"
    },

    {
      name: "Design",
      description:
        "Дизайн барои social media",
      icon: "✦"
    },

    {
      name: "Marketing",
      description:
        "Стратегияи маркетинг",
      icon: "↗"
    }

  ];


  async function loadCategories() {

    const grid =
      $("#category-grid");


    if (!grid)
      return;


    let categories =
      defaultCategories;


    try {

      const databaseCategories =
        await getData(
          "categories",
          12
        );


      if (
        databaseCategories.length
      ) {

        categories =
          databaseCategories.map(
            (item, index) => ({

              name:
                item.name ||
                item.title ||
                defaultCategories[
                  index %
                  defaultCategories.length
                ].name,

              description:
                item.description ||
                defaultCategories[
                  index %
                  defaultCategories.length
                ].description,

              icon:
                item.icon ||
                defaultCategories[
                  index %
                  defaultCategories.length
                ].icon

            })
          );

      }

    } catch (error) {

      console.warn(
        "Categories:",
        error.message
      );

    }


    grid.innerHTML =
      categories.map(
        category => `

        <a
          class="category-card"
          href="specialists.html?category=${encodeURIComponent(
            category.name
          )}"
        >

          <div class="cat-icon">
            ${escapeHTML(
              category.icon
            )}
          </div>

          <div class="category-content">

            <h3>
              ${escapeHTML(
                category.name
              )}
            </h3>

            <p>
              ${escapeHTML(
                category.description
              )}
            </p>

          </div>

          <span class="category-arrow">
            ${icons.arrow}
          </span>

        </a>

      `
      ).join("");

  }


  /* =========================
     SPECIALISTS
  ========================= */

  async function loadSpecialists() {

    const grid =
      $("#featured-grid");


    if (!grid)
      return;


    try {

      const specialists =
        await getData(
          "specialists",
          6
        );


      if (
        !specialists.length
      ) {

        grid.innerHTML = `

          <div class="empty-state">

            <div class="cat-icon">
              ${icons.sparkles}
            </div>

            <h3>
              Ҳоло мутахассис нест
            </h3>

            <p>
              Аввалин SMM-мутахассис
              бошед.
            </p>

            <a
              href="register-specialist.html"
              class="btn btn-primary"
            >
              Профил сохтан
              ${icons.arrow}
            </a>

          </div>

        `;

        return;

      }


      grid.innerHTML =
        specialists.map(
          specialist => `

          <article
            class="specialist-card"
          >

            <div
              class="specialist-card-top"
            >

              <div
                class="specialist-avatar"
              >
                ${escapeHTML(
                  initials(
                    specialist.name
                  )
                )}
              </div>

              <div
                class="specialist-card-title"
              >

                <h3>
                  ${escapeHTML(
                    specialist.name
                  )}
                </h3>

                <span
                  class="verified-badge"
                >
                  ${icons.check}
                </span>

                <p>
                  ${escapeHTML(
                    specialist.service ||
                    "SMM Specialist"
                  )}
                </p>

              </div>

            </div>


            <div
              class="specialist-tags"
            >

              <span>
                ${escapeHTML(
                  specialist.category ||
                  "SMM"
                )}
              </span>

              <span>
                ${escapeHTML(
                  specialist.experience ||
                  "—"
                )}
                таҷриба
              </span>

            </div>


            <div
              class="specialist-meta"
            >

              <span class="rating">

                ${icons.star}

                ${escapeHTML(
                  specialist.rating ||
                  "5.0"
                )}

              </span>

              <span>

                ${escapeHTML(
                  specialist.price ||
                  "Бо мувофиқа"
                )}

              </span>

            </div>


            <a
              href="specialists.html"
              class="btn btn-outline"
            >

              Профилро дидан

              ${icons.arrow}

            </a>

          </article>

        `
        ).join("");


    } catch (error) {

      console.error(
        "SPECIALISTS ERROR:",
        error
      );


      grid.innerHTML = `

        <div class="empty-state">

          <div class="cat-icon">
            ${icons.close}
          </div>

          <h3>
            Хатогӣ пайдо шуд
          </h3>

          <p>
            Database пайваст нашуд.
          </p>

        </div>

      `;

    }

  }


  /* =========================
     AUTH
  ========================= */

  async function loadAuth() {

    const slot =
      $("[data-auth-slot]");


    if (!slot)
      return;


    if (!supabase) {

      slot.innerHTML = `

        <a
          href="login.html"
          class="btn btn-outline btn-sm"
        >
          Ворид шудан
        </a>

      `;

      return;

    }


    try {

      const {
        data
      } =
        await supabase.auth
          .getUser();


      const user =
        data?.user;


      if (!user) {

        slot.innerHTML = `

          <a
            href="login.html"
            class="btn btn-outline btn-sm"
          >
            Ворид шудан
          </a>

          <a
            href="register-specialist.html"
            class="btn btn-primary btn-sm"
          >
            Ман SMM-мутахассис ҳастам
          </a>

        `;

        return;

      }


      const name =
        user.user_metadata
          ?.full_name ||
        user.email
          ?.split("@")[0] ||
        "Профил";


      slot.innerHTML = `

        <a
          href="profile.html"
          class="btn btn-outline btn-sm"
        >
          ${escapeHTML(name)}
        </a>

        <button
          id="logoutBtn"
          class="btn btn-primary btn-sm"
        >
          Баромадан
        </button>

      `;


      $("#logoutBtn")
        ?.addEventListener(
          "click",
          async () => {

            await supabase
              .auth
              .signOut();

            location.reload();

          }
        );


    } catch (error) {

      console.error(
        "AUTH ERROR:",
        error
      );

    }

  }


  /* =========================
     REALTIME
  ========================= */

  function realtime() {

    if (!supabase)
      return;


    supabase
      .channel(
        "smm-tj-specialists"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "specialists"
        },
        () => {

          loadSpecialists();

        }
      )
      .subscribe();


    supabase.auth
      .onAuthStateChange(
        () => {

          loadAuth();

        }
      );

  }


  /* =========================
     DEBUG
  ========================= */

  window.addEventListener(
    "error",
    event => {

      console.error(
        "SMM.TJ ERROR:",
        event.message,
        event.filename,
        event.lineno
      );

    }
  );


  window.addEventListener(
    "unhandledrejection",
    event => {

      console.error(
        "SMM.TJ PROMISE ERROR:",
        event.reason
      );

    }
  );


  /* =========================
     START
  ========================= */

  async function start() {

    console.log(
      "SMM.TJ starting..."
    );


    renderIcons();

    initMenu();


    await Promise.allSettled([

      loadCategories(),

      loadSpecialists(),

      loadAuth()

    ]);


    realtime();


    console.log(
      "✓ SMM.TJ READY"
    );

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }


  window.SMMTJ = {

    supabase,

    loadCategories,

    loadSpecialists,

    loadAuth

  };

})();
