import {getManagerConfig, RenovateConfig} from 'renovate/dist/config'
import {getChangeLogJSON} from 'renovate/dist/workers/pr/changelog'
import type {UpdatedDependency} from './types'

export async function fetchChangelogs(
  config: RenovateConfig,
  dependencies: UpdatedDependency[]
): Promise<UpdatedDependency[]> {
  const result: UpdatedDependency[] = []
  for (const updatedDependency of dependencies) {
    const {dependency, update, manager} = updatedDependency
    const logJSON = await getChangeLogJSON({
      branchName: '',
      ...getManagerConfig(config, manager),
      ...dependency,
      ...update
    })

    result.push({...updatedDependency, changelog: logJSON ?? undefined})
  }

  return result
}
