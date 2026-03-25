// Tests for ScrollController enhancements: animateTo, followMode re-enable, atBottom
// Plan 11-02: ScrollController Enhancements

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ScrollController } from '../scroll-controller';

describe('ScrollController - animateTo', () => {
  let controller: ScrollController;

  beforeEach(() => {
    controller = new ScrollController();
    controller.updateMaxScrollExtent(200);
    // followMode will auto-scroll to 200; reset to 0 for animation tests
    controller.disableFollowMode();
    controller.jumpTo(0);
  });

  afterEach(() => {
    controller.dispose();
  });

  test('animateTo with zero duration jumps immediately', () => {
    controller.animateTo(100, 0);
    expect(controller.offset).toBe(100);
    expect(controller.isAnimating).toBe(false);
  });

  test('animateTo with negative duration jumps immediately', () => {
    controller.animateTo(80, -50);
    expect(controller.offset).toBe(80);
    expect(controller.isAnimating).toBe(false);
  });

  test('animateTo clamps to maxScrollExtent', () => {
    controller.animateTo(999, 0);
    expect(controller.offset).toBe(200);
  });

  test('animateTo clamps to 0 for negative target', () => {
    controller.jumpTo(50);
    controller.animateTo(-100, 0);
    expect(controller.offset).toBe(0);
  });

  test('animateTo does nothing when already at target', () => {
    controller.jumpTo(50);
    let notified = false;
    controller.addListener(() => { notified = true; });

    controller.animateTo(50);
    expect(controller.isAnimating).toBe(false);
    expect(notified).toBe(false);
  });

  test('animateTo starts animation for non-zero duration', () => {
    controller.animateTo(100, 200);
    expect(controller.isAnimating).toBe(true);
  });

  test('animateTo reaches target after duration elapses', async () => {
    controller.animateTo(100, 50); // short duration for test speed
    expect(controller.isAnimating).toBe(true);

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 120));
    expect(controller.offset).toBe(100);
    expect(controller.isAnimating).toBe(false);
  });

  test('animateTo notifies listeners during animation', async () => {
    let callCount = 0;
    controller.addListener(() => { callCount++; });

    controller.animateTo(100, 50);

    await new Promise(resolve => setTimeout(resolve, 120));
    expect(callCount).toBeGreaterThan(0);
  });

  test('animateTo cancels previous animation', async () => {
    controller.animateTo(100, 200);
    expect(controller.isAnimating).toBe(true);

    // Start a new animation before the first completes
    controller.animateTo(50, 0);
    expect(controller.offset).toBe(50);
    expect(controller.isAnimating).toBe(false);
  });

  test('animateTo can scroll backward', async () => {
    controller.jumpTo(100);
    controller.animateTo(20, 50);

    await new Promise(resolve => setTimeout(resolve, 120));
    expect(controller.offset).toBe(20);
    expect(controller.isAnimating).toBe(false);
  });

  test('animateTo intermediate frames have partial offset', async () => {
    const offsets: number[] = [];
    controller.addListener(() => {
      offsets.push(controller.offset);
    });

    controller.animateTo(100, 80);

    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have at least one intermediate frame before reaching 100
    expect(offsets.length).toBeGreaterThan(1);
    // Last offset should be the target
    expect(offsets[offsets.length - 1]).toBe(100);
    // First offset should be less than target (linear interpolation)
    if (offsets.length > 1) {
      expect(offsets[0]).toBeLessThanOrEqual(100);
    }
  });

  test('dispose cancels running animation', () => {
    controller.animateTo(100, 500);
    expect(controller.isAnimating).toBe(true);

    controller.dispose();
    expect(controller.isAnimating).toBe(false);
  });

  test('animateTo uses default duration of 200ms', async () => {
    controller.animateTo(100); // no duration arg

    // Should be animating (not instant)
    expect(controller.isAnimating).toBe(true);

    // Should not be done immediately
    expect(controller.offset).toBeLessThan(100);

    // Wait for default 200ms + buffer
    await new Promise(resolve => setTimeout(resolve, 300));
    expect(controller.offset).toBe(100);
    expect(controller.isAnimating).toBe(false);
  });
});

