/* ==================================================
   Plan · Do · See Diary
   Card 1 ~ Card 5
   Supabase + XSS Safe Rendering + Export
================================================== */


/* ==================================================
   Supabase 설정
================================================== */

const SUPABASE_URL =
  "https://ptrsztelwuwrbounfpod.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* ==================================================
   전역 데이터
================================================== */

let plans = [];
let tasks = [];
let executionRecords = [];
let planHistory = [];


/* ==================================================
   XSS 방지
================================================== */

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text ?? "";

  return div.innerHTML;
}


/* ==================================================
   공통 오류 출력
================================================== */

function showError(message) {

  console.error(message);

  alert(message);
}


/* ==================================================
   한국 날짜
================================================== */

function getSeoulToday() {

  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    );

  return formatter.format(
    new Date()
  );
}


/* ==================================================
   날짜 포맷
================================================== */

function formatDate(dateValue) {

  if (!dateValue) {
    return "-";
  }

  return dateValue;
}


/* ==================================================
   날짜시간 포맷
================================================== */

function formatDateTime(dateValue) {

  if (!dateValue) {
    return "-";
  }

  const date =
    new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


/* ==================================================
   우선순위 점수
================================================== */

function getPriorityScore(priority) {

  if (priority === "높음") {
    return 3;
  }

  if (priority === "보통") {
    return 2;
  }

  return 1;
}


/* ==================================================
   계획 불러오기
================================================== */

async function loadPlans() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("plans")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(
      "PLANS LOAD ERROR:",
      error
    );

    showError(
      "계획을 불러오지 못했습니다: " +
      error.message
    );

    return;
  }

  plans = data || [];

  renderPlans();
  updatePlanSelects();
  updateReviewPlanSelects();
}


/* ==================================================
   계획 화면 출력
================================================== */

function renderPlans() {

  const planList =
    document.getElementById(
      "planList"
    );

  if (!planList) {
    return;
  }

  if (plans.length === 0) {

    planList.innerHTML =
      "<p>아직 저장된 계획이 없습니다.</p>";

    return;
  }

  planList.innerHTML =
    plans
      .map(plan => {

        return `
          <div>

            <h4>
              ${escapeHTML(plan.plan_name)}
            </h4>

            <p>
              <strong>기간:</strong>
              ${escapeHTML(formatDate(plan.start_date))}
              ~
              ${escapeHTML(formatDate(plan.end_date))}
            </p>

            <p>
              <strong>우선순위:</strong>
              ${escapeHTML(plan.priority)}
            </p>

            <p>
              <strong>성공 기준:</strong>
              ${escapeHTML(plan.success_criteria)}
            </p>

            <p>
              <strong>예상 시간:</strong>
              ${Number(plan.estimated_hours || 0)}
              시간
            </p>

            ${
              plan.next_action
                ? `
                  <p>
                    <strong>다음 행동:</strong>
                    ${escapeHTML(plan.next_action)}
                  </p>
                `
                : ""
            }

            <p>
              <small>
                ID: ${escapeHTML(String(plan.id))}
              </small>
            </p>

          </div>
        `;

      })
      .join("");
}


/* ==================================================
   계획 선택 목록 업데이트
================================================== */

function updatePlanSelects() {

  const taskPlanId =
    document.getElementById(
      "taskPlanId"
    );

  const taskPlanFilter =
    document.getElementById(
      "taskPlanFilter"
    );

  const nextPlanSelect =
    document.getElementById(
      "nextPlanSelect"
    );

  const currentTaskPlanId =
    taskPlanId?.value || "";

  const currentTaskFilter =
    taskPlanFilter?.value || "";

  const currentNextPlan =
    nextPlanSelect?.value || "";

  const planOptions =
    plans
      .map(plan => {

        return `
          <option value="${escapeHTML(String(plan.id))}">
            ${escapeHTML(plan.plan_name)}
          </option>
        `;

      })
      .join("");


  if (taskPlanId) {

    taskPlanId.innerHTML =
      `
        <option value="">
          계획을 선택하세요
        </option>
      ` +
      planOptions;

    if (
      plans.some(
        plan =>
          String(plan.id) ===
          String(currentTaskPlanId)
      )
    ) {

      taskPlanId.value =
        currentTaskPlanId;
    }
  }


  if (taskPlanFilter) {

    taskPlanFilter.innerHTML =
      `
        <option value="">
          전체 계획
        </option>
      ` +
      planOptions;

    if (
      plans.some(
        plan =>
          String(plan.id) ===
          String(currentTaskFilter)
      )
    ) {

      taskPlanFilter.value =
        currentTaskFilter;
    }
  }


  if (nextPlanSelect) {

    nextPlanSelect.innerHTML =
      `
        <option value="">
          다음 계획을 선택하세요
        </option>
      ` +
      planOptions;

    if (
      plans.some(
        plan =>
          String(plan.id) ===
          String(currentNextPlan)
      )
    ) {

      nextPlanSelect.value =
        currentNextPlan;
    }
  }
}


