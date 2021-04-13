import {PackageDependency, PackageFile} from 'renovate/dist/manager/types'
import {UpdatedDependency} from './types'

export function* getUpdatedDependencies(
  baseDependencies: Record<string, PackageFile[]>,
  headDependencies: Record<string, PackageFile[]>
): IterableIterator<UpdatedDependency> {
  for (const managerName in baseDependencies) {
    const basePackageList = baseDependencies[managerName]
    const headPackageList = headDependencies[managerName]

    if (
      !headPackageList ||
      headPackageList.length === 0 ||
      basePackageList.length === 0
    ) {
      continue
    }

    for (const basePackage of basePackageList) {
      const headPackage = headPackageList.find(
        x => x.packageFile === basePackage.packageFile
      )

      if (!headPackage) {
        // the package seems to be removed from the head
        continue
      }

      for (const baseDependency of basePackage.deps) {
        const headDependency = headPackage.deps.find(
          x =>
            x.depName === baseDependency.depName &&
            x.depType === baseDependency.depType
        )

        if (!headDependency) {
          // the dependency seems to be removed from the head
          continue
        }

        if (!isSameVersion(baseDependency, headDependency)) {
          if (!baseDependency.updates || baseDependency.updates.length === 0) {
            continue
          }

          yield {
            manager: managerName,
            packageFile: basePackage,
            update: {
              newValue: headDependency.currentValue || '',
              newVersion:
                headDependency.lockedVersion || headDependency.currentValue
            },
            dependency: baseDependency
          }
        }
      }
    }
  }
}

function isSameVersion(
  a: PackageDependency<Record<string, unknown>>,
  b: PackageDependency<Record<string, unknown>>
): boolean {
  if (a.lockedVersion && b.lockedVersion) {
    return a.lockedVersion === b.lockedVersion
  }

  return a.currentValue === b.currentValue
}
