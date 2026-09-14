/* =========================================================
   Plan · Do · See Diary
   Supabase + Authentication
   ========================================================= */


/* =========================================================
   Supabase 설정
   ========================================================= */

const SUPABASE_URL =
  "https://ptrsztelwuwrbounfpod.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";

const hasPlaceholderKey =
  !SUPABASE_KEY ||
  SUPABASE_KEY.includes("여기에_");

const { createClient } = window.supabase;

const supabaseClient =
  createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   전역 변수
   ========================================================= */

let plans = [];
let tasks = [];
let histories = [];

let currentTask = null;
let currentUser = null;


/* =========================================================
   DOM 선택
   ========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   로그인 보호
   ========================================================= */

async function requireLogin() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      window.location.href =
        "login.html";

      return false;
    }


    if (
      !data ||
      !data.session
    ) {

      window.location.href =
        "login.html";

      return false;
    }


    currentUser =
      data.session.user;

    return true;

  } catch (error) {

    console.error(
      "AUTH CHECK ERROR:",
      error
    );

    window.location.href =
      "login.html";

    return false;
  }

}


/* =========================================================
   현재 로그인 사용자 표시
   ========================================================= */

async function loadCurrentUser() {

  const {
    data,
    error
  } =
    await supabaseClient.auth.getUser();


  if (error) {

    console.error(
      "USER ERROR:",
      error
    );

    return;
  }


  const user =
    data?.user;


  if (user) {

    currentUser =
      user;

  }


  const userEmail =
    $("#userEmail");


  if (
    userEmail &&
    user
  ) {

    userEmail.textContent =
      user.email ||
      "로그인 사용자";

  }

}


/* =========================================================
   로그아웃
   ========================================================= */

async function logout() {

  const confirmed =
    confirm(
      "로그아웃하시겠습니까?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await supabaseClient.auth.signOut();


  if (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

    showMessage(
      "로그아웃에 실패했습니다: " +
      error.message,
      "error"
    );

    return;
  }


  currentUser =
    null;


  window.location.href =
    "login.html";

}


/* =========================================================
   페이지 시작
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /* Publishable Key 확인 */

    if (hasPlaceholderKey) {

      showMessage(
        "Supabase Publishable key가 설정되지 않았습니다.",
        "error"
      );

      return;
    }


    /* 로그인 확인 */

    const loggedIn =
      await requireLogin();


    if (!loggedIn) {
      return;
    }


    /* 현재 사용자 */

    await loadCurrentUser();


    /* 기본 날짜 */

    setDefaultDates();


    /* 이벤트 연결 */

    bindEvents();


    /* 데이터 불러오기 */

    await loadAll();

  }
);


/* =========================================================
   이벤트 연결
   ========================================================= */

function bindEvents() {

  const planForm =
    $("#planForm");

  const taskForm =
    $("#taskForm");

  const executeForm =
    $("#executeForm");

  const refreshBtn =
    $("#refreshBtn");

  const logoutBtn =
    $("#logoutBtn");

  const addTaskBtn =
    $("#addTaskBtn");


  if (planForm) {

    planForm.addEventListener(
      "submit",
      createPlan
    );

  }


  if (taskForm) {

    taskForm.addEventListener(
      "submit",
      createTask
    );

  }


  if (executeForm) {

    executeForm.addEventListener(
      "submit",
      saveExecution
    );

  }


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      loadAll
    );

  }


  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      logout
    );

  }


  if (addTaskBtn) {

    addTaskBtn.addEventListener(
      "click",
      openTaskModal
    );

  }


  /* 동적으로 생성되는 버튼 */

  document.addEventListener(
    "click",
    (event) => {


      /* Task Modal 닫기 */

      if (
        event.target.closest(
          "[data-close-task]"
        )
      ) {

        closeTaskModal();

      }


      /* Execute Modal 닫기 */

      if (
        event.target.closest(
          "[data-close-execute]"
        )
      ) {

        closeExecuteModal();

      }


      /* 실행 기록 */

      const executeButton =
        event.target.closest(
          "[data-execute]"
        );


      if (executeButton) {

        openExecuteModal(
          executeButton.dataset.execute
        );

      }


      /* Task 삭제 */

      const deleteTaskButton =
        event.target.closest(
          "[data-delete-task]"
        );


      if (deleteTaskButton) {

        deleteTask(
          deleteTaskButton.dataset.deleteTask
        );

      }


      /* Plan 삭제 */

      const deletePlanButton =
        event.target.closest(
          "[data-delete-plan]"
        );


      if (deletePlanButton) {

        deletePlan(
          deletePlanButton.dataset.deletePlan
        );

      }


      /* 완료 체크 */

      const completeCheckbox =
        event.target.closest(
          "[data-complete]"
        );


      if (completeCheckbox) {

        toggleComplete(
          completeCheckbox.dataset.complete,
          completeCheckbox.checked
        );

      }

    }
  );

}


