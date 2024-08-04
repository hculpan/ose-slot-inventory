Hooks.on("init", function () {});

Hooks.once("ready", function () {
  console.log("OSE Slot Inventory | Ready");

  oseSlotInventoryConfig = new OseSlotInventoryConfig();

  oseSlotInventoryConfig.setData(getSlots());

  referenceWindowPosition = getHotbarPosition();
  if (referenceWindowPosition) {
    // Calculate the new window position relative to the reference window
    const newWindowLeft = referenceWindowPosition.left + referenceWindowPosition.width + 10; // 10px to the right
    const newWindowTop = referenceWindowPosition.top + 150; // Align top with the reference window

    // Render the window with the calculated position
    oseSlotInventoryConfig.render(true, {
      left: newWindowLeft,
      top: newWindowTop,
    });
  } else {
    // Fallback to default position if reference window is not found
    oseSlotInventoryConfig.render(true);
  }

  oseSlotInventoryConfig.render(true, { userId: game.userId });

  // document.getElementById("open-modal").addEventListener("click", openModal);
});

Hooks.on("deleteItem", function () {
  updatePage();
});

Hooks.on("createItem", function () {
  updatePage();
});

Hooks.on("updateItem", function () {
  updatePage();
});

Hooks.on("closeItemSheet", function () {
  updatePage();
});

Hooks.on("updateActor", function () {
  updatePage();
});

let oseSlotInventoryConfig;

const regex = /^\[\d{2}\.\d{2}\]/;

function updatePage() {
  console.log("OSE Slot Inventory | updatePage called");
  result = getSlots();
  oseSlotInventoryConfig.setData(result);
  if (oseSlotInventoryConfig.slotsAvailable < 0) {
    changeColor();
  } else {
    resetColor;
  }

  if (result.inventory == undefined) {
    console.log("OSE Slot Inventory | ERROR: no inventory array");
  } else {
    for (i = 0; i < result.inventory.length; i++) {
      console.log(
        "OSE Slot Inventory | Item: %s: %s - %d slots",
        result.inventory[i].type,
        result.inventory[i].name,
        result.inventory[i].slots
      );
    }
  }

  oseSlotInventoryConfig.render(true);
}

function changeColor() {
  console.log("setting to red");
  var div = document.getElementById("oseslotinventory-form");
  div.style.backgroundColor = "red";
}

function resetColor() {
  var div = document.getElementById("oseslotinventory-form");
  div.style.backgroundColor = ""; // Reset to original color
}

function getSlots() {
  result = {
    slotsOccupied: 0,
    slotsAvailable: 0,
    slotsRemaining: 0,
  };

  let inventory = [];

  result.slotsAvailable =
    game.user.character.system.scores.str.value < 10 ? 10 : game.user.character.system.scores.str.value;

  let total = 0;
  let coins = 0;
  let gems = 0;
  let firstContainer = false;
  game.user.character.items.forEach((e) => {
    switch (e.type) {
      case "armor":
      case "weapon":
        inventory.push({ name: e.name, type: e.type, slots: e.system.itemslots });
        total += e.system.itemslots;
        break;
      case "item":
        let slots = 1;

        // check for coins
        if (regex.test(e.name)) {
          coins += e.system.quantity.value;
          slots = 0;
        } else if (e.name.toUpperCase() === "GEM" || e.name.toUpperCase() === "GEMS") {
          gems += e.system.quantity.value;
          slots = 0;
        } else if (e.system.weight != undefined) {
          slots = e.system.weight;
          inventory.push({ name: e.name, type: e.type, slots: slots });
        }

        total += slots;
        break;
      case "container":
        if (!firstContainer) {
          inventory.push({ name: e.name, type: e.type, slots: 0 });
          firstContainer = true;
        } else {
          inventory.push({ name: e.name, type: e.type, slots: 1 });
          total += 1;
        }
        break;
      case "ability":
        break;
      default:
        console.log("ignored " + e.name + " of type " + e.type);
    }
  });

  if (gems > 0) {
    let slots = Math.ceil(gems / 10);
    total += slots;
    inventory.push({ name: "Gems (" + gems + ")", type: "treasure", slots: Math.ceil(gems / 10) });
  }

  if (coins > 0) {
    let slots = Math.floor((coins - 1) / 100);
    inventory.push({ name: "Coins (" + coins + ")", type: "treasure", slots: slots });
    total += slots;
  }

  result.slotsOccupied = total;
  result.slotsRemaining = result.slotsAvailable - result.slotsOccupied;

  inventory.sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === "armor") {
        return -1;
      } else if (a.type === "weapon" && b.type !== "armor") {
        return -1;
      } else if (a.type === "container" && b.type !== "weapon" && b.type !== "armor") {
        return -1;
      } else {
        return 1;
      }
    }
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  result.inventory = inventory;

  return result;
}

function getHotbarPosition() {
  const hotbarElement = document.querySelector("#hotbar");
  if (hotbarElement) {
    const rect = hotbarElement.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }
  return null;
}

class OseSlotInventoryConfig extends FormApplication {
  slotsOccupied = 0;
  slotsAvailable = 0;
  slotsRemaining = 0;

  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      height: 130,
      width: 200,
      id: "ose-slot-inventory",
      template: "modules/ose-slot-inventory/templates/oseslotinventory.hbs",
      title: "OSE Slot Inventory",
      userId: game.userId,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }

  activateListeners(html) {
    html.on("click", "[data-action]", this._handleButtonClick);
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;

    switch (action) {
      case "details": {
        openModal();
        break;
      }
    }

    oseSlotInventoryConfig.render(true);
  }

  setData(slots) {
    oseSlotInventoryConfig.slotsOccupied = slots.slotsOccupied;
    oseSlotInventoryConfig.slotsAvailable = slots.slotsAvailable;
    oseSlotInventoryConfig.slotsRemaining = slots.slotsRemaining;
  }

  getData(options) {
    return {
      slotsOccupied: oseSlotInventoryConfig.slotsOccupied,
      slotsAvailable: oseSlotInventoryConfig.slotsAvailable,
      slotsRemaining: oseSlotInventoryConfig.slotsRemaining,
      isGM: game.users.current.id === game.users.activeGM?.id,
    };
  }
}

class MyModal extends Application {
  constructor(data, options) {
    super(options);
    this.data = data; // Data to display in the modal
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "my-modal",
      title: "Inventory Slots",
      template: "modules/ose-slot-inventory/templates/modal.html",
      width: 400,
      height: 600,
      resizable: true,
    });
  }

  getData() {
    return {
      data: this.data,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".close-modal").click(this.close.bind(this));
  }
}

function openModal() {
  console.log("opening modal");
  const data = getSlots();
  const modal = new MyModal(data);
  modal.render(true);
}
