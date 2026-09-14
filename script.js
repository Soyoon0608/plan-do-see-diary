// ============================================================
// Plan Do See Diary
// script.js
// ============================================================


// ============================================================
// 1. Supabase
// ============================================================

const SUPABASE_URL =
  "https://ptrsztelwuwrbounfpod.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";

const { createClient } = window.supabase;

const supabaseClient =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ============================================================
// 2. 전역 변수
// ============================================================

let currentUser = null;

let plans = [];
let tasks = [];
let histories = [];

let currentTask = null;


// ============================================================
// 3. DOM
// ============================================================

function $(selector) {
  return document.querySelector(selector);
}


// ============================================================
// 4. HTML escape
// ============================================================

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// 5. 메시지
// ============================================================

function showMessage(
  message,
  type = "success"
) {

  const box = $("#message");

  if (!box) {
    console.log(message);
    return;
  }

  box.textContent = message;

  box.className =
    `message ${type}`;

  setTimeout(() => {

    box.textContent = "";

    box.className =
      "message hidden";

  }, 3000);
}


// ============================================================
// 6. 날짜
// ============================================================

function formatDate(dateString) {

  if (!dateString) {
    return "-";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleDateString(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  );
}


function formatDateTime(dateString) {

  if (!dateString) {
    return "-";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleString(
    "ko-KR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function formatDateTimeForInput(
  dateString
) {

  if (!dateString) {
    return "";
  }

  const date =
    new Date(dateString);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const hour =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minute =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  return (
    `${year}-${month}-${day}` +
    `T${hour}:${minute}`
  );
}


// ============================================================
// 7. 시간 계산
// ============================================================

function calculateMinutes(
  startedAt,
  endedAt
) {

  if (
    !startedAt ||
    !endedAt
  ) {
    return null;
  }

  const start =
    new Date(startedAt);

  const end =
    new Date(endedAt);

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    )
  ) {
    return null;
  }

  const diff =
    Math.round(
      (
        end.getTime() -
        start.getTime()
      ) / 60000
    );

  return diff >= 0
    ? diff
    : null;
}


// ============================================================
// 8. 로그인 확인
// ============================================================

async function checkAuth() {

  try {

    const {
      data: {
        session
      },
      error
    } =
      await supabaseClient
        .auth
        .getSession();

    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      return false;
    }

    if (!session) {

      console.log(
        "로그인 세션이 없습니다."
      );

      window.location.href =
        "login.html";

      return false;
    }

    currentUser =
      session.user;

    console.log(
      "CURRENT USER:",
      currentUser.email,
      currentUser.id
    );

    const userEmail =
      $("#userEmail");

    if (userEmail) {

      userEmail.textContent =
        currentUser.email;
    }

    return true;

  } catch (error) {

    console.error(
      "AUTH CHECK ERROR:",
      error
    );

    return false;
  }
}


// ============================================================
// 9. 로그아웃
// ============================================================

async function logout() {

  const {
    error
  } =
    await supabaseClient
      .auth
      .signOut();

  if (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

    showMessage(
      "로그아웃에 실패했습니다.",
      "error"
    );

    return;
  }

  window.location.href =
    "login.html";
}


// ============================================================
// 10. 전체 데이터 불러오기
// ============================================================