/* =========================================================
   인증 상태 변경 감지
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );


    if (event === "SIGNED_IN") {

      if (session?.user) {

        currentUser =
          session.user;

      }

    }


    if (event === "SIGNED_OUT") {

      currentUser =
        null;


      const currentPage =
        window.location.pathname
          .split("/")
          .pop();


      if (
        currentPage === "index.html" ||
        currentPage === ""
      ) {

        window.location.href =
          "login.html";

      }

    }

  }
);


/* =========================================================
   전체 데이터 불러오기
   ========================================================= */

async function loadAll() {

  try {

    if (!currentUser) {

      console.error(
        "현재 로그인 사용자가 없습니다."
      );

      return;
    }


    const userId =
      currentUser.id;


    const [
      plansResult,
      tasksResult,
      historyResult
    ] =
      await Promise.all([


        /* -------------------------
           PLAN
           ------------------------- */

        supabaseClient
          .from("plans")
          .select("*")
          .eq(
            "user_id",
            userId
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          ),


        /* -------------------------
           TASK
           ------------------------- */

        supabaseClient
          .from("tasks")
          .select("*")
          .eq(
            "user_id",
            userId
          )
          .order(
            "created_at",
            {
              ascending: true
            }
          ),


        /* -------------------------
           HISTORY
           ------------------------- */

        supabaseClient
          .from("plan_history")
          .select("*")
          .eq(
            "user_id",
            userId
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )

      ]);


    if (plansResult.error) {
      throw plansResult.error;
    }


    if (tasksResult.error) {
      throw tasksResult.error;
    }


    if (historyResult.error) {
      throw historyResult.error;
    }


    plans =
      plansResult.data || [];


    tasks =
      tasksResult.data || [];


    histories =
      historyResult.data || [];


    renderAll();

  } catch (error) {

    console.error(
      "LOAD ERROR:",
      error
    );


    showMessage(
      "데이터를 불러오지 못했습니다: " +
      error.message,
      "error"
    );

  }

}


/* =========================================================
   PLAN
   계획 생성
   ========================================================= */

