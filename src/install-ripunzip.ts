import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'
import { join } from 'path'

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
  core.info(`Downloading ripunzip from ${url}`)
  const downloadPath = await tc.downloadTool(url)
  const cachedPath = await tc.cacheFile(
    downloadPath,
    'ripunzip',
    'ripunzip',
    '1.1.0'
  )
  core.info(`Cached ripunzip @ ${cachedPath}`)
  return cachedPath
}

export async function getRipunzip(): Promise<string> {
  core.startGroup('Acquiring ripunzip')
  let cachedPath = tc.find('ripunzip', '1.1.0')
  try {
    if (cachedPath) {
      core.info(`Found in cache @ ${cachedPath}`)
    } else {
      cachedPath = await downloadAndCacheRipunzip()
    }
    return join(cachedPath, 'ripunzip')
  } finally {
    core.endGroup()
  }
}