async function loadAll() {

  if (!currentUser) {

    console.error(
      "현재 로그인 사용자가 없습니다."
    );

    return;
  }

  console.log(
    "LOAD START - user_id:",
    currentUser.id
  );


  // ==========================================================
  // PLAN
  // ==========================================================

  const plansResult =
    await supabaseClient
      .from("plans")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (plansResult.error) {

    console.error(
      "PLANS LOAD ERROR:",
      plansResult.error
    );

    plans = [];

  } else {

    plans =
      plansResult.data || [];
  }


  // ==========================================================
  // TASK
  //
  // 중요:
  // tasks에는 changed_at이 없다.
  // 따라서 order("changed_at") 사용하지 않는다.
  // ==========================================================

  const tasksResult =
    await supabaseClient
      .from("tasks")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      );


  if (tasksResult.error) {

    console.error(
      "TASKS LOAD ERROR:",
      tasksResult.error
    );

    tasks = [];

  } else {

    tasks =
      tasksResult.data || [];
  }


  // ==========================================================
  // PLAN HISTORY
  //
  // 실제 컬럼:
  // changed_at
  //
  // changed_at_at 아님
  // ==========================================================

  const historyResult =
    await supabaseClient
      .from("plan_history")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "changed_at",
        {
          ascending: false
        }
      );


  if (historyResult.error) {

    console.error(
      "HISTORY LOAD ERROR:",
      historyResult.error
    );

    histories = [];

  } else {

    histories =
      historyResult.data || [];
  }


  console.log(
    "LOAD COMPLETE:",
    {
      plans: plans.length,
      tasks: tasks.length,
      histories: histories.length
    }
  );


  renderAll();
}


// ============================================================
// 11. 전체 렌더링
// ============================================================

function renderAll() {

  renderPlans();

  renderHistory();

  updateCounts();
}


// ============================================================
// 12. 카운트
// ============================================================

function updateCounts() {

  const totalPlans =
    $("#totalPlans");

  if (totalPlans) {

    totalPlans.textContent =
      plans.length;
  }


  const executionCount =
    tasks.filter(task => {

      return (
        task.started_at ||
        task.ended_at ||
        task.actual_minutes !== null &&
        task.actual_minutes !== undefined ||
        task.blocked_reason
      );

    }).length;


  const historyCount =
    $("#historyCount");

  if (historyCount) {

    historyCount.textContent =
      `${executionCount}건`;
  }
}


// ============================================================
// 13. PLAN 렌더링
// ============================================================

