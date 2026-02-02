# AGENT INSTRUCTIONS:

## RESEARCH:

### FOR FEATURES: Read bagel-tycoon-prd.md, project-state.yaml, and tasks.yaml. Identify the highest priority task from the EPIC in progress, or next EPIC in the backlog, that is not blocked. Create a new branch named after the task you are working on (e.g. feature/BT-01) or, if the assigned task is for an entire epic, name the branch after the epic (e.g. feature/EPIC-2). As soon as you create the new branch, pull from main to ensure we are up-to-date.

### FOR BUGFIXES: Read BUG_REPORT.md and reference project-state.yml or tasks.yml for more information about the task impacted by the bug. Create a new branch named after the bugfix we are working on (fix/BUG-1). As soon as you create the new branch, pull from main to ensure we are up-to-date.

## PLAN: If anything is unclear from your research step, ask clarifying questions before proceeding with the PLAN phase. Propose exactly how you will implement this task and list the files you will create or modify. Use this plan to guide you during the IMPLEMENT phase. You DO NOT need to get final permission to execute the plan if you do not have any clarifying questions.

## IMPLEMENT: Execute the code according to your proposed plan.

### FOR FEATURES: If there are any questions or unclear directives refer to the PRD (bagel-tycoon-prd.md). If that doesn't answer your question, use your best judgement and follow the best standards and practices available, noting your decision in the CHANGELOG or failure report.

### FOR BUGFIXES: If you have any questions or unclear directives refer to the bug report (BUG_REPORT.md). If that doesn't answer your question, use your best judgement and follow the best standards and practices available, noting your decision in the CHANGELOG or failure report.

## VERIFY

### FOR FEATURES: Ensure all new core functionality is unit tested and all test are passing. Ensure there are no linter errors or build errors or warnings.

### FOR BUGFIXES: Ensure all reported functionality from the bug report is fixed and regression tests are passing. Ensure there are no side effects and no new broken tests from any updated files. Ensure there are no linter errors or build errors or warnings.

## REPORT:

### FOR FEATURES: After successful verification of a feature implementation, take the following steps:

- IF SUCCESS: Update project-state.yaml, mark task as DONE in tasks.yaml, and add entry to CHANGELOG.md. Keep the CHANGELOG items high level and do not include excessive details (exact stats, etc). Commit and push the branch, but do not create a pull request.

- IF FAILURE (Maximum 5 attempts): Revert changes using Git and generate a FAILURE_REPORT.md explicitly outlining the task and epic that failed, your proposed plan and what you tried, and your assessment of why it is failing.

### FOR BUGFIXES:

- IF SUCCESS: Update project-state.yaml, adding the bug to recent_bugs. If there are more than 5 recent bugs, remove the oldest. Move and rename BUG_REPORT.md to `/logs/bugs/EPIC-NAME/BUG-ID_FailureType.md (eg. BUG-003_TypeMismatch.md). Add entry to CHANGELOG.md. Keep the CHANGELOG items high level and do not include excessive details (exact stats, etc). Commit and push the branch, but do not create a pull request.

- IF FAILURE (Maximum 5 attempts): Revert changes using Git and generate a FAILURE_REPORT.md explicitly outlining the bugfix and associated task that failed, your proposed plan and what you tried, and your assessment of why it is failing.

### EPIC COMPLETION CHECK:

Before declaring an epic complete or moving to a new epic, explicitly verify that all tasks in the current epic are marked DONE in tasks.yaml. If any task is TODO or IN_PROGRESS, the epic must be treated as incomplete regardless of memos or assumptions.

## FOR ALL TASKS AND STEPS:

- IF you encounter any bugs that directly impact your ability to complete a task, stop and generate a BUG_REPORT.md by copying BUG_REPORT_TEMPLATE.md and outlining what the bug was, where it was encountered, your assessment of the best fix, the impacted task, and any files that were impacted by the bug. To get the ID for the bug, look at recent_bugs in `project-state.yaml`.

- When building the project, always use npm run build. If that command fails continually, generate a FAILURE_REPORT.md.
