import {getManagerConfig} from 'renovate/dist/config'
import {RenovateConfig} from 'renovate/dist/config/types'
import {getChangeLogJSON} from 'renovate/dist/workers/repository/update/pr/changelog'
import type {UpdatedDependency} from './types'
import type {BranchUpgradeConfig} from 'renovate/dist/workers/types'

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
    } as BranchUpgradeConfig)

    result.push({...updatedDependency, changelog: logJSON ?? undefined})
  }

  return result
}
