import {parseConfigs} from 'renovate/dist/workers/global/config/parse'
import {RenovateConfig} from 'renovate/dist/config/types'
import * as core from '@actions/core'
import {getRepositoryConfig} from 'renovate/dist/workers/global'
import {globalInitialize} from 'renovate/dist/workers/global/initialize'
import path from 'path'
import {initRepo} from 'renovate/dist/workers/repository/init'
import simpleGit from 'simple-git'

export async function getRenovateConfig({
  token,
  owner,
  repo
}: {
  token: string
  owner: string
  repo: string
}): Promise<{config: RenovateConfig; git: ReturnType<typeof simpleGit>}> {
  const globalConfig = await parseConfigs(
    {
      ...process.env,
      GITHUB_COM_TOKEN: token
    },
    [
      // this might prevent renovate from making changes to the repository
      '--dry-run',
      'true',
      // this prevents renovate from creating the onboarding branch
      '--onboarding',
      'false',
      // this prevents renovate from complaining that the onboarding branch does not exist
      '--require-config',
      'ignored',
      '--token',
      token
    ]
  )

  // not sure if it's necessary, but it probably is, renovate uses this setting to use the locked version as the current version
  globalConfig.rangeStrategy = 'update-lockfile'
  // username and gitAuthor are only necessary for writing data, we only use Renovate to read data
  globalConfig.gitAuthor =
    'github-actions <41898282+github-actions[bot]@users.noreply.github.com>'
  globalConfig.username = 'github-actions[bot]'

  // this is necessary to get only one update from renovate, so we can just replace the latest version with the verion from the branch
  globalConfig.separateMajorMinor = false

  let config = await globalInitialize(globalConfig)
  config = await getRepositoryConfig(config, `${owner}/${repo}`)

  let githubWorkspacePath = process.env['GITHUB_WORKSPACE']
  core.debug(`GITHUB_WORKSPACE = '${githubWorkspacePath}'`)

  if (githubWorkspacePath) {
    githubWorkspacePath = path.resolve(githubWorkspacePath)
    const repositoryPathInput = core.getInput('path') || '.'
    const repositoryPath = path.resolve(
      githubWorkspacePath,
      repositoryPathInput
    )

    core.debug(`REPOSITORY_PATH = '${repositoryPath}'`)
    config.localDir = repositoryPath
  }

  const git = simpleGit(config.localDir)

  // otherwise initRepo fails
  if (githubWorkspacePath) {
    await git.fetch(['--depth=1'])
    await git.remote(['set-head', 'origin', '--auto'])
  }

  config = await initRepo(config)

  return {config, git}
}
