
// ==============================
// Supabase 설정
// ==============================

const SUPABASE_URL =
  "https://ptrsztelwuwrbounfpod.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==============================
// Plan — HTML 요소
// ==============================

const form = document.querySelector("form");

const planNameInput =
  document.getElementById("planName");

const startDateInput =
  document.getElementById("startDate");

const endDateInput =
  document.getElementById("endDate");

const priorityInput =
  document.getElementById("priority");

const successCriteriaInput =
  document.getElementById("successCriteria");

const estimatedHoursInput =
  document.getElementById("estimatedHours");

const submitButton =
  form.querySelector('button[type="submit"]');


// 현재 수정 중인 계획 ID
let editingPlanId = null;


// ==============================
// 계획 목록 영역
// ==============================

const planListSection =
  document.createElement("section");

planListSection.className = "card";

planListSection.innerHTML = `
  <h2>내 계획</h2>

  <div id="planList">
    계획을 불러오는 중입니다...
  </div>
`;

form.parentElement.appendChild(
  planListSection
);


const planList =
  document.getElementById("planList");


// ==============================
// 계획 이력 영역
// ==============================

const historySection =
  document.createElement("section");

historySection.className = "card";

historySection.innerHTML = `
  <h2>수정 이력</h2>

  <div id="historyList">
    계획의 수정 이력을 선택하면 표시됩니다.
  </div>
`;

planListSection.parentElement.appendChild(
  historySection
);


const historyList =
  document.getElementById("historyList");


// ==============================
// 계획 목록 불러오기
// ==============================

async function loadPlans() {

  planList.innerHTML =
    "계획을 불러오는 중입니다...";


  const { data, error } =
    await supabaseClient
      .from("plans")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(error);

    planList.innerHTML = `
      <p>
        계획을 불러오지 못했습니다.
      </p>
    `;

    return;
  }


  if (!data || data.length === 0) {

    planList.innerHTML = `
      <p>
        아직 저장된 계획이 없습니다.
      </p>
    `;

    return;
  }


  planList.innerHTML = "";


  data.forEach((plan) => {

    const planCard =
      document.createElement("div");

    planCard.className =
      "plan-item";


    planCard.innerHTML = `
      <h3>
        ${escapeHTML(plan.plan_name)}
      </h3>

      <p>
        <strong>기간</strong><br>
        ${plan.start_date}
        ~
        ${plan.end_date}
      </p>

      <p>
        <strong>우선순위</strong><br>
        ${escapeHTML(plan.priority)}
      </p>

      <p>
        <strong>성공 기준</strong><br>
        ${escapeHTML(plan.success_criteria)}
      </p>

      <p>
        <strong>예상 시간</strong><br>
        ${plan.estimated_hours}시간
      </p>

      <button
        class="edit-button"
        data-id="${plan.id}"
      >
        수정
      </button>

      <button
        class="history-button"
        data-id="${plan.id}"
      >
        수정 이력 보기
      </button>

      <hr>
    `;


    planList.appendChild(
      planCard
    );

  });


  // ==========================
  // 계획 수정 버튼
  // ==========================

  document
    .querySelectorAll(".edit-button")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          const selectedPlan =
            data.find(
              (plan) =>
                String(plan.id) ===
                String(id)
            );

          if (selectedPlan) {

            startEdit(
              selectedPlan
            );

          }

        }
      );

    });


  // ==========================
  // 수정 이력 버튼
  // ==========================

  document
    .querySelectorAll(".history-button")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          loadHistory(
            button.dataset.id
          );

        }
      );

    });

}


