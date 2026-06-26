const bank = window.QUESTION_BANK;

const moduleConfig = {
  single: { label: "单选模块", tag: "单选题" },
  multiple: { label: "多选模块", tag: "多选题" },
  judge: { label: "判断模块", tag: "判断题" },
};

const state = {
  currentModule: null,
  orderMode: "sequential",
  sessionQuestions: [],
  currentIndex: 0,
  selected: [],
  revealed: false,
  stats: { done: 0, correct: 0, wrong: 0 },
};

const moduleList = document.getElementById("moduleList");
const metaCard = document.getElementById("metaCard");
const emptyState = document.getElementById("emptyState");
const quizApp = document.getElementById("quizApp");
const moduleTitle = document.getElementById("moduleTitle");
const progressText = document.getElementById("progressText");
const scoreboard = document.getElementById("scoreboard");
const questionTag = document.getElementById("questionTag");
const sourceTag = document.getElementById("sourceTag");
const questionStem = document.getElementById("questionStem");
const options = document.getElementById("options");
const feedback = document.getElementById("feedback");
const multiActions = document.getElementById("multiActions");
const submitMultiBtn = document.getElementById("submitMultiBtn");
const clearMultiBtn = document.getElementById("clearMultiBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const toggleOrderBtn = document.getElementById("toggleOrderBtn");
const showAnswerBtn = document.getElementById("showAnswerBtn");

function getOptionList(question) {
  return question.type === "judge"
    ? [
        { key: "T", text: "正确" },
        { key: "F", text: "错误" },
      ]
    : question.options;
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildMetaCard() {
  const counts = bank.meta.counts;
  metaCard.innerHTML = `
    <div class="stats-grid">
      <div class="meta-item">
        <span class="muted">题库总量</span>
        <strong>${bank.meta.total}</strong>
      </div>
      <div class="meta-item">
        <span class="muted">单选题</span>
        <strong>${counts.single || 0}</strong>
      </div>
      <div class="meta-item">
        <span class="muted">多选题</span>
        <strong>${counts.multiple || 0}</strong>
      </div>
      <div class="meta-item">
        <span class="muted">判断题</span>
        <strong>${counts.judge || 0}</strong>
      </div>
    </div>
  `;
}

function renderModuleList() {
  moduleList.innerHTML = "";
  Object.entries(moduleConfig).forEach(([key, config]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `module-btn ${state.currentModule === key ? "is-active" : ""}`;
    button.innerHTML = `
      <strong>${config.label}</strong>
      <span>${bank.questions[key].length} 题</span>
    `;
    button.addEventListener("click", () => startModule(key));
    moduleList.appendChild(button);
  });
}

function buildSession(moduleKey) {
  const source = bank.questions[moduleKey];
  return state.orderMode === "random" ? shuffle(source) : [...source];
}

function startModule(moduleKey) {
  state.currentModule = moduleKey;
  state.currentIndex = 0;
  state.selected = [];
  state.revealed = false;
  state.stats = { done: 0, correct: 0, wrong: 0 };
  state.sessionQuestions = buildSession(moduleKey);
  renderModuleList();
  renderCurrentQuestion();
}

function getCurrentQuestion() {
  return state.sessionQuestions[state.currentIndex] || null;
}

function answerToText(question) {
  if (question.type === "judge") {
    return question.answer;
  }
  return question.answer.split("").join("、");
}

function selectedToText(question) {
  if (!state.selected.length) {
    return "未作答";
  }
  if (question.type === "judge") {
    const selectedOption = getOptionList(question).find((item) => item.key === state.selected[0]);
    return selectedOption ? selectedOption.text : "未作答";
  }
  return [...state.selected].sort().join("、");
}

function updateScoreboard() {
  const accuracy = state.stats.done
    ? `${Math.round((state.stats.correct / state.stats.done) * 100)}%`
    : "0%";
  scoreboard.innerHTML = `
    <div class="score-chip"><span class="muted">已作答</span><strong>${state.stats.done}</strong></div>
    <div class="score-chip"><span class="muted">答对</span><strong>${state.stats.correct}</strong></div>
    <div class="score-chip"><span class="muted">答错</span><strong>${state.stats.wrong}</strong></div>
    <div class="score-chip"><span class="muted">正确率</span><strong>${accuracy}</strong></div>
  `;
}

function renderFeedback(question, isCorrect, revealedOnly = false) {
  feedback.classList.remove("hidden", "is-correct", "is-wrong");
  feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
  const title = revealedOnly ? "已显示答案" : isCorrect ? "回答正确" : "回答错误";
  const detail = revealedOnly
    ? `正确答案：${answerToText(question)}`
    : `你的答案：${selectedToText(question)}　|　正确答案：${answerToText(question)}`;
  feedback.innerHTML = `
    <p class="feedback__title">${title}</p>
    <p class="feedback__detail">${detail}</p>
  `;
}

function renderOptions(question) {
  options.innerHTML = "";
  const optionList = getOptionList(question);
  optionList.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";

    if (state.selected.includes(option.key)) {
      button.classList.add("is-selected");
    }

    if (state.revealed) {
      const correctKeys = question.type === "judge"
        ? [question.answer === "正确" ? "T" : "F"]
        : question.answer.split("");
      if (correctKeys.includes(option.key)) {
        button.classList.add("is-correct");
      } else if (state.selected.includes(option.key)) {
        button.classList.add("is-wrong");
      }
      button.disabled = true;
    }

    button.innerHTML = `<span class="option-key">${option.key}</span><span>${option.text}</span>`;
    button.addEventListener("click", () => handleOptionClick(question, option.key));
    options.appendChild(button);
  });
}

