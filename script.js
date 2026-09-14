const SUPABASE_URL = "https://ptrsztelwuwrbounfpod.supabase.co";
const SUPABASE_KEY = "여기에_SUPABASE_PUBLISHABLE_KEY_입력";

const hasPlaceholderKey = !SUPABASE_KEY || SUPABASE_KEY.includes("여기에_");
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let plans = [], tasks = [], histories = [], currentTask = null;
const $ = s => document.querySelector(s);

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  bindEvents();
  if (hasPlaceholderKey) {
    showMessage("Supabase Publishable key를 script.js의 SUPABASE_KEY에 입력해주세요.", "error");
    renderAll();
    return;
  }
  loadAll();
});

function bindEvents() {
  $("#planForm").addEventListener("submit", createPlan);
  $("#taskForm").addEventListener("submit", createTask);
  $("#executeForm").addEventListener("submit", saveExecution);
  $("#refreshBtn").addEventListener("click", loadAll);
  $("#addTaskBtn").addEventListener("click", openTaskModal);
  document.addEventListener("click", e => {
    if (e.target.closest("[data-close-task]")) closeTaskModal();
    if (e.target.closest("[data-close-execute]")) closeExecuteModal();
    const x = e.target.closest("[data-execute]"); if (x) openExecuteModal(x.dataset.execute);
    const d = e.target.closest("[data-delete-task]"); if (d) deleteTask(d.dataset.deleteTask);
    const p = e.target.closest("[data-delete-plan]"); if (p) deletePlan(p.dataset.deletePlan);
    const c = e.target.closest("[data-complete]"); if (c) toggleComplete(c.dataset.complete, c.checked);
  });
}

async function loadAll() {
  if (hasPlaceholderKey) return;
  try {
    const [p,t,h] = await Promise.all([
      supabaseClient.from("plans").select("*").order("created_at", {ascending:false}),
      supabaseClient.from("tasks").select("*").order("created_at", {ascending:true}),
      supabaseClient.from("plan_history").select("*").order("created_at", {ascending:false})
    ]);
    if (p.error) throw p.error; if (t.error) throw t.error; if (h.error) throw h.error;
    plans=p.data||[]; tasks=t.data||[]; histories=h.data||[]; renderAll();
  } catch(e) { console.error(e); showMessage("데이터를 불러오지 못했습니다: "+e.message,"error"); }
}

async function createPlan(e) {
  e.preventDefault();
  const title=$("#planTitle").value.trim(), description=$("#planDescription").value.trim();
  const start_date=$("#startDate").value, end_date=$("#endDate").value;
  const estimated_hours=$("#estimatedHours").value ? Number($("#estimatedHours").value) : null;
  if(end_date<start_date) return showMessage("종료일은 시작일보다 빠를 수 없습니다.","error");
  const {error}=await supabaseClient.from("plans").insert({title,description,start_date,end_date,estimated_hours});
  if(error) return showMessage("계획 저장에 실패했습니다: "+error.message,"error");
  $("#planForm").reset(); setDefaultDates(); await loadAll(); showMessage("계획이 저장되었습니다.");
}

function openTaskModal() {
  if(!plans.length) return showMessage("먼저 계획을 하나 저장해주세요.","error");
  $("#taskPlanId").innerHTML=plans.map(p=>`<option value="${esc(p.id)}">${esc(p.title||"제목 없음")}</option>`).join("");
  $("#taskForm").reset(); $("#taskModal").classList.remove("hidden");
}
function closeTaskModal(){ $("#taskModal").classList.add("hidden"); }

async function createTask(e) {
  e.preventDefault();
  const payload={plan_id:$("#taskPlanId").value,title:$("#taskTitle").value.trim(),memo:$("#taskMemo").value.trim(),completed:false};
  const {error}=await supabaseClient.from("tasks").insert(payload);
  if(error) return showMessage("할 일 저장에 실패했습니다: "+error.message,"error");
  closeTaskModal(); await loadAll(); showMessage("할 일이 저장되었습니다.");
}

function openExecuteModal(id) {
  currentTask=tasks.find(t=>String(t.id)===String(id)); if(!currentTask) return;
  $("#executeTaskId").value=currentTask.id; $("#executeTitle").textContent=currentTask.title||"실행 기록";
  $("#startedAt").value=toLocal(currentTask.started_at)||toLocal(new Date());
  $("#endedAt").value=toLocal(currentTask.ended_at); $("#actualMinutes").value=currentTask.actual_minutes??"";
  $("#blockedReason").value=currentTask.blocked_reason||""; $("#executeModal").classList.remove("hidden");
}
function closeExecuteModal(){ $("#executeModal").classList.add("hidden"); currentTask=null; }

