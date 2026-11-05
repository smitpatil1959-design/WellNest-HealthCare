export function describeBrowser(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  return 'Browser';
}

export function describePlatform(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent) {
  if (/iPhone|iPad/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Mac OS X/.test(userAgent)) return 'macOS';
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Unknown device';
}

export function describeDevice() {
  return `${describeBrowser()} on ${describePlatform()}`;
}
