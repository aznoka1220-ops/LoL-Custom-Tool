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


// 参加者追加
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


// 登録済み参加者
const playersContainer =
  document.getElementById("players");


// 今回の参加者
const participantList =
  document.getElementById("participantList");

const participantCount =
  document.getElementById("participantCount");

const selectedCount =
  document.getElementById("selectedCount");

const selectAllButton =
  document.getElementById("selectAllButton");

const clearAllButton =
  document.getElementById("clearAllButton");

const teamButton =
  document.getElementById("teamButton");


// 今回選択されている参加者
let selectedPlayers = [];


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

  await loadParticipants();
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
      [
        ...document.querySelectorAll(
          'input[name="avoidRole"]:checked'
        )
      ]
      .map(input => input.value);


    // 第1・第2希望が同じ
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

    await loadParticipants();
  }
);


// ==========================================
// 登録済み参加者一覧
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


  if (
    !data ||
    data.length === 0
  ) {

    playersContainer.textContent =
      "まだ参加者が登録されていません。";

    return;
  }


  playersContainer.innerHTML =
    data.map(player => {

      const roles =
        [
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

    })
    .join("");


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
// 今回の参加者一覧
// ==========================================

async function loadParticipants() {

  participantList.textContent =
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

    participantList.textContent =
      `参加者を取得できませんでした：${error.message}`;

    return;
  }


  if (
    !data ||
    data.length === 0
  ) {

    participantList.textContent =
      "まだ参加者が登録されていません。";

    updateParticipantCount();

    return;
  }


  participantList.innerHTML =
    data.map(player => {

      return `

        <label
          class="participant"
        >

          <input
            type="checkbox"
            class="participant-checkbox"
            value="${player.id}"
          >

          <div class="participant-info">

            <div class="participant-name">
              ${escapeHtml(player.name)}
            </div>

            <div class="participant-details">

              ${escapeHtml(player.rank)}

              ｜${escapeHtml(
                [
                  player.first_role,
                  player.second_role
                ]
                .filter(Boolean)
                .join(" / ")
                || "希望なし"
              )}

            </div>

          </div>


          <div class="participant-rating">

            Rating ${player.rating}

          </div>

        </label>

      `;

    })
    .join("");


  // チェックボックスイベント
  participantList
    .querySelectorAll(
      ".participant-checkbox"
    )
    .forEach(checkbox => {

      checkbox.addEventListener(
        "change",
        updateSelectedPlayers
      );

    });


  // 一度選択状態を更新
  updateSelectedPlayers();
}


// ==========================================
// 選択状態更新
// ==========================================

function updateSelectedPlayers() {

  const checkboxes =
    [
      ...participantList
        .querySelectorAll(
          ".participant-checkbox"
        )
    ];


  selectedPlayers =
    checkboxes
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value);


  updateParticipantCount();
}


// ==========================================
// 人数表示
// ==========================================

function updateParticipantCount() {

  const count =
    selectedPlayers.length;


  participantCount.textContent =
    `${count} / 10 人`;


  selectedCount.textContent =
    `${count}人選択中`;


  // 10人になったらチーム分けボタンを押せる
  teamButton.disabled =
    count !== 10;


  if (count === 10) {

    teamButton.textContent =
      "チーム分けへ →";

  } else {

    teamButton.textContent =
      `あと ${10 - count} 人選択`;

  }
}


// ==========================================
// 全員選択
// ==========================================

selectAllButton.addEventListener(
  "click",
  () => {

    const checkboxes =
      participantList
        .querySelectorAll(
          ".participant-checkbox"
        );


    checkboxes.forEach(
      checkbox => {

        checkbox.checked =
          true;

      }
    );


    updateSelectedPlayers();
  }
);


// ==========================================
// 全解除
// ==========================================

clearAllButton.addEventListener(
  "click",
  () => {

    const checkboxes =
      participantList
        .querySelectorAll(
          ".participant-checkbox"
        );


    checkboxes.forEach(
      checkbox => {

        checkbox.checked =
          false;

      }
    );


    updateSelectedPlayers();
  }
);


// ==========================================
// チーム分けボタン
// ==========================================

teamButton.addEventListener(
  "click",
  async () => {

    if (
      selectedPlayers.length !== 10
    ) {
      return;
    }

    await makeTeams();

  }
);


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


  if (
    !Number.isInteger(rating)
  ) {

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

  await loadParticipants();
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

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}

// ==========================================
// チーム分け
// ==========================================

async function makeTeams() {

  // 選択された10人を取得
  const {
    data,
    error
  } =
    await supabase
      .from("players")
      .select("*")
      .in(
        "id",
        selectedPlayers
      );


  if (error) {

    console.error(error);

    alert(
      `参加者の取得に失敗しました：${error.message}`
    );

    return;
  }


  if (
    !data ||
    data.length !== 10
  ) {

    alert(
      "10人の参加者を取得できませんでした。"
    );

    return;
  }


  // ------------------------------------------
  // Rating順に並べる
  // ------------------------------------------

  const players =
    [...data].sort(
      (a, b) =>
        Number(b.rating) -
        Number(a.rating)
    );


  // ------------------------------------------
  // 最初は空チーム
  // ------------------------------------------

  let blue = [];

  let red = [];


  let blueTotal = 0;

  let redTotal = 0;


  // ------------------------------------------
  // 強い人から順番に、
  // 現在Ratingが低いチームへ入れる
  // ------------------------------------------

  for (
    const player of players
  ) {

    const rating =
      Number(player.rating) || 1000;


    if (
      blue.length >= 5
    ) {

      red.push(player);

      redTotal += rating;

      continue;
    }


    if (
      red.length >= 5
    ) {

      blue.push(player);

      blueTotal += rating;

      continue;
    }


    if (
      blueTotal <= redTotal
    ) {

      blue.push(player);

      blueTotal += rating;

    } else {

      red.push(player);

      redTotal += rating;

    }

  }


  // ------------------------------------------
  // 結果表示
  // ------------------------------------------

  displayTeams(
    blue,
    red
  );
}


// ==========================================
// チーム表示
// ==========================================

function displayTeams(
  blue,
  red
) {

  blueTeam.innerHTML =
    createTeamHTML(blue);


  redTeam.innerHTML =
    createTeamHTML(red);


  const blueTotal =
    blue.reduce(
      (sum, player) =>
        sum +
        (Number(player.rating) || 1000),
      0
    );


  const redTotal =
    red.reduce(
      (sum, player) =>
        sum +
        (Number(player.rating) || 1000),
      0
    );


  blueRating.textContent =
    blueTotal;


  redRating.textContent =
    redTotal;


  ratingDifference.textContent =
    Math.abs(
      blueTotal -
      redTotal
    );


  teamPanel.classList.remove(
    "hidden"
  );


  // チーム結果までスクロール
  teamPanel.scrollIntoView({
    behavior: "smooth"
  });
}


// ==========================================
// チームメンバーHTML
// ==========================================

function createTeamHTML(
  team
) {

  return team
    .map(player => {

      return `

        <div class="team-player">

          <div>

            <div class="team-player-name">

              ${escapeHtml(
                player.name
              )}

            </div>

            <div class="team-player-rating">

              ${escapeHtml(
                player.rank
              )}

            </div>

          </div>


          <div class="team-player-rating">

            ${Number(
              player.rating
            )}

          </div>

        </div>

      `;

    })
    .join("");
}


// ==========================================
// もう一回
// ==========================================

remakeTeamButton.addEventListener(
  "click",
  async () => {

    await makeTeams();

  }
);