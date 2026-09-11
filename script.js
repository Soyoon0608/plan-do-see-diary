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
// Plan
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

let editingPlanId = null;

// ==================================================
// 계획 목록 생성
// ==================================================

const planListSection =
document.createElement(
"section"
);

planListSection.innerHTML = `

  <hr>

  <h2>내 계획</h2>

  <div id="planList">
    계획을 불러오는 중입니다...
  </div>
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

  <hr>

  <h2>수정 이력</h2>

  <div id="historyList">
    계획의 수정 이력을 선택하면 표시됩니다.
  </div>
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

```
console.error(
  "PLAN SELECT ERROR:",
  error
);

planList.innerHTML =
  "계획을 불러오지 못했습니다.";

return;
```

}

if (
!data ||
data.length === 0
) {

```
planList.innerHTML =
  "아직 저장된 계획이 없습니다.";

return;
```

}

planList.innerHTML = "";

data.forEach(
(plan) => {

```
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

    <button
      class="edit-plan-button"
      data-id="${plan.id}"
    >
      수정
    </button>

    <button
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
```

);

document
.querySelectorAll(
".edit-plan-button"
)
.forEach(
(button) => {

```
    button.addEventListener(
      "click",
      () => {

        const id =
          button.dataset.id;


        const selectedPlan =
          data.find(
            (plan) =>
              String(
                plan.id
              ) ===
              String(
                id
              )
          );


        if (
          selectedPlan
        ) {

          startPlanEdit(
            selectedPlan
          );

        }

      }
    );

  }
);
```

document
.querySelectorAll(
".history-plan-button"
)
.forEach(
(button) => {

```
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
```

}

// ==================================================
// 계획 저장 / 수정
// ==================================================

planForm.addEventListener(
"submit",
async (event) => {

```
event.preventDefault();