async function createPlan(event) {

  event.preventDefault();


  if (!currentUser) {

    alert(
      "로그인이 필요합니다."
    );

    return;
  }


  const planName =
    $("#planTitle")
      .value
      .trim();


  const startDate =
    $("#startDate").value;


  const endDate =
    $("#endDate").value;


  const estimatedHours =
    $("#estimatedHours").value;


  if (!planName) {

    alert(
      "계획 제목을 입력해주세요."
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
      .insert([
        payload
      ])
      .select()
      .single();


  if (error) {

    console.error(
      "PLAN INSERT ERROR:",
      error
    );


    showMessage(
      "계획 저장에 실패했습니다: " +
      error.message,
      "error"
    );

    return;
  }


  console.log(
    "PLAN CREATED:",
    data
  );


  $("#planForm").reset();


  setDefaultDates();


  await loadAll();


  showMessage(
    "계획이 저장되었습니다."
  );

}


/* =========================================================
   TASK Modal 열기
   ========================================================= */

function openTaskModal() {

  if (!plans.length) {

    showMessage(
      "먼저 계획을 하나 저장해주세요.",
      "error"
    );

    return;
  }


  $("#taskPlanId").innerHTML =
    plans
      .map(
        (plan) => {

          return `
            <option value="${esc(plan.id)}">
              ${esc(
                plan.plan_name ||
                "제목 없음"
              )}
            </option>
          `;

        }
      )
      .join("");


  $("#taskForm").reset();


  $("#taskModal")
    .classList
    .remove("hidden");

}


/* =========================================================
   TASK Modal 닫기
   ========================================================= */

function closeTaskModal() {

  $("#taskModal")
    .classList
    .add("hidden");

}


/* =========================================================
   TASK 생성
   ========================================================= */

async function createTask(event) {

  event.preventDefault();


  if (!currentUser) {

    showMessage(
      "로그인이 필요합니다.",
      "error"
    );

    return;
  }


  const payload = {

    plan_id:
      $("#taskPlanId").value,

    title:
      $("#taskTitle")
        .value
        .trim(),

    memo:
      $("#taskMemo")
        .value
        .trim(),

    completed:
      false,

    user_id:
      currentUser.id

  };


  if (!payload.title) {

    showMessage(
      "할 일 제목을 입력해주세요.",
      "error"
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .insert(
        payload
      );


  if (error) {

    console.error(
      "TASK INSERT ERROR:",
      error
    );


    showMessage(
      "할 일 저장에 실패했습니다: " +
      error.message,
      "error"
    );

    return;
  }


  closeTaskModal();


  await loadAll();


  showMessage(
    "할 일이 저장되었습니다."
  );

}


/* =========================================================
   실행 기록 Modal 열기
   ========================================================= */

function openExecuteModal(id) {

  currentTask =
    tasks.find(
      (task) =>
        String(task.id) ===
        String(id)
    );


  if (!currentTask) {
    return;
  }


  $("#executeTaskId").value =
    currentTask.id;


  $("#executeTitle").textContent =
    currentTask.title ||
    "실행 기록";


  $("#startedAt").value =
    toLocal(
      currentTask.started_at
    ) ||
    toLocal(
      new Date()
    );


  $("#endedAt").value =
    toLocal(
      currentTask.ended_at
    );


  $("#actualMinutes").value =
    currentTask.actual_minutes ??
    "";


  $("#blockedReason").value =
    currentTask.blocked_reason ||
    "";


  $("#executeModal")
    .classList
    .remove("hidden");

}


/* =========================================================
   실행 기록 Modal 닫기
   ========================================================= */

function closeExecuteModal() {

  $("#executeModal")
    .classList
    .add("hidden");


  currentTask =
    null;

}


/* =========================================================
   실행 기록 저장
   ========================================================= */

async function saveExecution(event) {

  event.preventDefault();


  if (!currentTask) {
    return;
  }


  if (!currentUser) {

    showMessage(
      "로그인이 필요합니다.",
      "error"
    );

    return;
  }


  const start =
    $("#startedAt").value;


  const end =
    $("#endedAt").value;


  if (
    end &&
    new Date(end) <
      new Date(start)
  ) {

    showMessage(
      "종료 시간은 시작 시간보다 빠를 수 없습니다.",
      "error"
    );

    return;
  }


  let minutes =
    $("#actualMinutes").value
      ? Number(
          $("#actualMinutes").value
        )
      : null;


  /* 시작/종료 시간으로 자동 계산 */

  if (
    minutes === null &&
    end
  ) {

    minutes =
      Math.round(
        (
          new Date(end) -
          new Date(start)
        ) /
        60000
      );

  }


  const payload = {

    started_at:
      start
        ? new Date(start)
            .toISOString()
        : null,

    ended_at:
      end
        ? new Date(end)
            .toISOString()
        : null,

    actual_minutes:
      minutes,

    blocked_reason:
      $("#blockedReason")
        .value
        .trim() ||
      null,

    completed:
      true

  };


  const wasCompleted =
    !!currentTask.completed;


  /* -------------------------
     TASK 실행 결과 저장
     ------------------------- */

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
      "EXECUTION UPDATE ERROR:",
      error
    );


    showMessage(
      "실행 기록 저장에 실패했습니다: " +
      error.message,
      "error"
    );

    return;
  }


  /* -------------------------
     처음 완료한 경우만
     history 생성
     ------------------------- */

  if (!wasCompleted) {

    const historyPayload = {

      plan_id:
        currentTask.plan_id,

      task_id:
        currentTask.id,

      title:
        currentTask.title,

      started_at:
        payload.started_at,

      ended_at:
        payload.ended_at,

      actual_minutes:
        payload.actual_minutes,

      blocked_reason:
        payload.blocked_reason,

      user_id:
        currentUser.id

    };


    const {
      error:
        historyError
    } =
      await supabaseClient
        .from("plan_history")
        .insert(
          historyPayload
        );


    if (historyError) {

      console.error(
        "HISTORY INSERT ERROR:",
        historyError
      );


      showMessage(
        "실행 기록은 저장됐지만 history 저장에 실패했습니다: " +
        historyError.message,
        "error"
      );


      closeExecuteModal();


      await loadAll();


      return;
    }

  }


  closeExecuteModal();


  await loadAll();


  showMessage(
    wasCompleted
      ? "실행 기록을 수정했습니다. 중복 기록은 만들지 않았습니다."
      : "실행 기록이 저장되었습니다."
  );

}


/* =========================================================
   할 일 완료 상태 변경
   ========================================================= */

async function toggleComplete(
  id,
  checked
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
        completed:
          checked
      })
      .eq(
        "id",
        id
      )
      .eq(
        "user_id",
        currentUser.id
      );


  if (error) {

    console.error(
      "COMPLETE ERROR:",
      error
    );


    showMessage(
      "완료 상태 변경 실패: " +
      error.message,
      "error"
    );

    return;
  }


  await loadAll();

}


