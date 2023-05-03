import {
  LookupUpdate,
  PackageDependency,
  PackageFile
} from 'renovate/dist/modules/manager/types'
import {ChangeLogResult} from 'renovate/dist/workers/repository/update/pr/changelog'

export interface UpdatedDependency {
  manager: string
  packageFile: PackageFile
  dependency: PackageDependency<Record<string, unknown>>
  update: LookupUpdate
  changelog?: ChangeLogResult
}
