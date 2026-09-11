const SUPABASE_URL =
"https://ptrsztelwuwrbounfpod.supabase.co";

const SUPABASE_KEY =
"sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";

const supabaseClient =
supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

// ==================================================
// 공통 함수
// ==================================================

function escapeHTML(text) {

const div =
document.createElement("div");

div.textContent =
text ?? "";

return div.innerHTML;

}

function formatDate(dateString) {

if (!dateString) {
return "없음";
}

const date =
new Date(dateString);

return date.toLocaleString(
"ko-KR"
);

}

// ==================================================
// Plan — 계획 세우기
// ==================================================

const planForm =
document.getElementById(
"planForm"
);

const planNameInput =
document.getElementById(
"planName"
);

const startDateInput =
document.getElementById(
"startDate"
);

const endDateInput =
document.getElementById(
"endDate"
);

const priorityInput =
document.getElementById(
"priority"
);

const successCriteriaInput =
document.getElementById(
"successCriteria"
);

const estimatedHoursInput =
document.getElementById(
"estimatedHours"
);

const planSubmitButton =
planForm.querySelector(
'button[type="submit"]'
);

let editingPlanId =
null;

// ==================================================
// 계획 목록 영역 생성
// ==================================================

const planListSection =
document.createElement(
"section"
);

planListSection.innerHTML = `

  <h2>내 계획</h2>

  <div id="planList">
    계획을 불러오는 중입니다...
  </div>

  <hr>
`;

planForm.insertAdjacentElement(
"afterend",
planListSection
);

const planList =
document.getElementById(
"planList"
);

// ==================================================
// 수정 이력 영역 생성
// ==================================================

const historySection =
document.createElement(
"section"
);

historySection.innerHTML = `

  <h2>수정 이력</h2>

  <div id="historyList">
    계획의 수정 이력을 선택하면 표시됩니다.
  </div>

  <hr>
`;

planListSection.insertAdjacentElement(
"afterend",
historySection
);

const historyList =
document.getElementById(
"historyList"
);

// ==================================================
// 계획 불러오기
// ==================================================

async function loadPlans() {

planList.innerHTML =
"계획을 불러오는 중입니다...";

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
ascending: false
}
);

if (error) {


console.error(
  "PLAN SELECT ERROR:",
  error
);

planList.innerHTML =
  "계획을 불러오지 못했습니다.";

return;

}

if (
!data ||
data.length === 0
) {

planList.innerHTML =
  "아직 저장된 계획이 없습니다.";

return;

}

planList.innerHTML =
"";

data.forEach(
(plan) => {

  const item =
    document.createElement(
      "div"
    );


  item.innerHTML = `

    <h3>
      ${escapeHTML(
        plan.plan_name
      )}
    </h3>

    <p>
      기간:
      ${plan.start_date}
      ~
      ${plan.end_date}
    </p>

    <p>
      우선순위:
      ${escapeHTML(
        plan.priority
      )}
    </p>

    <p>
      성공 기준:
      ${escapeHTML(
        plan.success_criteria
      )}
    </p>

    <p>
      예상 시간:
      ${plan.estimated_hours}시간
    </p>
    ${
  plan.next_action
    ? `
      <p>
        다음에 고칠 점:
        ${escapeHTML(
          plan.next_action
        )}
      </p>
    `
    : ""
}

    <button
      type="button"
      class="edit-plan-button"
      data-id="${plan.id}"
    >
      수정
    </button>

    <button
      type="button"
      class="history-plan-button"
      data-id="${plan.id}"
    >
      수정 이력 보기
    </button>

    <hr>

  `;


  planList.appendChild(
    item
  );

}

);

document
.querySelectorAll(
".edit-plan-button"
)
.forEach(
(button) => {


    button.addEventListener(
      "click",
      () => {

        const selectedPlan =
          data.find(
            (plan) =>
              String(plan.id) ===
              String(button.dataset.id)
          );


        if (selectedPlan) {

          startPlanEdit(
            selectedPlan
          );

        }

      }
    );

  }
);

document
.querySelectorAll(
".history-plan-button"
)
.forEach(
(button) => {

    button.addEventListener(
      "click",
      () => {

        loadHistory(
          button.dataset.id
        );

      }
    );

  }
);

}

// ==================================================
// 계획 저장 / 수정
// ==================================================