/* =========================================================
   할 일 삭제
   ========================================================= */

async function deleteTask(id) {

  const task =
    tasks.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!task) {
    return;
  }


  const confirmed =
    confirm(
      `"${task.title}" 할 일을 삭제할까요?`
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
        id
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
      "삭제 실패: " +
      error.message,
      "error"
    );

    return;
  }


  await loadAll();


  showMessage(
    "할 일이 삭제되었습니다."
  );

}


/* =========================================================
   계획 삭제
   ========================================================= */

async function deletePlan(id) {

  const relatedTasks =
    tasks.filter(
      (task) =>
        String(task.plan_id) ===
        String(id)
    );


  if (
    relatedTasks.length
  ) {

    showMessage(
      "연결된 할 일을 먼저 삭제해주세요.",
      "error"
    );

    return;
  }


  const confirmed =
    confirm(
      "이 계획을 삭제할까요?"
    );


  if (!confirmed) {
    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("plans")
      .delete()
      .eq(
        "id",
        id
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
      "삭제 실패: " +
      error.message,
      "error"
    );

    return;
  }


  await loadAll();


  showMessage(
    "계획이 삭제되었습니다."
  );

}


/* =========================================================
   전체 화면 렌더링
   ========================================================= */

function renderAll() {

  const totalPlans =
    $("#totalPlans");


  if (totalPlans) {

    totalPlans.textContent =
      plans.length;

  }


  const historyCount =
    $("#historyCount");


  if (historyCount) {

    historyCount.textContent =
      histories.length +
      "건";

  }


  renderPlans();

  renderHistory();

}


/* =========================================================
   계획 목록 렌더링
   ========================================================= */

function renderPlans() {

  const planList =
    $("#planList");


  if (!planList) {
    return;
  }


  if (!plans.length) {

    planList.innerHTML =
      `
        <div class="empty">
          아직 저장된 계획이 없습니다.
        </div>
      `;

    return;
  }


  planList.innerHTML =
    plans
      .map(
        (plan) => {

          const planTasks =
            tasks.filter(
              (task) =>
                String(task.plan_id) ===
                String(plan.id)
            );


          const done =
            planTasks.filter(
              (task) =>
                task.completed
            ).length;


          return `
            <div class="plan-item">

              <div class="plan-main">

                <div>

                  <h4 class="plan-title">
                    ${esc(
                      plan.plan_name ||
                      "제목 없음"
                    )}
                  </h4>

                </div>


                <button
                  class="mini-btn danger"
                  data-delete-plan="${esc(
                    plan.id
                  )}"
                  type="button"
                >
                  삭제
                </button>

              </div>


              <div class="plan-meta">

                <span class="badge">
                  ${fmtDate(
                    plan.start_date
                  )}
                  ~
                  ${fmtDate(
                    plan.end_date
                  )}
                </span>


                ${
                  plan.estimated_hours != null
                    ? `
                      <span class="badge">
                        예상
                        ${plan.estimated_hours}
                        시간
                      </span>
                    `
                    : ""
                }


                <span class="badge">
                  완료
                  ${done}/${planTasks.length}
                </span>

              </div>


              <div class="task-box">

                ${
                  planTasks.length
                    ? planTasks
                        .map(
                          renderTask
                        )
                        .join("")
                    : `
                      <div class="empty">
                        아직 할 일이 없습니다.
                      </div>
                    `
                }

              </div>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   할 일 렌더링
   ========================================================= */

function renderTask(task) {

  return `
    <div class="task-row">

      <input
        class="task-check"
        type="checkbox"
        ${
          task.completed
            ? "checked"
            : ""
        }
        data-complete="${esc(
          task.id
        )}"
      >


      <div
        class="task-name ${
          task.completed
            ? "done"
            : ""
        }"
      >

        ${esc(
          task.title ||
          "할 일"
        )}


        ${
          task.memo
            ? `
              <div class="plan-desc">
                ${esc(
                  task.memo
                )}
              </div>
            `
            : ""
        }

      </div>


      <div class="task-actions">

        <button
          class="mini-btn primary"
          data-execute="${esc(
            task.id
          )}"
          type="button"
        >
          ${
            task.completed
              ? "기록 수정"
              : "실행 기록"
          }
        </button>


        <button
          class="mini-btn danger"
          data-delete-task="${esc(
            task.id
          )}"
          type="button"
        >
          삭제
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   실행 기록 렌더링
   ========================================================= */

