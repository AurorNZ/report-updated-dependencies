import {parseConfigs, RenovateConfig} from 'renovate/dist/config'
import {setUtilConfig} from 'renovate/dist/util'
import {getRepositoryConfig} from 'renovate/dist/workers/global'
import {globalInitialize} from 'renovate/dist/workers/global/initialize'
import {initRepo} from 'renovate/dist/workers/repository/init'

export async function getRenovateConfig({
  token,
  owner,
  repo
}: {
  token: string
  owner: string
  repo: string
}): Promise<RenovateConfig> {
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
      'false',
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
  // otherwise renovate will only be able to work with branch with `renovate/` prefix
  globalConfig.branchPrefix = ''

  // this is necessary to get only one update from renovate, so we can just replace the latest version with the verion from the branch
  globalConfig.separateMajorMinor = false

  let config = await globalInitialize(globalConfig)

  config = await getRepositoryConfig(config, `${owner}/${repo}`)
  await setUtilConfig(config)

  return await initRepo(config)
}