function renderPlans() {

  const planList =
    $("#planList");

  if (!planList) {
    return;
  }


  if (plans.length === 0) {

    planList.innerHTML = `
      <div class="empty">
        아직 등록된 계획이 없습니다.
      </div>
    `;

    return;
  }


  planList.innerHTML =
    plans.map(plan => {

      const planTasks =
        tasks.filter(task => {

          return (
            Number(task.plan_id) ===
            Number(plan.id)
          );

        });


      const completedCount =
        planTasks.filter(
          task => task.completed
        ).length;


      const totalCount =
        planTasks.length;


      return `
        <div class="plan-item">

          <div class="plan-main">

            <div class="plan-title">
              ${escapeHtml(
                plan.plan_name
              )}
            </div>

            ${
              plan.success_criteria
                ? `
                  <div class="plan-desc">
                    ${escapeHtml(
                      plan.success_criteria
                    )}
                  </div>
                `
                : ""
            }

            <div class="plan-meta">

              <span>
                ${formatDate(
                  plan.start_date
                )}
                ~
                ${formatDate(
                  plan.end_date
                )}
              </span>

              <span class="badge">
                ${completedCount}/${totalCount}
              </span>

              ${
                plan.estimated_hours !==
                  null &&
                plan.estimated_hours !==
                  undefined
                  ? `
                    <span>
                      예상
                      ${escapeHtml(
                        plan.estimated_hours
                      )}시간
                    </span>
                  `
                  : ""
              }

            </div>

          </div>


          <div class="plan-actions">

            <button
              type="button"
              class="mini-btn danger"
              onclick="deletePlan(${plan.id})"
            >
              계획 삭제
            </button>

          </div>


          <div class="task-box">

            <div class="task-box-title">
              할 일 목록
            </div>


            ${
              planTasks.length === 0

                ? `
                  <div class="empty">
                    등록된 할 일이 없습니다.
                  </div>
                `

                : planTasks
                    .map(task =>
                      renderTask(task)
                    )
                    .join("")
            }


            <div class="task-add">

              <input
                type="text"
                id="task-title-${plan.id}"
                placeholder="할 일을 입력하세요"
              />

              <input
                type="text"
                id="task-memo-${plan.id}"
                placeholder="메모"
              />

              <button
                type="button"
                class="mini-btn primary"
                onclick="createTask(${plan.id})"
              >
                할 일 추가
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");
}


// ============================================================
// 14. TASK 렌더링
// ============================================================

function renderTask(task) {

  return `
    <div class="task-row">

      <div class="task-left">

        <input
          type="checkbox"
          class="task-check"
          ${
            task.completed
              ? "checked"
              : ""
          }
          onchange="
            toggleTask(
              ${task.id},
              this.checked
            )
          "
        >

        <div>

          <div
            class="
              task-name
              ${
                task.completed
                  ? "done"
                  : ""
              }
            "
          >
            ${escapeHtml(
              task.title
            )}
          </div>


          ${
            task.memo

              ? `
                <div class="plan-desc">
                  ${escapeHtml(
                    task.memo
                  )}
                </div>
              `

              : ""
          }


          ${
            task.actual_minutes !==
              null &&
            task.actual_minutes !==
              undefined

              ? `
                <div class="plan-desc">
                  실제 소요시간:
                  ${escapeHtml(
                    task.actual_minutes
                  )}분
                </div>
              `

              : ""
          }


          ${
            task.blocked_reason

              ? `
                <div class="blocked">
                  막힌 부분:
                  ${escapeHtml(
                    task.blocked_reason
                  )}
                </div>
              `

              : ""
          }

        </div>

      </div>


      <div class="task-actions">

        <button
          type="button"
          class="mini-btn primary"
          onclick="
            openExecutionModal(
              ${task.id}
            )
          "
        >
          실행 기록
        </button>


        <button
          type="button"
          class="mini-btn danger"
          onclick="
            deleteTask(
              ${task.id}
            )
          "
        >
          삭제
        </button>

      </div>

    </div>
  `;
}


// ============================================================
// 15. PLAN 생성
// ============================================================

async function createPlan() {

  if (!currentUser) {

    showMessage(
      "로그인 정보를 확인할 수 없습니다.",
      "error"
    );

    return;
  }


  // HTML의 실제 ID와 맞춤
  const planName =
    $("#planTitle")
      ?.value
      .trim() || "";


  const planDescription =
    $("#planDescription")
      ?.value
      .trim() || "";


  const startDate =
    $("#startDate")
      ?.value || "";


  const endDate =
    $("#endDate")
      ?.value || "";


  const estimatedHours =
    $("#estimatedHours")
      ?.value || "";


  if (!planName) {

    showMessage(
      "계획 제목을 입력해주세요.",
      "error"
    );

    return;
  }


  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {

    showMessage(
      "종료일은 시작일보다 빠를 수 없습니다.",
      "error"
    );

    return;
  }


  const payload = {

    plan_name:
      planName,

    start_date:
      startDate || null,

    end_date:
      endDate || null,

    success_criteria:
      planDescription || null,

    estimated_hours:
      estimatedHours !== ""
        ? Number(estimatedHours)
        : null,

    user_id:
      currentUser.id
  };


  console.log(
    "CREATE PLAN:",
    payload
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from("plans")
      .insert(payload)
      .select()
      .single();


  if (error) {

    console.error(
      "PLAN INSERT ERROR:",
      error
    );

    showMessage(
      "계획 저장에 실패했습니다.",
      "error"
    );

    return;
  }


  console.log(
    "PLAN CREATED:",
    data
  );


  // ==========================================================
  // 계획 생성 기록
  // plan_history 실제 컬럼만 사용
  // ==========================================================

  const historyPayload = {

    plan_id:
      data.id,

    plan_name:
      data.plan_name,

    start_date:
      data.start_date,

    end_date:
      data.end_date,

    priority:
      data.priority ||
      null,

    success_criteria:
      data.success_criteria ||
      null,

    estimated_hours:
      data.estimated_hours,

    changed_at:
      new Date().toISOString(),

    user_id:
      currentUser.id
  };


  const {
    error: historyError
  } =
    await supabaseClient
      .from("plan_history")
      .insert(
        historyPayload
      );


  if (historyError) {

    console.warn(
      "PLAN HISTORY INSERT ERROR:",
      historyError
    );

  }


  // ==========================================================
  // 입력 초기화
  // ==========================================================

  if ($("#planTitle")) {
    $("#planTitle").value = "";
  }

  if ($("#planDescription")) {
    $("#planDescription").value = "";
  }

  if ($("#startDate")) {
    $("#startDate").value = "";
  }

  if ($("#endDate")) {
    $("#endDate").value = "";
  }

  if ($("#estimatedHours")) {
    $("#estimatedHours").value = "";
  }


  showMessage(
    "계획이 저장되었습니다."
  );


  await loadAll();
}


// ============================================================
// 16. TASK 생성
// ============================================================

async function createTask(planId) {

  if (!currentUser) {

    showMessage(
      "로그인 정보를 확인할 수 없습니다.",
      "error"
    );

    return;
  }


  const titleInput =
    document.querySelector(
      `#task-title-${planId}`
    );


  const memoInput =
    document.querySelector(
      `#task-memo-${planId}`
    );


  const title =
    titleInput
      ?.value
      .trim() || "";


  const memo =
    memoInput
      ?.value
      .trim() || "";


  if (!title) {

    showMessage(
      "할 일을 입력해주세요.",
      "error"
    );

    return;
  }


  const payload = {

    plan_id:
      Number(planId),

    title:
      title,

    memo:
      memo || null,

    completed:
      false,

    user_id:
      currentUser.id
  };


  console.log(
    "CREATE TASK:",
    payload
  );


  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .insert(payload);


  if (error) {

    console.error(
      "TASK INSERT ERROR:",
      error
    );

    showMessage(
      "할 일 저장에 실패했습니다.",
      "error"
    );

    return;
  }


  showMessage(
    "할 일이 추가되었습니다."
  );


  await loadAll();
}


// ============================================================
// 17. TASK 완료 상태
// ============================================================

async function toggleTask(
  taskId,
  completed
) {

  if (!currentUser) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .update({
        completed
      })
      .eq(
        "id",
        taskId
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "TASK UPDATE ERROR:",
      error
    );

    showMessage(
      "완료 상태 변경에 실패했습니다.",
      "error"
    );

    return;
  }


  await loadAll();
}