async function saveExecution(e) {
  e.preventDefault(); if(!currentTask) return;
  const s=$("#startedAt").value, en=$("#endedAt").value;
  if(en && new Date(en)<new Date(s)) return showMessage("종료 시간은 시작 시간보다 빠를 수 없습니다.","error");
  let minutes=$("#actualMinutes").value?Number($("#actualMinutes").value):null;
  if(minutes===null && en) minutes=Math.round((new Date(en)-new Date(s))/60000);
  const payload={started_at:s?new Date(s).toISOString():null,ended_at:en?new Date(en).toISOString():null,actual_minutes:minutes,blocked_reason:$("#blockedReason").value.trim()||null,completed:true};
  const wasCompleted=!!currentTask.completed;
  const {error}=await supabaseClient.from("tasks").update(payload).eq("id",currentTask.id);
  if(error) return showMessage("실행 기록 저장에 실패했습니다: "+error.message,"error");
  if(!wasCompleted){
    let h=await supabaseClient.from("plan_history").insert({plan_id:currentTask.plan_id,task_id:currentTask.id,title:currentTask.title,started_at:payload.started_at,ended_at:payload.ended_at,actual_minutes:payload.actual_minutes,blocked_reason:payload.blocked_reason});
    if(h.error){
      h=await supabaseClient.from("plan_history").insert({plan_id:currentTask.plan_id,task_id:currentTask.id,started_at:payload.started_at,ended_at:payload.ended_at,actual_minutes:payload.actual_minutes,blocked_reason:payload.blocked_reason});
      if(h.error) return showMessage("실행 기록은 저장됐지만 history 저장에 실패했습니다: "+h.error.message,"error");
    }
  }
  closeExecuteModal(); await loadAll(); showMessage(wasCompleted?"실행 기록을 수정했습니다. 중복 기록은 만들지 않았습니다.":"실행 기록이 저장되었습니다.");
}

async function toggleComplete(id, checked){
  const {error}=await supabaseClient.from("tasks").update({completed:checked}).eq("id",id);
  if(error) return showMessage("완료 상태 변경 실패: "+error.message,"error"); await loadAll();
}
async function deleteTask(id){
  const t=tasks.find(x=>String(x.id)===String(id)); if(!t||!confirm(`"${t.title}" 할 일을 삭제할까요?`)) return;
  const {error}=await supabaseClient.from("tasks").delete().eq("id",id); if(error) return showMessage("삭제 실패: "+error.message,"error"); await loadAll();
}
async function deletePlan(id){
  const related=tasks.filter(t=>String(t.plan_id)===String(id));
  if(related.length) return showMessage("연결된 할 일을 먼저 삭제해주세요.","error");
  if(!confirm("이 계획을 삭제할까요?")) return;
  const {error}=await supabaseClient.from("plans").delete().eq("id",id); if(error) return showMessage("삭제 실패: "+error.message,"error"); await loadAll();
}

function renderAll(){ $("#totalPlans").textContent=plans.length; $("#historyCount").textContent=histories.length+"건"; renderPlans(); renderHistory(); }
function renderPlans(){
  if(!plans.length){$("#planList").innerHTML='<div class="empty">아직 저장된 계획이 없습니다.</div>';return;}
  $("#planList").innerHTML=plans.map(p=>{
    const ts=tasks.filter(t=>String(t.plan_id)===String(p.id)); const done=ts.filter(t=>t.completed).length;
    return `<div class="plan-item"><div class="plan-main"><div><h4 class="plan-title">${esc(p.title||"제목 없음")}</h4>${p.description?`<p class="plan-desc">${esc(p.description)}</p>`:""}</div><button class="mini-btn danger" data-delete-plan="${esc(p.id)}">삭제</button></div><div class="plan-meta"><span class="badge">${fmtDate(p.start_date)} ~ ${fmtDate(p.end_date)}</span>${p.estimated_hours!=null?`<span class="badge">예상 ${p.estimated_hours}시간</span>`:""}<span class="badge">완료 ${done}/${ts.length}</span></div><div class="task-box">${ts.length?ts.map(renderTask).join(""):'<div class="empty">아직 할 일이 없습니다.</div>'}</div></div>`;
  }).join("");
}
function renderTask(t){return `<div class="task-row"><input class="task-check" type="checkbox" ${t.completed?"checked":""} data-complete="${esc(t.id)}"><div class="task-name ${t.completed?"done":""}">${esc(t.title||"할 일")}${t.memo?`<div class="plan-desc">${esc(t.memo)}</div>`:""}</div><div class="task-actions"><button class="mini-btn primary" data-execute="${esc(t.id)}">${t.completed?"기록 수정":"실행 기록"}</button><button class="mini-btn danger" data-delete-task="${esc(t.id)}">삭제</button></div></div>`;}
function renderHistory(){
  if(!histories.length){$("#historyList").innerHTML='<div class="empty">아직 실행 기록이 없습니다.</div>';return;}
  $("#historyList").innerHTML=histories.map(h=>{const t=tasks.find(x=>String(x.id)===String(h.task_id)),p=plans.find(x=>String(x.id)===String(h.plan_id));return `<div class="history-item"><div><h4>${esc(h.title||t?.title||"실행 기록")}</h4><p>계획: ${esc(p?.title||"계획 없음")}</p><p>시작: ${fmtDateTime(h.started_at)}${h.ended_at?` · 종료: ${fmtDateTime(h.ended_at)}`:""}</p>${h.blocked_reason?`<div class="blocked">막힌 이유: ${esc(h.blocked_reason)}</div>`:""}</div><div class="history-time">${h.actual_minutes!=null?h.actual_minutes+"분":"-"}</div></div>`}).join("");
}
function setDefaultDates(){const d=new Date(),n=new Date(d);n.setDate(d.getDate()+7);$("#startDate").value=dateInput(d);$("#endDate").value=dateInput(n)}
function dateInput(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function toLocal(v){if(!v)return"";const d=new Date(v);if(isNaN(d))return"";return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`}
function fmtDate(v){if(!v)return"-";return new Date(v+"T00:00:00").toLocaleDateString("ko-KR")}
function fmtDateTime(v){if(!v)return"-";return new Date(v).toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function showMessage(text,type="success"){const m=$("#message");m.textContent=text;m.className=`message ${type}`;clearTimeout(showMessage.timer);showMessage.timer=setTimeout(()=>m.classList.add("hidden"),4500)}
