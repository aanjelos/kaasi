const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const formatCurrency = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) amount = 0;
  return `LKR ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
};
const generateId = () => "_" + Math.random().toString(36).substr(2, 9);
const getDaysLeft = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

function getCurrentDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFormattedLocalStorageSize(key) {
  const item = localStorage.getItem(key);
  if (item === null) {
    return "N/A (No data found)";
  }

  const sizeInBytes = item.length; 

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} Bytes`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

function displayAppVersion() {
  let version = "N/A";
  try {
    const versionMetaTag = document.querySelector(
      'meta[name="application-version"]'
    );
    if (versionMetaTag) {
      version = versionMetaTag.getAttribute("content");
    } else {
      console.warn("Application version meta tag not found.");
    }
  } catch (error) {
    console.error("Error reading application version:", error);
  }

  const versionElementSettings = document.getElementById("appVersionSettings");
  if (versionElementSettings) {
    versionElementSettings.textContent = `Version: ${version}`;
  }

  const versionElementSetup = document.getElementById("appVersionSetup");
  if (versionElementSetup) {
    versionElementSetup.textContent = `Version: ${version}`;
  }
}

function toggleCategoryVisibilityInModal(
  selectElement,
  categoryGroupId,
  categorySelectId
) {
  const categoryGroup = document.getElementById(categoryGroupId);
  const categorySelect = document.getElementById(categorySelectId);

  const descriptionInput =
    selectElement.form.elements["description"] ||
    selectElement.form.elements["modalDescription"] ||
    selectElement.form.elements["ccDescription"] ||
    selectElement.form.elements["modalCcDescription"];

  if (selectElement.value === "income") {
    if (categoryGroup) categoryGroup.style.display = "none";
    if (categorySelect) categorySelect.required = false;
    if (descriptionInput) descriptionInput.placeholder = "e.g., Monthly Salary";
  } else {

    if (categoryGroup) categoryGroup.style.display = "block";
    if (categorySelect) categorySelect.required = true;
    if (descriptionInput)
      descriptionInput.placeholder = "e.g., Lunch, Groceries";
  }
}

let state = {};

function getDefaultState() {
  return JSON.parse(
    JSON.stringify({
      transactions: [],
      accounts: [
        {
          id: "cash", 
          name: "Cash",
          balance: 0,
        },
        {
          id: "bank_1", 
          name: "Commercial", 
          balance: 0,
        },
        {
          id: "bank_2", 
          name: "HNB", 
          balance: 0,
        },
        {
          id: "bank_3", 
          name: "Genie", 
          balance: 0,
        },
      ],
      categories: [

        "Food & Dining",
        "Groceries",
        "Transportation",
        "Healthcare",
        "Personal Care",
        "Shopping",
        "Entertainment",
        "Education",
        "Gifts & Donations",
        "Travel",
        "Subscriptions & Memberships",
        "Bank Charges",
        "Other",
      ].sort((a, b) => a.localeCompare(b)),
      debts: [],
      receivables: [],
      installments: [],
      creditCard: {
        limit: 0,
        transactions: [],
      },
      settings: {
        initialSetupDone: false,
        showCcDashboardSection: true,
        theme: "dark",
      },
    })
  );
}

function openInitialSetupWizard() {
  const modal = $("#initialSetupModal");
  if (!modal) {
    console.error("Initial Setup Modal not found in HTML.");
    return;
  }
  console.log("Opening Initial Setup Wizard...");

  const accountsContainer = $("#setupAccountBalances");
  accountsContainer.innerHTML = "";
  const defaultAccounts = getDefaultState().accounts;
  defaultAccounts.forEach((acc) => {
    const accRow = document.createElement("div");
    accRow.className =
      "grid grid-cols-1 sm:grid-cols-[2fr,3fr] gap-x-3 items-center mb-2";

    let nameFieldHtml;
    const inputStyle = `style="background-color: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary);"`;

    if (acc.id === "cash") {
      nameFieldHtml = `<label for="setupBalance-${acc.id}" class="text-sm font-medium text-gray-300 justify-self-start col-span-1 sm:col-span-1">${acc.name}</label>`;
    } else {
      nameFieldHtml = `<input type="text" id="setupName-${acc.id}" name="setupName-${acc.id}" value="${acc.name}" data-account-id="${acc.id}" class="!py-1.5 !px-2 text-sm w-full rounded placeholder-gray-400 col-span-1 sm:col-span-1" ${inputStyle} placeholder="Account Name">`;
    }
    const balanceFieldHtml = `<input type="number" id="setupBalance-${acc.id}" name="setupBalance-${acc.id}" data-account-id="${acc.id}" step="0.01" placeholder="0.00 (Optional)" class="!py-1.5 !px-2 text-sm w-full rounded placeholder-gray-400 col-span-1 sm:col-span-1" ${inputStyle}>`;

    if (acc.id === "cash") {
      accRow.innerHTML = `${nameFieldHtml}<div class="sm:col-span-1"> ${balanceFieldHtml}</div>`;
    } else {
      accRow.innerHTML = `<div class="col-span-1 sm:col-span-1">${nameFieldHtml}</div><div class="col-span-1 sm:col-span-1 mt-1 sm:mt-0">${balanceFieldHtml}</div>`;
    }
    accountsContainer.appendChild(accRow);
  });

  const setupEnableCcToggle = $("#setupEnableCc");
  const setupCcLimitGroup = $("#setupCcLimitGroup");
  const setupCcLimitInput = $("#setupCcLimit");
  if (setupEnableCcToggle && setupCcLimitGroup && setupCcLimitInput) {
    setupEnableCcToggle.checked = true;
    setupCcLimitGroup.style.display = "block";
    setupCcLimitInput.required = true;
    setupCcLimitInput.style.backgroundColor = "var(--bg-secondary)";
    setupCcLimitInput.style.borderColor = "var(--border-color)";
    setupCcLimitInput.style.color = "var(--text-primary)";

    setupEnableCcToggle.onchange = () => {
      if (setupEnableCcToggle.checked) {
        setupCcLimitGroup.style.display = "block";
        setupCcLimitInput.required = true;
      } else {
        setupCcLimitGroup.style.display = "none";
        setupCcLimitInput.required = false;
        setupCcLimitInput.value = "";
      }
    };
  }

  const categoriesContainer = $("#setupCategoriesList");
  const newCategoryInputForSetup = $("#setupNewCategoryName");
  const addCategoryBtn = $("#setupAddCategoryBtn");
  let currentSetupCategories = [...getDefaultState().categories];

  if (newCategoryInputForSetup) {
    newCategoryInputForSetup.style.backgroundColor = "var(--bg-secondary)";
    newCategoryInputForSetup.style.borderColor = "var(--border-color)";
    newCategoryInputForSetup.style.color = "var(--text-primary)";
  }

  const renderSetupCategories = () => {
    if (!categoriesContainer) return;
    categoriesContainer.innerHTML = "";
    currentSetupCategories
      .sort((a, b) => a.localeCompare(b))
      .forEach((cat) => {
        const div = document.createElement("div");

        div.className = "flex justify-between items-center p-2 rounded text-sm";
        div.style.backgroundColor = "var(--bg-secondary)";
        div.style.borderColor = "var(--border-color)"; 
        div.style.borderWidth = "1px"; 

        div.innerHTML = `
              <span>${cat}</span>
              <button type="button" class="text-red-400 hover:text-red-300 text-xs ml-2" data-category-name="${cat}" title="Remove">
                  <i class="fas fa-times"></i>
              </button>
          `;
        div.querySelector("button").onclick = (e) => {
          const catNameToRemove = e.currentTarget.dataset.categoryName;
          currentSetupCategories = currentSetupCategories.filter(
            (c) => c !== catNameToRemove
          );
          renderSetupCategories();
        };
        categoriesContainer.appendChild(div);
      });
  };

  if (addCategoryBtn) {
    addCategoryBtn.onclick = () => {
      const newCat = newCategoryInputForSetup.value.trim();
      if (
        newCat &&
        !currentSetupCategories.some(
          (c) => c.toLowerCase() === newCat.toLowerCase()
        )
      ) {
        currentSetupCategories.push(newCat);
        renderSetupCategories();
        newCategoryInputForSetup.value = "";
      } else if (newCat) {
        showNotification(`Category "${newCat}" already exists.`, "warning");
      }
      newCategoryInputForSetup.focus();
    };
  }
  if (newCategoryInputForSetup) {
    newCategoryInputForSetup.onkeypress = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (addCategoryBtn) addCategoryBtn.click();
      }
    };
  }
  renderSetupCategories(); 

  $("#initialSetupForm").onsubmit = handleInitialSetupSubmit;
  $("#setupImportInput").onchange = handleSetupImport;

  modal.style.display = "block";
  displayAppVersion();
}

function handleInitialSetupSubmit(event) {
  event.preventDefault();
  console.log("Handling initial setup form submission...");

  let newState = getDefaultState(); 

  const defaultAccountsFromTemplate = getDefaultState().accounts;

  newState.accounts = defaultAccountsFromTemplate.map((defaultAcc) => {
    const nameInput = $(`#setupName-${defaultAcc.id}`); 
    const balanceInput = $(`#setupBalance-${defaultAcc.id}`);

    let finalName = defaultAcc.name; 
    if (defaultAcc.id !== "cash" && nameInput) {

      const enteredName = nameInput.value.trim();
      if (enteredName) {

        finalName = enteredName;
      } else {
        console.warn(
          `Account name for ${defaultAcc.id} was left empty, using default: ${defaultAcc.name}`
        );

      }
    }

    let balance = 0; 
    if (balanceInput) {
      const balanceStr = balanceInput.value.trim();
      if (balanceStr !== "" && balanceStr !== null) {
        const parsedBalance = parseFloat(balanceStr);
        balance = isNaN(parsedBalance) ? 0 : parsedBalance;
      }
    }

    return { id: defaultAcc.id, name: finalName, balance: balance };
  });

  const ccEnabled = $("#setupEnableCc").checked;
  newState.settings.showCcDashboardSection = ccEnabled; 
  if (ccEnabled) {
    const ccLimitStr = $("#setupCcLimit").value.trim();
    if (ccLimitStr === "" || ccLimitStr === null) {
      newState.creditCard.limit = 0;
    } else {
      const limit = parseFloat(ccLimitStr);
      newState.creditCard.limit = isNaN(limit) || limit < 0 ? 0 : limit;
    }
  } else {
    newState.creditCard.limit = 0;
  }

  const finalCategories = [];
  $$("#setupCategoriesList span").forEach((span) =>
    finalCategories.push(span.textContent)
  );
  newState.categories =
    finalCategories.length > 0
      ? finalCategories.sort((a, b) => a.localeCompare(b))
      : getDefaultState().categories;

  newState.settings.initialSetupDone = true;

  state = newState;

  saveData();

  closeModal("initialSetupModal");
  initializeUI(true);

  showNotification("Setup complete! Welcome to Kaasi.", "success", 5000);
}

function handleSetupImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  console.log("Importing data from setup wizard...");
  const reader = new FileReader();
  reader.onload = (e) => {
    let importedData;
    try {
      importedData = JSON.parse(e.target.result);
      if (importedData && typeof importedData === "object") {
        state = getDefaultState();
        state = deepMerge(state, importedData);

        if (!state.settings) state.settings = getDefaultState().settings;
        state.settings.initialSetupDone = true;

        saveData();
        closeModal("initialSetupModal");
        initializeUI(true);
        showNotification(
          "Data imported successfully from setup wizard!",
          "success"
        );
      } else {
        throw new Error("Invalid data structure in imported file.");
      }
    } catch (error) {
      console.error("Import failed during setup:", error);
      showNotification(
        `Import failed: ${error.message}. Please try manual setup or a valid file.`,
        "error",
        10000
      );
    } finally {
      event.target.value = null;
    }
  };
  reader.onerror = () => {
    showNotification("Failed to read the import file.", "error");
    event.target.value = null;
  };
  reader.readAsText(file);
}

const STORAGE_KEY = "KaasiData"; 

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log("Data saved successfully.");
  } catch (e) {
    console.error("Error saving data to localStorage:", e);
    if (e.name === "QuotaExceededError") {
      showNotification(
        "Error: Local storage quota exceeded. Data is too large to save.",
        "error",
        10000
      );
    } else {

      showNotification("Error saving data. Check console.", "error", 10000);
    }

  }
}

function loadData() {
  const d = localStorage.getItem(STORAGE_KEY); 
  let parsedData = null;

  if (d) {
    console.log("Uncompressed data found. Attempting to parse...");
    try {
      parsedData = JSON.parse(d);
    } catch (e) {
      console.error("Error parsing data from localStorage:", e);

      showNotification(
        "Error loading data. Data might be corrupted. Starting fresh.",
        "error",
        8000
      );
    }
  }

  state = getDefaultState();

  if (parsedData && typeof parsedData === "object") {
    console.log("Merging loaded data into default state structure...");

    state = deepMerge(state, parsedData);
    console.log("Data merged successfully.");
  } else if (d && !parsedData) {

    console.log(
      "Previous data existed but was unparsable. Using fresh default state."
    );

  } else {
    console.log(
      "No saved data found or data was null/invalid. Starting with fresh default state."
    );

  }

  const defaultStateTemplate = getDefaultState(); 

  if (!state.settings || typeof state.settings !== "object") {
    console.warn(
      "State.settings was missing or invalid after merge. Resetting to default settings structure."
    );
    state.settings = { ...defaultStateTemplate.settings }; 
  } else {

    for (const settingKey in defaultStateTemplate.settings) {
      if (state.settings[settingKey] === undefined) {
        state.settings[settingKey] = defaultStateTemplate.settings[settingKey];
      }
    }
  }

  if (!state.creditCard || typeof state.creditCard !== "object") {
    console.warn(
      "State.creditCard was missing or invalid after merge. Resetting to default creditCard structure."
    );
    state.creditCard = { ...defaultStateTemplate.creditCard }; 
    if (!Array.isArray(state.creditCard.transactions)) {

      state.creditCard.transactions = [];
    }
  } else {

    for (const ccKey in defaultStateTemplate.creditCard) {
      if (state.creditCard[ccKey] === undefined) {
        state.creditCard[ccKey] = defaultStateTemplate.creditCard[ccKey];
      }
    }
    if (!Array.isArray(state.creditCard.transactions)) {

      state.creditCard.transactions = [];
    }
  }

  if (!Array.isArray(state.transactions)) state.transactions = [];
  if (!Array.isArray(state.accounts)) state.accounts = []; 
  if (!Array.isArray(state.categories)) state.categories = []; 
  if (!Array.isArray(state.debts)) state.debts = [];
  if (!Array.isArray(state.receivables)) state.receivables = [];
  if (!Array.isArray(state.installments)) state.installments = [];

  ensureDefaultAccounts();
  ensureDefaultCategories();

  state.accounts.forEach((a) => {
    if (isNaN(a.balance) || typeof a.balance !== "number") a.balance = 0;
  });

  if (
    isNaN(state.creditCard.limit) ||
    typeof state.creditCard.limit !== "number"
  )
    state.creditCard.limit = 0;
  state.creditCard.transactions.forEach((t) => {
    if (t.paidAmount === undefined || typeof t.paidAmount !== "number")
      t.paidAmount = 0;
    if (t.paidOff === undefined) t.paidOff = t.paidAmount >= t.amount - 0.005;
    if (!t.timestamp) t.timestamp = new Date(t.date).getTime();
  });

  state.transactions.forEach((t) => {
    if (!t.timestamp) t.timestamp = new Date(t.date).getTime();
  });

  state.debts.forEach((item) => {
    if (!item.timestamp) item.timestamp = new Date(item.dueDate).getTime();
    if (item.originalAmount === undefined) item.originalAmount = item.amount;
  });

  state.receivables.forEach((item) => {
    if (!item.timestamp) item.timestamp = new Date(item.dateGiven).getTime();
    if (item.originalAmount === undefined) item.originalAmount = item.amount;
  });

  state.installments.forEach((item) => {
    if (!item.timestamp) item.timestamp = new Date(item.startDate).getTime();
  });

  console.log(
    "Final state after loadData and integrity checks:",
    JSON.parse(JSON.stringify(state))
  );
}

function deepMerge(target, source) {

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue)
      ) {

        if (
          !targetValue ||
          typeof targetValue !== "object" ||
          Array.isArray(targetValue)
        ) {
          target[key] = {};
        }
        deepMerge(target[key], sourceValue); 
      } else if (sourceValue !== undefined) {

        target[key] = sourceValue;
      }

    }
  }

  return target; 
}

function ensureDefaultAccounts() {
  const defaultAccounts = getDefaultState().accounts; 
  if (!Array.isArray(state.accounts)) {

    console.warn(
      "state.accounts was not an array. Resetting to default accounts structure."
    );
    state.accounts = JSON.parse(JSON.stringify(defaultAccounts)); 

    state.accounts.forEach((acc) => (acc.balance = 0));
    return;
  }

  defaultAccounts.forEach((defaultAcc) => {
    const existingAccount = state.accounts.find(
      (acc) => acc.id === defaultAcc.id
    );
    if (!existingAccount) {

      console.warn(
        `Default account '${defaultAcc.name}' (ID: ${defaultAcc.id}) was missing. Adding it.`
      );
      state.accounts.push({
        ...defaultAcc, 
        balance: 0, 
      });
    } else {

      if (typeof existingAccount.name !== "string")
        existingAccount.name = defaultAcc.name;
      if (
        typeof existingAccount.balance !== "number" ||
        isNaN(existingAccount.balance)
      ) {
        console.warn(
          `Balance for account '${existingAccount.name}' was invalid. Resetting to 0.`
        );
        existingAccount.balance = 0;
      }
    }
  });

}

function ensureDefaultCategories() {
  const defaultCategories = getDefaultState().categories; 

  if (!state.categories || !Array.isArray(state.categories)) {
    console.warn(
      "state.categories was missing or not an array. Initializing as empty array."
    );
    state.categories = [];
  }

  if (state.categories.length === 0) {
    console.warn(
      "state.categories is empty. Populating with default categories."
    );
    state.categories = JSON.parse(JSON.stringify(defaultCategories)); 
  }

  state.categories.sort((a, b) => a.localeCompare(b));

  const otherCategory = "Other";
  if (
    !state.categories.some(
      (cat) => cat.toLowerCase() === otherCategory.toLowerCase()
    )
  ) {
    console.warn("'Other' category was missing. Adding it back.");
    state.categories.push(otherCategory);
    state.categories.sort((a, b) => a.localeCompare(b)); 
  }
}

function showNotification(message, type = "success", duration = 4000) {
  const area = $("#notificationArea");
  if (!area) return;
  const n = document.createElement("div");
  let bg, tc;
  switch (type) {
    case "error":
      bg = "bg-red-600";
      tc = "text-white";
      break;
    case "warning":
      bg = "bg-yellow-500";
      tc = "text-black";
      break;
    case "info":
      bg = "bg-blue-500";
      tc = "text-white";
      break;
    default:
      bg = "bg-green-600";
      tc = "text-white";
      break;
  }
  n.className = `p-3 rounded-md shadow-lg text-sm font-medium transition-all duration-300 ease-in-out transform translate-x-full opacity-0 ${bg} ${tc}`;
  n.textContent = message;
  area.appendChild(n);
  void n.offsetWidth;
  requestAnimationFrame(() => {
    n.classList.remove("translate-x-full", "opacity-0");
    n.classList.add("translate-x-0", "opacity-100");
  });
  setTimeout(() => {
    n.classList.remove("translate-x-0", "opacity-100");
    n.classList.add("translate-x-full", "opacity-0");
    n.addEventListener("transitionend", () => n.remove(), {
      once: true,
    });
  }, duration);
}

