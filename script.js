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


// チーム分け
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


// 追加されていれば使用
const copyButton =
  document.getElementById("copyTeamButton");

const teamMessage =
  document.getElementById("teamMessage");

const blueWinButton =
  document.getElementById("blueWinButton");

const redWinButton =
  document.getElementById("redWinButton");

const matchMessage =
  document.getElementById("matchMessage");


// ==========================================
// 状態
// ==========================================

let selectedPlayers = [];

let currentTeams = null;


// ==========================================
// 定数
// ==========================================

const ROLES = [
  "TOP",
  "JG",
  "MID",
  "ADC",
  "SUP"
];


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
// 管理画面
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
      .map(
        input => input.value
      );


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
// 登録済み参加者
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
          value="${Number(
            player.rating || 1000
          )}"
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
// 今回の参加者
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
// 参加者HTML
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

          ${escapeHtml(
            player.name
          )}

        </div>


        <div class="participant-details">

          ${escapeHtml(
            player.rank || "Unranked"
          )}

          ｜

          希望：
          ${escapeHtml(
            roles || "なし"
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
// 選択更新
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
// 人数表示
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

    participantList
      .querySelectorAll(
        ".participant-checkbox"
      )
      .forEach(
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

    participantList
      .querySelectorAll(
        ".participant-checkbox"
      )
      .forEach(
        checkbox => {

          checkbox.checked =
            false;

        }
      );


    updateSelectedPlayers();
  }
);


// ==========================================
// チーム分け
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
// 再抽選
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

  teamMessageIfExists(
    "チームを考えています……"
  );


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


  let teams;


  if (
    teamMode.value === "chaos"
  ) {

    teams =
      makeChaosTeams(data);

  } else {

    teams =
      makeNormalTeams(data);

  }


  currentTeams =
    teams;


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


  teamMessageIfExists(
    ""
  );
}


// ==========================================
// 通常ドラフト
// ==========================================
//
// 第1希望 / 第2希望を考慮しつつ
// Rating差も小さくする
//

function makeNormalTeams(
  players
) {

  let best = null;


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


    const blueRole =
      assignRoles(
        blue,
        false
      );


    const redRole =
      assignRoles(
        red,
        false
      );


    const ratingDifference =
      Math.abs(
        getRatingTotal(blue) -
        getRatingTotal(red)
      );


    const rolePenalty =
      blueRole.penalty +
      redRole.penalty;


    /*
     * 希望を満たせない場合には
     * 大きなペナルティを付ける。
     *
     * Rating差よりも
     * ロール希望を優先する。
     */

    const score =
      rolePenalty * 10000 +
      ratingDifference;


    if (
      best === null ||
      score < best.score
    ) {

      best = {

        blue: blue,

        red: red,

        blueRoles:
          blueRole,

        redRoles:
          redRole,

        score: score

      };

    }

  }


  return {

    blue:
      applyRoles(
        best.blue,
        best.blueRoles
      ),

    red:
      applyRoles(
        best.red,
        best.redRoles
      )

  };
}


// ==========================================
// ワチャワチャ回
// ==========================================

function makeChaosTeams(
  players
) {

  let best = null;


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


    const blueRole =
      assignRoles(
        blue,
        true
      );


    const redRole =
      assignRoles(
        red,
        true
      );


    const ratingDifference =
      Math.abs(
        getRatingTotal(blue) -
        getRatingTotal(red)
      );


    const score =
      blueRole.penalty +
      redRole.penalty;


    /*
     * ワチャワチャでは
     * RatingよりNG回避を重視。
     */

    const totalScore =
      score * 10000 +
      ratingDifference * 0.2;


    if (
      best === null ||
      totalScore < best.score
    ) {

      best = {

        blue: blue,

        red: red,

        blueRoles:
          blueRole,

        redRoles:
          redRole,

        score:
          totalScore

      };

    }

  }


  return {

    blue:
      applyRoles(
        best.blue,
        best.blueRoles
      ),

    red:
      applyRoles(
        best.red,
        best.redRoles
      )

  };
}


// ==========================================
// ロール割り当て
// ==========================================

function assignRoles(
  players,
  chaos
) {

  let bestAssignment = null;

  let bestPenalty =
    Infinity;


  const permutations =
    getPermutations(
      players
    );


  for (
    const permutation of permutations
  ) {

    let penalty = 0;

    const assignment = {};


    for (
      let i = 0;
      i < ROLES.length;
      i++
    ) {

      const player =
        permutation[i];

      const role =
        ROLES[i];


      assignment[player.id] =
        role;


      const first =
        player.first_role;

      const second =
        player.second_role;

      const avoid =
        player.avoid_roles ||
        [];


      // ==========================
      // ワチャワチャ
      // ==========================

      if (chaos) {

        if (
          avoid.includes(role)
        ) {

          penalty += 100;

        }


        if (
          first === role
        ) {

          penalty += 0;

        } else if (
          second === role
        ) {

          penalty += 2;

        } else {

          penalty += 5;

        }


        continue;
      }


      // ==========================
      // 通常ドラフト
      // ==========================

      if (
        first === role
      ) {

        penalty += 0;

      } else if (
        second === role
      ) {

        penalty += 3;

      } else if (
        !first &&
        !second
      ) {

        penalty += 5;

      } else {

        penalty += 20;

      }

    }


    if (
      penalty < bestPenalty
    ) {

      bestPenalty =
        penalty;

      bestAssignment =
        assignment;

    }

  }


  return {

    assignment:
      bestAssignment,

    penalty:
      bestPenalty

  };
}


