#!/usr/bin/env npx ts-node
/**
 * Skill Activation Hook (UserPromptSubmit)
 *
 * Analyzes user prompts and file context to automatically suggest
 * or activate relevant skills based on skill-rules.json configuration.
 *
 * Stack: Node.js, React, Next.js, TypeScript, MUI, Vercel, Supabase
 */

import * as fs from 'fs';
import * as path from 'path';

interface SkillRule {
  description: string;
  triggers: {
    prompt: string[];
    files: string[];
  };
  enforcement: 'auto' | 'suggest' | 'manual';
  priority: number;
}

interface SkillRules {
  skills: Record<string, SkillRule>;
  globalSettings: {
    maxSkillsPerPrompt: number;
    defaultEnforcement: string;
    showSkillSuggestions: boolean;
    logActivations: boolean;
  };
}

interface HookInput {
  prompt: string;
  files?: string[];
  context?: {
    recentFiles?: string[];
    currentDirectory?: string;
  };
}

// Read skill rules configuration
function loadSkillRules(): SkillRules {
  const rulesPath = path.join(__dirname, '../skills/skill-rules.json');
  try {
    const content = fs.readFileSync(rulesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load skill-rules.json:', error);
    process.exit(1);
  }
}

// Check if prompt matches skill triggers
function matchesPromptTriggers(prompt: string, triggers: string[]): boolean {
  const normalizedPrompt = prompt.toLowerCase();
  return triggers.some(trigger => normalizedPrompt.includes(trigger.toLowerCase()));
}

// Check if files match skill file patterns (simplified glob matching)
function matchesFileTriggers(files: string[], patterns: string[]): boolean {
  return files.some(file => {
    return patterns.some(pattern => {
      // Simple pattern matching (supports ** and *)
      const regex = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
      return new RegExp(regex).test(file);
    });
  });
}

// Analyze prompt and context to determine relevant skills
function analyzeAndSuggestSkills(input: HookInput): string[] {
  const rules = loadSkillRules();
  const matchedSkills: Array<{ name: string; priority: number; enforcement: string }> = [];

  const contextFiles = [
    ...(input.files || []),
    ...(input.context?.recentFiles || [])
  ];

  for (const [skillName, skillRule] of Object.entries(rules.skills)) {
    let shouldActivate = false;

    // Check prompt triggers
    if (matchesPromptTriggers(input.prompt, skillRule.triggers.prompt)) {
      shouldActivate = true;
    }

    // Check file triggers
    if (contextFiles.length > 0 && matchesFileTriggers(contextFiles, skillRule.triggers.files)) {
      shouldActivate = true;
    }

    if (shouldActivate) {
      matchedSkills.push({
        name: skillName,
        priority: skillRule.priority,
        enforcement: skillRule.enforcement
      });
    }
  }

  // Sort by priority (lower = higher priority) and limit
  matchedSkills.sort((a, b) => a.priority - b.priority);
  const limitedSkills = matchedSkills.slice(0, rules.globalSettings.maxSkillsPerPrompt);

  return limitedSkills.map(s => s.name);
}

// Generate skill activation message
function generateActivationMessage(skills: string[], rules: SkillRules): string {
  if (skills.length === 0) {
    return '';
  }

  const lines: string[] = ['[Skill Activation Analysis]'];

  for (const skillName of skills) {
    const skill = rules.skills[skillName];
    const enforcement = skill?.enforcement || 'suggest';

    if (enforcement === 'auto') {
      lines.push(`✓ Auto-activating: /${skillName} - ${skill.description}`);
    } else if (enforcement === 'suggest') {
      lines.push(`→ Suggested: /${skillName} - ${skill.description}`);
    }
  }

  if (rules.globalSettings.showSkillSuggestions) {
    lines.push('');
    lines.push('Use /skill-name to activate manually.');
  }

  return lines.join('\n');
}

// Main execution
async function main() {
  // Read input from stdin (Claude Code hook protocol)
  let inputData = '';

  process.stdin.setEncoding('utf-8');

  for await (const chunk of process.stdin) {
    inputData += chunk;
  }

  try {
    const input: HookInput = JSON.parse(inputData);
    const rules = loadSkillRules();
    const suggestedSkills = analyzeAndSuggestSkills(input);

    if (suggestedSkills.length > 0) {
      const message = generateActivationMessage(suggestedSkills, rules);

      // Output suggestion to Claude Code
      const output = {
        suggestions: suggestedSkills,
        message: message,
        autoActivate: suggestedSkills.filter(s =>
          rules.skills[s]?.enforcement === 'auto'
        )
      };

      console.log(JSON.stringify(output));
    }
  } catch (error) {
    // Silent fail - don't interrupt user workflow
    console.error('Skill activation hook error:', error);
  }
}

main();