function populateDropdowns() {
  const accountSelects = $$(
    'select[name="account"], select[name="transferFrom"], select[name="transferTo"], select[name="receivableSourceAccount"], select[name="payDebtAccount"], select[name="recPaymentAccount"], select[name="instPayAccount"], select[name="ccPayFromAccount"], #modalAccount, #recSourceAccountAdd, #recSourceAccountEdit, #modalCcPayFromAccount, #modalInstPayAccount, #modalPayDebtAccount, #modalTransferFrom, #modalTransferTo' // Added new modal selectors: #modalTransferFrom, #modalTransferTo
  );
  const categorySelects = $$(
    "#category, #modalCategory, #modalPayDebtCategory, #modalInstPayCategory, #modalCcPayCategory"
  );

  accountSelects.forEach((s) => {
    if (!s) return;
    const currentValue = s.value;
    s.innerHTML = ""; 
    state.accounts.forEach((a) => {
      const o = document.createElement("option");
      o.value = a.id;
      o.textContent = `${a.name} (${formatCurrency(a.balance)})`;
      s.appendChild(o);
    });

    if (Array.from(s.options).some((opt) => opt.value === currentValue)) {
      s.value = currentValue;
    } else if (s.options.length > 0) {

    }
  });

  const populateCategorySelect = (selectEl) => {
    if (!selectEl) return;
    const currentValue = selectEl.value; 
    selectEl.innerHTML = ""; 

    const placeholderOption = document.createElement("option");
    placeholderOption.value = ""; 
    placeholderOption.textContent = "---- Select Category ----";
    placeholderOption.disabled = true;

    selectEl.appendChild(placeholderOption);

    const otherCategoryName = "Other";
    let generalCategories = state.categories.filter(
      (c) =>
        c.toLowerCase() !== "income" &&
        c.toLowerCase() !== "credit card payment" &&
        c.toLowerCase() !== otherCategoryName.toLowerCase()
    );

    generalCategories.sort((a, b) => a.localeCompare(b));

    if (selectEl.id === "modalPayDebtCategory") {
      const debtRepaymentCategory = "Debt Repayment";
      if (
        !generalCategories.includes(debtRepaymentCategory) &&
        !state.categories.some(
          (c) => c.toLowerCase() === debtRepaymentCategory.toLowerCase()
        )
      ) {

      }
    }

    generalCategories.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      selectEl.appendChild(o);
    });

    if (
      state.categories.some(
        (c) => c.toLowerCase() === otherCategoryName.toLowerCase()
      )
    ) {
      const otherOption = document.createElement("option");
      otherOption.value = otherCategoryName;
      otherOption.textContent = otherCategoryName;
      selectEl.appendChild(otherOption);
    }

    if (
      currentValue &&
      Array.from(selectEl.options).some(
        (opt) => opt.value === currentValue && opt.value !== ""
      )
    ) {
      selectEl.value = currentValue;
    } else if (
      selectEl.id === "modalPayDebtCategory" &&
      state.categories.includes("Debt Repayment")
    ) {

      selectEl.value = "Debt Repayment";
    } else {

      selectEl.value = ""; 
    }
  };

  categorySelects.forEach(populateCategorySelect);
}

function renderDashboard() {
  let totalBalance = 0;
  state.accounts.forEach((acc) => {
    const cEl = $(`#accountBalance-${acc.id}`);
    if (cEl) {
      const nEl = cEl.querySelector("p:first-child"),
        bEl = cEl.querySelector("p:last-child");
      if (nEl) nEl.textContent = acc.name;
      if (bEl) bEl.textContent = formatCurrency(acc.balance);
    }
    totalBalance += acc.balance;
  });
  $("#totalBalance").textContent = formatCurrency(totalBalance);
  const cashRecTotal = state.receivables
    .filter((r) => r.type === "cash" || (r.type === "cc" && r.sourceAccount))
    .reduce((s, r) => s + r.remainingAmount, 0);
  $("#totalPotentialBalance").textContent = formatCurrency(
    totalBalance + cashRecTotal
  );
  $("#totalOwedToMe").textContent = `Total: ${formatCurrency(
    state.receivables.reduce((s, r) => s + r.remainingAmount, 0)
  )}`;
  $("#totalOwed").textContent = `Total: ${formatCurrency(
    state.debts.reduce((s, d) => s + d.remainingAmount, 0)
  )}`;
  $("#totalInstallmentsLeft").textContent = `Total Left: ${formatCurrency(
    state.installments.reduce((s, i) => s + i.monthlyAmount * i.monthsLeft, 0)
  )}`;
  renderRecentTransactions();
  renderDebtList();
  renderReceivableList();
  renderInstallmentList();
  renderCreditCardSection();
  renderMonthlyOverviewChart();
  renderYearlyAndQuickStats();
}

function renderYearlyAndQuickStats() {
  const now = new Date(),
    currentYear = now.getFullYear(),
    startOfYear = new Date(currentYear, 0, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(
    now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
  );
  startOfWeek.setHours(0, 0, 0, 0);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(startOfWeek.getDate() - 7);
  const lastWeekEnd = new Date(startOfWeek);
  lastWeekEnd.setDate(startOfWeek.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);

  let yearlyEarned = 0,
    yearlySpent = 0,
    weeklySpent = 0,
    todaySpent = 0,
    yesterdaySpent = 0,
    lastWeekSpentTotal = 0;
  state.transactions.forEach((t) => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return;
    if (d >= startOfYear) {
      if (t.type === "income") yearlyEarned += t.amount;
      if (t.type === "expense") yearlySpent += t.amount;
    }
    if (t.type === "expense") {
      if (d >= startOfWeek) weeklySpent += t.amount;
      if (d >= todayStart) todaySpent += t.amount;
      if (d >= yesterdayStart && d < todayStart) yesterdaySpent += t.amount;
      if (d >= lastWeekStart && d <= lastWeekEnd)
        lastWeekSpentTotal += t.amount;
    }
  });
  $("#yearlyTotals").textContent = `Yearly: Earned ${formatCurrency(
    yearlyEarned
  )} / Spent ${formatCurrency(yearlySpent)}`;

  const quickStatsEl = $("#quickStats");
  quickStatsEl.innerHTML = `Today: ${formatCurrency(
    todaySpent
  )} <span id="todaySpendingIndicator"></span> | This Week: ${formatCurrency(
    weeklySpent
  )} <span id="weekSpendingIndicator"></span>`;

  const todayIndicator = $("#todaySpendingIndicator");

  if (todaySpent > yesterdaySpent && yesterdaySpent >= 0)
    todayIndicator.innerHTML = `<i class="fas fa-arrow-up text-indicator-bad spending-indicator" title="More than yesterday (${formatCurrency(
      yesterdaySpent
    )})"></i>`;
  else if (todaySpent < yesterdaySpent && yesterdaySpent > 0)
    todayIndicator.innerHTML = `<i class="fas fa-arrow-down text-indicator-good spending-indicator" title="Less than yesterday (${formatCurrency(
      yesterdaySpent
    )})"></i>`;
  else todayIndicator.innerHTML = "";

  const weekIndicator = $("#weekSpendingIndicator");

  if (weeklySpent > lastWeekSpentTotal && lastWeekSpentTotal >= 0)
    weekIndicator.innerHTML = `<i class="fas fa-arrow-up text-indicator-bad spending-indicator" title="More than last week (${formatCurrency(
      lastWeekSpentTotal
    )})"></i>`;
  else if (weeklySpent < lastWeekSpentTotal && lastWeekSpentTotal > 0)
    weekIndicator.innerHTML = `<i class="fas fa-arrow-down text-indicator-good spending-indicator" title="Less than last week (${formatCurrency(
      lastWeekSpentTotal
    )})"></i>`;
  else weekIndicator.innerHTML = "";
}

function renderRecentTransactions() {
  const list = $("#recentTransactionsList");
  if (!list) return;
  list.innerHTML = "";
  const recent = [...state.transactions]
    .sort(
      (a, b) =>
        new Date(b.date).setHours(0, 0, 0, 0) -
          new Date(a.date).setHours(0, 0, 0, 0) || b.timestamp - a.timestamp
    )
    .slice(0, 10);

  if (recent.length === 0) {
    list.innerHTML =
      '<p class="text-gray-400 text-sm">No transactions yet.</p>';
    return;
  }

  recent.forEach((t) => {
    const div = document.createElement("div");
    div.className = `flex justify-between items-center p-2 rounded bg-gray-700/50 text-sm transition-colors hover:bg-gray-700/80`;

    const account = state.accounts.find((a) => a.id === t.account);
    const accountName = account ? account.name : "Unknown";
    const isIncome = t.type === "income";
    const textColorClass = isIncome ? "text-income" : "text-expense"; 
    const categoryText = !isIncome ? `(${t.category || "Uncategorized"})` : "";

    div.innerHTML = `
                <div class="flex-grow mr-2 overflow-hidden">
                    <p class="font-medium truncate ${textColorClass}" title="${
      t.description
    }">${t.description}</p>
                    <p class="text-xs text-gray-400">${new Date(
                      t.date
                    ).toLocaleDateString()} - ${accountName} ${categoryText}</p>
                </div>
                <span class="font-semibold whitespace-nowrap ${textColorClass}">${
      isIncome ? "+" : "-"
    }${formatCurrency(t.amount)}</span>
                <div class="edit-btn-container flex-shrink-0">
                    <button class="text-xs accent-text hover:text-accent-hover focus:outline-none" onclick="openEditTransactionForm('${
                      t.id
                    }', event)" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="text-xs text-gray-500 hover:text-expense focus:outline-none" onclick="deleteTransaction('${
                      t.id
                    }',event)" title="Delete"><i class="fas fa-times"></i></button>
                </div>`;
    list.appendChild(div);
  });
}

function renderDebtList() {
  const listContainer = $("#debtModalListContainer");
  if (!listContainer) {
    console.warn(
      "#debtModalListContainer element not found. Debts modal might not be open."
    );
    return;
  }
  listContainer.innerHTML = "";

  if (state.debts.length === 0) {
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm text-center py-4">No debts recorded.</p>';
    return;
  }

  const totalsByCreditor = state.debts.reduce((acc, d) => {
    const creditorName = d.who.trim();
    if (!acc[creditorName]) {
      acc[creditorName] = {
        totalOwedTo: 0,
        items: [],
      };
    }
    acc[creditorName].totalOwedTo += d.remainingAmount;
    acc[creditorName].items.push(d);
    return acc;
  }, {});

  const sortedCreditors = Object.keys(totalsByCreditor).sort((a, b) =>
    a.localeCompare(b)
  );

  if (sortedCreditors.length === 0) {
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm text-center py-4">No debts to display by creditor.</p>';
    return;
  }

  sortedCreditors.forEach((creditorName) => {
    const creditorData = totalsByCreditor[creditorName];
    const creditorId = `modal-debt-creditor-${generateId()}`;

    const creditorWrapper = document.createElement("div");
    creditorWrapper.className =
      "mb-3 border border-gray-700 rounded-md overflow-hidden shadow-sm";

    const creditorHeader = document.createElement("div");
    creditorHeader.className =
      "flex justify-between items-center p-3 cursor-pointer hover:bg-gray-600/50 transition-colors";
    creditorHeader.style.backgroundColor = "var(--bg-tertiary)";
    creditorHeader.onclick = () => {
      const itemsDiv = document.getElementById(creditorId);
      const icon = creditorHeader.querySelector(".toggle-icon i");
      if (itemsDiv) {
        itemsDiv.classList.toggle("hidden");
        if (itemsDiv.classList.contains("hidden")) {
          icon.classList.remove("fa-chevron-up");
          icon.classList.add("fa-chevron-down");
        } else {
          icon.classList.remove("fa-chevron-down");
          icon.classList.add("fa-chevron-up");
        }
      }
    };

    creditorHeader.innerHTML = ` 
      <h4 class="text-md font-semibold text-gray-100">${creditorName}</h4>
      <div class="flex items-center">
        <span class="text-md font-semibold text-expense mr-3">${formatCurrency(
          creditorData.totalOwedTo
        )}</span>
        <span class="toggle-icon text-gray-400"><i class="fas fa-chevron-down"></i></span>
      </div>
    `;

    creditorWrapper.appendChild(creditorHeader);

    const itemsListContainer = document.createElement("div");
    itemsListContainer.id = creditorId;
    itemsListContainer.className = "hidden p-2 pt-0 space-y-2";
    itemsListContainer.style.backgroundColor = "var(--bg-secondary)";

    creditorData.items
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .forEach((d) => {
        const daysLeft = getDaysLeft(d.dueDate);
        let daysText, daysColor;
        if (daysLeft < 0) {
          daysText = `Overdue by ${Math.abs(daysLeft)} day(s)`;
          daysColor = "text-expense font-medium";
        } else if (daysLeft === 0) {
          daysText = `Due Today`;
          daysColor = "text-warning font-medium";
        } else {
          daysText = `${daysLeft} day(s) left`;
          daysColor = "text-gray-300";
        }

        // Updated button structure for consistency
        const buttonsHtml = `
        <div class="edit-btn-container">
            <button class="text-xs accent-text hover:text-accent-hover focus:outline-none mr-2" onclick="openEditDebtForm('${d.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="text-xs text-income hover:opacity-80 focus:outline-none mr-2" onclick="openPayDebtForm('${d.id}')" title="Pay"><i class="fas fa-dollar-sign"></i></button>
            <button class="text-xs text-gray-500 hover:text-expense focus:outline-none" onclick="deleteDebt('${d.id}')" title="Delete"><i class="fas fa-times"></i></button>
        </div>
        `;

        const itemDiv = document.createElement("div");
        itemDiv.className =
          "text-sm py-2 border-b border-gray-700 last:border-b-0";
        itemDiv.innerHTML = `
          <div class="flex justify-between items-start mb-1">
            <div>
              <p class="font-medium text-gray-200">${d.why}</p>
              <p class="text-xs ${daysColor}">${daysText}</p>
            </div>
            <span class="font-semibold text-expense">${formatCurrency(
              d.remainingAmount
            )}</span>
          </div>
          <div class="flex justify-between items-center text-xs text-gray-500 mt-1">
            <span>Due: ${new Date(d.dueDate).toLocaleDateString()}</span>
            ${buttonsHtml}
          </div>
        `;
        itemsListContainer.appendChild(itemDiv);
      });
    creditorWrapper.appendChild(itemsListContainer);
    listContainer.appendChild(creditorWrapper);
  });
}

function renderReceivableList() {
  const listContainer = $("#receivableModalListContainer");
  if (!listContainer) {
    console.warn(
      "#receivableModalListContainer element not found. Receivables modal might not be open."
    );
    return;
  }
  listContainer.innerHTML = "";

  const cashBankReceivables = state.receivables.filter(
    (r) => r.type === "cash" || !r.type 
  );
  const ccReceivables = state.receivables.filter((r) => r.type === "cc");

  if (state.receivables.length === 0) {
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm text-center py-4">No receivables recorded.</p>';
    return;
  }

  const renderGroupInModal = (title, receivablesForGroup) => {
    const sectionWrapper = document.createElement("div");
    sectionWrapper.className = "mb-6";

    const sectionTitleHeader = document.createElement("div");
    sectionTitleHeader.className =
      "flex justify-between items-center border-b border-gray-500 pb-2 mb-3";

    const sectionTitle = document.createElement("h3");
    sectionTitle.className = "text-xl font-semibold text-gray-100";
    sectionTitle.textContent = title;
    sectionTitleHeader.appendChild(sectionTitle);

    const groupTotalAmount = receivablesForGroup.reduce(
      (sum, r) => sum + r.remainingAmount,
      0
    );
    const groupTotalSpan = document.createElement("span");
    groupTotalSpan.className = "text-base font-normal text-gray-100";
    groupTotalSpan.textContent = `Total: ${formatCurrency(groupTotalAmount)}`;
    sectionTitleHeader.appendChild(groupTotalSpan);
    sectionWrapper.appendChild(sectionTitleHeader);

    if (receivablesForGroup.length === 0) {
      const noItemsMessage = document.createElement("p");
      noItemsMessage.className = "text-gray-400 text-sm pl-1";
      noItemsMessage.textContent = `No ${title
        .replace(" Loans", "")
        .toLowerCase()} recorded.`;
      sectionWrapper.appendChild(noItemsMessage);
      listContainer.appendChild(sectionWrapper);
      return;
    }

    const totalsByPerson = receivablesForGroup.reduce((acc, r) => {
      const personName = r.who.trim();
      if (!acc[personName]) {
        acc[personName] = {
          totalOwed: 0,
          items: [],
        };
      }
      acc[personName].totalOwed += r.remainingAmount;
      acc[personName].items.push(r);
      return acc;
    }, {});

    const sortedPeople = Object.keys(totalsByPerson).sort((a, b) =>
      a.localeCompare(b)
    );

    if (sortedPeople.length === 0) {
      const noItemsMessage = document.createElement("p");
      noItemsMessage.className = "text-gray-400 text-sm pl-1";
      noItemsMessage.textContent = `No receivables to display for ${title.toLowerCase()}.`;
      sectionWrapper.appendChild(noItemsMessage);
    } else {
      sortedPeople.forEach((personName) => {
        const personData = totalsByPerson[personName];
        const personId = `modal-receivable-${title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")}-${generateId()}`;

        const personWrapper = document.createElement("div");
        personWrapper.className =
          "mb-3 border border-gray-700 rounded-md overflow-hidden shadow-sm";

        const personHeader = document.createElement("div");
        personHeader.className =
          "flex justify-between items-center p-3 cursor-pointer hover:bg-gray-600/50 transition-colors";
        personHeader.style.backgroundColor = "var(--bg-tertiary)";
        personHeader.onclick = () => {
          const itemsDiv = document.getElementById(personId);
          const icon = personHeader.querySelector(".toggle-icon i");
          if (itemsDiv) {
            itemsDiv.classList.toggle("hidden");
            if (itemsDiv.classList.contains("hidden")) {
              icon.classList.remove("fa-chevron-up");
              icon.classList.add("fa-chevron-down");
            } else {
              icon.classList.remove("fa-chevron-down");
              icon.classList.add("fa-chevron-up");
            }
          }
        };

        personHeader.innerHTML = `
          <h4 class="text-md font-semibold text-gray-100">${personName}</h4>
          <div class="flex items-center">
            <span class="text-md font-semibold text-income mr-3">${formatCurrency(
              personData.totalOwed
            )}</span>
            <span class="toggle-icon text-gray-400"><i class="fas fa-chevron-down"></i></span>
          </div>
        `;
        personWrapper.appendChild(personHeader);

        const itemsListContainer = document.createElement("div");
        itemsListContainer.id = personId;
        itemsListContainer.className = "hidden p-2 pt-0 space-y-2";
        itemsListContainer.style.backgroundColor = "var(--bg-secondary)";

        personData.items
          .sort((a, b) => new Date(b.dateGiven) - new Date(a.dateGiven))
          .forEach((r) => {
            const srcAcc = state.accounts.find((a) => a.id === r.sourceAccount);
            let srcTxt = "";
            if (r.type === "cash") {
              srcTxt = `(From: ${srcAcc?.name || "Unknown"})`;
            } else if (r.type === "cc") {
              srcTxt = "(Via CC)";
            }

            // Updated button structure for consistency
            const buttonsHtml = `
            <div class="edit-btn-container">
                <button class="text-xs accent-text hover:text-accent-hover focus:outline-none mr-2" onclick="openEditReceivableForm('${r.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="text-xs text-income hover:opacity-80 focus:outline-none mr-2" onclick="openReceivePaymentForm('${r.id}')" title="Receive"><i class="fas fa-hand-holding-usd"></i></button>
                <button class="text-xs text-gray-500 hover:text-expense focus:outline-none" onclick="deleteReceivable('${r.id}')" title="Delete"><i class="fas fa-times"></i></button>
            </div>
            `;

            const itemDiv = document.createElement("div");
            itemDiv.className =
              "text-sm py-2 border-b border-gray-700 last:border-b-0";
            itemDiv.innerHTML = `
              <div class="flex justify-between items-start mb-1">
                <div>
                  <p class="font-medium text-gray-200">${r.why}</p>
                  <p class="text-xs text-gray-400">${srcTxt}</p>
                </div>
                <span class="font-semibold text-income">${formatCurrency(
                  r.remainingAmount
                )}</span>
              </div>
              <div class="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Given: ${new Date(
                  r.dateGiven
                ).toLocaleDateString()}</span>
                ${buttonsHtml}
              </div>
            `;
            itemsListContainer.appendChild(itemDiv);
          });
        personWrapper.appendChild(itemsListContainer);
        sectionWrapper.appendChild(personWrapper);
      });
    }
    listContainer.appendChild(sectionWrapper);
  };

  renderGroupInModal("Cash/Bank Loans", cashBankReceivables);
  renderGroupInModal("Credit Card Loans", ccReceivables);
}

