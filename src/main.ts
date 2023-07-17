import * as core from '@actions/core'
import Codeowners from 'codeowners'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const filename = core.getInput('codewatchers-filename')
    core.debug(`Using ${filename} for setting assignees`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const watchers = new Codeowners(undefined, filename)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    core.debug(`Watchers: ${JSON.stringify((watchers as any).ownerEntries)}`)

    const githubToken = core.getInput('github-token', {required: true})
    const octokit = github.getOctokit(githubToken)

    const changedFiles = await octokit.rest.pulls.listFiles({
      ...github.context.repo,
      pull_number: github.context.issue.number,
      per_page: 100
    })
    core.debug(
      `Changed files: ${JSON.stringify(
        changedFiles.data.map(file => file.filename)
      )}`
    )

    const watchersForChangedFiles = changedFiles.data.flatMap(file =>
      watchers.getOwner(file.filename)
    )
    const uniqueWatchers = new Set(watchersForChangedFiles)
    core.debug(`Filtered watchers: ${JSON.stringify(uniqueWatchers)}`)

    // Set assignees
    const assignees = await octokit.rest.issues.listAssignees({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      per_page: 100
    })
    core.debug(
      `Current assignees: ${JSON.stringify(
        assignees.data.map(assignee => ({
          username: assignee.login,
          email: assignee.email
        }))
      )}`
    )

    const uniqueAssignees = assignees.data.filter(
      assignee => assignee.email != null && uniqueWatchers.has(assignee.email)
    )
    core.debug(`Filtered assignees: ${JSON.stringify(uniqueAssignees)}`)

    await octokit.rest.issues.addAssignees({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      assignees: uniqueAssignees.map(assignee => assignee.login)
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
