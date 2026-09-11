// ==============================
// Supabase 설정
// ==============================

const SUPABASE_URL = "https://ptrsztelwuwrbounfpod.supabase.co";

// Supabase에서 Project Settings → API에서
// Publishable key(또는 anon key)를 복사해서 넣어주세요.
const SUPABASE_KEY = "sb_publishable_I1wduW_WYOxku9iIx6GhEA_10TGX4Dh";


const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==============================
// HTML 요소 가져오기
// ==============================

const form = document.querySelector("form");

const planNameInput = document.getElementById("planName");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const priorityInput = document.getElementById("priority");
const successCriteriaInput =
  document.getElementById("successCriteria");
const estimatedHoursInput =
  document.getElementById("estimatedHours");

const submitButton =
  form.querySelector('button[type="submit"]');


// 현재 수정 중인 계획 ID
let editingPlanId = null;


// ==============================
// 계획 목록 영역 만들기
// ==============================

const planListSection = document.createElement("section");

planListSection.className = "card";

planListSection.innerHTML = `
  <h2>내 계획</h2>

  <div id="planList">
    계획을 불러오는 중입니다...
  </div>
`;

form.parentElement.appendChild(planListSection);


// ==============================
// 계획 이력 영역 만들기
// ==============================

const historySection = document.createElement("section");

historySection.className = "card";

historySection.innerHTML = `
  <h2>수정 이력</h2>

  <div id="historyList">
    계획의 수정 이력을 선택하면 표시됩니다.
  </div>
`;

planListSection.parentElement.appendChild(historySection);

const planList = document.getElementById("planList");
const historyList = document.getElementById("historyList");


// ==============================
// 페이지 처음 열었을 때 계획 불러오기
// ==============================

loadPlans();


// ==============================
// 계획 목록 불러오기
// ==============================

async function loadPlans() {

  planList.innerHTML = "계획을 불러오는 중입니다...";


  const { data, error } = await supabaseClient
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

    planCard.className = "plan-item";


    planCard.innerHTML = `
      <h3>${escapeHTML(plan.plan_name)}</h3>

      <p>
        <strong>기간</strong><br>
        ${plan.start_date} ~ ${plan.end_date}
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


    planList.appendChild(planCard);

  });


  // 수정 버튼
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
                String(plan.id) === String(id)
            );

          if (selectedPlan) {

            startEdit(selectedPlan);

          }

        }
      );

    });


  // 수정 이력 버튼
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
// 계획 저장 / 수정
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


    // ==========================
    // 필수값 확인
    // ==========================

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

      loadPlans();

      return;

    }


    // ==========================
    // 수정 전 기존 계획 가져오기
    // ==========================

    const { data: oldPlan, error: oldPlanError } =
      await supabaseClient
        .from("plans")
        .select("*")
        .eq(
          "id",
          editingPlanId
        )
        .single();


    if (oldPlanError) {

      console.error(oldPlanError);

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


    const { error: historyError } =
      await supabaseClient
        .from("plan_history")
        .insert([historyData]);


    if (historyError) {

      console.error(historyError);

      alert(
        "수정 이력 저장에 실패했습니다."
      );

      return;

    }


    // ==========================
    // 현재 계획 수정
    // ==========================

    const { error: updateError } =
      await supabaseClient
        .from("plans")
        .update(planData)
        .eq(
          "id",
          editingPlanId
        );


    if (updateError) {

       console.error("UPDATE ERROR:", updateError);
      console.error("message:", updateError.message);
      console.error("details:", updateError.details);
      console.error("hint:", updateError.hint);
      console.error("code:", updateError.code);

      alert(
        "계획 수정에 실패했습니다.\n\n" +
        updateError.message
      );

  return;

    }


    alert(
      "계획이 수정되었고 이전 계획은 수정 이력에 저장되었습니다!"
    );


    // 수정 모드 종료
    editingPlanId = null;

    submitButton.textContent =
      "계획 저장";


    form.reset();


    loadPlans();

  }
);


// ==============================
// 수정 시작
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


  const { data, error } =
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

function formatDate(dateString) {

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
