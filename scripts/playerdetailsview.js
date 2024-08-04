import { getSlots, getInventorySlotsForPlayer } from "./getslots.js";

let dview;

export class PlayerDetailsView extends Application {
  currentActor = 0;

  constructor(data, options) {
    super(options);
    this.data = data; // Data to display in the modal
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "ose-slot-inventory-details-view",
      title: "Inventory Slots",
      template: "modules/ose-slot-inventory/templates/playerdetailsview.html",
      width: 400,
      height: 600,
      resizable: true,
    });
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;

    switch (action) {
      case "left-arrow":
        console.log("leftArrowClick");
        dview.currentActor = dview.currentActor - 1 < 0 ? dview.data.slotInfo.length - 1 : dview.currentActor - 1;
        break;
      case "right-arrow":
        console.log("rightArrowClick");
        dview.currentActor = (dview.currentActor + 1) % dview.data.slotInfo.length;
        break;
    }

    dview.render(true);
  }

  getData() {
    return {
      data: this.data.slotInfo[this.currentActor],
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("click", "[data-action]", this._handleButtonClick);
    html.find(".close-modal").click(this.close.bind(this));
  }
}

export function openPlayerDetailsView(player) {
  let data = getInventorySlotsForPlayer(player.id);
  dview = new PlayerDetailsView(data);
  dview.render(true);
}
