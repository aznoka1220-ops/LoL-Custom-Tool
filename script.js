import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// Supabase設定
// ==========================================

// ↓↓↓ ここは今使っているものに置き換える ↓↓↓

const SUPABASE_URL =
  "https://mkhkbqqstrgrrwxjxaup.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_-_TUs3rBvdqeIAfsSVylrA_7TPFDsbU";

// ↑↑↑ ここまで ↑↑↑


const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================
// HTML要素
// ==========================================

// ログイン
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


// 管理画面
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


// ==========================================
// チーム分け
// ==========================================

const teamResult =
  document.getElementById("teamResult");

const blueTeam =
  document.getElementById("blueTeam");

const redTeam =
  document.getElementById("redTeam");

const blueRating =
  document.getElementById("blueRating");

const redRating =
  document.getElementById("redRating");

const ratingDifference =
  document.getElementById("ratingDifference");

const rerollButton =
  document.getElementById("rerollButton");

const teamMode =
  document.getElementById("teamMode");


// ==========================================
// 選択されている参加者
// ==========================================

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


    // ワチャワチャ回のNGロール
    const avoidRoles =
      [
        ...document.querySelectorAll(
          'input[name="avoidRole"]:checked'
        )
      ]
      .map(
        input => input.value
      );


    // 第1希望と第2希望が同じか確認
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

          name: name,

          rank: rank,

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
    data
      .map(
        player =>
          createPlayerHtml(player)
      )
      .join("");


  // Rating保存ボタン
  playersContainer
    .querySelectorAll(
      "button[data-id]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            updateRating(
              button.dataset.id
            );

          }
        );

      }
    );
}


// ==========================================
// 登録済み参加者HTML
// ==========================================

