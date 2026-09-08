export type NodeType = 'concept' | 'step' | 'bridge' | 'goal' | 'axiom' | 'operation' | 'rule' | 'formula' | 'example' | 'exercise';

export type BranchType =
  | 'main'
  | 'factoring'
  | 'discriminant'
  | 'graphical'
  | 'prerequisite'
  | 'pythagoras'
  | 'physics'
  | 'geometric'
  | (string & {});

export type WhyDepthLevel = 'novice' | 'school' | 'university' | 'programmer';

export type PresentationMode = 'symbolic' | 'balance' | 'story' | 'code' | 'geometry';

export type RelationType =
  | 'Requires'
  | 'Uses'
  | 'DerivedFrom'
  | 'EquivalentTo'
  | 'Generalizes'
  | 'ExampleOf'
  | 'AlternativeMethod'
  | 'Visualizes';

export type AppViewMode = 'canvas' | 'step_solver' | 'ast_engine' | 'my_knowledge';

export type SemanticZoomLevel = 'macro' | 'domain' | 'concept' | 'detailed';

export interface PracticeExercise {
  question: string;
  expectedAnswer: string;
  hint?: string;
  options?: string[];
}

export interface NodeMastery {
  nodeId: string;
  score: number; // 0.00 to 1.00
  attempts: number;
  correct: number;
  incorrect: number;
  lastTested?: number;
}

export interface PresentationDescriptions {
  symbolic?: string;
  balance?: string;
  story?: string;
  code?: string;
  geometry?: string;
}

export interface RealWorldAnalogy {
  title: string;
  metaphor: string;
  story: string;
  example: string;
}

export interface CognitiveTrap {
  myth: string;
  whyBrainFails: string;
  truth: string;
  counterExample: string;
}

export interface WhatIfConfig {
  title: string;
  paramName: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  goalValue?: number;
  explanationBalanced?: string;
  explanationUnbalanced?: string;
}

export interface MathNode {
  id: string;
  title: string;
  formula: string;
  subtitle?: string;
  layer: number; // 0: Roots/Foundation, 1: Elementary Laws, 2: Intermediate, 3: Solution Steps, 4: Goal
  type: NodeType;
  branch?: BranchType;
  x: number;
  y: number;
  requires: string[]; // List of node IDs that must be understood first
  explanationHuman: string;
  formalRule: string;
  visualSteps: string[];
  whyCanIDoThis: string;
  deeperQuestion?: string;
  realWorldAnalogy?: RealWorldAnalogy;
  cognitiveTrap?: CognitiveTrap;
  whatIfConfig?: WhatIfConfig;
  depthExplanations?: {
    novice?: string;
    school?: string;
    university?: string;
    programmer?: string;
  };
  presentations?: PresentationDescriptions;
  practiceExercise?: PracticeExercise;
  isCollapsed?: boolean;
}

export interface SolutionBranch {
  id: BranchType;
  label: string;
  description: string;
  formula: string;
  color: string;
}

export interface MathTree {
  id: string;
  title: string;
  goalFormula: string;
  category: string;
  description: string;
  branches?: SolutionBranch[];
  nodes: MathNode[];
}

export interface StuckDiagnosis {
  gapConcept: string;
  rootCauseAnalysis: string;
  pathFromRoot: string[];
  recommendedAction: string;
  targetNodeId: string;
}

export interface MacroCategory {
  id: string;
  title: string;
  iconName: string;
  items: string[];
  defaultTreeId: string;
}

export interface ASTNode {
  type: 'Equality' | 'Add' | 'Subtract' | 'Multiply' | 'Divide' | 'Variable' | 'Number' | 'Power' | 'Paren';
  value?: string | number;
  left?: ASTNode;
  right?: ASTNode;
  children?: ASTNode[];
  description?: string;
}