function renderInstallmentList() {
  const list = $("#installmentList");
  if (!list) return;
  list.innerHTML = "";
  const sortedInstallments = [...state.installments].sort((a, b) => {
    const endDateA = new Date(a.startDate);
    endDateA.setMonth(endDateA.getMonth() + a.totalMonths);
    const endDateB = new Date(b.startDate);
    endDateB.setMonth(endDateB.getMonth() + b.totalMonths);
    return endDateA - endDateB;
  });

  if (sortedInstallments.length === 0) {
    list.innerHTML = '<p class="text-gray-400 text-sm">No installments.</p>';
    return;
  }

  sortedInstallments.forEach((i) => {
    const endDate = new Date(i.startDate);
    endDate.setMonth(endDate.getMonth() + i.totalMonths);
    const daysLeft = getDaysLeft(endDate);
    let daysLeftText =
      daysLeft < 0
        ? `<span class="text-gray-500">Finished</span>`
        : `<span class="text-gray-300">${daysLeft} day(s) left</span>`;
    const totalLeftToPay = i.monthlyAmount * i.monthsLeft;
    const progressPercent =
      i.totalMonths > 0
        ? ((i.totalMonths - i.monthsLeft) / i.totalMonths) * 100
        : 0;

    const div = document.createElement("div");
    div.className =
      "p-3 rounded bg-gray-700/50 text-sm mb-2 flex items-center gap-x-3";

    const ringHtml = `
            <div class="installment-progress-ring-container w-10 h-10 flex-shrink-0" title="${progressPercent.toFixed(
              0
            )}% Paid (${i.monthsLeft} months left)">
                <svg class="w-full h-full" viewBox="0 0 36 36">
                    <path class="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-width="3"></path>
                    <path class="progress-ring-circle" stroke-dasharray="${progressPercent.toFixed(
                      2
                    )}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke-linecap="round" stroke-width="3"></path>
                    <text x="18" y="17.5" class="progress-ring-text" text-anchor="middle" fill="var(--text-primary)">${
                      i.monthsLeft
                    }</text> 
                </svg>
            </div>
        `;

    // Updated button structure for consistency
    const buttonsHtml = `
        <div class="edit-btn-container">
            ${ i.monthsLeft > 0 ? `
                <button class="text-xs accent-text hover:text-accent-hover focus:outline-none mr-2" onclick="openEditInstallmentForm('${i.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="text-xs text-income hover:opacity-80 focus:outline-none mr-2" onclick="payInstallmentMonth('${i.id}')" title="Pay Month"><i class="fas fa-credit-card"></i></button>
            ` : `
                <button class="text-xs accent-text hover:text-accent-hover focus:outline-none mr-2" onclick="openEditInstallmentForm('${i.id}')" title="Edit"><i class="fas fa-edit"></i></button>
            `}
            <button class="text-xs text-gray-500 hover:text-expense focus:outline-none" onclick="deleteInstallment('${i.id}')" title="Delete"><i class="fas fa-times"></i></button>
        </div>
    `;

    div.innerHTML = `
            ${ringHtml}
            <div class="flex-grow">
                <div class="flex justify-between items-start mb-1">
                    <div>
                        <p class="font-medium">${i.description}</p>
                        <p class="text-xs text-gray-400">${formatCurrency(
                          i.monthlyAmount
                        )} / month</p>
                    </div>
                    <span class="font-semibold text-gray-200 whitespace-nowrap">${formatCurrency(
                      totalLeftToPay
                    )} Left</span> 
                </div>
                <div class="flex justify-between items-center text-xs text-gray-400 mt-1">
                    <span>${i.monthsLeft} of ${
      i.totalMonths
    } months left (${daysLeftText})</span>
                    ${buttonsHtml}
                </div>
            </div>
        `;
    list.appendChild(div);
  });
}

let monthlyOverviewChartInstance = null;

function renderMonthlyOverviewChart() {
  const canvas = $("#monthlyOverviewChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const labels = [],
    incomeData = [],
    expenseData = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear(), 
      month = date.getMonth(); 

    labels.push(
      date.toLocaleString("default", { month: "short" }) 
    );

    let monthlyIncome = 0,
      monthlyExpense = 0;
    state.transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return;
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {

        if (t.type === "income") monthlyIncome += t.amount;
        else if (t.type === "expense") monthlyExpense += t.amount;
      }
    });
    incomeData.push(monthlyIncome);
    expenseData.push(monthlyExpense);
  }

  const incomeColor = "#2a9d8f"; 
  const expenseColor = "#e74c3c"; 
  const hexToRgba = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (monthlyOverviewChartInstance) {

    monthlyOverviewChartInstance.data.labels = labels;
    monthlyOverviewChartInstance.data.datasets[0].data = incomeData; 
    monthlyOverviewChartInstance.data.datasets[1].data = expenseData; 
    monthlyOverviewChartInstance.update();
  } else {

    monthlyOverviewChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Income",
            data: incomeData,
            borderColor: incomeColor,
            backgroundColor: hexToRgba(incomeColor, 0.3),
            fill: true,
            tension: 0.4,
            pointBackgroundColor: incomeColor,
            pointBorderColor: "#fff",
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: incomeColor,
          },
          {
            label: "Expenses",
            data: expenseData,
            borderColor: expenseColor,
            backgroundColor: hexToRgba(expenseColor, 0.3),
            fill: true,
            tension: 0.4,
            pointBackgroundColor: expenseColor,
            pointBorderColor: "#fff",
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: expenseColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#aaa",
              callback: (v) =>
                v >= 1000000
                  ? "LKR " + (v / 1000000).toFixed(1) + "M"
                  : v >= 1000
                  ? "LKR " + (v / 1000).toFixed(0) + "k"
                  : formatCurrency(v),
            },
            grid: { color: "rgba(255,255,255,0.1)", drawBorder: false },
          },
          x: {
            ticks: { color: "#aaa" },
            grid: { display: false },
          },
        },
        plugins: {
          legend: {
            position: "top",
            labels: { color: "#e0e0e0", usePointStyle: true, boxWidth: 8 },
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 10,
            cornerRadius: 4,
            usePointStyle: true,
            callbacks: {
              label: (c) =>
                `${c.dataset.label || ""}: ${formatCurrency(c.parsed.y)}`,
            },
          },
        },
        interaction: { mode: "index", intersect: false },
      },
    });
  }
}

function handleTransactionSubmit(event) {
  event.preventDefault();
  const form = event.target,
    formData = new FormData(form);
  const type = formData.get("transactionType"),
    amount = parseFloat(formData.get("amount")),
    accountId = formData.get("account");
  const category = type === "expense" ? formData.get("category") : null,
    description = formData.get("description").trim(),
    date = formData.get("date");

  if (isNaN(amount) || amount <= 0) {
    showNotification("Valid amount required.", "error");
    return;
  }
  if (!accountId) {
    showNotification("Account required.", "error");
    return;
  }
  if (type === "expense" && !category) {
    showNotification("Category required for expense.", "error");
    return;
  }
  if (!description) {
    showNotification("Description required.", "error");
    return;
  }
  if (!date) {
    showNotification("Date required.", "error");
    return;
  }

  const account = state.accounts.find((acc) => acc.id === accountId);
  if (!account) {
    showNotification("Account not found.", "error");
    return;
  }
  const timestamp = Date.now();

  if (type === "expense" && account.balance < amount) {
    showNotification(
      `Insufficient funds in ${account.name}. Transaction still added.`,
      "warning"
    );
  }
  const newTransaction = {
    id: generateId(),
    type,
    amount,
    account: accountId,
    category,
    description,
    date,
    timestamp,
  };
  state.transactions.push(newTransaction);
  if (type === "income") account.balance += amount;
  else account.balance -= amount;
  if (isNaN(account.balance)) account.balance = 0;
  showNotification(
    `${type.charAt(0).toUpperCase() + type.slice(1)} added.`,
    "success"
  );

  saveData();
  renderDashboard();
  populateDropdowns();
  form.reset();
  const dateInput = form.querySelector("#date");
  if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
  const transactionTypeSelect = form.querySelector("#transactionType");
  if (transactionTypeSelect)
    transactionTypeSelect.dispatchEvent(new Event("change"));
  refreshMonthlyViewIfRelevant(date);
}

function openEditTransactionModal(transactionId, event) {
  if (event) event.stopPropagation();
  const transaction = state.transactions.find((tx) => tx.id === transactionId);
  if (!transaction) {
    showNotification("Transaction not found for editing.", "error");
    return;
  }

  const accountOptions = state.accounts
    .map(
      (acc) =>
        `<option value="${acc.id}" ${
          transaction.account === acc.id ? "selected" : ""
        }>${acc.name} (${formatCurrency(acc.balance)})</option>`
    )
    .join("");

  const categoryOptions = state.categories
    .sort((a, b) => a.localeCompare(b))
    .map(
      (cat) =>
        `<option value="${cat}" ${
          transaction.category === cat ? "selected" : ""
        }>${cat}</option>`
    )
    .join("");

  const formHtml = `
            <input type="hidden" name="editTransactionId" value="${
              transaction.id
            }">
            <div>
                <label for="modalTransactionType" class="block text-sm font-medium mb-1">Type</label>
                <select id="modalTransactionType" name="transactionType" required onchange="toggleCategoryVisibilityInModal(this, 'modalCategoryGroup', 'modalCategory')">
                    <option value="expense" ${
                      transaction.type === "expense" ? "selected" : ""
                    }>Expense</option>
                    <option value="income" ${
                      transaction.type === "income" ? "selected" : ""
                    }>Income</option>
                </select>
            </div>
            <div>
                <label for="modalAmount" class="block text-sm font-medium mb-1">Amount (LKR)</label>
                <input type="number" id="modalAmount" name="amount" value="${transaction.amount.toFixed(
                  2
                )}" step="0.01" min="0" placeholder="e.g., 1500.50" required>
            </div>
            <div>
                <label for="modalAccount" class="block text-sm font-medium mb-1">Account</label>
                <select id="modalAccount" name="account" required>${accountOptions}</select>
            </div>
            <div id="modalCategoryGroup" style="display: ${
              transaction.type === "expense" ? "block" : "none"
            };">
                <label for="modalCategory" class="block text-sm font-medium mb-1">Category</label>
                <select id="modalCategory" name="category" ${
                  transaction.type === "expense" ? "required" : ""
                }>${categoryOptions}</select>
            </div>
            <div>
                <label for="modalDescription" class="block text-sm font-medium mb-1">Description</label>
                <input type="text" id="modalDescription" name="description" value="${
                  transaction.description
                }" placeholder="e.g., Lunch with friends" required>
            </div>
            <div>
                <label for="modalDate" class="block text-sm font-medium mb-1">Date</label>
                <input type="date" id="modalDate" name="date" value="${
                  transaction.date
                }" required>
            </div>
            <button type="submit" class="btn btn-primary w-full"><i class="fas fa-save"></i> Update Transaction</button>
        `;

  openFormModal("Edit Transaction", formHtml, handleEditTransactionModalSubmit);
  const typeSelectInModal = document.getElementById("modalTransactionType");
  if (typeSelectInModal) {
    toggleCategoryVisibilityInModal(
      typeSelectInModal,
      "modalCategoryGroup",
      "modalCategory"
    );
  }
}

function handleEditTransactionModalSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const transactionId = formData.get("editTransactionId");

  const transaction = state.transactions.find((t) => t.id === transactionId);
  if (!transaction) {
    showNotification("Transaction to edit not found.", "error");
    closeModal("formModal");
    return;
  }
  const originalDate = transaction.date;

  const newType = formData.get("transactionType");
  const newAmount = parseFloat(formData.get("amount"));
  const newAccountId = formData.get("account");
  const newCategory = newType === "expense" ? formData.get("category") : null;
  const newDescription = formData.get("description").trim();
  const newDate = formData.get("date");

  if (isNaN(newAmount) || newAmount <= 0) {
    showNotification("Valid amount required.", "error");
    return;
  }
  if (!newAccountId) {
    showNotification("Account required.", "error");
    return;
  }
  if (newType === "expense" && !newCategory) {
    showNotification("Category required for expense.", "error");
    return;
  }
  if (!newDescription) {
    showNotification("Description required.", "error");
    return;
  }
  if (!newDate) {
    showNotification("Date required.", "error");
    return;
  }

  const oldAccount = state.accounts.find(
    (acc) => acc.id === transaction.account
  );
  if (oldAccount) {
    if (transaction.type === "income") oldAccount.balance -= transaction.amount;
    else oldAccount.balance += transaction.amount;
    if (isNaN(oldAccount.balance)) oldAccount.balance = 0;
  }

  transaction.type = newType;
  transaction.amount = newAmount;
  transaction.account = newAccountId;
  transaction.category = newCategory;
  transaction.description = newDescription;
  transaction.date = newDate;
  transaction.timestamp = Date.now();

  const newAccount = state.accounts.find((acc) => acc.id === newAccountId);
  if (newAccount) {
    if (newType === "income") newAccount.balance += newAmount;
    else newAccount.balance -= newAmount;
    if (isNaN(newAccount.balance)) newAccount.balance = 0;
    if (
      newAccount.balance < 0 &&
      (oldAccount?.id !== newAccount.id || newType === "expense")
    ) {
      showNotification(
        `Warning: ${newAccount.name} now has a negative balance.`,
        "warning"
      );
    }
  } else {
    showNotification(
      "New account not found. Transaction update may be incomplete.",
      "error"
    );
  }

  saveData();
  renderDashboard();
  populateDropdowns();
  closeModal("formModal");
  showNotification("Transaction updated successfully.", "success");
  refreshMonthlyViewIfRelevant(newDate);
  if (originalDate !== newDate) {
    refreshMonthlyViewIfRelevant(originalDate);
  }
}

function deleteTransaction(id, event) {
  if (event) event.stopPropagation();
  const transactionIndex = state.transactions.findIndex((t) => t.id === id);
  if (transactionIndex === -1) return;
  const transaction = state.transactions[transactionIndex];
  const account = state.accounts.find((acc) => acc.id === transaction.account);
  if (
    confirm(
      `Delete: "${transaction.description}" (${formatCurrency(
        transaction.amount
      )})?`
    )
  ) {
    if (account) {
      if (transaction.type === "income") account.balance -= transaction.amount;
      else account.balance += transaction.amount;
      if (isNaN(account.balance)) account.balance = 0;
    }
    const deletedDate = transaction.date;
    state.transactions.splice(transactionIndex, 1);
    saveData();
    renderDashboard();
    populateDropdowns();
    showNotification("Transaction deleted.", "success");
    refreshMonthlyViewIfRelevant(deletedDate);
  }
}

function handleTransferSubmit(event) {
  event.preventDefault();
  const form = event.target; // This will be transferModalForm
  const formData = new FormData(form);

  // Get values from the modal form fields
  const amount = parseFloat(formData.get("transferAmount")); // Name attribute is 'transferAmount' in modal
  const fromAccountId = formData.get("transferFrom");     // Name attribute is 'transferFrom' in modal
  const toAccountId = formData.get("transferTo");         // Name attribute is 'transferTo' in modal

  const errorEl = $("#modalTransferError"); // Target the error element in the modal
  if (errorEl) errorEl.classList.add("hidden"); // Ensure it's hidden initially

  if (isNaN(amount) || amount <= 0) {
    showNotification("Valid amount required.", "error");
    return;
  }
  if (!fromAccountId || !toAccountId) { // Basic check for account selection
    showNotification("Both 'From' and 'To' accounts must be selected.", "error");
    return;
  }
  if (fromAccountId === toAccountId) {
    if (errorEl) errorEl.classList.remove("hidden");
    showNotification("Cannot transfer to the same account.", "error");
    return;
  }

  const fromAccount = state.accounts.find((acc) => acc.id === fromAccountId);
  const toAccount = state.accounts.find((acc) => acc.id === toAccountId);

  if (!fromAccount || !toAccount) {
    showNotification("Invalid account selected.", "error");
    return;
  }
  if (fromAccount.balance < amount) {
    showNotification(`Insufficient funds in ${fromAccount.name}.`, "warning");
    // Optionally, still allow the attempt or return;
    // For now, we'll return to prevent negative balances from transfers
    return;
  }

  fromAccount.balance -= amount;
  toAccount.balance += amount;
  if (isNaN(fromAccount.balance)) fromAccount.balance = 0; // Safeguard
  if (isNaN(toAccount.balance)) toAccount.balance = 0;   // Safeguard

  saveData();
  renderDashboard();
  populateDropdowns(); // Repopulate to reflect balance changes
  form.reset(); // Reset the modal form
  closeModal("transferMoneyModal"); // Close the modal on success

  showNotification(
    `Transferred ${formatCurrency(amount)} from ${fromAccount.name} to ${
      toAccount.name
    }.`,
    "success"
  );
}

function refreshMonthlyViewIfRelevant(dateString) {
  const monthlyViewModal = $("#monthlyViewModal"),
    activeTab = $("#monthTabs .tab-button.active");
  if (monthlyViewModal.style.display === "block" && activeTab) {
    const selectedMonth = parseInt(activeTab.dataset.month),
      selectedYear = parseInt(activeTab.dataset.year);
    const transactionDate = new Date(dateString + "T00:00:00");
    if (
      !isNaN(transactionDate.getTime()) &&
      transactionDate.getFullYear() === selectedYear &&
      transactionDate.getMonth() === selectedMonth
    ) {
      renderMonthlyDetails(selectedMonth, selectedYear);
    }
  }
}

let monthlyPieChartInstance = null;

function setupMonthlyView() {
  const yearSelector = $("#yearSelector"),
    currentYear = new Date().getFullYear();
  const years = new Set(
    state.transactions.map((t) => new Date(t.date).getFullYear())
  );
  years.add(currentYear);
  yearSelector.innerHTML = "";
  [...years]
    .sort((a, b) => b - a)
    .forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      if (year === currentYear) option.selected = true;
      yearSelector.appendChild(option);
    });
  yearSelector.addEventListener("change", () => {
    renderMonthTabs(parseInt(yearSelector.value));
    $("#monthlyDetailsContainer").innerHTML =
      '<p class="text-center text-gray-400">Select a month to view details.</p>';
    if (monthlyPieChartInstance) {
      monthlyPieChartInstance.destroy();
      monthlyPieChartInstance = null;
    }
  });
  renderMonthTabs(parseInt(yearSelector.value));
}

function renderMonthTabs(year) {
  const monthTabsContainer = $("#monthTabs");
  monthTabsContainer.innerHTML = "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  months.forEach((monthName, index) => {
    const button = document.createElement("button");
    button.className = "tab-button !px-3 !py-1.5 !text-sm";
    button.textContent = monthName;
    button.dataset.month = index;
    button.dataset.year = year;
    button.onclick = () => {
      $$("#monthTabs .tab-button").forEach((btn) =>
        btn.classList.remove("active")
      );
      button.classList.add("active");
      renderMonthlyDetails(index, year);
    };
    monthTabsContainer.appendChild(button);
  });
}