// ==============================
// Plan — 저장 / 수정
// ==============================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const planData = {

      plan_name:
        planNameInput.value.trim(),

      start_date:
        startDateInput.value,

      end_date:
        endDateInput.value,

      priority:
        priorityInput.value,

      success_criteria:
        successCriteriaInput.value.trim(),

      estimated_hours:
        Number(
          estimatedHoursInput.value
        )

    };


    // 필수값 확인

    if (
      !planData.plan_name ||
      !planData.start_date ||
      !planData.end_date ||
      !planData.success_criteria ||
      !planData.estimated_hours
    ) {

      alert(
        "모든 항목을 입력해주세요."
      );

      return;
    }


    // ==========================
    // 새 계획 저장
    // ==========================

    if (!editingPlanId) {

      const { error } =
        await supabaseClient
          .from("plans")
          .insert([planData]);


      if (error) {

        console.error(error);

        alert(
          "계획 저장에 실패했습니다."
        );

        return;
      }


      alert(
        "계획이 저장되었습니다!"
      );


      form.reset();

      await loadPlans();

      await loadTaskPlans();

      return;
    }


    // ==========================
    // 기존 계획 가져오기
    // ==========================

    const {
      data: oldPlan,
      error: oldPlanError
    } =
      await supabaseClient
        .from("plans")
        .select("*")
        .eq(
          "id",
          editingPlanId
        )
        .single();


    if (oldPlanError) {

      console.error(
        oldPlanError
      );

      alert(
        "기존 계획을 불러오지 못했습니다."
      );

      return;
    }


    // ==========================
    // 수정 전 계획을 이력에 저장
    // ==========================

    const historyData = {

      plan_id:
        oldPlan.id,

      plan_name:
        oldPlan.plan_name,

      start_date:
        oldPlan.start_date,

      end_date:
        oldPlan.end_date,

      priority:
        oldPlan.priority,

      success_criteria:
        oldPlan.success_criteria,

      estimated_hours:
        oldPlan.estimated_hours

    };


    const {
      error: historyError
    } =
      await supabaseClient
        .from("plan_history")
        .insert([
          historyData
        ]);


    if (historyError) {

      console.error(
        historyError
      );

      alert(
        "수정 이력 저장에 실패했습니다."
      );

      return;
    }


    // ==========================
    // 현재 계획 수정
    // ==========================

    const {
      error: updateError
    } =
      await supabaseClient
        .from("plans")
        .update(planData)
        .eq(
          "id",
          editingPlanId
        );


    if (updateError) {

      console.error(
        "UPDATE ERROR:",
        updateError
      );

      alert(
        "계획 수정에 실패했습니다.\n\n" +
        updateError.message
      );

      return;
    }


    alert(
      "계획이 수정되었고 이전 계획은 수정 이력에 저장되었습니다!"
    );


    editingPlanId = null;

    submitButton.textContent =
      "계획 저장";

    form.reset();

    await loadPlans();

    await loadTaskPlans();

  }
);


// ==============================
// 계획 수정 시작
// ==============================