// ==========================================
// ロールをプレイヤーに付与
// ==========================================

function applyRoles(
  players,
  roleResult
) {

  return players.map(
    player => ({

      ...player,

      assignedRole:
        roleResult.assignment[
          player.id
        ]

    })
  );
}


// ==========================================
// Rating合計
// ==========================================

function getRatingTotal(
  players
) {

  return players.reduce(
    (sum, player) =>
      sum +
      Number(
        player.rating || 1000
      ),
    0
  );
}


// ==========================================
// 順列生成
// ==========================================

function getPermutations(
  array
) {

  if (
    array.length <= 1
  ) {

    return [array];

  }


  const result = [];


  for (
    let i = 0;
    i < array.length;
    i++
  ) {

    const current =
      array[i];


    const remaining =
      array.slice(0, i)
        .concat(
          array.slice(i + 1)
        );


    const permutations =
      getPermutations(
        remaining
      );


    for (
      const permutation
      of permutations
    ) {

      result.push(
        [
          current,
          ...permutation
        ]
      );

    }

  }


  return result;
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
    getRatingTotal(
      blue
    );


  const redTotal =
    getRatingTotal(
      red
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


  displayRoleStats(
    blue,
    red
  );
}


// ==========================================
// プレイヤー表示
// ==========================================

function createTeamPlayerHtml(
  player
) {

  const assignedRole =
    player.assignedRole ||
    "未定";


  const roleClass =
    `role-${assignedRole.toLowerCase()}`;


  return `

    <div class="team-player">

      <div>

        <div class="team-player-name">

          <strong>
            ${escapeHtml(
              assignedRole
            )}
          </strong>

         　

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

        </div>

      </div>

    </div>

  `;
}


// ==========================================
// 希望達成表示
// ==========================================

function displayRoleStats(
  blue,
  red
) {

  const allPlayers =
    [
      ...blue,
      ...red
    ];


  let firstCount = 0;

  let secondCount = 0;

  let otherCount = 0;


  for (
    const player of allPlayers
  ) {

    if (
      player.assignedRole ===
      player.first_role
    ) {

      firstCount++;

    } else if (
      player.assignedRole ===
      player.second_role
    ) {

      secondCount++;

    } else {

      otherCount++;

    }

  }


  const statsText =
    `第1希望 ${firstCount}人`
    +
    ` / 第2希望 ${secondCount}人`
    +
    ` / 希望外 ${otherCount}人`;


  if (
    teamMessage
  ) {

    teamMessage.textContent =
      statsText;

  } else {

    // teamMessageがHTMLにない場合でも
    // コンソールには出す

    console.log(
      statsText
    );

  }
}


// ==========================================
// Discord用コピー
// ==========================================

if (copyButton) {

  copyButton.addEventListener(
    "click",
    async () => {

      if (!currentTeams) {

        return;

      }


      const text =
        createDiscordText(
          currentTeams.blue,
          currentTeams.red
        );


      try {

        await navigator.clipboard.writeText(
          text
        );


        teamMessageIfExists(
          "Discord用にコピーしました！"
        );

      } catch (error) {

        console.error(error);

        alert(
          "コピーできませんでした。"
        );

      }

    }
  );

}


// ==========================================
// Discord文章
// ==========================================

function createDiscordText(
  blue,
  red
) {

  const mode =
    teamMode.value === "chaos"

      ? "ワチャワチャ回"

      : "通常ドラフト";


  const blueText =
    blue
      .map(
        player =>
          `${player.assignedRole}：${player.name}`
      )
      .join("\n");


  const redText =
    red
      .map(
        player =>
          `${player.assignedRole}：${player.name}`
      )
      .join("\n");


  const difference =
    Math.abs(
      getRatingTotal(blue) -
      getRatingTotal(red)
    );


  return `\
🎮 LoL Custom
【${mode}】

🔵 BLUE TEAM
${blueText}

🔴 RED TEAM
${redText}

⚖️ Rating差：${difference}
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
// チームメッセージ
// ==========================================

function teamMessageIfExists(
  text
) {

  if (teamMessage) {

    teamMessage.textContent =
      text;

  }

}


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

// ==========================================
// 勝敗ボタン
// ==========================================

if (blueWinButton) {

  blueWinButton.addEventListener(
    "click",
    async () => {

      await recordMatch("blue");

    }
  );

}


if (redWinButton) {

  redWinButton.addEventListener(
    "click",
    async () => {

      await recordMatch("red");

    }
  );

}


// ==========================================
// 試合結果を保存
// ==========================================

async function recordMatch(winner) {

  if (!currentTeams) {

    alert(
      "先にチーム分けをしてください。"
    );

    return;
  }


  if (
    winner !== "blue" &&
    winner !== "red"
  ) {

    return;

  }


  const blue =
    currentTeams.blue;

  const red =
    currentTeams.red;


  const blueBefore =
    getRatingTotal(blue);

  const redBefore =
    getRatingTotal(red);


  // ==============================
  // 勝率計算
  // ==============================

  const expectedBlue =
    1 /
    (
      1 +
      Math.pow(
        10,
        (
          redBefore -
          blueBefore
        ) / 400
      )
    );


  const expectedRed =
    1 -
    expectedBlue;


  // ==============================
  // K値
  // ==============================

  const K = 32;


  let blueChange;

  let redChange;


  if (
    winner === "blue"
  ) {

    blueChange =
      Math.round(
        K *
        (1 - expectedBlue)
      );

    redChange =
      -blueChange;

  } else {

    redChange =
      Math.round(
        K *
        (1 - expectedRed)
      );

    blueChange =
      -redChange;

  }


  // ==============================
  // プレイヤーごとのRating更新
  // ==============================

  const blueUpdates =
    [];

  const redUpdates =
    [];


  for (
    const player of blue
  ) {

    const oldRating =
      Number(
        player.rating || 1000
      );


    const newRating =
      Math.max(
        1,
        oldRating +
        blueChange
      );


    blueUpdates.push({

      id:
        player.id,

      oldRating,

      newRating

    });

  }


  for (
    const player of red
  ) {

    const oldRating =
      Number(
        player.rating || 1000
      );


    const newRating =
      Math.max(
        1,
        oldRating +
        redChange
      );


    redUpdates.push({

      id:
        player.id,

      oldRating,

      newRating

    });

  }


  // ==============================
  // DB更新
  // ==============================

  for (
    const update of blueUpdates
  ) {

    const {
      error
    } =
      await supabase
        .from("players")
        .update({

          rating:
            update.newRating,

        })
        .eq(
          "id",
          update.id
        );


    if (error) {

      console.error(error);

      alert(
        `Rating更新に失敗しました：${error.message}`
      );

      return;

    }

  }


  for (
    const update of redUpdates
  ) {

    const {
      error
    } =
      await supabase
        .from("players")
        .update({

          rating:
            update.newRating

        })
        .eq(
          "id",
          update.id
        );


    if (error) {

      console.error(error);

      alert(
        `Rating更新に失敗しました：${error.message}`
      );

      return;

    }

  }


  // ==============================
  // 試合履歴保存
  // ==============================

  const {
    error:
      matchError
  } =
    await supabase
      .from("matches")
      .insert({

        blue_player_ids:
          blue.map(
            player =>
              player.id
          ),

        red_player_ids:
          red.map(
            player =>
              player.id
          ),

        winner:

          winner,

        blue_rating_before:
          blueBefore,

        red_rating_before:
          redBefore,

        blue_rating_after:
          blueBefore +
          blueChange * 5,

        red_rating_after:
          redBefore +
          redChange * 5

      });


  if (matchError) {

    console.error(
      matchError
    );

    alert(
      `試合履歴の保存に失敗しました：${matchError.message}`
    );

    return;

  }


  // ==============================
  // 完了表示
  // ==============================

  const winnerText =
    winner === "blue"

      ? "🔵 BLUE TEAM"

      : "🔴 RED TEAM";


  if (matchMessage) {

    matchMessage.innerHTML =
      `
        <strong>
          ${winnerText} 勝利！
        </strong>
        <br>
        Ratingを更新しました。
        <br>
        今回の変動：
        ${winner === "blue"
          ? `BLUE +${blueChange} / RED ${redChange}`
          : `BLUE ${blueChange} / RED +${redChange}`
        }
      `;

  }


  // ボタン無効化
  blueWinButton.disabled =
    true;

  redWinButton.disabled =
    true;


  // 最新Ratingを取得
  await loadPlayers();

  await loadParticipants();


  // チーム結果も更新
  displayTeams(
    await getPlayersByIds(
      blue.map(
        player =>
          player.id
      )
    ),
    await getPlayersByIds(
      red.map(
        player =>
          player.id
      )
    )
  );

}

async function getPlayersByIds(
  ids
) {

  const {
    data,
    error
  } =
    await supabase
      .from("players")
      .select("*")
      .in(
        "id",
        ids
      );


  if (error) {

    console.error(error);

    return [];

  }


  return data || [];

}