const regex = /^\[\d{2}\.\d{2}\]/;

const multipleItemsMap = new Map([
  ["coins", { name: "Coins", type: "treasure", number: 100, floor: true }],
  ["gems", { name: "Gems", type: "treasure", number: 10, floor: false }],
  ["arrows", { name: "Arrows", type: "ammunition", number: 20, floor: false }],
  ["rations", { name: "Rations", type: "item", number: 3, floor: false }],
  ["caltrops", { name: "Caltrops", type: "item", number: 12, floor: false }],
  ["spikes", { name: "Spikes", type: "item", number: 12, floor: false }],
  ["chalk", { name: "Chalk", type: "item", number: 5, floor: false }],
  ["stakes", { name: "Stakes", type: "item", number: 3, floor: false }],
  ["bolts", { name: "Crossbow Bolts", type: "item", number: 30, floor: false }],
  ["stones", { name: "Sling Stones", type: "item", number: 20, floor: false }],
]);

export function getInventorySlotsForPlayer(playerId) {
  const user = game.users.get(playerId);
  if (!user) {
    console.error(`User with ID ${playerId} not found.`);
    return {};
  }

  let actors = getActorsOwnedByPlayer(playerId);
  let slotInfo = [];
  for (let i = 0; i < actors.length; i++) {
    let slots = getSlots(actors[i]);
    slots.name = actors[i].name;
    slotInfo.push(slots);
  }

  return {
    playerName: user.name,
    slotInfo: slotInfo,
  };
}

export function getActorsOwnedByPlayer(playerId) {
  // Get the user by their ID
  const user = game.users.get(playerId);
  if (!user) {
    console.error(`User with ID ${playerId} not found.`);
    return [];
  }

  // Get all actors
  const allActors = game.actors.contents;

  // Filter actors by ownership
  const ownedActors = allActors.filter(
    (actor) => actor.testUserPermission(user, "OWNER") && actor.name.toUpperCase() !== "PARTY TOKEN"
  );

  return ownedActors;
}

function addToMap(map, itemName, value) {
  let items = map.get(itemName);
  if (items == undefined) {
    items = 0;
  }
  map.set(itemName, items + value);
}

export function getSlots(character) {
  let result = {
    slotsOccupied: 0,
    slotsAvailable: 0,
    slotsRemaining: 0,
  };

  let inventory = [];

  result.slotsAvailable = character.system.scores.str.value < 10 ? 10 : character.system.scores.str.value;
  // console.log(`OSE Slot Inventory | --------- ${character.name} ---------`);

  character.owned = {
    items: character.system.items,
    armors: character.system.armor,
    weapons: character.system.weapons,
    treasures: character.system.treasures,
    containers: character.system.containers,
  };

  const itemTotals = new Map();

  let total = 0;

  let firstContainer = false;
  character.items.forEach((e) => {
    if (e.type === "ability" || e.type === "spell") {
      // IGNORE
    } else if (regex.test(e.name)) {
      addToMap(itemTotals, "coins", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("GEM")) {
      addToMap(itemTotals, "gems", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("ARROW")) {
      addToMap(itemTotals, "arrows", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("RATIONS") && e.type === "item") {
      addToMap(itemTotals, "rations", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("CALTROPS") && e.type === "item") {
      addToMap(itemTotals, "caltrops", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("SPIKES") && e.type === "item") {
      addToMap(itemTotals, "spikes", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("CHALK") && e.type === "item") {
      addToMap(itemTotals, "chalk", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("STAKES") && e.type === "item") {
      addToMap(itemTotals, "stakes", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("CROSSBOW BOLTS")) {
      addToMap(itemTotals, "bolts", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("SLING STONES")) {
      addToMap(itemTotals, "stones", e.system.quantity.value);
    } else if (e.name.toUpperCase().startsWith("RING ")) {
      inventory.push({ name: e.name, type: e.type, slots: 0 });
    } else if (e.type === "container") {
      if (!firstContainer) {
        inventory.push({ name: e.name, type: e.type, slots: 0 });
        firstContainer = true;
      } else {
        inventory.push({ name: e.name, type: e.type, slots: 1 });
        total += 1;
      }
    } else if (e.system?.weight != null) {
      inventory.push({ name: e.name, type: e.type, slots: e.system.weight * e.system.quantity.value });
      total += e.system.weight * e.system.quantity.value;
    } else {
      inventory.push({ name: e.name, type: e.type, slots: e.system.quantity.value });
      total += e.system.quantity.value;
    }
  });

  for (let [key, value] of itemTotals) {
    let slots = 0;

    let o = multipleItemsMap.get(key);
    if (o != undefined && o != null) {
      slots = o.floor ? Math.floor((value - 1) / o.number) : Math.ceil(value / o.number);
      inventory.push({ name: `${o.name} (${value})`, type: o.type, slots: slots });
    }

    total += slots;
  }

  result.slotsOccupied = Math.ceil(total);
  result.slotsRemaining = result.slotsAvailable - result.slotsOccupied;

  inventory.sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === "weapon") {
        return -1;
      } else if (a.type === "armor" && b.type !== "weapon") {
        return -1;
      } else if (a.type === "ammunition" && b.type !== "weapon" && b.type !== "armor") {
        return -1;
      } else if (a.type === "container" && b.type !== "weapon" && b.type !== "armor" && b.type !== "ammunition") {
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
