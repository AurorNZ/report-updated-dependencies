import './setupEnvToOverrideDefaultRenovateLogger'
import './setupLogger'
import * as core from '@actions/core'
import {getOctokit} from '@actions/github'
import {extractAllDependencies} from 'renovate/dist/workers/repository/extract'
import {fetchUpdates} from 'renovate/dist/workers/repository/process/fetch'
import {fetchChangelogs} from './fetchChangelogs'
import {commentTitle, getPrCommentBody} from './getPrCommentBody'
import {getRenovateConfig} from './getRenovateConfig'
import {getUpdatedDependencies} from './getUpdatedDependencies'
import {upsertPrComment} from './upsertPrComment'
import {getRunContext} from './getRunContext'

async function run(): Promise<void> {
  try {
    const {baseRef, headRef, pullRequestNumber, repo} = getRunContext()

    const token = core.getInput('token')

    core.info(`Configuring renovate`)

    const {config, git} = await getRenovateConfig({...repo, token})

    core.info(`Checking out PR base sha ${baseRef}`)
    await git.fetch(['origin', '--depth=1', baseRef])
    await git.checkout(baseRef)

    core.info(`Looking for all dependencies in base`)
    const baseDependencies = await extractAllDependencies(config)

    core.info(`Fetching possible updates for all base ref dependencies`)
    await fetchUpdates(config, baseDependencies)

    core.info(`Checking out PR head sha ${headRef}`)
    await git.fetch(['origin', '--depth=1', headRef])
    await git.checkout(headRef)

    core.info(`Looking for all dependencies in head`)
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

    if (typeof pullRequestNumber !== 'number') {
      return
    }
    core.info(`Fetching changelogs...`)

    const updatedDependenciesWithChangelogs = await fetchChangelogs(
      config,
      updatedDependencies
    )
    const commentBody = getPrCommentBody(updatedDependenciesWithChangelogs)

    const github = getOctokit(token)

    await upsertPrComment(
      github,
      repo,
      pullRequestNumber,
      commentTitle,
      commentBody
    )
  } catch (error) {
    core.info(`Error stack: ${error.stack}`)
    core.setFailed(error.message)
  }
}

run()