describe('ScrollController - followMode re-enable on scroll to bottom', () => {
  let controller: ScrollController;

  beforeEach(() => {
    controller = new ScrollController();
  });

  afterEach(() => {
    controller.dispose();
  });

  test('followMode re-enables when jumpTo reaches bottom', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(50);
    controller.disableFollowMode();
    expect(controller.followMode).toBe(false);

    // Scroll to bottom
    controller.jumpTo(100);
    expect(controller.followMode).toBe(true);
  });

  test('followMode re-enables when scrollBy reaches bottom', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(50);
    controller.disableFollowMode();
    expect(controller.followMode).toBe(false);

    // Scroll to bottom via scrollBy
    controller.scrollBy(50);
    expect(controller.followMode).toBe(true);
  });

  test('followMode re-enables within 1px tolerance of bottom', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(50);
    controller.disableFollowMode();

    // Jump to within 1px of bottom
    controller.jumpTo(99);
    expect(controller.atBottom).toBe(true);
    expect(controller.followMode).toBe(true);
  });

  test('followMode does NOT re-enable when not at bottom', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(50);
    controller.disableFollowMode();

    controller.jumpTo(60);
    expect(controller.followMode).toBe(false);
  });

  test('followMode stays true if already enabled when scrolling to bottom', () => {
    controller.updateMaxScrollExtent(100);
    // followMode starts true, scroll to bottom
    controller.jumpTo(100);
    expect(controller.followMode).toBe(true);
  });

  test('followMode re-enable works after content growth', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(50);
    controller.disableFollowMode();

    // Content grows
    controller.updateMaxScrollExtent(200);
    expect(controller.offset).toBe(50); // did NOT auto-scroll (followMode off)
    expect(controller.followMode).toBe(false);

    // User scrolls to new bottom
    controller.jumpTo(200);
    expect(controller.followMode).toBe(true);

    // Now content grows again - should auto-scroll
    controller.updateMaxScrollExtent(300);
    expect(controller.offset).toBe(300); // auto-scrolled
  });
});

describe('ScrollController - atBottom', () => {
  let controller: ScrollController;

  beforeEach(() => {
    controller = new ScrollController();
  });

  test('atBottom is true at initial state (0/0)', () => {
    expect(controller.atBottom).toBe(true);
  });

  test('atBottom is true at exact maxScrollExtent', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(100);
    expect(controller.atBottom).toBe(true);
  });

  test('atBottom is true within 1px tolerance', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(99);
    expect(controller.atBottom).toBe(true);
  });

  test('atBottom is false beyond 1px tolerance', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(98);
    expect(controller.atBottom).toBe(false);
  });

  test('atBottom is false when well above bottom', () => {
    controller.updateMaxScrollExtent(100);
    controller.jumpTo(0);
    controller.disableFollowMode(); // prevent auto-scroll
    expect(controller.atBottom).toBe(false);
  });

  test('atBottom updates when maxScrollExtent changes', () => {
    controller.updateMaxScrollExtent(50);
    // followMode auto-scrolls to 50
    expect(controller.atBottom).toBe(true);

    controller.disableFollowMode();
    controller.updateMaxScrollExtent(100);
    // offset still 50, max now 100
    expect(controller.atBottom).toBe(false);
  });
});

describe('ScrollController - isAnimating', () => {
  let controller: ScrollController;

  beforeEach(() => {
    controller = new ScrollController();
    controller.updateMaxScrollExtent(200);
    controller.disableFollowMode();
    controller.jumpTo(0);
  });

  afterEach(() => {
    controller.dispose();
  });

  test('isAnimating is false initially', () => {
    expect(controller.isAnimating).toBe(false);
  });

  test('isAnimating is true during animation', () => {
    controller.animateTo(100, 200);
    expect(controller.isAnimating).toBe(true);
  });

  test('isAnimating is false after animation completes', async () => {
    controller.animateTo(100, 50);
    await new Promise(resolve => setTimeout(resolve, 120));
    expect(controller.isAnimating).toBe(false);
  });

  test('isAnimating is false after dispose', () => {
    controller.animateTo(100, 500);
    controller.dispose();
    expect(controller.isAnimating).toBe(false);
  });
});

// ============================================================================
// ScrollController - viewportSize
// ============================================================================

describe('ScrollController - viewportSize', () => {
  let controller: ScrollController;

  beforeEach(() => {
    controller = new ScrollController();
  });

  afterEach(() => {
    controller.dispose();
  });

  test('viewportSize defaults to 0', () => {
    expect(controller.viewportSize).toBe(0);
  });

  test('updateViewportSize stores the value', () => {
    controller.updateViewportSize(25);
    expect(controller.viewportSize).toBe(25);
  });

  test('updateViewportSize can be called multiple times', () => {
    controller.updateViewportSize(10);
    expect(controller.viewportSize).toBe(10);

    controller.updateViewportSize(30);
    expect(controller.viewportSize).toBe(30);
  });

  test('updateViewportSize accepts 0', () => {
    controller.updateViewportSize(50);
    controller.updateViewportSize(0);
    expect(controller.viewportSize).toBe(0);
  });

  test('viewportSize is independent of scroll offset', () => {
    controller.updateMaxScrollExtent(100);
    controller.updateViewportSize(20);
    controller.jumpTo(50);
    expect(controller.viewportSize).toBe(20);
    expect(controller.offset).toBe(50);
  });
});