// ============================================================
// 18. 실행 모달 열기
// ============================================================

function openExecutionModal(
  taskId
) {

  currentTask =
    tasks.find(
      task =>
        Number(task.id) ===
        Number(taskId)
    );


  if (!currentTask) {

    showMessage(
      "할 일을 찾을 수 없습니다.",
      "error"
    );

    return;
  }


  // HTML의 실제 ID:
  // executeModal
  const modal =
    $("#executeModal");


  if (!modal) {

    console.error(
      "#executeModal을 찾을 수 없습니다."
    );

    return;
  }


  // HTML의 실제 ID:
  // executeTitle
  const title =
    $("#executeTitle");


  if (title) {

    title.textContent =
      currentTask.title;
  }


  const startedAt =
    $("#startedAt");


  if (startedAt) {

    startedAt.value =
      currentTask.started_at
        ? formatDateTimeForInput(
            currentTask.started_at
          )
        : "";
  }


  const endedAt =
    $("#endedAt");


  if (endedAt) {

    endedAt.value =
      currentTask.ended_at
        ? formatDateTimeForInput(
            currentTask.ended_at
          )
        : "";
  }


  const actualMinutes =
    $("#actualMinutes");


  if (actualMinutes) {

    actualMinutes.value =
      currentTask.actual_minutes ??
      "";
  }


  const blockedReason =
    $("#blockedReason");


  if (blockedReason) {

    blockedReason.value =
      currentTask.blocked_reason ||
      "";
  }


  modal.classList.remove(
    "hidden"
  );
}