function startEdit(plan) {

  editingPlanId =
    plan.id;

  planNameInput.value =
    plan.plan_name;

  startDateInput.value =
    plan.start_date;

  endDateInput.value =
    plan.end_date;

  priorityInput.value =
    plan.priority;

  successCriteriaInput.value =
    plan.success_criteria;

  estimatedHoursInput.value =
    plan.estimated_hours;


  submitButton.textContent =
    "계획 수정 저장";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ==============================
// 수정 이력 불러오기
// ==============================

async function loadHistory(planId) {

  historyList.innerHTML =
    "수정 이력을 불러오는 중입니다...";


  const {
    data,
    error
  } =
    await supabaseClient
      .from("plan_history")
      .select("*")
      .eq(
        "plan_id",
        planId
      )
      .order(
        "changed_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(error);

    historyList.innerHTML = `
      <p>
        수정 이력을 불러오지 못했습니다.
      </p>
    `;

    return;
  }


  if (!data || data.length === 0) {

    historyList.innerHTML = `
      <p>
        아직 수정 이력이 없습니다.
      </p>
    `;

    return;
  }


  historyList.innerHTML = "";


  data.forEach((history) => {

    const historyItem =
      document.createElement("div");

    historyItem.className =
      "history-item";


    historyItem.innerHTML = `

      <h3>
        ${escapeHTML(
          history.plan_name
        )}
      </h3>

      <p>
        <strong>기간</strong><br>
        ${history.start_date}
        ~
        ${history.end_date}
      </p>

      <p>
        <strong>우선순위</strong><br>
        ${escapeHTML(
          history.priority
        )}
      </p>

      <p>
        <strong>성공 기준</strong><br>
        ${escapeHTML(
          history.success_criteria
        )}
      </p>

      <p>
        <strong>예상 시간</strong><br>
        ${history.estimated_hours}시간
      </p>

      <p>
        <strong>수정 전 기록 저장 시간</strong><br>
        ${formatDate(
          history.changed_at
        )}
      </p>

      <hr>

    `;


    historyList.appendChild(
      historyItem
    );

  });

}


// ==============================
// 날짜 표시
// ==============================

function formatDate(
  dateString
) {

  const date =
    new Date(dateString);

  return date.toLocaleString(
    "ko-KR"
  );

}


// ==============================
// HTML 특수문자 처리
// ==============================

function escapeHTML(text) {

  const div =
    document.createElement("div");

  div.textContent =
    text ?? "";

  return div.innerHTML;

}


// ==================================================
// Card 2 — Do / 할 일 관리
// ==================================================

const taskForm =
  document.getElementById(
    "taskForm"
  );

const taskPlanId =
  document.getElementById(
    "taskPlanId"
  );

const taskList =
  document.getElementById(
    "taskList"
  );

const taskSearch =
  document.getElementById(
    "taskSearch"
  );


// ==============================
// C19 필터 요소
// ==============================

const taskPlanFilter =
  document.getElementById(
    "taskPlanFilter"
  );

const taskStatusFilter =
  document.getElementById(
    "taskStatusFilter"
  );

const taskPriorityFilter =
  document.getElementById(
    "taskPriorityFilter"
  );


// ==============================
// C20 정렬 요소
// ==============================

const taskSort =
  document.getElementById(
    "taskSort"
  );


let editingTaskId = null;


// ==============================
// 계획 목록을 선택창에 표시
// ==============================

async function loadTaskPlans() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("plans")
      .select(
        "id, plan_name"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "계획 불러오기 오류:",
      error
    );

    return;
  }


  // 할 일 추가용 선택창

  taskPlanId.innerHTML = `
    <option value="">
      계획을 선택하세요
    </option>
  `;


  // C19 계획 필터

  taskPlanFilter.innerHTML = `
    <option value="">
      전체 계획
    </option>
  `;


  data.forEach(
    (plan) => {

      taskPlanId.innerHTML += `
        <option value="${plan.id}">
          ${escapeHTML(
            plan.plan_name
          )}
        </option>
      `;


      taskPlanFilter.innerHTML += `
        <option value="${plan.id}">
          ${escapeHTML(
            plan.plan_name
          )}
        </option>
      `;

    }
  );

}


// ==============================
// 할 일 추가 / 수정
// ==============================

taskForm.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    const taskName =
      document
        .getElementById(
          "taskName"
        )
        .value
        .trim();


    const planId =
      taskPlanId.value;


    const dueDate =
      document
        .getElementById(
          "taskDueDate"
        )
        .value ||
      null;


    const priority =
      document
        .getElementById(
          "taskPriority"
        )
        .value;


    const tag =
      document
        .getElementById(
          "taskTag"
        )
        .value
        .trim() ||
      null;


    const estimatedHours =
      Number(
        document
          .getElementById(
            "taskEstimatedHours"
          )
          .value
      ) || 0;


    if (
      !taskName ||
      !planId
    ) {

      alert(
        "할 일과 계획을 입력해주세요."
      );

      return;
    }


    const taskData = {

      plan_id:
        Number(planId),

      task_name:
        taskName,

      due_date:
        dueDate,

      priority:
        priority,

      tag:
        tag,

      estimated_hours:
        estimatedHours

    };


    let error;


    // ==========================
    // 새 할 일 추가
    // ==========================

    if (!editingTaskId) {

      const result =
        await supabaseClient
          .from("tasks")
          .insert(
            taskData
          );

      error =
        result.error;

    }


    // ==========================
    // 기존 할 일 수정
    // ==========================

    else {

      const result =
        await supabaseClient
          .from("tasks")
          .update(
            taskData
          )
          .eq(
            "id",
            editingTaskId
          );

      error =
        result.error;

    }


    if (error) {

      console.error(
        "TASK ERROR:",
        error
      );


      if (editingTaskId) {

        alert(
          "할 일 수정에 실패했습니다.\n\n" +
          error.message
        );

      } else {

        alert(
          "할 일 추가에 실패했습니다.\n\n" +
          error.message
        );

      }

      return;
    }


    if (editingTaskId) {

      alert(
        "할 일이 수정되었습니다!"
      );

    } else {

      alert(
        "할 일이 추가되었습니다!"
      );

    }


    editingTaskId = null;


    taskForm.reset();


    taskForm
      .querySelector(
        'button[type="submit"]'
      )
      .textContent =
      "할 일 추가";


    await loadTasks();

  }
);


