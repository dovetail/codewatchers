import * as core from '@actions/core'
import Codeowners from 'codeowners'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const filename = core.getInput('codewatchers-filename')
    core.debug(`Using ${filename} for setting assignees`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const watchers = new Codeowners(undefined, filename)

    const githubToken = core.getInput('github-token', {required: true})
    const octokit = github.getOctokit(githubToken)

    const changedFiles = await octokit.rest.pulls.listFiles({
      ...github.context.repo,
      pull_number: github.context.issue.number
    })
    core.debug(
      `Changed files: ${JSON.stringify(
        changedFiles.data.map(file => file.filename)
      )}`
    )

    const watchersForChangedFiles = changedFiles.data.flatMap(file =>
      watchers.getOwner(file.filename)
    )
    const uniqueWatchers = [...new Set(watchersForChangedFiles)]
    core.debug(`Watchers: ${JSON.stringify(uniqueWatchers)}`)

    // Set assignees
    await octokit.rest.issues.addAssignees({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      assignees: uniqueWatchers
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