planForm.addEventListener(
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


if (
  !planData.plan_name ||
  !planData.start_date ||
  !planData.end_date ||
  !planData.success_criteria ||
  planData.estimated_hours <= 0
) {

  alert(
    "모든 항목을 입력해주세요."
  );

  return;

}


// 새 계획 저장

if (!editingPlanId) {

  const {
    error
  } =
    await supabaseClient
      .from("plans")
      .insert([
        planData
      ]);


  if (error) {

    console.error(
      "PLAN INSERT ERROR:",
      error
    );

    alert(
      "계획 저장에 실패했습니다.\n\n" +
      error.message
    );

    return;

  }


  alert(
    "계획이 저장되었습니다!"
  );


  planForm.reset();

  await loadPlans();

  await loadTaskPlans();

  return;

}


// 기존 계획 불러오기

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
    "PLAN LOAD ERROR:",
    oldPlanError
  );

  alert(
    "기존 계획을 불러오지 못했습니다."
  );

  return;

}


// 수정 전 데이터를 이력에 저장

const {
  error: historyError
} =
  await supabaseClient
    .from("plan_history")
    .insert([
      {
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
      }
    ]);


if (historyError) {

  console.error(
    "HISTORY INSERT ERROR:",
    historyError
  );

  alert(
    "수정 이력 저장에 실패했습니다.\n\n" +
    historyError.message
  );

  return;

}


// 현재 계획 수정

const {
  error: updateError
} =
  await supabaseClient
    .from("plans")
    .update(
      planData
    )
    .eq(
      "id",
      editingPlanId
    );


if (updateError) {

  console.error(
    "PLAN UPDATE ERROR:",
    updateError
  );

  alert(
    "계획 수정에 실패했습니다.\n\n" +
    updateError.message
  );

  return;

}


alert(
  "계획이 수정되었습니다!"
);


editingPlanId =
  null;


planSubmitButton.textContent =
  "계획 저장";


planForm.reset();


await loadPlans();

await loadTaskPlans();


}
);

// ==================================================
// 계획 수정 시작
// ==================================================

function startPlanEdit(plan) {

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

planSubmitButton.textContent =
"계획 수정 저장";

window.scrollTo({
top: 0,
behavior: "smooth"
});

}

// ==================================================
// 수정 이력 불러오기
// ==================================================

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


console.error(
  "HISTORY SELECT ERROR:",
  error
);

historyList.innerHTML =
  "수정 이력을 불러오지 못했습니다.";

return;


}

if (
!data ||
data.length === 0
) {


historyList.innerHTML =
  "아직 수정 이력이 없습니다.";

return;


}

historyList.innerHTML =
"";

data.forEach(
(history) => {


  historyList.innerHTML += `

    <div>

      <h3>
        ${escapeHTML(
          history.plan_name
        )}
      </h3>

      <p>
        기간:
        ${history.start_date}
        ~
        ${history.end_date}
      </p>

      <p>
        우선순위:
        ${escapeHTML(
          history.priority
        )}
      </p>

      <p>
        성공 기준:
        ${escapeHTML(
          history.success_criteria
        )}
      </p>

      <p>
        예상 시간:
        ${history.estimated_hours}시간
      </p>

      <p>
        기록 시간:
        ${formatDate(
          history.changed_at
        )}
      </p>

      <hr>

    </div>

  `;

}

);

}

// ==================================================
// Do — 할 일
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

const taskSort =
document.getElementById(
"taskSort"
);

let editingTaskId =
null;

// ==================================================
// 계획 목록을 할 일 선택창에 표시
// ==================================================

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
  "TASK PLAN SELECT ERROR:",
  error
);

return;


}

taskPlanId.innerHTML = `     <option value="">
      계획을 선택하세요     </option>
  `;

taskPlanFilter.innerHTML = `     <option value="">
      전체 계획     </option>
  `;

data.forEach(
(plan) => {


  const option = `
    <option value="${plan.id}">
      ${escapeHTML(
        plan.plan_name
      )}
    </option>
  `;


  taskPlanId.innerHTML +=
    option;


  taskPlanFilter.innerHTML +=
    option;

}

);

}

// ==================================================
// 할 일 저장 / 수정
// ==================================================

