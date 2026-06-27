const bank = window.QUESTION_BANK;

const typeConfig = {
  single: { label: "单选模块", shortLabel: "单选", tag: "单选题" },
  multiple: { label: "多选模块", shortLabel: "多选", tag: "多选题" },
  judge: { label: "判断模块", shortLabel: "判断", tag: "判断题" },
};

const state = {
  currentMode: null,
  currentKey: null,
  currentLabel: "",
  orderMode: "sequential",
  sessionQuestions: [],
  currentIndex: 0,
  selected: [],
  revealed: false,
  stats: { done: 0, correct: 0, wrong: 0 },
};

const typeModuleList = document.getElementById("typeModuleList");
const chapterModuleList = document.getElementById("chapterModuleList");
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
const startTypeOverviewBtn = document.getElementById("startTypeOverviewBtn");
const startChapterOverviewBtn = document.getElementById("startChapterOverviewBtn");

function getOptionList(question) {
  return question.type === "judge"
    ? [
        { key: "T", text: "正确" },
        { key: "F", text: "错误" },
      ]
    : question.options;
}

function getQuestionTypeMeta(questionType) {
  return typeConfig[questionType] || { label: questionType, shortLabel: questionType, tag: questionType };
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
      <div class="metric-card">
        <span>题库总量</span>
        <strong>${bank.meta.total}</strong>
      </div>
      <div class="metric-card">
        <span>单选题</span>
        <strong>${counts.single || 0}</strong>
      </div>
      <div class="metric-card">
        <span>多选题</span>
        <strong>${counts.multiple || 0}</strong>
      </div>
      <div class="metric-card">
        <span>判断题</span>
        <strong>${counts.judge || 0}</strong>
      </div>
    </div>
  `;
}

function createModuleButton(label, count, isActive, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `module-btn ${isActive ? "is-active" : ""}`;
  button.innerHTML = `
    <strong>${label}</strong>
    <span>${count} 题</span>
  `;
  button.addEventListener("click", onClick);
  return button;
}

function formatChapterModuleLabel(chapter) {
  return chapter.startsWith("综合练习") ? chapter : `${chapter}练习`;
}

function renderModuleList() {
  typeModuleList.innerHTML = "";
  chapterModuleList.innerHTML = "";

  Object.entries(typeConfig).forEach(([key, config]) => {
    const isActive = state.currentMode === "type" && state.currentKey === key;
    typeModuleList.appendChild(
      createModuleButton(config.label, bank.questions[key].length, isActive, () => startTypeModule(key))
    );
  });

  const chapterOrder = bank.meta.chapterOrder || Object.keys(bank.meta.chapterCounts);
  chapterOrder.forEach((chapter) => {
    const count = bank.meta.chapterCounts[chapter];
    const isActive = state.currentMode === "chapter" && state.currentKey === chapter;
    chapterModuleList.appendChild(
      createModuleButton(formatChapterModuleLabel(chapter), count, isActive, () => startChapterModule(chapter))
    );
  });
}

function getQuestionsForCurrentMode(mode, key) {
  if (mode === "chapter") {
    return bank.chapters[key] || [];
  }
  return bank.questions[key] || [];
}

function buildSession(mode, key) {
  const source = getQuestionsForCurrentMode(mode, key);
  return state.orderMode === "random" ? shuffle(source) : [...source];
}

function startSession(mode, key, label) {
  state.currentMode = mode;
  state.currentKey = key;
  state.currentLabel = label;
  state.currentIndex = 0;
  state.selected = [];
  state.revealed = false;
  state.stats = { done: 0, correct: 0, wrong: 0 };
  state.sessionQuestions = buildSession(mode, key);
  renderModuleList();
  renderCurrentQuestion();
}

function startTypeModule(moduleKey) {
  startSession("type", moduleKey, typeConfig[moduleKey].label);
}

function startChapterModule(chapter) {
  startSession("chapter", chapter, formatChapterModuleLabel(chapter));
}

function startFirstTypeModule() {
  startTypeModule("single");
}

function startFirstChapterModule() {
  const firstChapter = (bank.meta.chapterOrder || Object.keys(bank.meta.chapterCounts))[0];
  if (firstChapter) {
    startChapterModule(firstChapter);
  }
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
    <div class="score-chip"><span>已作答</span><strong>${state.stats.done}</strong></div>
    <div class="score-chip"><span>答对</span><strong>${state.stats.correct}</strong></div>
    <div class="score-chip"><span>答错</span><strong>${state.stats.wrong}</strong></div>
    <div class="score-chip"><span>正确率</span><strong>${accuracy}</strong></div>
  `;
}

