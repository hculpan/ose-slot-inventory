import { getInventorySlotsForPlayer } from "./getslots.js";
import { openGmDetailsView } from "./gmdetailsview.js";
import { openPlayerDetailsView } from "./playerdetailsview.js";

Hooks.on("renderPlayerList", (playerList, html) => {
  // find the element which has our logged in user's id
  const loggedInUserListItem = html.find(`[data-user-id="${game.userId}"]`);
  const tooltip = game.i18n.localize("INVENTORY-SLOTS.button-title");

  // insert a button at the end of this element
  loggedInUserListItem.append(
    `<button type='button' class='oseslotinventory-list-icon-button flex0' title='${tooltip}'><i class='fas fa-tasks'></i></button>`
  );

  html.on("click", ".oseslotinventory-list-icon-button", (event) => {
    let isGM = game.users.current.id === game.users.activeGM?.id;
    if (isGM) {
      openGmDetailsView();
    } else {
      openPlayerDetailsView(game.user);
    }
  });
});

Hooks.once("ready", function () {});

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

function updatePage() {
  let inventory = getInventorySlotsForPlayer(game.users.current.id);
  for (let i = 0; i < inventory.slotInfo.length; i++) {
    let slots = inventory.slotInfo[i];
    if (slots.slotsRemaining < 0) {
      ui.notifications.warn(`${slots.name} is overloaded by ${Math.abs(slots.slotsRemaining)} slots`);
    }
  }
}
