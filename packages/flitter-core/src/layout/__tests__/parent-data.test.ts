// Tests for FlexParentData and PositionedParentData
// Covers: defaults, construction, FlexFit, isPositioned()

import { describe, expect, test } from 'bun:test';
import { FlexParentData, PositionedParentData } from '../parent-data';
import { BoxParentData, ParentData } from '../../framework/render-object';

describe('FlexParentData', () => {
  test('extends BoxParentData and ParentData', () => {
    const pd = new FlexParentData();
    expect(pd).toBeInstanceOf(BoxParentData);
    expect(pd).toBeInstanceOf(ParentData);
  });

  test('defaults: flex=0, fit="tight"', () => {
    const pd = new FlexParentData();
    expect(pd.flex).toBe(0);
    expect(pd.fit).toBe('tight');
  });

  test('constructor with custom flex', () => {
    const pd = new FlexParentData(2);
    expect(pd.flex).toBe(2);
    expect(pd.fit).toBe('tight');
  });

  test('constructor with custom flex and fit', () => {
    const pd = new FlexParentData(3, 'loose');
    expect(pd.flex).toBe(3);
    expect(pd.fit).toBe('loose');
  });

  test('flex and fit are mutable', () => {
    const pd = new FlexParentData();
    pd.flex = 5;
    pd.fit = 'loose';
    expect(pd.flex).toBe(5);
    expect(pd.fit).toBe('loose');
  });

  test('detach() inherited from ParentData is callable', () => {
    const pd = new FlexParentData();
    // Should not throw
    pd.detach();
  });
});

describe('PositionedParentData', () => {
  test('extends BoxParentData and ParentData', () => {
    const pd = new PositionedParentData();
    expect(pd).toBeInstanceOf(BoxParentData);
    expect(pd).toBeInstanceOf(ParentData);
  });

  test('all positional properties default to undefined', () => {
    const pd = new PositionedParentData();
    expect(pd.left).toBeUndefined();
    expect(pd.top).toBeUndefined();
    expect(pd.right).toBeUndefined();
    expect(pd.bottom).toBeUndefined();
    expect(pd.width).toBeUndefined();
    expect(pd.height).toBeUndefined();
  });

  test('isPositioned() returns false when no properties set', () => {
    const pd = new PositionedParentData();
    expect(pd.isPositioned()).toBe(false);
  });

  test('isPositioned() returns true when left is set', () => {
    const pd = new PositionedParentData();
    pd.left = 10;
    expect(pd.isPositioned()).toBe(true);
  });

  test('isPositioned() returns true when top is set', () => {
    const pd = new PositionedParentData();
    pd.top = 5;
    expect(pd.isPositioned()).toBe(true);
  });

  test('isPositioned() returns true when right is set', () => {
    const pd = new PositionedParentData();
    pd.right = 0;
    expect(pd.isPositioned()).toBe(true);
  });

  test('isPositioned() returns true when bottom is set', () => {
    const pd = new PositionedParentData();
    pd.bottom = 0;
    expect(pd.isPositioned()).toBe(true);
  });

  test('isPositioned() returns true when width is set', () => {
    const pd = new PositionedParentData();
    pd.width = 100;
    expect(pd.isPositioned()).toBe(true);
  });

  test('isPositioned() returns true when height is set', () => {
    const pd = new PositionedParentData();
    pd.height = 50;
    expect(pd.isPositioned()).toBe(true);
  });

  test('isPositioned() returns true when multiple properties set', () => {
    const pd = new PositionedParentData();
    pd.left = 10;
    pd.top = 20;
    pd.width = 100;
    pd.height = 50;
    expect(pd.isPositioned()).toBe(true);
  });

  test('detach() inherited from ParentData is callable', () => {
    const pd = new PositionedParentData();
    pd.detach();
  });
});
