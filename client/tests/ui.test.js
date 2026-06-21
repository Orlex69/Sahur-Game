import test from 'node:test';
import assert from 'node:assert';

// Mock minimal browser environment
globalThis.document = {
  createElement: (tagName) => {
    return {
      tagName: tagName.toUpperCase(),
      className: '',
      textContent: '',
      innerHTML: '',
      style: {},
      addEventListener: () => {},
      appendChild: () => {},
      removeChild: () => {},
    };
  },
};

import { Button, InputField, LeaderboardRow } from '../src/ui/UI.js';

test('UI - Button atom component creation', () => {
  const btn = new Button('Test Button', 'btn-primary');
  assert.strictEqual(btn.el.tagName, 'BUTTON');
  assert.strictEqual(btn.el.className, 'btn btn-primary');
  assert.strictEqual(btn.el.textContent, 'Test Button');
});

test('UI - InputField atom component creation', () => {
  const input = new InputField('Enter name', 'Test Val');
  assert.strictEqual(input.el.tagName, 'INPUT');
  assert.strictEqual(input.el.placeholder, 'Enter name');
  assert.strictEqual(input.el.value, 'Test Val');
});

test('UI - LeaderboardRow molecule component creation', () => {
  const row = new LeaderboardRow('1.', 'Sigma 1', 120, true);
  assert.strictEqual(row.el.tagName, 'DIV');
  assert.ok(row.el.className.includes('leaderboard-row'));
  assert.ok(row.el.className.includes('self'));
});
