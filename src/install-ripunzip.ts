import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'

function getDownloadUrl(): string {
  switch (process.platform) {
    case 'win32':
      return 'https://github.com/criemen/fast-artifact-download/releases/download/ripunzip/ripunzip-win-amd64.exe'
    case 'darwin':
      return 'https://github.com/criemen/fast-artifact-download/releases/download/ripunzip/ripunzip-macos'
    case 'linux':
      return 'https://github.com/criemen/fast-artifact-download/releases/download/ripunzip/ripunzip-linux-amd64'
    default:
      throw new Error('Unsupported platform')
  }
}

export async function downloadAndCacheRipunzip(): Promise<string> {
  const url = getDownloadUrl()
  const downloadPath = await tc.downloadTool(url)
  const cachedPath = await tc.cacheFile(
    downloadPath,
    'ripunzip',
    'ripunzip',
    '1.1.0'
  )
  return cachedPath
}

export async function getRipunzip(): Promise<string> {
  core.startGroup('Acquiring ripunzip')
  const cachedPath = tc.find('ripunzip', '1.1.0')
  try {
    if (cachedPath) {
      core.info(`Found in cache @ ${cachedPath}`)
      return cachedPath
    } else {
      return downloadAndCacheRipunzip()
    }
  } finally {
    core.endGroup()
  }
}