// ============================================================
// 19. 실행 모달 닫기
// ============================================================

function closeExecutionModal() {

  const modal =
    $("#executeModal");


  if (modal) {

    modal.classList.add(
      "hidden"
    );
  }


  currentTask = null;
}


// ============================================================
// 20. 실행 기록 저장
// ============================================================

async function saveExecution() {

  if (!currentTask) {

    showMessage(
      "실행할 할 일을 선택해주세요.",
      "error"
    );

    return;
  }


  const startedAt =
    $("#startedAt")
      ?.value || "";


  const endedAt =
    $("#endedAt")
      ?.value || "";


  const actualMinutesInput =
    $("#actualMinutes")
      ?.value || "";


  const blockedReason =
    $("#blockedReason")
      ?.value
      .trim() || "";


  let actualMinutes =
    null;


  if (
    actualMinutesInput !== ""
  ) {

    actualMinutes =
      Number(
        actualMinutesInput
      );


    if (
      Number.isNaN(
        actualMinutes
      ) ||
      actualMinutes < 0
    ) {

      showMessage(
        "실제 소요시간을 올바르게 입력해주세요.",
        "error"
      );

      return;
    }
  }


  // 시작/종료 시간이 있으면 자동 계산

  if (
    actualMinutes === null &&
    startedAt &&
    endedAt
  ) {

    actualMinutes =
      calculateMinutes(
        startedAt,
        endedAt
      );
  }


  const payload = {

    started_at:
      startedAt
        ? new Date(
            startedAt
          ).toISOString()
        : null,

    ended_at:
      endedAt
        ? new Date(
            endedAt
          ).toISOString()
        : null,

    actual_minutes:
      actualMinutes,

    blocked_reason:
      blockedReason ||
      null,

    completed:
      true
  };


  console.log(
    "SAVE EXECUTION:",
    payload
  );


  // ==========================================================
  // 실행 기록은 tasks에 저장
  //
  // plan_history에는 실행 관련 컬럼이 없기 때문에
  // 절대로 task_id/title/started_at 등을 넣지 않는다.
  // ==========================================================

  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .update(payload)
      .eq(
        "id",
        currentTask.id
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "EXECUTION SAVE ERROR:",
      error
    );

    showMessage(
      "실행 기록 저장에 실패했습니다.",
      "error"
    );

    return;
  }


  showMessage(
    "실행 기록이 저장되었습니다."
  );


  closeExecutionModal();


  await loadAll();
}


// ============================================================
// 21. 실행 기록 렌더링
// ============================================================

function renderHistory() {

  const historyList =
    $("#historyList");


  if (!historyList) {
    return;
  }


  // 실행 기록은 tasks에서 가져온다.

  const executionTasks =
    tasks
      .filter(task => {

        return (
          task.started_at ||
          task.ended_at ||
          task.actual_minutes !== null &&
          task.actual_minutes !== undefined ||
          task.blocked_reason
        );

      })
      .sort((a, b) => {

        const aTime =
          a.started_at
            ? new Date(
                a.started_at
              ).getTime()
            : 0;

        const bTime =
          b.started_at
            ? new Date(
                b.started_at
              ).getTime()
            : 0;

        return bTime - aTime;
      });


  if (
    executionTasks.length === 0
  ) {

    historyList.innerHTML = `
      <div class="empty">
        아직 실행 기록이 없습니다.
      </div>
    `;

    return;
  }


  historyList.innerHTML =
    executionTasks
      .map(task => {

        const plan =
          plans.find(
            p =>
              Number(p.id) ===
              Number(task.plan_id)
          );


        return `
          <div class="history-item">

            <div class="history-time">
              ${
                task.started_at
                  ? formatDateTime(
                      task.started_at
                    )
                  : "실행 시간 미기록"
              }
            </div>


            <div class="history-title">
              ${escapeHtml(
                task.title
              )}
            </div>


            ${
              plan
                ? `
                  <div class="plan-desc">
                    계획:
                    ${escapeHtml(
                      plan.plan_name
                    )}
                  </div>
                `
                : ""
            }


            ${
              task.actual_minutes !==
                null &&
              task.actual_minutes !==
                undefined

                ? `
                  <div class="plan-desc">
                    실제 소요시간:
                    ${escapeHtml(
                      task.actual_minutes
                    )}분
                  </div>
                `

                : ""
            }


            ${
              task.ended_at

                ? `
                  <div class="plan-desc">
                    종료:
                    ${formatDateTime(
                      task.ended_at
                    )}
                  </div>
                `

                : ""
            }


            ${
              task.blocked_reason

                ? `
                  <div class="blocked">
                    막힌 부분:
                    ${escapeHtml(
                      task.blocked_reason
                    )}
                  </div>
                `

                : ""
            }

          </div>
        `;

      })
      .join("");
}


