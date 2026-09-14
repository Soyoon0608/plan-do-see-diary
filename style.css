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


// ============================================================
// 3. DOM
// ============================================================

function $(selector) {
  return document.querySelector(selector);
}


// ============================================================
// 4. HTML escape
// XSS 방지
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


// ============================================================
// 7. 로그인 확인
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

      window.location.href =
        "login.html";

      return false;
    }

    currentUser =
      session.user;

    const userEmail =
      $("#userEmail");

    if (userEmail) {

      userEmail.textContent =
        currentUser.email;
    }

    console.log(
      "CURRENT USER:",
      currentUser.email,
      currentUser.id
    );

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
// 8. 로그아웃
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
// 9. 전체 데이터 불러오기
// ============================================================

async function loadAll() {

  if (!currentUser) {
    return;
  }


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
  // ==========================================================

  const tasksResult =
    await supabaseClient
      .from("tasks")
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
// 10. 전체 렌더링
// ============================================================

function renderAll() {

  renderPlans();

  renderHistory();

  updateCounts();
}


// ============================================================
// 11. 카운트
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
        (
          task.actual_minutes !== null &&
          task.actual_minutes !== undefined
        ) ||
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
// 12. PLAN 렌더링
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
          task =>
            task.is_completed === true
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
                placeholder="태그 또는 메모"
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
// 13. TASK 렌더링
// ============================================================

function renderTask(task) {

  const hasExecution =
    !!(
      task.started_at ||
      task.ended_at ||
      (
        task.actual_minutes !== null &&
        task.actual_minutes !== undefined
      ) ||
      task.blocked_reason
    );


  return `
    <div class="task-row">

      <div class="task-left">

        <input
          type="checkbox"
          class="task-check"
          ${
            task.is_completed
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
                task.is_completed
                  ? "done"
                  : ""
              }
            "
          >
            ${escapeHtml(
              task.task_name
            )}
          </div>


          ${
            task.due_date
              ? `
                <div class="plan-desc">
                  마감일:
                  ${formatDate(
                    task.due_date
                  )}
                </div>
              `
              : ""
          }


          ${
            task.priority
              ? `
                <div class="plan-desc">
                  우선순위:
                  ${escapeHtml(
                    task.priority
                  )}
                </div>
              `
              : ""
          }


          ${
            task.tag
              ? `
                <div class="plan-desc">
                  태그:
                  ${escapeHtml(
                    task.tag
                  )}
                </div>
              `
              : ""
          }


          ${
            task.estimated_hours !==
              null &&
            task.estimated_hours !==
              undefined
              ? `
                <div class="plan-desc">
                  예상 시간:
                  ${escapeHtml(
                    task.estimated_hours
                  )}시간
                </div>
              `
              : ""
          }


          ${
            hasExecution
              ? `
                <div class="plan-desc">
                  ✓ 실행 기록이 저장되었습니다.
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
            openExecuteModal(
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
// 14. PLAN 생성
// ============================================================

async function createPlan() {

  if (!currentUser) {
    return;
  }


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
      data.priority || null,

    success_criteria:
      data.success_criteria || null,

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
      "HISTORY INSERT ERROR:",
      historyError
    );
  }


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
// 15. TASK 생성
// ============================================================

async function createTask(planId) {

  if (!currentUser) {
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

    task_name:
      title,

    tag:
      memo || null,

    is_completed:
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
// 16. TASK 완료 상태
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
        is_completed:
          completed,
        updated_at:
          new Date().toISOString()
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
// 17. 계획 삭제
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


  const {
    error: taskError
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


  if (taskError) {

    console.error(
      "TASK DELETE ERROR:",
      taskError
    );

    showMessage(
      "연결된 할 일 삭제에 실패했습니다.",
      "error"
    );

    return;
  }


  const {
    error: historyError
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


  if (historyError) {

    console.warn(
      "HISTORY DELETE ERROR:",
      historyError
    );
  }


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
// 18. TASK 삭제
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
// 19. 새로고침
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
// 20. TASK Modal
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
// 21. TASK Modal 생성
// ============================================================

async function createTaskFromModal() {

  if (!currentUser) {
    return;
  }


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

    task_name:
      title,

    tag:
      memo || null,

    is_completed:
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
// 22. 실행 기록 Modal
// ============================================================

function openExecuteModal(taskId) {

  const task =
    tasks.find(
      item =>
        Number(item.id) ===
        Number(taskId)
    );


  if (!task) {

    showMessage(
      "할 일을 찾을 수 없습니다.",
      "error"
    );

    return;
  }


  const modal =
    $("#executeModal");

  if (!modal) {

    showMessage(
      "실행 기록 창을 찾을 수 없습니다.",
      "error"
    );

    return;
  }


  const executeTaskId =
    $("#executeTaskId");

  if (executeTaskId) {

    executeTaskId.value =
      task.id;
  }


  const executeTitle =
    $("#executeTitle");

  if (executeTitle) {

    executeTitle.textContent =
      task.task_name;
  }


  const startedAt =
    $("#startedAt");

  const endedAt =
    $("#endedAt");

  const actualMinutes =
    $("#actualMinutes");

  const blockedReason =
    $("#blockedReason");


  if (startedAt) {

    startedAt.value =
      task.started_at
        ? toDateTimeLocal(
            task.started_at
          )
        : "";
  }


  if (endedAt) {

    endedAt.value =
      task.ended_at
        ? toDateTimeLocal(
            task.ended_at
          )
        : "";
  }


  if (actualMinutes) {

    actualMinutes.value =
      task.actual_minutes ??
      "";
  }


  if (blockedReason) {

    blockedReason.value =
      task.blocked_reason ??
      "";
  }


  modal.classList.remove(
    "hidden"
  );
}


function closeExecuteModal() {

  const modal =
    $("#executeModal");

  if (modal) {

    modal.classList.add(
      "hidden"
    );
  }
}


function toDateTimeLocal(
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


  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");


  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");


  return `${year}-${month}-${day}T${hours}:${minutes}`;
}


// ============================================================
// 23. 실행 기록 저장
// ============================================================

async function saveExecution() {

  if (!currentUser) {
    return;
  }


  const taskId =
    $("#executeTaskId")
      ?.value || "";


  if (!taskId) {

    showMessage(
      "실행 기록 대상이 없습니다.",
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


  const actualMinutesValue =
    $("#actualMinutes")
      ?.value || "";


  const blockedReason =
    $("#blockedReason")
      ?.value
      .trim() || "";


  if (
    startedAt &&
    endedAt &&
    new Date(startedAt) >
      new Date(endedAt)
  ) {

    showMessage(
      "종료 시간은 시작 시간보다 빠를 수 없습니다.",
      "error"
    );

    return;
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
      actualMinutesValue !== ""
        ? Number(
            actualMinutesValue
          )
        : null,

    blocked_reason:
      blockedReason || null,

    updated_at:
      new Date().toISOString()
  };


  if (
    actualMinutesValue !== "" &&
    (
      Number.isNaN(
        Number(
          actualMinutesValue
        )
      ) ||
      Number(
        actualMinutesValue
      ) < 0
    )
  ) {

    showMessage(
      "실제 소요 시간은 0 이상의 숫자로 입력해주세요.",
      "error"
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .update(payload)
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
      "EXECUTION SAVE ERROR:",
      error
    );

    showMessage(
      "실행 기록 저장에 실패했습니다.",
      "error"
    );

    return;
  }


  closeExecuteModal();


  showMessage(
    "실행 기록이 저장되었습니다."
  );


  await loadAll();
}


// ============================================================
// 24. SEE 렌더링
// ============================================================

function renderHistory() {

  const historyList =
    $("#historyList");

  if (!historyList) {
    return;
  }


  const executionTasks =
    tasks
      .filter(task => {

        return (
          task.started_at ||
          task.ended_at ||
          (
            task.actual_minutes !== null &&
            task.actual_minutes !== undefined
          ) ||
          task.blocked_reason
        );

      })
      .sort(
        (a, b) => {

          const dateA =
            new Date(
              a.updated_at ||
              a.created_at
            ).getTime();

          const dateB =
            new Date(
              b.updated_at ||
              b.created_at
            ).getTime();

          return dateB - dateA;
        }
      );


  const planHistoryItems =
    histories || [];


  if (
    executionTasks.length === 0 &&
    planHistoryItems.length === 0
  ) {

    historyList.innerHTML = `
      <div class="empty">
        아직 실행 기록이 없습니다.
      </div>
    `;

    return;
  }


  const executionHtml =
    executionTasks
      .map(task => {

        return `
          <div class="history-item">

            <div class="history-time">
              ${
                task.updated_at
                  ? formatDateTime(
                      task.updated_at
                    )
                  : "-"
              }
            </div>


            <div class="history-title">
              ${escapeHtml(
                task.task_name
              )}
            </div>


            ${
              task.started_at
                ? `
                  <div class="plan-desc">
                    시작:
                    ${formatDateTime(
                      task.started_at
                    )}
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
              task.actual_minutes !==
                null &&
              task.actual_minutes !==
                undefined
                ? `
                  <div class="plan-desc">
                    실제 소요 시간:
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
                  <div class="plan-desc blocked">
                    막힌 이유:
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


  const planHistoryHtml =
    planHistoryItems
      .map(history => {

        return `
          <div class="history-item">

            <div class="history-time">
              계획 기록 ·
              ${formatDateTime(
                history.changed_at
              )}
            </div>


            <div class="history-title">
              ${escapeHtml(
                history.plan_name
              )}
            </div>


            ${
              history.success_criteria
                ? `
                  <div class="plan-desc">
                    ${escapeHtml(
                      history.success_criteria
                    )}
                  </div>
                `
                : ""
            }

          </div>
        `;

      })
      .join("");


  historyList.innerHTML =
    executionHtml +
    planHistoryHtml;
}


// ============================================================
// 25. 이벤트 연결
// ============================================================

function bindEvents() {


  // 로그아웃

  const logoutBtn =
    $("#logoutBtn");

  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logout
    );
  }


  // 새로고침

  const refreshBtn =
    $("#refreshBtn");

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      refreshData
    );
  }


  // 계획 저장

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


  // 할 일 추가 모달

  const addTaskBtn =
    $("#addTaskBtn");

  if (addTaskBtn) {

    addTaskBtn.addEventListener(
      "click",
      openTaskModal
    );
  }


  // 할 일 모달 저장

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


  // 할 일 모달 닫기

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


  // 실행 기록 저장

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


  // 실행 기록 모달 닫기

  document
    .querySelectorAll(
      "[data-close-execute]"
    )
    .forEach(element => {

      element.addEventListener(
        "click",
        closeExecuteModal
      );

    });
}


// ============================================================
// 26. Auth 이벤트
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
// 27. 시작
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