function renderFeedback(question, isCorrect, revealedOnly = false) {
  feedback.classList.remove("hidden", "is-correct", "is-wrong");
  feedback.classList.add(isCorrect ? "is-correct" : "is-wrong");
  const title = revealedOnly ? "已显示答案" : isCorrect ? "回答正确" : "回答错误";
  const detail = revealedOnly
    ? `正确答案：${answerToText(question)}`
    : `你的答案：${selectedToText(question)} | 正确答案：${answerToText(question)}`;
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

function renderWelcomeState(title, description) {
  const chapterOrder = bank.meta.chapterOrder || Object.keys(bank.meta.chapterCounts);
  const featuredChapters = chapterOrder.slice(0, 5);

  emptyState.innerHTML = `
    <div class="welcome-board">
      <section class="welcome-hero">
        <p class="section-label">欢迎进入</p>
        <h3>${title}</h3>
        <p>${description}</p>
        <div class="welcome-pillrow">
          <span class="welcome-pill">按题型切换</span>
          <span class="welcome-pill">按章节复习</span>
          <span class="welcome-pill">即时判题反馈</span>
        </div>
      </section>

      <aside class="welcome-side">
        <div class="welcome-stat">
          <span>当前题库</span>
          <strong>${bank.meta.total}</strong>
        </div>
        <div class="welcome-side__meta">
          <div><span>章节模块</span><strong>${chapterOrder.length}</strong></div>
          <div><span>综合练习</span><strong>${chapterOrder.filter((item) => item.startsWith("综合练习")).length}</strong></div>
        </div>
      </aside>
    </div>

    <div class="shortcut-grid">
      <section class="shortcut-card">
        <p class="section-label">快速开始</p>
        <h3>按题型练习</h3>
        <p>适合集中刷单选、多选、判断，快速强化某一种题型。</p>
        <div class="shortcut-card__list">
          <span class="shortcut-chip">单选模块</span>
          <span class="shortcut-chip">多选模块</span>
          <span class="shortcut-chip">判断模块</span>
        </div>
        <button data-quick-start="type" class="ghost-btn quick-link-btn" type="button">进入题型模块</button>
      </section>

      <section class="shortcut-card">
        <p class="section-label">快速开始</p>
        <h3>按章节练习</h3>
        <p>适合顺着复习节奏逐章推进，先打基础，再做综合查漏。</p>
        <div class="shortcut-card__list">
          ${featuredChapters.map((chapter) => `<span class="shortcut-chip">${chapter}</span>`).join("")}
        </div>
        <button data-quick-start="chapter" class="ghost-btn quick-link-btn" type="button">进入章节模块</button>
      </section>
    </div>
  `;

  emptyState.querySelector('[data-quick-start="type"]')?.addEventListener("click", startFirstTypeModule);
  emptyState.querySelector('[data-quick-start="chapter"]')?.addEventListener("click", startFirstChapterModule);
}

function renderCurrentQuestion() {
  const question = getCurrentQuestion();
  if (!question) {
    emptyState.classList.remove("hidden");
    quizApp.classList.add("hidden");
    renderWelcomeState(
      `${state.currentLabel || "当前模块"}已完成`,
      "这一轮题目已经刷完。你可以重新开始当前模块，或者切换到其他题型、章节继续练习。"
    );
    return;
  }

  emptyState.classList.add("hidden");
  quizApp.classList.remove("hidden");

  const questionMeta = getQuestionTypeMeta(question.type);
  moduleTitle.textContent = state.currentLabel;
  progressText.textContent = `第 ${state.currentIndex + 1} / ${state.sessionQuestions.length} 题`;
  questionTag.textContent = `${question.chapter} · ${questionMeta.shortLabel}`;
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
  if (state.currentMode && state.currentKey) {
    startSession(state.currentMode, state.currentKey, state.currentLabel);
  }
});

toggleOrderBtn.addEventListener("click", () => {
  state.orderMode = state.orderMode === "random" ? "sequential" : "random";
  if (state.currentMode && state.currentKey) {
    startSession(state.currentMode, state.currentKey, state.currentLabel);
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

startTypeOverviewBtn.addEventListener("click", startFirstTypeModule);
startChapterOverviewBtn.addEventListener("click", startFirstChapterModule);

buildMetaCard();
renderModuleList();
renderWelcomeState("把题库当成工作台来刷", "先选模块，再看状态，再进入题目。首页保留快速入口，开始练习后会自动切换到完整答题界面。");