function renderCurrentQuestion() {
  const question = getCurrentQuestion();
  if (!question) {
    emptyState.classList.remove("hidden");
    quizApp.classList.add("hidden");
    emptyState.innerHTML = `
      <h2>${moduleConfig[state.currentModule].label}已完成</h2>
      <p>本轮已刷完。可以重新开始，或者切换到其他模块继续。</p>
    `;
    return;
  }

  emptyState.classList.add("hidden");
  quizApp.classList.remove("hidden");

  moduleTitle.textContent = moduleConfig[state.currentModule].label;
  progressText.textContent = `第 ${state.currentIndex + 1} / ${state.sessionQuestions.length} 题`;
  questionTag.textContent = moduleConfig[state.currentModule].tag;
  sourceTag.textContent = `来源：${question.sources.join("、")}`;
  questionStem.textContent = `${state.currentIndex + 1}. ${question.stem}`;
  toggleOrderBtn.textContent = state.orderMode === "random" ? "切换为顺序" : "切换为随机";
  feedback.classList.add("hidden");
  nextBtn.disabled = !state.revealed;
  showAnswerBtn.disabled = state.revealed;
  multiActions.classList.toggle("hidden", question.type !== "multiple" || state.revealed);

  renderOptions(question);
  updateScoreboard();
}

function evaluateAnswer(question, revealedOnly = false) {
  if (state.revealed) {
    return;
  }

  state.revealed = true;
  let isCorrect = false;

  if (question.type === "multiple") {
    isCorrect = [...state.selected].sort().join("") === question.answer;
  } else if (question.type === "judge") {
    const expected = question.answer === "正确" ? "T" : "F";
    isCorrect = state.selected[0] === expected;
  } else {
    isCorrect = state.selected[0] === question.answer;
  }

  if (!revealedOnly) {
    state.stats.done += 1;
    state.stats[isCorrect ? "correct" : "wrong"] += 1;
  }

  renderOptions(question);
  renderFeedback(question, isCorrect, revealedOnly);
  updateScoreboard();
  nextBtn.disabled = false;
  showAnswerBtn.disabled = true;
  multiActions.classList.add("hidden");
}

function handleOptionClick(question, optionKey) {
  if (state.revealed) {
    return;
  }

  if (question.type === "multiple") {
    if (state.selected.includes(optionKey)) {
      state.selected = state.selected.filter((item) => item !== optionKey);
    } else {
      state.selected = [...state.selected, optionKey].sort();
    }
    renderOptions(question);
    return;
  }

  state.selected = [optionKey];
  renderOptions(question);
  evaluateAnswer(question);
}

function goNext() {
  if (!state.revealed) {
    return;
  }
  state.currentIndex += 1;
  state.selected = [];
  state.revealed = false;
  renderCurrentQuestion();
}

submitMultiBtn.addEventListener("click", () => {
  const question = getCurrentQuestion();
  if (!question || !state.selected.length) {
    return;
  }
  evaluateAnswer(question);
});

clearMultiBtn.addEventListener("click", () => {
  state.selected = [];
  renderOptions(getCurrentQuestion());
});

nextBtn.addEventListener("click", goNext);

restartBtn.addEventListener("click", () => {
  if (state.currentModule) {
    startModule(state.currentModule);
  }
});

toggleOrderBtn.addEventListener("click", () => {
  state.orderMode = state.orderMode === "random" ? "sequential" : "random";
  if (state.currentModule) {
    startModule(state.currentModule);
  } else {
    renderCurrentQuestion();
  }
});

showAnswerBtn.addEventListener("click", () => {
  const question = getCurrentQuestion();
  if (!question) {
    return;
  }
  state.selected = [];
  evaluateAnswer(question, true);
});

buildMetaCard();
renderModuleList();
