import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'

function getDownloadUrl(): string {
  switch (process.platform) {
    case 'win32':
      throw new Error('Windows is not supported')
    case 'darwin':
      throw new Error('MacOS is not supported')
    case 'linux':
      return '...'
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
  const cachedPath = tc.find('ripunzip', '1.1.0')
  if (cachedPath) {
    core.info(`Found in cache @ ${cachedPath}`)
    return cachedPath
  } else {
    return downloadAndCacheRipunzip()
  }
}