function renderMonthlyDetails(month, year) {
  const container = $("#monthlyDetailsContainer");
  container.innerHTML = ""; 

  const transactionsInMonth = state.transactions
    .filter((t) => {
      const tDate = new Date(t.date + "T00:00:00"); 
      return (
        !isNaN(tDate.getTime()) &&
        tDate.getFullYear() === year &&
        tDate.getMonth() === month
      );
    })
    .sort(
      (a, b) =>
        new Date(b.date).setHours(0, 0, 0, 0) -
          new Date(a.date).setHours(0, 0, 0, 0) || b.timestamp - a.timestamp
    );

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};
  state.categories.forEach((cat) => (categoryTotals[cat] = 0));

  let lastMonthTotalExpense = 0;
  const lastMonthDate = new Date(year, month - 1, 1);
  state.transactions
    .filter((t) => {
      const tDate = new Date(t.date + "T00:00:00");
      return (
        t.type === "expense" &&
        !isNaN(tDate.getTime()) &&
        tDate.getFullYear() === lastMonthDate.getFullYear() &&
        tDate.getMonth() === lastMonthDate.getMonth()
      );
    })
    .forEach((t) => (lastMonthTotalExpense += t.amount));

  transactionsInMonth.forEach((t) => {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else if (t.type === "expense") {
      totalExpense += t.amount;
      const category = t.category || "Other";
      if (categoryTotals[category] !== undefined) {
        categoryTotals[category] += t.amount;
      } else {
        if (!categoryTotals["Other"]) categoryTotals["Other"] = 0;
        categoryTotals["Other"] += t.amount;
      }
    }
  });

  const summaryGrid = document.createElement("div");
  summaryGrid.className =
    "monthly-view-summary-grid grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6";
  let monthSpendingIndicatorHtml = "";
  if (totalExpense > lastMonthTotalExpense && lastMonthTotalExpense >= 0) {
    monthSpendingIndicatorHtml = `<i class="fas fa-arrow-up text-indicator-bad spending-indicator" title="More than last month (${formatCurrency(
      lastMonthTotalExpense
    )})"></i>`;
  } else if (
    totalExpense < lastMonthTotalExpense &&
    lastMonthTotalExpense > 0
  ) {
    monthSpendingIndicatorHtml = `<i class="fas fa-arrow-down text-indicator-good spending-indicator" title="Less than last month (${formatCurrency(
      lastMonthTotalExpense
    )})"></i>`;
  }
  summaryGrid.innerHTML = `
      <div class="monthly-view-summary-card"><p class="text-sm text-gray-400 mb-1">Total Income</p><p class="text-xl font-semibold text-income">${formatCurrency(
        totalIncome
      )}</p></div>
      <div class="monthly-view-summary-card"><p class="text-sm text-gray-400 mb-1">Total Expenses ${monthSpendingIndicatorHtml}</p><p class="text-xl font-semibold text-expense">${formatCurrency(
    totalExpense
  )}</p></div>
      <div class="monthly-view-summary-card"><p class="text-sm text-gray-400 mb-1">Net Flow</p><p class="text-xl font-semibold ${
        totalIncome - totalExpense >= 0 ? "text-income" : "text-expense"
      }">${formatCurrency(totalIncome - totalExpense)}</p></div>`;
  container.appendChild(summaryGrid);

  const contentGrid = document.createElement("div");
  contentGrid.className =
    "monthly-view-content-grid grid grid-cols-1 md:grid-cols-5 gap-6";

  const transactionListSection = document.createElement("div");
  transactionListSection.className = "md:col-span-3 space-y-4";
  transactionListSection.innerHTML = `<h3 class="text-lg font-semibold mb-3">Transactions</h3>`;

  if (transactionsInMonth.length === 0) {
    transactionListSection.innerHTML +=
      '<p class="text-gray-400 text-center py-4">No transactions for this month.</p>';
  } else {
    const transactionsByDay = transactionsInMonth.reduce((acc, t) => {
      const dayKey = new Date(t.date).toLocaleDateString("en-CA");
      if (!acc[dayKey]) {
        acc[dayKey] = {
          date: new Date(t.date + "T00:00:00"),
          transactions: [],
          dailyTotalExpense: 0,
        };
      }
      acc[dayKey].transactions.push(t);
      if (t.type === "expense") acc[dayKey].dailyTotalExpense += t.amount;
      return acc;
    }, {});

    const sortedDays = Object.values(transactionsByDay).sort(
      (a, b) => b.date - a.date
    );
    const listContainer = document.createElement("div");
    listContainer.className = "max-h-[60vh] overflow-y-auto pr-2";

    sortedDays.forEach((dayData) => {
      const dayGroup = document.createElement("div");
      dayGroup.className = "monthly-view-day-group";
      const dayHeader = document.createElement("div");
      dayHeader.className = "monthly-view-day-header";
      dayHeader.innerHTML = `<span>${dayData.date.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}</span><span class="text-sm text-expense">Spent: ${formatCurrency(
        dayData.dailyTotalExpense
      )}</span>`;
      dayGroup.appendChild(dayHeader);

      dayData.transactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach((t) => {
          const itemDiv = document.createElement("div");
          itemDiv.className = "monthly-view-transaction-item";
          const account = state.accounts.find((a) => a.id === t.account);
          const accountName = account ? account.name : "Unknown";
          const isIncome = t.type === "income";
          const textColorClass = isIncome ? "text-income" : "text-expense";
          const subDetailText = !isIncome
            ? t.category || "Uncategorized"
            : accountName;

          itemDiv.innerHTML = `
                  <div class="flex-grow mr-2 overflow-hidden">
                      <p class="font-medium truncate ${textColorClass}" title="${
            t.description
          }">${t.description}</p>
                      <p class="text-xs text-gray-400 mt-0.5">${subDetailText}</p>
                  </div>
                  <span class="font-semibold whitespace-nowrap ${textColorClass} ml-2">${
            isIncome ? "+" : "-"
          }${formatCurrency(t.amount)}</span>
                  <div class="edit-btn-container flex-shrink-0 ml-2">
                      <button class="text-xs accent-text hover:text-accent-hover focus:outline-none" onclick="openEditTransactionForm('${
                        t.id
                      }', event)" title="Edit"><i class="fas fa-edit"></i></button>
                      <button class="text-xs text-gray-500 hover:text-expense focus:outline-none" onclick="deleteTransaction('${
                        t.id
                      }', event)" title="Delete"><i class="fas fa-times"></i></button>
                  </div>`;
          dayGroup.appendChild(itemDiv);
        });
      listContainer.appendChild(dayGroup);
    });
    transactionListSection.appendChild(listContainer);
  }
  contentGrid.appendChild(transactionListSection);

  const categorySection = document.createElement("div");
  categorySection.className = "md:col-span-2 space-y-4";

  const summaryCard = document.createElement("div");

  summaryCard.className = "p-4 rounded-lg"; 
  summaryCard.style.backgroundColor = "var(--bg-tertiary)"; 

  summaryCard.innerHTML = `<h3 class="text-lg font-semibold mb-3">Category Summary</h3>`;
  const categoryList = document.createElement("ul");
  categoryList.className =
    "monthly-view-category-list space-y-1 text-sm max-h-48 overflow-y-auto pr-2";
  const sortedCategories = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  if (sortedCategories.length > 0) {
    sortedCategories.forEach(([category, amount]) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="truncate pr-2" title="${category}">${category}</span><span class="font-medium whitespace-nowrap">${formatCurrency(
        amount
      )}</span>`;
      categoryList.appendChild(li);
    });
  } else {
    categoryList.innerHTML =
      '<li class="text-gray-400 text-sm">No expenses in any category this month.</li>';
  }
  summaryCard.appendChild(categoryList);
  categorySection.appendChild(summaryCard);

  if (sortedCategories.length > 0) {
    if (monthlyPieChartInstance) {
      monthlyPieChartInstance.destroy();
      monthlyPieChartInstance = null;
    }

    const chartCard = document.createElement("div");

    chartCard.className = "p-4 rounded-lg h-96 md:h-[450px] flex flex-col"; 
    chartCard.style.backgroundColor = "var(--bg-tertiary)"; 

    const titleEl = document.createElement("h3");
    titleEl.className = "text-lg font-semibold mb-3 text-center";
    titleEl.textContent = "Category Distribution";
    chartCard.appendChild(titleEl);

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "flex-grow relative chart-container";

    const canvas = document.createElement("canvas");
    canvas.id = "monthlyDetailPieChartCanvas"; 

    canvasContainer.appendChild(canvas);
    chartCard.appendChild(canvasContainer);
    categorySection.appendChild(chartCard);

    const pieData = {
      labels: sortedCategories.map(([c, _]) => c),
      values: sortedCategories.map(([_, a]) => a),
    };
    setTimeout(() => renderMonthlyPieChart(pieData), 100);
  } else {

    const noChartCard = document.createElement("div");

    noChartCard.className =
      "p-4 rounded-lg h-72 md:h-80 flex items-center justify-center"; 
    noChartCard.style.backgroundColor = "var(--bg-tertiary)"; 

    noChartCard.innerHTML =
      '<p class="text-gray-400 text-sm">No expense data for chart.</p>';
    categorySection.appendChild(noChartCard);

    if (monthlyPieChartInstance) {
      monthlyPieChartInstance.destroy();
      monthlyPieChartInstance = null;
    }
  }
  contentGrid.appendChild(categorySection);
  container.appendChild(contentGrid);
}

function renderMonthlyPieChart(data) {
  const canvas = document.getElementById("monthlyDetailPieChartCanvas"); 
  if (!canvas || !canvas.getContext) {
    console.error(
      "Canvas for monthly pie chart (id: monthlyDetailPieChartCanvas) not found or invalid."
    );

    if (monthlyPieChartInstance) {
      monthlyPieChartInstance.destroy();
      monthlyPieChartInstance = null;
    }
    return;
  }
  const ctx = canvas.getContext("2d");

  const brandPiePalette = [
    "#e67e26",
    "#2a9d8f",
    "#e74c3c",
    "#3498db",
    "#f1c40f",
    "#9b59b6",
    "#34495e",
    "#1abc9c",
    "#7f8c8d",
    "#2ecc71",
    "#d35400",
    "#27ae60",
    "#c0392b",
  ];
  const backgroundColors = data.labels.map(
    (_, index) => brandPiePalette[index % brandPiePalette.length]
  );

  if (monthlyPieChartInstance) {

    monthlyPieChartInstance.data.labels = data.labels;
    monthlyPieChartInstance.data.datasets[0].data = data.values;
    monthlyPieChartInstance.data.datasets[0].backgroundColor = backgroundColors;
    monthlyPieChartInstance.update();
  } else {

    monthlyPieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Expenses by Category",
            data: data.values,
            backgroundColor: backgroundColors,
            borderColor: "var(--bg-secondary)", 
            borderWidth: 1,
            hoverOffset: 8,
            hoverBorderColor: "var(--text-primary)", 
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {

            display: false,

          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.85)",
            titleColor: "#fff",
            bodyColor: "#fff",
            padding: 12,
            cornerRadius: 4,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed !== null) {
                  label += formatCurrency(context.parsed);

                  const datasetMeta = context.chart.getDatasetMeta(0);
                  const total =
                    datasetMeta.total ||
                    datasetMeta.data.reduce((sum, el) => sum + el.raw, 0);
                  const percentage =
                    total > 0
                      ? ((context.parsed / total) * 100).toFixed(1) + "%"
                      : "0.0%";
                  label += ` (${percentage})`;
                }
                return label;
              },
            },
          },
        },
      },
    });
  }
}

function renderCreditCardSection() {
  const limit = state.creditCard.limit || 0,
    transactions = state.creditCard.transactions || [];
  $("#ccLimit").textContent = formatCurrency(limit);
  const spentUnpaid = transactions
    .filter((t) => !t.paidOff)
    .reduce((sum, t) => sum + t.amount - (t.paidAmount || 0), 0);
  const available = limit - spentUnpaid,
    availableEl = $("#ccAvailable");
  availableEl.textContent = formatCurrency(available);
  availableEl.classList.toggle("text-danger", available < 0);
  availableEl.classList.toggle("accent-text", available >= 0);
}

function openCcHistoryModal() {
  const modal = $("#ccHistoryModal"),
    listContainer = $("#ccHistoryListContainer");
  if (!modal || !listContainer) return;

  const limit = state.creditCard.limit || 0,
    transactions = state.creditCard.transactions || [];
  $("#ccHistoryLimit").textContent = formatCurrency(limit);
  const spentUnpaid = transactions
    .filter((t) => !t.paidOff)
    .reduce((sum, t) => sum + t.amount - (t.paidAmount || 0), 0);
  const available = limit - spentUnpaid;
  $("#ccHistorySpentUnpaid").textContent = formatCurrency(spentUnpaid);
  const availableEl = $("#ccHistoryAvailable");
  availableEl.textContent = formatCurrency(available);
  availableEl.classList.toggle("text-expense", available < 0);
  availableEl.classList.toggle("accent-text", available >= 0);

  listContainer.innerHTML = "";
  const sortedTransactions = [...transactions].sort(
    (a, b) =>
      new Date(b.date).setHours(0, 0, 0, 0) -
        new Date(a.date).setHours(0, 0, 0, 0) || b.timestamp - a.timestamp
  );

  if (sortedTransactions.length === 0) {
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm text-center py-4">No CC transactions.</p>';
  } else {
    sortedTransactions.forEach((t) => {
      const div = document.createElement("div");
      div.className = `flex justify-between items-center p-3 border-b border-gray-700 text-sm ${
        t.paidOff ? "opacity-60" : ""
      }`;
      const remainingOnItem = t.amount - (t.paidAmount || 0);

      // Consistent button structure
      const buttonsHtml = `
      <div class="edit-btn-container">
          ${!t.paidOff && remainingOnItem > 0.005 ? `
              <button class="text-xs text-income hover:opacity-80 focus:outline-none mr-2" onclick="openPayCcItemForm('${t.id}')" title="Pay Item"><i class="fas fa-dollar-sign"></i></button>
          ` : ''}
          <button class="text-xs accent-text hover:text-accent-hover focus:outline-none mr-2" onclick="openEditCcTransactionForm('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="text-xs text-gray-500 hover:text-expense focus:outline-none" onclick="deleteCcTransaction('${t.id}')" title="Delete"><i class="fas fa-times"></i></button>
      </div>
      `;

      div.innerHTML = `
        <div class="cc-history-item-details flex-grow mr-3 overflow-hidden">
            <p class="cc-history-item-description ${
              t.paidOff ? "text-gray-500" : ""
            }" title="${t.description}">${t.description}</p>
            <p class="cc-history-item-date">${new Date(
              t.date
            ).toLocaleDateString()} ${
        t.paidAmount > 0 && !t.paidOff
          ? `(Paid: ${formatCurrency(t.paidAmount)})`
          : ""
      }</p>
        </div>
        <div class="flex items-center flex-shrink-0">
            <span class="font-semibold mr-3 ${
              t.paidOff
                ? "text-gray-500"
                : remainingOnItem <= 0.005
                ? "text-income"
                : "text-expense"
            }">
                ${
                  t.paidOff
                    ? formatCurrency(t.amount)
                    : formatCurrency(remainingOnItem)
                } ${
        t.paidOff ? "" : remainingOnItem <= 0.005 ? " (Settled)" : " Left"
      }
            </span>
            ${buttonsHtml}
        </div>`;
      listContainer.appendChild(div);
    });
  }
  modal.style.display = "block";
}

function openSetCcLimitForm() {
  const currentLimit = state.creditCard.limit || 0;
  openFormModal(
    "Set Credit Card Limit",
    `<div><label for="ccLimitAmount" class="block text-sm font-medium mb-1">Credit Limit (LKR)</label><input type="number" id="ccLimitAmount" name="ccLimitAmount" step="0.01" min="0" value="${currentLimit.toFixed(
      2
    )}" placeholder="Enter total limit" required></div><button type="submit" class="btn btn-primary w-full">Set Limit</button>`,
    handleSetCcLimitSubmit
  );
}

function handleCcTransactionSubmit(event) {
  event.preventDefault();
  const form = event.target,
    formData = new FormData(form);
  const amount = parseFloat(formData.get("ccAmount")),
    description = formData.get("ccDescription").trim(),
    date = formData.get("ccDate");
  if (isNaN(amount) || amount <= 0) {
    showNotification("Valid amount required.", "error");
    return;
  }
  if (!description) {
    showNotification("Description required.", "error");
    return;
  }
  if (!date) {
    showNotification("Date required.", "error");
    return;
  }
  if (!state.creditCard.transactions) state.creditCard.transactions = [];
  const timestamp = Date.now();

  const newCcTransaction = {
    id: generateId(),
    amount,
    description,
    date,
    paidAmount: 0,
    paidOff: false,
    timestamp,
  };
  state.creditCard.transactions.push(newCcTransaction);
  showNotification("CC transaction added.", "success");

  saveData();
  renderCreditCardSection();
  if ($("#ccHistoryModal").style.display === "block") openCcHistoryModal();
  form.reset();
  const ccDateInput = form.querySelector("#ccDate");
  if (ccDateInput) ccDateInput.value = new Date().toISOString().split("T")[0];
}

function openEditCcTransactionModal(ccTransactionId) {
  const transaction = state.creditCard.transactions.find(
    (tx) => tx.id === ccTransactionId
  );
  if (!transaction) {
    showNotification("CC Transaction not found for editing.", "error");
    return;
  }
  if ($("#ccHistoryModal").style.display === "block") {
    closeModal("ccHistoryModal");
  }

  const formHtml = `
            <input type="hidden" name="editCcTransactionId" value="${
              transaction.id
            }">
            <div>
                <label for="modalCcAmount" class="block text-sm font-medium mb-1">Amount (LKR)</label>
                <input type="number" id="modalCcAmount" name="ccAmount" value="${transaction.amount.toFixed(
                  2
                )}" step="0.01" min="0" placeholder="Amount spent" required>
            </div>
            <div>
                <label for="modalCcDescription" class="block text-sm font-medium mb-1">Description</label>
                <input type="text" id="modalCcDescription" name="ccDescription" value="${
                  transaction.description
                }" placeholder="e.g., Online purchase" required>
            </div>
            <div>
                <label for="modalCcDate" class="block text-sm font-medium mb-1">Date</label>
                <input type="date" id="modalCcDate" name="ccDate" value="${
                  transaction.date
                }" required>
            </div>
            <button type="submit" class="btn btn-primary w-full"><i class="fas fa-save"></i> Update CC Transaction</button>
        `;
  openFormModal(
    "Edit CC Transaction",
    formHtml,
    handleEditCcTransactionModalSubmit
  );
}

function handleEditCcTransactionModalSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const ccTransactionId = formData.get("editCcTransactionId");

  const transaction = state.creditCard.transactions.find(
    (t) => t.id === ccTransactionId
  );
  if (!transaction) {
    showNotification("CC Transaction to edit not found.", "error");
    closeModal("formModal");
    return;
  }

  const newAmount = parseFloat(formData.get("ccAmount"));
  const newDescription = formData.get("ccDescription").trim();
  const newDate = formData.get("ccDate");

  if (isNaN(newAmount) || newAmount <= 0) {
    showNotification("Valid amount required.", "error");
    return;
  }
  if (!newDescription) {
    showNotification("Description required.", "error");
    return;
  }
  if (!newDate) {
    showNotification("Date required.", "error");
    return;
  }

  transaction.amount = newAmount;
  transaction.description = newDescription;
  transaction.date = newDate;
  transaction.timestamp = Date.now();

  if (transaction.paidAmount > newAmount) {
    transaction.paidAmount = newAmount;
  }
  if (transaction.paidAmount >= newAmount - 0.005) {
    transaction.paidOff = true;
    transaction.paidAmount = newAmount;
  } else {
    transaction.paidOff = false;
  }

  saveData();
  renderCreditCardSection();
  closeModal("formModal");
  showNotification("CC Transaction updated successfully.", "success");
}

function deleteCcTransaction(transactionId) {
  const transactionIndex = state.creditCard.transactions.findIndex(
    (t) => t.id === transactionId
  );
  if (transactionIndex === -1) return;
  const transaction = state.creditCard.transactions[transactionIndex];
  if (
    confirm(
      `Delete CC transaction: "${transaction.description}" (${formatCurrency(
        transaction.amount
      )})? This will also remove any associated payment records made through the app for this specific CC item.`
    )
  ) {
    state.transactions = state.transactions.filter(
      (tx) =>
        !(
          tx.category === "Credit Card Payment" &&
          tx.description.includes(transaction.description.substring(0, 15))
        )
    );
    state.creditCard.transactions.splice(transactionIndex, 1);
    saveData();
    renderDashboard();
    renderCreditCardSection();
    if ($("#ccHistoryModal").style.display === "block") openCcHistoryModal();
    showNotification("CC transaction and related payments deleted.", "success");
  }
}

