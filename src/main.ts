import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'
import {addStream} from 'renovate/dist/logger'
import {extractAllDependencies} from 'renovate/dist/workers/repository/extract'
import {fetchUpdates} from 'renovate/dist/workers/repository/process/fetch'
import simpleGit from 'simple-git'
import {fetchChangelogs} from './fetchChangelogs'
import {commentTitle, getPrCommentBody} from './getPrCommentBody'
import {getRenovateConfig} from './getRenovateConfig'
import {getUpdatedDependencies} from './getUpdatedDependencies'
import {createGithubActionsBunyanStream} from './githubActionsBunyanStream'
import {upsertPrComment} from './upsertPrComment'

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
        number: pullRequestNumber,
        base: {sha: baseSha},
        head: {sha: headSha}
      }
    } = pullRequestPayload

    const token = core.getInput('token')

    core.debug(`Configuring renovate`)
    addStream(createGithubActionsBunyanStream())

    const config = await getRenovateConfig({...context.repo, token})
    const git = simpleGit(config.localDir)

    core.debug(`Checking out PR base sha ${baseSha}`)
    await git.checkout(baseSha)

    core.debug(`Looking for all dependencies in base`)
    const baseDependencies = await extractAllDependencies(config)

    core.debug(`Fetching possible updates for all base ref dependencies`)
    await fetchUpdates(config, baseDependencies)

    core.debug(`Checking out PR head sha ${headSha}`)
    await git.checkout(headSha)

    core.debug(`Looking for all dependencies in head`)
    const headDependencies = await extractAllDependencies(config)

    const updatedDependencies = [
      ...getUpdatedDependencies(baseDependencies, headDependencies)
    ]

    if (updatedDependencies.length > 0) {
      core.info(`Found ${updatedDependencies.length} updated dependencies`)
    } else {
      core.info(`No updated dependencies, exiting`)
      return
    }

    const updatedDependenciesWithChangelogs = await fetchChangelogs(
      config,
      updatedDependencies
    )
    const commentBody = getPrCommentBody(updatedDependenciesWithChangelogs)

    const github = getOctokit(token)

    await upsertPrComment(
      github,
      context.repo,
      pullRequestNumber,
      commentTitle,
      commentBody
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