/* ==================================================
   계획 저장
================================================== */

async function savePlan(event) {

  event.preventDefault();

  const planName =
    document
      .getElementById("planName")
      .value
      .trim();

  const startDate =
    document
      .getElementById("startDate")
      .value;

  const endDate =
    document
      .getElementById("endDate")
      .value;

  const priority =
    document
      .getElementById("priority")
      .value;

  const successCriteria =
    document
      .getElementById("successCriteria")
      .value
      .trim();

  const estimatedHours =
    Number(
      document
        .getElementById("estimatedHours")
        .value
    );


  if (!planName) {

    alert("계획명을 입력해주세요.");
    return;
  }

  if (!startDate || !endDate) {

    alert("시작일과 종료일을 입력해주세요.");
    return;
  }

  if (endDate < startDate) {

    alert("종료일은 시작일보다 빠를 수 없습니다.");
    return;
  }

  if (!successCriteria) {

    alert("성공 기준을 입력해주세요.");
    return;
  }

  if (
    Number.isNaN(estimatedHours) ||
    estimatedHours < 0
  ) {

    alert("예상 시간을 올바르게 입력해주세요.");
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("plans")
      .insert([
        {
          plan_name: planName,
          start_date: startDate,
          end_date: endDate,
          priority: priority,
          success_criteria: successCriteria,
          estimated_hours: estimatedHours
        }
      ])
      .select()
      .single();


  if (error) {

    console.error(
      "PLAN INSERT ERROR:",
      error
    );

    showError(
      "계획 저장에 실패했습니다: " +
      error.message
    );

    return;
  }


  alert(
    `계획이 저장되었습니다. ID: ${data.id}`
  );


  document
    .getElementById("planForm")
    .reset();


  await loadPlans();
}


/* ==================================================
   계획 이력 불러오기
================================================== */

async function loadPlanHistory() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("plan_history")
      .select("*")
      .order(
        "changed_at",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(
      "PLAN HISTORY LOAD ERROR:",
      error
    );

    return;
  }

  planHistory =
    data || [];
}


/* ==================================================
   할 일 불러오기
================================================== */

async function loadTasks() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("tasks")
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );

  if (error) {

    console.error(
      "TASK LOAD ERROR:",
      error
    );

    showError(
      "할 일을 불러오지 못했습니다: " +
      error.message
    );

    return;
  }

  tasks =
    data || [];

  renderTasks();
  updateExecutionTaskSelect();
}


/* ==================================================
   할 일 저장
================================================== */