const planData = {

  plan_name:
    planNameInput
      .value
      .trim(),

  start_date:
    startDateInput
      .value,

  end_date:
    endDateInput
      .value,

  priority:
    priorityInput
      .value,

  success_criteria:
    successCriteriaInput
      .value
      .trim(),

  estimated_hours:
    Number(
      estimatedHoursInput
        .value
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


// 새 계획

if (
  !editingPlanId
) {

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
      error
    );

    alert(
      "계획 저장에 실패했습니다."
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


// 기존 계획 가져오기

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


if (
  oldPlanError
) {

  console.error(
    oldPlanError
  );

  alert(
    "기존 계획을 불러오지 못했습니다."
  );

  return;

}


// 수정 이력 저장

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


if (
  historyError
) {

  console.error(
    historyError
  );

  alert(
    "수정 이력 저장에 실패했습니다."
  );

  return;

}


// 계획 수정

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


if (
  updateError
) {

  console.error(
    updateError
  );

  alert(
    "계획 수정에 실패했습니다."
  );

  return;

}


alert(
  "계획이 수정되었습니다!"
);


editingPlanId = null;


planSubmitButton.textContent =
  "계획 저장";


planForm.reset();


await loadPlans();

await loadTaskPlans();
```

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
// 수정 이력
// ==================================================

async function loadHistory(
planId
) {

historyList.innerHTML =
"수정 이력을 불러오는 중입니다...";

const {
data,
error
} =
await supabaseClient
.from(
"plan_history"
)
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

if (
error
) {

```
console.error(
  error
);

historyList.innerHTML =
  "수정 이력을 불러오지 못했습니다.";

return;
```

}

if (
!data ||
data.length === 0
) {

```
historyList.innerHTML =
  "아직 수정 이력이 없습니다.";

return;
```

}

historyList.innerHTML = "";

data.forEach(
(history) => {

```
  historyList.innerHTML += `

    <div>

      <strong>
        ${escapeHTML(
          history.plan_name
        )}
      </strong>

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
```

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
// 계획 목록을 Task 선택창에 표시
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

if (
error
) {

```
console.error(
  error
);

return;
```

}

taskPlanId.innerHTML = `     <option value="">
      계획을 선택하세요     </option>
  `;

taskPlanFilter.innerHTML = `     <option value="">
      전체 계획     </option>
  `;

data.forEach(
(plan) => {

```
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
```

);

}

// ==================================================
// 할 일 저장 / 수정
// ==================================================

taskForm.addEventListener(
"submit",
async (event) => {

```
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


if (
  !editingTaskId
) {

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


if (
  error
) {

  console.error(
    error
  );

  alert(
    "할 일 저장에 실패했습니다.\n\n" +
    error.message
  );

  return;

}


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
```

}
);

// ==================================================
// 할 일 불러오기
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

if (
error
) {

```
console.error(
  error
);

return;
```

}

const filteredTasks =
data.filter(
(task) => {

```
    const matchesSearch =
      task.task_name
        .toLowerCase()
        .includes(
          searchText
        );


    const matchesPlan =
      !selectedPlanId ||
      String(
        task.plan_id
      ) ===
      String(
        selectedPlanId
      );


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
```

// 최근 추가순

if (
selectedSort ===
"created_desc"
) {

```
filteredTasks.sort(
  (a, b) =>
    new Date(
      b.created_at
    ) -
    new Date(
      a.created_at
    )
);
```

}

// 마감일 빠른 순

if (
selectedSort ===
"due_asc"
) {

```
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
```

}

// 우선순위

if (
selectedSort ===
"priority_desc"
) {

```
const priorityOrder = {

  "높음": 3,
  "보통": 2,
  "낮음": 1

};


filteredTasks.sort(
  (a, b) =>
    priorityOrder[
      b.priority
    ] -
    priorityOrder[
      a.priority
    ]
);
```

}

// 예상 시간 적은 순

if (
selectedSort ===
"hours_asc"
) {

```
filteredTasks.sort(
  (a, b) =>
    Number(
      a.estimated_hours || 0
    ) -
    Number(
      b.estimated_hours || 0
    )
);
```

}

// 예상 시간 많은 순

if (
selectedSort ===
"hours_desc"
) {

```
filteredTasks.sort(
  (a, b) =>
    Number(
      b.estimated_hours || 0
    ) -
    Number(
      a.estimated_hours || 0
    )
);
```

}

taskList.innerHTML =
"";

if (
filteredTasks.length === 0
) {

```
taskList.innerHTML =
  "<p>검색 또는 필터 결과가 없습니다.</p>";

return;
```

}

filteredTasks.forEach(
(task) => {

```
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
        onclick="startTaskEdit(${task.id})"
      >
        수정
      </button>


      <button
        onclick="toggleTaskComplete(${task.id})"
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


      <button
        onclick="showTaskExecutions(${task.id})"
      >
        실행 기록 보기
      </button>


      <hr>

    </div>

  `;

}
```

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

if (
error
) {

```
console.error(
  error
);

return;
```

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
task.due_date ||
"";

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
task.tag ||
"";

document
.getElementById(
"taskEstimatedHours"
)
.value =
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

// ==================================================
// 완료 처리 + 중복 완료 기록 방지
// ==================================================

let completingTaskIds =
new Set();

async function toggleTaskComplete(
taskId
) {

// 연속 클릭 방지

if (
completingTaskIds.has(
taskId
)
) {

```
return;
```

}

completingTaskIds.add(
taskId
);

try {

```
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


if (
  taskError
) {

  throw taskError;

}


// ==================================================
// 진행 중 → 완료
// ==================================================

if (
  !task.is_completed
) {

  // 먼저 완료 상태 변경
  // 조건까지 걸어서 중복 완료 방지

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


  if (
    updateError
  ) {

    throw updateError;

  }


  // 이미 다른 클릭이 완료했다면
  // 완료 기록 추가하지 않음

  if (
    !updatedTasks ||
    updatedTasks.length === 0
  ) {

    await loadTasks();

    return;

  }


  // 기존 완료 기록 확인

  const {
    data: existingRecord,
    error: recordCheckError
  } =
    await supabaseClient
      .from(
        "execution_records"
      )
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


  if (
    recordCheckError
  ) {

    throw recordCheckError;

  }


  // 완료 기록이 없을 때만 생성

  if (
    !existingRecord ||
    existingRecord.length === 0
  ) {

    const now =
      new Date()
        .toISOString();


    const {
      error: insertError
    } =
      await supabaseClient
        .from(
          "execution_records"
        )
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


    if (
      insertError
    ) {

      throw insertError;

    }

  }


  alert(
    "할 일이 완료되었습니다!"
  );

}


// ==================================================
// 완료 → 진행 중
// ==================================================

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


  if (
    error
  ) {

    throw error;

  }


  alert(
    "진행 중으로 변경되었습니다."
  );

}


await loadTasks();

await loadExecutionRecords();
```

} catch (
error
) {

```
console.error(
  "COMPLETE ERROR:",
  error
);


alert(
  "완료 상태 변경에 실패했습니다.\n\n" +
  error.message
);
```

} finally {

```
completingTaskIds.delete(
  taskId
);
```

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

```
return;
```

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

if (
error
) {

```
console.error(
  error
);

alert(
  "삭제에 실패했습니다."
);

return;
```

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

if (
error
) {

```
console.error(
  error
);

return;
```

}

executionTaskId.innerHTML = `     <option value="">
      할 일을 선택하세요     </option>
  `;

data.forEach(
(task) => {

```
  executionTaskId.innerHTML += `

    <option value="${task.id}">
      ${escapeHTML(
        task.task_name
      )}
    </option>

  `;

}
```

);

}

// ==================================================
// 실행 기록 저장
// ==================================================

executionForm.addEventListener(
"submit",
async (event) => {

```
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
    .from(
      "execution_records"
    )
    .insert([
      {
        task_id:
          Number(
            taskId
          ),

        started_at:
          startDate
            .toISOString(),

        ended_at:
          endDate
            .toISOString(),

        actual_minutes:
          finalMinutes,

        blocked_reason:
          reason,

        is_completion_record:
          false
      }
    ]);


if (
  error
) {

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
```

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
.from(
"execution_records"
)
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

if (
error
) {

```
console.error(
  "EXECUTION SELECT ERROR:",
  error
);

executionList.innerHTML =
  "실행 기록을 불러오지 못했습니다.";

return;
```

}

if (
!data ||
data.length === 0
) {

```
executionList.innerHTML =
  "아직 실행 기록이 없습니다.";

return;
```

}

executionList.innerHTML =
"";

data.forEach(
(record) => {

```
  const typeText =
    record.is_completion_record
      ? "완료 기록"
      : "실행 기록";


  executionList.innerHTML += `

    <div>

      <h3>
        ${
          escapeHTML(
            record.tasks?.task_name ||
            "삭제된 할 일"
          )
        }
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
        ${
          escapeHTML(
            record.blocked_reason ||
            "없음"
          )
        }
      </p>


      <hr>

    </div>

  `;

}
```

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
.from(
"execution_records"
)
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

if (
error
) {

```
console.error(
  error
);

alert(
  "실행 기록을 불러오지 못했습니다."
);

return;
```

}

if (
!data ||
data.length === 0
) {

```
alert(
  "이 할 일에는 아직 실행 기록이 없습니다."
);

return;
```

}

executionList.innerHTML =
"";

data.forEach(
(record) => {

```
  executionList.innerHTML += `

    <div>

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
        ${
          escapeHTML(
            record.blocked_reason ||
            "없음"
          )
        }
      </p>

      <hr>

    </div>

  `;

}
```

);

document
.getElementById(
"executionList"
)
.scrollIntoView({
behavior: "smooth"
});

}

window.showTaskExecutions =
showTaskExecutions;

// ==================================================
// 페이지 시작
// ==================================================

async function initializePage() {

await loadPlans();

await loadTaskPlans();

await loadTasks();

await loadExecutionTaskOptions();

await loadExecutionRecords();

}

initializePage();
