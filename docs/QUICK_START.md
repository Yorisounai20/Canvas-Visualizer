# 🚀 Quick Start Guide: Creating Your First Preset

This is a 5-minute guide to creating your first custom preset using the Workspace → Preset Authoring Bridge.

---

## ⚡ Super Quick Summary

1. Press **W** → Add objects → Arrange them
2. Click **Enable Authoring** → Select preset → Adjust sliders
3. Click **Export Preset** → Name it → Done! ✅

**Time:** 5 minutes | **Coding:** Zero | **Result:** Custom preset

---

## 📝 Step-by-Step (First Time)

### Step 1: Enter Workspace (30 seconds)

1. Start Canvas Visualizer
2. Press **W** key (or click 🔨 Workspace button at top)
3. You'll see workspace controls on the left

**Result:** You're in creation mode! ✅

---

### Step 2: Add Objects (1 minute)

1. Look for "Add Object" section
2. Click **Sphere** button → A sphere appears in center
3. Click **Box** button → A box appears
4. Click **Sphere** again → Another sphere appears

**Result:** You have 3 objects to work with! ✅

---

### Step 3: Arrange Objects (1 minute)

**Option A: Use Object Properties Panel (right side)**
1. Click on an object in Scene Explorer
2. Adjust Position sliders (X, Y, Z)
3. Move objects to different positions

**Option B: In the future, drag objects in 3D** (not implemented yet)

**Example arrangement:**
- Sphere 1: Position (0, 0, 0) - center
- Box: Position (2, 0, 0) - right
- Sphere 2: Position (-2, 0, 0) - left

**Result:** Objects arranged in a pattern! ✅

---

### Step 4: Preview Animation (1 minute)

1. Find "Preset Authoring Mode" section
2. Click **Enable Authoring** button (it turns purple)
3. In dropdown, select **"Orbital Dance"**
4. Move the **Time slider** left and right
5. Watch your objects orbit around!

**Bonus:** Adjust the audio sliders (Bass/Mids/Highs) to see audio reactivity

**Result:** Live animation preview! ✅

---

### Step 5: Adjust Parameters (1 minute)

When Authoring Mode is on, you'll see **"Preset Parameters"** section:

1. **Speed** slider → Try 2.0 (faster orbit)
2. **Radius** slider → Try 20 (wider orbit)
3. **Audio Reactivity** slider → Try 2.0 (more responsive)

Watch how each change affects the animation instantly!

**Result:** Customized animation behavior! ✅

---

### Step 6: Export Your Preset (30 seconds)

1. Scroll to **"Export as Preset"** section
2. Enter a name: **"My First Preset"**
3. Select solver: **"orbit"** (already selected)
4. Click **Export Preset** button
5. Look for success message!

**Result:** Your first custom preset is saved! ✅ 🎉

---

## 🎯 What You Just Created

**Your Preset:**
- **Name:** "My First Preset"
- **Structure:** 3 objects (2 spheres, 1 box)
- **Animation:** Orbital motion
- **Parameters:** Speed=2.0, Radius=20, Reactivity=2.0

**What it does:**
- Objects orbit around center
- Responds to audio (bass/mids/highs)
- Customized speed and size
- Reusable in any project!

---

## 🎨 Try These Next

### Easy Variations (5 min each)

**Spiral Galaxy:**
1. Add 10 spheres
2. Position them in a line
3. Use "Spiral Galaxy" preset
4. Adjust "Turns" parameter
5. Export as "My Galaxy"

**Explosion Effect:**
1. Add 5-8 boxes
2. Group them near center
3. Use "Explosion" preset
4. Adjust "Intensity" parameter
5. Export as "My Explosion"

**Wave Pattern:**
1. Add 8 spheres in a row
2. Space them evenly
3. Use "Wave Motion" preset
4. Adjust "Frequency" parameter
5. Export as "My Wave"

---

## 🔑 Key Controls

### Keyboard Shortcuts
- **W** - Toggle Workspace mode
- **P** - Toggle Performance overlay
- **Esc** - Exit current mode

