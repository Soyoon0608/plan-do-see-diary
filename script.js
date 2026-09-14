/* =========================================================
   Plan · Do · See Diary
   Supabase + Authentication
   최종 버전
   ========================================================= */


/* =========================================================
   1. Supabase 설정
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
   2. 전역 변수
   ========================================================= */

let plans = [];
let tasks = [];
let histories = [];

let currentTask = null;
let currentUser = null;


/* =========================================================
   3. DOM 선택
   ========================================================= */

const $ = (selector) =>
  document.querySelector(selector);


/* =========================================================
   4. 로그인 보호
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

    console.log(
      "CURRENT USER:",
      currentUser.id,
      currentUser.email
    );

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
   5. 현재 로그인 사용자
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
   6. 로그아웃
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
   7. 페이지 시작
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (hasPlaceholderKey) {

      showMessage(
        "Supabase Publishable key가 설정되지 않았습니다.",
        "error"
      );

      return;
    }


    const loggedIn =
      await requireLogin();


    if (!loggedIn) {
      return;
    }


    await loadCurrentUser();


    setDefaultDates();


    bindEvents();


    await loadAll();

  }
);


/* =========================================================
   8. 이벤트 연결
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


  /* 동적 버튼 */

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
   9. 인증 상태 변경
   ========================================================= */

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );


    if (
      event === "SIGNED_IN" &&
      session?.user
    ) {

      currentUser =
        session.user;

    }


    if (
      event === "SIGNED_OUT"
    ) {

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
   10. 전체 데이터 불러오기
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


    console.log(
      "LOAD USER:",
      userId
    );


    /*
       중요

       plans      → plans
       tasks      → tasks
       histories  → plan_history

       실제 DB 컬럼에 존재하는 정렬 컬럼만 사용한다.
    */

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
            "id",
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
            "id",
            {
              ascending: true
            }
          ),


        /* -------------------------
           PLAN HISTORY
           ------------------------- */

        supabaseClient
          .from("plan_history")
          .select("*")
          .eq(
            "user_id",
            userId
          )
          .order(
            "changed_at",
            {
              ascending: false
            }
          )

      ]);


    /* PLAN 오류 */

    if (plansResult.error) {

      throw plansResult.error;

    }


    /* TASK 오류 */

    if (tasksResult.error) {

      throw tasksResult.error;

    }


    /* HISTORY 오류 */

    if (historyResult.error) {

      throw historyResult.error;

    }


    plans =
      plansResult.data || [];


    tasks =
      tasksResult.data || [];


    histories =
      historyResult.data || [];


    console.log(
      "PLANS:",
      plans
    );


    console.log(
      "TASKS:",
      tasks
    );


    console.log(
      "PLAN HISTORY:",
      histories
    );


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
   11. PLAN 생성
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
   12. Task Modal 열기
   ========================================================= */

function openTaskModal() {

  if (!plans.length) {

    showMessage(
      "먼저 계획을 하나 저장해주세요.",
      "error"
    );

    return;
  }


  const select =
    $("#taskPlanId");


  if (!select) {
    return;
  }


  select.innerHTML =
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


  const taskForm =
    $("#taskForm");


  if (taskForm) {
    taskForm.reset();
  }


  $("#taskModal")
    .classList
    .remove("hidden");

}


/* =========================================================
   13. Task Modal 닫기
   ========================================================= */

function closeTaskModal() {

  const modal =
    $("#taskModal");


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   14. Task 생성
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


  const title =
    $("#taskTitle")
      .value
      .trim();


  const memo =
    $("#taskMemo")
      .value
      .trim();


  if (!title) {

    showMessage(
      "할 일 제목을 입력해주세요.",
      "error"
    );

    return;
  }


  const payload = {

    plan_id:
      $("#taskPlanId").value,

    title:
      title,

    memo:
      memo,

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
   15. 실행 기록 Modal 열기
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


  const taskId =
    $("#executeTaskId");


  if (taskId) {

    taskId.value =
      currentTask.id;

  }


  const executeTitle =
    $("#executeTitle");


  if (executeTitle) {

    executeTitle.textContent =
      currentTask.title ||
      "실행 기록";

  }


  const startedAt =
    $("#startedAt");


  if (startedAt) {

    startedAt.value =
      toLocal(
        currentTask.started_at
      ) ||
      toLocal(
        new Date()
      );

  }


  const endedAt =
    $("#endedAt");


  if (endedAt) {

    endedAt.value =
      toLocal(
        currentTask.ended_at
      );

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


  $("#executeModal")
    .classList
    .remove("hidden");

}


/* =========================================================
   16. 실행 기록 Modal 닫기
   ========================================================= */

function closeExecuteModal() {

  const modal =
    $("#executeModal");


  if (modal) {

    modal.classList.add(
      "hidden"
    );

  }


  currentTask =
    null;

}


/* =========================================================
   17. 실행 기록 저장
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


  /* 종료 시간이 있고 실제 시간 미입력 시 자동 계산 */

  if (
    minutes === null &&
    end
  ) {

    minutes =
      Math.round(
        (
          new Date(end) -
          new Date(start)
        ) / 60000
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


  closeExecuteModal();


  await loadAll();


  showMessage(
    currentTask?.completed
      ? "실행 기록을 수정했습니다."
      : "실행 기록이 저장되었습니다."
  );

}


/* =========================================================
   18. 할 일 완료 상태 변경
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
   19. 할 일 삭제
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
   20. 계획 삭제
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
   21. 전체 렌더링
   ========================================================= */

function renderAll() {

  const totalPlans =
    $("#totalPlans");