// ==============================
// 할 일 목록 불러오기
// ==============================

async function loadTasks() {

  // ==========================
  // C18 검색
  // ==========================

  const searchText =
    taskSearch
      .value
      .trim()
      .toLowerCase();


  // ==========================
  // C19 필터
  // ==========================

  const selectedPlanId =
    taskPlanFilter.value;

  const selectedStatus =
    taskStatusFilter.value;

  const selectedPriority =
    taskPriorityFilter.value;


  // ==========================
  // C20 정렬
  // ==========================

  const selectedSort =
    taskSort.value;


  // ==========================
  // Supabase에서 데이터 가져오기
  // ==========================

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
          ascending: false
        }
      );


  if (error) {

    console.error(
      "TASK SELECT ERROR:",
      error
    );

    return;
  }


  // ==========================
  // C18 + C19 검색 / 필터
  // ==========================

  const filteredTasks =
    data.filter(
      (task) => {

        // 검색
        const matchesSearch =
          task.task_name
            .toLowerCase()
            .includes(
              searchText
            );


        // 계획
        const matchesPlan =
          !selectedPlanId ||
          String(task.plan_id) ===
          String(selectedPlanId);


        // 상태
        const taskStatus =
          task.is_completed
            ? "완료"
            : "진행 중";


        const matchesStatus =
          !selectedStatus ||
          taskStatus ===
          selectedStatus;


        // 우선순위
        const matchesPriority =
          !selectedPriority ||
          task.priority ===
          selectedPriority;


        return (
          matchesSearch &&
          matchesPlan &&
          matchesStatus &&
          matchesPriority
        );

      }
    );


  // ==========================
  // C20 정렬
  // ==========================

  // 최근 추가순
  if (
    selectedSort ===
    "created_desc"
  ) {

    filteredTasks.sort(
      (a, b) => {

        return (
          new Date(b.created_at) -
          new Date(a.created_at)
        );

      }
    );

  }


  // 마감일 빠른 순
  if (
    selectedSort ===
    "due_asc"
  ) {

    filteredTasks.sort(
      (a, b) => {

        if (!a.due_date) {
          return 1;
        }

        if (!b.due_date) {
          return -1;
        }

        return a.due_date.localeCompare(
          b.due_date
        );

      }
    );

  }


  // 우선순위 높은 순
  if (
    selectedSort ===
    "priority_desc"
  ) {

    const priorityOrder = {

      "높음": 3,

      "보통": 2,

      "낮음": 1

    };


    filteredTasks.sort(
      (a, b) => {

        return (
          (priorityOrder[b.priority] || 0) -
          (priorityOrder[a.priority] || 0)
        );

      }
    );

  }


  // 예상 시간 적은 순
  if (
    selectedSort ===
    "hours_asc"
  ) {

    filteredTasks.sort(
      (a, b) => {

        return (
          Number(
            a.estimated_hours || 0
          ) -
          Number(
            b.estimated_hours || 0
          )
        );

      }
    );

  }


  // 예상 시간 많은 순
  if (
    selectedSort ===
    "hours_desc"
  ) {

    filteredTasks.sort(
      (a, b) => {

        return (
          Number(
            b.estimated_hours || 0
          ) -
          Number(
            a.estimated_hours || 0
          )
        );

      }
    );

  }


  // ==========================
  // 결과 표시
  // ==========================

  taskList.innerHTML = "";


  if (
    filteredTasks.length === 0
  ) {

    taskList.innerHTML = `
      <p>
        검색 또는 필터 결과가 없습니다.
      </p>
    `;

    return;
  }


  filteredTasks.forEach(
    (task) => {

      taskList.innerHTML += `

        <div>

          <strong>
            ${escapeHTML(
              task.task_name
            )}
          </strong>

          <p>

            마감일:
            ${task.due_date || "없음"}

            <br>

            우선순위:
            ${escapeHTML(
              task.priority ||
              "보통"
            )}

            <br>

            태그:
            ${escapeHTML(
              task.tag ||
              "없음"
            )}

            <br>

            예상 시간:
            ${task.estimated_hours || 0}시간

            <br>

            상태:
            ${
              task.is_completed
                ? "완료"
                : "진행 중"
            }

          </p>


          <button
            onclick="startTaskEdit(${task.id})"
          >
            수정
          </button>


          <button
            onclick="toggleTaskComplete(
              ${task.id},
              ${task.is_completed}
            )"
          >
            ${
              task.is_completed
                ? "진행 중으로 변경"
                : "완료"
            }
          </button>


          <button
            onclick="deleteTask(${task.id})"
          >
            삭제
          </button>

        </div>

        <hr>

      `;

    }
  );

}