function openAddDebtForm() {
  openFormModal(
    "Add New Debt",
    `<div><label for="debtWho" class="block text-sm font-medium mb-1">Who do you owe?</label><input type="text" id="debtWho" name="debtWho" placeholder="e.g., John Doe" required></div><div><label for="debtWhy" class="block text-sm font-medium mb-1">Reason?</label><input type="text" id="debtWhy" name="debtWhy" placeholder="e.g., Loan" required></div><div><label for="debtAmount" class="block text-sm font-medium mb-1">Amount Owed (LKR)</label><input type="number" id="debtAmount" name="debtAmount" step="0.01" min="0.01" required></div><div><label for="debtDueDate" class="block text-sm font-medium mb-1">Due Date</label><input type="date" id="debtDueDate" name="debtDueDate" required></div><button type="submit" class="btn btn-primary w-full">Add Debt</button>`,
    handleAddDebtSubmit
  );
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const debtDueDateInput = $("#debtDueDate");
  if (debtDueDateInput)
    debtDueDateInput.value = nextMonth.toISOString().split("T")[0];
}

function handleAddDebtSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const amount = parseFloat(form.get("debtAmount"));
  if (isNaN(amount) || amount <= 0) {
    showNotification("Invalid amount.", "error");
    return;
  }
  const newDebt = {
    id: generateId(),
    who: form.get("debtWho").trim(),
    why: form.get("debtWhy").trim(),
    amount: amount,
    originalAmount: amount,
    remainingAmount: amount,
    dueDate: form.get("debtDueDate"),
    timestamp: Date.now(),
  };
  if (!newDebt.who || !newDebt.why || !newDebt.dueDate) {
    showNotification("All fields required.", "error");
    return;
  }
  state.debts.push(newDebt);
  saveData();
  renderDashboard();
  closeModal("formModal");
  showNotification("Debt added.", "success");
}

function openEditDebtForm(id) {
  const d = state.debts.find((item) => item.id === id);
  if (!d) return;
  openFormModal(
    "Edit Debt",
    ` <input type="hidden" name="editDebtId" value="${
      d.id
    }"> <div><label class="block text-sm font-medium mb-1">Who</label><input type="text" name="debtWho" value="${
      d.who
    }" required></div> <div><label class="block text-sm font-medium mb-1">Why</label><input type="text" name="debtWhy" value="${
      d.why
    }" required></div> <div><label class="block text-sm font-medium mb-1">Original Amount</label><input type="number" name="debtOriginalAmount" value="${(
      d.originalAmount || d.amount
    ).toFixed(
      2
    )}" step="0.01" min="0.01" required></div> <div><label class="block text-sm font-medium mb-1">Remaining Amount</label><input type="number" name="debtRemainingAmount" value="${d.remainingAmount.toFixed(
      2
    )}" step="0.01" min="0" required></div> <div><label class="block text-sm font-medium mb-1">Due Date</label><input type="date" name="debtDueDate" value="${
      d.dueDate
    }" required></div> <button type="submit" class="btn btn-primary w-full">Update Debt</button> `,
    handleEditDebtSubmit
  );
}

function handleEditDebtSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const id = form.get("editDebtId");
  const debt = state.debts.find((d) => d.id === id);
  if (!debt) return;
  debt.who = form.get("debtWho").trim();
  debt.why = form.get("debtWhy").trim();
  debt.originalAmount = parseFloat(form.get("debtOriginalAmount"));
  debt.remainingAmount = parseFloat(form.get("debtRemainingAmount"));
  debt.dueDate = form.get("debtDueDate");
  debt.timestamp = Date.now();
  if (
    isNaN(debt.originalAmount) ||
    debt.originalAmount <= 0 ||
    isNaN(debt.remainingAmount) ||
    debt.remainingAmount < 0 ||
    debt.remainingAmount > debt.originalAmount
  ) {
    showNotification(
      "Invalid amounts for debt. Remaining cannot exceed original.",
      "error"
    );
    return;
  }
  debt.amount = debt.originalAmount;
  saveData();
  renderDashboard();
  closeModal("formModal");
  showNotification("Debt updated.", "success");
}

function openPayDebtForm(debtId) {
  const debt = state.debts.find((d) => d.id === debtId);
  if (!debt) return;

  const debtRepaymentCategoryName = "Debt Repayment";
  let categoryOptions = "";
  const otherCategories = state.categories
    .filter(
      (c) =>
        c.toLowerCase() !== "income" &&
        c.toLowerCase() !== "credit card payment" &&
        c.toLowerCase() !== debtRepaymentCategoryName.toLowerCase()
    )
    .sort((a, b) => a.localeCompare(b));

  if (
    state.categories.some(
      (c) => c.toLowerCase() === debtRepaymentCategoryName.toLowerCase()
    )
  ) {
    categoryOptions += `<option value="${debtRepaymentCategoryName}" selected>${debtRepaymentCategoryName}</option>`;
  } else {
    categoryOptions += `<option value="${debtRepaymentCategoryName}" selected>${debtRepaymentCategoryName} (Suggested)</option>`;
  }
  otherCategories.forEach((cat) => {
    categoryOptions += `<option value="${cat}">${cat}</option>`;
  });

  const formHtml = `
      <p class="mb-2">Owed: <span class="font-semibold">${formatCurrency(
        debt.remainingAmount
      )}</span> to ${debt.who} for ${debt.why}</p>
      <div>
          <label for="payDebtAmount" class="block text-sm font-medium mb-1">Payment Amount (LKR)</label>
          <input type="number" id="payDebtAmount" name="payDebtAmount" step="0.01" min="0.01" max="${debt.remainingAmount.toFixed(
            2
          )}" value="${debt.remainingAmount.toFixed(2)}" required>
      </div>
      <div>
          <label for="modalPayDebtAccount" class="block text-sm font-medium mb-1">Pay From Account</label>
          <select id="modalPayDebtAccount" name="payDebtAccount" required></select>
      </div>
      <div class="flex items-center mt-3 mb-1">
          <input type="checkbox" id="logDebtPaymentAsExpense" name="logDebtPaymentAsExpense" class="h-4 w-4 text-accent-primary border-gray-500 rounded focus:ring-accent-primary mr-2" checked>
          <label for="logDebtPaymentAsExpense" class="text-sm font-medium text-gray-300">Log this payment as an expense?</label>
      </div>
      <div id="debtPaymentCategoryGroup">
          <label for="modalPayDebtCategory" class="block text-sm font-medium mb-1">Category for this Payment</label>
          <select id="modalPayDebtCategory" name="payDebtCategory" required>${categoryOptions}</select>
      </div>
      <input type="hidden" name="debtId" value="${debtId}">
      <button type="submit" class="btn btn-primary w-full mt-3">Make Payment</button>
  `;
  openFormModal(`Pay Debt: ${debt.who}`, formHtml, handlePayDebtSubmit);
  populateDropdowns();

  const logExpenseCheckbox = document.getElementById("logDebtPaymentAsExpense");
  const categoryGroupDiv = document.getElementById("debtPaymentCategoryGroup");
  const categorySelect = document.getElementById("modalPayDebtCategory");

  if (logExpenseCheckbox && categoryGroupDiv && categorySelect) {
    categoryGroupDiv.style.display = logExpenseCheckbox.checked
      ? "block"
      : "none";
    categorySelect.required = logExpenseCheckbox.checked;

    logExpenseCheckbox.onchange = () => {
      if (logExpenseCheckbox.checked) {
        categoryGroupDiv.style.display = "block";
        categorySelect.required = true;
      } else {
        categoryGroupDiv.style.display = "none";
        categorySelect.required = false;
      }
    };
  }
}

function handlePayDebtSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const debtId = form.get("debtId");
  const paymentAmount = parseFloat(form.get("payDebtAmount"));
  const accountId = form.get("payDebtAccount");
  const logAsExpense = form.get("logDebtPaymentAsExpense") === "on";
  const category = logAsExpense ? form.get("payDebtCategory") : null;
  const currentDate = new Date().toISOString().split("T")[0];

  const debt = state.debts.find((d) => d.id === debtId);
  const account = state.accounts.find((acc) => acc.id === accountId);

  if (!debt || !account) {
    showNotification("Debt or account not found.", "error");
    return;
  }
  if (
    isNaN(paymentAmount) ||
    paymentAmount <= 0 ||
    paymentAmount > debt.remainingAmount + 0.005
  ) {
    showNotification("Invalid payment amount.", "error");
    return;
  }
  if (logAsExpense && !category) {
    showNotification(
      "Please select a category for this payment if logging as an expense.",
      "error"
    );
    return;
  }
  if (account.balance < paymentAmount) {
    showNotification(`Insufficient funds in ${account.name}.`, "warning");
    return;
  }

  account.balance -= paymentAmount;
  if (isNaN(account.balance)) account.balance = 0;
  debt.remainingAmount -= paymentAmount;

  let message = `Payment of ${formatCurrency(paymentAmount)} made for ${
    debt.who
  }. Remaining: ${formatCurrency(debt.remainingAmount)}.`;

  if (logAsExpense) {
    const expenseTransaction = {
      id: generateId(),
      type: "expense",
      amount: paymentAmount,
      account: accountId,
      category: category,
      description: `Debt Pmt: ${debt.who} - ${debt.why.substring(0, 20)}${
        debt.why.length > 20 ? "..." : ""
      }`,
      date: currentDate,
      timestamp: Date.now(),
    };
    state.transactions.push(expenseTransaction);
    message += " Expense logged.";
    refreshMonthlyViewIfRelevant(currentDate);
  } else {
    message += " Not logged as expense.";
  }

  if (debt.remainingAmount <= 0.005) {
    state.debts = state.debts.filter((d) => d.id !== debtId);
    message = `Debt for ${debt.who} fully paid.${
      logAsExpense ? " Expense logged." : " Not logged as expense."
    }`;
  }

  saveData();
  renderDashboard();
  populateDropdowns();
  closeModal("formModal");
  showNotification(message, "success");
}

function deleteDebt(debtId) {
  const debt = state.debts.find((d) => d.id === debtId);
  if (!debt) return;
  if (
    confirm(
      `Delete debt for "${debt.who}" (${formatCurrency(
        debt.remainingAmount
      )})? This removes the record only.`
    )
  ) {
    state.debts = state.debts.filter((d) => d.id !== debtId);
    saveData();
    renderDashboard();
    showNotification("Debt entry deleted.", "success");
  }
}

function openAddReceivableForm() {
  const formHtml = `
            <div><label for="recWho" class="block text-sm font-medium mb-1">Who owes you?</label><input type="text" id="recWho" name="recWho" placeholder="e.g., Jane Doe" required></div>
            <div><label for="recWhy" class="block text-sm font-medium mb-1">Reason?</label><input type="text" id="recWhy" name="recWhy" placeholder="e.g., Friendly loan" required></div>
            <div><label for="recAmount" class="block text-sm font-medium mb-1">Amount Owed (LKR)</label><input type="number" id="recAmount" name="recAmount" step="0.01" min="0.01" required></div>
            <div><label for="recDateGiven" class="block text-sm font-medium mb-1">Date Given</label><input type="date" id="recDateGiven" name="recDateGiven" required></div>
            <div>
                <label for="recType" class="block text-sm font-medium mb-1">Type</label>
                <select id="recType" name="recType" required onchange="toggleReceivableSourceAccount(this.value, 'recSourceAccountGroupAdd', 'recSourceAccountAdd')">
                    <option value="cash">Cash/Bank Loan</option>
                    <option value="cc">Credit Card Loan</option>
                </select>
            </div>
            <div id="recSourceAccountGroupAdd" style="display: block;"> <label for="recSourceAccountAdd" class="block text-sm font-medium mb-1">Source Account (if Cash/Bank)</label>
                <select id="recSourceAccountAdd" name="receivableSourceAccount" required></select> </div>
                <p id="receivableCcDisclaimer" class="disclaimer-text" style="display: none;">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>Important:</strong> Selecting "Credit Card Loan" means you provided funds from your credit card. This entry tracks the money owed <em>to you</em>. It does not automatically create an expense on your credit card. If you used your credit card for this, please add a separate "CC Expense" manually to reflect the charge on your card.
            </p>
            <button type="submit" class="btn btn-primary w-full"><i class="fas fa-plus"></i> Add Receivable</button>
        `;
  openFormModal("Add New Receivable", formHtml, handleAddReceivableSubmit);

  const dateGivenInput = $("#recDateGiven");
  if (dateGivenInput)
    dateGivenInput.value = new Date().toISOString().split("T")[0];

  const sourceAccountSelect = $("#recSourceAccountAdd");
  if (sourceAccountSelect) {
    sourceAccountSelect.innerHTML = "";
    state.accounts.forEach((a) => {
      const o = document.createElement("option");
      o.value = a.id;
      o.textContent = `${a.name} (${formatCurrency(a.balance)})`;
      sourceAccountSelect.appendChild(o);
    });
  }
  const recTypeSelect = $("#recType");
  if (recTypeSelect) {
    toggleReceivableSourceAccount(
      recTypeSelect.value,
      "recSourceAccountGroupAdd",
      "recSourceAccountAdd"
    );
  }
}

function toggleReceivableSourceAccount(type, groupId, selectId) {
  const group = document.getElementById(groupId); 
  const select = document.getElementById(selectId);
  const disclaimerElement = document.getElementById("receivableCcDisclaimer"); 

  if (group && select) {

    if (type === "cash") {
      group.style.display = "block";
      select.required = true;
      if (disclaimerElement) {
        disclaimerElement.style.display = "none"; 
      }
    } else {

      group.style.display = "none";
      select.required = false;
      if (disclaimerElement) {
        disclaimerElement.style.display = "block"; 
      }
    }
  } else {
    if (!group)
      console.warn(
        `toggleReceivableSourceAccount: Group element with ID '${groupId}' not found.`
      );
    if (!select)
      console.warn(
        `toggleReceivableSourceAccount: Select element with ID '${selectId}' not found.`
      );
  }

  if (!disclaimerElement && type === "cc") {
    console.warn(
      "toggleReceivableSourceAccount: Disclaimer element with ID 'receivableCcDisclaimer' not found, but was expected for 'cc' type."
    );
  }
}

function handleAddReceivableSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const amount = parseFloat(form.get("recAmount"));
  const type = form.get("recType");

  const sourceAccountId =
    type === "cash" ? form.get("receivableSourceAccount") : null;

  if (isNaN(amount) || amount <= 0) {
    showNotification("Invalid amount.", "error");
    return;
  }
  const newRec = {
    id: generateId(),
    who: form.get("recWho").trim(),
    why: form.get("recWhy").trim(),
    amount: amount,
    originalAmount: amount,
    remainingAmount: amount,
    dateGiven: form.get("recDateGiven"),
    type: type,
    sourceAccount: sourceAccountId,
    ccTransactionId: null,
    timestamp: Date.now(),
  };
  if (!newRec.who || !newRec.why || !newRec.dateGiven) {
    showNotification("All fields required.", "error");
    return;
  }

  if (type === "cash") {
    if (!sourceAccountId) {
      showNotification("Source account required for cash loan.", "error");
      return;
    }
    let srcAcc = state.accounts.find((acc) => acc.id === sourceAccountId);
    if (!srcAcc) {
      showNotification("Source account not found.", "error");
      return;
    }
    if (srcAcc.balance < amount) {
      showNotification(`Insufficient funds in ${srcAcc.name}.`, "warning");
      return;
    }
    srcAcc.balance -= amount; 
    if (isNaN(srcAcc.balance)) srcAcc.balance = 0;
  } else if (type === "cc") {

    console.log(
      `Receivable of type 'cc' added for ${newRec.who}. User to manually add CC expense if needed.`
    );
  }

  state.receivables.push(newRec);
  saveData();
  renderDashboard();
  populateDropdowns();
  if (type === "cc") renderCreditCardSection();
  closeModal("formModal");
  showNotification(
    `Receivable for ${newRec.who} added.${
      type === "cash" && sourceAccountId
        ? ` ${formatCurrency(amount)} deducted from account.`
        : ""
    }`,
    "success"
  );
}

function openEditReceivableForm(id) {
  const r = state.receivables.find((item) => item.id === id);
  if (!r) return;
  openFormModal(
    "Edit Receivable",
    ` <input type="hidden" name="editReceivableId" value="${
      r.id
    }"> <div><label class="block text-sm font-medium mb-1">Who</label><input type="text" name="recWho" value="${
      r.who
    }" required></div> <div><label class="block text-sm font-medium mb-1">Why</label><input type="text" name="recWhy" value="${
      r.why
    }" required></div> <div><label class="block text-sm font-medium mb-1">Original Amount</label><input type="number" name="recOriginalAmount" value="${(
      r.originalAmount || r.amount
    ).toFixed(
      2
    )}" step="0.01" min="0.01" required></div> <div><label class="block text-sm font-medium mb-1">Remaining</label><input type="number" name="recRemainingAmount" value="${r.remainingAmount.toFixed(
      2
    )}" step="0.01" min="0" required></div> <div><label class="block text-sm font-medium mb-1">Date Given</label><input type="date" name="recDateGiven" value="${
      r.dateGiven
    }" required></div> <div><label class="block text-sm font-medium mb-1">Type</label><select id="recTypeEdit" name="recType" onchange="toggleReceivableSourceAccount(this.value, 'recSourceAccountGroupEdit', 'recSourceAccountEdit')"><option value="cash" ${
      r.type === "cash" ? "selected" : ""
    }>Cash/Bank</option><option value="cc" ${
      r.type === "cc" ? "selected" : ""
    }>Credit Card</option></select></div> <div id="recSourceAccountGroupEdit" style="display:${
      r.type === "cash" ? "block" : "none"
    }"><label class="block text-sm font-medium mb-1">Source Account</label><select id="recSourceAccountEdit" name="receivableSourceAccount">${state.accounts
      .map(
        (acc) =>
          `<option value="${acc.id}" ${
            r.sourceAccount === acc.id ? "selected" : ""
          }>${acc.name} (${formatCurrency(acc.balance)})</option>`
      )
      .join(
        ""
      )}</select></div> <button type="submit" class="btn btn-primary w-full">Update Receivable</button> `,
    handleEditReceivableSubmit
  );
  const recTypeEditSelect = $("#recTypeEdit");
  if (recTypeEditSelect)
    toggleReceivableSourceAccount(
      recTypeEditSelect.value,
      "recSourceAccountGroupEdit",
      "recSourceAccountEdit"
    );
}

function handleEditReceivableSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const id = form.get("editReceivableId");
  const rec = state.receivables.find((r) => r.id === id);
  if (!rec) return;
  const oldSourceAccountId = rec.sourceAccount,
    oldOriginalAmount = rec.originalAmount,
    oldType = rec.type,
    oldCcTxId = rec.ccTransactionId;
  rec.who = form.get("recWho").trim();
  rec.why = form.get("recWhy").trim();
  const newOriginalAmount = parseFloat(form.get("recOriginalAmount"));
  rec.remainingAmount = parseFloat(form.get("recRemainingAmount"));
  rec.dateGiven = form.get("recDateGiven");
  rec.type = form.get("recType");
  rec.sourceAccount =
    rec.type === "cash" ? form.get("receivableSourceAccount") : null;
  rec.timestamp = Date.now();
  if (
    isNaN(newOriginalAmount) ||
    newOriginalAmount <= 0 ||
    isNaN(rec.remainingAmount) ||
    rec.remainingAmount < 0 ||
    rec.remainingAmount > newOriginalAmount
  ) {
    showNotification("Invalid amounts.", "error");
    return;
  }
  if (rec.type === "cash" && !rec.sourceAccount) {
    showNotification("Source account required for cash loan.", "error");
    return;
  }
  const oldSourceAccount = state.accounts.find(
    (acc) => acc.id === oldSourceAccountId
  );
  if (oldType === "cash" && oldSourceAccount)
    oldSourceAccount.balance += oldOriginalAmount;
  if (oldType === "cc" && oldCcTxId)
    state.creditCard.transactions = state.creditCard.transactions.filter(
      (tx) => tx.id !== oldCcTxId
    );
  rec.originalAmount = newOriginalAmount;
  rec.amount = newOriginalAmount;
  rec.ccTransactionId = null;
  if (rec.type === "cash" && rec.sourceAccount) {
    const newSourceAccount = state.accounts.find(
      (acc) => acc.id === rec.sourceAccount
    );
    if (newSourceAccount) {
      if (newSourceAccount.balance < rec.amount) {
        showNotification(
          `Insufficient funds in new source ${newSourceAccount.name}. Reverting.`,
          "warning"
        );
        if (oldType === "cash" && oldSourceAccount)
          oldSourceAccount.balance -= oldOriginalAmount;
        if (oldType === "cc" && oldCcTxId) {
          console.warn("Could not re-add old CC tx during revert.");
        }
        rec.originalAmount = oldOriginalAmount;
        rec.amount = oldOriginalAmount;
        return;
      }
      newSourceAccount.balance -= rec.amount;
    }
  } else if (rec.type === "cc") {
    const ccTx = {
      id: generateId(),
      amount: rec.amount,
      description: `Loan to ${rec.who}: ${rec.why}`,
      date: rec.dateGiven,
      paidAmount: 0,
      paidOff: false,
      timestamp: Date.now(),
    };
    state.creditCard.transactions.push(ccTx);
    rec.ccTransactionId = ccTx.id;
  }
  saveData();
  renderDashboard();
  populateDropdowns();
  if (rec.type === "cc" || oldType === "cc") renderCreditCardSection();
  closeModal("formModal");
  showNotification("Receivable updated.", "success");
}

function openReceivePaymentForm(recId) {
  const receivable = state.receivables.find((r) => r.id === recId);
  if (!receivable) {
    showNotification("Receivable not found.", "error");
    return;
  }

  let disclaimerHtml = "";
  if (receivable.type === "cc") {
    disclaimerHtml = `
      <p id="receivablePaymentCcDisclaimer" class="disclaimer-text mt-3 mb-2">
        <i class="fas fa-info-circle mr-1"></i>
        <strong>Credit Card Receivable:</strong> The amount you receive will be added to the selected account. Remember, this does not pay your credit card bill. You'll need to record a separate 'Credit Card Payment' transaction later.
      </p>
    `;
  }

  const formHtml = `
    <p class="mb-2">Owed: <span class="font-semibold">${formatCurrency(
      receivable.remainingAmount
    )}</span> by ${receivable.who} for ${receivable.why}</p>
    <div>
      <label for="recPaymentAmount" class="block text-sm font-medium mb-1">Amount Received (LKR)</label>
      <input type="number" id="recPaymentAmount" name="recPaymentAmount" step="0.01" min="0.01" max="${receivable.remainingAmount.toFixed(
        2
      )}" value="${receivable.remainingAmount.toFixed(2)}" required>
    </div>
    <div>
      <label for="recPaymentAccount" class="block text-sm font-medium mb-1">Receive Into Account</label>
      <select id="recPaymentAccount" name="recPaymentAccount" required></select>
    </div>
    ${disclaimerHtml} 
    <input type="hidden" name="recId" value="${recId}">
    <button type="submit" class="btn btn-primary w-full mt-3">Record Payment</button>
  `;

  openFormModal(
    `Receive Payment from: ${receivable.who}`,
    formHtml,
    handleReceivePaymentSubmit
  );
  populateDropdowns(); 
}

function handleReceivePaymentSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const recId = form.get("recId"),
    paymentAmount = parseFloat(form.get("recPaymentAmount")),
    accountId = form.get("recPaymentAccount");
  const receivable = state.receivables.find((r) => r.id === recId),
    account = state.accounts.find((acc) => acc.id === accountId);
  if (!receivable || !account) {
    showNotification("Receivable/account not found.", "error");
    return;
  }
  if (
    isNaN(paymentAmount) ||
    paymentAmount <= 0 ||
    paymentAmount > receivable.remainingAmount + 0.005
  ) {
    showNotification("Invalid payment amount.", "error");
    return;
  }
  account.balance += paymentAmount;
  receivable.remainingAmount -= paymentAmount;
  if (isNaN(account.balance)) account.balance = 0;
  let message = `Payment of ${formatCurrency(paymentAmount)} received from ${
    receivable.who
  }. Remaining: ${formatCurrency(receivable.remainingAmount)}`;
  if (receivable.remainingAmount <= 0.005) {
    state.receivables = state.receivables.filter((r) => r.id !== recId);
    message = `Receivable from ${receivable.who} fully paid.`;
  }
  saveData();
  renderDashboard();
  populateDropdowns();
  closeModal("formModal");
  showNotification(message, "success");
}

function deleteReceivable(recId) {
  const receivable = state.receivables.find((r) => r.id === recId);
  if (!receivable) return;
  let confirmMessage = `Delete receivable for "${
    receivable.who
  }" (${formatCurrency(receivable.remainingAmount)})? This removes the record.`;
  if (receivable.type === "cash" && receivable.sourceAccount) {
    confirmMessage += `\n\nWarning: Does NOT refund amount deducted from source account.`;
  } else if (receivable.type === "cc" && receivable.ccTransactionId) {
    confirmMessage += `\n\nWarning: This will also remove the associated CC transaction record.`;
  }
  if (confirm(confirmMessage)) {
    if (receivable.type === "cc" && receivable.ccTransactionId)
      state.creditCard.transactions = state.creditCard.transactions.filter(
        (tx) => tx.id !== receivable.ccTransactionId
      );
    state.receivables = state.receivables.filter((r) => r.id !== recId);
    saveData();
    renderDashboard();
    if (receivable.type === "cc") renderCreditCardSection();
    showNotification("Receivable entry deleted.", "success");
  }
}

function openAddInstallmentForm() {

  const formHtml = `
            <div>
                <label for="instDescription" class="block text-sm font-medium mb-1">Description</label>
                <input type="text" id="instDescription" name="instDescription" placeholder="e.g., New Phone" required>
            </div>
            <div>
                <label for="instFullAmount" class="block text-sm font-medium mb-1">Full Original Amount (LKR)</label>
                <input type="number" id="instFullAmount" name="instFullAmount" step="0.01" min="0.01" placeholder="Total original cost" required>
            </div>
            <div>
                <label for="instTotalMonths" class="block text-sm font-medium mb-1">Total Months for Plan</label>
                <input type="number" id="instTotalMonths" name="instTotalMonths" step="1" min="1" placeholder="e.g., 12" required>
            </div>
            <div>
                <label for="instMonthsLeft" class="block text-sm font-medium mb-1">Months Left (if not full term)</label>
                <input type="number" id="instMonthsLeft" name="instMonthsLeft" step="1" min="0" placeholder="Defaults to Total Months">
            </div>
            <div>
                <label for="instStartDate" class="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" id="instStartDate" name="instStartDate" required>
            </div>
            <p id="installmentCcDisclaimer" class="disclaimer-text" style="display: block;">
                <i class="fas fa-info-circle mr-1"></i>
                <strong>Important:</strong> This entry tracks your installment plan. It does not automatically create Credit Card expense entries for each payment. If this plan is for a credit card purchase, please remember to add corresponding "CC Expense" entries manually as payments are made or appear on your statement to accurately reflect your CC balance.
            </p>
            <button type="submit" class="btn btn-primary w-full">Add Plan</button>
        `;
  openFormModal(
    "Add New Installment Plan",
    formHtml,
    handleAddInstallmentSubmit
  );
  const instStartDateInput = $("#instStartDate");
  if (instStartDateInput)
    instStartDateInput.value = new Date().toISOString().split("T")[0];

  const totalMonthsInput = $("#instTotalMonths");
  const monthsLeftInput = $("#instMonthsLeft");
  if (totalMonthsInput && monthsLeftInput) {
    const setMaxMonthsLeft = () => {
      const total = parseInt(totalMonthsInput.value);
      if (!isNaN(total) && total > 0) {
        monthsLeftInput.max = total;
        if (parseInt(monthsLeftInput.value) > total) {
          monthsLeftInput.value = total;
        }
      } else {
        monthsLeftInput.removeAttribute("max");
      }
    };
    totalMonthsInput.addEventListener("input", setMaxMonthsLeft);

    setMaxMonthsLeft();
  }
}

function handleAddInstallmentSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const fullAmount = parseFloat(formData.get("instFullAmount"));
  const totalMonths = parseInt(formData.get("instTotalMonths"));
  let monthsLeft = parseInt(formData.get("instMonthsLeft")); 

  if (
    isNaN(fullAmount) ||
    fullAmount <= 0 ||
    isNaN(totalMonths) ||
    totalMonths <= 0
  ) {
    showNotification("Invalid full amount or total months.", "error");
    return;
  }

  if (isNaN(monthsLeft) || monthsLeft > totalMonths || monthsLeft < 0) {
    monthsLeft = totalMonths; 
  }

  const monthlyAmount = fullAmount / totalMonths; 

  const newInstallment = {
    id: generateId(),
    description: formData.get("instDescription").trim(),
    monthlyAmount: monthlyAmount,
    totalMonths: totalMonths,
    monthsLeft: monthsLeft, 
    startDate: formData.get("instStartDate"),
    originalFullAmount: fullAmount,
    timestamp: Date.now(),
  };

  if (!newInstallment.description || !newInstallment.startDate) {
    showNotification("Description and Start Date are required.", "error");
    return;
  }

  state.installments.push(newInstallment);
  saveData();
  renderDashboard(); 
  closeModal("formModal");
  showNotification("Installment plan added.", "success");
}

function openEditInstallmentForm(id) {
  const i = state.installments.find((item) => item.id === id);
  if (!i) return;
  const currentFullAmount =
    i.originalFullAmount || i.monthlyAmount * i.totalMonths;
  openFormModal(
    "Edit Installment Plan",
    ` <input type="hidden" name="editInstallmentId" value="${
      i.id
    }"> <div><label class="block text-sm font-medium mb-1">Description</label><input type="text" name="instDescription" value="${
      i.description
    }" required></div> <div><label class="block text-sm font-medium mb-1">Full Amount</label><input type="number" name="instFullAmount" value="${currentFullAmount.toFixed(
      2
    )}" step="0.01" min="0.01" required></div> <div><label class="block text-sm font-medium mb-1">Total Months</label><input type="number" name="instTotalMonths" value="${
      i.totalMonths
    }" step="1" min="1" required></div> <div><label class="block text-sm font-medium mb-1">Months Left</label><input type="number" name="instMonthsLeft" value="${
      i.monthsLeft
    }" step="1" min="0" max="${
      i.totalMonths
    }" required></div> <div><label class="block text-sm font-medium mb-1">Start Date</label><input type="date" name="instStartDate" value="${
      i.startDate
    }" required></div> <button type="submit" class="btn btn-primary w-full">Update Plan</button> `,
    handleEditInstallmentSubmit
  );
}

function handleEditInstallmentSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const id = form.get("editInstallmentId");
  const inst = state.installments.find((i) => i.id === id);
  if (!inst) return;
  const fullAmount = parseFloat(form.get("instFullAmount"));
  const totalMonths = parseInt(form.get("instTotalMonths"));
  if (
    isNaN(fullAmount) ||
    fullAmount <= 0 ||
    isNaN(totalMonths) ||
    totalMonths <= 0
  ) {
    showNotification("Invalid full amount or total months.", "error");
    return;
  }
  inst.description = form.get("instDescription").trim();
  inst.totalMonths = totalMonths;
  inst.monthsLeft = parseInt(form.get("instMonthsLeft"));
  inst.startDate = form.get("instStartDate");
  inst.monthlyAmount = fullAmount / totalMonths;
  inst.originalFullAmount = fullAmount;
  inst.timestamp = Date.now();
  if (
    isNaN(inst.monthsLeft) ||
    inst.monthsLeft < 0 ||
    inst.monthsLeft > inst.totalMonths
  ) {
    showNotification("Invalid months left.", "error");
    return;
  }
  saveData();
  renderDashboard();
  closeModal("formModal");
  showNotification("Installment plan updated.", "success");
}

function payInstallmentMonth(installmentId) {
  const installment = state.installments.find((i) => i.id === installmentId);
  if (!installment || installment.monthsLeft <= 0) {
    showNotification(
      installment && installment.monthsLeft <= 0
        ? "Installment plan already fully paid."
        : "Installment not found.",
      "info"
    );
    return;
  }

  const categoryOptions = state.categories
    .filter((c) => c.toLowerCase() !== "income" && c.toLowerCase() !== "credit card payment") // Exclude "Income" and "Credit Card Payment"
    .sort((a,b) => a.localeCompare(b)) // Sort alphabetically
    .map(
      (cat) =>
        `<option value="${cat}" ${
          // Try to pre-select "Installment Payment" or a similar default
          cat.toLowerCase() === "installment payment" || cat.toLowerCase() === "installments" ? "selected" : ""
        }>${cat}</option>`
    )
    .join("");

  // Disclaimer HTML, similar to the one for receivables
  const disclaimerHtml = `
    <p id="installmentPaymentCcDisclaimer" class="disclaimer-text mt-3 mb-2" style="display: block;">
        <i class="fas fa-info-circle mr-1"></i>
        <strong>Important:</strong> If this installment is for a credit card purchase, remember this action logs the payment from your chosen account. It does not automatically record a payment towards your credit card bill itself. You may need to record a separate 'Credit Card Payment' transaction if you are settling your credit card statement.
    </p>
  `;

  openFormModal(
    `Pay Installment: ${installment.description}`,
    `<p class="mb-2">Paying 1 month (${formatCurrency(
      installment.monthlyAmount
    )}). ${
      installment.monthsLeft - 1
    } months will remain.</p>
     <div>
        <label class="block text-sm font-medium mb-1">Pay From Account</label>
        <select id="modalInstPayAccount" name="instPayAccount" required></select>
     </div>
     <div>
        <label class="block text-sm font-medium mb-1">Category for this Payment</label>
        <select id="modalInstPayCategory" name="instPayCategory" required>${categoryOptions}</select>
     </div>
     ${disclaimerHtml}
     <input type="hidden" name="installmentId" value="${installmentId}">
     <button type="submit" class="btn btn-primary w-full mt-4">Confirm Payment</button>`, // Added mt-4 for spacing
    handlePayInstallmentSubmit
  );
  populateDropdowns(); // Ensure dropdowns in the modal are populated
}

function handlePayInstallmentSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const installmentId = form.get("installmentId"),
    accountId = form.get("instPayAccount"),
    category = form.get("instPayCategory");

  const installment = state.installments.find((i) => i.id === installmentId);
  const account = state.accounts.find((acc) => acc.id === accountId);

  if (!installment || !account) {
    showNotification("Installment or account not found.", "error");
    return;
  }
  if (installment.monthsLeft <= 0) {

    showNotification("Installment plan already fully paid.", "info");
    closeModal("formModal"); 
    return;
  }
  if (account.balance < installment.monthlyAmount) {
    showNotification(`Insufficient funds in ${account.name}.`, "warning");
    return;
  }
  if (!category) {
    showNotification("Please select a category for this payment.", "error");
    return;
  }

  account.balance -= installment.monthlyAmount;
  if (isNaN(account.balance)) account.balance = 0;

  installment.monthsLeft -= 1;

  const paymentDate = new Date().toISOString().split("T")[0];
  const expenseTransaction = {
    id: generateId(),
    type: "expense",
    amount: installment.monthlyAmount,
    account: accountId,
    category: category,
    description: `Installment: ${installment.description} (Month ${
      installment.totalMonths - installment.monthsLeft
    }/${installment.totalMonths})`,
    date: paymentDate,
    timestamp: Date.now(),
  };
  state.transactions.push(expenseTransaction);

  let notificationMessage;
  if (installment.monthsLeft <= 0) {

    state.installments = state.installments.filter(
      (i) => i.id !== installmentId
    );
    notificationMessage = `Installment for "${installment.description}" fully paid and removed. Expense logged.`;
  } else {
    notificationMessage = `Installment month paid for "${installment.description}". ${installment.monthsLeft} months remaining. Expense logged.`;
  }

  saveData();
  renderDashboard(); 
  populateDropdowns();
  closeModal("formModal");
  showNotification(notificationMessage, "success");
  refreshMonthlyViewIfRelevant(paymentDate);
}

function deleteInstallment(installmentId) {
  const installment = state.installments.find((i) => i.id === installmentId);
  if (!installment) return;
  if (
    confirm(
      `Delete installment plan "${installment.description}"? This removes the record only.`
    )
  ) {
    state.installments = state.installments.filter(
      (i) => i.id !== installmentId
    );
    saveData();
    renderDashboard();
    showNotification("Installment plan deleted.", "success");
  }
}

function openPayCcItemForm(ccTransactionId) {
  const item = state.creditCard.transactions.find(
    (t) => t.id === ccTransactionId
  );
  if (!item) return;
  const remaining = item.amount - (item.paidAmount || 0);
  if (remaining <= 0.005) {
    showNotification("This item is already fully paid/settled.", "info");
    return;
  }

  const ccPaymentCategoryName = "Credit Card Payment";
  let categoryOptions = "";
  const otherCcCategories = state.categories
    .filter(
      (c) =>
        c.toLowerCase() !== "income" &&

        c.toLowerCase() !== ccPaymentCategoryName.toLowerCase()
    )
    .sort((a, b) => a.localeCompare(b));

  if (
    state.categories.some(
      (c) => c.toLowerCase() === ccPaymentCategoryName.toLowerCase()
    )
  ) {
    categoryOptions += `<option value="${ccPaymentCategoryName}" selected>${ccPaymentCategoryName}</option>`;
  } else {
    categoryOptions += `<option value="${ccPaymentCategoryName}" selected>${ccPaymentCategoryName} (Suggested)</option>`;
  }
  otherCcCategories.forEach((cat) => {
    categoryOptions += `<option value="${cat}">${cat}</option>`;
  });

  const formHtml = `
      <input type="hidden" name="ccItemId" value="${item.id}">
      <p class="mb-2">Item Amount: ${formatCurrency(item.amount)}</p>
      <p class="mb-2">Paid So Far: ${formatCurrency(item.paidAmount || 0)}</p>
      <p class="mb-2">Remaining on Item: <strong class="text-danger">${formatCurrency(
        remaining
      )}</strong></p>
      <div>
          <label for="ccItemPayAmount" class="block text-sm font-medium mb-1">Payment Amount</label>
          <input type="number" id="ccItemPayAmount" name="ccItemPayAmount" step="0.01" min="0.01" max="${remaining.toFixed(
            2
          )}" value="${remaining.toFixed(2)}" required>
      </div>
      <div>
          <label for="modalCcPayFromAccount" class="block text-sm font-medium mb-1">Pay From Account</label>
          <select id="modalCcPayFromAccount" name="ccPayFromAccount" required></select>
      </div>
      <div class="flex items-center mt-3 mb-1">
          <input type="checkbox" id="logCcPaymentAsExpense" name="logCcPaymentAsExpense" class="h-4 w-4 text-accent-primary border-gray-500 rounded focus:ring-accent-primary mr-2" checked>
          <label for="logCcPaymentAsExpense" class="text-sm font-medium text-gray-300">Log this payment as an expense?</label>
      </div>
      <div id="ccPaymentCategoryGroup">
          <label for="modalCcPayCategory" class="block text-sm font-medium mb-1">Category for this Payment</label>
          <select id="modalCcPayCategory" name="ccPayCategory" required>${categoryOptions}</select>
      </div>
      <button type="submit" class="btn btn-primary w-full mt-3">Make Payment</button>
  `;
  openFormModal(
    `Pay CC Item: ${item.description.substring(0, 30)}...`,
    formHtml,
    handlePayCcItemSubmit
  );
  populateDropdowns();

  const logCcExpenseCheckbox = document.getElementById("logCcPaymentAsExpense");
  const ccCategoryGroupDiv = document.getElementById("ccPaymentCategoryGroup");
  const ccCategorySelect = document.getElementById("modalCcPayCategory");

  if (logCcExpenseCheckbox && ccCategoryGroupDiv && ccCategorySelect) {

    ccCategoryGroupDiv.style.display = logCcExpenseCheckbox.checked
      ? "block"
      : "none";
    ccCategorySelect.required = logCcExpenseCheckbox.checked;

    logCcExpenseCheckbox.onchange = () => {
      if (logCcExpenseCheckbox.checked) {
        ccCategoryGroupDiv.style.display = "block";
        ccCategorySelect.required = true;
      } else {
        ccCategoryGroupDiv.style.display = "none";
        ccCategorySelect.required = false;
      }
    };
  }
}

function handlePayCcItemSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const ccItemId = form.get("ccItemId");
  const paymentAmount = parseFloat(form.get("ccItemPayAmount"));
  const accountId = form.get("ccPayFromAccount");
  const logAsExpense = form.get("logCcPaymentAsExpense") === "on";
  const category = logAsExpense ? form.get("ccPayCategory") : null;

  const item = state.creditCard.transactions.find((t) => t.id === ccItemId);
  const account = state.accounts.find((acc) => acc.id === accountId);

  if (!item || !account) {
    showNotification("Item or account not found.", "error");
    return;
  }
  const remainingOnItem = item.amount - (item.paidAmount || 0);
  if (
    isNaN(paymentAmount) ||
    paymentAmount <= 0 ||
    paymentAmount > remainingOnItem + 0.005
  ) {
    showNotification("Invalid payment amount for CC item.", "error");
    return;
  }
  if (logAsExpense && !category) {
    showNotification(
      "Please select a category for this payment if logging as an expense.",
      "error"
    );
    return;
  }
  if (account.balance < paymentAmount) {
    showNotification(`Insufficient funds in ${account.name}.`, "warning");
    return;
  }

  account.balance -= paymentAmount;
  if (isNaN(account.balance)) account.balance = 0;

  item.paidAmount = (item.paidAmount || 0) + paymentAmount;
  if (item.paidAmount >= item.amount - 0.005) {
    item.paidOff = true;
    item.paidAmount = item.amount;
  }

  let notificationMessage = `Payment of ${formatCurrency(
    paymentAmount
  )} for CC item "${item.description.substring(0, 20)}..." recorded.`;
  const paymentDate = new Date().toISOString().split("T")[0];

  if (logAsExpense) {
    const expenseTx = {
      id: generateId(),
      type: "expense",
      amount: paymentAmount,
      account: accountId,
      category: category,
      description: `CC Pmt: ${item.description.substring(0, 20)}${
        item.description.length > 20 ? "..." : ""
      }`,
      date: paymentDate,
      timestamp: Date.now(),
    };
    state.transactions.push(expenseTx);
    notificationMessage += " Expense logged.";
    refreshMonthlyViewIfRelevant(paymentDate);
  } else {
    notificationMessage += " Not logged as expense.";
  }
  if (item.paidOff) {
    notificationMessage = `CC item "${item.description.substring(
      0,
      20
    )}..." fully paid.${
      logAsExpense ? " Expense logged." : " Not logged as expense."
    }`;
  }

  saveData();
  renderDashboard();
  renderCreditCardSection();
  if ($("#ccHistoryModal").style.display === "block") openCcHistoryModal();
  closeModal("formModal");
  showNotification(notificationMessage, "success");
}

function openSettingsModal() {

  renderSettingsForm(); 

  setupSettingsTabs(); 

  const storageInfoElement = $("#storageSizeInfo");
  if (storageInfoElement) {
    storageInfoElement.textContent = `Approx. Storage Used: ${getFormattedLocalStorageSize(
      STORAGE_KEY
    )}`;
  }

  $("#settingsModal").style.display = "block";
  cancelDeleteAllData(); 
  displayAppVersion(); 
}

function renderSettingsForm() {

  const accountManagementList = $("#accountManagementList");
  if (!accountManagementList) {
    console.error(
      "#accountManagementList element not found in #settingsAccountsPanel."
    );
  } else {
    accountManagementList.innerHTML = ""; 
    state.accounts.forEach((acc) => {
      const accRow = document.createElement("div");
      accRow.className =
        "grid grid-cols-1 sm:grid-cols-[minmax(0,2fr),minmax(0,2fr)] gap-x-3 gap-y-2 items-center py-1";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.name = `accountName_${acc.id}`;
      nameInput.value = acc.name;
      nameInput.dataset.accountId = acc.id;
      nameInput.className = "!py-1 !px-2 text-sm rounded placeholder-gray-400";
      nameInput.style.backgroundColor = "var(--bg-secondary)";
      nameInput.style.borderColor = "var(--border-color)";
      nameInput.style.color = "var(--text-primary)";
      if (acc.id === "cash") {
        nameInput.readOnly = true;
        nameInput.classList.add("text-gray-400", "cursor-not-allowed");
      }

      const balanceInput = document.createElement("input");
      balanceInput.type = "number";
      balanceInput.name = `accountBalance_${acc.id}`;
      balanceInput.value = acc.balance.toFixed(2);
      balanceInput.step = "0.01";
      balanceInput.dataset.accountId = acc.id;
      balanceInput.className =
        "!py-1 !px-2 text-sm rounded placeholder-gray-400";
      balanceInput.style.backgroundColor = "var(--bg-secondary)";
      balanceInput.style.borderColor = "var(--border-color)";
      balanceInput.style.color = "var(--text-primary)";

      accRow.appendChild(nameInput);
      accRow.appendChild(balanceInput);
      accountManagementList.appendChild(accRow);
    });
  }

  const manageAccountsForm = $("#manageAccountsForm"); 
  if (manageAccountsForm) {
    manageAccountsForm.onsubmit = handleManageAccountsSubmit;
  }

  const settingsCcLimitAmountInput = $("#settingsCcLimitAmount"); 
  if (settingsCcLimitAmountInput) {
    settingsCcLimitAmountInput.value = (
      (state.creditCard && state.creditCard.limit) ||
      0
    ).toFixed(2);
    settingsCcLimitAmountInput.style.backgroundColor = "var(--bg-secondary)";
    settingsCcLimitAmountInput.style.borderColor = "var(--border-color)";
    settingsCcLimitAmountInput.style.color = "var(--text-primary)";
  }

  const settingsCcLimitForm = $("#settingsCcLimitForm"); 
  if (settingsCcLimitForm) {
    settingsCcLimitForm.onsubmit = (event) => {
      event.preventDefault();
      const formData = new FormData(settingsCcLimitForm);
      const limit = parseFloat(formData.get("ccLimitAmount"));
      if (isNaN(limit) || limit < 0) {
        showNotification("Invalid credit limit amount.", "error");
        return;
      }
      if (!state.creditCard) {
        state.creditCard = { limit: 0, transactions: [] };
      }
      state.creditCard.limit = limit;
      saveData();
      renderCreditCardSection();
      if ($("#ccHistoryModal").style.display === "block") openCcHistoryModal();
      showNotification(
        `Credit limit set to ${formatCurrency(limit)}.`,
        "success"
      );
    };
  }

  const toggleCcSectionElement = $("#toggleCcSection"); 
  if (toggleCcSectionElement) {
    if (!state.settings) {
      state.settings = {
        initialSetupDone: false,
        showCcDashboardSection: true,
        theme: "dark",
      };
    }
    toggleCcSectionElement.checked =
      state.settings.showCcDashboardSection !== undefined
        ? state.settings.showCcDashboardSection
        : true;

    if (!toggleCcSectionElement.dataset.listenerAttached) {

      toggleCcSectionElement.onchange = () => {
        if (!state.settings) {
          state.settings = {
            initialSetupDone: false,
            showCcDashboardSection: true,
            theme: "dark",
          };
        }
        state.settings.showCcDashboardSection = toggleCcSectionElement.checked;
        saveData();
        updateCcDashboardSectionVisibility();
        showNotification(
          `Credit Card section on dashboard will now be ${
            toggleCcSectionElement.checked ? "shown" : "hidden"
          }.`,
          "info"
        );
      };
      toggleCcSectionElement.dataset.listenerAttached = "true";
    }
  }

  const addCategoryForm = $("#addCategoryForm"); 
  if (addCategoryForm) {
    addCategoryForm.onsubmit = addCategory;
    const newCategoryNameInput =
      addCategoryForm.querySelector("#newCategoryName");
    if (newCategoryNameInput) {
      newCategoryNameInput.style.backgroundColor = "var(--bg-secondary)";
      newCategoryNameInput.style.borderColor = "var(--border-color)";
      newCategoryNameInput.style.color = "var(--text-primary)";
    }
  }
  renderCategorySettingsList(); 

}

function renderCategorySettingsList() {
  const categoryList = $("#categorySettingsList");
  if (!categoryList) {
    console.error("#categorySettingsList element not found.");
    return;
  }
  categoryList.innerHTML = ""; 

  const sortedCategories = [...state.categories].sort((a, b) =>
    a.localeCompare(b)
  );

  sortedCategories.forEach((cat) => {
    const li = document.createElement("li");

    li.className = "flex justify-between items-center p-2 rounded";
    li.style.backgroundColor = "var(--bg-secondary)";
    li.style.borderColor = "var(--border-color)"; 
    li.style.borderWidth = "1px"; 

    const inputElementHTML = `<input type="text" value="${cat}" data-original-name="${cat}" class="bg-transparent border-none focus:ring-0 focus:outline-none p-0 flex-grow mr-2 text-sm">`;

    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "flex items-center gap-x-2";

    const saveButtonHTML = `<button class="btn btn-primary btn-sm !py-0.5 !px-2 text-xs" onclick="renameCategory(this)">Save</button>`;
    const deleteButtonHTML = `<button class="text-gray-400 hover:text-expense focus:outline-none" onclick="deleteCategory('${cat}')" title="Delete Category"><i class="fas fa-times"></i></button>`;

    li.innerHTML = inputElementHTML;
    buttonsDiv.innerHTML = saveButtonHTML + deleteButtonHTML;
    li.appendChild(buttonsDiv);

    categoryList.appendChild(li);
  });
}

function renameCategory(buttonElement) {
  const liElement = buttonElement.closest("li");
  const inputElement = liElement.querySelector('input[type="text"]');
  const newName = inputElement.value.trim();
  const originalName = inputElement.dataset.originalName;
  if (!newName) {
    showNotification("Category name cannot be empty.", "error");
    inputElement.value = originalName;
    return;
  }
  if (newName === originalName) return;
  if (
    state.categories.some(
      (cat) =>
        cat.toLowerCase() === newName.toLowerCase() && cat !== originalName
    )
  ) {
    showNotification(`Category name "${newName}" already exists.`, "error");
    inputElement.value = originalName;
    return;
  }
  const index = state.categories.indexOf(originalName);
  if (index > -1) {
    state.categories[index] = newName;
    state.categories.sort((a, b) => a.localeCompare(b));
    let updateCount = 0;
    state.transactions.forEach((t) => {
      if (t.category === originalName) {
        t.category = newName;
        updateCount++;
      }
    });
    saveData();
    populateDropdowns();
    renderCategorySettingsList();
    showNotification(
      `Category "${originalName}" renamed to "${newName}". ${updateCount} transaction(s) updated.`,
      "success"
    );
  } else {
    showNotification(`Original category "${originalName}" not found.`, "error");
    inputElement.value = originalName;
  }
}

function addCategory(event) {
  event.preventDefault();
  const input = $("#newCategoryName");
  const newCategoryName = input.value.trim();
  if (!newCategoryName) {
    showNotification("Category name cannot be empty.", "error");
    return;
  }
  if (
    state.categories.some(
      (cat) => cat.toLowerCase() === newCategoryName.toLowerCase()
    )
  ) {
    showNotification(
      `Category "${newCategoryName}" already exists.`,
      "warning"
    );
    input.value = "";
    return;
  }
  state.categories.push(newCategoryName);
  state.categories.sort((a, b) => a.localeCompare(b));
  saveData();
  populateDropdowns();
  renderCategorySettingsList();
  input.value = "";
  showNotification(`Category "${newCategoryName}" added.`, "success");
}

function deleteCategory(categoryName) {
  if (categoryName === "Other") {
    showNotification("The 'Other' category cannot be deleted.", "warning");
    return;
  }
  const isUsed = state.transactions.some((t) => t.category === categoryName);
  if (isUsed) {
    showNotification(
      `Category "${categoryName}" is in use and cannot be deleted. Reassign transactions first or rename the category.`,
      "error"
    );
    return;
  }
  if (!state.categories.includes(categoryName)) {
    showNotification(`Category "${categoryName}" not found.`, "error");
    return;
  }
  if (
    confirm(
      `Are you sure you want to delete the category "${categoryName}"? This action cannot be undone if the category is not in use.`
    )
  ) {
    state.categories = state.categories.filter((cat) => cat !== categoryName);
    saveData();
    populateDropdowns();
    renderCategorySettingsList();
    showNotification(`Category "${categoryName}" deleted.`, "success");
  }
}

function handleSetCcLimitSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const limit = parseFloat(formData.get("ccLimitAmount"));
  if (isNaN(limit) || limit < 0) {
    showNotification("Invalid credit limit.", "error");
    return;
  }
  state.creditCard.limit = limit;
  saveData();
  renderCreditCardSection();
  if ($("#ccHistoryModal").style.display === "block") openCcHistoryModal();
  closeModal("formModal");
  showNotification(`Credit limit set to ${formatCurrency(limit)}.`, "success");
}

function updateCcDashboardSectionVisibility() {
  const ccDashboardSection = $("#creditCardDashboardSection");
  if (ccDashboardSection) {

    let isVisible = true; 
    if (state.settings && state.settings.showCcDashboardSection !== undefined) {
      isVisible = state.settings.showCcDashboardSection;
    } else if (state.settings === undefined) {

      state.settings = {
        initialSetupDone: false,
        showCcDashboardSection: true,
      };
      console.log(
        "state.settings was undefined, initialized showCcDashboardSection to true"
      );
    }

    if (isVisible) {
      ccDashboardSection.style.display = ""; 
    } else {
      ccDashboardSection.style.display = "none";
    }
  }

  const ccLimitSettingsCard = $("#ccLimitSettingsCard");
  if (ccLimitSettingsCard) {

  }
}

function handleManageAccountsSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  let changesMade = false;
  let errors = [];

  state.accounts.forEach((acc) => {
    const newNameInput = formData.get(`accountName_${acc.id}`);
    const newBalanceInput = formData.get(`accountBalance_${acc.id}`);

    if (newNameInput === null || newBalanceInput === null) {
      console.warn(`Inputs for account ${acc.id} not found in form data.`);
      return; 
    }

    const newName = newNameInput.trim();
    const newBalance = parseFloat(newBalanceInput);

    if (acc.id !== "cash") {
      if (!newName) {
        errors.push(
          `Account name for "${acc.name}" (ID: ${acc.id}) cannot be empty.`
        );

      } else if (newName !== acc.name) {

        if (
          state.accounts.some(
            (existingAcc) =>
              existingAcc.id !== acc.id &&
              existingAcc.name.toLowerCase() === newName.toLowerCase()
          )
        ) {
          errors.push(
            `Account name "${newName}" already exists. Please choose a unique name.`
          );
        } else {
          console.log(
            `Account ${acc.id} name changed from "${acc.name}" to "${newName}"`
          );
          acc.name = newName;
          changesMade = true;
        }
      }
    }

    if (isNaN(newBalance)) {
      errors.push(
        `Invalid balance entered for account "${acc.name}". Please enter a valid number.`
      );
    } else if (Math.abs(acc.balance - newBalance) > 0.005) {

      console.log(
        `Account ${acc.id} balance changed from ${acc.balance.toFixed(
          2
        )} to ${newBalance.toFixed(2)}`
      );
      acc.balance = newBalance;
      changesMade = true;
    }
  });

  if (errors.length > 0) {
    errors.forEach((err) => showNotification(err, "error", 6000));

    renderSettingsForm(); 
    return;
  }

  if (changesMade) {

    if (state.settings && !state.settings.initialSetupDone) {
      state.settings.initialSetupDone = true;
    }
    saveData();
    renderDashboard(); 
    populateDropdowns(); 
    renderSettingsForm(); 
    showNotification(
      "Account names and/or balances updated successfully.",
      "success"
    );
  } else {
    showNotification(
      "No changes detected in account names or balances.",
      "info"
    );
  }
}

