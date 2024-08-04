import { getInventorySlotsForPlayer } from "./getslots.js";
import { openPlayerDetailsView } from "./playerdetailsview.js";

export class GmDetailsView extends Application {
  constructor(data, options) {
    super(options);
    this.data = data;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "ose-slot-inventory-gm-details-view",
      title: "Inventory Slots",
      template: "modules/ose-slot-inventory/templates/gmdetailsview.html",
      width: 600,
      height: 800,
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

    html.on("click", ".oseslotinventory-list-icon-button", (event) => {
      let playerName = event.currentTarget.dataset.name;
      let player = game.users.find((user) => user.name === playerName);
      console.log(player);
      openPlayerDetailsView(player);
    });
  }
}

function getNonGMPlayers() {
  // Filter the users to exclude GMs
  const nonGMPlayers = game.users.filter((user) => !user.isGM);

  return nonGMPlayers;
}

function getInventoryData() {
  let entries = [];

  let players = getNonGMPlayers();
  for (let i = 0; i < players.length; i++) {
    let playerInfo = getInventorySlotsForPlayer(players[i].id);
    entries.push({
      playerInfo: playerInfo,
    });
  }

  return entries;
}

export function openGmDetailsView() {
  let idata = getInventoryData();

  let entries = [];
  for (let i = 0; i < idata.length; i++) {
    for (let j = 0; j < idata[i].playerInfo.slotInfo.length; j++) {
      if (idata[i].playerInfo.playerName !== "Solo") {
        let entry = {
          playerName: idata[i].playerInfo.playerName,
          characterName: idata[i].playerInfo.slotInfo[j].name,
          slotsAvailable: idata[i].playerInfo.slotInfo[j].slotsAvailable,
          slotsRemaining: idata[i].playerInfo.slotInfo[j].slotsRemaining,
          slotsOccupied: idata[i].playerInfo.slotInfo[j].slotsOccupied,
          overloaded: idata[i].playerInfo.slotInfo[j].slotsRemaining < 0 ? "Y" : " ",
        };
        entries.push(entry);
      }
    }
  }

  const dview = new GmDetailsView(entries);
  dview.render(true);
}
