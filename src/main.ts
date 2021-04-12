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
    const {baseSha, headSha, pullRequestNumber, repo} = getRunContext()

    const token = core.getInput('token')

    core.debug(`Configuring renovate`)

    const {config, git} = await getRenovateConfig({...repo, token})

    core.debug(`Checking out PR base sha ${baseSha}`)
    await git.fetch(['origin', '--depth=1', baseSha])
    await git.checkout(baseSha)

    core.debug(`Looking for all dependencies in base`)
    const baseDependencies = await extractAllDependencies(config)

    core.debug(`Fetching possible updates for all base ref dependencies`)
    await fetchUpdates(config, baseDependencies)

    core.debug(`Checking out PR head sha ${headSha}`)
    await git.fetch(['origin', '--depth=1', headSha])
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
    core.debug(`Error stack: ${error.stack}`)
    core.setFailed(error.message)
  }
}

run()