function createPlayerHtml(
  player
) {

  const roles =
    [
      player.first_role,
      player.second_role
    ]
    .filter(Boolean)
    .join(" / ");


  const avoid =
    player.avoid_roles &&
    player.avoid_roles.length > 0

      ? `NG：${player.avoid_roles.join(", ")}`

      : "NGなし";


  return `

    <div class="player">

      <div class="player-info">

        <div class="player-name">
          ${escapeHtml(player.name)}
        </div>

        <div class="player-details">

          ${escapeHtml(
            player.rank || "Unranked"
          )}

          ｜希望：
          ${escapeHtml(
            roles || "なし"
          )}

          ｜

          ${escapeHtml(avoid)}

        </div>

      </div>


      <div class="rating-edit">

        <input
          type="number"
          value="${Number(player.rating || 1000)}"
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

    selectedPlayers = [];

    updateParticipantCount();

    return;
  }


  participantList.innerHTML =
    data
      .map(
        player =>
          createParticipantHtml(player)
      )
      .join("");


  participantList
    .querySelectorAll(
      ".participant-checkbox"
    )
    .forEach(
      checkbox => {

        checkbox.addEventListener(
          "change",
          updateSelectedPlayers
        );

      }
    );


  updateSelectedPlayers();
}


// ==========================================
// 今回の参加者HTML
// ==========================================

function createParticipantHtml(
  player
) {

  const roles =
    [
      player.first_role,
      player.second_role
    ]
    .filter(Boolean)
    .join(" / ");


  return `

    <label class="participant">

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

          ${escapeHtml(
            player.rank || "Unranked"
          )}

          ｜

          ${escapeHtml(
            roles || "希望なし"
          )}

        </div>

      </div>


      <div class="participant-rating">

        Rating ${Number(
          player.rating || 1000
        )}

      </div>

    </label>

  `;
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

      .filter(
        checkbox =>
          checkbox.checked
      )

      .map(
        checkbox =>
          checkbox.value
      );


  updateParticipantCount();
}


// ==========================================
// 参加人数表示
// ==========================================

function updateParticipantCount() {

  const count =
    selectedPlayers.length;


  participantCount.textContent =
    `${count} / 10 人`;


  selectedCount.textContent =
    `${count}人選択中`;


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


    await createTeams();
  }
);


// ==========================================
// もう一回振り分け
// ==========================================

rerollButton.addEventListener(
  "click",
  async () => {

    await createTeams();
  }
);


// ==========================================
// モード変更
// ==========================================

teamMode.addEventListener(
  "change",
  async () => {

    if (
      selectedPlayers.length !== 10
    ) {

      return;
    }


    await createTeams();
  }
);


// ==========================================
// チーム作成
// ==========================================

async function createTeams() {

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
      "参加者を10人取得できませんでした。"
    );

    return;
  }


  const teams =
    makeBalancedTeams(data);


  displayTeams(
    teams.blue,
    teams.red
  );


  teamResult.classList.remove(
    "hidden"
  );


  teamResult.scrollIntoView({
    behavior: "smooth"
  });
}


// ==========================================
// Ratingが近くなる5vs5を探す
// ==========================================

function makeBalancedTeams(
  players
) {

  let bestBlue = null;

  let bestRed = null;

  let bestDifference =
    Infinity;


  // 10人から5人を選ぶ
  const combinations =
    getCombinations(
      players,
      5
    );


  for (
    const blue of combinations
  ) {

    const blueIds =
      new Set(
        blue.map(
          player =>
            player.id
        )
      );


    const red =
      players.filter(
        player =>
          !blueIds.has(
            player.id
          )
      );


    const blueTotal =
      blue.reduce(
        (sum, player) =>
          sum +
          Number(
            player.rating || 1000
          ),
        0
      );


    const redTotal =
      red.reduce(
        (sum, player) =>
          sum +
          Number(
            player.rating || 1000
          ),
        0
      );


    const difference =
      Math.abs(
        blueTotal -
        redTotal
      );


    if (
      difference <
      bestDifference
    ) {

      bestDifference =
        difference;

      bestBlue =
        blue;

      bestRed =
        red;

    }
  }


  return {

    blue: bestBlue,

    red: bestRed

  };
}


// ==========================================
// 組み合わせ生成
// ==========================================

function getCombinations(
  array,
  size
) {

  const result = [];


  function combine(
    start,
    current
  ) {

    if (
      current.length === size
    ) {

      result.push(
        [...current]
      );

      return;
    }


    for (
      let i = start;
      i < array.length;
      i++
    ) {

      current.push(
        array[i]
      );


      combine(
        i + 1,
        current
      );


      current.pop();

    }
  }


  combine(
    0,
    []
  );


  return result;
}


// ==========================================
// チーム表示
// ==========================================

function displayTeams(
  blue,
  red
) {

  blueTeam.innerHTML =
    blue
      .map(
        player =>
          createTeamPlayerHtml(
            player
          )
      )
      .join("");


  redTeam.innerHTML =
    red
      .map(
        player =>
          createTeamPlayerHtml(
            player
          )
      )
      .join("");


  const blueTotal =
    blue.reduce(
      (sum, player) =>
        sum +
        Number(
          player.rating || 1000
        ),
      0
    );


  const redTotal =
    red.reduce(
      (sum, player) =>
        sum +
        Number(
          player.rating || 1000
        ),
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
}


// ==========================================
// チーム内プレイヤー表示
// ==========================================

function createTeamPlayerHtml(
  player
) {

  const roles =
    [
      player.first_role,
      player.second_role
    ]
    .filter(Boolean)
    .join(" / ");


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
            player.rank || "Unranked"
          )}

          ｜

          Rating
          ${Number(
            player.rating || 1000
          )}

          ｜

          ${escapeHtml(
            roles || "ロール未設定"
          )}

        </div>

      </div>

    </div>

  `;
}


// ==========================================
// Rating更新
// ==========================================

async function updateRating(
  id
) {

  const input =
    document.getElementById(
      `rating-${id}`
    );


  const rating =
    Number(
      input.value
    );


  if (
    !Number.isInteger(
      rating
    )
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
        rating: rating
      })
      .eq(
        "id",
        id
      );


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

function escapeHtml(
  value
) {

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