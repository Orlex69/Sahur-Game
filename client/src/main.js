import './style.css';
import { ClientGame } from './game/ClientGame.js';

window.addEventListener('DOMContentLoaded', () => {
  const game = new ClientGame();
  game.start();
});
