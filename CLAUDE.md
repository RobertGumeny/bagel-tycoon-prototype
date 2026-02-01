AGENT INSTRUCTIONS:

RESEARCH: Read bagel-tycoon-prd.md, project-state.yaml, and tasks.yaml. Identify the highest priority task from the EPIC in progress, or next EPIC in the backlog, that is not blocked. Create a new branch named after the epic you are working on (feature/BT-01) or the bugfix we are working on (fix/BUG-1). As soon as you create the new branch, pull from main to ensure we are up-to-date.

PLAN: If anything is unclear from your research step, ask clarifying questions before proceeding with the PLAN phase. Propose exactly how you will implement this task and list the files you will create or modify. Use this plan to guide you during the IMPLEMENT phase. You DO NOT need to get final permission to execute the plan if you do not have any clarifying questions.

IMPLEMENT: Execute the code according to your proposed plan. If there are any questions or unclear directives refer to the PRD (bagel-tycoon-prd.md). If that doesn't answer your question, use your best judgement and follow the best standards and practices available, noting your decision in the changelog or failure report.

REPORT:

- IF successful: Update project-state.yaml, mark task as DONE in tasks.yaml, and add entry to changelog.md. Keep the changelog items high level and do not include excessive details (exact stats, etc).

- IF failed (Maximum 5 attempts): Revert changes using Git and generate a FAILURE_REPORT.md explicitly outlining the task and epic that failed, your proposed plan and what you tried, and your assessment of why it is failing.