### UI Locations
- **Workspace Controls** - Left side when in Workspace
- **Object Properties** - Right side when object selected
- **Scene Explorer** - Shows all objects
- **Authoring Mode** - In Workspace controls
- **Export** - Bottom of Workspace controls

---

## 💡 Pro Tips

### 1. Save Poses
After arranging objects:
- Scroll to "Save Pose" section
- Enter name: "My Layout"
- Click Save
- Later, load this exact arrangement!

### 2. Use Groups
When creating objects:
- Select object in Scene Explorer
- In Object Properties, enter Group: "wings"
- Solvers can target this group

### 3. Preview Before Export
Always test with:
- Different time values (slider)
- Different audio values (bass/mids/highs)
- Different parameters
- Make sure it looks good!

### 4. Start Simple
First preset:
- Use 3-5 objects
- Try existing solvers
- Don't customize too much
- Get comfortable with workflow

Then gradually:
- Add more objects
- Try different arrangements
- Experiment with parameters
- Create complex presets

---

## 🐛 Troubleshooting

### "I don't see Workspace controls"
→ Press **W** key to enter Workspace mode

### "Objects don't appear when I click Add Object"
→ Check Scene Explorer (left panel) - they're added but might be at (0,0,0)

### "Authoring Mode doesn't show animation"
→ Make sure you have objects in the workspace first

### "Export button doesn't work"
→ Check that you entered a preset name

### "I can't see my exported preset"
→ Exported presets are saved to descriptor store (in memory for now)

---

## 📚 Learn More

### Next Steps:
1. Read full documentation: `docs/SYSTEM_OVERVIEW.md`
2. Try creating 3-4 different presets
3. Experiment with all available solvers
4. Learn about grouping and poses
5. Create complex multi-object presets

### Documentation:
- **System Overview** - Complete explanation
- **PR Descriptions** - Technical details for each system
- **Code Comments** - In-code documentation

---

## ✅ Checklist: Your First Preset

- [ ] Entered Workspace mode (W)
- [ ] Added 2-3 objects
- [ ] Arranged them in space
- [ ] Enabled Authoring Mode
- [ ] Selected a preset/solver
- [ ] Moved time slider (saw animation)
- [ ] Adjusted parameters (saw changes)
- [ ] Entered preset name
- [ ] Clicked Export Preset
- [ ] Saw success message

**All checked?** Congratulations! You're a preset creator! 🎉

---

## 🎓 Skill Progression

### Beginner (You are here!)
✅ Created first preset
- Understand Workspace mode
- Know how to add objects
- Can use Authoring Mode
- Can export presets

### Intermediate (Next level)
- Create presets with 10+ objects
- Use grouping effectively
- Save and reuse poses
- Fine-tune all parameters

### Advanced (Master level)
- Create complex multi-group presets
- Combine multiple poses
- Optimize for performance
- Share with community

---

## 🎯 Challenge: Create 3 Presets

Try creating these three presets to master the workflow:

### Challenge 1: "Simple Orbit"
- 1 sphere (center)
- 3 boxes (around it)
- Use "Orbital Dance"
- Speed: 1.5

### Challenge 2: "Explosion"
- 6 spheres (clustered)
- Use "Explosion"
- Intensity: 3.0
- Spread: 20

### Challenge 3: "Your Creation"
- Your choice of objects
- Your arrangement
- Your preset selection
- Your parameters
- **Be creative!**

**Time limit:** 15 minutes total (5 min each)

---

## 🏆 You Did It!

You now know how to:
- ✅ Create objects in Workspace
- ✅ Arrange them visually
- ✅ Preview with animations
- ✅ Adjust parameters
- ✅ Export as presets

**What's next?**
- Create more presets
- Try complex arrangements
- Experiment with parameters
- Share your creations!

---

**Happy Creating! 🎨✨**

For questions or help, refer to `docs/SYSTEM_OVERVIEW.md` for complete documentation.
