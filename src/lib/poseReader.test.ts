/**
 * PR 3: Pose Reader API Tests
 * 
 * Manual test cases to verify pose blending works correctly.
 * Run these tests in the browser console when in Workspace mode.
 */

import { applyPose, applyPoseByName, transitionBetweenPoses, poseExists } from '../lib/poseReader';
import { savePose, getPose } from '../lib/poseStore';
import { WorkspaceObject, PoseSnapshot } from '../types';

/**
 * Test 1: Basic pose application at full blend (1.0)
 */
export function testFullPoseApplication() {
  console.log("🧪 Test 1: Full Pose Application");
  
  // Create test objects
  const objects: WorkspaceObject[] = [
    {
      id: "test-obj-1",
      type: "sphere",
      name: "Test Sphere",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: "#ff0000",
      wireframe: true,
      visible: true,
      opacity: 1.0
    }
  ];
  
  // Create test pose
  const pose: PoseSnapshot = {
    id: "test-pose-1",
    name: "test-position",
    timestamp: new Date().toISOString(),
    objects: [{
      objectId: "test-obj-1",
      position: [5, 10, 15],
      rotation: [45, 90, 180],
      scale: [2, 2, 2],
      visible: true,
      material: "basic",
      color: "#ff0000",
      opacity: 1.0
    }]
  };
  
  // Apply pose at full blend
  const count = applyPose(pose, 1.0, objects);
  
  // Verify
  const obj = objects[0];
  const success = (
    obj.position.x === 5 &&
    obj.position.y === 10 &&
    obj.position.z === 15 &&
    obj.rotation.x === 45 &&
    obj.scale.x === 2
  );
  
  console.log(`✅ Objects updated: ${count}`);
  console.log(`${success ? "✅" : "❌"} Position/rotation/scale applied correctly`);
  console.log(`Final position:`, obj.position);
  
  return success;
}

/**
 * Test 2: Partial blend (0.5) should interpolate
 */
export function testPartialBlend() {
  console.log("\n🧪 Test 2: Partial Blend (50%)");
  
  const objects: WorkspaceObject[] = [
    {
      id: "test-obj-2",
      type: "box",
      name: "Test Box",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: "#00ff00",
      wireframe: true,
      visible: true,
      opacity: 1.0
    }
  ];
  
  const pose: PoseSnapshot = {
    id: "test-pose-2",
    name: "test-blend",
    timestamp: new Date().toISOString(),
    objects: [{
      objectId: "test-obj-2",
      position: [10, 20, 30],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      material: "basic",
      color: "#00ff00",
      opacity: 1.0
    }]
  };
  
  // Apply at 50% blend
  applyPose(pose, 0.5, objects);
  
  const obj = objects[0];
  const success = (
    obj.position.x === 5 &&  // 0 + (10-0) * 0.5
    obj.position.y === 10 && // 0 + (20-0) * 0.5
    obj.position.z === 15    // 0 + (30-0) * 0.5
  );
  
  console.log(`${success ? "✅" : "❌"} 50% interpolation correct`);
  console.log(`Position should be (5, 10, 15):`, obj.position);
  
  return success;
}

/**
 * Test 3: Missing pose should return -1
 */
export function testMissingPose() {
  console.log("\n🧪 Test 3: Missing Pose Handling");
  
  const objects: WorkspaceObject[] = [];
  const count = applyPoseByName("non-existent-pose", 1.0, objects);
  
  const success = count === -1;
  console.log(`${success ? "✅" : "❌"} Missing pose returns -1`);
  
  return success;
}

/**
 * Test 4: Pose exists check
 */
export function testPoseExists() {
  console.log("\n🧪 Test 4: Pose Exists Check");
  
  // Save a test pose
  const pose: PoseSnapshot = {
    id: "test-exists",
    name: "test-exists",
    timestamp: new Date().toISOString(),
    objects: []
  };
  
  savePose("test-exists", pose);
  
  const exists = poseExists("test-exists");
  const notExists = poseExists("definitely-not-a-pose");
  
  const success = exists && !notExists;
  console.log(`${success ? "✅" : "❌"} Pose existence check works`);
  console.log(`test-exists: ${exists}, non-existent: ${notExists}`);
  
  return success;
}

/**
 * Test 5: Blend clamping (values outside 0-1)
 */
export function testBlendClamping() {
  console.log("\n🧪 Test 5: Blend Clamping");
  
  const objects: WorkspaceObject[] = [
    {
      id: "test-clamp",
      type: "sphere",
      name: "Test Clamp",
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: "#0000ff",
      wireframe: true,
      visible: true,
      opacity: 1.0
    }
  ];
  
  const pose: PoseSnapshot = {
    id: "test-clamp-pose",
    name: "clamp-test",
    timestamp: new Date().toISOString(),
    objects: [{
      objectId: "test-clamp",
      position: [10, 10, 10],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      material: "basic",
      color: "#0000ff",
      opacity: 1.0
    }]
  };
  
  // Test with value > 1 (should clamp to 1)
  applyPose(pose, 1.5, objects);
  const overClamp = objects[0].position.x === 10; // Should be full value
  
  // Reset
  objects[0].position.x = 0;
  
  // Test with value < 0 (should clamp to 0)
  applyPose(pose, -0.5, objects);
  const underClamp = objects[0].position.x === 0; // Should be original
  
  const success = overClamp && underClamp;
  console.log(`${success ? "✅" : "❌"} Blend clamping works`);
  console.log(`Over-blend clamped: ${overClamp}, Under-blend clamped: ${underClamp}`);
  
  return success;
}

/**
 * Run all tests
 */
export function runAllPoseReaderTests() {
  console.log("🚀 Running Pose Reader API Tests\n");
  console.log("=" .repeat(50));
  
  const results = [
    testFullPoseApplication(),
    testPartialBlend(),
    testMissingPose(),
    testPoseExists(),
    testBlendClamping()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("✅ All tests passed!");
  } else {
    console.log("❌ Some tests failed");
  }
  
  return passed === total;
}

// Export for console use
if (typeof window !== 'undefined') {
  (window as any).poseReaderTests = {
    runAll: runAllPoseReaderTests,
    test1: testFullPoseApplication,
    test2: testPartialBlend,
    test3: testMissingPose,
    test4: testPoseExists,
    test5: testBlendClamping
  };
  
  console.log("💡 Pose Reader tests available:");
  console.log("  window.poseReaderTests.runAll() - Run all tests");
  console.log("  window.poseReaderTests.test1()  - Test full pose application");
  console.log("  window.poseReaderTests.test2()  - Test partial blend");
}