taskForm.addEventListener(
"submit",
async (event) => {


event.preventDefault();


const taskData = {

  plan_id:
    Number(
      taskPlanId.value
    ),

  task_name:
    document
      .getElementById(
        "taskName"
      )
      .value
      .trim(),

  due_date:
    document
      .getElementById(
        "taskDueDate"
      )
      .value ||
    null,

  priority:
    document
      .getElementById(
        "taskPriority"
      )
      .value,

  tag:
    document
      .getElementById(
        "taskTag"
      )
      .value
      .trim() ||
    null,

  estimated_hours:
    Number(
      document
        .getElementById(
          "taskEstimatedHours"
        )
        .value
    ) || 0

};


if (
  !taskData.task_name ||
  !taskData.plan_id
) {

  alert(
    "할 일과 계획을 입력해주세요."
  );

  return;

}


let error;


if (!editingTaskId) {

  const result =
    await supabaseClient
      .from("tasks")
      .insert([
        taskData
      ]);


  error =
    result.error;

} else {

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
    "TASK SAVE ERROR:",
    error
  );

  alert(
    "할 일 저장에 실패했습니다.\n\n" +
    error.message
  );

  return;

}


alert(
  editingTaskId
    ? "할 일이 수정되었습니다!"
    : "할 일이 추가되었습니다!"
);


editingTaskId =
  null;


taskForm.reset();


taskForm
  .querySelector(
    'button[type="submit"]'
  )
  .textContent =
  "할 일 추가";


await loadTasks();

await loadExecutionTaskOptions();

}
);

// ==================================================
// 할 일 목록 불러오기
// ==================================================

async function loadTasks() {

const searchText =
taskSearch
.value
.trim()
.toLowerCase();

const selectedPlanId =
taskPlanFilter.value;

const selectedStatus =
taskStatusFilter.value;

const selectedPriority =
taskPriorityFilter.value;

const selectedSort =
taskSort.value;

const {
data,
error
} =
await supabaseClient
.from("tasks")
.select("*");

if (error) {


console.error(
  "TASK SELECT ERROR:",
  error
);

taskList.innerHTML =
  "할 일을 불러오지 못했습니다.";

return;


}

const filteredTasks =
data.filter(
(task) => {


    const matchesSearch =
      task.task_name
        .toLowerCase()
        .includes(
          searchText
        );


    const matchesPlan =
      !selectedPlanId ||
      String(task.plan_id) ===
      String(selectedPlanId);


    const taskStatus =
      task.is_completed
        ? "완료"
        : "진행 중";


    const matchesStatus =
      !selectedStatus ||
      taskStatus ===
      selectedStatus;


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


if (
selectedSort ===
"created_desc"
) {


filteredTasks.sort(
  (a, b) =>
    new Date(b.created_at) -
    new Date(a.created_at)
);

}

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
  (a, b) =>
    (priorityOrder[b.priority] || 0) -
    (priorityOrder[a.priority] || 0)
);


}

if (
selectedSort ===
"hours_asc"
) {


filteredTasks.sort(
  (a, b) =>
    Number(
      a.estimated_hours || 0
    ) -
    Number(
      b.estimated_hours || 0
    )
);


}

if (
selectedSort ===
"hours_desc"
) {


filteredTasks.sort(
  (a, b) =>
    Number(
      b.estimated_hours || 0
    ) -
    Number(
      a.estimated_hours || 0
    )
);


}

taskList.innerHTML =
"";

if (
filteredTasks.length === 0
) {


taskList.innerHTML =
  "<p>검색 또는 필터 결과가 없습니다.</p>";

return;


}

filteredTasks.forEach(
(task) => {


  taskList.innerHTML += `

    <div>

      <h3>
        ${escapeHTML(
          task.task_name
        )}
      </h3>

      <p>
        마감일:
        ${task.due_date || "없음"}
      </p>

      <p>
        우선순위:
        ${escapeHTML(
          task.priority
        )}
      </p>

      <p>
        태그:
        ${escapeHTML(
          task.tag || "없음"
        )}
      </p>

      <p>
        예상 시간:
        ${task.estimated_hours || 0}시간
      </p>

      <p>
        상태:
        ${
          task.is_completed
            ? "완료"
            : "진행 중"
        }
      </p>

      <button
        type="button"
        onclick="startTaskEdit(${task.id})"
      >
        수정
      </button>

      <button
        type="button"
        onclick="toggleTaskComplete(${task.id})"
      >
        ${
          task.is_completed
            ? "진행 중으로 변경"
            : "완료"
        }
      </button>

      <button
        type="button"
        onclick="deleteTask(${task.id})"
      >
        삭제
      </button>

      <button
        type="button"
        onclick="showTaskExecutions(${task.id})"
      >
        실행 기록 보기
      </button>

      <hr>

    </div>

  `;

}


);

}

// ==================================================
// 검색 / 필터 / 정렬 이벤트
// ==================================================

taskSearch.addEventListener(
"input",
loadTasks
);

taskPlanFilter.addEventListener(
"change",
loadTasks
);

taskStatusFilter.addEventListener(
"change",
loadTasks
);