function exportData() {
  try {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], {
      type: "application/json",
    });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");
    link.download = `kaasi-backup-${timestamp}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Data exported.", "success");
  } catch (error) {
    console.error("Export failed:", error);
    showNotification("Data export failed.", "error");
  }
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm("Importing data will OVERWRITE ALL current data. Proceed?")) {
    event.target.value = null;
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (
        importedData &&
        importedData.accounts &&
        importedData.transactions !== undefined &&
        importedData.categories &&
        importedData.creditCard
      ) {
        state = deepMerge(getDefaultState(), importedData);
        ensureDefaultAccounts();
        ensureDefaultCategories();
        state.accounts.forEach((acc) => {
          if (isNaN(acc.balance)) acc.balance = 0;
        });
        if (isNaN(state.creditCard.limit)) state.creditCard.limit = 0;
        saveData();
        initializeUI(true);
        showNotification("Data imported. Application refreshed.", "success");
        closeModal("settingsModal");
      } else {
        throw new Error("Invalid data structure.");
      }
    } catch (error) {
      console.error("Import failed:", error);
      showNotification(`Import failed: ${error.message}`, "error");
    } finally {
      event.target.value = null;
    }
  };
  reader.onerror = () => {
    showNotification("Failed to read file.", "error");
    event.target.value = null;
  };
  reader.readAsText(file);
}

function initiateDeleteAllData() {
  $("#initiateDeleteBtn").classList.add("hidden");
  $("#deleteConfirmationSection").classList.remove("hidden");
  resetDeleteSlider();
}

function cancelDeleteAllData() {
  $("#initiateDeleteBtn").classList.remove("hidden");
  $("#deleteConfirmationSection").classList.add("hidden");
  resetDeleteSlider();
}
let maxTranslateX = 0;
let isDragging = false; 
function setupDeleteSlider() {
  const sliderContainer = $("#deleteSliderContainer");
  const handle = $("#deleteSliderHandle");
  const track = sliderContainer.querySelector(".slide-to-confirm-track");
  if (!sliderContainer || !handle || !track) return;

  let startX = 0;
  let currentTranslateX = 0;

  const calculateMaxTranslate = () => {
    maxTranslateX = sliderContainer.offsetWidth - handle.offsetWidth - 4; 
  };

  window.resetDeleteSlider = () => {
    isDragging = false;
    currentTranslateX = 0;
    handle.style.transition =
      "transform 0.2s ease-out, background-color 0.2s ease-out";
    track.style.transition =
      "width 0.2s ease-out, background-color 0.2s ease-out";
    handle.style.transform = `translateX(0px)`;
    track.style.width = `0px`; 
    track.style.backgroundColor = "var(--button-success-bg)"; 
    handle.innerHTML = '<i class="fas fa-arrow-right"></i>';
    handle.style.backgroundColor = "var(--accent-primary)";
    handle.style.cursor = "grab";
    sliderContainer.style.cursor = "pointer";
  };

  const startDrag = (clientX) => {
    calculateMaxTranslate(); 
    isDragging = true;
    startX = clientX - handle.getBoundingClientRect().left; 
    handle.style.transition = "none"; 
    track.style.transition = "none";
    handle.style.cursor = "grabbing";
    sliderContainer.style.cursor = "grabbing";
  };

  const drag = (clientX) => {
    if (!isDragging) return;
    let newTranslateX =
      clientX - sliderContainer.getBoundingClientRect().left - startX;
    currentTranslateX = Math.max(0, Math.min(newTranslateX, maxTranslateX));
    handle.style.transform = `translateX(${currentTranslateX}px)`;
    track.style.width = `${currentTranslateX + handle.offsetWidth / 2}px`; 
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    handle.style.cursor = "grab";
    sliderContainer.style.cursor = "pointer";

    handle.style.transition =
      "transform 0.2s ease-out, background-color 0.2s ease-out";
    track.style.transition =
      "width 0.2s ease-out, background-color 0.2s ease-out";

    if (currentTranslateX >= maxTranslateX - 1) {

      completeDeletion();
    } else {
      resetDeleteSlider(); 
    }
  }; 

  handle.addEventListener("mousedown", (e) => startDrag(e.clientX));
  document.addEventListener("mousemove", (e) => {
    if (isDragging) drag(e.clientX);
  });
  document.addEventListener("mouseup", endDrag);

  handle.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault(); 
      startDrag(e.touches[0].clientX);
    },
    {
      passive: false,
    }
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      if (isDragging) {
        e.preventDefault(); 
        drag(e.touches[0].clientX);
      }
    },
    {
      passive: false,
    }
  );
  document.addEventListener("touchend", endDrag);

  window.addEventListener("resize", () => {
    if (
      $("#deleteConfirmationSection") &&
      !$("#deleteConfirmationSection").classList.contains("hidden")
    ) {
      calculateMaxTranslate(); 
      resetDeleteSlider(); 
    }
  });
} 

function completeDeletion() {
  const handle = $("#deleteSliderHandle");
  const track = $(".slide-to-confirm-track");
  handle.innerHTML = '<i class="fas fa-check"></i>';
  handle.style.backgroundColor = "var(--button-success-bg)";
  track.style.width = "100%";
  track.style.backgroundColor = "var(--button-success-bg)";
  handle.style.transform = `translateX(${maxTranslateX}px)`;
  isDragging = false;
  handle.style.pointerEvents = "none";
  setTimeout(() => {
    localStorage.removeItem(STORAGE_KEY);
    state = getDefaultState();
    ensureDefaultAccounts();
    ensureDefaultCategories();
    initializeUI(true);
    closeModal("settingsModal");
    showNotification("All data deleted.", "success");
    handle.style.pointerEvents = "auto";
  }, 500);
}

function openCashCounter() {
  const form = $("#cashCounterForm");
  const denominations = [5000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
  const gridContainer = form.querySelector(".grid");
  while (gridContainer.children.length > 3)
    gridContainer.removeChild(gridContainer.lastChild);
  denominations.forEach((denom) => {
    const denomEl = document.createElement("span");
    denomEl.className = "font-medium text-right pr-2 text-sm";
    denomEl.textContent = `Rs. ${denom}`;
    const inputEl = document.createElement("input");
    inputEl.type = "number";
    inputEl.min = "0";
    inputEl.dataset.denom = denom;
    inputEl.className =
      "text-center bg-gray-600 border border-gray-500 rounded px-1 py-0.5 w-16 mx-auto text-sm";
    inputEl.placeholder = "0";
    inputEl.oninput = calculateCashTotal;
    const totalEl = document.createElement("span");
    totalEl.className = "text-right text-gray-400 text-sm";
    totalEl.id = `cashTotal-${denom}`;
    totalEl.textContent = formatCurrency(0);
    gridContainer.appendChild(denomEl);
    gridContainer.appendChild(inputEl);
    gridContainer.appendChild(totalEl);
  });
  calculateCashTotal();
  $("#cashCounterModal").style.display = "block";
  $("#cashCounterComparison").innerHTML = "";
}

function calculateCashTotal() {
  let grandTotal = 0;
  $$('#cashCounterForm input[type="number"]').forEach((input) => {
    const count = parseInt(input.value) || 0;
    const denomination = parseInt(input.dataset.denom);
    const total = count * denomination;
    grandTotal += total;
    const totalEl = $(`#cashTotal-${denomination}`);
    if (totalEl) totalEl.textContent = formatCurrency(total);
  });
  $("#cashCounterTotal").textContent = formatCurrency(grandTotal);
  const cashAccount = state.accounts.find((acc) => acc.id === "cash");
  if (cashAccount) {
    const diff = grandTotal - cashAccount.balance;
    const comparisonEl = $("#cashCounterComparison");
    if (Math.abs(diff) < 0.01)
      comparisonEl.innerHTML = `<p class="text-success">Counted cash matches calculated balance: ${formatCurrency(
        cashAccount.balance
      )}</p>`;
    else if (diff > 0)
      comparisonEl.innerHTML = `<p class="text-warning">Counted cash is ${formatCurrency(
        diff
      )} MORE than calculated balance (${formatCurrency(
        cashAccount.balance
      )})</p>`;
    else
      comparisonEl.innerHTML = `<p class="text-danger">Counted cash is ${formatCurrency(
        Math.abs(diff)
      )} LESS than calculated balance (${formatCurrency(
        cashAccount.balance
      )})</p>`;
  }
}

function closeModal(modalId) {
  const modal = $(`#${modalId}`);
  if (modal) modal.style.display = "none";
  if (modalId === "formModal") {
    $("#dynamicForm").innerHTML = "";
    $("#dynamicForm").onsubmit = null;
  }
  if (modalId === "settingsModal") cancelDeleteAllData();
}

function openFormModal(title, formHtml, submitHandler) {
  $("#formModalTitle").textContent = title;
  const form = $("#dynamicForm");
  form.innerHTML = formHtml;
  form.onsubmit = submitHandler;
  $("#formModal").style.display = "block";
  const firstInput = form.querySelector(
    'input:not([type="hidden"]), select, textarea'
  );
  if (firstInput) firstInput.focus();
}
window.addEventListener("click", (event) => {
  $$(".modal").forEach((modal) => {
    if (event.target === modal && modal.id !== 'initialSetupModal') {
      closeModal(modal.id);
    }
  });
});

function openEditTransactionForm(id, event) {
  openEditTransactionModal(id, event);
}

function openEditCcTransactionForm(id) {
  openEditCcTransactionModal(id);
}

function handleBackupReminderDismiss(reminderKey) {
  try {
    localStorage.setItem(reminderKey, getCurrentDateString());
    console.log(
      `Backup reminder dismissed for key: ${reminderKey} on ${getCurrentDateString()}`
    );
  } catch (e) {
    console.error("Error saving backup reminder dismissal state:", e);
  }
  closeModal("formModal"); 
}

function showBackupReminderPopup(reminderKey) {
  const title = "Backup Reminder";
  const message =
    "Friendly Reminder! It's a good day to consider backing up your expense data to keep it safe.";

  const formHtml = `
            <div class="text-center">
                <i class="fas fa-cloud-download-alt fa-3x text-info mb-4"></i>
                <p class="mb-6 text-gray-300">${message}</p>
                <div class="flex flex-col sm:flex-row justify-center gap-3">
                    <button type="button" id="backupNowBtnInModal" class="btn btn-primary flex-1">
                        <i class="fas fa-download mr-2"></i>Backup Now
                    </button>
                    <button type="button" id="backupLaterBtnInModal" class="btn btn-secondary flex-1">
                        I'll Do It Later
                    </button>
                </div>
            </div>
        `;

  openFormModal(title, formHtml, null);

  const backupNowButton = $("#backupNowBtnInModal");
  const backupLaterButton = $("#backupLaterBtnInModal");

  if (backupNowButton) {
    backupNowButton.onclick = () => {
      exportData();
      handleBackupReminderDismiss(reminderKey);
    };
  }

  if (backupLaterButton) {
    backupLaterButton.onclick = () => {
      handleBackupReminderDismiss(reminderKey);
    };
  }
}

function checkAndTriggerBackupReminder() {

  if (!state.settings.initialSetupDone && state.transactions.length === 0) {
    console.log(
      "Skipping backup reminder: Initial setup not done or no transactions."
    );
    return;
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); 
  const currentDateStr = getCurrentDateString();

  let reminderKey = null;

  if (dayOfWeek === 0) {

    reminderKey = "lastReminderShownForSunday";
  } else if (dayOfWeek === 3) {

    reminderKey = "lastReminderShownForWednesday";
  }

  if (reminderKey) {
    try {
      const lastShownDate = localStorage.getItem(reminderKey);
      if (lastShownDate !== currentDateStr) {
        console.log(
          `Time to show backup reminder for: ${reminderKey}. Last shown: ${lastShownDate}, Current: ${currentDateStr}`
        );
        showBackupReminderPopup(reminderKey);
      } else {
        console.log(
          `Backup reminder already shown for ${reminderKey} on ${currentDateStr}`
        );
      }
    } catch (e) {
      console.error(
        "Error checking backup reminder state from localStorage:",
        e
      );
    }
  }
}

let activeSettingsTab = null; 

const settingsTabsConfig = [
  { label: "Accounts", targetPanelId: "settingsAccountsPanel" },
  { label: "Credit Card", targetPanelId: "settingsCreditCardPanel" },
  { label: "Categories", targetPanelId: "settingsCategoriesPanel" },
  { label: "Data", targetPanelId: "settingsDataManagementPanel" }, 

];

function setupSettingsTabs() {
  const tabsContainer = document.getElementById("settingsTabsContainer");
  const tabContentContainer = document.getElementById("settingsTabContent");

  if (!tabsContainer || !tabContentContainer) {
    console.error("Settings tab containers not found!");
    return;
  }

  tabsContainer.innerHTML = ""; 
  activeSettingsTab = null; 

  settingsTabsConfig.forEach((tabConfig, index) => {
    const li = document.createElement("li");

    const button = document.createElement("button");
    button.className =
      "settings-tab-button inline-block p-3 border-b-2 rounded-t-lg"; 
    button.textContent = tabConfig.label;
    button.dataset.tabTarget = `#${tabConfig.targetPanelId}`;

    button.addEventListener("click", () => {
      switchSettingsTab(button, tabConfig.targetPanelId);
    });

    li.appendChild(button);
    tabsContainer.appendChild(li);

    if (index === 0) {

      switchSettingsTab(button, tabConfig.targetPanelId);
    } else {

      const panel = document.getElementById(tabConfig.targetPanelId);
      if (panel) {
        panel.classList.add("hidden");
      }
    }
  });
}

function switchSettingsTab(clickedButton, targetPanelId) {
  const tabContentContainer = document.getElementById("settingsTabContent");
  if (!tabContentContainer) return;

  if (activeSettingsTab && activeSettingsTab.button !== clickedButton) {
    activeSettingsTab.button.classList.remove("active");

    const oldPanelSelector = activeSettingsTab.button.dataset.tabTarget;
    if (oldPanelSelector) {
      const oldPanel = tabContentContainer.querySelector(oldPanelSelector); 
      if (oldPanel) {
        oldPanel.classList.add("hidden");
      }
    }
  }

  clickedButton.classList.add("active");
  const targetPanel = document.getElementById(targetPanelId); 
  if (targetPanel) {
    targetPanel.classList.remove("hidden");
  } else {
    console.warn(`Target panel with ID '${targetPanelId}' not found.`);
  }

  activeSettingsTab = { button: clickedButton, panelId: targetPanelId };
}

function initializeUI(isRefresh = false) {
  console.log("Initializing UI...");

  if (!isRefresh) {
    loadData(); // Load data from localStorage on initial page load
  }

  // Check if initial setup is done, if not, open the wizard
  if (
    !state.settings ||
    state.settings.initialSetupDone === undefined ||
    state.settings.initialSetupDone === false
  ) {
    if (!isRefresh) { // Only open wizard on initial load if setup isn't done
      console.log("Initial setup not done. Opening wizard.");
      openInitialSetupWizard();
      return; // Stop further UI initialization until setup is complete
    }
  }

  // Set default dates for main transaction and CC transaction forms
  const mainDateInput = $("#date");
  if (mainDateInput)
    mainDateInput.value = new Date().toISOString().split("T")[0];
  const mainCcDateInput = $("#ccDate");
  if (mainCcDateInput)
    mainCcDateInput.value = new Date().toISOString().split("T")[0];

  populateDropdowns();
  renderDashboard(); // This will call other render functions like renderInstallmentList

  updateCcDashboardSectionVisibility();
  setupMonthlyView(); // Sets up year selector and month tabs for the monthly view modal

  if (!window.deleteSliderInitialized) { // Ensure delete slider is set up only once
    setupDeleteSlider();
    window.deleteSliderInitialized = true;
  }

  displayAppVersion(); // Display app version in settings and setup modals

  // --- Main Form Event Listeners ---
  $("#transactionForm").onsubmit = handleTransactionSubmit;
  $("#ccTransactionForm").onsubmit = handleCcTransactionSubmit;
  // $("#transferForm").onsubmit = handleTransferSubmit; // REMOVED: Old transfer form listener

  // --- Header Button Event Listeners ---
  $("#settingsBtn").onclick = () => {
    openSettingsModal();
  };

  $("#monthlyViewBtn").onclick = () => {
    const yearSelector = $("#yearSelector");
    if (yearSelector && yearSelector.value) {
      renderMonthTabs(parseInt(yearSelector.value));
    } else {
      renderMonthTabs(new Date().getFullYear()); // Default to current year if selector not ready
    }
    $("#monthlyViewModal").style.display = "block";
    // Attempt to select and click the current month's tab
    const currentMonth = new Date().getMonth();
    const currentYearVal = yearSelector
      ? parseInt(yearSelector.value)
      : new Date().getFullYear();
    const currentMonthTab = $(
      `#monthTabs .tab-button[data-month="${currentMonth}"][data-year="${currentYearVal}"]`
    );
    if (currentMonthTab) {
      currentMonthTab.click();
    } else if ($$("#monthTabs .tab-button").length > 0) {
      // Fallback to the first available tab if current month's isn't found
      $$("#monthTabs .tab-button")[0].click();
    } else {
      $("#monthlyDetailsContainer").innerHTML =
        '<p class="text-center text-gray-400">Select a month.</p>';
    }
  };

  // --- Transfer Money Modal ---
  const openTransferModalButton = $("#openTransferModalBtn");
  if (openTransferModalButton) {
    openTransferModalButton.onclick = () => {
      const modal = $("#transferMoneyModal");
      if (modal) {
        // Populate dropdowns to ensure account balances are current
        // This is important if balances changed since last modal open
        populateDropdowns(); 
        
        const transferModalForm = $("#transferModalForm");
        if(transferModalForm) {
            transferModalForm.reset(); // Reset form fields on open
        }
        
        const errorEl = $("#modalTransferError"); // Get the error message p tag
        if(errorEl) {
            errorEl.classList.add("hidden"); // Hide any previous error messages
        }

        modal.style.display = "block";
        
        // Attempt to focus the first input field in the modal
        const firstInput = modal.querySelector('input[type="number"], select');
        if (firstInput) {
            firstInput.focus();
        }

      } else {
        console.error("Transfer money modal (#transferMoneyModal) not found!");
      }
    };
  } else {
    console.error("Open transfer modal button (#openTransferModalBtn) not found!");
  }

  const transferModalFormElement = $("#transferModalForm");
  if (transferModalFormElement) {
    transferModalFormElement.onsubmit = handleTransferSubmit; // Use the updated handleTransferSubmit
  } else {
    console.error("Transfer modal form element (#transferModalForm) not found!");
  }

  // --- Settings Modal Buttons ---
  $("#exportDataBtn").onclick = exportData;
  $("#importDataInput").onchange = importData;
  $("#initiateDeleteBtn").onclick = initiateDeleteAllData;
  $("#cancelDeleteBtn").onclick = cancelDeleteAllData;

  // --- Dashboard Action Buttons ---
  $("#addDebtBtn").onclick = openAddDebtForm;
  $("#addReceivableBtn").onclick = openAddReceivableForm;
  $("#addInstallmentBtn").onclick = openAddInstallmentForm;
  $("#cashCounterBtn").onclick = openCashCounter;
  $("#ccHistoryBtn").onclick = openCcHistoryModal;

  const viewDebtsBtn = $("#viewDebtsBtn");
  if (viewDebtsBtn) {
    viewDebtsBtn.onclick = () => {
      renderDebtList(); // Render fresh list when modal is opened
      $("#debtsViewModal").style.display = "block"; 
    };
  }

  const viewReceivablesBtn = $("#viewReceivablesBtn");
  if (viewReceivablesBtn) {
    viewReceivablesBtn.onclick = () => {
      renderReceivableList(); // Render fresh list when modal is opened
      $("#receivablesViewModal").style.display = "block"; 
    };
  }

  // --- Transaction Form Category Visibility Toggle ---
  const transactionTypeSelect = $("#transactionType");
  const categoryGroup = $("#categoryGroup");
  const descriptionInput = $("#description"); // Assuming this is the ID for the main form's description

  const toggleMainCategoryVisibility = () => {
    if (!transactionTypeSelect || !categoryGroup) return;
    if (transactionTypeSelect.value === "income") {
      categoryGroup.style.display = "none";
      $("#category").required = false;
      if (descriptionInput)
        descriptionInput.placeholder = "e.g., Monthly Salary";
    } else {
      categoryGroup.style.display = "block";
      $("#category").required = true;
      if (descriptionInput)
        descriptionInput.placeholder = "e.g., Lunch, Groceries";
    }
  };

  if (transactionTypeSelect) {
    transactionTypeSelect.onchange = toggleMainCategoryVisibility;
    toggleMainCategoryVisibility(); // Initial call to set visibility based on default selection
  }

  // renderInstallmentList(); // Already called by renderDashboard()

  // --- Periodic Updates/Checks (Example: update dynamic elements every hour) ---
  if (!window.countdownInterval) { // Ensure interval is set only once
    window.countdownInterval = setInterval(() => {
      // Example: Refresh parts of the dashboard that might change over time
      // This is a placeholder for any such logic you might have or add.
      // For now, it re-renders totals which are already updated by renderDashboard.
      const totalOwedEl = $("#totalOwed");
      const totalOwedToMeEl = $("#totalOwedToMe");
      if (totalOwedEl) {
        totalOwedEl.textContent = `Total: ${formatCurrency(
          state.debts.reduce((s, d) => s + d.remainingAmount, 0)
        )}`;
      }
      if (totalOwedToMeEl) {
        totalOwedToMeEl.textContent = `Total: ${formatCurrency(
          state.receivables.reduce((s, r) => s + r.remainingAmount, 0)
        )}`;
      }
      renderInstallmentList(); // Re-render installments if their status might change passively
    }, 1000 * 60 * 60); // Every hour
  }

  // --- Backup Reminder Check ---
  if (!window.backupReminderInterval) { // Ensure interval is set only once
    checkAndTriggerBackupReminder(); // Initial check on load
    window.backupReminderInterval = setInterval(
      checkAndTriggerBackupReminder,
      1000 * 60 * 60 // Check every hour
    );
    console.log("Backup reminder interval started.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded. Initializing...");
  loadData();
  initializeUI();
  const preloaderElement = document.getElementById("preloader");
  const appContentElement = document.getElementById("app-content");
  const preloaderDuration = 1250; 

  if (preloaderElement && appContentElement) {
    console.log(
      `Preloader will be shown for ${preloaderDuration / 1000} seconds.`
    );

    setTimeout(() => {
      console.log(
        "Preloader timer finished. Hiding preloader, showing app content."
      );

      preloaderElement.classList.add("hidden");

      appContentElement.classList.add("visible");

      setTimeout(() => {
        preloaderElement.style.display = "none";
        console.log("Preloader display set to 'none' after fade-out.");
      }, 750); 
    }, preloaderDuration);
  } else {

    if (!preloaderElement) {
      console.error(
        "Preloader element with ID 'preloader' not found. Timer preloader cannot run."
      );
    }
    if (!appContentElement) {
      console.error(
        "App content element with ID 'app-content' not found. Timer preloader cannot run."
      );
    }

    if (appContentElement) {
      appContentElement.classList.add("visible"); 
      console.warn(
        "Attempted to show app content due to missing preloader elements."
      );
    }
    if (preloaderElement) {
      preloaderElement.style.display = "none"; 
    }
  }
});