// ==============================
// C18 검색 즉시 실행
// ==============================

taskSearch.addEventListener(
  "input",
  () => {

    loadTasks();

  }
);


// ==============================
// C19 계획 필터
// ==============================

taskPlanFilter.addEventListener(
  "change",
  () => {

    loadTasks();

  }
);


// ==============================
// C19 상태 필터
// ==============================

taskStatusFilter.addEventListener(
  "change",
  () => {

    loadTasks();

  }
);


// ==============================
// C19 우선순위 필터
// ==============================

taskPriorityFilter.addEventListener(
  "change",
  () => {

    loadTasks();

  }
);


// ==============================
// C20 정렬
// ==============================

taskSort.addEventListener(
  "change",
  () => {

    loadTasks();

  }
);


// ==============================
// 할 일 수정
// ==============================

async function startTaskEdit(
  taskId
) {

  const {
    data: task,
    error
  } =
    await supabaseClient
      .from("tasks")
      .select("*")
      .eq(
        "id",
        taskId
      )
      .single();


  if (error) {

    console.error(
      "TASK LOAD ERROR:",
      error
    );

    alert(
      "할 일을 불러오지 못했습니다.\n\n" +
      error.message
    );

    return;
  }


  document.getElementById(
    "taskName"
  ).value =
    task.task_name || "";


  document.getElementById(
    "taskPlanId"
  ).value =
    task.plan_id || "";


  document.getElementById(
    "taskDueDate"
  ).value =
    task.due_date || "";


  document.getElementById(
    "taskPriority"
  ).value =
    task.priority ||
    "보통";


  document.getElementById(
    "taskTag"
  ).value =
    task.tag || "";


  document.getElementById(
    "taskEstimatedHours"
  ).value =
    task.estimated_hours ||
    0;


  editingTaskId =
    taskId;


  taskForm
    .querySelector(
      'button[type="submit"]'
    )
    .textContent =
    "할 일 수정 저장";


  taskForm.scrollIntoView({
    behavior: "smooth"
  });

}


window.startTaskEdit =
  startTaskEdit;


// ==============================
// 완료 / 진행 중 변경
// ==============================

async function toggleTaskComplete(
  taskId,
  currentStatus
) {

  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .update({
        is_completed:
          !currentStatus
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

    alert(
      "완료 상태 변경에 실패했습니다.\n\n" +
      error.message
    );

    return;
  }


  await loadTasks();

}


window.toggleTaskComplete =
  toggleTaskComplete;


// ==============================
// 할 일 삭제
// ==============================

async function deleteTask(
  taskId
) {

  if (
    !confirm(
      "이 할 일을 삭제하시겠습니까?"
    )
  ) {

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

    alert(
      "할 일 삭제에 실패했습니다.\n\n" +
      error.message
    );

    return;
  }


  alert(
    "할 일이 삭제되었습니다."
  );


  await loadTasks();

}


window.deleteTask =
  deleteTask;


// ==============================
// 페이지 처음 열었을 때
// ==============================

loadPlans();

loadTaskPlans();

loadTasks();