taskPriorityFilter.addEventListener(
"change",
loadTasks
);

taskSort.addEventListener(
"change",
loadTasks
);

// ==================================================
// 할 일 수정
// ==================================================

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
  "할 일을 불러오지 못했습니다."
);

return;


}

document
.getElementById(
"taskName"
)
.value =
task.task_name;

taskPlanId.value =
task.plan_id;

document
.getElementById(
"taskDueDate"
)
.value =
task.due_date || "";

document
.getElementById(
"taskPriority"
)
.value =
task.priority;

document
.getElementById(
"taskTag"
)
.value =
task.tag || "";

document
.getElementById(
"taskEstimatedHours"
)
.value =
task.estimated_hours || 0;

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

// ==================================================
// 완료 처리
// 중복 클릭으로 완료 기록이 여러 번 생성되는 것 방지
// ==================================================

let completingTaskIds =
new Set();

async function toggleTaskComplete(
taskId
) {

if (
completingTaskIds.has(
taskId
)
) {
return;
}

completingTaskIds.add(
taskId
);

try {


const {
  data: task,
  error: taskError
} =
  await supabaseClient
    .from("tasks")
    .select(
      "id, is_completed"
    )
    .eq(
      "id",
      taskId
    )
    .single();


if (taskError) {
  throw taskError;
}


// 진행 중 → 완료

if (!task.is_completed) {

  const {
    data: updatedTasks,
    error: updateError
  } =
    await supabaseClient
      .from("tasks")
      .update({
        is_completed:
          true
      })
      .eq(
        "id",
        taskId
      )
      .eq(
        "is_completed",
        false
      )
      .select();


  if (updateError) {
    throw updateError;
  }


  // 이미 다른 요청에서 완료했다면
  // 완료 기록을 추가하지 않음

  if (
    !updatedTasks ||
    updatedTasks.length === 0
  ) {

    await loadTasks();

    return;

  }


  // 기존 완료 기록 확인

  const {
    data: existingRecords,
    error: recordCheckError
  } =
    await supabaseClient
      .from("execution_records")
      .select(
        "id"
      )
      .eq(
        "task_id",
        taskId
      )
      .eq(
        "is_completion_record",
        true
      )
      .limit(
        1
      );


  if (recordCheckError) {
    throw recordCheckError;
  }


  // 완료 기록이 없을 때만 생성

  if (
    !existingRecords ||
    existingRecords.length === 0
  ) {

    const now =
      new Date()
        .toISOString();


    const {
      error: insertError
    } =
      await supabaseClient
        .from("execution_records")
        .insert([
          {
            task_id:
              taskId,

            started_at:
              now,

            ended_at:
              now,

            actual_minutes:
              0,

            blocked_reason:
              null,

            is_completion_record:
              true
          }
        ]);


    if (insertError) {
      throw insertError;
    }

  }


  alert(
    "할 일이 완료되었습니다!"
  );

}


// 완료 → 진행 중

else {

  const {
    error
  } =
    await supabaseClient
      .from("tasks")
      .update({
        is_completed:
          false
      })
      .eq(
        "id",
        taskId
      );


  if (error) {
    throw error;
  }


  alert(
    "진행 중으로 변경되었습니다."
  );

}


await loadTasks();

await loadExecutionRecords();


} catch (error) {


console.error(
  "COMPLETE ERROR:",
  error
);


alert(
  "완료 상태 변경에 실패했습니다.\n\n" +
  error.message
);


} finally {


completingTaskIds.delete(
  taskId
);


}

}

window.toggleTaskComplete =
toggleTaskComplete;

// ==================================================
// 할 일 삭제
// ==================================================

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
  "삭제에 실패했습니다.\n\n" +
  error.message
);

return;


}

alert(
"할 일이 삭제되었습니다."
);

await loadTasks();

await loadExecutionTaskOptions();

}

window.deleteTask =
deleteTask;

// ==================================================
// See — 실행 기록
// ==================================================

const executionForm =
document.getElementById(
"executionForm"
);

const executionTaskId =
document.getElementById(
"executionTaskId"
);

const startedAt =
document.getElementById(
"startedAt"
);

const endedAt =
document.getElementById(
"endedAt"
);

const actualMinutes =
document.getElementById(
"actualMinutes"
);

const blockedReason =
document.getElementById(
"blockedReason"
);

const executionList =
document.getElementById(
"executionList"
);

// ==================================================
// 실행 기록용 할 일 목록
// ==================================================

