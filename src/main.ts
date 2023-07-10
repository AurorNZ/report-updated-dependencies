import './setupEnvToOverrideDefaultRenovateLogger'
import './setupLogger'
import * as core from '@actions/core'
import {context, getOctokit} from '@actions/github'
import {extractAllDependencies} from 'renovate/dist/workers/repository/extract'
import {fetchUpdates} from 'renovate/dist/workers/repository/process/fetch'
import {fetchChangelogs} from './fetchChangelogs'
import {commentTitle, getPrCommentBody} from './getPrCommentBody'
import {getRenovateConfig} from './getRenovateConfig'
import {getUpdatedDependencies} from './getUpdatedDependencies'
import {ensurePrCommentRemoved, upsertPrComment} from './updatePrComment'
import {getRunContext} from './getRunContext'
import fs from 'fs'

// Github actions can only run on Node 16
// but renovate requires Node 18
// adding a polyfill for onle of the functions that is missing
import structuredClone from '@ungap/structured-clone'
// eslint-disable-next-line no-undef
if (!('structuredClone' in globalThis)) {
  // eslint-disable-next-line no-undef
  globalThis.structuredClone = structuredClone
}

async function run(): Promise<void> {
  try {
    if (process.env.TRY_USE_TEST_CONTEXT) {
      useContextForTesting()
    }

    if (core.isDebug()) {
      outputGithubContextForTesting()
    }

    const {baseRef, headRef, pullRequestNumber, repo} = getRunContext()

    const token = core.getInput('token')

    core.info(`Configuring renovate`)

    const {config, git} = await getRenovateConfig({...repo, token})

    core.info(`Fetching ${headRef} from origin`)
    await git.fetch(['origin', '--depth=2', headRef])

    if (typeof pullRequestNumber === 'number') {
      core.info(
        `Not fetching baseRef ${baseRef} for PRs because the first parent will be used`
      )
    } else {
      core.info(`Fetching ${baseRef} from origin`)
      await git.fetch(['origin', '--depth=1', baseRef])
    }

    core.info(`Checking out PR base sha ${baseRef}`)
    await git.checkout(baseRef)

    core.info(`Looking for all dependencies in base`)
    const baseDependencies = await extractAllDependencies(config)

    core.info(`Fetching possible updates for all base ref dependencies`)
    await fetchUpdates(config, baseDependencies.packageFiles)

    core.info(`Checking out PR head sha ${headRef}`)
    await git.checkout(headRef)

    core.info(`Looking for all dependencies in head`)
    const headDependencies = await extractAllDependencies(config)

    let updatedDependencies = [
      ...getUpdatedDependencies(
        baseDependencies.packageFiles,
        headDependencies.packageFiles
      )
    ]

    const github = getOctokit(token)

    if (updatedDependencies.length > 0) {
      core.info(`Found ${updatedDependencies.length} updated dependencies`)
    } else {
      core.info(`No updated dependencies, exiting`)
      if (typeof pullRequestNumber === 'number') {
        await ensurePrCommentRemoved(
          github,
          repo,
          pullRequestNumber,
          commentTitle
        )
        return
      }

      return
    }

    const changelogs = core.getInput('changelogs') === 'true'

    if (typeof pullRequestNumber !== 'number') {
      return
    }

    if (changelogs) {
      core.info(`Fetching changelogs...`)
      updatedDependencies = await fetchChangelogs(config, updatedDependencies)
    }

    const commentBody = getPrCommentBody(updatedDependencies)

    core.info(`Ensuring the PR comment is up to date`)
    await upsertPrComment(
      github,
      repo,
      pullRequestNumber,
      commentTitle,
      commentBody
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    core.info(`Error stack: ${error.stack}`)
    core.setFailed(error.message)
  }
}

function outputGithubContextForTesting(): void {
  core.debug('ReportUpdatedDependencies context that can be used for testing:')
  core.debug(JSON.stringify(context, null, 2))
}

function useContextForTesting(): void {
  try {
    const content = fs.readFileSync('./test-context.json', {encoding: 'utf8'})
    const json = JSON.parse(content)
    for (const propName in context) {
      if (Object.hasOwn(json, propName)) {
        // @ts-expect-error typescript does not like it :)
        context[propName] = json[propName]
      }
    }
    core.info('Successfully load test-context.json')
  } catch (ex) {
    core.error('Failed to find or read test-context.json')
  }
}

run()
