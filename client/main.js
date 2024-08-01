import { build, develop, endTurn, ready, unready, join } from "./modules/actions.js"
import { showBuild, showTrade, showChat } from "./modules/sidebar.js";

// Expose functions to the global scope
window.build = build;
window.develop = develop;
window.endTurn = endTurn;
window.ready = ready;
window.unready = unready;
window.join = join;

window.showBuild = showBuild;
window.showTrade = showTrade;
window.showChat = showChat;

/**
 * Represents the game state.
 * @typedef {Object} Game
 * @property {string} currentType - The current type of building being built.
 * @property {null|Map} map - The game map.
 * @property {boolean} roadBuilding - Indicates if the road building action is being performed.
 * @property {number} roadsBuilt - The number of roads built during road building.
 * @property {boolean} knightPlayed - Indicates if a knight card is being played.
 * @property {Array} chat - The chat messages.
 * @property {Array} players - The players in the game.
 */

/** 
 * The game object representing the state of the game.
 * @type {Game}
 */
export const game = {
    currentType: "settlement",
    map: null,
    roadBuilding: false,
    roadsBuilt: 0,
    knightPlayed: false,
    chat: [],
    players: []
}

/**
 * Represents a player in the game.
 * @typedef {Object} Player
 * @property {string} name - The name of the player.
 * @property {string} color - The color assigned to the player.
 */

/**
 * The player object representing the current player.
 * @type {Player}
 */
export const player = {
    name: null,
    color: null
}

/**
 * The server object representing the WebSocket connection to the server.
 * @type {WebSocket|null}
 */
export let server = null;

/**
 * Connects to the server using the specified address.
 * @param {string} address - The address of the server.
 */
export function connect(address) {
    server = new WebSocket("ws://" + address);
}