async function loadExecutionTaskOptions() {

const {
data,
error
} =
await supabaseClient
.from("tasks")
.select(
"id, task_name"
)
.order(
"created_at",
{
ascending: false
}
);

if (error) {

console.error(
  "EXECUTION TASK SELECT ERROR:",
  error
);

return;


}

executionTaskId.innerHTML = `     <option value="">
      할 일을 선택하세요     </option>
  `;

data.forEach(
(task) => {


  executionTaskId.innerHTML += `

    <option value="${task.id}">
      ${escapeHTML(
        task.task_name
      )}
    </option>

  `;

}


);

}

// ==================================================
// 실행 기록 저장
// ==================================================

executionForm.addEventListener(
"submit",
async (event) => {


event.preventDefault();


const taskId =
  executionTaskId.value;


const start =
  startedAt.value;


const end =
  endedAt.value;


const minutes =
  Number(
    actualMinutes.value
  );


const reason =
  blockedReason
    .value
    .trim() ||
  null;


if (
  !taskId ||
  !start ||
  !end
) {

  alert(
    "할 일, 시작 시각, 끝난 시각을 입력해주세요."
  );

  return;

}


const startDate =
  new Date(
    start
  );


const endDate =
  new Date(
    end
  );


if (
  endDate <
  startDate
) {

  alert(
    "끝난 시각은 시작 시각보다 빠를 수 없습니다."
  );

  return;

}


let finalMinutes =
  minutes;


// 실제 시간 미입력 시 자동 계산

if (
  !finalMinutes ||
  finalMinutes <= 0
) {

  finalMinutes =
    Math.round(
      (
        endDate -
        startDate
      ) /
      60000
    );

}


const {
  error
} =
  await supabaseClient
    .from("execution_records")
    .insert([
      {
        task_id:
          Number(taskId),

        started_at:
          startDate.toISOString(),

        ended_at:
          endDate.toISOString(),

        actual_minutes:
          finalMinutes,

        blocked_reason:
          reason,

        is_completion_record:
          false
      }
    ]);


if (error) {

  console.error(
    "EXECUTION INSERT ERROR:",
    error
  );

  alert(
    "실행 기록 저장에 실패했습니다.\n\n" +
    error.message
  );

  return;

}


alert(
  "실행 기록이 저장되었습니다!"
);


executionForm.reset();


await loadExecutionRecords();


}
);

// ==================================================
// 전체 실행 기록 불러오기
// ==================================================

async function loadExecutionRecords() {

executionList.innerHTML =
"실행 기록을 불러오는 중입니다...";

const {
data,
error
} =
await supabaseClient
.from("execution_records")
.select(`         *,
        tasks (
          task_name
        )
      `)
.order(
"created_at",
{
ascending: false
}
);

if (error) {


console.error(
  "EXECUTION SELECT ERROR:",
  error
);

executionList.innerHTML =
  "실행 기록을 불러오지 못했습니다.";

return;


}

if (
!data ||
data.length === 0
) {


executionList.innerHTML =
  "아직 실행 기록이 없습니다.";

return;


}

executionList.innerHTML =
"";

data.forEach(
(record) => {


  const typeText =
    record.is_completion_record
      ? "완료 기록"
      : "실행 기록";


  executionList.innerHTML += `

    <div>

      <h3>
        ${escapeHTML(
          record.tasks?.task_name ||
          "삭제된 할 일"
        )}
      </h3>

      <p>
        기록 종류:
        ${typeText}
      </p>

      <p>
        시작 시각:
        ${formatDate(
          record.started_at
        )}
      </p>

      <p>
        끝난 시각:
        ${formatDate(
          record.ended_at
        )}
      </p>

      <p>
        실제 걸린 시간:
        ${record.actual_minutes || 0}분
      </p>

      <p>
        막혔던 이유:
        ${escapeHTML(
          record.blocked_reason ||
          "없음"
        )}
      </p>

      <hr>

    </div>

  `;

}


);

}

// ==================================================
// 특정 할 일의 실행 기록 보기
// ==================================================