// ============================================================
// 22. 계획 삭제
// ============================================================

async function deletePlan(
  planId
) {

  const confirmed =
    confirm(
      "이 계획과 연결된 할 일을 삭제하시겠습니까?"
    );


  if (!confirmed) {
    return;
  }


  // 연결된 TASK 삭제

  const {
    error: taskDeleteError
  } =
    await supabaseClient
      .from("tasks")
      .delete()
      .eq(
        "plan_id",
        planId
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (taskDeleteError) {

    console.error(
      "PLAN TASK DELETE ERROR:",
      taskDeleteError
    );

    showMessage(
      "연결된 할 일 삭제에 실패했습니다.",
      "error"
    );

    return;
  }


  // 연결된 HISTORY 삭제

  const {
    error: historyDeleteError
  } =
    await supabaseClient
      .from("plan_history")
      .delete()
      .eq(
        "plan_id",
        planId
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (historyDeleteError) {

    console.warn(
      "PLAN HISTORY DELETE ERROR:",
      historyDeleteError
    );
  }


  // PLAN 삭제

  const {
    error
  } =
    await supabaseClient
      .from("plans")
      .delete()
      .eq(
        "id",
        planId
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "PLAN DELETE ERROR:",
      error
    );

    showMessage(
      "계획 삭제에 실패했습니다.",
      "error"
    );

    return;
  }


  showMessage(
    "계획이 삭제되었습니다."
  );


  await loadAll();
}


// ============================================================
// 23. TASK 삭제
// ============================================================

async function deleteTask(
  taskId
) {

  const confirmed =
    confirm(
      "이 할 일을 삭제하시겠습니까?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .delete()
      .eq(
        "id",
        taskId
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "TASK DELETE ERROR:",
      error
    );

    showMessage(
      "할 일 삭제에 실패했습니다.",
      "error"
    );

    return;
  }


  showMessage(
    "할 일이 삭제되었습니다."
  );


  await loadAll();
}


// ============================================================
// 24. 새로고침
// ============================================================

async function refreshData() {

  const button =
    $("#refreshBtn");

  if (button) {

    button.disabled = true;

    button.textContent =
      "불러오는 중...";
  }


  try {

    await loadAll();

    showMessage(
      "데이터를 새로 불러왔습니다."
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "새로고침";
    }
  }
}


// ============================================================
// 25. 이벤트 연결
// ============================================================

function bindEvents() {

  // ----------------------------------------------------------
  // 로그아웃
  // ----------------------------------------------------------

  const logoutBtn =
    $("#logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logout
    );
  }


  // ----------------------------------------------------------
  // 새로고침
  // ----------------------------------------------------------

  const refreshBtn =
    $("#refreshBtn");

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      refreshData
    );
  }


  // ----------------------------------------------------------
  // PLAN 저장
  // ----------------------------------------------------------

  const planForm =
    $("#planForm");

  if (planForm) {

    planForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        await createPlan();
      }
    );
  }


  // ----------------------------------------------------------
  // TASK Modal 열기
  // ----------------------------------------------------------

  const addTaskBtn =
    $("#addTaskBtn");

  if (addTaskBtn) {

    addTaskBtn.addEventListener(
      "click",
      openTaskModal
    );
  }


  // ----------------------------------------------------------
  // TASK Form
  // ----------------------------------------------------------

  const taskForm =
    $("#taskForm");

  if (taskForm) {

    taskForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        await createTaskFromModal();
      }
    );
  }


  // ----------------------------------------------------------
  // EXECUTION Form
  // ----------------------------------------------------------

  const executeForm =
    $("#executeForm");

  if (executeForm) {

    executeForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();

        await saveExecution();
      }
    );
  }


  // ----------------------------------------------------------
  // TASK Modal 닫기
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      "[data-close-task]"
    )
    .forEach(element => {

      element.addEventListener(
        "click",
        closeTaskModal
      );

    });


  // ----------------------------------------------------------
  // EXECUTION Modal 닫기
  // ----------------------------------------------------------

  document
    .querySelectorAll(
      "[data-close-execute]"
    )
    .forEach(element => {

      element.addEventListener(
        "click",
        closeExecutionModal
      );

    });
}