async function saveTask(event) {

  event.preventDefault();

  const taskName =
    document
      .getElementById("taskName")
      .value
      .trim();

  const planId =
    document
      .getElementById("taskPlanId")
      .value;

  const dueDate =
    document
      .getElementById("taskDueDate")
      .value;

  const priority =
    document
      .getElementById("taskPriority")
      .value;

  const tag =
    document
      .getElementById("taskTag")
      .value
      .trim();

  const estimatedHours =
    Number(
      document
        .getElementById("taskEstimatedHours")
        .value
    );


  if (!taskName) {

    alert("할 일을 입력해주세요.");
    return;
  }

  if (!planId) {

    alert("연결할 계획을 선택해주세요.");
    return;
  }

  if (
    Number.isNaN(estimatedHours) ||
    estimatedHours < 0
  ) {

    alert("예상 시간을 올바르게 입력해주세요.");
    return;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("tasks")
      .insert([
        {
          plan_id: Number(planId),
          task_name: taskName,
          due_date: dueDate || null,
          priority: priority,
          tag: tag || null,
          estimated_hours: estimatedHours,
          is_completed: false
        }
      ])
      .select()
      .single();


  if (error) {

    console.error(
      "TASK INSERT ERROR:",
      error
    );

    showError(
      "할 일 저장에 실패했습니다: " +
      error.message
    );

    return;
  }


  alert(
    `할 일이 저장되었습니다. ID: ${data.id}`
  );


  document
    .getElementById("taskForm")
    .reset();


  await loadTasks();
}


/* ==================================================
   할 일 렌더링
================================================== */

function renderTasks() {

  const taskList =
    document.getElementById(
      "taskList"
    );

  if (!taskList) {
    return;
  }


  const search =
    document
      .getElementById("taskSearch")
      ?.value
      .trim()
      .toLowerCase() || "";

  const planFilter =
    document
      .getElementById("taskPlanFilter")
      ?.value || "";

  const statusFilter =
    document
      .getElementById("taskStatusFilter")
      ?.value || "";

  const priorityFilter =
    document
      .getElementById("taskPriorityFilter")
      ?.value || "";

  const sortType =
    document
      .getElementById("taskSort")
      ?.value ||
    "created_desc";


  let filtered =
    tasks.filter(task => {

      const plan =
        plans.find(
          plan =>
            String(plan.id) ===
            String(task.plan_id)
        );


      const matchesSearch =
        !search ||
        String(task.task_name || "")
          .toLowerCase()
          .includes(search);


      const matchesPlan =
        !planFilter ||
        String(task.plan_id) ===
        String(planFilter);


      const status =
        task.is_completed
          ? "완료"
          : "진행 중";


      const matchesStatus =
        !statusFilter ||
        status === statusFilter;


      const matchesPriority =
        !priorityFilter ||
        task.priority ===
        priorityFilter;


      return (
        matchesSearch &&
        matchesPlan &&
        matchesStatus &&
        matchesPriority
      );

    });


  filtered.sort(
    (a, b) => {

      if (sortType === "due_asc") {

        return (
          String(a.due_date || "9999-12-31")
            .localeCompare(
              String(b.due_date || "9999-12-31")
            )
        );
      }


      if (sortType === "priority_desc") {

        return (
          getPriorityScore(b.priority) -
          getPriorityScore(a.priority)
        );
      }


      if (sortType === "hours_asc") {

        return (
          Number(a.estimated_hours || 0) -
          Number(b.estimated_hours || 0)
        );
      }


      if (sortType === "hours_desc") {

        return (
          Number(b.estimated_hours || 0) -
          Number(a.estimated_hours || 0)
        );
      }


      return (
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
      );

    }
  );


  if (filtered.length === 0) {

    taskList.innerHTML =
      "<p>조건에 맞는 할 일이 없습니다.</p>";

    return;
  }


  taskList.innerHTML =
    filtered
      .map(task => {

        const plan =
          plans.find(
            plan =>
              String(plan.id) ===
              String(task.plan_id)
          );


        const status =
          task.is_completed
            ? "완료"
            : "진행 중";


        return `
          <div>

            <h4>
              ${escapeHTML(task.task_name)}
            </h4>

            <p>
              <strong>계획:</strong>
              ${escapeHTML(
                plan?.plan_name || "알 수 없음"
              )}
            </p>

            <p>
              <strong>상태:</strong>
              ${escapeHTML(status)}
            </p>

            <p>
              <strong>마감일:</strong>
              ${escapeHTML(
                formatDate(task.due_date)
              )}
            </p>

            <p>
              <strong>우선순위:</strong>
              ${escapeHTML(task.priority)}
            </p>

            <p>
              <strong>태그:</strong>
              ${escapeHTML(task.tag || "-")}
            </p>

            <p>
              <strong>예상 시간:</strong>
              ${Number(task.estimated_hours || 0)}
              시간
            </p>

            <button
              type="button"
              onclick="toggleTaskComplete(${Number(task.id)}, ${task.is_completed ? "false" : "true"})"
            >
              ${
                task.is_completed
                  ? "완료 취소"
                  : "완료 처리"
              }
            </button>

            <button
              type="button"
              onclick="deleteTask(${Number(task.id)})"
            >
              삭제
            </button>

          </div>
        `;

      })
      .join("");
}


/* ==================================================
   완료 상태 변경
================================================== */

async function toggleTaskComplete(
  taskId,
  completed
) {

  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .update({
        is_completed: completed
      })
      .eq(
        "id",
        taskId
      );


  if (error) {

    console.error(
      "TASK COMPLETE ERROR:",
      error
    );

    showError(
      "완료 상태 변경에 실패했습니다: " +
      error.message
    );

    return;
  }


  if (completed) {

    const existing =
      executionRecords.find(
        record =>
          Number(record.task_id) ===
          Number(taskId) &&
          record.is_completion_record === true
      );


    if (!existing) {

      const now =
        new Date();

      const startedAt =
        new Date(
          now.getTime() -
          60 * 60 * 1000
        );


      const {
        error:
          completionError
      } =
        await supabaseClient
          .from("execution_records")
          .insert([
            {
              task_id: taskId,
              started_at:
                startedAt.toISOString(),
              ended_at:
                now.toISOString(),
              actual_minutes: 60,
              blocked_reason: null,
              is_completion_record: true
            }
          ]);


      if (completionError) {

        console.error(
          "COMPLETION RECORD ERROR:",
          completionError
        );

        showError(
          "완료 기록 생성에 실패했습니다: " +
          completionError.message
        );

        return;
      }
    }
  }


  await loadTasks();
  await loadExecutionRecords();
  await loadReview();
}


/* ==================================================
   할 일 삭제
================================================== */

async function deleteTask(taskId) {

  const confirmed =
    confirm(
      "이 할 일을 삭제하시겠습니까?\n연결된 실행 기록도 삭제될 수 있습니다."
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
      );


  if (error) {

    console.error(
      "TASK DELETE ERROR:",
      error
    );

    showError(
      "할 일 삭제에 실패했습니다: " +
      error.message
    );

    return;
  }


  await loadTasks();
  await loadExecutionRecords();
  await loadReview();
}


/* ==================================================
   실행 기록 불러오기
================================================== */

async function loadExecutionRecords() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("execution_records")
      .select("*")
      .order(
        "started_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "EXECUTION LOAD ERROR:",
      error
    );

    showError(
      "실행 기록을 불러오지 못했습니다: " +
      error.message
    );

    return;
  }


  executionRecords =
    data || [];

  renderExecutionRecords();
  updateExecutionTaskSelect();
}