async function showTaskExecutions(
taskId
) {

const {
data,
error
} =
await supabaseClient
.from("execution_records")
.select("*")
.eq(
"task_id",
taskId
)
.order(
"created_at",
{
ascending: false
}
);

if (error) {


console.error(
  "TASK EXECUTION SELECT ERROR:",
  error
);

alert(
  "실행 기록을 불러오지 못했습니다."
);

return;


}

if (
!data ||
data.length === 0
) {


alert(
  "이 할 일에는 아직 실행 기록이 없습니다."
);

return;


}

executionList.innerHTML =
"";

data.forEach(
(record) => {


  const typeText =
    record.is_completion_record
      ? "완료 기록"
      : "실행 기록";


  executionList.innerHTML += `

    <div>

      <p>
        기록 종류:
        ${typeText}
      </p>

      <p>
        시작:
        ${formatDate(
          record.started_at
        )}
      </p>

      <p>
        종료:
        ${formatDate(
          record.ended_at
        )}
      </p>

      <p>
        실제 시간:
        ${record.actual_minutes || 0}분
      </p>

      <p>
        막힌 이유:
        ${escapeHTML(
          record.blocked_reason ||
          "없음"
        )}
      </p>

      <hr>

    </div>

  `;

}

);

executionList.scrollIntoView({
behavior: "smooth"
});

}

window.showTaskExecutions =
showTaskExecutions;

// ==================================================
// See — 돌아보기
// Card 4
// ==================================================

const reviewSummary =
  document.getElementById(
    "reviewSummary"
  );

const reviewEvidence =
  document.getElementById(
    "reviewEvidence"
  );

const reviewPlanFilter =
  document.getElementById(
    "reviewPlanFilter"
  );

const reviewStartDate =
  document.getElementById(
    "reviewStartDate"
  );

const reviewEndDate =
  document.getElementById(
    "reviewEndDate"
  );

const reviewLoadButton =
  document.getElementById(
    "reviewLoadButton"
  );

const nextActionInput =
  document.getElementById(
    "nextActionInput"
  );

const nextPlanSelect =
  document.getElementById(
    "nextPlanSelect"
  );

const saveNextActionButton =
  document.getElementById(
    "saveNextActionButton"
  );

const nextActionResult =
  document.getElementById(
    "nextActionResult"
  );


// ==================================================
// 서울 기준 오늘 날짜
// ==================================================

function getSeoulToday() {

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Seoul"
    }
  ).format(
    new Date()
  );

}


// ==================================================
// 돌아보기 날짜 기본값
// ==================================================

function setReviewDefaultDates() {

  const today =
    getSeoulToday();

  reviewStartDate.value =
    today;

  reviewEndDate.value =
    today;

}


// ==================================================
// 돌아보기 계획 선택창
// ==================================================

async function loadReviewPlanOptions() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("plans")
      .select(
        "id, plan_name, start_date, end_date"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "REVIEW PLAN SELECT ERROR:",
      error
    );

    return;

  }


  reviewPlanFilter.innerHTML = `
    <option value="">
      전체 계획
    </option>
  `;


  nextPlanSelect.innerHTML = `
    <option value="">
      다음 계획을 선택하세요
    </option>
  `;


  data.forEach(
    (plan) => {

      const option = `
        <option value="${plan.id}">
          ${escapeHTML(
            plan.plan_name
          )}
        </option>
      `;


      reviewPlanFilter.innerHTML +=
        option;


      nextPlanSelect.innerHTML +=
        option;

    }
  );

}


// ==================================================
// 돌아보기 집계
// ==================================================

