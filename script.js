import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// Supabase
// ==========================================

const SUPABASE_URL =
  "https://mkhkbqqstrgrrwxjxaup.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_-_TUs3rBvdqeIAfsSVylrA_7TPFDsbU";


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================
// HTML
// ==========================================

const loginCard =
  document.getElementById("loginCard");

const loginForm =
  document.getElementById("loginForm");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const message =
  document.getElementById("message");

const adminPanel =
  document.getElementById("adminPanel");

const userEmail =
  document.getElementById("userEmail");

const logoutButton =
  document.getElementById("logoutButton");

const playerForm =
  document.getElementById("playerForm");

const playerName =
  document.getElementById("playerName");

const playerRank =
  document.getElementById("playerRank");

const firstRole =
  document.getElementById("firstRole");

const secondRole =
  document.getElementById("secondRole");

const playerMessage =
  document.getElementById("playerMessage");

const playersContainer =
  document.getElementById("players");


// ==========================================
// 起動
// ==========================================

checkLogin();


// ==========================================
// ログイン
// ==========================================

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    message.textContent =
      "ログインしています……";

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    const {
      data,
      error
    } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {

      console.error(error);

      message.textContent =
        `ログインできませんでした：${error.message}`;

      return;
    }

    await showAdmin(data.user);
  }
);


// ==========================================
// ログイン状態確認
// ==========================================

async function checkLogin() {

  const {
    data: {
      session
    }
  } =
    await supabase.auth.getSession();

  if (!session) {
    return;
  }

  await showAdmin(session.user);
}


// ==========================================
// 管理画面表示
// ==========================================

async function showAdmin(user) {

  loginCard.classList.add("hidden");

  adminPanel.classList.remove("hidden");

  userEmail.textContent =
    user.email;

  await loadPlayers();
}


// ==========================================
// 参加者追加
// ==========================================

playerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    playerMessage.textContent =
      "登録しています……";


    const name =
      playerName.value.trim();

    const rank =
      playerRank.value;

    const first =
      firstRole.value || null;

    const second =
      secondRole.value || null;


    const avoidRoles =
      [...document.querySelectorAll(
        'input[name="avoidRole"]:checked'
      )]
      .map(input => input.value);


    // 同じロールを第1・第2にするのを防ぐ
    if (
      first &&
      second &&
      first === second
    ) {

      playerMessage.textContent =
        "第1希望と第2希望は別のロールを選んでね。";

      return;
    }


    const {
      error
    } =
      await supabase
        .from("players")
        .insert({
          name,
          rank,
          rating: 1000,
          games: 0,
          wins: 0,
          first_role: first,
          second_role: second,
          avoid_roles: avoidRoles
        });


    if (error) {

      console.error(error);

      playerMessage.textContent =
        `登録できませんでした：${error.message}`;

      return;
    }


    playerMessage.textContent =
      `${name}さんを登録しました！`;


    playerForm.reset();

    await loadPlayers();
  }
);


// ==========================================
// 参加者一覧
// ==========================================

async function loadPlayers() {

  playersContainer.textContent =
    "読み込み中……";


  const {
    data,
    error
  } =
    await supabase
      .from("players")
      .select("*")
      .order("name");


  if (error) {

    console.error(error);

    playersContainer.textContent =
      `参加者を取得できませんでした：${error.message}`;

    return;
  }


  if (!data || data.length === 0) {

    playersContainer.textContent =
      "まだ参加者が登録されていません。";

    return;
  }


  playersContainer.innerHTML =
    data.map(player => {

      const roles = [
        player.first_role,
        player.second_role
      ]
      .filter(Boolean)
      .join(" / ");


      const avoid =
        player.avoid_roles?.length
          ? `NG：${player.avoid_roles.join(", ")}`
          : "NGなし";


      return `

        <div class="player">

          <div class="player-info">

            <div class="player-name">
              ${escapeHtml(player.name)}
            </div>

            <div class="player-details">
              ${escapeHtml(player.rank)}
              ｜希望：${escapeHtml(roles || "なし")}
              ｜${escapeHtml(avoid)}
            </div>

          </div>


          <div class="rating-edit">

            <input
              type="number"
              value="${player.rating}"
              id="rating-${player.id}"
            >

            <button
              data-id="${player.id}"
            >
              保存
            </button>

          </div>

        </div>

      `;

    }).join("");


  playersContainer
    .querySelectorAll(
      "button[data-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => updateRating(
          button.dataset.id
        )
      );

    });
}


// ==========================================
// Rating更新
// ==========================================

async function updateRating(id) {

  const input =
    document.getElementById(
      `rating-${id}`
    );


  const rating =
    Number(input.value);


  if (!Number.isInteger(rating)) {

    alert(
      "Ratingは整数で入力してください。"
    );

    return;
  }


  const {
    error
  } =
    await supabase
      .from("players")
      .update({
        rating
      })
      .eq("id", id);


  if (error) {

    console.error(error);

    alert(
      `Ratingの更新に失敗しました：${error.message}`
    );

    return;
  }


  await loadPlayers();
}


// ==========================================
// ログアウト
// ==========================================

logoutButton.addEventListener(
  "click",
  async () => {

    await supabase.auth.signOut();

    location.reload();
  }
);


// ==========================================
// HTMLエスケープ
// ==========================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}