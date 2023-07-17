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
    const uniqueWatchers = [...new Set(watchersForChangedFiles)]
    core.debug(`Filtered watchers: ${JSON.stringify(uniqueWatchers)}`)

    // Set assignees
    const mappings = new Map(
      core
        .getMultilineInput('github-user-mappings')
        .map(line => line.split(':') as [string, undefined])
    )
    core.debug(`Mappings: ${JSON.stringify(Object.fromEntries(mappings))}`)

    const mappedAssignees = uniqueWatchers.map(
      watcher => mappings.get(watcher) ?? watcher
    )
    core.debug(`Mapped assignees: ${JSON.stringify(mappedAssignees)}`)

    await octokit.rest.issues.addAssignees({
      ...github.context.repo,
      issue_number: github.context.issue.number,
      assignees: mappedAssignees
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