async function loadReviewSummary() {

  reviewSummary.innerHTML =
    "돌아보기 정보를 불러오는 중입니다...";


  reviewEvidence.innerHTML =
    "집계 숫자를 클릭하면 해당 기록이 표시됩니다.";


  const selectedPlanId =
    reviewPlanFilter.value;


  const startDate =
    reviewStartDate.value;


  const endDate =
    reviewEndDate.value;


  if (
    startDate &&
    endDate &&
    startDate > endDate
  ) {

    reviewSummary.innerHTML =
      "시작일은 종료일보다 늦을 수 없습니다.";

    return;

  }


  // ==================================================
  // 할 일 조회
  // ==================================================

  let taskQuery =
    supabaseClient
      .from("tasks")
      .select(`
        *,
        plans (
          id,
          plan_name
        )
      `);


  if (selectedPlanId) {

    taskQuery =
      taskQuery.eq(
        "plan_id",
        Number(
          selectedPlanId
        )
      );

  }


  const {
    data: tasks,
    error: taskError
  } =
    await taskQuery;


  if (taskError) {

    console.error(
      "REVIEW TASK SELECT ERROR:",
      taskError
    );

    reviewSummary.innerHTML =
      "돌아보기 할 일을 불러오지 못했습니다.";

    return;

  }


  // ==================================================
  // 기간 필터
  // ==================================================

  const filteredTasks =
    (tasks || []).filter(
      (task) => {

        // 삭제된 데이터는 현재 tasks에 없으므로
        // 존재하는 task만 대상으로 함

        if (
          startDate &&
          task.due_date &&
          task.due_date < startDate
        ) {

          return false;

        }


        if (
          endDate &&
          task.due_date &&
          task.due_date > endDate
        ) {

          return false;

        }


        return true;

      }
    );


  // ==================================================
  // 계획 수
  // = 대상 계획에 딸린 현재 task 수
  // ==================================================

  const planCount =
    filteredTasks.length;


  // ==================================================
  // 완료 수
  // ==================================================

  const completedTasks =
    filteredTasks.filter(
      (task) =>
        task.is_completed === true
    );


  const completedCount =
    completedTasks.length;


  // ==================================================
  // 지연 수
  //
  // 완료되지 않았고
  // 서울 기준 오늘보다 마감일이 이전인 task
  // ==================================================

  const today =
    getSeoulToday();


  const delayedTasks =
    filteredTasks.filter(
      (task) => {

        if (
          task.is_completed
        ) {

          return false;

        }


        if (
          !task.due_date
        ) {

          return false;

        }


        return (
          task.due_date <
          today
        );

      }
    );


  const delayedCount =
    delayedTasks.length;


  // ==================================================
  // 실행 기록 조회
  // ==================================================

  const taskIds =
    filteredTasks.map(
      (task) =>
        task.id
    );


  let executionRecords =
    [];


  if (
    taskIds.length > 0
  ) {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("execution_records")
        .select(`
          *,
          tasks (
            id,
            task_name,
            plan_id,
            estimated_hours,
            due_date,
            is_completed
          )
        `)
        .in(
          "task_id",
          taskIds
        )
        .eq(
          "is_completion_record",
          false
        );


    if (error) {

      console.error(
        "REVIEW EXECUTION SELECT ERROR:",
        error
      );

      reviewSummary.innerHTML =
        "실행 기록을 불러오지 못했습니다.";

      return;

    }


    executionRecords =
      data || [];

  }


  // ==================================================
  // 막힘 수
  //
  // 막힌 이유가 하나라도 있는 task를
  // 한 번만 계산
  // ==================================================

  const blockedTaskIds =
    new Set();


  executionRecords.forEach(
    (record) => {

      if (
        record.blocked_reason &&
        record.blocked_reason.trim()
      ) {

        blockedTaskIds.add(
          record.task_id
        );

      }

    }
  );


  const blockedTasks =
    filteredTasks.filter(
      (task) =>
        blockedTaskIds.has(
          task.id
        )
    );


  const blockedCount =
    blockedTasks.length;


  // ==================================================
  // 예상 시간
  // ==================================================

  const estimatedHours =
    filteredTasks.reduce(
      (
        total,
        task
      ) =>
        total +
        Number(
          task.estimated_hours || 0
        ),
      0
    );


  // ==================================================
  // 실제 시간
  //
  // 실행 기록 actual_minutes 합계
  // 분 → 시간
  // ==================================================

  const actualMinutesTotal =
    executionRecords.reduce(
      (
        total,
        record
      ) =>
        total +
        Number(
          record.actual_minutes || 0
        ),
      0
    );


  const actualHours =
    actualMinutesTotal /
    60;


  // ==================================================
  // 예상 대비 실제 차이
  // ==================================================

  const differenceHours =
    actualHours -
    estimatedHours;


  // ==================================================
  // 숫자 표시
  // ==================================================

  reviewSummary.innerHTML = `

    <div>

      <h3>
        돌아보기 결과
      </h3>

      <p>
        기간:
        ${startDate || "전체"}
        ~
        ${endDate || "전체"}
      </p>

      <p>
        계획 수:
        <button
          type="button"
          onclick="showReviewEvidence('plan')"
        >
          <strong>
            ${planCount}개
          </strong>
        </button>
      </p>

      <p>
        완료 수:
        <button
          type="button"
          onclick="showReviewEvidence('completed')"
        >
          <strong>
            ${completedCount}개
          </strong>
        </button>
      </p>

      <p>
        지연 수:
        <button
          type="button"
          onclick="showReviewEvidence('delayed')"
        >
          <strong>
            ${delayedCount}개
          </strong>
        </button>
      </p>

      <p>
        막힘 수:
        <button
          type="button"
          onclick="showReviewEvidence('blocked')"
        >
          <strong>
            ${blockedCount}개
          </strong>
        </button>
      </p>

      <hr>

      <p>
        예상 시간:
        <strong>
          ${estimatedHours.toFixed(1)}시간
        </strong>
      </p>

      <p>
        실제 시간:
        <strong>
          ${actualHours.toFixed(1)}시간
        </strong>
      </p>

      <p>
        차이:
        <strong>
          ${
            differenceHours >= 0
              ? "+"
              : ""
          }${differenceHours.toFixed(1)}시간
        </strong>
      </p>

    </div>

  `;


  // ==================================================
  // 현재 집계 데이터를 저장
  // 숫자 클릭 시 사용
  // ==================================================

  window.currentReviewData = {

    tasks:
      filteredTasks,

    completedTasks,

    delayedTasks,

    blockedTasks,

    executionRecords

  };

}


