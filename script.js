// --- UTILITIES ---
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
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFormattedLocalStorageSize(key) {
  const item = localStorage.getItem(key);
  if (item === null) {
    return "N/A (No data found)";
  }

  // The length of the string is a good approximation of bytes for UTF-16 encoded strings (JavaScript default)
  // For Base64 encoded data (like our compressed data), the length of the Base64 string is a good proxy.
  const sizeInBytes = item.length; // For strings, length is roughly bytes

  if (sizeInBytes < 1024) {
    return `${sizeInBytes} Bytes`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

/**
 * Reads the application version from the meta tag and displays it
 * in the designated elements within the Settings and Initial Setup modals.
 */
function displayAppVersion() {
  let version = "N/A"; // Default version if meta tag is not found
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

// NEW UTILITY for modal category visibility
function toggleCategoryVisibilityInModal(
  selectElement,
  categoryGroupId,
  categorySelectId
) {
  const categoryGroup = document.getElementById(categoryGroupId);
  const categorySelect = document.getElementById(categorySelectId);
  // Attempt to find the description input by common names used in modals
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
    // 'expense'
    if (categoryGroup) categoryGroup.style.display = "block";
    if (categorySelect) categorySelect.required = true;
    if (descriptionInput)
      descriptionInput.placeholder = "e.g., Lunch, Groceries";
  }
}

// --- INITIAL STATE & DEFAULTS ---
let state = {};

function getDefaultState() {
  return JSON.parse(
    JSON.stringify({
      transactions: [],
      accounts: [
        {
          id: "cash", // Cash ID remains the same
          name: "Cash",
          balance: 0,
        },
        {
          id: "bank_1", // Generic ID
          name: "Commercial", // Default display name
          balance: 0,
        },
        {
          id: "bank_2", // Generic ID
          name: "HNB", // Default display name
          balance: 0,
        },
        {
          id: "bank_3", // Generic ID
          name: "Genie", // Default display name
          balance: 0,
        },
      ],
      categories: [
        // User's preferred list
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

// --- INITIAL SETUP WIZARD LOGIC ---

// Function to open and populate the initial setup wizard
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
        // MODIFIED: Removed bg-gray-600/50, added inline style for var(--bg-secondary)
        div.className = "flex justify-between items-center p-2 rounded text-sm";
        div.style.backgroundColor = "var(--bg-secondary)";
        div.style.borderColor = "var(--border-color)"; // Optional: ensure border consistency
        div.style.borderWidth = "1px"; // Optional: ensure border consistency

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
  renderSetupCategories(); // Initial call

  $("#initialSetupForm").onsubmit = handleInitialSetupSubmit;
  $("#setupImportInput").onchange = handleSetupImport;

  modal.style.display = "block";
  displayAppVersion();
}

// Function to handle the submission of the manual setup form
function handleInitialSetupSubmit(event) {
  event.preventDefault();
  console.log("Handling initial setup form submission...");

  let newState = getDefaultState(); // Start with a fresh default state structure

  // 1. Update Account Names and Balances
  // Iterate based on the structure of defaultAccounts to ensure order and all defaults are considered
  const defaultAccountsFromTemplate = getDefaultState().accounts;

  newState.accounts = defaultAccountsFromTemplate.map((defaultAcc) => {
    const nameInput = $(`#setupName-${defaultAcc.id}`); // For editable names
    const balanceInput = $(`#setupBalance-${defaultAcc.id}`);

    let finalName = defaultAcc.name; // Default to original name
    if (defaultAcc.id !== "cash" && nameInput) {
      // If it's an editable account and the input exists
      const enteredName = nameInput.value.trim();
      if (enteredName) {
        // If user provided a name
        finalName = enteredName;
      } else {
        console.warn(
          `Account name for ${defaultAcc.id} was left empty, using default: ${defaultAcc.name}`
        );
        // Keep finalName as defaultAcc.name
      }
    }

    let balance = 0; // Default balance to 0
    if (balanceInput) {
      const balanceStr = balanceInput.value.trim();
      if (balanceStr !== "" && balanceStr !== null) {
        const parsedBalance = parseFloat(balanceStr);
        balance = isNaN(parsedBalance) ? 0 : parsedBalance;
      }
    }
    // Return a new object for the account, preserving its original ID
    return { id: defaultAcc.id, name: finalName, balance: balance };
  });

  // 2. Update Credit Card Settings
  const ccEnabled = $("#setupEnableCc").checked;
  newState.settings.showCcDashboardSection = ccEnabled; // This should already be part of newState.settings from getDefaultState()
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

  // 3. Update Categories
  const finalCategories = [];
  $$("#setupCategoriesList span").forEach((span) =>
    finalCategories.push(span.textContent)
  );
  newState.categories =
    finalCategories.length > 0
      ? finalCategories.sort((a, b) => a.localeCompare(b))
      : getDefaultState().categories;

  // 4. Mark setup as done
  newState.settings.initialSetupDone = true;

  // 5. Replace the global state with the new state from setup
  state = newState;

  // 6. Save data
  saveData();

  // 7. Close wizard and initialize main app UI
  closeModal("initialSetupModal");
  initializeUI(true);

  showNotification("Setup complete! Welcome to Kaasi.", "success", 5000);
}

// Function to handle data import from within the setup wizard
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

// --- LOCAL STORAGE ---
const STORAGE_KEY = "KaasiData"; // Reverted to original key

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
      // This could be a different error, like data being non-serializable
      // (though less likely if it worked before compression)
      showNotification("Error saving data. Check console.", "error", 10000);
    }
    // It's helpful to log the state if stringify itself is the problem,
    // but QuotaExceededError happens after stringify.
    // console.error("Full state object that potentially failed to save:", state);
  }
}

function loadData() {
  const d = localStorage.getItem(STORAGE_KEY); // Try loading uncompressed data
  let parsedData = null;

  if (d) {
    console.log("Uncompressed data found. Attempting to parse...");
    try {
      parsedData = JSON.parse(d);
    } catch (e) {
      console.error("Error parsing data from localStorage:", e);
      // ParsedData will remain null, leading to fresh state initialization
      showNotification(
        "Error loading data. Data might be corrupted. Starting fresh.",
        "error",
        8000
      );
    }
  }

  // Start with a fresh default state structure.
  // This ensures that 'state' always has the correct top-level keys.
  state = getDefaultState();

  // If parsedData exists and is an object, merge it into the fresh default state
  if (parsedData && typeof parsedData === "object") {
    console.log("Merging loaded data into default state structure...");
    // Use the corrected deepMerge. 'state' (which is a fresh default) is the target.
    // 'parsedData' (loaded data) is the source.
    // This will recursively add/update properties from parsedData into state.
    state = deepMerge(state, parsedData);
    console.log("Data merged successfully.");
  } else if (d && !parsedData) {
    // Data existed but failed to parse
    console.log(
      "Previous data existed but was unparsable. Using fresh default state."
    );
    // state is already getDefaultState() at this point, so no further action needed here.
  } else {
    console.log(
      "No saved data found or data was null/invalid. Starting with fresh default state."
    );
    // state is already getDefaultState().
  }

  // After merging or starting fresh, explicitly ensure essential nested objects and their
  // default properties are correctly initialized if they are still missing or invalid.
  // This is a safeguard against malformed loaded data or if getDefaultState() was incomplete for nested parts.

  const defaultStateTemplate = getDefaultState(); // Get a fresh template for comparison

  // Ensure 'settings' object and its properties exist
  if (!state.settings || typeof state.settings !== "object") {
    console.warn(
      "State.settings was missing or invalid after merge. Resetting to default settings structure."
    );
    state.settings = { ...defaultStateTemplate.settings }; // Create a new settings object from default
  } else {
    // Ensure all specific default settings properties exist within state.settings
    for (const settingKey in defaultStateTemplate.settings) {
      if (state.settings[settingKey] === undefined) {
        state.settings[settingKey] = defaultStateTemplate.settings[settingKey];
      }
    }
  }

  // Ensure 'creditCard' object and its properties exist
  if (!state.creditCard || typeof state.creditCard !== "object") {
    console.warn(
      "State.creditCard was missing or invalid after merge. Resetting to default creditCard structure."
    );
    state.creditCard = { ...defaultStateTemplate.creditCard }; // Create a new creditCard object
    if (!Array.isArray(state.creditCard.transactions)) {
      // Ensure transactions array is initialized
      state.creditCard.transactions = [];
    }
  } else {
    // Ensure all specific default creditCard properties exist
    for (const ccKey in defaultStateTemplate.creditCard) {
      if (state.creditCard[ccKey] === undefined) {
        state.creditCard[ccKey] = defaultStateTemplate.creditCard[ccKey];
      }
    }
    if (!Array.isArray(state.creditCard.transactions)) {
      // Ensure transactions is an array
      state.creditCard.transactions = [];
    }
  }

  // Ensure top-level arrays are at least initialized if they somehow got removed or were not in old data.
  // Note: getDefaultState() already initializes these, and deepMerge should preserve them if present in source.
  // This is more of a final sanity check.
  if (!Array.isArray(state.transactions)) state.transactions = [];
  if (!Array.isArray(state.accounts)) state.accounts = []; // ensureDefaultAccounts will handle content
  if (!Array.isArray(state.categories)) state.categories = []; // ensureDefaultCategories will handle content
  if (!Array.isArray(state.debts)) state.debts = [];
  if (!Array.isArray(state.receivables)) state.receivables = [];
  if (!Array.isArray(state.installments)) state.installments = [];

  // Existing data integrity checks (important to keep)
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
  // Iterate over the properties of the source object
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue)
      ) {
        // If the source property is an object (and not an array), recurse
        // Ensure the target property is also an object to merge into;
        // if not, or if it doesn't exist, initialize it as an empty object.
        if (
          !targetValue ||
          typeof targetValue !== "object" ||
          Array.isArray(targetValue)
        ) {
          target[key] = {};
        }
        deepMerge(target[key], sourceValue); // Merge into the target's object property
      } else if (sourceValue !== undefined) {
        // If the source property is a primitive, an array, or explicitly undefined (to overwrite),
        // assign it directly to the target.
        target[key] = sourceValue;
      }
      // If sourceValue is undefined, we don't do anything, preserving targetValue
    }
  }
  // The problematic loop that added all default top-level keys into sub-objects has been removed.
  return target; // Return the modified target object
}