/* ==================================================
   실행 기록 선택 목록
================================================== */

function updateExecutionTaskSelect() {

  const select =
    document.getElementById(
      "executionTaskId"
    );

  if (!select) {
    return;
  }


  const currentValue =
    select.value;


  select.innerHTML =
    `
      <option value="">
        할 일을 선택하세요
      </option>
    ` +
    tasks
      .map(task => {

        return `
          <option value="${Number(task.id)}">
            ${escapeHTML(task.task_name)}
          </option>
        `;

      })
      .join("");


  if (
    tasks.some(
      task =>
        String(task.id) ===
        String(currentValue)
    )
  ) {

    select.value =
      currentValue;
  }
}


/* ==================================================
   실행 기록 저장
================================================== */

async function saveExecution(event) {

  event.preventDefault();


  const taskId =
    document
      .getElementById("executionTaskId")
      .value;

  const startedAt =
    document
      .getElementById("startedAt")
      .value;

  const endedAt =
    document
      .getElementById("endedAt")
      .value;

  const actualMinutes =
    Number(
      document
        .getElementById("actualMinutes")
        .value
    );

  const blockedReason =
    document
      .getElementById("blockedReason")
      .value
      .trim();


  if (!taskId) {

    alert("할 일을 선택해주세요.");
    return;
  }

  if (!startedAt || !endedAt) {

    alert("시작 시각과 끝난 시각을 입력해주세요.");
    return;
  }

  if (
    new Date(endedAt) <
    new Date(startedAt)
  ) {

    alert(
      "끝난 시각은 시작 시각보다 빠를 수 없습니다."
    );

    return;
  }

  if (
    Number.isNaN(actualMinutes) ||
    actualMinutes < 0
  ) {

    alert(
      "실제로 걸린 시간을 올바르게 입력해주세요."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("execution_records")
      .insert([
        {
          task_id: Number(taskId),
          started_at:
            new Date(startedAt).toISOString(),
          ended_at:
            new Date(endedAt).toISOString(),
          actual_minutes:
            actualMinutes,
          blocked_reason:
            blockedReason || null,
          is_completion_record:
            false
        }
      ]);


  if (error) {

    console.error(
      "EXECUTION INSERT ERROR:",
      error
    );

    showError(
      "실행 기록 저장에 실패했습니다: " +
      error.message
    );

    return;
  }


  alert(
    "실행 기록이 저장되었습니다."
  );


  document
    .getElementById("executionForm")
    .reset();


  await loadExecutionRecords();
  await loadReview();
}


/* ==================================================
   실행 기록 출력
================================================== */

function renderExecutionRecords() {

  const list =
    document.getElementById(
      "executionList"
    );

  if (!list) {
    return;
  }


  if (executionRecords.length === 0) {

    list.innerHTML =
      "<p>아직 실행 기록이 없습니다.</p>";

    return;
  }


  list.innerHTML =
    executionRecords
      .map(record => {

        const task =
          tasks.find(
            task =>
              String(task.id) ===
              String(record.task_id)
          );


        return `
          <div>

            <h4>
              ${escapeHTML(
                task?.task_name ||
                "삭제된 할 일"
              )}
            </h4>

            <p>
              <strong>시작:</strong>
              ${escapeHTML(
                formatDateTime(record.started_at)
              )}
            </p>

            <p>
              <strong>종료:</strong>
              ${escapeHTML(
                formatDateTime(record.ended_at)
              )}
            </p>

            <p>
              <strong>실제 시간:</strong>
              ${Number(record.actual_minutes || 0)}
              분
            </p>

            <p>
              <strong>막혔던 이유:</strong>
              ${escapeHTML(
                record.blocked_reason || "-"
              )}
            </p>

            ${
              record.is_completion_record
                ? `
                  <p>
                    <strong>
                      완료 처리 기록
                    </strong>
                  </p>
                `
                : ""
            }

          </div>
        `;

      })
      .join("");
}


/* ==================================================
   Card 4 — 계획 선택 목록
================================================== */

function updateReviewPlanSelects() {

  const select =
    document.getElementById(
      "reviewPlanFilter"
    );

  if (!select) {
    return;
  }


  const current =
    select.value;


  select.innerHTML =
    `
      <option value="">
        전체 계획
      </option>
    ` +
    plans
      .map(plan => {

        return `
          <option value="${Number(plan.id)}">
            ${escapeHTML(plan.plan_name)}
          </option>
        `;

      })
      .join("");


  if (
    plans.some(
      plan =>
        String(plan.id) ===
        String(current)
    )
  ) {

    select.value =
      current;
  }
}


/* ==================================================
   Card 4 — 돌아보기
================================================== */

async function loadReview() {

  const planFilter =
    document
      .getElementById("reviewPlanFilter")
      ?.value || "";

  const startDate =
    document
      .getElementById("reviewStartDate")
      ?.value || "";

  const endDate =
    document
      .getElementById("reviewEndDate")
      ?.value || "";


  let reviewTasks =
    [...tasks];


  if (planFilter) {

    reviewTasks =
      reviewTasks.filter(
        task =>
          String(task.plan_id) ===
          String(planFilter)
      );
  }


  if (startDate) {

    reviewTasks =
      reviewTasks.filter(
        task =>
          !task.due_date ||
          task.due_date >= startDate
      );
  }


  if (endDate) {

    reviewTasks =
      reviewTasks.filter(
        task =>
          !task.due_date ||
          task.due_date <= endDate
      );
  }


  const taskIds =
    new Set(
      reviewTasks.map(
        task => Number(task.id)
      )
    );


  const reviewExecutions =
    executionRecords.filter(
      record =>
        taskIds.has(
          Number(record.task_id)
        )
    );


  const expectedHours =
    reviewTasks.reduce(
      (sum, task) =>
        sum +
        Number(
          task.estimated_hours || 0
        ),
      0
    );


  const actualMinutes =
    reviewExecutions.reduce(
      (sum, record) =>
        sum +
        Number(
          record.actual_minutes || 0
        ),
      0
    );


  const actualHours =
    actualMinutes / 60;


  const differenceHours =
    actualHours -
    expectedHours;


  const completedCount =
    reviewTasks.filter(
      task =>
        task.is_completed
    ).length;


  const delayedCount =
    reviewTasks.filter(task => {

      if (!task.due_date) {
        return false;
      }

      if (task.is_completed) {
        return false;
      }

      return (
        task.due_date <
        getSeoulToday()
      );

    }).length;


  const blockedCount =
    reviewExecutions.filter(
      record =>
        Boolean(
          record.blocked_reason
        )
    ).length;


  renderReviewSummary({
    taskCount:
      reviewTasks.length,

    completedCount:
      completedCount,

    delayedCount:
      delayedCount,

    blockedCount:
      blockedCount,

    expectedHours:
      expectedHours,

    actualHours:
      actualHours,

    differenceHours:
      differenceHours
  });


  renderReviewEvidence({
    tasks:
      reviewTasks,

    executions:
      reviewExecutions
  });
}


/* ==================================================
   Card 4 — 집계 결과
================================================== */

function renderReviewSummary(summary) {

  const container =
    document.getElementById(
      "reviewSummary"
    );

  if (!container) {
    return;
  }


  container.innerHTML = `

    <h3>
      돌아보기 요약
    </h3>

    <p>
      <strong>할 일 수</strong>

      <button
        type="button"
        class="review-evidence-button"
        onclick="showReviewEvidence('all')"
      >
        <strong>
          ${summary.taskCount}
        </strong>
      </button>
    </p>

    <p>
      <strong>완료 수</strong>

      <button
        type="button"
        class="review-evidence-button"
        onclick="showReviewEvidence('completed')"
      >
        <strong>
          ${summary.completedCount}
        </strong>
      </button>
    </p>

    <p>
      <strong>지연 수</strong>

      <button
        type="button"
        class="review-evidence-button"
        onclick="showReviewEvidence('delayed')"
      >
        <strong>
          ${summary.delayedCount}
        </strong>
      </button>
    </p>

    <p>
      <strong>막힘 기록 수</strong>

      <button
        type="button"
        class="review-evidence-button"
        onclick="showReviewEvidence('blocked')"
      >
        <strong>
          ${summary.blockedCount}
        </strong>
      </button>
    </p>

    <p>
      <strong>예상 시간</strong>

      <strong>
        ${summary.expectedHours.toFixed(2)}
      </strong>
      시간
    </p>

    <p>
      <strong>실제 시간</strong>

      <strong>
        ${summary.actualHours.toFixed(2)}
      </strong>
      시간
    </p>

    <p>
      <strong>예상 대비 차이</strong>

      <strong>
        ${summary.differenceHours >= 0 ? "+" : ""}
        ${summary.differenceHours.toFixed(2)}
      </strong>
      시간
    </p>

  `;
}


/* ==================================================
   Card 4 — 근거 데이터
================================================== */

let currentReviewEvidence = {
  tasks: [],
  executions: []
};


/* ==================================================
   근거 기록 출력
================================================== */

function renderReviewEvidence(data) {

  currentReviewEvidence =
    data;


  const container =
    document.getElementById(
      "reviewEvidence"
    );

  if (!container) {
    return;
  }


  container.innerHTML =
    `
      <p>
        집계 숫자를 클릭하면
        해당 기록이 표시됩니다.
      </p>
    `;
}


/* ==================================================
   근거 숫자 클릭
================================================== */

function showReviewEvidence(type) {

  const container =
    document.getElementById(
      "reviewEvidence"
    );

  if (!container) {
    return;
  }


  let selectedTasks =
    [...currentReviewEvidence.tasks];


  let title =
    "전체 할 일";


  if (type === "completed") {

    selectedTasks =
      selectedTasks.filter(
        task =>
          task.is_completed
      );

    title =
      "완료된 할 일";
  }


  if (type === "delayed") {

    selectedTasks =
      selectedTasks.filter(task => {

        return (
          task.due_date &&
          !task.is_completed &&
          task.due_date <
          getSeoulToday()
        );

      });

    title =
      "지연된 할 일";
  }


  if (type === "blocked") {

    const blockedTaskIds =
      new Set(
        currentReviewEvidence.executions
          .filter(
            record =>
              Boolean(
                record.blocked_reason
              )
          )
          .map(
            record =>
              Number(record.task_id)
          )
      );


    selectedTasks =
      selectedTasks.filter(
        task =>
          blockedTaskIds.has(
            Number(task.id)
          )
      );

    title =
      "막힘이 있었던 할 일";
  }


  if (selectedTasks.length === 0) {

    container.innerHTML = `

      <div>

        <h4>
          ${escapeHTML(title)}
        </h4>

        <p>
          해당 기록이 없습니다.
        </p>

      </div>

    `;

    return;
  }


  container.innerHTML =
    `
      <h4>
        ${escapeHTML(title)}
      </h4>
    ` +
    selectedTasks
      .map(task => {

        const plan =
          plans.find(
            plan =>
              String(plan.id) ===
              String(task.plan_id)
          );


        const relatedExecutions =
          currentReviewEvidence.executions
            .filter(
              record =>
                Number(record.task_id) ===
                Number(task.id)
            );


        return `

          <div>

            <h4>
              ${escapeHTML(task.task_name)}
            </h4>

            <p>
              <strong>계획:</strong>
              ${escapeHTML(
                plan?.plan_name || "-"
              )}
            </p>

            <p>
              <strong>상태:</strong>
              ${
                task.is_completed
                  ? "완료"
                  : "진행 중"
              }
            </p>

            <p>
              <strong>예상:</strong>
              ${Number(task.estimated_hours || 0)}
              시간
            </p>

            <p>
              <strong>마감일:</strong>
              ${escapeHTML(
                formatDate(task.due_date)
              )}
            </p>

            ${
              relatedExecutions.length
                ? relatedExecutions
                    .map(
                      record => `
                        <p>
                          <strong>
                            실행 기록:
                          </strong>
                          ${Number(
                            record.actual_minutes || 0
                          )}
                          분
                          ${
                            record.blocked_reason
                              ? `
                                /
                                ${escapeHTML(
                                  record.blocked_reason
                                )}
                              `
                              : ""
                          }
                        </p>
                      `
                    )
                    .join("")
                : ""
            }

          </div>

        `;

      })
      .join("");
}


/* ==================================================
   다음 계획에 반영
================================================== */

async function saveNextAction() {

  const nextActionInput =
    document.getElementById(
      "nextActionInput"
    );

  const nextPlanSelect =
    document.getElementById(
      "nextPlanSelect"
    );

  const result =
    document.getElementById(
      "nextActionResult"
    );


  const nextAction =
    nextActionInput.value.trim();

  const nextPlanId =
    nextPlanSelect.value;


  if (!nextAction) {

    alert(
      "고칠 점을 입력해주세요."
    );

    return;
  }


  if (!nextPlanId) {

    alert(
      "반영할 다음 계획을 선택해주세요."
    );

    return;
  }


  const {
    error
  } =
    await supabaseClient
      .from("plans")
      .update({
        next_action:
          nextAction
      })
      .eq(
        "id",
        Number(nextPlanId)
      );


  if (error) {

    console.error(
      "NEXT ACTION ERROR:",
      error
    );

    showError(
      "다음 계획 반영에 실패했습니다: " +
      error.message
    );

    return;
  }


  const selectedPlan =
    plans.find(
      plan =>
        String(plan.id) ===
        String(nextPlanId)
    );


  if (selectedPlan) {

    selectedPlan.next_action =
      nextAction;
  }


  result.innerHTML = `

    <strong>
      다음 계획에 반영되었습니다.
    </strong>

    <p>
      ${escapeHTML(
        selectedPlan?.plan_name || ""
      )}
    </p>

    <p>
      ${escapeHTML(nextAction)}
    </p>

  `;


  await loadPlans();
}


/* ==================================================
   Card 5 — 전체 데이터 내보내기
================================================== */

async function exportAllData() {

  const exportResult =
    document.getElementById(
      "exportResult"
    );


  if (!exportResult) {
    return;
  }


  exportResult.textContent =
    "데이터를 준비하는 중입니다...";


  try {

    const [
      plansResult,
      historyResult,
      tasksResult,
      executionResult
    ] =
      await Promise.all([

        supabaseClient
          .from("plans")
          .select("*")
          .order(
            "created_at",
            {
              ascending: true
            }
          ),

        supabaseClient
          .from("plan_history")
          .select("*")
          .order(
            "changed_at",
            {
              ascending: true
            }
          ),

        supabaseClient
          .from("tasks")
          .select("*")
          .order(
            "created_at",
            {
              ascending: true
            }
          ),

        supabaseClient
          .from("execution_records")
          .select("*")
          .order(
            "created_at",
            {
              ascending: true
            }
          )

      ]);


    const results = [

      [
        "plans",
        plansResult
      ],

      [
        "plan_history",
        historyResult
      ],

      [
        "tasks",
        tasksResult
      ],

      [
        "execution_records",
        executionResult
      ]

    ];


    const failed =
      results.find(
        ([, result]) =>
          result.error
      );


    if (failed) {

      console.error(
        "EXPORT ERROR:",
        failed[1].error
      );

      exportResult.textContent =
        "내보내기에 실패했습니다: " +
        failed[1].error.message;

      return;
    }


    const exportData = {

      exported_at:
        new Date().toISOString(),

      timezone:
        "Asia/Seoul",

      plans:
        plansResult.data || [],

      plan_history:
        historyResult.data || [],

      tasks:
        tasksResult.data || [],

      execution_records:
        executionResult.data || []

    };


    const blob =
      new Blob(
        [
          JSON.stringify(
            exportData,
            null,
            2
          )
        ],
        {
          type:
            "application/json;charset=utf-8"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const a =
      document.createElement(
        "a"
      );


    a.href =
      url;

    a.download =
      `plan-do-see-diary-${getSeoulToday()}.json`;


    document.body.appendChild(a);

    a.click();

    a.remove();


    URL.revokeObjectURL(
      url
    );


    exportResult.textContent =
      `✅ 내보내기 완료 — 계획 ${exportData.plans.length}건 / 수정 이력 ${exportData.plan_history.length}건 / 할 일 ${exportData.tasks.length}건 / 실행 기록 ${exportData.execution_records.length}건`;

  }
  catch (error) {

    console.error(
      "EXPORT UNEXPECTED ERROR:",
      error
    );

    exportResult.textContent =
      "내보내기 중 예상하지 못한 오류가 발생했습니다.";

  }
}


/* ==================================================
   이벤트 연결
================================================== */

function setupEventListeners() {


  /* ---------- 계획 ---------- */

  const planForm =
    document.getElementById(
      "planForm"
    );

  if (planForm) {

    planForm.addEventListener(
      "submit",
      savePlan
    );
  }


  /* ---------- 할 일 ---------- */

  const taskForm =
    document.getElementById(
      "taskForm"
    );

  if (taskForm) {

    taskForm.addEventListener(
      "submit",
      saveTask
    );
  }


  /* ---------- 실행 기록 ---------- */

  const executionForm =
    document.getElementById(
      "executionForm"
    );

  if (executionForm) {

    executionForm.addEventListener(
      "submit",
      saveExecution
    );
  }


  /* ---------- 검색 ---------- */

  const taskSearch =
    document.getElementById(
      "taskSearch"
    );

  if (taskSearch) {

    taskSearch.addEventListener(
      "input",
      renderTasks
    );
  }


  /* ---------- 필터 ---------- */

  const taskPlanFilter =
    document.getElementById(
      "taskPlanFilter"
    );

  if (taskPlanFilter) {

    taskPlanFilter.addEventListener(
      "change",
      renderTasks
    );
  }


  const taskStatusFilter =
    document.getElementById(
      "taskStatusFilter"
    );

  if (taskStatusFilter) {

    taskStatusFilter.addEventListener(
      "change",
      renderTasks
    );
  }


  const taskPriorityFilter =
    document.getElementById(
      "taskPriorityFilter"
    );

  if (taskPriorityFilter) {

    taskPriorityFilter.addEventListener(
      "change",
      renderTasks
    );
  }


  const taskSort =
    document.getElementById(
      "taskSort"
    );

  if (taskSort) {

    taskSort.addEventListener(
      "change",
      renderTasks
    );
  }


  /* ---------- 돌아보기 ---------- */

  const reviewLoadButton =
    document.getElementById(
      "reviewLoadButton"
    );

  if (reviewLoadButton) {

    reviewLoadButton.addEventListener(
      "click",
      loadReview
    );
  }


  /* ---------- 다음 행동 ---------- */

  const saveNextActionButton =
    document.getElementById(
      "saveNextActionButton"
    );

  if (saveNextActionButton) {

    saveNextActionButton.addEventListener(
      "click",
      saveNextAction
    );
  }


  /* ---------- Card 5 내보내기 ---------- */

  const exportDataButton =
    document.getElementById(
      "exportDataButton"
    );

  if (exportDataButton) {

    exportDataButton.addEventListener(
      "click",
      exportAllData
    );
  }

}


/* ==================================================
   페이지 초기화
================================================== */

async function initializePage() {

  setupEventListeners();


  await Promise.all([
    loadPlans(),
    loadTasks(),
    loadExecutionRecords(),
    loadPlanHistory()
  ]);


  await loadReview();

}


/* ==================================================
   시작
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  initializePage
);