// ==================================================
// 숫자 클릭 → 근거 기록
// T06-C83
// ==================================================

async function showReviewEvidence(
  type
) {

  const data =
    window.currentReviewData;


  if (!data) {

    reviewEvidence.innerHTML =
      "먼저 돌아보기를 불러와 주세요.";

    return;

  }


  let title =
    "";

  let tasks =
    [];


  if (
    type === "plan"
  ) {

    title =
      "대상 할 일";

    tasks =
      data.tasks;

  }


  if (
    type === "completed"
  ) {

    title =
      "완료한 할 일";

    tasks =
      data.completedTasks;

  }


  if (
    type === "delayed"
  ) {

    title =
      "지연된 할 일";

    tasks =
      data.delayedTasks;

  }


  if (
    type === "blocked"
  ) {

    title =
      "막힌 할 일";

    tasks =
      data.blockedTasks;

  }


  if (
    !tasks ||
    tasks.length === 0
  ) {

    reviewEvidence.innerHTML = `

      <h4>
        ${title}
      </h4>

      <p>
        해당 기록이 없습니다.
      </p>

    `;

    reviewEvidence.scrollIntoView({
      behavior: "smooth"
    });

    return;

  }


  reviewEvidence.innerHTML = `

    <h4>
      ${title}
    </h4>

  `;


  tasks.forEach(
    (task) => {

      const executionCount =
        data.executionRecords.filter(
          (record) =>
            record.task_id ===
            task.id
        ).length;


      reviewEvidence.innerHTML += `

        <div>

          <h4>
            ${escapeHTML(
              task.task_name
            )}
          </h4>

          <p>
            계획:
            ${escapeHTML(
              task.plans?.plan_name ||
              "계획 없음"
            )}
          </p>

          <p>
            마감일:
            ${task.due_date || "없음"}
          </p>

          <p>
            예상 시간:
            ${Number(
              task.estimated_hours || 0
            ).toFixed(1)}시간
          </p>

          <p>
            상태:
            ${
              task.is_completed
                ? "완료"
                : "진행 중"
            }
          </p>

          <p>
            실행 기록:
            ${executionCount}건
          </p>

          <button
            type="button"
            onclick="showTaskExecutions(${task.id})"
          >
            이 할 일의 실행 기록 보기
          </button>

          <hr>

        </div>

      `;

    }
  );


  reviewEvidence.scrollIntoView({
    behavior: "smooth"
  });

}


window.showReviewEvidence =
  showReviewEvidence;


// ==================================================
// 다음 계획에 고칠 점 저장
// T06-C33
// ==================================================

saveNextActionButton.addEventListener(
  "click",
  async () => {

    const action =
      nextActionInput
        .value
        .trim();


    const nextPlanId =
      nextPlanSelect.value;


    if (!action) {

      alert(
        "고칠 점을 한 줄 입력해주세요."
      );

      return;

    }


    if (!nextPlanId) {

      alert(
        "고칠 점을 반영할 다음 계획을 선택해주세요."
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
            action
        })
        .eq(
          "id",
          Number(
            nextPlanId
          )
        );


    if (error) {

      console.error(
        "NEXT ACTION UPDATE ERROR:",
        error
      );

      alert(
        "다음 계획에 반영하지 못했습니다.\n\n" +
        error.message
      );

      return;

    }


    nextActionResult.innerHTML = `

      <p>
        ✅ 다음 계획에 반영했습니다.
      </p>

      <p>
        <strong>
          ${escapeHTML(
            action
          )}
        </strong>
      </p>

    `;


    nextActionInput.value = "";

    await loadPlans();

  }
);


// ==================================================
// 페이지 시작
// ==================================================

async function initializePage() {

  setReviewDefaultDates();

  await loadPlans();

  await loadTaskPlans();

  await loadTasks();

  await loadExecutionTaskOptions();

  await loadExecutionRecords();

  await loadReviewPlanOptions();

  await loadReviewSummary();

}

initializePage();