function ensureDefaultAccounts() {
  const defaultAccounts = getDefaultState().accounts; // Get a fresh copy of default accounts
  if (!Array.isArray(state.accounts)) {
    // If state.accounts is not an array, reset it
    console.warn(
      "state.accounts was not an array. Resetting to default accounts structure."
    );
    state.accounts = JSON.parse(JSON.stringify(defaultAccounts)); // Deep copy
    // Initialize balances to 0 for all default accounts if resetting
    state.accounts.forEach((acc) => (acc.balance = 0));
    return;
  }

  // Ensure all default accounts exist in the state
  defaultAccounts.forEach((defaultAcc) => {
    const existingAccount = state.accounts.find(
      (acc) => acc.id === defaultAcc.id
    );
    if (!existingAccount) {
      // If a default account is missing, add it with a balance of 0
      console.warn(
        `Default account '${defaultAcc.name}' (ID: ${defaultAcc.id}) was missing. Adding it.`
      );
      state.accounts.push({
        ...defaultAcc, // Spread default properties like id and name
        balance: 0, // Initialize balance to 0
      });
    } else {
      // If account exists, ensure essential properties are correct
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

  // Optional: Remove any accounts in state that are not in the default list
  // This might be too aggressive if users can create custom accounts.
  // For now, we'll just ensure default ones are present and valid.
}

function ensureDefaultCategories() {
  const defaultCategories = getDefaultState().categories; // Get the app's default list

  // If state.categories doesn't exist or is not an array, initialize it as an empty array.
  if (!state.categories || !Array.isArray(state.categories)) {
    console.warn(
      "state.categories was missing or not an array. Initializing as empty array."
    );
    state.categories = [];
  }

  // Only populate with default categories if the user's category list is currently empty.
  // This allows users to delete default categories and not have them reappear,
  // as long as they have at least one category remaining.
  // If they delete ALL categories, then the defaults will be restored on next load.
  if (state.categories.length === 0) {
    console.warn(
      "state.categories is empty. Populating with default categories."
    );
    state.categories = JSON.parse(JSON.stringify(defaultCategories)); // Deep copy defaults
  }
  // Always ensure categories are sorted for consistent display.
  state.categories.sort((a, b) => a.localeCompare(b));

  // The "Other" category is special and should always exist.
  // The deleteCategory function already prevents its deletion.
  // We can add a check here to ensure it's present if it somehow got removed
  // and the list wasn't empty (though deleteCategory should prevent this).
  const otherCategory = "Other";
  if (
    !state.categories.some(
      (cat) => cat.toLowerCase() === otherCategory.toLowerCase()
    )
  ) {
    console.warn("'Other' category was missing. Adding it back.");
    state.categories.push(otherCategory);
    state.categories.sort((a, b) => a.localeCompare(b)); // Re-sort
  }
}

// --- NOTIFICATIONS ---
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

// --- RENDERING FUNCTIONS (Core) ---
function populateDropdowns() {
  const accountSelects = $$(
    'select[name="account"], select[name="transferFrom"], select[name="transferTo"], select[name="receivableSourceAccount"], select[name="payDebtAccount"], select[name="recPaymentAccount"], select[name="instPayAccount"], select[name="ccPayFromAccount"], #modalAccount, #recSourceAccountAdd, #recSourceAccountEdit, #modalCcPayFromAccount, #modalInstPayAccount, #modalPayDebtAccount'
  );
  const categorySelects = $$(
    "#category, #modalCategory, #modalPayDebtCategory, #modalInstPayCategory, #modalCcPayCategory"
  );

  accountSelects.forEach((s) => {
    if (!s) return;
    const currentValue = s.value;
    s.innerHTML = ""; // Clear existing options
    state.accounts.forEach((a) => {
      const o = document.createElement("option");
      o.value = a.id;
      o.textContent = `${a.name} (${formatCurrency(a.balance)})`;
      s.appendChild(o);
    });
    // Try to reselect the previous value if it still exists
    if (Array.from(s.options).some((opt) => opt.value === currentValue)) {
      s.value = currentValue;
    } else if (s.options.length > 0) {
      // If previous value is gone, and there are options, select the first one
      // You might want to reconsider this default behavior if a placeholder is preferred for accounts too
      // s.value = s.options[0].value;
    }
  });

  const populateCategorySelect = (selectEl) => {
    if (!selectEl) return;
    const currentValue = selectEl.value; // Store current value before clearing
    selectEl.innerHTML = ""; // Clear existing options

    // Add a disabled, selected placeholder option
    const placeholderOption = document.createElement("option");
    placeholderOption.value = ""; // Empty value for placeholder
    placeholderOption.textContent = "---- Select Category ----";
    placeholderOption.disabled = true;
    // placeholderOption.selected = true; // Set selected by default
    selectEl.appendChild(placeholderOption);

    // Filter out "Income" and "Credit Card Payment" for general expense categories,
    // and separate "Other" to add it at the end.
    const otherCategoryName = "Other";
    let generalCategories = state.categories.filter(
      (c) =>
        c.toLowerCase() !== "income" &&
        c.toLowerCase() !== "credit card payment" &&
        c.toLowerCase() !== otherCategoryName.toLowerCase()
    );

    // Sort general categories alphabetically
    generalCategories.sort((a, b) => a.localeCompare(b));

    // Special handling for specific dropdowns like debt repayment
    if (selectEl.id === "modalPayDebtCategory") {
      const debtRepaymentCategory = "Debt Repayment";
      if (
        !generalCategories.includes(debtRepaymentCategory) &&
        !state.categories.some(
          (c) => c.toLowerCase() === debtRepaymentCategory.toLowerCase()
        )
      ) {
        // If "Debt Repayment" is not in general and not in original state.categories (meaning user didn't add it)
        // we might not want to force-add it here unless it's a fixed option.
        // For now, let's assume if it's not in state.categories, it's not an option.
        // If "Debt Repayment" should ALWAYS be an option for this dropdown, it needs to be handled differently.
      }
    }

    // Add sorted general categories
    generalCategories.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      selectEl.appendChild(o);
    });

    // Add "Other" category at the end, if it exists in the state
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

    // Try to reselect the previous value if it still exists and is valid
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
      // Default for debt payment if "Debt Repayment" category exists
      selectEl.value = "Debt Repayment";
    } else {
      // If no valid previous selection, make the placeholder selected
      selectEl.value = ""; // This will select the placeholder
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
  // Using new indicator classes for green/red
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
  // Using new indicator classes for green/red
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

// --- RENDERING LISTS & DASHBOARD CHART ---
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
    const textColorClass = isIncome ? "text-income" : "text-expense"; // Use new income/expense classes
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
  const listContainer = $("#debtList");
  if (!listContainer) {
    console.error("#debtList element not found.");
    return;
  }
  listContainer.innerHTML = "";

  if (state.debts.length === 0) {
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm">No debts recorded.</p>';
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
      '<p class="text-gray-400 text-sm">No debts to display by creditor.</p>';
    return;
  }

  sortedCreditors.forEach((creditorName) => {
    const creditorData = totalsByCreditor[creditorName];
    const creditorId = `debt-creditor-${generateId()}`;

    const creditorWrapper = document.createElement("div");
    creditorWrapper.className =
      "mb-3 border border-gray-700 rounded-md overflow-hidden"; // This div takes full width of its column

    const creditorHeader = document.createElement("div");
    creditorHeader.className =
      "flex justify-between items-center p-3 cursor-pointer hover:bg-gray-600/50 transition-colors"; // Adjusted hover
    // MODIFIED: Changed background color to --bg-tertiary
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
                  <div class="edit-btn-container">
                      <button class="link-style text-xs mr-2 accent-text hover:text-accent-hover" onclick="openEditDebtForm('${
                        d.id
                      }')">Edit</button>
                      <button class="link-style text-xs mr-2 text-income hover:opacity-80" onclick="openPayDebtForm('${
                        d.id
                      }')">Pay</button>
                      <button class="text-gray-500 hover:text-expense text-xs focus:outline-none" onclick="deleteDebt('${
                        d.id
                      }')" title="Delete"><i class="fas fa-times"></i></button>
                  </div>
              </div>
          `;
        itemsListContainer.appendChild(itemDiv);
      });
    creditorWrapper.appendChild(itemsListContainer);
    listContainer.appendChild(creditorWrapper);
  });
}

function renderReceivableList() {
  const listContainer = $("#receivableList");
  if (!listContainer) {
    console.error("#receivableList element not found.");
    return;
  }
  listContainer.innerHTML = "";

  if (state.receivables.length === 0) {
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm">No receivables recorded.</p>';
    return;
  }

  const totalsByPerson = state.receivables.reduce((acc, r) => {
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
    listContainer.innerHTML =
      '<p class="text-gray-400 text-sm">No receivables to display by person.</p>';
    return;
  }

  sortedPeople.forEach((personName) => {
    const personData = totalsByPerson[personName];
    const personId = `receivable-person-${generateId()}`;

    const personWrapper = document.createElement("div");
    personWrapper.className =
      "mb-3 border border-gray-700 rounded-md overflow-hidden"; // This div takes full width of its column

    const personHeader = document.createElement("div");
    personHeader.className =
      "flex justify-between items-center p-3 cursor-pointer hover:bg-gray-600/50 transition-colors"; // Adjusted hover
    // MODIFIED: Changed background color to --bg-tertiary
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
        const srcTxt =
          r.type === "cash"
            ? `(From: ${srcAcc?.name || "Unknown"})`
            : "(Via CC)";

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
                  <div class="edit-btn-container">
                      <button class="link-style text-xs mr-2 accent-text hover:text-accent-hover" onclick="openEditReceivableForm('${
                        r.id
                      }')">Edit</button>
                      <button class="link-style text-xs mr-2 text-income hover:opacity-80" onclick="openReceivePaymentForm('${
                        r.id
                      }')">Receive</button>
                      <button class="text-gray-500 hover:text-expense text-xs focus:outline-none" onclick="deleteReceivable('${
                        r.id
                      }')" title="Delete"><i class="fas fa-times"></i></button>
                  </div>
              </div>
          `;
        itemsListContainer.appendChild(itemDiv);
      });
    personWrapper.appendChild(itemsListContainer);
    listContainer.appendChild(personWrapper);
  });
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
                        <div class="edit-btn-container">
                            ${
                              i.monthsLeft > 0
                                ? `<button class="link-style text-sm mr-2 accent-text hover:text-accent-hover" onclick="openEditInstallmentForm('${i.id}')">Edit</button><button class="text-income hover:opacity-80 mr-2 text-sm link-style" onclick="payInstallmentMonth('${i.id}')">Pay Month</button>`
                                : `<button class="link-style text-sm mr-2 accent-text hover:text-accent-hover" onclick="openEditInstallmentForm('${i.id}')">Edit</button>`
                            }
                            <button class="text-gray-500 hover:text-expense text-xs focus:outline-none" onclick="deleteInstallment('${
                              i.id
                            }')" title="Delete"><i class="fas fa-times"></i></button>
                        </div>
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
    const year = date.getFullYear(), // year variable is still useful for data filtering
      month = date.getMonth(); // month variable is still useful for data filtering

    // --- MODIFIED LINE FOR LABELS ---
    labels.push(
      date.toLocaleString("default", { month: "short" }) // Now only shows the short month name
    );
    // --- END OF MODIFICATION ---

    let monthlyIncome = 0,
      monthlyExpense = 0;
    state.transactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return;
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        // Ensure data is still filtered by correct year and month
        if (t.type === "income") monthlyIncome += t.amount;
        else if (t.type === "expense") monthlyExpense += t.amount;
      }
    });
    incomeData.push(monthlyIncome);
    expenseData.push(monthlyExpense);
  }

  const incomeColor = "#2a9d8f"; // From CSS var --income-color
  const expenseColor = "#e74c3c"; // From CSS var --expense-color
  const hexToRgba = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (monthlyOverviewChartInstance) {
    // If chart instance exists, update its data
    monthlyOverviewChartInstance.data.labels = labels;
    monthlyOverviewChartInstance.data.datasets[0].data = incomeData; // Income dataset
    monthlyOverviewChartInstance.data.datasets[1].data = expenseData; // Expense dataset
    monthlyOverviewChartInstance.update();
  } else {
    // If chart instance doesn't exist, create it
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

// --- TRANSACTION & TRANSFER HANDLING ---
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
  const form = event.target,
    formData = new FormData(form);
  const amount = parseFloat(formData.get("transferAmount")),
    fromAccountId = formData.get("transferFrom"),
    toAccountId = formData.get("transferTo");
  const errorEl = $("#transferError");
  errorEl.classList.add("hidden");
  if (isNaN(amount) || amount <= 0) {
    showNotification("Valid amount required.", "error");
    return;
  }
  if (fromAccountId === toAccountId) {
    errorEl.classList.remove("hidden");
    showNotification("Cannot transfer to same account.", "error");
    return;
  }
  const fromAccount = state.accounts.find((acc) => acc.id === fromAccountId);
  const toAccount = state.accounts.find((acc) => acc.id === toAccountId);
  if (!fromAccount || !toAccount) {
    showNotification("Invalid account.", "error");
    return;
  }
  if (fromAccount.balance < amount) {
    showNotification(`Insufficient funds in ${fromAccount.name}.`, "warning");
    return;
  }
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  if (isNaN(fromAccount.balance)) fromAccount.balance = 0;
  if (isNaN(toAccount.balance)) toAccount.balance = 0;
  saveData();
  renderDashboard();
  populateDropdowns();
  form.reset();
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

// --- MONTHLY VIEW LOGIC ---
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
  container.innerHTML = ""; // Clear previous content

  // Filter transactions for the selected month and year
  const transactionsInMonth = state.transactions
    .filter((t) => {
      const tDate = new Date(t.date + "T00:00:00"); // Ensure date is parsed as local
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
  // --- MODIFIED: Changed background from bg-gray-800 to use CSS variable ---
  summaryCard.className = "p-4 rounded-lg"; // Removed bg-gray-800
  summaryCard.style.backgroundColor = "var(--bg-tertiary)"; // Added style for background
  // --- END OF MODIFICATION ---
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

  // Category Distribution Pie Chart Card
  if (sortedCategories.length > 0) {
    if (monthlyPieChartInstance) {
      monthlyPieChartInstance.destroy();
      monthlyPieChartInstance = null;
    }

    const chartCard = document.createElement("div");
    // --- MODIFIED: Changed background from bg-gray-800 to use CSS variable ---
    chartCard.className = "p-4 rounded-lg h-96 md:h-[450px] flex flex-col"; // Removed bg-gray-800
    chartCard.style.backgroundColor = "var(--bg-tertiary)"; // Added style for background
    // --- END OF MODIFICATION ---

    const titleEl = document.createElement("h3");
    titleEl.className = "text-lg font-semibold mb-3 text-center";
    titleEl.textContent = "Category Distribution";
    chartCard.appendChild(titleEl);

    const canvasContainer = document.createElement("div");
    canvasContainer.className = "flex-grow relative chart-container";

    const canvas = document.createElement("canvas");
    canvas.id = "monthlyDetailPieChartCanvas"; // Fixed ID

    canvasContainer.appendChild(canvas);
    chartCard.appendChild(canvasContainer);
    categorySection.appendChild(chartCard);

    const pieData = {
      labels: sortedCategories.map(([c, _]) => c),
      values: sortedCategories.map(([_, a]) => a),
    };
    setTimeout(() => renderMonthlyPieChart(pieData), 100);
  } else {
    // If no expenses, show a placeholder and ensure any old chart instance is destroyed
    const noChartCard = document.createElement("div");
    // --- MODIFIED: Changed background from bg-gray-800 to use CSS variable ---
    noChartCard.className =
      "p-4 rounded-lg h-72 md:h-80 flex items-center justify-center"; // Removed bg-gray-800
    noChartCard.style.backgroundColor = "var(--bg-tertiary)"; // Added style for background
    // --- END OF MODIFICATION ---
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
  const canvas = document.getElementById("monthlyDetailPieChartCanvas"); // Use fixed ID
  if (!canvas || !canvas.getContext) {
    console.error(
      "Canvas for monthly pie chart (id: monthlyDetailPieChartCanvas) not found or invalid."
    );
    // If canvas is not found (e.g. no expenses, so it wasn't added to DOM), destroy old instance if any
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
    // If chart instance exists, update its data
    monthlyPieChartInstance.data.labels = data.labels;
    monthlyPieChartInstance.data.datasets[0].data = data.values;
    monthlyPieChartInstance.data.datasets[0].backgroundColor = backgroundColors;
    monthlyPieChartInstance.update();
  } else {
    // If chart instance doesn't exist, create it
    monthlyPieChartInstance = new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Expenses by Category",
            data: data.values,
            backgroundColor: backgroundColors,
            borderColor: "var(--bg-secondary)", // Use CSS variable for border
            borderWidth: 1,
            hoverOffset: 8,
            hoverBorderColor: "var(--text-primary)", // Use CSS variable
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            // --- KEY CHANGE: Set display to false to hide the legend ---
            display: false,
            // --- END OF KEY CHANGE ---
            // position: 'bottom', // No longer needed if display is false
            // labels: { // No longer needed if display is false
            // color: 'var(--text-secondary)',
            // padding: 10,
            // boxWidth: 12,
            // font: { size: 10 }
            // }
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
                  // Ensure getDatasetMeta(0).total is available or fallback for percentage calculation
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

// --- CREDIT CARD LOGIC ---
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
  availableEl.classList.toggle("text-expense", available < 0); // Use text-expense
  availableEl.classList.toggle("accent-text", available >= 0); // Use accent-text (orange)

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
                        <div class="edit-btn-container">
                            ${
                              !t.paidOff && remainingOnItem > 0.005
                                ? `<button class="text-xs text-income hover:opacity-80 focus:outline-none mr-1" onclick="openPayCcItemForm('${t.id}')" title="Pay Item"><i class="fas fa-dollar-sign"></i></button>`
                                : ""
                            }
                            <button class="text-xs accent-text hover:text-accent-hover focus:outline-none mr-1" onclick="openEditCcTransactionForm('${
                              t.id
                            }')" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="text-gray-500 hover:text-expense text-xs focus:outline-none" onclick="deleteCcTransaction('${
                              t.id
                            }')" title="Delete"><i class="fas fa-times"></i></button>
                        </div>
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

// --- DEBT/RECEIVABLE/INSTALLMENT LOGIC ---
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

// MODIFIED: openPayDebtForm to include category selection
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

// MODIFIED: handlePayDebtSubmit to log an expense
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
  const group = document.getElementById(groupId); // Use getElementById for reliability
  const select = document.getElementById(selectId);
  const disclaimerElement = document.getElementById('receivableCcDisclaimer'); // Get the disclaimer element

  if (group && select) { // Ensure primary elements exist
    if (type === "cash") {
      group.style.display = "block";
      select.required = true;
      if (disclaimerElement) {
        disclaimerElement.style.display = "none"; // Hide disclaimer for cash/bank loans
      }
    } else { // This is the "cc" (Credit Card Loan) case
      group.style.display = "none";
      select.required = false;
      if (disclaimerElement) {
        disclaimerElement.style.display = "block"; // Show disclaimer for CC loans
      }
    }
  } else {
    if (!group) console.warn(`toggleReceivableSourceAccount: Group element with ID '${groupId}' not found.`);
    if (!select) console.warn(`toggleReceivableSourceAccount: Select element with ID '${selectId}' not found.`);
  }
  // It's good practice to also check if disclaimerElement exists, though it should if step B.1 was done.
  if (!disclaimerElement && type === "cc") {
      console.warn("toggleReceivableSourceAccount: Disclaimer element with ID 'receivableCcDisclaimer' not found, but was expected for 'cc' type.");
  }
}

// MODIFIED: handleAddReceivableSubmit to use correct form field name for source account
function handleAddReceivableSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const amount = parseFloat(form.get("recAmount"));
  const type = form.get("recType");
  // CORRECTED: Use 'receivableSourceAccount' to match the form's select name
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
    srcAcc.balance -= amount; // Amount deduction
    if (isNaN(srcAcc.balance)) srcAcc.balance = 0;
  } else if (type === "cc") {
    // We no longer automatically create a CC transaction here.
    // The ccTransactionId will remain null for 'cc' type receivables
    // unless a CC transaction is manually linked later (which is not current functionality).
    // A disclaimer in the form will guide the user.
    console.log(`Receivable of type 'cc' added for ${newRec.who}. User to manually add CC expense if needed.`);
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
  if (!receivable) return;
  openFormModal(
    `Receive Payment: ${receivable.who}`,
    `<p class="mb-2">Owed: <span class="font-semibold">${formatCurrency(
      receivable.remainingAmount
    )}</span> for ${
      receivable.why
    }</p><div><label class="block text-sm font-medium mb-1">Amount Received</label><input type="number" name="recPaymentAmount" step="0.01" min="0.01" max="${receivable.remainingAmount.toFixed(
      2
    )}" value="${receivable.remainingAmount.toFixed(
      2
    )}" required></div><div><label class="block text-sm font-medium mb-1">Receive Into Account</label><select name="recPaymentAccount" required></select></div><input type="hidden" name="recId" value="${recId}"><button type="submit" class="btn btn-primary w-full">Record Payment</button>`,
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
  // Added instMonthsLeft input field
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

  // Add listener to ensure monthsLeft is not greater than totalMonths
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
    // Set initial max if totalMonths has a default or is pre-filled
    setMaxMonthsLeft();
  }
}

function handleAddInstallmentSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const fullAmount = parseFloat(formData.get("instFullAmount"));
  const totalMonths = parseInt(formData.get("instTotalMonths"));
  let monthsLeft = parseInt(formData.get("instMonthsLeft")); // Get from new field

  if (
    isNaN(fullAmount) ||
    fullAmount <= 0 ||
    isNaN(totalMonths) ||
    totalMonths <= 0
  ) {
    showNotification("Invalid full amount or total months.", "error");
    return;
  }

  // Validate and set monthsLeft
  if (isNaN(monthsLeft) || monthsLeft > totalMonths || monthsLeft < 0) {
    monthsLeft = totalMonths; // Default to totalMonths if invalid or not provided
  }

  const monthlyAmount = fullAmount / totalMonths; // Monthly amount is based on the full original term

  const newInstallment = {
    id: generateId(),
    description: formData.get("instDescription").trim(),
    monthlyAmount: monthlyAmount,
    totalMonths: totalMonths,
    monthsLeft: monthsLeft, // Use the potentially adjusted monthsLeft
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
  renderDashboard(); // This will call renderInstallmentList
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
  if (!installment || installment.monthsLeft <= 0) return;
  const categoryOptions = state.categories
    .filter((c) => c !== "Income" && c !== "Credit Card Payment")
    .map(
      (cat) =>
        `<option value="${cat}" ${
          cat === "Installment Payment" ? "selected" : ""
        }>${cat}</option>`
    )
    .join("");
  openFormModal(
    `Pay Installment: ${installment.description}`,
    `<p class="mb-2">Paying 1 month (${formatCurrency(
      installment.monthlyAmount
    )}). ${
      installment.monthsLeft - 1
    } months will remain.</p><div><label class="block text-sm font-medium mb-1">Pay From Account</label><select id="modalInstPayAccount" name="instPayAccount" required></select></div><div><label class="block text-sm font-medium mb-1">Category</label><select id="modalInstPayCategory" name="instPayCategory" required>${categoryOptions}</select></div><input type="hidden" name="installmentId" value="${installmentId}"><button type="submit" class="btn btn-primary w-full">Confirm Payment</button>`,
    handlePayInstallmentSubmit
  );
  populateDropdowns();
}

// Replace the existing handlePayInstallmentSubmit function with this:
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
    // Should ideally not happen if button is hidden, but good check
    showNotification("Installment plan already fully paid.", "info");
    closeModal("formModal"); // Close modal if somehow opened for a paid plan
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

  // Process payment
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
    // Installment is now fully paid, remove it from the list
    state.installments = state.installments.filter(
      (i) => i.id !== installmentId
    );
    notificationMessage = `Installment for "${installment.description}" fully paid and removed. Expense logged.`;
  } else {
    notificationMessage = `Installment month paid for "${installment.description}". ${installment.monthsLeft} months remaining. Expense logged.`;
  }

  saveData();
  renderDashboard(); // This will re-render the installment list
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
        // c.toLowerCase() !== 'debt repayment' && // Not relevant here
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

  // Add event listener for the new checkbox for CC payment
  const logCcExpenseCheckbox = document.getElementById("logCcPaymentAsExpense");
  const ccCategoryGroupDiv = document.getElementById("ccPaymentCategoryGroup");
  const ccCategorySelect = document.getElementById("modalCcPayCategory");

  if (logCcExpenseCheckbox && ccCategoryGroupDiv && ccCategorySelect) {
    // Initial state based on checkbox
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

// --- SETTINGS LOGIC ---
function openSettingsModal() {
  // First, render the dynamic content within the panels (like account lists, category lists)
  renderSettingsForm(); // This function populates the content of the panels

  // Then, set up the tab navigation itself
  setupSettingsTabs(); // This creates tab buttons and sets the first tab active

  const storageInfoElement = $("#storageSizeInfo");
  if (storageInfoElement) {
    storageInfoElement.textContent = `Approx. Storage Used: ${getFormattedLocalStorageSize(
      STORAGE_KEY
    )}`;
  }

  $("#settingsModal").style.display = "block";
  cancelDeleteAllData(); // Resets the delete slider if it was active
  displayAppVersion(); // Ensure version is displayed
}

function renderSettingsForm() {
  // --- 1. Combined Account Names & Balances Management (within #settingsAccountsPanel) ---
  const accountManagementList = $("#accountManagementList");
  if (!accountManagementList) {
    console.error(
      "#accountManagementList element not found in #settingsAccountsPanel."
    );
  } else {
    accountManagementList.innerHTML = ""; // Clear previous entries
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
  // Attach submit handler to the form containing accountManagementList
  const manageAccountsForm = $("#manageAccountsForm"); // This form is in #settingsAccountsPanel
  if (manageAccountsForm) {
    manageAccountsForm.onsubmit = handleManageAccountsSubmit;
  }

  // --- 2. Credit Card Settings (within #settingsCreditCardPanel) ---
  const settingsCcLimitAmountInput = $("#settingsCcLimitAmount"); // Direct ID
  if (settingsCcLimitAmountInput) {
    settingsCcLimitAmountInput.value = (
      (state.creditCard && state.creditCard.limit) ||
      0
    ).toFixed(2);
    settingsCcLimitAmountInput.style.backgroundColor = "var(--bg-secondary)";
    settingsCcLimitAmountInput.style.borderColor = "var(--border-color)";
    settingsCcLimitAmountInput.style.color = "var(--text-primary)";
  }

  const settingsCcLimitForm = $("#settingsCcLimitForm"); // Direct ID
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

  const toggleCcSectionElement = $("#toggleCcSection"); // Direct ID
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
    // Ensure onchange is not re-assigned if already set, or manage it carefully
    if (!toggleCcSectionElement.dataset.listenerAttached) {
      // Prevent multiple listeners
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

  // --- 3. Manage Expense Categories (within #settingsCategoriesPanel) ---
  const addCategoryForm = $("#addCategoryForm"); // Direct ID
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
  renderCategorySettingsList(); // This function targets #categorySettingsList directly

  // Note: Data Management and Danger Zone panels are mostly static HTML elements,
  // their functionality (buttons etc.) is typically attached once in initializeUI.
  // If they had dynamic content needing refresh, that would go here too.
}

function renderCategorySettingsList() {
  const categoryList = $("#categorySettingsList");
  if (!categoryList) {
    console.error("#categorySettingsList element not found.");
    return;
  }
  categoryList.innerHTML = ""; // Clear existing list items

  const sortedCategories = [...state.categories].sort((a, b) =>
    a.localeCompare(b)
  );

  sortedCategories.forEach((cat) => {
    const li = document.createElement("li");
    // MODIFIED: Removed bg-gray-600, added inline style for var(--bg-secondary)
    li.className = "flex justify-between items-center p-2 rounded";
    li.style.backgroundColor = "var(--bg-secondary)";
    li.style.borderColor = "var(--border-color)"; // Optional: ensure border consistency
    li.style.borderWidth = "1px"; // Optional: ensure border consistency

    // Input for category name
    const inputElementHTML = `<input type="text" value="${cat}" data-original-name="${cat}" class="bg-transparent border-none focus:ring-0 focus:outline-none p-0 flex-grow mr-2 text-sm">`;

    // Div for buttons
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

// --- NEW FUNCTION to control CC Dashboard Section Visibility ---
function updateCcDashboardSectionVisibility() {
  const ccDashboardSection = $("#creditCardDashboardSection");
  if (ccDashboardSection) {
    // Default to true (visible) if the setting is undefined or state.settings itself is undefined
    let isVisible = true; // Default to true
    if (state.settings && state.settings.showCcDashboardSection !== undefined) {
      isVisible = state.settings.showCcDashboardSection;
    } else if (state.settings === undefined) {
      // If state.settings is undefined, we assume it's a fresh load before settings are established
      // and default to showing the section. Initialize state.settings here if it's missing.
      state.settings = {
        initialSetupDone: false,
        showCcDashboardSection: true,
      };
      console.log(
        "state.settings was undefined, initialized showCcDashboardSection to true"
      );
    }

    if (isVisible) {
      ccDashboardSection.style.display = ""; // Reverts to CSS default (block, grid, etc.)
    } else {
      ccDashboardSection.style.display = "none";
    }
  }

  // Also, ensure the CC Limit settings card visibility in the Settings Modal
  // is tied to this, so users can't set a limit if the feature is "off".
  // This part might be redundant if the CC Limit card is always part of the settings modal,
  // but good to consider if its visibility should also be controlled.
  // For now, we assume the ccLimitSettingsCard in the modal remains visible,
  // and only the dashboard section is toggled.
  // If you want to hide the CC Limit settings in the modal as well when the toggle is off:
  const ccLimitSettingsCard = $("#ccLimitSettingsCard");
  if (ccLimitSettingsCard) {
    // const isVisible = (state.settings && state.settings.showCcDashboardSection !== undefined) ? state.settings.showCcDashboardSection : true;
    // ccLimitSettingsCard.style.display = isVisible ? '' : 'none';
    // Decided against hiding the settings card itself for now, as the toggle is within it.
    // The toggle itself indicates the feature's status.
  }
}

// This function will handle the submission of the new combined "Manage Account Names & Balances" form
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
      return; // Skip if inputs are missing for some reason
    }

    const newName = newNameInput.trim();
    const newBalance = parseFloat(newBalanceInput);

    // Validate Name (if not 'cash' account)
    if (acc.id !== "cash") {
      if (!newName) {
        errors.push(
          `Account name for "${acc.name}" (ID: ${acc.id}) cannot be empty.`
        );
        // Optionally, revert input to original if you have access to it here, or just prevent save.
      } else if (newName !== acc.name) {
        // Check for duplicate names
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

    // Validate and Update Balance
    if (isNaN(newBalance)) {
      errors.push(
        `Invalid balance entered for account "${acc.name}". Please enter a valid number.`
      );
    } else if (Math.abs(acc.balance - newBalance) > 0.005) {
      // Check if balance actually changed
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
    // Optionally, re-render the form to show original values or highlight errors
    renderSettingsForm(); // Re-render to reset inputs to current state if save fails due to validation
    return;
  }

  if (changesMade) {
    // Mark initial setup as done if it wasn't already,
    // as managing accounts implies setup is complete.
    if (state.settings && !state.settings.initialSetupDone) {
      state.settings.initialSetupDone = true;
    }
    saveData();
    renderDashboard(); // Update main dashboard
    populateDropdowns(); // Update dropdowns everywhere
    renderSettingsForm(); // Re-render settings form to reflect saved changes (e.g., new names)
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

// --- DATA MANAGEMENT (Export/Import/Delete) ---
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
let isDragging = false; // Slider globals
function setupDeleteSlider() {
  const sliderContainer = $("#deleteSliderContainer");
  const handle = $("#deleteSliderHandle");
  const track = sliderContainer.querySelector(".slide-to-confirm-track");
  if (!sliderContainer || !handle || !track) return;

  let startX = 0;
  let currentTranslateX = 0;

  const calculateMaxTranslate = () => {
    maxTranslateX = sliderContainer.offsetWidth - handle.offsetWidth - 4; // 2px for handle's own border/padding on each side if any, adjust as needed
  };

  window.resetDeleteSlider = () => {
    isDragging = false;
    currentTranslateX = 0;
    handle.style.transition =
      "transform 0.2s ease-out, background-color 0.2s ease-out";
    track.style.transition =
      "width 0.2s ease-out, background-color 0.2s ease-out";
    handle.style.transform = `translateX(0px)`;
    track.style.width = `0px`; // Reset track width
    track.style.backgroundColor = "var(--button-success-bg)"; // Default track color (becomes visible on drag)
    handle.innerHTML = '<i class="fas fa-arrow-right"></i>';
    handle.style.backgroundColor = "var(--accent-primary)";
    handle.style.cursor = "grab";
    sliderContainer.style.cursor = "pointer";
  };

  const startDrag = (clientX) => {
    calculateMaxTranslate(); // Calculate max on drag start, in case of resize
    isDragging = true;
    startX = clientX - handle.getBoundingClientRect().left; // Position of mouse relative to handle's left edge
    handle.style.transition = "none"; // No transition during drag for smoothness
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
    track.style.width = `${currentTranslateX + handle.offsetWidth / 2}px`; // Make track follow handle center
  };

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    handle.style.cursor = "grab";
    sliderContainer.style.cursor = "pointer";
    // Re-apply transitions for snap back or completion animation
    handle.style.transition =
      "transform 0.2s ease-out, background-color 0.2s ease-out";
    track.style.transition =
      "width 0.2s ease-out, background-color 0.2s ease-out";

    if (currentTranslateX >= maxTranslateX - 1) {
      // Allow a tiny margin for completion
      completeDeletion();
    } else {
      resetDeleteSlider(); // Snap back
    }
  }; // <<< --- ADDED THIS CLOSING BRACE for endDrag

  // Event Listeners
  handle.addEventListener("mousedown", (e) => startDrag(e.clientX));
  document.addEventListener("mousemove", (e) => {
    if (isDragging) drag(e.clientX);
  });
  document.addEventListener("mouseup", endDrag);

  handle.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault(); // Prevent page scroll
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
        e.preventDefault(); // Prevent page scroll during drag
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
      calculateMaxTranslate(); // Recalculate if the slider is visible
      resetDeleteSlider(); // And reset its position
    }
  });
} // <<<--- ADDED THIS CLOSING BRACE for setupDeleteSlider

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

// --- CASH COUNTER LOGIC ---
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

// --- MODAL HANDLING ---
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
    if (event.target === modal) closeModal(modal.id);
  });
});

// --- EDIT FORM POPULATION (Wrapper functions that call modal openers) ---
function openEditTransactionForm(id, event) {
  openEditTransactionModal(id, event);
}

function openEditCcTransactionForm(id) {
  openEditCcTransactionModal(id);
}

// --- BACKUP REMINDER LOGIC ---

/**
 * Handles the dismissal of the backup reminder.
 * Stores the current date for the given reminder key in localStorage.
 * @param {string} reminderKey - The localStorage key (e.g., 'lastReminderShownForSunday').
 */
function handleBackupReminderDismiss(reminderKey) {
  try {
    localStorage.setItem(reminderKey, getCurrentDateString());
    console.log(
      `Backup reminder dismissed for key: ${reminderKey} on ${getCurrentDateString()}`
    );
  } catch (e) {
    console.error("Error saving backup reminder dismissal state:", e);
  }
  closeModal("formModal"); // Reuses the formModal for the reminder
}

/**
 * Shows the backup reminder pop-up using the existing formModal structure.
 * Includes "Backup Now" and "I'll Do It Later" buttons.
 * @param {string} reminderKey - The localStorage key to update upon dismissal.
 */
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

/**
 * Checks if a backup reminder should be shown and triggers it.
 * This function is intended to be called periodically.
 */
function checkAndTriggerBackupReminder() {
  // --- ADD THIS CHECK AT THE BEGINNING ---
  // If initial setup isn't done (meaning no initial balances set, likely no data)
  // OR if there are absolutely no transactions, don't show the backup reminder.
  if (!state.settings.initialSetupDone && state.transactions.length === 0) {
    console.log(
      "Skipping backup reminder: Initial setup not done or no transactions."
    );
    return;
  }
  // --- END OF ADDED CHECK ---

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 for Sunday, 3 for Wednesday
  const currentDateStr = getCurrentDateString();

  let reminderKey = null;

  if (dayOfWeek === 0) {
    // Sunday
    reminderKey = "lastReminderShownForSunday";
  } else if (dayOfWeek === 3) {
    // Wednesday
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

let activeSettingsTab = null; // To keep track of the active tab button

const settingsTabsConfig = [
  { label: "Accounts", targetPanelId: "settingsAccountsPanel" },
  { label: "Credit Card", targetPanelId: "settingsCreditCardPanel" },
  { label: "Categories", targetPanelId: "settingsCategoriesPanel" },
  { label: "Data", targetPanelId: "settingsDataManagementPanel" }, // "Danger Zone" is now inside this panel
  // "About" and "Danger Zone" are no longer separate tabs in this configuration
];

/**
 * Sets up the tab navigation and functionality for the Settings modal.
 */
function setupSettingsTabs() {
  const tabsContainer = document.getElementById("settingsTabsContainer");
  const tabContentContainer = document.getElementById("settingsTabContent");

  if (!tabsContainer || !tabContentContainer) {
    console.error("Settings tab containers not found!");
    return;
  }

  tabsContainer.innerHTML = ""; // Clear any existing tabs
  activeSettingsTab = null; // Reset active tab state

  settingsTabsConfig.forEach((tabConfig, index) => {
    const li = document.createElement("li");
    // Tailwind's justify-center on the ul will handle centering.
    // Individual li elements don't need margin if gap is used on ul or flex properties.
    // If you need specific spacing between tabs, it's better to add it to the <li> or via gap on <ul>.

    const button = document.createElement("button");
    button.className =
      "settings-tab-button inline-block p-3 border-b-2 rounded-t-lg"; // Base classes from your CSS
    button.textContent = tabConfig.label;
    button.dataset.tabTarget = `#${tabConfig.targetPanelId}`;

    button.addEventListener("click", () => {
      switchSettingsTab(button, tabConfig.targetPanelId);
    });

    li.appendChild(button);
    tabsContainer.appendChild(li);

    // Set the first tab as active by default when the modal is opened
    if (index === 0) {
      // Call switchSettingsTab directly here to ensure the first panel is shown
      // and the button is marked active when setupSettingsTabs is first called.
      switchSettingsTab(button, tabConfig.targetPanelId);
    } else {
      // Ensure other panels are hidden initially
      const panel = document.getElementById(tabConfig.targetPanelId);
      if (panel) {
        panel.classList.add("hidden");
      }
    }
  });
}

/**
 * Handles switching between tabs in the Settings modal.
 * @param {HTMLElement} clickedButton - The tab button that was clicked.
 * @param {string} targetPanelId - The ID of the content panel to show.
 */
function switchSettingsTab(clickedButton, targetPanelId) {
  const tabContentContainer = document.getElementById("settingsTabContent");
  if (!tabContentContainer) return;

  // Deactivate previously active tab and hide its panel
  if (activeSettingsTab && activeSettingsTab.button !== clickedButton) {
    activeSettingsTab.button.classList.remove("active");
    // Ensure the target selector is correct (includes #)
    const oldPanelSelector = activeSettingsTab.button.dataset.tabTarget;
    if (oldPanelSelector) {
      const oldPanel = tabContentContainer.querySelector(oldPanelSelector); // Use querySelector on the container
      if (oldPanel) {
        oldPanel.classList.add("hidden");
      }
    }
  }

  // Activate new tab and show its panel
  clickedButton.classList.add("active");
  const targetPanel = document.getElementById(targetPanelId); // Direct ID selection for the panel to show
  if (targetPanel) {
    targetPanel.classList.remove("hidden");
  } else {
    console.warn(`Target panel with ID '${targetPanelId}' not found.`);
  }

  activeSettingsTab = { button: clickedButton, panelId: targetPanelId };
}

// --- INITIALIZATION ---
function initializeUI(isRefresh = false) {
  console.log("Initializing UI...");

  if (!isRefresh) {
    loadData(); // Populates 'state' from localStorage or defaults
  }

  if (
    !state.settings ||
    state.settings.initialSetupDone === undefined ||
    state.settings.initialSetupDone === false
  ) {
    if (!isRefresh) {
      console.log("Initial setup not done. Opening wizard.");
      openInitialSetupWizard();
      return;
    }
  }

  const mainDateInput = $("#date");
  if (mainDateInput)
    mainDateInput.value = new Date().toISOString().split("T")[0];
  const mainCcDateInput = $("#ccDate");
  if (mainCcDateInput)
    mainCcDateInput.value = new Date().toISOString().split("T")[0];

  populateDropdowns();
  renderDashboard();
  updateCcDashboardSectionVisibility();
  setupMonthlyView();
  if (!window.deleteSliderInitialized) {
    setupDeleteSlider();
    window.deleteSliderInitialized = true;
  }

  displayAppVersion();

  $("#transactionForm").onsubmit = handleTransactionSubmit;
  $("#ccTransactionForm").onsubmit = handleCcTransactionSubmit;
  $("#transferForm").onsubmit = handleTransferSubmit;

  $("#settingsBtn").onclick = () => {
    openSettingsModal();
  };
  $("#monthlyViewBtn").onclick = () => {
    const yearSelector = $("#yearSelector");
    if (yearSelector && yearSelector.value) {
      renderMonthTabs(parseInt(yearSelector.value));
    } else {
      renderMonthTabs(new Date().getFullYear());
    }
    $("#monthlyViewModal").style.display = "block";
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
      $$("#monthTabs .tab-button")[0].click();
    } else {
      $("#monthlyDetailsContainer").innerHTML =
        '<p class="text-center text-gray-400">Select a month.</p>';
    }
  };
  $("#exportDataBtn").onclick = exportData;
  $("#importDataInput").onchange = importData;
  $("#initiateDeleteBtn").onclick = initiateDeleteAllData;
  $("#cancelDeleteBtn").onclick = cancelDeleteAllData;
  $("#addDebtBtn").onclick = openAddDebtForm;
  $("#addReceivableBtn").onclick = openAddReceivableForm;
  $("#addInstallmentBtn").onclick = openAddInstallmentForm;
  $("#cashCounterBtn").onclick = openCashCounter;
  $("#ccHistoryBtn").onclick = openCcHistoryModal;

  const transactionTypeSelect = $("#transactionType");
  const categoryGroup = $("#categoryGroup");
  const descriptionInput = $("#description");
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
    toggleMainCategoryVisibility();
  }

  renderDebtList();
  renderInstallmentList();

  if (!window.countdownInterval) {
    window.countdownInterval = setInterval(() => {
      renderDebtList();
      renderInstallmentList();
    }, 1000 * 60 * 60);
  }

  if (!window.backupReminderInterval) {
    checkAndTriggerBackupReminder();
    window.backupReminderInterval = setInterval(
      checkAndTriggerBackupReminder,
      1000 * 60 * 60
    );
    console.log("Backup reminder interval started.");
  }
}

// --- STARTUP ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Loaded. Initializing...");
  loadData();
  initializeUI();
  const preloaderElement = document.getElementById("preloader");
  const appContentElement = document.getElementById("app-content");
  const preloaderDuration = 1250; // 1.25 seconds

  if (preloaderElement && appContentElement) {
    console.log(
      `Preloader will be shown for ${preloaderDuration / 1000} seconds.`
    );

    // This timeout will hide the preloader and show the main content
    setTimeout(() => {
      console.log(
        "Preloader timer finished. Hiding preloader, showing app content."
      );

      // Start fading out preloader by adding the 'hidden' class (defined in CSS)
      preloaderElement.classList.add("hidden");

      // Start fading in app content by adding the 'visible' class (defined in CSS)
      appContentElement.classList.add("visible");

      // After the preloader's fade-out transition (0.75s as per CSS),
      // set its display to 'none' so it doesn't take up space or interfere.
      // The transition duration for #preloader opacity is 0.75s (750ms).
      setTimeout(() => {
        preloaderElement.style.display = "none";
        console.log("Preloader display set to 'none' after fade-out.");
      }, 750); // This duration MUST match the CSS transition-duration for #preloader
    }, preloaderDuration);
  } else {
    // Fallback if essential elements are missing, to prevent a blank page
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
    // Attempt to make the app content visible anyway if the preloader structure is broken
    if (appContentElement) {
      appContentElement.classList.add("visible"); // Show app content
      console.warn(
        "Attempted to show app content due to missing preloader elements."
      );
    }
    if (preloaderElement) {
      preloaderElement.style.display = "none"; // Hide preloader immediately
    }
  }
});