function renderHistory() {

  const historyList =
    $("#historyList");


  if (!historyList) {
    return;
  }


  if (!histories.length) {

    historyList.innerHTML =
      `
        <div class="empty">
          아직 실행 기록이 없습니다.
        </div>
      `;

    return;
  }


  historyList.innerHTML =
    histories
      .map(
        (history) => {

          const task =
            tasks.find(
              (item) =>
                String(item.id) ===
                String(history.task_id)
            );


          const plan =
            plans.find(
              (item) =>
                String(item.id) ===
                String(history.plan_id)
            );


          return `
            <div class="history-item">

              <div>

                <h4>
                  ${esc(
                    history.title ||
                    task?.title ||
                    "실행 기록"
                  )}
                </h4>


                <p>
                  계획:
                  ${esc(
                    plan?.plan_name ||
                    "계획 없음"
                  )}
                </p>


                <p>
                  시작:
                  ${fmtDateTime(
                    history.started_at
                  )}

                  ${
                    history.ended_at
                      ? `
                        · 종료:
                        ${fmtDateTime(
                          history.ended_at
                        )}
                      `
                      : ""
                  }
                </p>


                ${
                  history.blocked_reason
                    ? `
                      <div class="blocked">
                        막힌 이유:
                        ${esc(
                          history.blocked_reason
                        )}
                      </div>
                    `
                    : ""
                }

              </div>


              <div class="history-time">

                ${
                  history.actual_minutes != null
                    ? history.actual_minutes +
                      "분"
                    : "-"
                }

              </div>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   기본 날짜
   ========================================================= */

function setDefaultDates() {

  const today =
    new Date();


  const nextWeek =
    new Date(
      today
    );


  nextWeek.setDate(
    today.getDate() + 7
  );


  const startDate =
    $("#startDate");


  const endDate =
    $("#endDate");


  if (startDate) {

    startDate.value =
      dateInput(today);

  }


  if (endDate) {

    endDate.value =
      dateInput(nextWeek);

  }

}


/* =========================================================
   날짜 input 변환
   ========================================================= */

function dateInput(date) {

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

}


/* =========================================================
   datetime-local 변환
   ========================================================= */

function toLocal(value) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}T${String(
    date.getHours()
  ).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;

}


/* =========================================================
   날짜 표시
   ========================================================= */

function fmtDate(value) {

  if (!value) {
    return "-";
  }


  return new Date(
    value + "T00:00:00"
  ).toLocaleDateString(
    "ko-KR"
  );

}


/* =========================================================
   날짜 + 시간 표시
   ========================================================= */

function fmtDateTime(value) {

  if (!value) {
    return "-";
  }


  return new Date(
    value
  ).toLocaleString(
    "ko-KR",
    {
      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit"
    }
  );

}


/* =========================================================
   HTML Escape
   ========================================================= */

function esc(value) {

  return String(
    value ?? ""
  )
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


/* =========================================================
   메시지
   ========================================================= */

function showMessage(
  text,
  type = "success"
) {

  const message =
    $("#message");


  if (!message) {
    return;
  }


  message.textContent =
    text;


  message.className =
    `message ${type}`;


  clearTimeout(
    showMessage.timer
  );


  showMessage.timer =
    setTimeout(
      () => {

        message.classList.add(
          "hidden"
        );

      },
      4500
    );

}