// ============================================================
// 26. TASK Modal
// ============================================================

function openTaskModal() {

  const modal =
    $("#taskModal");

  if (!modal) {
    return;
  }


  const select =
    $("#taskPlanId");

  if (!select) {
    return;
  }


  if (plans.length === 0) {

    showMessage(
      "먼저 계획을 하나 만들어주세요.",
      "error"
    );

    return;
  }


  select.innerHTML =
    plans
      .map(plan => {

        return `
          <option value="${plan.id}">
            ${escapeHtml(
              plan.plan_name
            )}
          </option>
        `;

      })
      .join("");


  const title =
    $("#taskTitle");

  const memo =
    $("#taskMemo");


  if (title) {
    title.value = "";
  }

  if (memo) {
    memo.value = "";
  }


  modal.classList.remove(
    "hidden"
  );
}


function closeTaskModal() {

  const modal =
    $("#taskModal");

  if (modal) {

    modal.classList.add(
      "hidden"
    );
  }
}


// ============================================================
// 27. TASK Modal에서 생성
// ============================================================

async function createTaskFromModal() {

  const planId =
    $("#taskPlanId")
      ?.value || "";


  const title =
    $("#taskTitle")
      ?.value
      .trim() || "";


  const memo =
    $("#taskMemo")
      ?.value
      .trim() || "";


  if (!planId) {

    showMessage(
      "계획을 선택해주세요.",
      "error"
    );

    return;
  }


  if (!title) {

    showMessage(
      "할 일을 입력해주세요.",
      "error"
    );

    return;
  }


  const payload = {

    plan_id:
      Number(planId),

    title:
      title,

    memo:
      memo || null,

    completed:
      false,

    user_id:
      currentUser.id
  };


  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .insert(payload);


  if (error) {

    console.error(
      "TASK MODAL INSERT ERROR:",
      error
    );

    showMessage(
      "할 일 저장에 실패했습니다.",
      "error"
    );

    return;
  }


  closeTaskModal();


  showMessage(
    "할 일이 추가되었습니다."
  );


  await loadAll();
}


// ============================================================
// 28. Auth 이벤트
// ============================================================

supabaseClient
  .auth
  .onAuthStateChange(
    (event, session) => {

      console.log(
        "AUTH EVENT:",
        event
      );


      if (
        event ===
        "SIGNED_OUT"
      ) {

        currentUser = null;

        window.location.href =
          "login.html";
      }
    }
  );


// ============================================================
// 29. 시작
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "Plan Do See Diary 시작"
    );


    const authenticated =
      await checkAuth();


    if (!authenticated) {
      return;
    }


    bindEvents();


    await loadAll();
  }
);
