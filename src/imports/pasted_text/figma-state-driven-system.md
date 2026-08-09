Perfect — this is exactly the right moment to **upgrade your Figma from “UI screens” → “Product system”**.

Below is a **highly detailed Figma Make prompt** specifically to **transform your existing design into a state-driven system UI** (not redesign from scratch, but enhance what you already built).

---

# 🎯 Figma Make Prompt

## “Convert Existing UI into State-Driven Product UI”

---

### Prompt Title

**Enhance Geojit Communication Engine UI to a State-Driven System Design**

---

### Prompt

Take the existing **Geojit Communication Engine / Email Studio UI** and enhance it into a **state-driven product design system**, where all screens are visually connected through a **single communication object (source of truth)**.

Do NOT redesign from scratch.
This is an **enhancement layer** to make the UI reflect real application behavior.

The goal is to transform the design from:

👉 Screen-based UI
to
👉 State-driven system UI

---

# 🧠 Core Concept to Implement

Introduce a visible system layer where:

> Every screen is interacting with a single “Communication Object”

The UI must clearly communicate:

* what data is being edited
* what stage the communication is in
* how the user progresses through the flow
* what the system is currently holding

---

# 🧱 1. Add Global “Communication State Bar” (VERY IMPORTANT)

Add a **persistent top state bar** across ALL main screens:

Screens:

* Category Selection
* Smart Input Form
* Generating
* Variant Selection
* Preview
* Approval

---

## State Bar Design

Place this **below the main navigation bar**

### Layout

Horizontal bar with subtle background (light grey / light green tint)

### Sections (left to right)

#### 1. Communication Title

* Label: “Communication”
* Value: dynamic text (e.g., “Q4 Research Mailer”)
* Editable icon (pencil)

---

#### 2. Category Tag

* Label: “Category”
* Value: tag (e.g., Research & Advisory)
* Use colored pill style based on category

---

#### 3. Status Badge

* Label: “Status”
* Values:

  * Draft
  * Input Complete
  * Generating
  * Variants Ready
  * Selected
  * Preview Ready
  * Submitted

Use:

* grey → draft
* blue → generating
* green → ready
* amber → pending
* strong green → final

---

#### 4. Step Progress

* Label: “Step”
* Format: Step X of 5
* Add visual progress bar

Steps:

1. Category
2. Input
3. Generate
4. Select
5. Preview

---

#### 5. Optional Right Section

* small actions:

  * Save Draft
  * Reset

---

## Visual Style

* height: ~56px
* subtle divider line
* compact but clear
* strong typography hierarchy

---

# 🧭 2. Add Progress Step Indicator (Secondary Layer)

On all creation screens, add a **visual stepper**

### Placement

Below state bar

### Style

Horizontal stepper:

```text
Category → Input → Generate → Select → Preview
```

### Behavior

* active step highlighted in green
* completed steps ticked
* future steps muted

---

# 🧩 3. Add “Data Mapping Notes” (Developer Layer in Figma)

Create a **new Figma page called:**

👉 `State Mapping`

---

### For each screen, add a structured annotation block

---

## Example: Category Selection

Create a small annotation card:

```text
SCREEN: Category Selection

Reads:
- communication.classification.category

Writes:
- communication.classification.category
- communication.currentStep
```

---

## Example: Smart Input Form

```text
SCREEN: Smart Input Form

Reads:
- communication.classification.category
- communication.input
- communication.dynamicFields

Writes:
- communication.input.*
- communication.dynamicFields.*
- communication.status
```

---

## Example: Variant Selection

```text
SCREEN: Variant Selection

Reads:
- communication.variants

Writes:
- communication.selectedVariantId
- communication.status
```

---

## Example: Preview

```text
SCREEN: Preview

Reads:
- communication.selectedVariant
- communication.classification

Writes:
- communication.renderedOutput
```

---

👉 These should be visually styled as:

* light background cards
* small font
* clearly labeled “System Mapping”

---

# 🧱 4. Create a “Data Model” Page in Figma

Create a new page:

👉 `Data Model`

---

## Create a visual diagram:

### Title:

**Communication Object (Single Source of Truth)**

---

## Layout as a structured tree:

```
Communication
├── Classification
│   ├── Category
│   ├── Subcategory
│   ├── Intent
│   └── Sensitivity
│
├── Input
│   ├── Title
│   ├── Audience
│   ├── Objective
│   ├── Topic
│   ├── Key Message
│   ├── Supporting Points
│   ├── CTA
│   └── Raw Content
│
├── Dynamic Fields
│   ├── Research
│   ├── Product
│   └── Regulatory
│
├── Variants
│   ├── Variant A
│   ├── Variant B
│   └── Variant C
│
├── Selected Variant
│
├── Rendered Output
│   ├── HTML
│   └── Preview
│
└── Approval
```

---

## Visual style

* card-based nodes
* connectors
* subtle colors
* category grouping

---

# 🎯 5. Update Each Screen UI

---

## Category Selection Screen

Add:

* State Bar (top)
* Stepper
* Selected category indicator

Enhancement:

* show “Selected Category” below cards

---

## Smart Input Form

Add:

* State Bar
* Stepper

Add new UX element:

👉 Section label:
**“This information builds your communication”**

Add bottom note:

```text
On Generate:
→ Your input becomes structured communication data
→ AI will generate 3 variants
```

---

## Generating Screen

Enhance loading to reflect state:

Replace generic loader with:

```text
Reading your input
Structuring communication
Applying Geojit tone
Generating variants
```

Add note:

```text
Updating communication.variants
```

---

## Variant Selection Screen

Add:

* State Bar
* Stepper

Enhance header:

```text
Select a Version
Stored as: communication.selectedVariant
```

Add selected badge on card:

* “Selected”

---

## Preview Screen

Add:

* State Bar
* Stepper

Enhance right panel:

Add metadata card:

* Category
* Objective
* Sensitivity
* Template Type
* Variant Type

Add label:

```text
Source: communication.selectedVariant
```

---

# 🏷️ 6. Add System Status Tags Across UI

Create reusable component:

### StatusBadge

States:

* Draft
* Generating
* Ready
* Selected
* Submitted

Use across:

* dashboard
* state bar
* preview
* variant cards

---

# 🎨 7. Component Additions

Add to component library:

* StateBar
* Stepper
* StatusBadge
* DataNoteCard (for mapping notes)
* MetadataCard
* SectionLabel (with system context)

---

# ⚡ 8. UX Philosophy to Enforce

Ensure the UI now communicates:

* “You are building one communication”
* “System is structuring it”
* “AI is enhancing it”
* “You are selecting, not designing”

---

# 🔥 Final Instruction to Figma

Enhance the existing design by:

* adding system-level UI (state bar, stepper)
* introducing data awareness into screens
* mapping UI to underlying data structure
* improving clarity of flow and ownership
* making it developer-ready

Do NOT:

* redesign layout completely
* change brand style
* add complexity

Focus on:
👉 clarity
👉 system thinking
👉 state visibility
👉 developer readiness

---

# ✅ Output Expectation

* Updated screens with state awareness
* New pages:

  * Data Model
  * State Mapping
* Updated component library
* Strong UX clarity across flow

---

# 🚀 After this

Once you update Figma with this:

I can help you:

* map **each Figma screen → exact React component**
* generate **Context + Reducer code**
* wire it directly into your current app

---

This step is what separates a **design demo** from a **real product system** 👍
