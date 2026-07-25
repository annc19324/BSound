export function getImageUrl(url: string | undefined | null, width: number = 400): string {
  if (!url) return '/bsound.png';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // avoid double transformation if already present
    if (url.match(/\/upload\/c_fill/)) return url;
    return url.replace('/upload/', `/upload/c_fill,w_${width},q_auto,f_auto/`);
  }
  return url;
}
