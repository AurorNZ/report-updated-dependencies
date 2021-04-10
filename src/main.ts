import * as core from '@actions/core'
import {context} from '@actions/github'
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'
import {addStream} from 'renovate/dist/logger'
import {extractAllDependencies} from 'renovate/dist/workers/repository/extract'
import {fetchUpdates} from 'renovate/dist/workers/repository/process/fetch'
import simpleGit from 'simple-git'
import {getRenovateConfig} from './getRenovateConfig'
import {getUpdatedDependencies} from './getUpdatedDependencies'
import {createGithubActionsBunyanStream} from './githubActionsBunyanStream'

async function run(): Promise<void> {
  try {
    if (context.eventName !== 'pull_request') {
      throw new Error(
        'The action can out run on pull_request workflow events. Please ensure your workflow is only triggered by pull_request events or run this action conditionally.'
      )
    }

    const pullRequestPayload = context.payload as PullRequestEvent

    const {
      pull_request: {
        base: {sha: baseSha},
        head: {sha: headSha}
      }
    } = pullRequestPayload
    const token = core.getInput('token')

    core.info(`Configuring renovate`)
    addStream(createGithubActionsBunyanStream())

    const config = await getRenovateConfig({token})
    const git = simpleGit(config.localDir)
    await git.fetch()

    core.info(`Checking out PR base sha ${baseSha}`)
    await git.checkout(baseSha)

    core.info(`Looking for all dependencies in base`)
    const baseDependencies = await extractAllDependencies(config)

    core.info(`Fetching possible updates for all base ref dependencies`)
    await fetchUpdates(config, baseDependencies)

    core.info(`Checking out PR head sha ${headSha}`)
    await git.checkout(headSha)

    core.info(`Looking for all dependencies in head`)
    const headDependencies = await extractAllDependencies(config)

    const updatedDependencies = [
      ...getUpdatedDependencies(baseDependencies, headDependencies)
    ]

    core.info(`Found ${updatedDependencies.length} updated dependencies`)

    // const github = getOctokit(token)

    // // const {data: pullRequest} = await github.pulls.get({
    // //   ...context.repo
    // // })

    // core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    // core.debug(new Date().toTimeString())
    // await wait(parseInt(ms, 10))
    // core.debug(new Date().toTimeString())

    // core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
