// HitTest -- Mouse event hit-testing on the render tree
// Amp ref: input-system.md Section 6.3, Section 9.2 (mouse dispatched by position)
//
// Hit-testing walks the render tree from root, checking if the point is within
// each node's bounds (offset + size). Builds a path from deepest hit to root.

import { RenderObject, RenderBox, ContainerRenderBox } from '../framework/render-object';

/**
 * A single entry in a hit test result path.
 * Contains the render object and the point in that object's local coordinate space.
 */
export interface HitTestEntry {
  renderObject: RenderObject;
  localX: number;
  localY: number;
}

/**
 * Result of a hit test at a screen position.
 * `path` is ordered from deepest (most specific) to shallowest (root).
 */
export interface HitTestResult {
  path: HitTestEntry[];
}

/**
 * Perform hit-test at a screen position against the render tree.
 *
 * Walks the tree from root, accumulating offsets to convert screen coordinates
 * to each node's local coordinate space. Returns a path from deepest hit to root.
 *
 * @param root - The root render object to start hit-testing from
 * @param x - Screen column (0-based)
 * @param y - Screen row (0-based)
 * @returns HitTestResult with path from deepest to shallowest
 */
export function hitTest(root: RenderObject, x: number, y: number): HitTestResult {
  const path: HitTestEntry[] = [];
  _hitTestNode(root, x, y, 0, 0, path);
  return { path };
}

/**
 * Recursive hit-test on a single node.
 * Accumulates parent offsets to compute the node's screen-space bounds.
 */
function _hitTestNode(
  node: RenderObject,
  screenX: number,
  screenY: number,
  parentOffsetX: number,
  parentOffsetY: number,
  path: HitTestEntry[],
): boolean {
  // Only RenderBox has offset/size for bounds checking
  if (!(node instanceof RenderBox)) {
    // For non-RenderBox nodes, just recurse into children
    let childHit = false;
    node.visitChildren((child) => {
      if (_hitTestNode(child, screenX, screenY, parentOffsetX, parentOffsetY, path)) {
        childHit = true;
      }
    });
    if (childHit) {
      path.push({ renderObject: node, localX: screenX, localY: screenY });
    }
    return childHit;
  }

  // Compute this node's screen-space position
  const nodeScreenX = parentOffsetX + node.offset.col;
  const nodeScreenY = parentOffsetY + node.offset.row;

  // Check if the point is within this node's bounds
  const localX = screenX - nodeScreenX;
  const localY = screenY - nodeScreenY;

  if (!hitTestSelf(node, localX, localY)) {
    return false;
  }

  // Recurse into children (deepest first)
  // Check children in reverse order so front-most (last painted) children are hit first
  let childHit = false;

  if (node instanceof ContainerRenderBox) {
    const children = node.children;
    for (let i = children.length - 1; i >= 0; i--) {
      if (_hitTestNode(children[i]!, screenX, screenY, nodeScreenX, nodeScreenY, path)) {
        childHit = true;
        break; // Only take the first (front-most) child hit
      }
    }
  } else {
    // Single-child or leaf RenderBox -- visit children generically
    node.visitChildren((child) => {
      if (!childHit && _hitTestNode(child, screenX, screenY, nodeScreenX, nodeScreenY, path)) {
        childHit = true;
      }
    });
  }

  // Add this node to the path (deepest entries are already added by recursion)
  path.push({ renderObject: node, localX, localY });
  return true;
}

/**
 * Check if a point is within a RenderBox's bounds.
 * The point must be in the render object's local coordinate space.
 *
 * @param renderObject - The RenderBox to test
 * @param localX - X coordinate in local space
 * @param localY - Y coordinate in local space
 * @returns true if the point is within the object's size bounds
 */
export function hitTestSelf(renderObject: RenderBox, localX: number, localY: number): boolean {
  const size = renderObject.size;
  return localX >= 0 && localX < size.width && localY >= 0 && localY < size.height;
}
