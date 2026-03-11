# Architecture Diagram: ScruPeak Spatial Intelligence Agent

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   ScruPeak Spatial Intelligence Agent                  │
│                                                                           │
│                    ┌──────────────────────────────┐                      │
│                    │   SpatialIntelligenceAgent   │                      │
│                    │      (Orchestrator)          │                      │
│                    └──────────┬───────────────────┘                      │
│                               │                                          │
│           ┌───────────────────┼───────────────────┐                     │
│           │                   │                   │                     │
│           ▼                   ▼                   ▼                     │
│    ┌────────────┐     ┌────────────┐     ┌────────────┐                 │
│    │  Registry  │     │  Detector  │     │   Engine   │                 │
│    │            │     │            │     │            │                 │
│    │ • CSI      │     │ • Overlap  │     │ • Classify │                 │
│    │   Store    │     │   Analysis │     │   Events   │                 │
│    │ • Lineage  │     │ • Conflict │     │ • Decision │                 │
│    │   Tracking │     │   Detection│     │   Output   │                 │
│    └────┬───────┘     └────┬───────┘     └────┬───────┘                 │
│         │                  │                  │                         │
│         └──────────────────┴──────────────────┘                         │
│                            │                                            │
│                            ▼                                            │
│                ┌─────────────────────────────┐                          │
│                │   CSI Model & Data Structures│                          │
│                │                             │                          │
│                │ • CompositeSpatialIdentity  │                          │
│                │ • GridReference             │                          │
│                │ • LineageLink               │                          │
│                │ • HistoryEvent              │                          │
│                │ • ParcelEvent               │                          │
│                └──────────────┬──────────────┘                          │
│                               │                                        │
│         ┌─────────────────────┴────────────────────┐                   │
│         │                                          │                   │
│         ▼                                          ▼                   │
│    ┌─────────────┐                         ┌──────────────┐            │
│    │ Grid System │                         │ Projection   │            │
│    │             │                         │              │            │
│    │ • Reference │                         │ • WGS84 →    │            │
│    │   Grid      │                         │   UTM Zone 28│            │
│    │ • Parcel    │                         │   (West Africa)          │
│    │   Code Gen  │                         │              │            │
│    └─────────────┘                         └──────────────┘            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        CSI Lifecycle & Events                            │
│                                                                           │
│   PARCEL_CREATED                                                         │
│        │                                                                 │
│        ├── register_parcel(geometry, owner) → CSI(code, grid, history)  │
│        │                                                                 │
│        ▼                                                                 │
│   PARCEL_VERIFIED (optional)                                            │
│        │                                                                 │
│        ├── verify_parcel_oarg(code) → status="verified", oarg_approval  │
│        │                                                                 │
│        ├─── PARCEL_SUBDIVISION ───────────────────┐                    │
│        │     (parent stays, children born)        │                    │
│        │                                          ▼                    │
│        │     create_subdivision(parent, children) → [child CSIs]       │
│        │     • Parent geometry: UNCHANGED                              │
│        │     • Parent.children: updated                                │
│        │     • Each child: new code, lineage link                      │
│        │                                          │                    │
│        └──────────────────────────────────────────┘                    │
│        │                                                                 │
│        ├─── CONFLICT_DETECTED ─────────────────┐                       │
│        │    (spatial event triggers decision)  │                       │
│        │                                       ▼                       │
│        │    detect_and_classify_conflicts()   SpatialDecision:         │
│        │    • Overlap detection               • Classification        │
│        │    • Lineage validation              • Explanation           │
│        │    • Fraud checks                    • Technical Just.       │
│        │                                       │                       │
│        └───────────────────────────────────────┘                       │
│        │                                                                 │
│        ├─── OARG_REVIEW_REQUESTED ──────────────────────┐              │
│        │                                                  │              │
│        ├─── FRAUD_FLAG ──────────────────────────┐       │              │
│        │                                         │       │              │
│        ▼                                         ▼       ▼              │
│   OARG_APPROVAL or DISPUTE                                             │
│                                                                        │
│   (All events append-only; history never overwrites)                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    Decision Classification Rules                         │
│                                                                           │
│  Spatial Relationship          │ Classification              │ Action   │
│  ─────────────────────────────┼────────────────────────────┼──────────│
│  Identical Geometry            │ CONFLICTING_CLAIM          │ REVIEW   │
│  ─────────────────────────────┼────────────────────────────┼──────────│
│  Partial Overlap (Ambiguous)   │ REQUIRES_MANUAL_REVIEW     │ ESCALATE │
│  ─────────────────────────────┼────────────────────────────┼──────────│
│  Contained (with Lineage)      │ LEGITIMATE_SUBDIVISION     │ APPROVE  │
│  ─────────────────────────────┼────────────────────────────┼──────────│
│  Contained (no Lineage)        │ FRAUD_RISK                 │ FLAG     │
│  ─────────────────────────────┼────────────────────────────┼──────────│
│  Contains (Valid Parent)       │ LEGITIMATE_SUBDIVISION     │ APPROVE  │
│  ─────────────────────────────┼────────────────────────────┼──────────│
│  Disjoint (No Overlap)         │ NO CONFLICT                │ OK       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                   Three-Section Decision Output                          │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 1. CLASSIFICATION                                              │    │
│  │    Single, unambiguous category from allowed list             │    │
│  │    (e.g., "legitimate_subdivision")                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 2. DECISION EXPLANATION                                        │    │
│  │    Plain English suitable for:                                │    │
│  │    • OARG officers • Landowners • Judges                      │    │
│  │                                                                │    │
│  │    No technical jargon unless necessary                       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │ 3. TECHNICAL JUSTIFICATION                                     │    │
│  │    Concise reasoning based on:                                │    │
│  │    • Spatial tests (overlap, containment, area)              │    │
│  │    • Grid reference rule (first vertex placement)            │    │
│  │    • Parcel lineage (parent-child genealogy)                 │    │
│  │    • OARG compliance (no property law violations)            │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    Parcel Code Determinism                              │
│                                                                           │
│  Parcel Code Format: SL-{GRID_ID:03d}-{GRID_X:02d}-{GRID_Y:02d}-{SEQ} │
│                                                                           │
│  Example: SL-001-00-02-0001                                            │
│           └──┬──┘ └──┬──┘ └──┬──┘ └────┬────┘                          │
│           Grid ID  Grid X Grid Y  Sequence                              │
│                                                                           │
│  Grid ID = Grid Y × TOTAL_GRIDS_EAST + Grid X                         │
│  (Deterministic from first vertex lat/lon)                             │
│                                                                           │
│  Sequence = Counter per grid cell (1-based, increments per parcel)    │
│                                                                           │
│  Rule: First vertex of polygon determines reference grid               │
│  → Parcel code NEVER changes (immutable)                               │
│  → No human assignment, no duplicates                                  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                    Regulatory Authority (OARG)                          │
│                                                                           │
│  ✓ OARG remains sovereign                                              │
│  ✓ Ambiguity escalates to manual review (never auto-approve)           │
│  ✓ Fraud indicators flagged for investigation                          │
│  ✓ Conflicting claims resolved by OARG officer                         │
│  ✓ Verification decisions recorded in history                          │
│  ✓ No override possible; all actions logged                            │
│                                                                        │
│  Principle: "ScruPeak does not record land —                         │
│              it mathematically proves it."                             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
